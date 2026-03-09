import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import ComplaintCard from "../components/ComplaintCard";
import SkeletonCard from "../components/SkeletonCard";
import { useCountUp } from "../hooks/useCountUp";
import { useDebounce } from "../hooks/useDebounce";
import { useLocalStorage } from "../hooks/useLocalStorage";
import MyComplaintsAnimatedBg from "../components/MyComplaintsAnimatedBg";

function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useLocalStorage('myComplaintsSort', 'date-desc');
  const [filterStatus, setFilterStatus] = useLocalStorage('myComplaintsFilter', 'all');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  const debouncedSearch = useDebounce(searchTerm, 300);

  const stats = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter(c => c.status === "Pending").length,
    inProgress: complaints.filter(c => c.status === "In Progress").length,
    resolved: complaints.filter(c => c.status === "Resolved").length
  }), [complaints]);

  const totalCount = useCountUp(stats.total, 1000);
  const pendingCount = useCountUp(stats.pending, 1000);
  const inProgressCount = useCountUp(stats.inProgress, 1000);
  const resolvedCount = useCountUp(stats.resolved, 1000);

  const resolutionRate = stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await API.get("/complaints/my");
      const data = Array.isArray(res.data) ? res.data : res.data?.complaints || [];
      setComplaints(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredAndSortedComplaints = useMemo(() => {
    let filtered = complaints;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === filterStatus);
    }

    if (debouncedSearch) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.description.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return sorted;
  }, [complaints, filterStatus, debouncedSearch, sortBy]);

  const handleFilterChange = useCallback((status) => {
    setFilterStatus(status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setFilterStatus]);

  if (loading) {
    return (
      <div className="container">
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--neutral-lighter)', borderRadius: '50%' }} />
            <div style={{ width: '200px', height: '32px', background: 'var(--neutral-lighter)', borderRadius: 'var(--radius-md)' }} />
          </div>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
              <div style={{ width: '80px', height: '16px', background: 'var(--neutral-lighter)', borderRadius: 'var(--radius-sm)', margin: '0 auto 1rem' }} />
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

  const allResolved = stats.total > 0 && stats.resolved === stats.total;

  return (
    <div className="page-with-bg">
      <MyComplaintsAnimatedBg />
      <div className="page-content container">
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <p style={{ color: 'var(--neutral-medium)', fontSize: 'var(--font-size-base)', margin: 0 }}>
            Track and manage your submitted complaints
          </p>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-medium)' }}>
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total</h3>
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
          marginTop: 'var(--spacing-xl)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xl)',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', width: '120px', height: '120px' }}>
            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--neutral-lighter)" strokeWidth="10"/>
              <circle 
                cx="60" 
                cy="60" 
                r="50" 
                fill="none" 
                stroke="var(--success)" 
                strokeWidth="10"
                strokeDasharray={`${(resolutionRate / 100) * 314} 314`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s ease-out' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
                {Math.round(resolutionRate)}%
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-medium)' }}>
                Resolved
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Resolution Rate</h3>
            {allResolved ? (
              <p style={{ color: 'var(--success)', fontWeight: 600, margin: 0 }}>
                🎉 Amazing! All your complaints have been resolved!
              </p>
            ) : (
              <p style={{ color: 'var(--neutral-medium)', margin: 0 }}>
                {stats.resolved} out of {stats.total} complaints resolved
              </p>
            )}
          </div>
        </div>
      )}

      <div style={{
        background: 'var(--white)',
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--neutral-lighter)',
        marginTop: 'var(--spacing-xl)',
        display: 'flex',
        gap: 'var(--spacing-md)',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
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
            placeholder="Search complaints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--spacing-sm) var(--spacing-sm) var(--spacing-sm) 45px',
              border: '2px solid var(--neutral-lighter)',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-sm)',
              transition: 'all 0.3s ease'
            }}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            border: '2px solid var(--neutral-lighter)',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            cursor: 'pointer',
            minWidth: '150px'
          }}
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="title-asc">Title A-Z</option>
          <option value="title-desc">Title Z-A</option>
        </select>
      </div>

      <div style={{ 
        background: 'var(--white)', 
        padding: 'var(--spacing-lg)', 
        borderRadius: 'var(--radius-lg)', 
        boxShadow: 'var(--shadow-md)',
        marginTop: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-lg)',
        border: '1px solid var(--neutral-lighter)'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { value: "all", label: "All", count: stats.total },
            { value: "Pending", label: "Pending", count: stats.pending },
            { value: "In Progress", label: "In Progress", count: stats.inProgress },
            { value: "Resolved", label: "Resolved", count: stats.resolved }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => handleFilterChange(item.value)}
              style={{
                padding: '0.5rem 1rem',
                border: `2px solid ${filterStatus === item.value ? 'var(--primary-main)' : 'var(--neutral-lighter)'}`,
                borderRadius: 'var(--radius-lg)',
                background: filterStatus === item.value ? 'var(--primary-gradient)' : 'var(--white)',
                color: filterStatus === item.value ? 'white' : 'var(--neutral-dark)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: filterStatus === item.value ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
              }}
            >
              {item.label}
              <span style={{
                background: filterStatus === item.value ? 'rgba(255,255,255,0.3)' : 'var(--neutral-bg)',
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

      {filteredAndSortedComplaints.length === 0 ? (
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
            {filterStatus === "all" ? "No complaints yet" : `No ${filterStatus.toLowerCase()} complaints`}
          </p>
          <p style={{ marginTop: 'var(--spacing-sm)' }}>
            {filterStatus === "all" ? "Start by raising your first complaint" : "Try a different filter"}
          </p>
          {filterStatus === "all" && (
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
          {filteredAndSortedComplaints.map((complaint) => (
            <ComplaintCard key={complaint._id} complaint={complaint} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default MyComplaints;
