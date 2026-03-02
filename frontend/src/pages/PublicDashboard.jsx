import { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function PublicDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, inProgress: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

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

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-main)' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="8"/>
          </svg>
          <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--neutral-medium)', marginTop: '1rem' }}>Loading complaints...</p>
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
          <h1 style={{ margin: 0 }}>Public Complaint Dashboard</h1>
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
        <div className="stat-card">
          <h3>Total Complaints</h3>
          <p className="stat-number">{stats.total}</p>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-medium)', marginTop: 'var(--spacing-sm)' }}>
            Across all categories
          </p>
        </div>
        <div className="stat-card">
          <h3>Resolved</h3>
          <p className="stat-number resolved">{stats.resolved}</p>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-medium)', marginTop: 'var(--spacing-sm)' }}>
            {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}% completion
          </p>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <p className="stat-number in-progress">{stats.inProgress}</p>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-medium)', marginTop: 'var(--spacing-sm)' }}>
            Being worked on
          </p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number pending">{stats.pending}</p>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-medium)', marginTop: 'var(--spacing-sm)' }}>
            Awaiting review
          </p>
        </div>
      </div>

      <div style={{ marginTop: 'var(--spacing-2xl)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ margin: 0 }}>Recent Complaints</h2>
          <span style={{
            background: 'var(--primary-gradient)',
            color: 'white',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
            minWidth: 'fit-content'
          }}>
            {complaints.length} Total
          </span>
        </div>
      </div>

      {complaints.length === 0 ? (
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
        <div className="complaints-list">
          {complaints.slice(0, 20).map((complaint) => (
            <div key={complaint._id} className="complaint-item">
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
      )}

      {complaints.length > 20 && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--spacing-lg)',
          marginTop: 'var(--spacing-xl)',
          color: 'var(--neutral-medium)'
        }}>
          <p style={{ fontSize: 'var(--font-size-sm)' }}>
            Showing 20 of {complaints.length} complaints
          </p>
        </div>
      )}
    </div>
  );
}
