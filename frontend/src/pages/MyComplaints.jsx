import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import StatusBadge from "../components/StatusBadge";

function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/complaints/my");
        if (Array.isArray(res.data)) {
          setComplaints(res.data);
        } else if (res.data?.complaints) {
          setComplaints(res.data.complaints);
        } else {
          setComplaints([]);
        }
      } catch (err) {
        setError("Failed to load complaints");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredComplaints = complaints.filter(c => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === "Pending").length,
    inProgress: complaints.filter(c => c.status === "In Progress").length,
    resolved: complaints.filter(c => c.status === "Resolved").length
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-main)' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="8"/>
          </svg>
          <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--neutral-medium)', marginTop: '1rem' }}>Loading your complaints...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--primary-main)' }}>
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 style={{ margin: 0 }}>My Complaints</h1>
          </div>
          <Link to="/raise" style={{ textDecoration: 'none' }}>
            <button className="btn-filter" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              New Complaint
            </button>
          </Link>
        </div>
        <p style={{ color: 'var(--neutral-medium)', fontSize: 'var(--font-size-base)' }}>
          Track and manage your submitted complaints
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total</h3>
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

      <div style={{ 
        background: 'var(--white)', 
        padding: 'var(--spacing-lg)', 
        borderRadius: 'var(--radius-lg)', 
        boxShadow: 'var(--shadow-md)',
        marginTop: 'var(--spacing-xl)',
        marginBottom: 'var(--spacing-lg)',
        border: '1px solid var(--neutral-lighter)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--primary-main)' }}>
            <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>Filter by Status</h3>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { value: "all", label: "All", count: stats.total },
            { value: "Pending", label: "Pending", count: stats.pending },
            { value: "In Progress", label: "In Progress", count: stats.inProgress },
            { value: "Resolved", label: "Resolved", count: stats.resolved }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              style={{
                padding: '0.5rem 1rem',
                border: `2px solid ${filter === item.value ? 'var(--primary-main)' : 'var(--neutral-lighter)'}`,
                borderRadius: 'var(--radius-lg)',
                background: filter === item.value ? 'var(--primary-gradient)' : 'var(--white)',
                color: filter === item.value ? 'white' : 'var(--neutral-dark)',
                cursor: 'pointer',
                transition: 'all var(--transition-base)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: filter === item.value ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
              }}
            >
              {item.label}
              <span style={{
                background: filter === item.value ? 'rgba(255,255,255,0.3)' : 'var(--neutral-bg)',
                padding: '0.125rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700
              }}>
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filteredComplaints.length === 0 ? (
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
          <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 500 }}>
            {filter === "all" ? "No complaints yet" : `No ${filter.toLowerCase()} complaints`}
          </p>
          <p style={{ marginTop: 'var(--spacing-sm)' }}>
            {filter === "all" ? "Start by raising your first complaint" : "Try a different filter"}
          </p>
          {filter === "all" && (
            <Link to="/raise" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ marginTop: 'var(--spacing-lg)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Raise Complaint
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="complaints-list">
          {filteredComplaints.map((complaint) => (
            <div key={complaint._id} className="complaint-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-md)' }}>
                <h3 style={{ margin: 0, flex: 1 }}>{complaint.title}</h3>
                <StatusBadge status={complaint.status} />
              </div>
              <p style={{ color: 'var(--neutral-medium)', lineHeight: 1.7, marginBottom: 'var(--spacing-md)' }}>
                {complaint.description}
              </p>
              <div className="complaint-meta">
                <span className="category">{complaint.category}</span>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyComplaints;
