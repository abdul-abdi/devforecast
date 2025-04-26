import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { DailyForecastData } from '@/types'; // Import DailyForecastData

// Type for the raw 3-hour forecast item from OWM /forecast response
interface ThreeHourForecastItem {
  dt: number;
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  clouds: {
    all: number;
  };
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  pop: number; // Probability of precipitation
  dt_txt: string; // Textual timestamp e.g., "2024-01-01 12:00:00"
  rain?: { '3h'?: number };
  snow?: { '3h'?: number };
}

// Type for the full OWM /forecast response
interface RawForecastResponse {
  cod: string;
  message: number | string;
  cnt: number;
  list: ThreeHourForecastItem[];
  city: {
    id: number;
    name: string;
    coord: { lat: number; lon: number };
    country: string;
    population: number;
    timezone: number; // Shift in seconds from UTC
    sunrise: number;
    sunset: number;
  };
}

// Type for the OWM /weather response (Current Weather)
interface CurrentWeatherData {
  coord: { lon: number; lat: number };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  rain?: { '1h'?: number };
  snow?: { '1h'?: number };
  clouds: { all: number };
  dt: number;
  sys: {
    type?: number;
    id?: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}


// Adjusted combined type - forecast structure will be simplified
interface CombinedWeatherData {
  current: CurrentWeatherData; // Use the defined type
  forecast: { // Use a simplified forecast structure based on processed data
    daily: DailyForecastData[]; // Array of processed daily summaries
    timezone_offset: number; // Keep timezone offset from forecast city data
  };
}

interface CacheEntry {
  data: CombinedWeatherData;
  timestamp: number;
}
const weatherCache: Record<string, CacheEntry> = {};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Processes the 3-hour forecast list into a daily summary.
 */
function processForecastList(list: ThreeHourForecastItem[], timezoneOffset: number): DailyForecastData[] {
  const dailyData: Record<string, { temps: number[], weatherIcons: string[], pops: number[], dt: number }> = {};

  list.forEach(item => {
    // Calculate the date string based on the forecast timestamp and timezone offset
    const date = new Date((item.dt + timezoneOffset) * 1000);
    // Use UTC date parts to avoid local timezone interference when grouping
    const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { temps: [], weatherIcons: [], pops: [], dt: 0 };
      // Store the timestamp for the first entry of the day (usually noon or earliest)
      // We'll use the noon timestamp if available for consistency, otherwise the first one
      const hour = date.getUTCHours();
       if (hour >= 11 && hour <= 13) {
          dailyData[dateKey].dt = item.dt;
       } else if (dailyData[dateKey].dt === 0) {
           dailyData[dateKey].dt = item.dt;
       }
    }

    dailyData[dateKey].temps.push(item.main.temp);
    dailyData[dateKey].weatherIcons.push(item.weather[0].icon);
    dailyData[dateKey].pops.push(item.pop);
  });

  // Find the most frequent weather icon for the day
  const getMostFrequentIcon = (icons: string[]): string => {
    if (!icons.length) return '01d'; // Default to sun icon
    const frequency: Record<string, number> = {};
    let maxFreq = 0;
    let mostFrequentIcon = icons[0];
    icons.forEach(icon => {
      // Ignore night icons for representative day icon (use day equivalent)
      const dayIcon = icon.replace('n', 'd');
      frequency[dayIcon] = (frequency[dayIcon] || 0) + 1;
      if (frequency[dayIcon] > maxFreq) {
        maxFreq = frequency[dayIcon];
        mostFrequentIcon = dayIcon;
      }
    });
    return mostFrequentIcon;
  };

