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
          <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>⏳</div>
          <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--neutral-medium)' }}>Loading complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1>📋 Public Complaint Dashboard</h1>
        <p style={{ color: 'var(--neutral-medium)', fontSize: 'var(--font-size-base)' }}>
          View all submitted complaints and their resolution status
        </p>
      </div>

      {error && <div className="error-message">❌ {error}</div>}

      {/* Statistics Cards */}
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

      {/* Recent Complaints */}
      <div style={{ marginTop: 'var(--spacing-2xl)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ margin: 0 }}>Recent Complaints</h2>
          <span style={{
            backgroundColor: 'var(--primary-light)',
            color: 'white',
            padding: '0.25rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
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
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
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
                  📅 {new Date(complaint.createdAt).toLocaleDateString(undefined, {
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
                    fontWeight: 500
                  }}>
                    👤 {complaint.createdBy.name}
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