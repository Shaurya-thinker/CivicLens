import { useState, memo, useCallback } from 'react';
import StatusBadge from "./StatusBadge";
import { useToast } from './Toast';

const ComplaintCard = memo(({ complaint }) => {
  const [expanded, setExpanded] = useState(false);
  const { addToast } = useToast();

  const copyId = useCallback(() => {
    navigator.clipboard.writeText(complaint._id);
    addToast('Complaint ID copied!', 'success');
  }, [complaint._id, addToast]);

  const getRelativeTime = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const statusColors = {
    'Pending': 'var(--status-pending)',
    'In Progress': 'var(--status-progress)',
    'Resolved': 'var(--status-resolved)'
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div 
      className="complaint-item"
      style={{
        borderLeft: `4px solid ${statusColors[complaint.status] || 'var(--primary-main)'}`,
        transition: 'all 0.3s ease',
        animation: 'slideUp 0.4s ease-out',
        cursor: 'pointer'
      }}
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 12px 24px rgba(0,0,0,0.1), 0 0 0 1px ${statusColors[complaint.status] || 'var(--primary-main)'}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded(!expanded);
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-md)' }}>
        <h3 style={{ margin: 0, flex: 1, color: 'var(--neutral-dark)' }}>{complaint.title}</h3>
        <StatusBadge status={complaint.status} />
      </div>

      <p style={{ 
        color: 'var(--neutral-medium)', 
        lineHeight: 1.7, 
        marginBottom: 'var(--spacing-md)',
        maxHeight: expanded ? '1000px' : '60px',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease'
      }}>
        {expanded ? complaint.description : truncateText(complaint.description)}
      </p>

      {!expanded && complaint.description.length > 150 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary-main)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            padding: 0,
            marginBottom: 'var(--spacing-md)'
          }}
        >
          Read more →
        </button>
      )}

      {expanded && (
        <div style={{
          padding: 'var(--spacing-md)',
          background: 'var(--neutral-bg)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--spacing-md)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-dark)' }}>ID:</strong>
            <code style={{ 
              background: 'var(--white)', 
              padding: '0.25rem 0.5rem', 
              borderRadius: 'var(--radius-sm)', 
              fontSize: 'var(--font-size-xs)',
              fontFamily: 'monospace'
            }}>
              {complaint._id.slice(0, 8)}...
            </code>
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyId();
              }}
              style={{
                background: 'var(--primary-main)',
                color: 'white',
                border: 'none',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              Copy
            </button>
          </div>
        </div>
      )}

      <div className="complaint-meta">
        <span className="category">{complaint.category}</span>
        <span 
          className="date" 
          title={new Date(complaint.createdAt).toLocaleString()}
          style={{ cursor: 'help' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {getRelativeTime(complaint.createdAt)}
        </span>
      </div>
    </div>
  );
});

ComplaintCard.displayName = 'ComplaintCard';

export default ComplaintCard;
