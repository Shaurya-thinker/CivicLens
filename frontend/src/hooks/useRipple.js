import { useState, useCallback, createElement } from 'react';

export default function useRipple() {
  const [ripples, setRipples] = useState([]);

  const addRipple = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const newRipple = { x, y, size, id: Date.now() };
    
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== newRipple.id)), 600);
  }, []);

  const rippleElements = ripples.map(ripple => 
    createElement('span', {
      key: ripple.id,
      className: 'ripple',
      style: {
        left: ripple.x,
        top: ripple.y,
        width: ripple.size,
        height: ripple.size
      }
    })
  );

  return { addRipple, rippleElements };
}
