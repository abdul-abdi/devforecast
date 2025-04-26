'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GitHubProjectData, AiInsightData, CombinedWeatherData } from '@/types';

interface AiInsightProps {
  weatherData?: CombinedWeatherData | null;
  project?: GitHubProjectData | null;
}

export default function AiInsight({ weatherData, project }: AiInsightProps) {
  const [insightData, setInsightData] = useState<AiInsightData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isProjectSpecificMode = !!project;

  const generateInsight = useCallback(async () => {
    const canGenerateGlobal = !!weatherData?.current;
    const canGenerateProjectSpecific = !!project;

    if (!canGenerateGlobal && !canGenerateProjectSpecific) {
      setError(isProjectSpecificMode
        ? 'Project data is required to generate an insight.'
        : 'Weather data is required to generate an insight.');
      setInsightData(null);
      return;
    }

    setLoading(true);
    setError(null);
    setInsightData(null);

    try {
      const requestBody = isProjectSpecificMode
        ? { project }
        : { weatherData: weatherData?.current };

      if (!isProjectSpecificMode && !requestBody.weatherData) {
        throw new Error("Current weather data is missing for AI insight.");
      }

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to generate AI insight');
      }

      setInsightData(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while generating AI insight';
      setError(message);
      console.error('Gemini API error:', err);
    } finally {
      setLoading(false);
    }
  }, [isProjectSpecificMode, project, weatherData]);

  useEffect(() => {
    if (isProjectSpecificMode && project) {
      generateInsight();
    } else if (!isProjectSpecificMode && weatherData?.current) {
      generateInsight();
    } else {
      setInsightData(null);
    }
  }, [generateInsight, isProjectSpecificMode, project, weatherData]);

  const canAttemptGeneration = isProjectSpecificMode ? !!project : !!weatherData?.current;

  return (
    <div className="w-full">
      {!isProjectSpecificMode && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold">AI Insight</h3>
          </div>
          {canAttemptGeneration && (
            <Button
              variant="ghost"
              size="icon"
              onClick={generateInsight}
              disabled={loading}
              title="Generate new insight"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <Skeleton className="h-16 w-full" />
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Error Generating Insight</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : insightData ? (
        <Alert className={isProjectSpecificMode ? "border-purple-200 dark:border-purple-800" : ""}>
          {!isProjectSpecificMode && (
             <AlertTitle className="flex items-center gap-2">
               <Sparkles className="h-4 w-4 text-purple-500" />
               DevForecast Insight
             </AlertTitle>
          )}
          <AlertDescription className={isProjectSpecificMode ? "pt-2" : "mt-2"}>
            {insightData.message}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="text-center">
            {isProjectSpecificMode ? (
                <AlertDescription>Loading insight for this project...</AlertDescription>
            ) : (
                <AlertDescription>
                    {weatherData?.current
                        ? 'Generating insight based on weather...'
                        : 'Enter a city to get weather and AI insight'}
                </AlertDescription>
            )}
        </Alert>
      )}
    </div>
  );
}
