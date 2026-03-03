import StatusBadge from "./StatusBadge";

function ComplaintCard({ complaint }) {
  return (
    <div className="complaint-item">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-md)' }}>
        <h3 style={{ margin: 0, flex: 1, color: 'var(--neutral-dark)' }}>{complaint.title}</h3>
        <StatusBadge status={complaint.status} />
      </div>

      <p style={{ color: 'var(--neutral-medium)', lineHeight: 1.7, marginBottom: 'var(--spacing-md)' }}>
        {complaint.description}
      </p>

      <div className="complaint-meta">
        <span className="category">
          {complaint.category}
        </span>
        <span className="date">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {new Date(complaint.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      </div>
    </div>
  );
}

export default ComplaintCard;
