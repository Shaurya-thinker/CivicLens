import { useEffect, useState } from 'react';

export default function Confetti({ trigger }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 2 + Math.random(),
        color: ['#667eea', '#764ba2', '#38a169', '#ed8936', '#3182ce'][Math.floor(Math.random() * 5)]
      }));
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 3000);
    }
  }, [trigger]);

  if (!particles.length) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
      {particles.map(p => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            background: p.color
          }}
        />
      ))}
    </div>
  );
}
