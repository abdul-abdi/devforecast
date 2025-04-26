import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Simple in-memory cache for weather data
// Key: city name, Value: { data, timestamp }
interface CacheEntry {
  data: unknown;
  timestamp: number;
}
const weatherCache: Record<string, CacheEntry> = {};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Weather API endpoint that fetches data from OpenWeatherMap
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
    const baseUrl = process.env.NEXT_PUBLIC_OPENWEATHERMAP_BASE_URL;

    if (!apiKey || apiKey === 'your_openweathermap_api_key') {
      return NextResponse.json(
        {
          error: 'OpenWeatherMap API key is not configured',
          details: 'Please set a valid API key in your .env.local file'
        },
        { status: 500 }
      );
    }

    try {
      const response = await axios.get(
        `${baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${units}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          validateStatus: (status) => status < 500 // Don't throw for 4xx errors
        }
      );

      // Handle specific error cases
      if (response.status === 401) {
        console.error('OpenWeatherMap API key is invalid or not activated yet');
        return NextResponse.json(
          {
            error: 'Invalid API key',
            details: 'The API key is invalid or not activated yet. It may take up to 2 hours after registration to activate.'
          },
          { status: 401 }
        );
      }

      if (response.status === 404) {
        return NextResponse.json(
          {
            error: 'City not found',
            details: `Could not find weather data for "${city}"`
          },
          { status: 404 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          {
            error: 'Too many requests',
            details: 'You have exceeded the API rate limit'
          },
          { status: 429 }
        );
      }

      if (response.status !== 200) {
        return NextResponse.json(
          {
            error: 'OpenWeatherMap API error',
            details: response.data.message || 'Unknown error'
          },
          { status: response.status }
        );
      }

      // Cache the successful response
      weatherCache[cacheKey] = {
        data: response.data,
        timestamp: now
      };

      return NextResponse.json(response.data);
    } catch (axiosError: unknown) {
      // Handle network errors or other axios-specific errors
      console.error('Axios error fetching weather:', axiosError instanceof Error ? axiosError.message : axiosError);
      // Re-throw to be caught by outer try/catch
      // Consider wrapping in a new error for better context if needed
      throw new Error(`Axios failed to fetch weather: ${axiosError instanceof Error ? axiosError.message : 'Unknown Axios error'}`);
    }
  } catch (error: unknown) {
    const errorMessage = 'Failed to fetch weather data';
    let errorDetails = 'An unknown error occurred';
    let errorStatus = 500;

    // Attempt to extract details from AxiosError if possible
    if (axios.isAxiosError(error) && error.response) {
        console.error('Weather API Axios error:', error.response.data || error.message);
        errorDetails = error.response.data?.message || error.message;
        errorStatus = error.response.status;
    } else if (error instanceof Error) {
        console.error('Weather API general error:', error.message);
        errorDetails = error.message;
    } else {
        console.error('Weather API unknown error:', error);
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