  // Convert processed data into DailyForecastData array
  return Object.entries(dailyData)
    .map(([, data]) => { // Remove unused dateKey from destructured entry
      const minTemp = Math.min(...data.temps);
      const maxTemp = Math.max(...data.temps);
      const avgPop = data.pops.reduce((a, b) => a + b, 0) / data.pops.length;
      const mostFrequentIcon = getMostFrequentIcon(data.weatherIcons);

      // Find the original weather object corresponding to the most frequent icon
      // This is an approximation, ideally find the weather obj from the noon forecast
      const representativeWeather = list.find(item => item.weather[0].icon.replace('n','d') === mostFrequentIcon)?.weather[0]
                                   || list.find(item => item.dt === data.dt)?.weather[0] // Fallback to noon/first entry weather
                                   || { id: 800, main: 'Clear', description: 'clear sky', icon: mostFrequentIcon }; // Final fallback


      // Construct the DailyForecastData object - fill mandatory fields, leave others undefined/approximated
      // Note: This structure won't have all fields like OneCall (e.g., feels_like, detailed temp breakdown)
      const dailyForecast: Partial<DailyForecastData> = {
        dt: data.dt, // Use the stored representative timestamp
        temp: {
          min: minTemp,
          max: maxTemp,
          // These are approximations or placeholders as 3h data lacks this detail
          day: (minTemp + maxTemp) / 2,
          night: minTemp, // Approximation
          eve: maxTemp, // Approximation
          morn: minTemp // Approximation
        },
        weather: [{
            id: representativeWeather.id,
            main: representativeWeather.main,
            description: representativeWeather.description,
            icon: mostFrequentIcon // Use the derived most frequent day icon
        }],
        pop: avgPop,
        // Fields below are placeholders or missing from 3h forecast summary
        summary: representativeWeather.description, // Use description as summary
        pressure: list.find(item => item.dt === data.dt)?.main.pressure || 1015, // Approx
        humidity: list.find(item => item.dt === data.dt)?.main.humidity || 60, // Approx
        wind_speed: list.find(item => item.dt === data.dt)?.wind.speed || 0, // Approx
        wind_deg: list.find(item => item.dt === data.dt)?.wind.deg || 0, // Approx
        clouds: list.find(item => item.dt === data.dt)?.clouds.all || 0, // Approx
        // sunrise, sunset, moon phases, uvi etc. are not available per day in this endpoint's list
      };
      return dailyForecast as DailyForecastData; // Assert type after filling required fields
    })
    // Sort by date, just in case keys weren't processed in order
    .sort((a, b) => a.dt - b.dt)
    // OWM /forecast often gives today's remaining hours + 5 full days.
    // Slice to get the next 5 days starting from the *second* day if today is included.
    // Check if the first entry is today.
    .slice(0, 6); // Keep today + 5 days initially
}


