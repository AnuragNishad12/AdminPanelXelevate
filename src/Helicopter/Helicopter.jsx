import React, { useState, useEffect } from 'react';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

import './Helicopter.css';



const HelicopterManagement = () => {
  const [helicopters, setHelicopters] = useState([]);
  const [selectedHelicopter, setSelectedHelicopter] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    capacity: '',
    speed: '',
    range: '',
    category: 'VIP',
    features: ['']
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch helicopters on component mount
  useEffect(() => {
    fetchHelicopters();
  }, []);

  const fetchHelicopters = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "helicopters"));
      const helicoptersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHelicopters(helicoptersList);
    } catch (error) {
      console.error("Error fetching helicopters: ", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFeatureChange = (index, value) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index] = value;
    setFormData({
      ...formData,
      features: updatedFeatures
    });
  };

  const addFeatureField = () => {
    setFormData({
      ...formData,
      features: [...formData.features, '']
    });
  };

  const removeFeatureField = (index) => {
    const updatedFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      features: updatedFeatures
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      capacity: '',
      speed: '',
      range: '',
      category: 'VIP',
      features: ['']
    });
    setImageFile(null);
    setImagePreview('');
    setIsEditing(false);
    setSelectedHelicopter(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';
      
      // Upload image to Firebase Storage
      if (imageFile) {
        const storageRef = ref(storage, `helicopters/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      // Prepare data for Firestore
      const helicopterData = {
        ...formData,
        price: formData.price,
        capacity: parseInt(formData.capacity),
        image: imageUrl || (selectedHelicopter ? selectedHelicopter.image : ''),
        features: formData.features.filter(feature => feature.trim() !== '')
      };

      if (isEditing && selectedHelicopter) {
        // Update existing helicopter
        const helicopterRef = doc(db, "helicopters", selectedHelicopter.id);
        await updateDoc(helicopterRef, helicopterData);
      } else {
        // Add new helicopter
        await addDoc(collection(db, "helicopters"), helicopterData);
      }

      resetForm();
      fetchHelicopters();
    } catch (error) {
      console.error("Error saving helicopter: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (helicopter) => {
    setSelectedHelicopter(helicopter);
    setFormData({
      title: helicopter.title,
      description: helicopter.description,
      price: helicopter.price,
      capacity: helicopter.capacity,
      speed: helicopter.speed,
      range: helicopter.range,
      category: helicopter.category || 'VIP',
      features: helicopter.features.length > 0 ? helicopter.features : ['']
    });
    setImagePreview(helicopter.image);
    setIsEditing(true);
  };

  const handleDelete = async (helicopterId, imageUrl) => {
    if (window.confirm("Are you sure you want to delete this helicopter?")) {
      try {
        // Delete document from Firestore
        await deleteDoc(doc(db, "helicopters", helicopterId));
        
        // Delete image from Storage if it exists
        if (imageUrl) {
          try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
          } catch (error) {
            console.error("Error deleting image: ", error);
          }
        }
        
        fetchHelicopters();
      } catch (error) {
        console.error("Error deleting helicopter: ", error);
      }
    }
  };

  return (
    <div className="management-container">
      {/* Form Section */}
      <div className="form-section">
        <div className="form-card">
          <p className="section-title">
            {isEditing ? "Update Helicopter Details" : "Add New Helicopter"}
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter helicopter model"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Enter detailed description"
                required
              ></textarea>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Price ($/hour)</label>
                <div className="price-input">
                  <span className="price-symbol">$</span>
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="2,500"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="6"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Speed</label>
                <input
                  type="text"
                  name="speed"
                  value={formData.speed}
                  onChange={handleInputChange}
                  placeholder="155 knots"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Range</label>
                <input
                  type="text"
                  name="range"
                  value={formData.range}
                  onChange={handleInputChange}
                  placeholder="380 nautical miles"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="VIP">VIP</option>
                <option value="Standard">Standard</option>
                <option value="Luxury">Luxury</option>
                <option value="Executive">Executive</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Image</label>
              <div className="image-upload-container">
                <label className="image-upload-label">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="image-preview" 
                    />
                  ) : (
                    <div className="upload-placeholder">
                      <svg className="upload-icon" viewBox="0 0 20 16">
                        <path d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p><span>Click to upload</span> or drag and drop</p>
                      <p className="file-hint">PNG, JPG or WEBP (MAX. 2MB)</p>
                    </div>
                  )}
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file-input"
                  />
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label>Features</label>
              <div className="features-container">
                {formData.features.map((feature, index) => (
                  <div key={index} className="feature-row">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      placeholder="Add feature"
                    />
                    {formData.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeatureField(index)}
                        className="remove-feature-btn"
                      >
                        <svg className="delete-icon" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeatureField}
                  className="add-feature-btn"
                >
                  <svg className="add-icon" viewBox="0 0 20 20">
                    <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                  </svg>
                  Add Feature
                </button>
              </div>
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                onClick={resetForm}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="spinner" viewBox="0 0 24 24">
                      <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="spinner-path" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  isEditing ? "Update Helicopter" : "Add Helicopter"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* List Section */}
      <div className="list-section">
        <div className="list-card">
          <div className="list-header">
            <p className="section-title">Helicopter Fleet</p>
            <span className="fleet-count">
              {helicopters.length} {helicopters.length === 1 ? 'Aircraft' : 'Aircraft'}
            </span>
          </div>
          
          {helicopters.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" viewBox="0 0 24 24">
                <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <p className="empty-title">No helicopters in your fleet yet.</p>
              <p className="empty-subtitle">Add your first helicopter to get started.</p>
            </div>
          ) : (
            <div className="helicopter-list">
              {helicopters.map((helicopter) => (
                <div key={helicopter.id} className="helicopter-card">
                  <div className="helicopter-content">
                    {helicopter.image ? (
                      <div className="helicopter-image">
                        <img
                          src={helicopter.image}
                          alt={helicopter.title}
                        />
                      </div>
                    ) : (
                      <div className="helicopter-image-placeholder">
                        <svg className="placeholder-icon" viewBox="0 0 24 24">
                          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="helicopter-details">
                      <div className="helicopter-header">
                        <h3 className="helicopter-title">{helicopter.title}</h3>
                        <div className="helicopter-category">{helicopter.category}</div>
                      </div>
                      <p className="helicopter-price">{helicopter.price}/hour</p>
                      <p className="helicopter-description">{helicopter.description}</p>
                      <div className="helicopter-specs">
                        <div className="spec-item">
                          <span className="spec-label">Capacity:</span>
                          <span className="spec-value">{helicopter.capacity} passengers</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Speed:</span>
                          <span className="spec-value">{helicopter.speed}</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Range:</span>
                          <span className="spec-value">{helicopter.range}</span>
                        </div>
                      </div>
                      <div className="helicopter-features">
                        <h4>Features:</h4>
                        <ul>
                          {helicopter.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="helicopter-actions">
                        <button
                          onClick={() => handleEdit(helicopter)}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(helicopter.id, helicopter.image)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelicopterManagement;
  