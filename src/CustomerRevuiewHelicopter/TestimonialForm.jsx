// TestimonialForm.js
import { useState, useEffect } from 'react';
import { ref as dbRef, push, onValue, off, update, remove } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from '../firebaseConfig';
import './TestimonialForm.css';

const TestimonialForm = () => {
  const [formData, setFormData] = useState({
    id: null, // To track if we're editing
    name: '',
    message: '',
    designation: '',
    image: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testimonials, setTestimonials] = useState([]);

  // Fetch testimonials from Firebase
  useEffect(() => {
    const testimonialsRef = dbRef(database, 'testimonials');
    
    const unsubscribe = onValue(testimonialsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const testimonialsArray = Object.entries(data).map(([id, value]) => ({
          id,
          ...value
        }));
        setTestimonials(testimonialsArray);
      } else {
        setTestimonials([]);
      }
    }, (error) => {
      console.error('Error fetching testimonials:', error);
    });

    return () => off(testimonialsRef, 'value', unsubscribe);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file
      });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = formData.imageUrl || ''; // Keep existing image URL if editing and no new image is uploaded

      // Upload new image if provided
      if (formData.image) {
        const imageRef = storageRef(storage, `testimonials/${formData.image.name}`);
        await uploadBytes(imageRef, formData.image);
        imageUrl = await getDownloadURL(imageRef);
      }

      // If editing (id exists), update the testimonial; otherwise, create a new one
      if (formData.id) {
        const testimonialRef = dbRef(database, `testimonials/${formData.id}`);
        await update(testimonialRef, {
          name: formData.name,
          message: formData.message,
          designation: formData.designation,
          imageUrl: imageUrl,
          updatedAt: new Date().toISOString()
        });
        alert('Testimonial updated successfully!');
      } else {
        const testimonialsRef = dbRef(database, 'testimonials');
        await push(testimonialsRef, {
          name: formData.name,
          message: formData.message,
          designation: formData.designation,
          imageUrl: imageUrl,
          createdAt: new Date().toISOString()
        });
        alert('Testimonial submitted successfully!');
      }

      // Reset form
      setFormData({
        id: null,
        name: '',
        message: '',
        designation: '',
        image: null
      });
      setPreviewImage(null);
    } catch (error) {
      console.error('Error submitting/updating testimonial:', error);
      alert('Failed to submit/update testimonial. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (testimonial) => {
    setFormData({
      id: testimonial.id,
      name: testimonial.name,
      message: testimonial.message,
      designation: testimonial.designation,
      image: null,
      imageUrl: testimonial.imageUrl // Store existing image URL
    });
    setPreviewImage(testimonial.imageUrl);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this testimonial?')) {
      try {
        const testimonialRef = dbRef(database, `testimonials/${id}`);
        await remove(testimonialRef);
        alert('Testimonial deleted successfully!');
      } catch (error) {
        console.error('Error deleting testimonial:', error);
        alert('Failed to delete testimonial. Please try again.');
      }
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      id: null,
      name: '',
      message: '',
      designation: '',
      image: null
    });
    setPreviewImage(null);
  };

  return (
    <div className="testimonial-container">
      {/* Left Side: Form */}
      <div className="testimonial-form-container">
        <h2>{formData.id ? 'Edit Review' : 'Submit a Review'}</h2>
        <form onSubmit={handleSubmit} className="testimonial-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Enter your testimonial message"
              rows="4"
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="designation">Designation</label>
            <input
              type="text"
              id="designation"
              name="designation"
              value={formData.designation}
              onChange={handleInputChange}
              placeholder="Enter your designation (e.g., CEO, Global Enterprises)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Profile Image</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              required={!formData.id} // Image is required only for new testimonials
            />
            {previewImage && (
              <div className="image-preview">
                <img src={previewImage} alt="Preview" />
              </div>
            )}
          </div>

          <div className="form-buttons">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : formData.id ? 'Update Review' : 'Submit Review'}
            </button>
            {formData.id && (
              <button type="button" onClick={handleCancelEdit} className="cancel-button">
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right Side: Testimonials List */}
      <div className="testimonial-list-container">
        <h2>Review List</h2>
        {testimonials.length === 0 ? (
          <p>No testimonials available.</p>
        ) : (
          <div className="testimonials-grid">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="testimonial-card">
                <p className="message">"{testimonial.message}"</p>
                <div className="customer-info">
                  <img src={testimonial.imageUrl} alt={testimonial.name} className="customer-image" />
                  <div>
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.designation}</p>
                  </div>
                </div>
                <div className="action-buttons">
                  <button onClick={() => handleEdit(testimonial)} className="edit-button">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(testimonial.id)} className="delete-button">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestimonialForm;