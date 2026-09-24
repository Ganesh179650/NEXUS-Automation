import { useState, useEffect } from 'react';

export function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(() => {
    const saved = localStorage.getItem('nexus_reduce_motion');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    localStorage.setItem('nexus_reduce_motion', reduceMotion.toString());
  }, [reduceMotion]);

  const toggleReducedMotion = () => {
    setReduceMotion((prev) => !prev);
  };

  return { reduceMotion, setReduceMotion, toggleReducedMotion };
}
