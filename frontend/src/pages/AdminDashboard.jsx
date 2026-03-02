import { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Filters from '../components/Filters';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/complaints');
      const complaintsList = response.data.complaints || response.data;
      setComplaints(complaintsList);
      setFilteredComplaints(complaintsList);
      calculateStats(complaintsList);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch complaints');
      console.error('Fetch complaints error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (list) => {
    setStats({
      total: list.length,
      pending: list.filter(c => c.status === 'Pending').length,
      inProgress: list.filter(c => c.status === 'In Progress').length,
      resolved: list.filter(c => c.status === 'Resolved').length
    });
  };

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      await api.patch(`/complaints/${complaintId}/status`, { status: newStatus });
      const updated = complaints.map(c => 
        c._id === complaintId ? { ...c, status: newStatus } : c
      );
      setComplaints(updated);
      setFilteredComplaints(updated);
      calculateStats(updated);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleFilter = (filters) => {
    let filtered = [...complaints];

    if (filters.category) {
      filtered = filtered.filter(c => c.category === filters.category);
    }

    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    setFilteredComplaints(filtered);
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

  if (error) {
    return (
      <div className="container">
        <div className="error-message" style={{ fontSize: 'var(--font-size-base)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--primary-main)' }}>
            <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        </div>
        <p style={{ color: 'var(--neutral-medium)', fontSize: 'var(--font-size-base)' }}>
          Manage and review all citizen complaints
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Complaints</h3>
          <p className="stat-number">{stats.total}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number pending">{stats.pending}</p>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <p className="stat-number in-progress">{stats.inProgress}</p>
        </div>
        <div className="stat-card">
          <h3>Resolved</h3>
          <p className="stat-number resolved">{stats.resolved}</p>
        </div>
      </div>

      <Filters onFilter={handleFilter} />

      {filteredComplaints.length === 0 ? (
        <div style={{
          background: 'var(--white)',
          padding: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          color: 'var(--neutral-medium)'
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 1rem', color: 'var(--neutral-light)' }}>
            <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 500 }}>No complaints found</p>
          <p>Try adjusting your filters</p>
        </div>
      ) : (
        <div className="complaints-table">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map(complaint => (
                <tr key={complaint._id}>
                  <td style={{ fontWeight: 500, color: 'var(--neutral-dark)' }}>{complaint.title}</td>
                  <td>
                    <span style={{
                      backgroundColor: 'var(--neutral-bg)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 500
                    }}>
                      {complaint.category}
                    </span>
                  </td>
                  <td><StatusBadge status={complaint.status} /></td>
                  <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-medium)' }}>
                    {complaint.createdBy?.name || 'Unknown'}
                  </td>
                  <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-medium)' }}>
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <select
                      value={complaint.status}
                      onChange={(e) => handleStatusChange(complaint._id, e.target.value)}
                      className="status-select"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{
        marginTop: 'var(--spacing-2xl)',
        padding: 'var(--spacing-lg)',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
        color: 'var(--neutral-medium)'
      }}>
        <p><strong style={{ color: 'var(--neutral-dark)' }}>Summary:</strong> {stats.total} total complaints with {stats.resolved} resolved and {stats.pending} pending</p>
      </div>
    </div>
  );
}
