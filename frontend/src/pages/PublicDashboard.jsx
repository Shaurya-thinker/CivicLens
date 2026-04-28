import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import SkeletonCard from '../components/SkeletonCard';
import { useCountUp } from '../hooks/useCountUp';
import useTilt from '../hooks/useTilt';
import TypingText from '../components/TypingText';
import DashboardAnimatedBg from '../components/DashboardAnimatedBg';
import ImageLightbox from '../components/ImageLightbox';
import { socket } from '../services/socket';

export default function PublicDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [displayedComplaints, setDisplayedComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, inProgress: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [itemsToShow, setItemsToShow] = useState(10);
  const [upvotedComplaintIds, setUpvotedComplaintIds] = useState(new Set());
  const [upvoteInFlight, setUpvoteInFlight] = useState({});
  const [nearMeEnabled, setNearMeEnabled] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [myLocation, setMyLocation] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const isCitizenLoggedIn = localStorage.getItem('token') && localStorage.getItem('role') === 'citizen';

  const toRad = (value) => (value * Math.PI) / 180;
  const getDistanceKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

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

    const handleNewComplaint = (newComplaint) => {
      setComplaints(prev => {
        if (prev.find(c => c._id === newComplaint._id)) return prev;
        return [newComplaint, ...prev];
      });
      setStats(s => ({ ...s, total: s.total + 1, pending: s.pending + 1 }));
    };

    socket.on('newComplaint', handleNewComplaint);

    return () => {
      socket.off('newComplaint', handleNewComplaint);
    };
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [statusFilter, complaints, itemsToShow]);

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/complaints/public');
      const data = response.data.complaints || response.data;
      setComplaints(data);

      if (isCitizenLoggedIn) {
        try {
          const upvoteResponse = await api.get('/complaints/upvotes/me');
          const ids = upvoteResponse.data?.complaintIds || [];
          setUpvotedComplaintIds(new Set(ids));
        } catch (upvoteError) {
          if (upvoteError.response?.status !== 401) {
            throw upvoteError;
          }

          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('user');
          setUpvotedComplaintIds(new Set());
        }
      }
      
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

    let prioritized = [...filtered];

    if (nearMeEnabled && myLocation) {
      prioritized = prioritized
        .map((item) => {
          if (item.locationLat == null || item.locationLng == null) {
            return { ...item, distanceKm: Number.POSITIVE_INFINITY };
          }

          return {
            ...item,
            distanceKm: getDistanceKm(myLocation.lat, myLocation.lng, item.locationLat, item.locationLng),
          };
        })
        .sort((a, b) => {
          if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
          const upvoteDelta = (b.upvotes || 0) - (a.upvotes || 0);
          if (upvoteDelta !== 0) return upvoteDelta;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
    } else {
      prioritized = prioritized.sort((a, b) => {
        const upvoteDelta = (b.upvotes || 0) - (a.upvotes || 0);
        if (upvoteDelta !== 0) return upvoteDelta;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    setDisplayedComplaints(prioritized.slice(0, itemsToShow));
  };

  const enableNearMe = () => {
    if (!navigator.geolocation || detectingLocation) {
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMyLocation({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        });
        setNearMeEnabled(true);
        setDetectingLocation(false);
      },
      () => {
        setError('Unable to access your location for near-me sorting');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 }
    );
  };

  const handleUpvote = async (complaintId) => {
    if (!isCitizenLoggedIn || upvotedComplaintIds.has(complaintId) || upvoteInFlight[complaintId]) {
      return;
    }

    setUpvoteInFlight(prev => ({ ...prev, [complaintId]: true }));

    try {
      const response = await api.post(`/complaints/${complaintId}/upvote`);
      const nextUpvotes = response.data?.upvotes;

      setComplaints(prev => prev.map(item => {
        if (item._id !== complaintId) return item;
        return {
          ...item,
          upvotes: typeof nextUpvotes === 'number' ? nextUpvotes : (item.upvotes || 0) + 1,
        };
      }));

      setUpvotedComplaintIds(prev => {
        const updated = new Set(prev);
        updated.add(complaintId);
        return updated;
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upvote complaint');
    } finally {
      setUpvoteInFlight(prev => ({ ...prev, [complaintId]: false }));
    }
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
    <div className="page-with-bg">
      <DashboardAnimatedBg />
      <div className="page-content container">
        <div style={{
          marginBottom: 'var(--spacing-xl)',
          padding: 'var(--spacing-xl)',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center',
          border: '1px solid var(--primary-light)',
          animation: 'slideDown 0.5s ease-out'
        }}>
          <h2 style={{ color: 'var(--primary-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🌍</span> Community Impact Tracker
          </h2>
          <p style={{ color: 'var(--neutral-dark)', fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: '1.5rem' }}>
            Citizens have reported {stats.total} issues and {stats.resolved > 0 ? `resolved ${stats.resolved}` : 'started working on them'} together!
          </p>
          
          <div style={{
            height: '16px',
            background: 'var(--white)',
            borderRadius: '999px',
            overflow: 'hidden',
            maxWidth: '600px',
            margin: '0 auto',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
            border: '1px solid var(--neutral-lighter)'
          }}>
            <div style={{
              height: '100%',
              width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%`,
              background: 'var(--status-resolved)',
              transition: 'width 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }} />
          </div>
          <p style={{ color: 'var(--neutral-medium)', marginTop: '0.75rem', fontWeight: 600 }}>
            {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}% City Resolution Rate 🎉
          </p>
        </div>

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
            <button
              onClick={nearMeEnabled ? () => setNearMeEnabled(false) : enableNearMe}
              disabled={detectingLocation}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-lg)',
                border: nearMeEnabled ? 'none' : '2px solid var(--neutral-lighter)',
                background: nearMeEnabled ? 'var(--primary-gradient)' : 'var(--white)',
                color: nearMeEnabled ? 'white' : 'var(--neutral-dark)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
              }}
            >
              {detectingLocation ? 'Detecting location...' : (nearMeEnabled ? 'Near Me On' : 'Sort Near Me')}
            </button>
          </div>
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
                {Array.isArray(complaint.images) && complaint.images.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: 'var(--spacing-md)' }}>
                    {complaint.images.slice(0, 3).map((img, index) => (
                      <img
                        key={`${complaint._id}-img-${index}`}
                        src={img}
                        alt={`Complaint evidence ${index + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(img);
                        }}
                        style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-lighter)', cursor: 'zoom-in' }}
                      />
                    ))}
                  </div>
                )}
                <p style={{ color: 'var(--neutral-dark)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                  Location: {complaint.location || 'Not provided'}
                </p>
                {nearMeEnabled && Number.isFinite(complaint.distanceKm) && (
                  <p style={{ color: 'var(--status-progress)', fontWeight: 700, marginBottom: 'var(--spacing-md)' }}>
                    Distance: {complaint.distanceKm.toFixed(2)} km away
                  </p>
                )}
                <div className="complaint-meta">
                  <span className="category">
                    {complaint.category}
                  </span>
                  <span className="date" style={{ fontWeight: 700, color: 'var(--primary-main)' }}>
                    ▲ {complaint.upvotes || 0} upvotes
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
                </div>
                <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <small style={{ color: 'var(--neutral-medium)' }}>
                    Higher upvotes increase issue priority in this public feed.
                  </small>
                  {isCitizenLoggedIn ? (
                    <motion.button
                      whileHover={upvotedComplaintIds.has(complaint._id) ? {} : { scale: 1.05 }}
                      whileTap={upvotedComplaintIds.has(complaint._id) ? {} : { scale: 0.85 }}
                      onClick={() => handleUpvote(complaint._id)}
                      disabled={upvotedComplaintIds.has(complaint._id) || upvoteInFlight[complaint._id]}
                      style={{
                        padding: '0.45rem 0.9rem',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: upvotedComplaintIds.has(complaint._id) ? 'var(--neutral-lighter)' : 'var(--primary-gradient)',
                        color: upvotedComplaintIds.has(complaint._id) ? 'var(--primary-main)' : 'white',
                        fontWeight: 600,
                        cursor: upvotedComplaintIds.has(complaint._id) ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        position: 'relative'
                      }}
                    >
                      {upvotedComplaintIds.has(complaint._id) && (
                        <motion.div
                          initial={{ scale: 0, opacity: 1 }}
                          animate={{ scale: [1, 2, 2.5], opacity: [1, 1, 0] }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          style={{
                            position: 'absolute',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--primary-main)',
                            left: '50%',
                            top: '50%',
                            marginLeft: '-20px',
                            marginTop: '-20px',
                            zIndex: 0,
                            pointerEvents: 'none'
                          }}
                        />
                      )}
                      
                      {upvotedComplaintIds.has(complaint._id) ? (
                        <motion.svg
                          initial={{ scale: 0.5, rotate: -45 }}
                          animate={{ scale: [1.5, 1], rotate: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 10 }}
                          width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ zIndex: 1 }}
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </motion.svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ zIndex: 1 }}>
                           <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      )}
                      <span style={{ zIndex: 1 }}>
                        {upvotedComplaintIds.has(complaint._id)
                          ? 'Upvoted'
                          : (upvoteInFlight[complaint._id] ? 'Upvoting...' : 'Upvote')}
                      </span>
                    </motion.button>
                  ) : (
                    <small style={{ color: 'var(--neutral-medium)' }}>Login as citizen to upvote</small>
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

      {previewImage && (
        <ImageLightbox
          images={complaints.find(c => c.images?.includes(previewImage))?.images || [previewImage]}
          startIndex={Math.max(0, complaints.find(c => c.images?.includes(previewImage))?.images?.indexOf(previewImage) || 0)}
          onClose={() => setPreviewImage(null)}
        />
      )}
      </div>
    </div>
  );
}
