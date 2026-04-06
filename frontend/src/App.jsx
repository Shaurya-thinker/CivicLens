import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ToastProvider, useToast } from './components/Toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { socket } from './services/socket';
import PageTransition from './components/PageTransition';
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

function SocketManager({ children }) {
  const { addToast } = useToast();

  useEffect(() => {
    socket.connect();

    const handleStatusUpdate = (complaint) => {
      // Play a subtle notification sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {}); // catch auto-play blocks
      } catch (err) {
        // ignore audio errors
      }

      addToast(`Status updated: ${complaint.title} is now ${complaint.status}`, 'info');
    };

    socket.on('statusUpdate', handleStatusUpdate);

    return () => {
      socket.off('statusUpdate', handleStatusUpdate);
      socket.disconnect();
    };
  }, [addToast]);

  return children;
}

function App() {
  const location = useLocation();

  return (
    <ThemeProvider>
      <ToastProvider>
        <SocketManager>
          <ParticleBackground />
        <Navbar />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><PublicDashboard /></PageTransition>} />
            <Route path="/login" element={<PageTransition><CitizenLogin /></PageTransition>} />
            <Route path="/register" element={<PageTransition><CitizenRegister /></PageTransition>} />
            <Route path="/verify-email" element={<PageTransition><VerifyEmail /></PageTransition>} />
            <Route path="/raise" element={<CitizenRoute><PageTransition><RaiseComplaint /></PageTransition></CitizenRoute>} />
            <Route path="/my-complaints" element={<ProtectedRoute><PageTransition><MyComplaints /></PageTransition></ProtectedRoute>} />
            <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
            <Route path="/admin/dashboard" element={<AdminRoute><PageTransition><AdminDashboard /></PageTransition></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AnimatePresence>
        <FAB />
        </SocketManager>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;