'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'devforecast_onboarding_dismissed';

export default function OnboardingTip() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the tip was dismissed before
    const dismissed = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Alert className="mt-6 relative max-w-2xl mx-auto border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20">
      <Button 
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss tip</span>
      </Button>
      <AlertTitle className="text-blue-800 dark:text-blue-300">Quick Tip!</AlertTitle>
      <AlertDescription className="text-blue-700 dark:text-blue-400">
        Use the fields above to enter a city for weather and refresh the GitHub projects. 
        AI insights will update based on the data shown!
      </AlertDescription>
    </Alert>
  );
} 