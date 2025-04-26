'use client';

import { useState, useEffect, useCallback } from 'react';
import { Cloud, CloudRain, Sun, Snowflake, Wind, Search, Droplet, Gauge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DailyForecastData, CombinedWeatherData } from '@/types';
import { Separator } from '@/components/ui/separator';

interface WeatherDisplayProps {
  onWeatherDataChange: (data: CombinedWeatherData) => void;
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

export default function WeatherDisplay({ onWeatherDataChange }: WeatherDisplayProps) {
  const [city, setCity] = useState<string>('London');
  // State for the full combined data
  const [combinedData, setCombinedData] = useState<CombinedWeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Extract current weather and forecast for easier use
  const currentWeatherData = combinedData?.current;
  const forecastData = combinedData?.forecast;

  const fetchWeatherData = useCallback(async (cityName?: string) => {
    const targetCity = cityName || city;
    if (!targetCity.trim()) {
      setError('Please enter a city name');
      return;
    }

    setLoading(true);
    setError(null);
    setCombinedData(null); // Clear old data

    try {
      // Fetch combined data from our backend
      const response = await fetch(`/api/weather?city=${encodeURIComponent(targetCity)}&units=metric`);
      
      // Check if the response was successful BEFORE parsing as CombinedWeatherData
      if (!response.ok) {
        let errorDetails = `Server error ${response.status}`;
        try {
          // Attempt to parse error response from backend API
          const errorData = await response.json(); 
          errorDetails = errorData?.details || errorData?.error || errorDetails;
        } catch (parseError) {
          // If parsing error JSON fails, stick with the status code
          console.error("Failed to parse error response JSON:", parseError);
        }
        throw new Error(errorDetails); 
      }

      // If response is ok, parse the successful data structure
      const data: CombinedWeatherData = await response.json(); // Expect CombinedWeatherData

      setCombinedData(data); // Store the combined data
      onWeatherDataChange(data); // Pass combined data up
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while fetching weather data';
      setError(message);
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  // Update dependency: onWeatherDataChange might change if parent re-renders
  }, [city, onWeatherDataChange]); // Add city back as dependency as it's used in the fetch logic

  useEffect(() => {
    fetchWeatherData('London');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Keep this effect running only on mount

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchWeatherData(city); 
    }
  };

  // Use currentWeatherData for the main icon
  const getMainWeatherIcon = () => {
    if (!currentWeatherData) return <Cloud className="h-12 w-12 text-blue-500" />;
    const iconCode = currentWeatherData.weather[0].icon;
    return getWeatherIconComponent(iconCode, "h-12 w-12");
  };

  return (
    <Card className="w-full flex flex-col h-full"> {/* Ensure card takes full height */}
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Weather Forecast</span>
          {currentWeatherData && getMainWeatherIcon()} {/* Use current data icon */}
        </CardTitle>
        <div className="flex gap-2">
          <Input
            placeholder="Enter city name..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <Button onClick={() => fetchWeatherData(city)} disabled={loading}>
            {loading ? 'Loading...' : <Search className="h-4 w-4" />}
          </Button>
        </div>
        {error && (
          <div className="text-sm text-red-500 mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow"> {/* Allow content to grow */}
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full mt-4" /> {/* Skeleton for forecast */}
          </div>
        ) : currentWeatherData ? (
          <div className="space-y-2">
            {/* Current Weather Section */}
            <h3 className="text-2xl font-bold">
              {currentWeatherData.name}, {currentWeatherData.sys.country}
            </h3>
            <p className="text-sm text-muted-foreground -mt-1 mb-1">
                {/* Use timezone offset from forecast if available, else from current */}
                Local Time: {getLocalTime(forecastData?.timezone_offset ?? currentWeatherData.timezone)}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-4xl font-bold">{Math.round(currentWeatherData.main.temp)}°C</p>
              <p className="text-lg capitalize">{currentWeatherData.weather[0].description}</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1 pb-3"> 
              <p>Feels like {Math.round(currentWeatherData.main.feels_like)}°C</p>
              <p className="flex items-center"><Droplet className="h-4 w-4 mr-1" /> Humidity: {currentWeatherData.main.humidity}%</p>
              <p className="flex items-center"><Wind className="h-4 w-4 mr-1" /> Wind: {currentWeatherData.wind.speed} m/s</p>
              <p className="flex items-center"><Gauge className="h-4 w-4 mr-1" /> Pressure: {currentWeatherData.main.pressure} hPa</p>
            </div>

            {/* Weekly Forecast Section */}
            {forecastData?.daily && (
              <>
                <Separator className="my-4" />
                <h4 className="text-md font-semibold mb-2">7-Day Forecast</h4>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center text-sm">
                  {/* Display next 7 days (index 1 to 7) */}
                  {forecastData.daily.slice(1, 8).map((day: DailyForecastData, index: number) => (
                    <div key={index} className="flex flex-col items-center p-1 rounded-md bg-muted/30">
                      <span className="font-medium text-muted-foreground">
                        {getDayName(day.dt, forecastData.timezone_offset)}
                      </span>
                      {getWeatherIconComponent(day.weather[0].icon, "h-6 w-6 my-1")}
                      <span className="font-semibold">
                        {Math.round(day.temp.max)}°
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(day.temp.min)}°
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-6">
            Enter a city name to get the current weather and forecast
          </p>
        )}
      </CardContent>
    </Card>
  );
}
