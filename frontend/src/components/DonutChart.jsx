export default function DonutChart({ data, size = 200 }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let currentAngle = -90;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(0deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--neutral-lighter)"
          strokeWidth={strokeWidth}
        />
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
          const rotation = currentAngle;
          currentAngle += (percentage / 100) * 360;
          
          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: '50% 50%',
                transition: 'all 0.6s ease-out'
              }}
            />
          );
        })}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.3em"
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            fill: 'var(--neutral-dark)'
          }}
        >
          {total}
        </text>
      </svg>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {data.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: item.color
            }} />
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-medium)', fontWeight: 600 }}>
              {item.label}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
