/**
 * Engaging animated background for complaint submission pages
 * Features: Dynamic color shifts, animated shapes, encouraging energy
 */
export default function ComplaintAnimatedBg() {
  // Generate animated shapes
  const shapes = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    delay: i * 0.2,
    duration: 8 + i * 0.5
  }));

  return (
    <div className="complaint-animated-bg">
      {/* Background shapes with color animation */}
      {shapes.map(shape => (
        <div
          key={shape.id}
          className="complaint-shape complaint-shape-item"
          style={{
            animationDelay: `${shape.delay}s`,
            animationDuration: `${shape.duration}s`
          }}
        ></div>
      ))}

      {/* Animated gradient flowing background */}
      <svg className="complaint-svg-bg" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="complaint-blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="60" />
          </filter>
          <linearGradient id="complaint-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#764ba2" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#38a169" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Animated blob shapes */}
        <g filter="url(#complaint-blur)">
          <ellipse cx="200" cy="150" rx="150" ry="100" fill="url(#complaint-gradient)" className="complaint-blob-1" />
          <ellipse cx="1000" cy="500" rx="200" ry="120" fill="url(#complaint-gradient)" className="complaint-blob-2" />
          <ellipse cx="600" cy="100" rx="100" ry="80" fill="url(#complaint-gradient)" className="complaint-blob-3" />
        </g>
      </svg>

      {/* Accent glow elements */}
      <div className="complaint-glow complaint-glow-1"></div>
      <div className="complaint-glow complaint-glow-2"></div>
    </div>
  );
}
