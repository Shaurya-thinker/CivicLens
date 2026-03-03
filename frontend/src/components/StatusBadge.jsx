import { useState } from 'react';

export default function StatusBadge({ status }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusConfig = () => {
    switch (status) {
      case 'Pending':
        return {
          className: 'status-badge pending',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ),
          label: 'Awaiting review by admin',
          description: 'Your complaint has been submitted and is waiting to be reviewed'
        };
      case 'In Progress':
        return {
          className: 'status-badge in-progress pulse-badge',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ),
          label: 'Currently being worked on',
          description: 'Admin is actively working to resolve this complaint'
        };
      case 'Resolved':
        return {
          className: 'status-badge resolved',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
          label: 'Issue has been resolved',
          description: 'This complaint has been successfully addressed'
        };
      default:
        return {
          className: 'status-badge',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            </svg>
          ),
          label: status || 'Unknown',
          description: 'Status information'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span 
      className={config.className}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ position: 'relative' }}
    >
      {config.icon}
      <span>{status}</span>
      {showTooltip && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          padding: '0.5rem 0.75rem',
          background: 'var(--neutral-dark)',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-xs)',
          whiteSpace: 'nowrap',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out',
          pointerEvents: 'none'
        }}>
          {config.description}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid var(--neutral-dark)'
          }} />
        </div>
      )}
    </span>
  );
}