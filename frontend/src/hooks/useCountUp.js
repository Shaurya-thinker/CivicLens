import { useEffect, useState } from 'react';

export const useCountUp = (end, duration = 1000, start = 0) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    if (start === end) return;
    
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    const timer = setInterval(() => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuad = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * easeOutQuad);
      
      setCount(current);
      
      if (progress === 1) {
        clearInterval(timer);
        setCount(end);
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [end, duration, start]);

  return count;
};
