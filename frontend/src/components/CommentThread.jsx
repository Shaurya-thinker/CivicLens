import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { socket } from '../services/socket';
import { useToast } from './Toast';

export default function CommentThread({ complaintId, initialComments = [], onCommentAdded }) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const isCitizenLoggedIn = localStorage.getItem('token') && localStorage.getItem('role') === 'citizen';
  const isAdminLoggedIn = localStorage.getItem('token') && localStorage.getItem('role') === 'admin';
  const canComment = isCitizenLoggedIn || isAdminLoggedIn;

  useEffect(() => {
    // If we receive a new comment via props (e.g., from a parent pulling new data), keep them in sync
    setComments(initialComments);
  }, [initialComments]);

  useEffect(() => {
    const handleNewComment = (payload) => {
      if (payload.complaintId === complaintId) {
        setComments((prev) => {
          // Prevent duplicates by ID if we get the same broadcast
          if (prev.find(c => c._id === payload.comment._id)) return prev;
          return [...prev, payload.comment];
        });
        if (onCommentAdded) {
          onCommentAdded(complaintId, payload.comment);
        }
      }
    };

    socket.on('newComment', handleNewComment);
    return () => {
      socket.off('newComment', handleNewComment);
    };
  }, [complaintId, onCommentAdded]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !canComment) return;

    setIsSubmitting(true);
    try {
      const response = await api.post(`/complaints/${complaintId}/comments`, { text: newComment });
      setNewComment('');
      // The socket event will append it for everyone, or we can manually append it here if we don't rely only on sockets
      // We'll trust the socket to deliver it back or we instantly append to our local state
      setComments((prev) => {
        if (prev.find(c => c._id === response.data.comment._id)) return prev;
        return [...prev, response.data.comment];
      });
      if (onCommentAdded) {
        onCommentAdded(complaintId, response.data.comment);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to post comment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: 'var(--spacing-lg)', borderTop: '1px solid var(--neutral-lighter)', paddingTop: 'var(--spacing-lg)' }}>
      <h4 style={{ color: 'var(--neutral-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Comments ({comments.length})
      </h4>

      <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
        <AnimatePresence>
          {comments.map((comment) => (
            <motion.div
              key={comment._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'var(--neutral-bg)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <strong style={{ color: 'var(--primary-main)' }}>{comment.user?.name || 'Citizen'}</strong>
                <span style={{ color: 'var(--neutral-medium)', fontSize: '0.75rem' }}>
                  {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p style={{ margin: 0, color: 'var(--neutral-dark)', lineHeight: 1.5 }}>
                {comment.text}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
        {comments.length === 0 && (
          <p style={{ color: 'var(--neutral-medium)', fontSize: 'var(--font-size-sm)', fontStyle: 'italic', margin: 0 }}>
            No comments yet. Be the first to discuss!
          </p>
        )}
      </div>

      {canComment ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            disabled={isSubmitting}
            maxLength={500}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              border: '1px solid var(--neutral-lighter)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            style={{
              background: 'var(--primary-main)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '0 1rem',
              cursor: !newComment.trim() || isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 'var(--font-size-sm)',
              opacity: !newComment.trim() || isSubmitting ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </form>
      ) : (
        <div style={{ background: 'rgba(102, 126, 234, 0.05)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <small style={{ color: 'var(--primary-main)', fontWeight: 600 }}>Log in to join the discussion</small>
        </div>
      )}
    </div>
  );
}
