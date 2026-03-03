import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/Toast";

const MAX_DESCRIPTION = 500;

export default function RaiseComplaint() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => {
    const draft = localStorage.getItem('complaintDraft');
    return draft ? JSON.parse(draft) : { title: "", description: "", category: "" };
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const categories = [
    { value: "Road", icon: "🛣️", label: "Road Issues", keywords: ['road', 'street', 'pothole', 'pavement', 'highway'] },
    { value: "Garbage", icon: "🗑️", label: "Garbage Collection", keywords: ['garbage', 'trash', 'waste', 'dump', 'litter'] },
    { value: "Water", icon: "💧", label: "Water Supply", keywords: ['water', 'pipe', 'leak', 'supply', 'tap'] },
    { value: "Electricity", icon: "⚡", label: "Electricity", keywords: ['electricity', 'power', 'outage', 'electric', 'voltage'] },
    { value: "Street Light", icon: "💡", label: "Street Lights", keywords: ['light', 'lamp', 'street light', 'lighting', 'bulb'] },
    { value: "Other", icon: "📋", label: "Other", keywords: [] }
  ];

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (form.title || form.description || form.category) {
      setIsDirty(true);
      const timer = setTimeout(() => {
        localStorage.setItem('complaintDraft', JSON.stringify(form));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [form]);

  const suggestCategory = useCallback((title) => {
    const lowerTitle = title.toLowerCase();
    for (const cat of categories) {
      if (cat.keywords.some(keyword => lowerTitle.includes(keyword))) {
        return cat.value;
      }
    }
    return '';
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const newValue = name === 'description' ? value.slice(0, MAX_DESCRIPTION) : value;
    
    setForm((prev) => {
      const updated = { ...prev, [name]: newValue };
      if (name === 'title' && !prev.category) {
        const suggested = suggestCategory(newValue);
        if (suggested) {
          updated.category = suggested;
          addToast(`Category "${suggested}" suggested based on your title`, 'info');
        }
      }
      return updated;
    });
    
    setErrors((prev) => {
      const { [name]: _removed, ...rest } = prev;
      return rest;
    });
  }, [suggestCategory, addToast]);

  const validateStep1 = () => {
    const newErrors = {};
    if (!form.title.trim()) {
      newErrors.title = "Title is required";
    } else if (form.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }
    if (!form.category) {
      newErrors.category = "Please select a category";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    } else if (form.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validateStep2()) return;

    setLoading(true);

    try {
      await api.post("/complaints", form);
      localStorage.removeItem('complaintDraft');
      setIsDirty(false);
      addToast('Complaint submitted successfully!', 'success');
      navigate("/my-complaints");
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to submit complaint. Please try again.");
      addToast('Failed to submit complaint', 'error');
    } finally {
      setLoading(false);
    }
  };

  const descProgress = (form.description.length / MAX_DESCRIPTION) * 100;
  const descColor = descProgress > 90 ? 'var(--error)' : descProgress > 70 ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: 'grid', gridTemplateColumns: step === 2 ? '1fr 1fr' : '1fr', gap: 'var(--spacing-xl)' }}>
        <div style={{ maxWidth: step === 1 ? "700px" : "100%", margin: step === 1 ? "0 auto" : "0" }}>
          <div style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              margin: '0 auto 1rem',
              background: 'var(--primary-gradient)',
              borderRadius: 'var(--radius-xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: 'white' }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>Raise a Complaint</h1>
            <p style={{ color: 'var(--neutral-medium)', fontSize: 'var(--font-size-base)' }}>
              Step {step} of 2 - {step === 1 ? 'Basic Information' : 'Details'}
            </p>
            {draftSaved && (
              <p style={{ 
                color: 'var(--success)', 
                fontSize: 'var(--font-size-sm)', 
                marginTop: '0.5rem',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                ✓ Draft saved
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 'var(--spacing-lg)', justifyContent: 'center' }}>
            {[1, 2].map(i => (
              <div key={i} style={{
                flex: 1,
                maxWidth: '100px',
                height: '4px',
                background: i <= step ? 'var(--primary-gradient)' : 'var(--neutral-lighter)',
                borderRadius: '2px',
                transition: 'all 0.3s ease'
              }} />
            ))}
          </div>

          {serverError && (
            <div className="error-message" style={{ marginBottom: '1.5rem', animation: 'slideDown 0.3s ease-out' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {serverError}
            </div>
          )}

          <form className="auth-card" onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} noValidate>
            {step === 1 ? (
              <div style={{ animation: 'slideInFromLeft 0.3s ease-out' }}>
                <div className="form-group">
                  <label htmlFor="title">Complaint Title</label>
                  <input
                    id="title"
                    type="text"
                    name="title"
                    placeholder="Brief title of your complaint"
                    value={form.title}
                    onChange={handleChange}
                    style={{ borderColor: errors.title ? 'var(--error)' : undefined }}
                    autoFocus
                  />
                  {errors.title && (
                    <small style={{ color: "var(--error)", display: 'block', marginTop: '0.25rem' }}>
                      {errors.title}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, category: cat.value });
                          setErrors((prev) => {
                            const { category: _removed, ...rest } = prev;
                            return rest;
                          });
                        }}
                        style={{
                          padding: '0.75rem',
                          border: `2px solid ${form.category === cat.value ? 'var(--primary-main)' : 'var(--neutral-lighter)'}`,
                          borderRadius: 'var(--radius-md)',
                          background: form.category === cat.value ? 'rgba(102, 126, 234, 0.1)' : 'var(--white)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: form.category === cat.value ? 600 : 500,
                          color: form.category === cat.value ? 'var(--primary-main)' : 'var(--neutral-dark)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <span style={{ fontSize: '1.5rem' }}>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.category && (
                    <small style={{ color: "var(--error)", display: 'block', marginTop: '0.5rem' }}>
                      {errors.category}
                    </small>
                  )}
                </div>

                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  Next
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ) : (
              <div style={{ animation: 'slideInFromRight 0.3s ease-out' }}>
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Describe the issue in detail..."
                    value={form.description}
                    onChange={handleChange}
                    rows="6"
                    style={{
                      width: "100%",
                      padding: "var(--spacing-md)",
                      borderRadius: "var(--radius-md)",
                      border: `2px solid ${errors.description ? 'var(--error)' : 'var(--neutral-lighter)'}`,
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'inherit',
                      transition: 'all 0.3s ease',
                      resize: 'vertical'
                    }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', alignItems: 'center' }}>
                    {errors.description ? (
                      <small style={{ color: "var(--error)" }}>{errors.description}</small>
                    ) : (
                      <small style={{ color: 'var(--neutral-medium)' }}>Minimum 10 characters</small>
                    )}
                    <small style={{ color: descProgress > 90 ? 'var(--error)' : 'var(--neutral-medium)', fontWeight: 600 }}>
                      {form.description.length}/{MAX_DESCRIPTION}
                    </small>
                  </div>
                  <div style={{ 
                    height: '4px', 
                    background: 'var(--neutral-lighter)', 
                    borderRadius: '2px',
                    overflow: 'hidden',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${descProgress}%`,
                      background: descColor,
                      transition: 'all 0.3s ease',
                      borderRadius: '2px'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="btn-reset"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={loading}
                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    {loading ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="8"/>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Submit Complaint
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Preview</h3>
            <div className="complaint-item" style={{ borderLeft: '4px solid var(--primary-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-md)' }}>
                <h3 style={{ margin: 0, flex: 1 }}>{form.title || 'Your complaint title'}</h3>
                <span className="status-badge pending">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>Pending</span>
                </span>
              </div>
              <p style={{ color: 'var(--neutral-medium)', lineHeight: 1.7, marginBottom: 'var(--spacing-md)' }}>
                {form.description || 'Your detailed description will appear here...'}
              </p>
              <div className="complaint-meta">
                <span className="category">{form.category || 'Category'}</span>
                <span className="date">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Just now
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
