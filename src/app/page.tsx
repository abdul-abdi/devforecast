'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from "next-themes";
import { /*Cloud, Github,*/ Moon, Sun } from 'lucide-react';
import WeatherDisplay from '@/components/weather/WeatherDisplay';
import GitHubProjectHighlight from '@/components/github/GitHubProjectHighlight';
import AiInsight from '@/components/ai-insight/AiInsight';
import FloatingPatterns from '@/components/FloatingPatterns';
import { WeatherData } from '@/types';
import { Button } from "@/components/ui/button";
import Clock from '@/components/Clock';
import OnboardingTip from '@/components/OnboardingTip';

// Define type for effect points
interface ImpactPoint {
  x: number;
  y: number;
  timestamp: number; // Added timestamp
}

const FADE_DURATION = 2500; // milliseconds (2.5 seconds)

export default function Home() {
  const { setTheme, theme } = useTheme();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [effects, setEffects] = useState<ImpactPoint[]>([]); // State for impact points
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null); // Ref to store animation frame ID

  // Function to handle clicks on the main container
  const handleBackgroundClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    // console.log('Background Clicked! Coords:', x, y); // Removed debug log
    setEffects(prevEffects => [...prevEffects, { x, y, timestamp: Date.now() }]); // Add timestamp
  }, []);

  // Refactored drawing logic with requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let lastTimestamp = 0;

    const draw = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      // const deltaTime = timestamp - lastTimestamp;
      const now = Date.now();

      // Resize canvas (only if needed - consider moving to resize effect)
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
      }

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      const baseColor = theme === 'dark' ? '255, 255, 255' : '0, 0, 0';
      const baseOpacity = theme === 'dark' ? 0.75 : 0.6; // Increased base opacity

      let hasActiveEffects = false;
      // Draw cracks for each effect, applying fade
      effects.forEach(point => {
        const age = now - point.timestamp;
        if (age > FADE_DURATION) {
          return; // Skip faded effects
        }
        hasActiveEffects = true;

        const currentOpacity = baseOpacity * (1 - age / FADE_DURATION);
        const numPrimaryCracks = 7 + Math.floor(Math.random() * 4); // 7-10 primary cracks

        // Draw central shatter first
        context.fillStyle = `rgba(${baseColor}, ${currentOpacity * 0.8})`; // Slightly less opaque fill
        context.beginPath();
        context.arc(point.x, point.y, 3 + Math.random() * 3, 0, Math.PI * 2); // Small irregular center
        context.fill();

        // Draw jagged cracks radiating outwards
        for (let i = 0; i < numPrimaryCracks; i++) {
          const angle = (i / numPrimaryCracks) * Math.PI * 2 + (Math.random() - 0.5) * 0.5; // Spread angles slightly
          const totalLength = 50 + Math.random() * 100; // Increased length (50-150px)
          const segments = 5 + Math.floor(Math.random() * 5); // 5-9 segments per crack
          const segmentLength = totalLength / segments;

          context.strokeStyle = `rgba(${baseColor}, ${currentOpacity})`;
          context.lineWidth = 1.5 + Math.random() * 2; // Slightly thicker (1.5 - 3.5px)
          context.beginPath();
          context.moveTo(point.x, point.y);

          let currentX = point.x;
          let currentY = point.y;
          let currentAngle = angle;

          for (let j = 0; j < segments; j++) {
            // Add randomness to angle for jaggedness
            currentAngle += (Math.random() - 0.5) * 0.6; // More deviation
            // Calculate segment end point
            const segEndX = currentX + Math.cos(currentAngle) * segmentLength;
            const segEndY = currentY + Math.sin(currentAngle) * segmentLength;
            context.lineTo(segEndX, segEndY);

            // Update current position for next segment
            currentX = segEndX;
            currentY = segEndY;

             // Optional: Add small branching cracks sometimes
             if (Math.random() < 0.15) { // 15% chance to branch
                const branchAngle = currentAngle + (Math.random() - 0.5) * Math.PI / 2; // Branch off at an angle
                const branchLength = segmentLength * (0.5 + Math.random() * 0.5);
                const branchEndX = currentX + Math.cos(branchAngle) * branchLength;
                const branchEndY = currentY + Math.sin(branchAngle) * branchLength;
                context.moveTo(currentX, currentY); // Move back to fork point
                context.lineTo(branchEndX, branchEndY);
             }
          }
          context.stroke();
        }
      });

      lastTimestamp = timestamp;
      // Only continue animating if there are active effects
      if (hasActiveEffects) {
        animationFrameId.current = requestAnimationFrame(draw);
      } else {
          animationFrameId.current = null; // Stop animation
      }
    };

    // Start the animation loop if there are effects
    if (effects.length > 0 && animationFrameId.current === null) {
        // console.log('Starting animation loop'); // Debug log
        animationFrameId.current = requestAnimationFrame(draw);
    }

    // Cleanup function to cancel animation frame on unmount or when effects change externally
    return () => {
      if (animationFrameId.current !== null) {
        // console.log('Cancelling animation frame'); // Debug log
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
      <FloatingPatterns />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
      />
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
        <Clock />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
      <main className="container py-8 px-4 relative z-10 w-full max-w-7xl mt-12">
        <OnboardingTip />
        <div className="max-w-6xl mx-auto mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <WeatherDisplay onWeatherDataChange={setWeatherData} />
            <GitHubProjectHighlight />
          </div>

          <AiInsight weatherData={weatherData} />

        </div>
        <div className="max-w-4xl mx-auto mt-12 text-center px-4">
          <h2 className="text-2xl font-semibold mb-4">Welcome to DevForecast!</h2>
          <p className="text-muted-foreground">
            Get the current weather forecast for any city, discover trending open-source projects from GitHub, 
            and receive AI-powered insights that playfully connect the weather to the world of development. 
            Use the inputs above to get started!
          </p>
        </div>
      </main>
    </div>
  );
}
