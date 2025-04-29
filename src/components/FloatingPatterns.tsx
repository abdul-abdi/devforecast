// 'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import styles from './FloatingPatterns.module.css';

const FloatingPatterns = () => {
  const { theme } = useTheme();
  const patternCount = 12; // Reduced from 25 to 12 for better performance
  const [mounted, setMounted] = useState(false);

  // Only mount component on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate styles only once per theme change, using useMemo instead of useState+useEffect
  const patternStyles = useMemo(() => {
    if (!mounted) return [];
    
    // Get chart colors dynamically based on CSS variables
    const getChartColor = (index: number, opacity: number = 1) => {
      return `oklch(var(--chart-${index}) / ${opacity})`;
    };
    
    const patternColors = [
      getChartColor(1, 0.5),
      getChartColor(2, 0.4),
      getChartColor(3, 0.4),
      getChartColor(4, 0.5),
      getChartColor(5, 0.4),
    ];

    return Array.from({ length: patternCount }).map(() => {
      // Create more varied sizes, but limit maximum size
      const size = 20 + Math.random() * 50; // Reduced max size from 70 to 50px
      
      // More varied shapes
      const shapeType = Math.random();
      let borderRadius: string;
      
      if (shapeType > 0.7) {
        // More squarish
        borderRadius = `${Math.random() * 30}%`;
      } else if (shapeType < 0.3) {
        // Blob/organic shapes
        borderRadius = `${20 + Math.random() * 60}% ${80 - Math.random() * 60}% / ${30 + Math.random() * 40}% ${70 - Math.random() * 40}%`;
      } else {
        // Circles with varying roundness
        borderRadius = `${50 + Math.random() * 50}%`;
      }

      // Reduce blur effects for better performance
      const shouldBlur = Math.random() > 0.8; // Reduced probability of blur
      const blurAmount = shouldBlur ? `blur(${2 + Math.random() * 3}px)` : ''; // Reduced max blur from 8px to 3px

      // Vary opacity more based on size (smaller elements more transparent)
      const baseOpacity = 0.2 + (size / 50) * 0.3; // 0.2 to 0.5 range
      
      return {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 20}s`,
        animationDuration: `${30 + Math.random() * 20}s`, // Slower animations for smoother appearance
        transform: `scale(${0.5 + Math.random() * 0.8}) rotate(${Math.random() * 360}deg)`,
        opacity: baseOpacity,
        backgroundColor: patternColors[Math.floor(Math.random() * patternColors.length)],
        borderRadius,
        width: `${size}px`,
        height: `${size}px`,
        filter: blurAmount,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, mounted]); // Regenerate only when theme changes

  // Don't render anything on the server or if not mounted
  if (!mounted || patternStyles.length === 0) {
    return null;
  }

  return (
    <div className={styles.patternContainer}>
      {patternStyles.map((style, index) => (
        <div
          key={index}
          className={styles.pattern}
          style={{
            ...style,
            willChange: 'transform', // Hint for browser optimization
          }}
          data-theme-mode={theme}
        />
      ))}
    </div>
  );
};

export default FloatingPatterns; 