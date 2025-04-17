import React, { useState, useEffect } from "react";
import { ref, set, onValue, remove, update } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { database, storage } from "../firebaseConfig";
import './Helicopter.css';

function HelicopterManagement() {
  const [helicopters, setHelicopters] = useState([]);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    capacity: '',
    category: '',
    description: '',
    price: '',
    range: '',
    speed: '',
    image: null,
    imageUrl: '',
    performance: {
      maxSpeed: '',
      cruiseSpeed: '',
      range: '',
      serviceCeiling: '',
      rateOfClimb: ''
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    // Fetch helicopters from Firebase
    const helicoptersRef = ref(database, 'helicopters');
    onValue(helicoptersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const helicoptersList = Object.entries(data).map(([id, values]) => ({
          id,
          ...values
        }));
        setHelicopters(helicoptersList);
      } else {
        setHelicopters([]);
      }
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('performance.')) {
      const perfKey = name.split('.')[1];
      setFormData({
        ...formData,
        performance: {
          ...formData.performance,
          [perfKey]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setFormData({
        ...formData,
        image: e.target.files[0]
      });
      
      // Show image preview
      setPreviewImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const uploadImage = async () => {
    if (!formData.image) return null;
    
    const timestamp = new Date().getTime();
    const fileRef = storageRef(storage, `helicopters/${timestamp}_${formData.image.name}`);
    
    await uploadBytes(fileRef, formData.image);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let imageUrl = formData.imageUrl;
    
    // Upload image if there's a new one
    if (formData.image) {
      imageUrl = await uploadImage();
    }
    
    const helicopterData = {
      title: formData.title,
      capacity: formData.capacity,
      category: formData.category,
      description: formData.description,
      price: formData.price,
      range: formData.range,
      speed: formData.speed,
      imageUrl: imageUrl,
      performance: formData.performance
    };
    
    if (isEditing) {
      // Update existing helicopter
      const updates = {};
      updates[`helicopters/${formData.id}`] = helicopterData;
      update(ref(database), updates);
    } else {
      // Add new helicopter
      const newHelicopterRef = ref(database, `helicopters/${Date.now()}`);
      set(newHelicopterRef, helicopterData);
    }
    
    // Reset form
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      id: '',
      title: '',
      capacity: '',
      category: '',
      description: '',
      price: '',
      range: '',
      speed: '',
      image: null,
      imageUrl: '',
      performance: {
        maxSpeed: '',
        cruiseSpeed: '',
        range: '',
        serviceCeiling: '',
        rateOfClimb: ''
      }
    });
    setIsEditing(false);
    setPreviewImage(null);
  };

  const handleEdit = (helicopter) => {
    setFormData({
      id: helicopter.id,
      title: helicopter.title,
      capacity: helicopter.capacity,
      category: helicopter.category,
      description: helicopter.description,
      price: helicopter.price,
      range: helicopter.range,
      speed: helicopter.speed,
      image: null,
      imageUrl: helicopter.imageUrl,
      performance: helicopter.performance || {
        maxSpeed: '',
        cruiseSpeed: '',
        range: '',
        serviceCeiling: '',
        rateOfClimb: ''
      }
    });
    setPreviewImage(helicopter.imageUrl);
    setIsEditing(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this helicopter?')) {
      remove(ref(database, `helicopters/${id}`));
    }
  };

  return (
    <div className="helicopter-app">
      <header className="helicopter-header">
        <h1>Helicopter Fleet Management</h1>
      </header>
      <div className="helicopter-container">
        <div className="helicopter-form-container">
          <h2 className="section-title">{isEditing ? 'Edit Helicopter' : 'Add New Helicopter'}</h2>
          <form onSubmit={handleSubmit} className="helicopter-form">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter helicopter title"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group half">
                <label>Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  required
                  placeholder="Passenger capacity"
                />
              </div>
              
              <div className="form-group half">
                <label>Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Commercial, Medical"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Enter detailed description"
                rows="4"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group third">
                <label>Price</label>
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  placeholder="Price"
                />
              </div>
              
              <div className="form-group third">
                <label>Range (km)</label>
                <input
                  type="text"
                  name="range"
                  value={formData.range}
                  onChange={handleInputChange}
                  required
                  placeholder="Range in km"
                />
              </div>
              
              <div className="form-group third">
                <label>Speed (km/h)</label>
                <input
                  type="text"
                  name="speed"
                  value={formData.speed}
                  onChange={handleInputChange}
                  required
                  placeholder="Speed in km/h"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Image</label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="helicopter-image"
                  onChange={handleImageChange}
                  accept="image/*"
                  className="file-input"
                />
                <label htmlFor="helicopter-image" className="file-input-label">
                  {formData.image ? formData.image.name : 'Choose file'}
                </label>
              </div>
              {previewImage && (
                <div className="image-preview">
                  <img src={previewImage} alt="Preview" />
                </div>
              )}
            </div>
            
            <h3 className="form-section-title">Performance Specifications</h3>
            
            <div className="form-row">
              <div className="form-group half">
                <label>Maximum Speed (km/h)</label>
                <input
                  type="text"
                  name="performance.maxSpeed"
                  value={formData.performance.maxSpeed}
                  onChange={handleInputChange}
                  placeholder="Max speed"
                />
              </div>
              
              <div className="form-group half">
                <label>Cruise Speed (km/h)</label>
                <input
                  type="text"
                  name="performance.cruiseSpeed"
                  value={formData.performance.cruiseSpeed}
                  onChange={handleInputChange}
                  placeholder="Cruise speed"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group half">
                <label>Range (km)</label>
                <input
                  type="text"
                  name="performance.range"
                  value={formData.performance.range}
                  onChange={handleInputChange}
                  placeholder="Performance range"
                />
              </div>
              
              <div className="form-group half">
                <label>Service Ceiling (m)</label>
                <input
                  type="text"
                  name="performance.serviceCeiling"
                  value={formData.performance.serviceCeiling}
                  onChange={handleInputChange}
                  placeholder="Service ceiling"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Rate of Climb (m/s)</label>
              <input
                type="text"
                name="performance.rateOfClimb"
                value={formData.performance.rateOfClimb}
                onChange={handleInputChange}
                placeholder="Rate of climb"
              />
            </div>
            
            <div className="form-buttons">
              <button type="submit" className="btn btn-primary">
                {isEditing ? 'Update Helicopter' : 'Add Helicopter'}
              </button>
              {isEditing && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        
        <div className="helicopter-list-container">
          <h2 className="section-title">Helicopter Fleet</h2>
          {helicopters.length === 0 ? (
            <div className="empty-state">
              <i className="empty-icon">🚁</i>
              <p>No helicopters available.</p>
              <p className="empty-hint">Add your first helicopter using the form.</p>
            </div>
          ) : (
            <div className="helicopter-list">
              {helicopters.map(helicopter => (
                <div key={helicopter.id} className="helicopter-card">
                  <div className="helicopter-image">
                    {helicopter.imageUrl ? (
                      <img src={helicopter.imageUrl} alt={helicopter.title} />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  <div className="helicopter-details">
                    <h3 className="helicopter-title">{helicopter.title}</h3>
                    
                    <div className="helicopter-specs">
                      <div className="spec-item">
                        <span className="spec-label">Capacity</span>
                        <span className="spec-value">{helicopter.capacity}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Category</span>
                        <span className="spec-value">{helicopter.category}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Price</span>
                        <span className="spec-value">{helicopter.price}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Range</span>
                        <span className="spec-value">{helicopter.range} km</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Speed</span>
                        <span className="spec-value">{helicopter.speed} km/h</span>
                      </div>
                    </div>
                    
                    <div className="helicopter-performance">
                      <h4 className="performance-title">Performance Data</h4>
                      {helicopter.performance ? (
                        <div className="performance-grid">
                          <div className="perf-item">
                            <span className="perf-label">Max Speed</span>
                            <span className="perf-value">{helicopter.performance.maxSpeed} km/h</span>
                          </div>
                          <div className="perf-item">
                            <span className="perf-label">Cruise Speed</span>
                            <span className="perf-value">{helicopter.performance.cruiseSpeed} km/h</span>
                          </div>
                          <div className="perf-item">
                            <span className="perf-label">Range</span>
                            <span className="perf-value">{helicopter.performance.range} km</span>
                          </div>
                          <div className="perf-item">
                            <span className="perf-label">Service Ceiling</span>
                            <span className="perf-value">{helicopter.performance.serviceCeiling} m</span>
                          </div>
                          <div className="perf-item">
                            <span className="perf-label">Rate of Climb</span>
                            <span className="perf-value">{helicopter.performance.rateOfClimb} m/s</span>
                          </div>
                        </div>
                      ) : (
                        <p className="no-data">No performance data available</p>
                      )}
                    </div>
                    
                    <div className="helicopter-description">
                      <p>{helicopter.description}</p>
                    </div>
                    
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleEdit(helicopter)}
                        className="btn btn-edit"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(helicopter.id)}
                        className="btn btn-delete"
                      >
                        Delete
                      </button>
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
}

export default HelicopterManagement;