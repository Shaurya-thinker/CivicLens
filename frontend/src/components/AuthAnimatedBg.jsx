/**
 * Professional animated background for authentication pages
 * Features: Animated gradient orbs and subtle flowing shapes
 */
export default function AuthAnimatedBg() {
  return (
    <div className="auth-animated-bg">
      {/* Animated gradient orbs */}
      <div className="auth-orb auth-orb-1"></div>
      <div className="auth-orb auth-orb-2"></div>
      <div className="auth-orb auth-orb-3"></div>
      
      {/* Flowing mesh gradient lines */}
      <svg className="auth-mesh" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="auth-blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
          </filter>
          <linearGradient id="auth-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#764ba2" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        
        {/* Animated flowing lines */}
        <path
          d="M 0,300 Q 300,150 600,300 T 1200,300"
          stroke="url(#auth-gradient-1)"
          strokeWidth="2"
          fill="none"
          filter="url(#auth-blur)"
          className="auth-flow-line auth-flow-1"
        />
        <path
          d="M 0,250 Q 300,400 600,250 T 1200,250"
          stroke="url(#auth-gradient-1)"
          strokeWidth="2"
          fill="none"
          filter="url(#auth-blur)"
          className="auth-flow-line auth-flow-2"
        />
      </svg>
    </div>
  );
}
