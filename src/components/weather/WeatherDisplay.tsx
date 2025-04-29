'use client';

import { useState, useEffect, useCallback } from 'react';
import { Cloud, CloudRain, Sun, Snowflake, Wind, Search, Droplet, Gauge, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { /* DailyForecastData, */ CombinedWeatherData } from '@/types'; // Removed unused DailyForecastData
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeatherData } from '@/lib/api-hooks';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import AiInsight from '@/components/ai-insight/AiInsight';

// Define types for forecast data structures
interface WeatherItem {
  id: number;
  main: string;
  description: string;
  icon: string;
}

interface MainData {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  sea_level: number;
  grnd_level: number;
  humidity: number;
  temp_kf: number;
}

interface ForecastListItem {
  dt: number;
  main: MainData;
  weather: WeatherItem[];
  clouds: { all: number };
  wind: { speed: number; deg: number; gust?: number };
  visibility: number;
  pop: number;
  sys: { pod: string };
  dt_txt: string;
  rain?: { '3h': number };
  snow?: { '3h': number };
}

interface CityData {
  id: number;
  name: string;
  coord: { lat: number; lon: number };
  country: string;
  population: number;
  timezone: number;
  sunrise: number;
  sunset: number;
}

interface FiveDayForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: ForecastListItem[];
  city: CityData;
}

interface DailyForecastResponse {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: unknown;
  minutely?: unknown[];
  hourly: unknown[];
  daily: DailyForecastItem[];
}

interface DailyForecastItem {
  dt: number;
  sunrise: number;
  sunset: number;
  moonrise: number;
  moonset: number;
  moon_phase: number;
  summary?: string;
  temp: { day: number; min: number; max: number; night: number; eve: number; morn: number };
  feels_like: { day: number; night: number; eve: number; morn: number };
  pressure: number;
  humidity: number;
  dew_point: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: WeatherItem[];
  clouds: number;
  pop: number;
  uvi: number;
  rain?: number;
  snow?: number;
}

// Popular cities for quick selection
const POPULAR_CITIES = [
  'London', 'New York', 'Tokyo', 'Paris', 'Berlin', 'Sydney', 
  'Toronto', 'Singapore', 'Mumbai', 'Cairo', 'San Francisco'
];

interface WeatherDisplayProps {
  onWeatherDataChange: (data: CombinedWeatherData) => void;
  weatherData?: CombinedWeatherData | null;
}

// Helper function to get day name from timestamp
const getDayName = (timestamp: number, timezoneOffset: number): string => {
  const date = new Date((timestamp + timezoneOffset) * 1000);
  // Adjust for local timezone offset to get correct UTC day
  const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return utcDate.toLocaleDateString('en-US', { weekday: 'short' });
};

// Helper function to calculate local time (consider using timezoneOffset from forecast data)
const getLocalTime = (utcOffsetSeconds: number): string => {
  const now = new Date();
  const utcMilliseconds = now.getTime() + (now.getTimezoneOffset() * 60 * 1000); 
  const localMilliseconds = utcMilliseconds + (utcOffsetSeconds * 1000);
  const localDate = new Date(localMilliseconds);

  if (isNaN(localDate.getTime())) {
      console.error("Invalid date calculated for local time", { utcOffsetSeconds });
      return "--:--";
  }
  
  return localDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Helper to extract daily forecast data from the API response
 */
const getDailyForecast = (forecastData: FiveDayForecastResponse | DailyForecastResponse): DailyForecastItem[] => {
  // Check if we have the new API format with city and list (5-day forecast)
  if ((forecastData as FiveDayForecastResponse).city && (forecastData as FiveDayForecastResponse).list) {
    const fiveDayForecast = forecastData as FiveDayForecastResponse;
    const dailyData: DailyForecastItem[] = [];
    const processedDays = new Set<string>();
    
    fiveDayForecast.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      // Get the date part in UTC to consistently group by day
      const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString().split('T')[0];
      
      // Only take the first forecast entry for each day (often noon or early afternoon)
      if (!processedDays.has(day)) {
        processedDays.add(day);
        dailyData.push({
          dt: item.dt,
          sunrise: 0, // Not available in this format
          sunset: 0, // Not available in this format
          moonrise: 0, // Not available in this format
          moonset: 0, // Not available in this format
          moon_phase: 0, // Not available in this format
          temp: {
            day: item.main.temp, // Use temp for daily avg
            min: item.main.temp_min,
            max: item.main.temp_max,
            night: 0, // Not available
            eve: 0, // Not available
            morn: 0 // Not available
          },
          feels_like: { day: 0, night: 0, eve: 0, morn: 0 }, // Not easily available
          pressure: item.main.pressure,
          humidity: item.main.humidity,
          dew_point: 0, // Not available
          wind_speed: item.wind.speed,
          wind_deg: item.wind.deg,
          weather: item.weather,
          clouds: item.clouds.all,
          pop: item.pop,
          uvi: 0, // Not available
          rain: item.rain?.['3h'], // Rainfall in last 3 hours (if present)
          snow: item.snow?.['3h'], // Snowfall in last 3 hours (if present)
          summary: item.weather[0]?.description // Use main weather description
        } as DailyForecastItem); // Cast to ensure type compatibility
      }
    });
    
    return dailyData.slice(0, 5); // Return only the next 5 days
  }
  
  // If using the old API format with daily array (One Call API)
  if ((forecastData as DailyForecastResponse).daily) {
    return (forecastData as DailyForecastResponse).daily.slice(0, 5);
  }
  
  return []; // Return empty array if no valid format found
};

