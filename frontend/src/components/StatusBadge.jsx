export default function StatusBadge({ status }) {
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
          label: 'Pending Review'
        };
      case 'In Progress':
        return {
          className: 'status-badge in-progress',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ),
          label: 'In Progress'
        };
      case 'Resolved':
        return {
          className: 'status-badge resolved',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
          label: 'Resolved'
        };
      default:
        return {
          className: 'status-badge',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            </svg>
          ),
          label: status || 'Unknown'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={config.className} title={config.label}>
      {config.icon}
      <span>{status}</span>
    </span>
  );
}