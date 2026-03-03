import { useState, useEffect } from 'react';

export default function Filters({ onFilter }) {
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    onFilter({ category, status });
  }, [category, status]);

  const handleReset = () => {
    setCategory('');
    setStatus('');
  };

  const removeFilter = (type) => {
    if (type === 'category') setCategory('');
    if (type === 'status') setStatus('');
  };

  const hasActiveFilters = category || status;

  return (
    <div className="filters">
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--primary-main)' }}>
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <h3 style={{ margin: 0, color: 'var(--neutral-dark)', fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>
          Filter Complaints
        </h3>
        {hasActiveFilters && (
          <span style={{
            marginLeft: 'auto',
            background: 'var(--primary-gradient)',
            color: 'white',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
            animation: 'fadeIn 0.3s'
          }}>
            Active
          </span>
        )}
      </div>

      {hasActiveFilters && (
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          flexWrap: 'wrap', 
          marginBottom: 'var(--spacing-md)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          {category && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--primary-light)',
              color: 'white',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600
            }}>
              <span>Category: {category}</span>
              <button
                onClick={() => removeFilter('category')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
          {status && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--primary-light)',
              color: 'white',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600
            }}>
              <span>Status: {status}</span>
              <button
                onClick={() => removeFilter('status')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ width: '100%', display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
        <div className="filter-group">
          <label htmlFor="category">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }}>
              <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Garbage">Garbage</option>
            <option value="Road">Road</option>
            <option value="Street Light">Street Light</option>
            <option value="Water">Water</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="status">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        
        {hasActiveFilters && (
          <div style={{ display: 'flex', alignSelf: 'flex-end', marginLeft: 'auto' }}>
            <button
              onClick={handleReset}
              className="btn-reset"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.49 9C19.9828 7.56678 19.1209 6.28536 17.9845 5.27542C16.8482 4.26548 15.4745 3.55976 13.9917 3.22426C12.5089 2.88875 10.9652 2.93434 9.50481 3.35677C8.04437 3.77921 6.71475 4.56471 5.64 5.64L1 10M23 14L18.36 18.36C17.2853 19.4353 15.9556 20.2208 14.4952 20.6432C13.0348 21.0657 11.4911 21.1112 10.0083 20.7757C8.52547 20.4402 7.1518 19.7345 6.01547 18.7246C4.87913 17.7146 4.01717 16.4332 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
