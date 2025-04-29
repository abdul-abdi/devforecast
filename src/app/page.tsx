'use client';

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useTheme } from "next-themes";
import { /*Cloud, Github,*/ Moon, Sun } from 'lucide-react';
import { CombinedWeatherData } from '@/types';
import { Button } from "@/components/ui/button";
import Clock from '@/components/Clock';
import OnboardingTip from '@/components/OnboardingTip';
import { motion } from 'framer-motion';
import { ClientCache } from '@/lib/client-cache';

// Lazy load components for better initial loading performance
const WeatherDisplay = lazy(() => import('@/components/weather/WeatherDisplay'));
const GitHubProjectHighlight = lazy(() => import('@/components/github/GitHubProjectHighlight'));
const GitHubSearch = lazy(() => import('@/components/github/GitHubSearch'));
// const AiInsight = lazy(() => import('@/components/ai-insight/AiInsight'));
const FloatingPatterns = lazy(() => import('@/components/FloatingPatterns'));

// Define type for effect points
interface ImpactPoint {
  x: number;
  y: number;
  timestamp: number;
}

const FADE_DURATION = 2500; // milliseconds (2.5 seconds)

// Loading fallback component with skeleton animation
const ComponentLoader = () => (
  <div className="w-full h-full min-h-[300px] rounded-lg border border-border animate-pulse bg-muted/30 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

export default function Home() {
  const { setTheme, theme } = useTheme();
  const [weatherData, setWeatherData] = useState<CombinedWeatherData | null>(null);
  const [effects, setEffects] = useState<ImpactPoint[]>([]); // State for impact points
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null); // Ref to store animation frame ID
  const [hasVisited, setHasVisited] = useState<boolean>(false);

  // Function to handle clicks on the main container
  const handleBackgroundClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    // console.log('Background Clicked! Coords:', x, y); // Removed debug log
    setEffects(prevEffects => [...prevEffects, { x, y, timestamp: Date.now() }]); // Add timestamp
  }, []);

  // Check if user has visited before
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const visited = localStorage.getItem('devforecast_has_visited');
      setHasVisited(visited === 'true');
      localStorage.setItem('devforecast_has_visited', 'true');
    }
  }, []);

  // Clear the client cache when component mounts (once per session)
  useEffect(() => {
    const sessionCacheCleaned = sessionStorage.getItem('cache_cleaned_this_session');
    if (!sessionCacheCleaned) {
      // Remove expired items only, not everything
      ClientCache.cleanCache();
      sessionStorage.setItem('cache_cleaned_this_session', 'true');
    }
  }, []);

  // Refactored drawing logic with requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: true }); // Specify alpha for better performance
    if (!context) return;

    let lastTimestamp = 0;
    const THROTTLE_FPS = 30; // Limit to 30fps for better performance (instead of 60fps)
    const throttleInterval = 1000 / THROTTLE_FPS;

    const draw = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = timestamp - lastTimestamp;
      
      // Throttle frame rate to improve performance
      if (deltaTime < throttleInterval) {
        animationFrameId.current = requestAnimationFrame(draw);
        return;
      }
      
      lastTimestamp = timestamp;
      const now = Date.now();

      // Resize canvas (only if needed - consider moving to resize effect)
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
      }

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      const baseColor = theme === 'dark' ? '255, 255, 255' : '0, 0, 0';
      const baseOpacity = theme === 'dark' ? 0.6 : 0.5; // Reduced opacity values

      let hasActiveEffects = false;
      // Draw cracks for each effect, applying fade
      effects.forEach(point => {
        const age = now - point.timestamp;
        if (age > FADE_DURATION) {
          return; // Skip faded effects
        }
        hasActiveEffects = true;

        const currentOpacity = baseOpacity * (1 - age / FADE_DURATION);
        const numPrimaryCracks = 5 + Math.floor(Math.random() * 3); // Reduced from 7-10 to 5-7

        // Draw central shatter first
        context.fillStyle = `rgba(${baseColor}, ${currentOpacity * 0.8})`;
        context.beginPath();
        context.arc(point.x, point.y, 3 + Math.random() * 2, 0, Math.PI * 2); // Smaller center
        context.fill();

        // Draw jagged cracks radiating outwards
        for (let i = 0; i < numPrimaryCracks; i++) {
          const angle = (i / numPrimaryCracks) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
          const totalLength = 40 + Math.random() * 60; // Reduced from 50-150px to 40-100px
          const segments = 4 + Math.floor(Math.random() * 3); // Reduced from 5-9 to 4-6 segments
          const segmentLength = totalLength / segments;

          context.strokeStyle = `rgba(${baseColor}, ${currentOpacity})`;
          context.lineWidth = 1 + Math.random() * 1.5; // Thinner lines (1-2.5px)
          context.beginPath();
          context.moveTo(point.x, point.y);

          let currentX = point.x;
          let currentY = point.y;
          let currentAngle = angle;

          for (let j = 0; j < segments; j++) {
            // Add randomness to angle for jaggedness
            currentAngle += (Math.random() - 0.5) * 0.4; // Less deviation
            // Calculate segment end point
            const segEndX = currentX + Math.cos(currentAngle) * segmentLength;
            const segEndY = currentY + Math.sin(currentAngle) * segmentLength;
            context.lineTo(segEndX, segEndY);

            // Update current position for next segment
            currentX = segEndX;
            currentY = segEndY;

            // Removed branching cracks for better performance
          }
          context.stroke();
        }
      });

      // Only continue animating if there are active effects
      if (hasActiveEffects) {
        animationFrameId.current = requestAnimationFrame(draw);
      } else {
          animationFrameId.current = null; // Stop animation
      }
    };

    // Start the animation loop if there are effects
    if (effects.length > 0 && animationFrameId.current === null) {
        animationFrameId.current = requestAnimationFrame(draw);
    }

    // Cleanup function to cancel animation frame on unmount
    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };

  }, [effects, theme]); // Re-run setup if effects or theme changes

  // Effect to remove old effects from state
  useEffect(() => {
      const intervalId = setInterval(() => {
          const now = Date.now();
          setEffects(prevEffects => {
              const activeEffects = prevEffects.filter(e => now - e.timestamp <= FADE_DURATION);
              // Only update state if effects were actually removed
              if (activeEffects.length < prevEffects.length) {
                  // console.log(`Removed ${prevEffects.length - activeEffects.length} faded effects`); // Debug log
                  return activeEffects;
              }
              return prevEffects;
          });
      }, 1000); // Check every second

      return () => clearInterval(intervalId); // Cleanup interval
  }, []); // Run only once on mount

  // Handle window resize - simplified redraw trigger
   useEffect(() => {
    const handleResize = () => {
      // Restart animation loop on resize to handle canvas clear/redraw
      setEffects(prev => [...prev]);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4"
      onClick={handleBackgroundClick}
    >
      <Suspense fallback={null}>
        <FloatingPatterns />
      </Suspense>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
      />
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
        <Clock />
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="bg-background/80 backdrop-blur-sm"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </motion.div>
      </div>
      <main className="container py-8 px-4 relative z-10 w-full max-w-7xl mt-12">
        {!hasVisited && <OnboardingTip />}
        <motion.div 
          className="max-w-6xl mx-auto mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4,
            // Use a more performant ease function
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          <div className="mb-8">
            <Suspense fallback={<ComponentLoader />}>
              <div className="bg-card border rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-4">Search GitHub Repositories</h2>
                <GitHubSearch />
              </div>
            </Suspense>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <Suspense fallback={<ComponentLoader />}>
                <GitHubProjectHighlight />
              </Suspense>
            </div>
            <div className="lg:col-span-1">
              <Suspense fallback={<ComponentLoader />}>
                <WeatherDisplay onWeatherDataChange={setWeatherData} weatherData={weatherData} />
              </Suspense>
            </div>
          </div>
        </motion.div>
        <motion.div 
          className="max-w-4xl mx-auto mt-12 text-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            delay: 0.2, 
            duration: 0.4,
            // Use a more performant ease function
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          <h2 className="text-2xl font-semibold mb-4">Welcome to DevForecast!</h2>
          <p className="text-muted-foreground">
            Get the current weather forecast for any city, discover trending open-source projects from GitHub, 
            search for specific repositories, and receive AI-powered insights that playfully connect the weather to the world of development. 
            Use the inputs above to get started!
          </p>
        </motion.div>
      </main>
    </div>
  );
}
