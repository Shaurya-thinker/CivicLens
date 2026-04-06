import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useTheme } from '../contexts/ThemeContext';

export default function SkeletonCard() {
  const { isDarkMode } = useTheme();

  return (
    <SkeletonTheme 
      baseColor={isDarkMode ? '#1e293b' : '#e2e8f0'} 
      highlightColor={isDarkMode ? '#334155' : '#f8fafc'}
    >
      <div className="complaint-item" style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
          <div style={{ flex: 1, marginRight: '1rem' }}>
            <Skeleton height={28} width="80%" />
          </div>
          <Skeleton height={28} width={100} borderRadius={8} />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <Skeleton count={3} style={{ marginBottom: '0.5rem' }} />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
          <Skeleton height={100} borderRadius={8} />
          <Skeleton height={100} borderRadius={8} />
          <Skeleton height={100} borderRadius={8} />
        </div>
        
        <Skeleton width="40%" height={20} style={{ marginBottom: '1rem' }} />
        
        <div className="complaint-meta" style={{ paddingBottom: '0.5rem' }}>
          <Skeleton width={80} height={24} borderRadius={8} style={{ marginRight: '1rem' }} />
          <Skeleton width={120} height={24} />
        </div>
      </div>
    </SkeletonTheme>
  );
}
