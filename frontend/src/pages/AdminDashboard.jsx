import { useState, useEffect, useMemo, Fragment } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Filters from '../components/Filters';
import DonutChart from '../components/DonutChart';
import { useCountUp } from '../hooks/useCountUp';
import { useToast } from '../components/Toast';
import useRipple from '../hooks/useRipple';
import DashboardAnimatedBg from '../components/DashboardAnimatedBg';
import ImageLightbox from '../components/ImageLightbox';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [expandedRow, setExpandedRow] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [previewImage, setPreviewImage] = useState(null);
  const { addToast } = useToast();
  const { addRipple, rippleElements } = useRipple();

  const totalCount = useCountUp(stats.total, 1200);
  const pendingCount = useCountUp(stats.pending, 1200);
  const inProgressCount = useCountUp(stats.inProgress, 1200);
  const resolvedCount = useCountUp(stats.resolved, 1200);

  useEffect(() => {
    fetchComplaints();
    const savedFilters = localStorage.getItem('adminFilters');
    if (savedFilters) {
      const filters = JSON.parse(savedFilters);
      handleFilter(filters);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      filterAndSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, complaints]);

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/complaints');
      const complaintsList = response.data.complaints || response.data;
      setComplaints(complaintsList);
      setFilteredComplaints(complaintsList);
      calculateStats(complaintsList);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch complaints');
      addToast('Failed to load complaints', 'error');
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
    const currentComplaint = complaints.find((c) => c._id === complaintId);
    if (!currentComplaint) return;

    let reason = '';
    const isReopen = currentComplaint.status === 'Resolved' && newStatus === 'In Progress';
    if (isReopen) {
      reason = window.prompt('Please provide a reason for reopening this complaint (minimum 5 characters):', '') || '';
      if (reason.trim().length < 5) {
        addToast('Reopening requires a reason of at least 5 characters', 'error');
        return;
      }
    }

    setUpdatingStatus(complaintId);
    try {
      await api.patch(`/complaints/${complaintId}/status`, { status: newStatus, reason: reason.trim() });
      const updated = complaints.map(c => 
        c._id === complaintId ? { ...c, status: newStatus } : c
      );
      setComplaints(updated);
      setFilteredComplaints(updated);
      calculateStats(updated);
      addToast(`Status updated to ${newStatus}`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleFilter = (filters) => {
    localStorage.setItem('adminFilters', JSON.stringify(filters));
    let filtered = [...complaints];

    if (filters.category) {
      filtered = filtered.filter(c => c.category === filters.category);
    }

    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    setFilteredComplaints(filtered);
  };

  const filterAndSearch = () => {
    let filtered = [...complaints];
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredComplaints(filtered);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedComplaints = useMemo(() => {
    let sorted = [...filteredComplaints];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === 'createdAt') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [filteredComplaints, sortConfig]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard', 'success');
  };

  const chartData = [
    { label: 'Pending', value: stats.pending, color: 'var(--status-pending)' },
    { label: 'In Progress', value: stats.inProgress, color: 'var(--status-progress)' },
    { label: 'Resolved', value: stats.resolved, color: 'var(--status-resolved)' }
  ];

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
    <div className="page-with-bg">
      <DashboardAnimatedBg />
      <div className="page-content container">
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <p style={{ color: 'var(--neutral-medium)', fontSize: 'var(--font-size-base)', margin: 0 }}>
            Manage and review all citizen complaints
          </p>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-medium)' }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Complaints</h3>
          <p className="stat-number">{totalCount}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number pending">{pendingCount}</p>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <p className="stat-number in-progress">{inProgressCount}</p>
        </div>
        <div className="stat-card">
          <h3>Resolved</h3>
          <p className="stat-number resolved">{resolvedCount}</p>
        </div>
      </div>

      {stats.total > 0 && (
        <div style={{
          background: 'var(--white)',
          padding: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--neutral-lighter)',
          marginTop: 'var(--spacing-xl)'
        }}>
          <h3 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>Status Distribution</h3>
          <DonutChart data={chartData} />
        </div>
      )}

      <Filters onFilter={handleFilter} />

      <div style={{
        background: 'var(--white)',
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--neutral-lighter)',
        marginBottom: 'var(--spacing-lg)'
      }}>
        <div style={{ position: 'relative' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--neutral-medium)'
          }}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search complaints by title, description, location, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--spacing-md) var(--spacing-md) var(--spacing-md) 45px',
              border: '2px solid var(--neutral-lighter)',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-base)',
              transition: 'all var(--transition-base)'
            }}
          />
        </div>
      </div>

      {sortedComplaints.length === 0 ? (
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
          <p>Try adjusting your filters or search</p>
        </div>
      ) : (
        <div className="complaints-table complaints-table-scroll">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('title')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Title
                </th>
                <th>Category</th>
                <th>Location</th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Status
                </th>
                <th>Created By</th>
                <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Date
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedComplaints.map(complaint => (
                <Fragment key={complaint._id}>
                  <tr onClick={() => setExpandedRow(expandedRow === complaint._id ? null : complaint._id)} style={{ cursor: 'pointer' }}>
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
                    <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-medium)' }}>
                      {complaint.location || 'Not provided'}
                    </td>
                    <td><StatusBadge status={complaint.status} /></td>
                    <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-medium)' }}>
                      {complaint.createdBy?.name || 'Unknown'}
                    </td>
                    <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-medium)' }}>
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint._id, e.target.value)}
                        onMouseDown={addRipple}
                        className="status-select ripple-container"
                        disabled={updatingStatus === complaint._id}
                        style={{ opacity: updatingStatus === complaint._id ? 0.6 : 1, position: 'relative' }}
                      >
                        {rippleElements}
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                  {expandedRow === complaint._id && (
                    <tr>
                      <td colSpan="7" style={{ background: 'var(--neutral-bg)', padding: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                          <div>
                            <strong style={{ color: 'var(--neutral-dark)' }}>Description:</strong>
                            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--neutral-medium)' }}>{complaint.description}</p>
                          </div>
                          {Array.isArray(complaint.images) && complaint.images.length > 0 && (
                            <div>
                              <strong style={{ color: 'var(--neutral-dark)' }}>Photos:</strong>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {complaint.images.map((img, index) => (
                                  <img
                                    key={`${complaint._id}-admin-photo-${index}`}
                                    src={img}
                                    alt={`Complaint photo ${index + 1}`}
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewImage(img);
                                    }}
                                    style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-lighter)', cursor: 'zoom-in' }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          <div>
                            <strong style={{ color: 'var(--neutral-dark)' }}>Location:</strong>
                            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--neutral-medium)' }}>
                              {complaint.location || 'Not provided'}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
                            <div>
                              <strong style={{ color: 'var(--neutral-dark)' }}>Complaint ID:</strong>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                <code style={{ background: 'var(--white)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-xs)' }}>
                                  {complaint._id}
                                </code>
                                <button
                                  onClick={() => copyToClipboard(complaint._id)}
                                  style={{
                                    background: 'var(--primary-main)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    fontSize: 'var(--font-size-xs)'
                                  }}
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                            <div>
                              <strong style={{ color: 'var(--neutral-dark)' }}>Full Timestamp:</strong>
                              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--neutral-medium)', fontSize: 'var(--font-size-sm)' }}>
                                {new Date(complaint.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
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

      {previewImage && (
        <ImageLightbox
          imageSrc={previewImage}
          alt="Admin complaint photo preview"
          onClose={() => setPreviewImage(null)}
        />
      )}
      </div>
    </div>
  );
}
