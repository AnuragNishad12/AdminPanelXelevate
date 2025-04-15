import { useState, useEffect } from "react";
import { database, storage } from '../../src/firebaseConfig'; 
import { ref as dbRef, push, set, onValue, remove, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import './ReviewForm.css';

export default function ReviewForm() {
  const [formData, setFormData] = useState({
    name: "",
    rating: 5,
    text: "",
    image: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: false, message: "" });
  const [reviews, setReviews] = useState([]);
  const [editId, setEditId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const reviewsRef = dbRef(database, 'reviews');
    
    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedReviews = data 
        ? Object.entries(data)
            .map(([id, value]) => ({ id, ...value }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        : [];
      setReviews(loadedReviews);
      setIsLoading(false);
    }, (error) => {
      console.error("Error loading reviews:", error);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'image' && files && files[0]) {
      setFormData({ ...formData, [name]: files[0] });
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ success: false, message: "" });

    try {
      let imageUrl = '';
      
      // Upload image to Firebase Storage if exists
      if (formData.image && formData.image instanceof File) {
        const fileName = `${Date.now()}-${formData.image.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const imageStorageRef = storageRef(storage, `review-images/${fileName}`);
        await uploadBytes(imageStorageRef, formData.image);
        imageUrl = await getDownloadURL(imageStorageRef);
      } else if (editId && typeof formData.image === 'string') {
        imageUrl = formData.image; // Keep existing URL when editing if no new image
      }

      const reviewData = {
        name: formData.name,
        rating: Number(formData.rating),
        text: formData.text,
        image: imageUrl,
        updatedAt: Date.now()
      };

      if (editId) {
        const reviewRef = dbRef(database, `reviews/${editId}`);
        await update(reviewRef, reviewData);
        setSubmitStatus({ 
          success: true, 
          message: "Your review has been updated successfully!" 
        });
      } else {
        const reviewsRef = dbRef(database, 'reviews');
        const newReviewRef = push(reviewsRef);
        await set(newReviewRef, {
          ...reviewData,
          timestamp: Date.now()
        });
        setSubmitStatus({ 
          success: true, 
          message: "Thank you! Your review has been submitted successfully!" 
        });
      }

      // Reset form
      setFormData({ name: "", rating: 5, text: "", image: null });
      setImagePreview(null);
      setEditId(null);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus({ success: false, message: "" });
      }, 5000);
    } catch (error) {
      setSubmitStatus({ 
        success: false, 
        message: `Error: ${error.message}. Please try again.` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        const reviewRef = dbRef(database, `reviews/${id}`);
        await remove(reviewRef);
        setSubmitStatus({ 
          success: true, 
          message: "Review deleted successfully" 
        });
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setSubmitStatus({ success: false, message: "" });
        }, 3000);
      } catch (error) {
        setSubmitStatus({ 
          success: false, 
          message: `Error deleting review: ${error.message}` 
        });
      }
    }
  };

  const handleEdit = (review) => {
    setFormData({
      name: review.name,
      rating: review.rating,
      text: review.text,
      image: review.image
    });
    setImagePreview(review.image);
    setEditId(review.id);
    
    // Scroll to form
    document.querySelector('.review-form-section').scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  const cancelEdit = () => {
    setFormData({ name: "", rating: 5, text: "", image: null });
    setImagePreview(null);
    setEditId(null);
  };

  // Function to render star rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={`star ${i <= rating ? 'filled' : 'empty'}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  // Function to format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="review-container">
      <div className="review-header">
        <h1>Customer Reviews</h1>
        <p className="review-subtitle">Share your experience with our helicopter services</p>
      </div>
      
      <div className="review-content">
        <section className="review-form-section">
          <div className="review-form-container">
            <h2>{editId ? 'Edit Your Review' : 'Leave a Review'}</h2>
            
            {submitStatus.message && (
              <div className={`message-alert ${submitStatus.success ? 'success' : 'error'}`}>
                <span className="message-icon">{submitStatus.success ? '✓' : '!'}</span>
                <span className="message-text">{submitStatus.message}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="review-form">
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group rating-group">
                <label>Your Rating</label>
                <div className="rating-selector">
                  {[5, 4, 3, 2, 1].map((num) => (
                    <label key={num} className="rating-label">
                      <input
                        type="radio"
                        name="rating"
                        value={num}
                        checked={Number(formData.rating) === num}
                        onChange={handleChange}
                        required
                      />
                      <span className="rating-star">★</span>
                      <span className="rating-text">{num}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="text">Your Review</label>
                <textarea
                  id="text"
                  name="text"
                  value={formData.text}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Share details about your experience with our helicopter services..."
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="image">Upload Photo (Optional)</label>
                <div className="file-upload">
                  <input
                    type="file"
                    id="image"
                    name="image"
                    onChange={handleChange}
                    accept="image/*"
                    className="file-input"
                  />
                  <div className="file-upload-btn">
                    <span className="upload-icon">📷</span>
                    <span>Choose a photo</span>
                  </div>
                  {(formData.image instanceof File) && (
                    <span className="selected-file">{formData.image.name}</span>
                  )}
                </div>
                
                {imagePreview && (
                  <div className="image-preview-container">
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                    <button 
                      type="button" 
                      className="remove-image" 
                      onClick={() => {
                        setFormData({...formData, image: null});
                        setImagePreview(null);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="form-actions">
                {editId && (
                  <button 
                    type="button" 
                    onClick={cancelEdit} 
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                )}
                <button 
                  type="submit" 
                  className="submit-button" 
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? "Submitting..." 
                    : editId 
                      ? "Update Review" 
                      : "Submit Review"
                  }
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="reviews-section">
          <h2>Customer Feedback</h2>
          
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="no-reviews">
              <div className="no-reviews-icon">📝</div>
              <h3>No Reviews Yet</h3>
              <p>Be the first to share your experience!</p>
            </div>
          ) : (
            <div className="reviews-grid">
              {reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-card-header">
                    <h3>{review.name}</h3>
                    <div className="review-stars">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  
                  {review.image && (
                    <div className="review-image-container">
                      <img src={review.image} alt={`${review.name}'s experience`} className="review-image" />
                    </div>
                  )}
                  
                  <div className="review-text">
                    <p>{review.text}</p>
                  </div>
                  
                  <div className="review-footer">
                    <span className="review-date">
                      {formatDate(review.timestamp)}
                    </span>
                    <div className="review-actions">
                      <button 
                        onClick={() => handleEdit(review)} 
                        className="edit-button"
                        aria-label="Edit review"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(review.id)} 
                        className="delete-button"
                        aria-label="Delete review"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}