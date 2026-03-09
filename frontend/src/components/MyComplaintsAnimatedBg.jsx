/**
 * Clean and organized animated background for MyComplaints page
 * Features: Subtle animations, organized layout elements
 */
export default function MyComplaintsAnimatedBg() {
  // Generate floating status indicators
  const indicators = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: i * 0.15
  }));

  return (
    <div className="mycomplaints-animated-bg">
      {/* Animated status line indicator */}
      <svg className="mycomplaints-indicator" viewBox="0 0 1200 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="status-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#667eea" stopOpacity="0" />
            <stop offset="50%" stopColor="#764ba2" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#667eea" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="50" x2="1200" y2="50" stroke="url(#status-gradient)" strokeWidth="2" className="status-line" />
      </svg>

      {/* Floating status indicators */}
      {indicators.map(indicator => (
        <div
          key={indicator.id}
          className="status-indicator"
          style={{
            animationDelay: `${indicator.delay}s`,
            left: `${(indicator.id * 15) % 100}%`,
            top: `${(indicator.id * 12) % 80}%`
          }}
        ></div>
      ))}

      {/* Subtle gradient orbs */}
      <div className="mycomplaints-orb mycomplaints-orb-1"></div>
      <div className="mycomplaints-orb mycomplaints-orb-2"></div>
      <div className="mycomplaints-orb mycomplaints-orb-3"></div>

      {/* Organized mesh background */}
      <svg className="mycomplaints-mesh" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="mesh-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="200" height="200" fill="none" stroke="rgba(102, 126, 234, 0.05)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1200" height="600" fill="url(#mesh-pattern)" />
      </svg>
    </div>
  );
}
