'use client';

import { useState, useEffect, useCallback } from 'react';
import { Cloud, CloudRain, Sun, Snowflake, Wind, Search, Droplet, Gauge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { WeatherData } from '@/types';

interface WeatherDisplayProps {
  onWeatherDataChange: (data: WeatherData) => void;
}

// Helper function to calculate local time
const getLocalTime = (utcOffsetSeconds: number): string => {
  const now = new Date();
  const utcMilliseconds = now.getTime() + (now.getTimezoneOffset() * 60 * 1000); // Get current UTC time in ms
  const localMilliseconds = utcMilliseconds + (utcOffsetSeconds * 1000);
  const localDate = new Date(localMilliseconds);

  // Check if localDate is valid before formatting
  if (isNaN(localDate.getTime())) {
      console.error("Invalid date calculated for local time", { utcOffsetSeconds });
      return "--:--"; // Return placeholder for invalid date
  }
  
  return localDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function WeatherDisplay({ onWeatherDataChange }: WeatherDisplayProps) {
  const [city, setCity] = useState<string>('London');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Wrap fetchWeatherData in useCallback
  const fetchWeatherData = useCallback(async (cityName?: string) => {
    const targetCity = cityName || city;
    if (!targetCity.trim()) {
      setError('Please enter a city name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(targetCity)}&units=metric`);
      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases with user-friendly messages
        if (response.status === 401) {
          throw new Error('API key error: The OpenWeatherMap API key is invalid or not activated yet. It may take up to 2 hours after registration to activate.');
        } else if (response.status === 404) {
          throw new Error(`City not found: "${targetCity}" could not be found. Please check the spelling and try again.`);
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded: Too many requests to the weather API. Please try again later.');
        } else {
          throw new Error(data.details || 'Failed to fetch weather data');
        }
      }

      setWeatherData(data);
      onWeatherDataChange(data);
    } catch (err: unknown) { // Changed any to unknown
      const message = err instanceof Error ? err.message : 'An error occurred while fetching weather data';
      setError(message);
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
    // Add dependencies for useCallback
  }, [city, onWeatherDataChange]);

  useEffect(() => {
    fetchWeatherData('London');
    // Add fetchWeatherData to the dependency array
  }, [fetchWeatherData]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchWeatherData();
    }
  };

  // Function to get the appropriate weather icon
  const getWeatherIcon = () => {
    if (!weatherData) return <Cloud className="h-12 w-12 text-blue-500" />;

    const weatherCode = weatherData.weather[0].id;

    // Thunderstorm
    if (weatherCode >= 200 && weatherCode < 300) {
      return <CloudRain className="h-12 w-12 text-gray-500" />;
    }
    // Drizzle or Rain
    else if ((weatherCode >= 300 && weatherCode < 400) || (weatherCode >= 500 && weatherCode < 600)) {
      return <CloudRain className="h-12 w-12 text-blue-500" />;
    }
    // Snow
    else if (weatherCode >= 600 && weatherCode < 700) {
      return <Snowflake className="h-12 w-12 text-blue-200" />;
    }
    // Atmosphere (fog, mist, etc.)
    else if (weatherCode >= 700 && weatherCode < 800) {
      return <Wind className="h-12 w-12 text-gray-400" />;
    }
    // Clear
    else if (weatherCode === 800) {
      return <Sun className="h-12 w-12 text-yellow-500" />;
    }
    // Clouds
    else {
      return <Cloud className="h-12 w-12 text-gray-400" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Weather Forecast</span>
          {weatherData && getWeatherIcon()}
        </CardTitle>
        <div className="flex gap-2">
          <Input
            placeholder="Enter city name..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <Button onClick={() => fetchWeatherData()} disabled={loading}>
            {loading ? 'Loading...' : <Search className="h-4 w-4" />}
          </Button>
        </div>
        {error && (
          <div className="text-sm text-red-500 mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        ) : weatherData ? (
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">
              {weatherData.name}, {weatherData.sys.country}
            </h3>
            {/* Display Local Time */}
            <p className="text-sm text-muted-foreground -mt-1 mb-1">
                Local Time: {getLocalTime(weatherData.timezone)}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-4xl font-bold">{Math.round(weatherData.main.temp)}°C</p>
              <p className="text-lg capitalize">{weatherData.weather[0].description}</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1"> 
              <p>Feels like {Math.round(weatherData.main.feels_like)}°C</p>
              <p className="flex items-center"><Droplet className="h-4 w-4 mr-1" /> Humidity: {weatherData.main.humidity}%</p>
              <p className="flex items-center"><Wind className="h-4 w-4 mr-1" /> Wind: {weatherData.wind.speed} m/s</p>
              <p className="flex items-center"><Gauge className="h-4 w-4 mr-1" /> Pressure: {weatherData.main.pressure} hPa</p>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-6">
            Enter a city name to get the current weather
          </p>
        )}
      </CardContent>
    </Card>
  );
}
