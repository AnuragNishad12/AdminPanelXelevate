import { useState, useEffect } from "react";
import { database, storage } from '../../src/firebaseConfig'; 
import { ref as dbRef, push, set, onValue, remove, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; // Add storage imports
import './ReviewForm.css';

export default function ReviewForm() {
  const [formData, setFormData] = useState({
    name: "",
    rating: 5,
    text: "",
    image: null // Change from string to file object
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: false, message: "" });
  const [reviews, setReviews] = useState([]);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const reviewsRef = dbRef(database, 'reviews');
    onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedReviews = data ? Object.entries(data).map(([id, value]) => ({ id, ...value })) : [];
      setReviews(loadedReviews.reverse());
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setFormData({ ...formData, [name]: files[0] }); // Store file object
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
        const imageStorageRef = storageRef(storage, `review-images/${Date.now()}-${formData.image.name}`);
        await uploadBytes(imageStorageRef, formData.image);
        imageUrl = await getDownloadURL(imageStorageRef);
      } else if (editId && formData.image) {
        imageUrl = formData.image; // Keep existing URL when editing if no new image
      }

      if (editId) {
        const reviewRef = dbRef(database, `reviews/${editId}`);
        await update(reviewRef, { 
          ...formData, 
          image: imageUrl,
          imageFile: null // Don't store the file object in database
        });
        setSubmitStatus({ success: true, message: "Review updated successfully!" });
      } else {
        const reviewsRef = dbRef(database, 'reviews');
        const newReviewRef = push(reviewsRef);
        await set(newReviewRef, {
          ...formData,
          image: imageUrl,
          imageFile: null, // Don't store the file object in database
          timestamp: Date.now()
        });
        setSubmitStatus({ success: true, message: "Review submitted successfully!" });
      }

      setFormData({ name: "", rating: 5, text: "", image: null });
      setEditId(null);
    } catch (error) {
      setSubmitStatus({ success: false, message: `Error: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const reviewRef = dbRef(database, `reviews/${id}`);
    await remove(reviewRef);
  };

  const handleEdit = (review) => {
    setFormData({
      name: review.name,
      rating: review.rating,
      text: review.text,
      image: review.image // Keep the URL string for editing
    });
    setEditId(review.id);
  };

  return (
    <div className="container-review">
      <div className="left-panel">
        <h2>Review Form</h2>
        {submitStatus.message && (
          <div className={`message ${submitStatus.success ? 'success' : 'error'}`}>
            {submitStatus.message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Rating (1-5):</label>
          <input
            type="number"
            name="rating"
            value={formData.rating}
            onChange={handleChange}
            min="1"
            max="5"
            required
          />

          <label>Review:</label>
          <textarea
            name="text"
            value={formData.text}
            onChange={handleChange}
            rows="4"
            required
          ></textarea>

          <label>Image:</label>
          <input
            type="file" // Change to file input
            name="image"
            onChange={handleChange}
            accept="image/*" // Accept only images
          />
          {formData.image && typeof formData.image === 'string' && (
            <img src={formData.image} alt="Preview" className="image-preview" style={{ maxWidth: '200px' }} />
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : editId ? "Update Review" : "Submit Review"}
          </button>
        </form>
      </div>

      <div className="right-panel">
        <h2>All Reviews</h2>
        {reviews.map((review) => (
          <div key={review.id} className="review-card">
            {review.image && <img src={review.image} alt={review.name} />}
            <div className="review-content">
              <h3>{review.name} ({review.rating}/5)</h3>
              <p>{review.text}</p>
              <div className="actions">
                <button onClick={() => handleEdit(review)}>Edit</button>
                <button onClick={() => handleDelete(review.id)} className="delete">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}