import { useState, useEffect, useCallback, useMemo } from 'react';
import { ClientCache, generateCacheKey, CACHE_DURATIONS } from './client-cache';
import { CombinedWeatherData, GitHubProjectData, AiInsightData } from '@/types';

// Type for fetcher function
type Fetcher<T> = () => Promise<T>;

// Generic hook for data fetching with cache
export function useDataFetcher<T>(
  key: string | null, 
  fetcher: Fetcher<T> | null, 
  cacheDuration: number = CACHE_DURATIONS.DEFAULT,
  dependencies: React.DependencyList = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (force: boolean = false) => {
    if (!key || !fetcher) {
      return;
    }

    // Check cache first unless force refresh
    if (!force && ClientCache.has(key)) {
      const cachedData = ClientCache.get<T>(key);
      if (cachedData) {
        setData(cachedData);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      ClientCache.set(key, result, cacheDuration);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error(`Error fetching data for ${key}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, cacheDuration]);

  // Execute fetch on mount and when dependencies change
  useEffect(() => {
    fetchData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, ...dependencies]);

  // Return data, loading state, error, and a refresh function
  return { data, isLoading, error, refresh: () => fetchData(true) };
}

// Weather data hook
export function useWeatherData(city: string, units: string = 'metric') {
  const shouldFetch = !!city.trim();
  const cacheKey = shouldFetch ? generateCacheKey('/api/weather', { city, units }) : null;
  
  const fetcher = useCallback(async () => {
    if (!shouldFetch) throw new Error('City is required');
    
    const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}&units=${units}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.details || errorData?.error || `Server error ${response.status}`);
    }
    
    return await response.json() as CombinedWeatherData;
  }, [city, units, shouldFetch]);
  
  return useDataFetcher<CombinedWeatherData>(
    cacheKey,
    shouldFetch ? fetcher : null,
    CACHE_DURATIONS.WEATHER,
    [city, units]
  );
}

// GitHub projects hook
export function useGitHubProjects(
  filter: string = 'all', 
  language?: string, 
  timeFilter: string = 'daily',
  topic?: string
) {
  // Memoize the params object to prevent unnecessary fetcher recreation
  const params = useMemo(() => (
    { filter, ...(language && { language }), ...(topic && { topic }), timeFilter }
  ), [filter, language, timeFilter, topic]);
  
  // Also memoize cacheKey to avoid regenerating if params haven't changed
  const cacheKey = useMemo(() => generateCacheKey('/api/github', params), [params]);
  
  const fetcher = useCallback(async () => {
    // Skip fetching if we're in 'bookmarked' mode as that uses local storage
    if (filter === 'bookmarked') {
      return [];
    }
    
    // Build query string
    const queryString = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
    
    const response = await fetch(`/api/github?${queryString}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.details || errorData?.error || `Server error ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [data] as GitHubProjectData[];
  }, [params, filter]);
  
  // Ensure we don't fetch when in bookmarked mode
  const shouldFetch = filter !== 'bookmarked';
  
  return useDataFetcher<GitHubProjectData[]>(
    shouldFetch ? cacheKey : null,
    shouldFetch ? fetcher : null,
    CACHE_DURATIONS.GITHUB,
    [filter, language, timeFilter, topic]
  );
}

// AI insight hook
export function useAiInsight(
  weatherData: CombinedWeatherData | null, 
  project: GitHubProjectData | null
) {
  const shouldFetch = !!weatherData?.current || !!project;
  const mode = project ? 'project' : 'weather';
  const identifier = project ? project.full_name : (weatherData?.current?.name || '');
  const cacheKey = shouldFetch ? generateCacheKey(`/api/gemini/${mode}`, { id: identifier }) : null;
  
  const [data, setData] = useState<AiInsightData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetcher = useCallback(async () => {
    if (!shouldFetch) throw new Error('Weather data or project is required');
    
    // Validate project data if in project mode
    if (project) {
      if (!project.name || !project.description) {
        throw new Error('Project name and description are required for project-specific insight');
      }
    }
    
    const requestBody = project ? { project } : { weatherData: weatherData?.current };
    
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.details || errorData?.error || `Server error ${response.status}`);
    }
    
    return await response.json() as AiInsightData;
  }, [shouldFetch, project, weatherData]);
  
  const fetchData = useCallback(async (force: boolean = false) => {
    if (!cacheKey || !fetcher) {
      return;
    }

    // Check cache first unless force refresh
    if (!force && ClientCache.has(cacheKey)) {
      const cachedData = ClientCache.get<AiInsightData>(cacheKey);
      if (cachedData) {
        setData(cachedData);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      ClientCache.set(cacheKey, result, CACHE_DURATIONS.AI_INSIGHT);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error(`Error fetching data for ${cacheKey}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, fetcher]);

  // Function to ask questions about repositories
  const askQuestion = useCallback(async (question: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gemini/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question, 
          repoName: project?.full_name || null
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.details || errorData?.error || `Server error ${response.status}`);
      }
      
      const result = await response.json() as AiInsightData;
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Error asking AI question:', err);
    } finally {
      setIsLoading(false);
    }
  }, [project]);
  
  // Execute fetch on mount and when dependencies change
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Return data, loading state, error, refresh function and askQuestion function
  return { data, isLoading, error, refresh: () => fetchData(true), askQuestion };
} 