import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import AuthAnimatedBg from "../components/AuthAnimatedBg";

function CitizenRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validFields, setValidFields] = useState({});
  const firstInvalidRef = useRef(null);

  const passwordRequirements = [
    { test: (p) => p.length >= 6, label: 'At least 6 characters' },
    { test: (p) => /[A-Z]/.test(p), label: 'One uppercase letter' },
    { test: (p) => /[a-z]/.test(p), label: 'One lowercase letter' },
    { test: (p) => /[0-9]/.test(p), label: 'One number' }
  ];

  const getPasswordStrength = (password) => {
    const passed = passwordRequirements.filter(req => req.test(password)).length;
    return (passed / passwordRequirements.length) * 100;
  };

  const getStrengthColor = (strength) => {
    if (strength < 25) return 'var(--error)';
    if (strength < 50) return 'var(--warning)';
    if (strength < 75) return 'var(--status-progress)';
    return 'var(--success)';
  };

  const getStrengthLabel = (strength) => {
    if (strength < 25) return 'Weak';
    if (strength < 50) return 'Fair';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  useEffect(() => {
    setValidFields({
      name: form.name.trim().length >= 2,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
      password: getPasswordStrength(form.password) === 100,
      confirmPassword: form.password && form.password === form.confirmPassword
    });
  }, [form]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (getPasswordStrength(form.password) < 100) {
      setError("Please meet all password requirements");
      firstInvalidRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      await API.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      setSuccess(true);
      setTimeout(() => navigate("/login"), 3500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = Object.values(validFields).every(Boolean);
  const passwordStrength = getPasswordStrength(form.password);

  return (
    <div className="page-with-bg">
      <AuthAnimatedBg />
      <div className="page-content auth-container" style={{
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        animation: 'fadeIn 0.5s ease-out'
      }}>
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            margin: '0 auto 1rem',
            background: 'var(--primary-gradient)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
            animation: success ? 'pulseGlow 0.6s ease-out' : 'none'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: 'white' }}>
              <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 8V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2>Create Account</h2>
          <p style={{ color: 'var(--neutral-medium)', fontSize: '0.95rem' }}>
            Join CivicLens to raise complaints
          </p>
        </div>

        {error && (
          <div className="error-message" style={{ animation: 'slideDown 0.3s ease-out' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="success-message" style={{ animation: 'slideDown 0.3s ease-out' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }}>
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Registration successful! We sent a verification email. Please verify before logging in.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              ref={!validFields.name && form.name ? firstInvalidRef : null}
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              onChange={handleChange}
              value={form.name}
              required
              autoComplete="name"
              style={{ 
                borderColor: validFields.name ? 'var(--success)' : undefined,
                transition: 'all 0.3s ease'
              }}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              ref={!validFields.email && form.email ? firstInvalidRef : null}
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              onChange={handleChange}
              value={form.email}
              required
              autoComplete="email"
              style={{ 
                borderColor: validFields.email ? 'var(--success)' : undefined,
                transition: 'all 0.3s ease'
              }}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                ref={!validFields.password && form.password ? firstInvalidRef : null}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                onChange={handleChange}
                value={form.password}
                required
                autoComplete="new-password"
                style={{ 
                  paddingRight: '40px',
                  borderColor: validFields.password ? 'var(--success)' : undefined,
                  transition: 'all 0.3s ease'
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: 'var(--neutral-medium)'
                }}
                tabIndex="-1"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  {showPassword ? (
                    <><path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></>
                  ) : (
                    <><path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4147 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4858 9.58525 10.1546 9.88 9.88" stroke="currentColor" strokeWidth="2"/><path d="M1 1L23 23" stroke="currentColor" strokeWidth="2"/></>
                  )}
                </svg>
              </button>
            </div>
            
            {form.password && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: getStrengthColor(passwordStrength) }}>
                    {getStrengthLabel(passwordStrength)}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-medium)' }}>
                    {Math.round(passwordStrength)}%
                  </span>
                </div>
                <div style={{ 
                  height: '4px', 
                  background: 'var(--neutral-lighter)', 
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${passwordStrength}%`,
                    background: getStrengthColor(passwordStrength),
                    transition: 'all 0.3s ease',
                    borderRadius: '2px'
                  }} />
                </div>
                
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {passwordRequirements.map((req, i) => (
                    <div key={i} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      fontSize: 'var(--font-size-xs)',
                      color: req.test(form.password) ? 'var(--success)' : 'var(--neutral-medium)',
                      transition: 'color 0.2s ease'
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        {req.test(form.password) ? (
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        ) : (
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        )}
                      </svg>
                      {req.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                onChange={handleChange}
                value={form.confirmPassword}
                required
                autoComplete="new-password"
                style={{ 
                  paddingRight: '40px',
                  borderColor: validFields.confirmPassword ? 'var(--success)' : undefined,
                  transition: 'all 0.3s ease'
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: 'var(--neutral-medium)'
                }}
                tabIndex="-1"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  {showConfirmPassword ? (
                    <><path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></>
                  ) : (
                    <><path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4147 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4858 9.58525 10.1546 9.88 9.88" stroke="currentColor" strokeWidth="2"/><path d="M1 1L23 23" stroke="currentColor" strokeWidth="2"/></>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !isFormValid || success}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {loading ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="8"/>
                </svg>
                Creating account...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 8V14M23 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Create Account
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--neutral-lighter)', textAlign: 'center' }}>
          <p style={{ color: 'var(--neutral-medium)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-main)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}

export default CitizenRegister;
