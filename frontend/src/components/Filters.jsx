import { useState } from 'react';

export default function Filters({ onFilter }) {
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  const handleFilterChange = () => {
    onFilter({ category, status });
  };

  const handleReset = () => {
    setCategory('');
    setStatus('');
    onFilter({ category: '', status: '' });
  };

  const hasActiveFilters = category || status;

  return (
    <div className="filters">
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.2rem' }}>🔍</span>
        <h3 style={{ margin: 0, color: 'var(--neutral-dark)', fontSize: 'var(--font-size-lg)' }}>
          Filter Complaints
        </h3>
        {hasActiveFilters && (
          <span style={{
            marginLeft: 'auto',
            backgroundColor: 'var(--primary-light)',
            color: 'white',
            padding: '0.25rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600
          }}>
            Active Filters
          </span>
        )}
      </div>

      <div style={{ width: '100%', display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
        <div className="filter-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Garbage">🗑️ Garbage</option>
            <option value="Road">🛣️ Road</option>
            <option value="Street Light">💡 Street Light</option>
            <option value="Water">💧 Water</option>
            <option value="Other">📋 Other</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Pending">⏳ Pending</option>
            <option value="In Progress">⚙️ In Progress</option>
            <option value="Resolved">✅ Resolved</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignSelf: 'flex-end', marginLeft: 'auto' }}>
          <button
            onClick={handleFilterChange}
            className="btn-filter"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>🔎</span>
            Apply
          </button>
          <button
            onClick={handleReset}
            className="btn-reset"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>↻</span>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}