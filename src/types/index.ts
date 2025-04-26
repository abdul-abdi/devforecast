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
