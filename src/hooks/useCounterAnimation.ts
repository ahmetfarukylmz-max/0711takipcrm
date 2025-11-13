import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for animating number counters
 * @param end - The final number to count to
 * @param duration - Animation duration in milliseconds (default: 1000)
 * @param startOnMount - Whether to start animation on mount (default: true)
 * @returns Current animated value
 */
export const useCounterAnimation = (
  end: number,
  duration: number = 1000,
  startOnMount: boolean = true
): number => {
  const [count, setCount] = useState(startOnMount ? 0 : end);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startOnMount) {
      setCount(end);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

      // Easing function for smooth animation (easeOutQuart)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [end, duration, startOnMount]);

  return count;
};
