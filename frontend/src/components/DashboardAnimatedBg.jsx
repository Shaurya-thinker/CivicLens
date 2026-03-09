/**
 * Data-focused animated background for dashboard pages
 * Features: Animated grid overlay with floating data orbs
 */
export default function DashboardAnimatedBg() {
  // Generate grid cells for animation
  const gridCells = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 0.1
  }));

  return (
    <div className="dashboard-animated-bg">
      {/* Animated grid background */}
      <div className="dashboard-grid">
        {gridCells.map(cell => (
          <div
            key={cell.id}
            className="grid-cell"
            style={{
              animationDelay: `${cell.delay}s`
            }}
          ></div>
        ))}
      </div>

      {/* Floating data orbs */}
      <div className="dashboard-orb dashboard-orb-1"></div>
      <div className="dashboard-orb dashboard-orb-2"></div>
      <div className="dashboard-orb dashboard-orb-3"></div>
      <div className="dashboard-orb dashboard-orb-4"></div>

      {/* Animated gradient shape */}
      <svg className="dashboard-shape" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="dashboard-radial">
            <stop offset="0%" stopColor="#667eea" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#764ba2" stopOpacity="0.05" />
          </radialGradient>
        </defs>
        <circle cx="600" cy="300" r="400" fill="url(#dashboard-radial)" className="dashboard-pulse-circle" />
      </svg>
    </div>
  );
}
