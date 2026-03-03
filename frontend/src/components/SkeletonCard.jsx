export default function SkeletonCard() {
  return (
    <div className="complaint-item" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
        <div style={{ 
          width: '60%', 
          height: '24px', 
          background: 'var(--neutral-lighter)', 
          borderRadius: 'var(--radius-md)' 
        }} />
        <div style={{ 
          width: '80px', 
          height: '24px', 
          background: 'var(--neutral-lighter)', 
          borderRadius: 'var(--radius-lg)' 
        }} />
      </div>
      <div style={{ 
        width: '100%', 
        height: '60px', 
        background: 'var(--neutral-lighter)', 
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-md)' 
      }} />
      <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
        <div style={{ 
          width: '100px', 
          height: '28px', 
          background: 'var(--neutral-lighter)', 
          borderRadius: 'var(--radius-lg)' 
        }} />
        <div style={{ 
          width: '120px', 
          height: '28px', 
          background: 'var(--neutral-lighter)', 
          borderRadius: 'var(--radius-lg)' 
        }} />
      </div>
    </div>
  );
}
