// AparthotelForm.jsx
import { useState } from "react";
import { database, ref, push, set } from "../../src/firebaseConfig";
import "./AparthotelForm.css"; // Import the custom CSS file

export default function AparthotelForm() {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    rating: "",
    ratingText: "",
    reviewCount: "",
    price: "",
    imageUrl:
      "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newHotelRef = push(ref(database, "admin/Dealoftehday"));
      await set(newHotelRef, formData);
      alert("Data saved successfully!");
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save data.");
    }
  };

  return (
    <div className="page-container">
      <div className="form-container">
        {/* Preview Section */}
        <div className="preview-section">
          <h3 className="preview-title">Preview</h3>
          <div className="preview-card">
            <img
              src={formData.imageUrl}
              alt="Hotel Preview"
              className="preview-image"
            />
            <div className="preview-details">
              <h4 className="preview-name">{formData.name}</h4>
              <p className="preview-location">{formData.location}</p>
              <div className="preview-rating">
                <span className="rating-value">{formData.rating}</span>
                <span className="rating-text">{formData.ratingText}</span>
                <span className="review-count">({formData.reviewCount})</span>
              </div>
              <p className="preview-price">{formData.price} PLN</p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit}>
          <h2 className="form-title">Deal of the Day</h2>

          <div className="form-group">
            <label className="form-label">
              Image URL
              <span className="help-icon" title="Provide a valid URL to an image of the hotel">?</span>
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., https://example.com/image.jpg"
              title="Provide a valid URL to an image of the hotel"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Name
              <span className="help-icon" title="Enter the full name of the hotel">?</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Aparthotel Stare Miasto"
              title="Enter the full name of the hotel"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Location
              <span className="help-icon" title="Enter the city and country (e.g., Old Town, Poland, Kraków)">?</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Old Town, Poland, Kraków"
              title="Enter the city and country (e.g., Old Town, Poland, Kraków)"
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Rating
                <span className="help-icon" title="Enter a numerical rating out of 10 (e.g., 8.8)">?</span>
              </label>
              <input
                type="text"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 8.8"
                title="Enter a numerical rating out of 10 (e.g., 8.8)"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Rating Text
                <span className="help-icon" title="Enter a descriptive word for the rating (e.g., Fabulous)">?</span>
              </label>
              <input
                type="text"
                name="ratingText"
                value={formData.ratingText}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Fabulous"
                title="Enter a descriptive word for the rating (e.g., Fabulous)"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Review Count
              <span className="help-icon" title="Enter the number of reviews (e.g., 3,177)">?</span>
            </label>
            <input
              type="text"
              name="reviewCount"
              value={formData.reviewCount}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., 3,177"
              title="Enter the number of reviews (e.g., 3,177)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Price (PLN)
              <span className="help-icon" title="Enter the price in PLN (e.g., 8,141)">?</span>
            </label>
            <input
              type="text"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., 8,141"
              title="Enter the price in PLN (e.g., 8,141)"
            />
          </div>

          <button type="submit" className="form-button">
            Save Deal
          </button>
        </form>
      </div>
    </div>
  );
}