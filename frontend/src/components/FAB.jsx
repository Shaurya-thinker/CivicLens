import { useNavigate, useLocation } from 'react-router-dom';

export default function FAB() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  if (!token || location.pathname === '/raise') return null;

  return (
    <button
      className="fab"
      onClick={() => navigate('/raise')}
      aria-label="Raise Complaint"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  );
}