// Helper to get a simplified weather icon component based on OpenWeatherMap icon code
const getWeatherIconComponent = (iconCode: string, className: string = "h-6 w-6") => {
  // Map OWM icon codes to Lucide icons (simplified mapping)
  if (iconCode.startsWith('01')) return <Sun className={className} />; // Clear
  if (iconCode.startsWith('02')) return <Cloud className={className} />; // Few clouds
  if (iconCode.startsWith('03') || iconCode.startsWith('04')) return <Cloud className={className} />; // Scattered/Broken clouds
  if (iconCode.startsWith('09') || iconCode.startsWith('10')) return <CloudRain className={className} />; // Shower/Rain
  if (iconCode.startsWith('11')) return <CloudRain className={className} />; // Thunderstorm (using rain icon)
  if (iconCode.startsWith('13')) return <Snowflake className={className} />; // Snow
  if (iconCode.startsWith('50')) return <Wind className={className} />; // Mist (using wind icon)
  return <Cloud className={className} />; // Default
};

export default function WeatherDisplay({ onWeatherDataChange, weatherData }: WeatherDisplayProps) {
  const [city, setCity] = useState<string>('London');
  const [searchInput, setSearchInput] = useState<string>('');
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);
  const [recentCities, setRecentCities] = useState<string[]>([]);
  
  // Use our custom hook for weather data
  const { data: combinedData, isLoading, error, refresh } = useWeatherData(city);
  
  // Extract current weather and forecast for easier use
  const currentWeatherData = combinedData?.current;
  const forecastData = combinedData?.forecast;
  
  // Load recent cities from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('devforecast_recent_cities');
        if (stored) {
          setRecentCities(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Error loading recent cities:', e);
      }
    }
  }, []);
  
  // Add city to recent cities
  const addToRecentCities = useCallback((cityName: string) => {
    setRecentCities(prev => {
      const updated = [cityName, ...prev.filter(c => c !== cityName)].slice(0, 5);
      if (typeof window !== 'undefined') {
        localStorage.setItem('devforecast_recent_cities', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  // When data changes, notify parent
  useEffect(() => {
    if (combinedData) {
      onWeatherDataChange(combinedData);
    }
  }, [combinedData, onWeatherDataChange]);

  // Handle city selection and fetch data
  const handleCitySelect = useCallback((selectedCity: string) => {
    if (selectedCity && selectedCity.trim() !== '') {
      setCity(selectedCity);
      setSearchInput('');
      setPopoverOpen(false);
      addToRecentCities(selectedCity);
    }
  }, [addToRecentCities]);

  // Handle key press in search input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCitySelect(searchInput);
    }
  };

  // Filter cities based on search input
  const filteredCities = searchInput
    ? [...new Set([...POPULAR_CITIES, ...recentCities])].filter(c => 
        c.toLowerCase().includes(searchInput.toLowerCase()))
    : [...recentCities, ...POPULAR_CITIES.filter(c => !recentCities.includes(c))];

  // Use currentWeatherData for the main icon
  const getMainWeatherIcon = () => {
    if (!currentWeatherData) return <Cloud className="h-12 w-12 text-blue-500" />;
    const iconCode = currentWeatherData.weather[0].icon;
    return getWeatherIconComponent(iconCode, "h-12 w-12");
  };

  return (
    <Card className="w-full flex flex-col h-full shadow-lg border-opacity-80 hover:border-opacity-100 transition-all duration-300 backdrop-blur-sm overflow-hidden"> 
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-medium">Weather Forecast</span>
          {currentWeatherData && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-primary"
            >
              {getMainWeatherIcon()}
            </motion.div>
          )}
        </CardTitle>

        <div className="flex gap-2 mt-1">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <div className="flex-1 relative">
                <Input
                  placeholder="Enter city name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  className="w-full pr-10 focus-visible:ring-primary/30"
                />
                <MapPin className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[300px]" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search cities..." 
                  value={searchInput}
                  onValueChange={setSearchInput}
                />
                <CommandList className="max-h-[200px] overflow-auto">
                  <CommandEmpty>No cities found</CommandEmpty>
                  {recentCities.length > 0 && (
                    <CommandGroup heading="Recent">
                      {recentCities.map((city) => (
                        <CommandItem 
                          key={`recent-${city}`}
                          value={city}
                          onSelect={handleCitySelect}
                          className="hover:bg-accent/20"
                        >
                          <MapPin className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                          {city}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  <CommandGroup heading="Popular Cities">
                    {filteredCities
                      .filter(city => !recentCities.includes(city))
                      .map((city) => (
                        <CommandItem 
                          key={`popular-${city}`}
                          value={city}
                          onSelect={handleCitySelect}
                          className="hover:bg-accent/20"
                        >
                          <MapPin className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                          {city}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Button 
            disabled={isLoading} 
            onClick={() => handleCitySelect(searchInput)}
            className="shrink-0"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-4 pt-0 flex-1 flex flex-col">
        {isLoading ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-10 w-[100px]" />
              <Skeleton className="h-10 w-[60px]" />
            </div>
            <Skeleton className="h-24 w-full mb-4" />
            <div className="grid grid-cols-5 gap-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-6">
            <Cloud className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              {error === 'CITY_NOT_FOUND' 
                ? "City not found. Please try another location." 
                : "Unable to load weather data. Please try again later."}
            </p>
            <Button variant="outline" onClick={refresh} className="mt-2">
              Try Again
            </Button>
          </div>
        ) : currentWeatherData && forecastData ? (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={city} // Change key when city changes to trigger animation
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="mb-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold">{city}</h3>
                    <p className="text-xs text-muted-foreground">
                      {currentWeatherData.weather[0].description.charAt(0).toUpperCase() +
                        currentWeatherData.weather[0].description.slice(1)}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <p>Local time: {getLocalTime(forecastData.timezone_offset || 0)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">
                      {Math.round(currentWeatherData.main.temp)}°C
                    </span>
                    <div className="text-xs text-muted-foreground mt-0.5 space-x-2">
                      <span>Feels like: {Math.round(currentWeatherData.main.feels_like)}°C</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-secondary/40 backdrop-blur-sm rounded-md p-2 flex items-center gap-1.5">
                <Droplet className="h-3.5 w-3.5 text-blue-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Humidity</p>
                  <p className="text-sm font-medium">{currentWeatherData.main.humidity}%</p>
                </div>
              </div>
              <div className="bg-secondary/40 backdrop-blur-sm rounded-md p-2 flex items-center gap-1.5">
                <Wind className="h-3.5 w-3.5 text-teal-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Wind</p>
                  <p className="text-sm font-medium">{Math.round(currentWeatherData.wind.speed * 3.6)} km/h</p>
                </div>
              </div>
              <div className="bg-secondary/40 backdrop-blur-sm rounded-md p-2 flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5 text-amber-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Pressure</p>
                  <p className="text-sm font-medium">{currentWeatherData.main.pressure} hPa</p>
                </div>
              </div>
            </div>
            
            <div className="mb-3">
              <Separator className="my-2 bg-border/60" />
              <h4 className="text-xs font-medium mb-2 text-muted-foreground">Next 5 Days</h4>
              <div className="grid grid-cols-5 gap-1.5">
                {getDailyForecast(forecastData as unknown as FiveDayForecastResponse | DailyForecastResponse).map((day: DailyForecastItem, index: number) => (
                  <div
                    key={index}
                    className="flex flex-col items-center rounded-md bg-secondary/30 backdrop-blur-sm p-1.5 transition-colors hover:bg-secondary/50"
                  >
                    <span className="text-xs font-medium">{getDayName(day.dt, forecastData.timezone_offset || 0)}</span>
                    <div className="my-0.5 text-primary">{getWeatherIconComponent(day.weather[0].icon, "h-5 w-5")}</div>
                    <span className="text-xs font-medium">{Math.round(day.temp.max)}°</span>
                    <span className="text-[10px] text-muted-foreground">{Math.round(day.temp.min)}°</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* AI Insight Component */}
            <div className="mt-2">
              <AiInsight weatherData={weatherData} />
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
