import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from 'react-dropzone';
import api from "../services/api";
import { useToast } from "../components/Toast";
import Confetti from "../components/Confetti";
import ComplaintAnimatedBg from "../components/ComplaintAnimatedBg";

const MAX_DESCRIPTION = 500;
const EARTH_RADIUS_KM = 6371;
const MAX_IMAGE_COUNT = 3;
const MAX_IMAGE_SIZE_MB = 2;
const DEFAULT_FORM = {
  title: "",
  location: "",
  locationLat: null,
  locationLng: null,
  description: "",
  category: "",
  images: [],
};

export default function RaiseComplaint() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => {
    const draft = localStorage.getItem('complaintDraft');
    if (!draft) return DEFAULT_FORM;
    try {
      const parsed = JSON.parse(draft);
      return {
        ...DEFAULT_FORM,
        ...parsed,
        images: Array.isArray(parsed?.images) ? parsed.images : [],
      };
    } catch {
      return DEFAULT_FORM;
    }
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [nearbyMatches, setNearbyMatches] = useState([]);
  const [compressing, setCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);

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
    if (form.title || form.location || form.description || form.category) {
      setIsDirty(true);
      const timer = setTimeout(() => {
        const { images, ...draftPayload } = form;
        localStorage.setItem('complaintDraft', JSON.stringify(draftPayload));
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

  const toRad = (value) => (value * Math.PI) / 180;

  const getDistanceKm = (lat1, lng1, lat2, lng2) => {
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  };

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

  const fetchCurrentLocation = async () => {
    if (!navigator.geolocation || fetchingLocation) {
      return;
    }

    setFetchingLocation(true);
    setServerError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocationAccuracy(accuracy || null);

        try {
          const reverse = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const reverseData = await reverse.json();
          const resolvedAddress = reverseData?.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

          setForm((prev) => ({
            ...prev,
            location: resolvedAddress,
            locationLat: Number(latitude.toFixed(6)),
            locationLng: Number(longitude.toFixed(6)),
          }));
          addToast('Current location detected', 'success');
        } catch (err) {
          setForm((prev) => ({
            ...prev,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            locationLat: Number(latitude.toFixed(6)),
            locationLng: Number(longitude.toFixed(6)),
          }));
          addToast('Location captured, but readable address was not resolved', 'info');
        } finally {
          setFetchingLocation(false);
        }
      },
      (error) => {
        setFetchingLocation(false);
        addToast(error.message || 'Unable to fetch current location', 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 120000,
      }
    );
  };

  const findNearbyMatches = useCallback(async () => {
    if (!form.category || !form.locationLat || !form.locationLng) {
      setNearbyMatches([]);
      return;
    }

    try {
      const response = await api.get('/complaints/public?limit=100');
      const allComplaints = response.data?.complaints || [];

      const matches = allComplaints
        .filter((item) => item.category === form.category && item.locationLat != null && item.locationLng != null)
        .map((item) => ({
          ...item,
          distanceKm: getDistanceKm(form.locationLat, form.locationLng, item.locationLat, item.locationLng),
        }))
        .filter((item) => item.distanceKm <= 1)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 3);

      setNearbyMatches(matches);
    } catch {
      setNearbyMatches([]);
    }
  }, [form.category, form.locationLat, form.locationLng]);

  useEffect(() => {
    const timer = setTimeout(() => {
      findNearbyMatches();
    }, 500);

    return () => clearTimeout(timer);
  }, [findNearbyMatches]);

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
    if (!form.location.trim()) {
      newErrors.location = "Location is required";
    } else if (form.location.trim().length < 3) {
      newErrors.location = "Location must be at least 3 characters";
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
    if (!Array.isArray(form.images) || form.images.length === 0) {
      newErrors.images = "At least one photo is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const remainingSlots = MAX_IMAGE_COUNT - (Array.isArray(form.images) ? form.images.length : 0);
    const filesToProcess = acceptedFiles.slice(0, remainingSlots);

    if (acceptedFiles.length > remainingSlots) {
      addToast(`Only ${MAX_IMAGE_COUNT} images are allowed`, 'info');
    }

    setCompressing(true);
    setCompressionProgress(0);

    const interval = setInterval(() => {
      setCompressionProgress(prev => {
        if (prev >= 90) return 90;
        return prev + 15;
      });
    }, 100);

    try {
      const imagePromises = filesToProcess.map((file) => new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
          reject(new Error('Only image files are allowed'));
          return;
        }

        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          reject(new Error(`Each image must be below ${MAX_IMAGE_SIZE_MB}MB`));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read image'));
        reader.readAsDataURL(file);
      }));

      const uploadedImages = await Promise.all(imagePromises);
      
      clearInterval(interval);
      setCompressionProgress(100);
      
      setTimeout(() => {
        setForm((prev) => ({
          ...prev,
          images: [...(Array.isArray(prev.images) ? prev.images : []), ...uploadedImages],
        }));

        setErrors((prev) => {
          const { images, ...rest } = prev;
          return rest;
        });
        setCompressing(false);
      }, 300);
      
    } catch (err) {
      clearInterval(interval);
      setCompressing(false);
      addToast(err.message || 'Failed to process image', 'error');
    }
  }, [form.images, addToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: MAX_IMAGE_COUNT,
    disabled: (Array.isArray(form.images) ? form.images.length : 0) >= MAX_IMAGE_COUNT || compressing
  });

  const removeImage = (indexToRemove) => {
    setForm((prev) => ({
      ...prev,
      images: (Array.isArray(prev.images) ? prev.images : []).filter((_, index) => index !== indexToRemove),
    }));
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
      setShowConfetti(true);
      addToast('Complaint submitted successfully!', 'success');
      setTimeout(() => navigate("/my-complaints"), 1500);
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
    <div className="page-with-bg">
      <ComplaintAnimatedBg />
      <div className="page-content">
      <Confetti trigger={showConfetti} />
      <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div style={{ width: '100%', maxWidth: 'none', margin: "0 auto", display: 'grid', gridTemplateColumns: step === 2 ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)', gap: 'var(--spacing-xl)' }}>
        <div style={{ width: '100%', maxWidth: "100%", margin: "0" }}>
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

          <form className="auth-card raise-complaint-card" onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} noValidate>
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
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    type="text"
                    name="location"
                    placeholder="Area, landmark, or address"
                    value={form.location}
                    onChange={handleChange}
                    style={{ borderColor: errors.location ? 'var(--error)' : undefined }}
                  />
                  {errors.location && (
                    <small style={{ color: "var(--error)", display: 'block', marginTop: '0.25rem' }}>
                      {errors.location}
                    </small>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={fetchCurrentLocation}
                      disabled={fetchingLocation}
                      className="btn-filter"
                      style={{ padding: '0.45rem 0.8rem' }}
                    >
                      {fetchingLocation ? 'Detecting location...' : 'Use my current location'}
                    </button>
                    {form.locationLat != null && form.locationLng != null && (
                      <small style={{ color: 'var(--neutral-medium)' }}>
                        GPS: {form.locationLat}, {form.locationLng}
                        {locationAccuracy ? ` (±${Math.round(locationAccuracy)}m)` : ''}
                      </small>
                    )}
                  </div>
                </div>

                {nearbyMatches.length > 0 && (
                  <div style={{
                    background: 'var(--warning-bg)',
                    border: '1px solid var(--warning)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-lg)'
                  }}>
                    <p style={{ color: 'var(--neutral-dark)', margin: 0, fontWeight: 700 }}>
                      Similar complaints nearby. Consider upvoting instead of creating a duplicate.
                    </p>
                    <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.35rem' }}>
                      {nearbyMatches.map((item) => (
                        <small key={item._id} style={{ color: 'var(--neutral-dark)' }}>
                          • {item.title} ({item.distanceKm.toFixed(2)} km away, {item.upvotes || 0} upvotes)
                        </small>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn-filter"
                      onClick={() => navigate('/')}
                      style={{ marginTop: '0.75rem', padding: '0.45rem 0.8rem' }}
                    >
                      View & upvote on public dashboard
                    </button>
                  </div>
                )}

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
                  <label>Complaint Photos</label>
                  <div 
                    {...getRootProps()} 
                    style={{
                      border: `2px dashed ${isDragActive ? 'var(--primary-main)' : 'var(--neutral-light)'}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: '2rem',
                      textAlign: 'center',
                      background: isDragActive ? 'rgba(102, 126, 234, 0.05)' : 'var(--neutral-bg)',
                      cursor: (Array.isArray(form.images) ? form.images.length : 0) >= MAX_IMAGE_COUNT || compressing ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: (Array.isArray(form.images) ? form.images.length : 0) >= MAX_IMAGE_COUNT ? 0.5 : 1
                    }}
                  >
                    <input {...getInputProps()} />
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: isDragActive ? 'var(--primary-main)' : 'var(--neutral-medium)', marginBottom: '1rem' }}>
                      <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 21.0391 3 20.5304 3 20V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {isDragActive ? (
                      <p style={{ color: 'var(--primary-main)', fontWeight: 600, margin: 0 }}>Drop images here...</p>
                    ) : (
                      <p style={{ color: 'var(--neutral-dark)', fontWeight: 500, margin: 0 }}>Drag & drop images here, or click to select</p>
                    )}
                    <small style={{ color: 'var(--neutral-medium)', display: 'block', marginTop: '0.5rem' }}>
                      {(Array.isArray(form.images) ? form.images.length : 0)} of {MAX_IMAGE_COUNT} uploaded ({MAX_IMAGE_SIZE_MB}MB each max)
                    </small>
                  </div>
                  
                  {compressing && (
                    <div style={{ marginTop: '1rem', animation: 'fadeIn 0.3s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <small style={{ color: 'var(--primary-main)', fontWeight: 600 }}>Compressing & Processing...</small>
                        <small style={{ color: 'var(--primary-main)' }}>{compressionProgress}%</small>
                      </div>
                      <div style={{ height: '6px', background: 'var(--neutral-lighter)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${compressionProgress}%`, background: 'var(--primary-gradient)', transition: 'width 0.2s ease-out' }} />
                      </div>
                    </div>
                  )}
                  {errors.images && (
                    <small style={{ color: 'var(--error)', display: 'block', marginTop: '0.25rem' }}>
                      {errors.images}
                    </small>
                  )}

                  {(Array.isArray(form.images) ? form.images.length : 0) > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.5rem', marginTop: '0.75rem' }}>
                      {(Array.isArray(form.images) ? form.images : []).map((img, index) => (
                        <div key={`upload-preview-${index}`} style={{ position: 'relative' }}>
                          <img
                            src={img}
                            alt={`Complaint upload ${index + 1}`}
                            style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-lighter)' }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              border: 'none',
                              borderRadius: '999px',
                              width: '22px',
                              height: '22px',
                              background: 'rgba(0,0,0,0.65)',
                              color: 'white',
                              cursor: 'pointer',
                              fontWeight: 700,
                              lineHeight: 1,
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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
              {(Array.isArray(form.images) ? form.images.length : 0) > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem', marginBottom: 'var(--spacing-md)' }}>
                  {(Array.isArray(form.images) ? form.images : []).map((img, index) => (
                    <img
                      key={`preview-image-${index}`}
                      src={img}
                      alt={`Preview ${index + 1}`}
                      style={{ width: '100%', height: '95px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-lighter)' }}
                    />
                  ))}
                </div>
              )}
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
      </div>
    </div>
  );
}