/**
 * Weather API endpoint that fetches current weather and 5-day/3-hour forecast from OpenWeatherMap
 * Uses coordinates from current weather OR city name to fetch forecast
 * Implements caching, error handling, and proper API usage
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const units = searchParams.get('units') || 'metric'; // Default to metric units

    if (!city) {
      return NextResponse.json(
        { error: 'City parameter is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `${city}-${units}`;
    const now = Date.now();
    if (weatherCache[cacheKey] && (now - weatherCache[cacheKey].timestamp) < CACHE_DURATION) {
      console.log(`Using cached weather data for ${city}`);
      return NextResponse.json(weatherCache[cacheKey].data);
    }

    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_OPENWEATHERMAP_BASE_URL || 'https://api.openweathermap.org/data/2.5';

    if (!apiKey || apiKey === 'your_openweathermap_api_key') {
      return NextResponse.json(
        {
          error: 'OpenWeatherMap API key is not configured',
          details: 'Please set a valid API key in your .env.local file'
        },
        { status: 500 }
      );
    }

    let currentWeatherData: CurrentWeatherData; // Use the defined type
    let lat: number | undefined;
    let lon: number | undefined;

    // Step 1: Fetch Current Weather (still useful for current details and coords)
    try {
      console.log(`Fetching current weather for ${city}...`);
      const currentWeatherResponse = await axios.get(
        `${baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${units}`,
        {
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          validateStatus: (status) => status < 500
        }
      );

      if (currentWeatherResponse.status !== 200) {
        console.error(`Error fetching current weather (${currentWeatherResponse.status}):`, currentWeatherResponse.data);
        // Attempt to return error JSON from OWM
        return NextResponse.json(
           currentWeatherResponse.data || { error: `Failed to fetch current weather (${currentWeatherResponse.status})`, details: 'Unknown error' },
          { status: currentWeatherResponse.status }
        );
      }

      currentWeatherData = currentWeatherResponse.data;
      lat = currentWeatherData?.coord?.lat;
      lon = currentWeatherData?.coord?.lon;

      if (lat === undefined || lon === undefined) {
         console.warn('Could not extract coordinates from current weather data, will use city name for forecast.');
         // Don't error out, we can still try forecast by city name
      }

    } catch (axiosError: unknown) {
      console.error('Axios error fetching current weather:', axiosError instanceof Error ? axiosError.message : axiosError);
      if (axios.isAxiosError(axiosError) && !axiosError.response) {
         return NextResponse.json({ error: 'Network error fetching current weather', details: axiosError.message }, { status: 503 });
      }
      throw axiosError; // Re-throw other errors
    }


    // Step 2: Fetch 5-day/3-hour Forecast using Coordinates or City Name
    try {
      let forecastUrl: string;
      if (lat !== undefined && lon !== undefined) {
          console.log(`Fetching forecast using coordinates: lat=${lat}, lon=${lon}...`);
          forecastUrl = `${baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
      } else {
          console.log(`Fetching forecast using city name: ${city}...`);
          forecastUrl = `${baseUrl}/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${units}`;
      }


      const forecastResponse = await axios.get<RawForecastResponse>(forecastUrl, {
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        validateStatus: (status) => status < 500
      });

      if (forecastResponse.status !== 200) {
        console.error(`Error fetching forecast (${forecastResponse.status}):`, forecastResponse.data);
        // Attempt to return error JSON from OWM
        return NextResponse.json(
            forecastResponse.data || { error: `Failed to fetch forecast data (${forecastResponse.status})`, details: 'Unknown forecast error' },
            { status: forecastResponse.status }
        );
      }

      const rawForecastData = forecastResponse.data;

      // Process the 3-hour list into daily summaries
      const dailySummaries = processForecastList(rawForecastData.list, rawForecastData.city.timezone);

      // Filter out today's forecast if it only has partial data (e.g., fetched late in the day)
      // Let's keep it simple for now and just take the first 5 full days offered.
      const finalDailyForecast = dailySummaries.slice(0, 7); // Take up to 7 days shown (incl today)

      // Combine current weather and processed forecast data
      const combinedData: CombinedWeatherData = {
        current: currentWeatherData,
        forecast: {
            daily: finalDailyForecast, // Use the processed daily summaries
            timezone_offset: rawForecastData.city.timezone // Get offset from forecast data
        }
      };

      // Cache the successful combined response
      weatherCache[cacheKey] = {
        data: combinedData,
        timestamp: now
      };

      console.log(`Successfully fetched and combined weather data for ${city}`);
      return NextResponse.json(combinedData);

    } catch (axiosError: unknown) {
        console.error('Axios error fetching forecast:', axiosError instanceof Error ? axiosError.message : axiosError);
        if (axios.isAxiosError(axiosError) && !axiosError.response) {
             return NextResponse.json({ error: 'Network error fetching forecast data', details: axiosError.message }, { status: 503 });
        }
        throw axiosError;
    }

  } catch (error: unknown) {
    // Outer catch block remains largely the same
    const errorMessage = 'Failed to process weather request';
    let errorDetails = 'An unknown error occurred';
    let errorStatus = 500;

    if (axios.isAxiosError(error) && error.response) {
      console.error('Weather API Axios error (Outer Catch):', error.response.data || error.message);
      errorDetails = error.response.data?.message || error.message;
      errorStatus = error.response.status;
    } else if (error instanceof Error) {
      console.error('Weather API general error (Outer Catch):', error.message);
      errorDetails = error.message;
    } else {
      console.error('Weather API unknown error (Outer Catch):', error);
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails
      },
      { status: errorStatus }
    );
  }
}
