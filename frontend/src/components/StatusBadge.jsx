export default function StatusBadge({ status }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'Pending':
        return {
          className: 'status-badge pending',
          icon: '⏳',
          label: 'Pending Review'
        };
      case 'In Progress':
        return {
          className: 'status-badge in-progress',
          icon: '⚙️',
          label: 'In Progress'
        };
      case 'Resolved':
        return {
          className: 'status-badge resolved',
          icon: '✅',
          label: 'Resolved'
        };
      default:
        return {
          className: 'status-badge',
          icon: '📋',
          label: status || 'Unknown'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={config.className} title={config.label}>
      <span>{config.icon}</span>
      <span>{status}</span>
    </span>
  );
}