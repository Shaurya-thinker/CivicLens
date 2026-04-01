import { useEffect } from 'react';

export default function ImageLightbox({ imageSrc, alt = 'Preview image', onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageSrc) return null;

  return (
    <div
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(3px)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
    >
      <button
        onClick={onClose}
        type="button"
        aria-label="Close image preview"
        style={{
          position: 'fixed',
          top: '18px',
          right: '18px',
          border: 'none',
          borderRadius: '999px',
          width: '40px',
          height: '40px',
          background: 'rgba(255, 255, 255, 0.2)',
          color: '#fff',
          fontSize: '1.4rem',
          cursor: 'pointer'
        }}
      >
        ×
      </button>
      <img
        src={imageSrc}
        alt={alt}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1100px',
          maxHeight: '88vh',
          objectFit: 'contain',
          borderRadius: '10px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}
      />
    </div>
  );
}
