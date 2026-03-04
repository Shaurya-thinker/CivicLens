import { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import SkeletonCard from '../components/SkeletonCard';
import { useCountUp } from '../hooks/useCountUp';
import useTilt from '../hooks/useTilt';
import TypingText from '../components/TypingText';

export default function PublicDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [displayedComplaints, setDisplayedComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, inProgress: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [itemsToShow, setItemsToShow] = useState(10);

  const totalCount = useCountUp(stats.total, 1200);
  const resolvedCount = useCountUp(stats.resolved, 1200);
  const pendingCount = useCountUp(stats.pending, 1200);
  const inProgressCount = useCountUp(stats.inProgress, 1200);

  const tilt1 = useTilt(8);
  const tilt2 = useTilt(8);
  const tilt3 = useTilt(8);
  const tilt4 = useTilt(8);
  const tilts = [tilt1, tilt2, tilt3, tilt4];

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [statusFilter, complaints, itemsToShow]);

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/complaints');
      const data = response.data.complaints || response.data;
      setComplaints(data);
      
      const total = data.length;
      const resolved = data.filter(c => c.status === 'Resolved').length;
      const pending = data.filter(c => c.status === 'Pending').length;
      const inProgress = data.filter(c => c.status === 'In Progress').length;
      
      setStats({ total, resolved, pending, inProgress });
    } catch (err) {
      setError('Failed to load complaints');
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = () => {
    let filtered = complaints;
    if (statusFilter !== 'All') {
      filtered = complaints.filter(c => c.status === statusFilter);
    }
    setDisplayedComplaints(filtered.slice(0, itemsToShow));
  };

  const getMostCommonCategory = () => {
    if (complaints.length === 0) return 'N/A';
    const categoryCounts = complaints.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  };

  const getResolutionRate = () => {
    if (stats.total === 0) return 0;
    return Math.round((stats.resolved / stats.total) * 100);
  };

  const loadMore = () => {
    setItemsToShow(prev => prev + 10);
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--neutral-lighter)', borderRadius: '50%' }} />
            <div style={{ width: '300px', height: '32px', background: 'var(--neutral-lighter)', borderRadius: 'var(--radius-md)' }} />
          </div>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
              <div style={{ width: '100px', height: '16px', background: 'var(--neutral-lighter)', borderRadius: 'var(--radius-sm)', margin: '0 auto 1rem' }} />
              <div style={{ width: '60px', height: '48px', background: 'var(--neutral-lighter)', borderRadius: 'var(--radius-md)', margin: '0 auto' }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'var(--spacing-2xl)' }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--primary-main)' }}>
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 style={{ margin: 0 }}><TypingText text="Public Complaint Dashboard" speed={60} /></h1>
        </div>
        <p style={{ color: 'var(--neutral-medium)', fontSize: 'var(--font-size-base)' }}>
          View all submitted complaints and their resolution status
        </p>
      </div>

      {error && <div className="error-message">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        {error}
      </div>}

      <div className="stats-grid">
        {[
          { title: 'Total Complaints', value: totalCount, className: '', subtitle: 'Across all categories' },
          { title: 'Resolved', value: resolvedCount, className: 'resolved', subtitle: `${getResolutionRate()}% completion` },
          { title: 'In Progress', value: inProgressCount, className: 'in-progress', subtitle: 'Being worked on' },
          { title: 'Pending', value: pendingCount, className: 'pending', subtitle: 'Awaiting review' }
        ].map((stat, idx) => (
          <div 
            key={stat.title}
            className="stat-card tilt-card"
            ref={tilts[idx].ref}
            onMouseMove={tilts[idx].handleMouseMove}
            onMouseLeave={tilts[idx].handleMouseLeave}
          >
            <h3>{stat.title}</h3>
            <p className={`stat-number ${stat.className}`}>{stat.value}</p>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-medium)', marginTop: 'var(--spacing-sm)' }}>
              {stat.subtitle}
            </p>
          </div>
        ))}
      </div>

      {stats.total > 0 && (
        <div style={{
          background: 'var(--white)',
          padding: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--neutral-lighter)',
          marginTop: 'var(--spacing-xl)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--spacing-xl)'
        }}>
          <div>
            <h3 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--primary-main)' }}>
                <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Insights
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-medium)', margin: 0 }}>Most Common Category</p>
                <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--primary-main)', margin: '0.25rem 0 0 0' }}>
                  {getMostCommonCategory()}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-medium)', margin: 0 }}>Resolution Rate</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <div style={{
                    flex: 1,
                    height: '8px',
                    background: 'var(--neutral-lighter)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${getResolutionRate()}%`,
                      height: '100%',
                      background: 'var(--status-resolved)',
                      transition: 'width 1s ease-out'
                    }} />
                  </div>
                  <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--status-resolved)' }}>
                    {getResolutionRate()}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 'var(--spacing-2xl)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ margin: 0 }}>Recent Complaints</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['All', 'Pending', 'In Progress', 'Resolved'].map(status => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setItemsToShow(10);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  border: statusFilter === status ? 'none' : '2px solid var(--neutral-lighter)',
                  borderRadius: 'var(--radius-lg)',
                  background: statusFilter === status ? 'var(--primary-gradient)' : 'var(--white)',
                  color: statusFilter === status ? 'white' : 'var(--neutral-dark)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  boxShadow: statusFilter === status ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {displayedComplaints.length === 0 ? (
        <div style={{
          background: 'var(--white)',
          padding: 'var(--spacing-2xl)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          color: 'var(--neutral-medium)',
          border: '1px solid var(--neutral-lighter)'
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 1rem', color: 'var(--neutral-light)' }}>
            <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 500 }}>No complaints yet</p>
          <p style={{ marginTop: 'var(--spacing-sm)' }}>Start by raising your first complaint</p>
        </div>
      ) : (
        <>
          <div className="complaints-list">
            {displayedComplaints.map((complaint) => (
              <div key={complaint._id} className="complaint-item" style={{ animation: 'slideUp 0.4s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-md)' }}>
                  <h3 style={{ margin: 0, flex: 1 }}>{complaint.title}</h3>
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
                  {complaint.createdBy?.name && (
                    <span style={{
                      backgroundColor: 'var(--neutral-bg)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--neutral-medium)',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {complaint.createdBy.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {displayedComplaints.length < (statusFilter === 'All' ? complaints.length : complaints.filter(c => c.status === statusFilter).length) && (
            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
              <button
                onClick={loadMore}
                style={{
                  padding: 'var(--spacing-md) var(--spacing-xl)',
                  background: 'var(--white)',
                  color: 'var(--primary-main)',
                  border: '2px solid var(--primary-main)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 600,
                  transition: 'all var(--transition-base)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--primary-gradient)';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--white)';
                  e.target.style.color = 'var(--primary-main)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12L12 19L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
