import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import ParticleBackground from './components/ParticleBackground';
import FAB from './components/FAB';
import Navbar from './components/Navbar';
import CitizenLogin from './pages/CitizenLogin';
import CitizenRegister from './pages/CitizenRegister';
import RaiseComplaint from './pages/RaiseComplaint';
import MyComplaints from './pages/MyComplaints';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PublicDashboard from './pages/PublicDashboard';
import VerifyEmail from './pages/VerifyEmail';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/admin/login" replace />;
  return role === 'admin' ? children : <Navigate to="/" replace />;
}

function CitizenRoute({ children }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  return role === 'citizen' ? children : <Navigate to="/admin/dashboard" replace />;
}

function App() {
  return (
    <ToastProvider>
      <ParticleBackground />
      <Navbar />
      <Routes>
        <Route path="/" element={<PublicDashboard />} />
        <Route path="/login" element={<CitizenLogin />} />
        <Route path="/register" element={<CitizenRegister />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/raise" element={<CitizenRoute><RaiseComplaint /></CitizenRoute>} />
        <Route path="/my-complaints" element={<ProtectedRoute><MyComplaints /></ProtectedRoute>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <FAB />
    </ToastProvider>
  );
}

export default App;