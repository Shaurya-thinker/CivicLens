import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function RaiseComplaint() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: ""
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const categories = [
    { value: "Road", icon: "🛣️", label: "Road Issues" },
    { value: "Garbage", icon: "🗑️", label: "Garbage Collection" },
    { value: "Water", icon: "💧", label: "Water Supply" },
    { value: "Electricity", icon: "⚡", label: "Electricity" },
    { value: "Street Light", icon: "💡", label: "Street Lights" },
    { value: "Other", icon: "📋", label: "Other" }
  ];

  const validate = () => {
    let newErrors = {};

    if (!form.title.trim()) {
      newErrors.title = "Title is required";
    } else if (form.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }

    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    } else if (form.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!form.category) {
      newErrors.category = "Please select a category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const { [name]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setLoading(true);

    try {
      await api.post("/complaints", form);
      navigate("/my-complaints");
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        "Failed to submit complaint. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
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
            Report civic issues in your area
          </p>
        </div>

        {serverError && (
          <div className="error-message" style={{ marginBottom: '1.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {serverError}
          </div>
        )}

        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }}>
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Complaint Title
            </label>
            <input
              id="title"
              type="text"
              name="title"
              placeholder="Brief title of your complaint"
              value={form.title}
              onChange={handleChange}
              style={{ borderColor: errors.title ? 'var(--error)' : undefined }}
            />
            {errors.title && (
              <small style={{ color: "var(--error)", display: 'block', marginTop: '0.25rem' }}>
                {errors.title}
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="category">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }}>
                <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Category
            </label>
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
                    transition: 'all var(--transition-base)',
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

          <div className="form-group">
            <label htmlFor="description">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }}>
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe the issue in detail..."
              value={form.description}
              onChange={handleChange}
              rows="5"
              style={{
                width: "100%",
                padding: "var(--spacing-md)",
                borderRadius: "var(--radius-md)",
                border: `2px solid ${errors.description ? 'var(--error)' : 'var(--neutral-lighter)'}`,
                fontSize: 'var(--font-size-base)',
                fontFamily: 'inherit',
                transition: 'all var(--transition-base)',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              {errors.description ? (
                <small style={{ color: "var(--error)" }}>
                  {errors.description}
                </small>
              ) : (
                <small style={{ color: 'var(--neutral-medium)' }}>
                  Minimum 10 characters
                </small>
              )}
              <small style={{ color: 'var(--neutral-medium)' }}>
                {form.description.length} characters
              </small>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
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
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Submit Complaint
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
