'use client';

import React, { useState, useEffect } from 'react';
import styles from './FloatingPatterns.module.css'; // We'll create this CSS module next

interface PatternStyle {
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
  transform: string;
  opacity: number;
  backgroundColor: string; // Add background color
  borderRadius?: string; // Optional: for shape variation
  width: string;
  height: string;
}

// Use chart colors from globals.css
const patternColors = [
  'oklch(var(--chart-1))',
  'oklch(var(--chart-2))',
  'oklch(var(--chart-3))',
  'oklch(var(--chart-4))',
  'oklch(var(--chart-5))',
];

const FloatingPatterns = () => {
  const patternCount = 20; // Increase count slightly
  const [patternStyles, setPatternStyles] = useState<PatternStyle[]>([]); // Restore full PatternStyle type

  // Generate styles only on the client-side after mount
  useEffect(() => {
    const stylesArray = Array.from({ length: patternCount }).map(() => {
      const size = 30 + Math.random() * 40; // Random size between 30px and 70px
      const shapeType = Math.random(); // Determine shape
      let borderRadius = '50%'; // Default circle
      if (shapeType > 0.7) {
        borderRadius = `${Math.random() * 25}%`; // More squarish
      } else if (shapeType < 0.3) {
          borderRadius = `${20 + Math.random() * 60}% ${80 - Math.random() * 60}% / ${30 + Math.random() * 40}% ${70 - Math.random() * 40}%`; // Blob/swoosh shape
      }

      return {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 15}s`,
        animationDuration: `${15 + Math.random() * 15}s`,
        transform: `scale(${0.6 + Math.random() * 0.7}) rotate(${Math.random() * 360}deg)`,
        opacity: 0.7 + Math.random() * 0.3, // Drastically increase opacity range (0.7 to 1.0)
        backgroundColor: patternColors[Math.floor(Math.random() * patternColors.length)],
        borderRadius: borderRadius,
        width: `${size}px`,
        height: `${size}px`,
      };
    });
    setPatternStyles(stylesArray); // Remove type assertion
  }, []); // Empty dependency array ensures this runs only once on mount

  // Initially render nothing or placeholders until styles are generated
  if (patternStyles.length === 0) {
    return null; // Or a loading state / empty div
  }

  return (
    <div className={styles.patternContainer}>
      {patternStyles.map((style, index) => (
        <div
          key={index}
          className={styles.pattern}
          style={style} // Use styles from state
        >
          {/* You could use different shapes here, e.g., SVGs */}
          {/* Simple example: a circle */}
        </div>
      ))}
    </div>
  );
};

export default FloatingPatterns; 