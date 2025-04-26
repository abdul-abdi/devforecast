// Weather data types
export interface WeatherData {
  name: string;
  main: {
    temp: number;
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
  sys: {
    country: string;
  };
  wind: {
    speed: number;
  };
  timezone: number;
}

// Daily forecast data types (from OpenWeatherMap One Call API)
export interface DailyForecastData {
  dt: number; // Timestamp
  sunrise: number;
  sunset: number;
  moonrise: number;
  moonset: number;
  moon_phase: number;
  summary: string;
  temp: {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
  };
  feels_like: {
    day: number;
    night: number;
    eve: number;
    morn: number;
  };
  pressure: number;
  humidity: number;
  dew_point: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number; // Optional
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  clouds: number;
  pop: number; // Probability of precipitation
  uvi: number;
  rain?: number; // Optional, volume in mm
  snow?: number; // Optional, volume in mm
}

// Combined type for the API response
export interface CombinedWeatherData {
  current: WeatherData; // Current weather details
  forecast: {
    daily: DailyForecastData[]; // Processed daily summaries
    timezone_offset: number; // Timezone offset in seconds from UTC
    // Note: Other fields from OneCall API (like lat, lon, full timezone string)
    // are no longer directly included here as they come from different parts
    // of the raw /forecast response (rawForecastData.city)
  };
}

// GitHub project data types
export interface GitHubProjectData {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
  avatar_url: string;
}

// AI insight data type
export interface AiInsightData {
  message: string;
}
