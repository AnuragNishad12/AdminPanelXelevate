import React, { useState, useEffect, useRef } from "react";
import { ref, push, set, onValue, remove } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { database, storage } from "../firebaseConfig";
import "./AircraftForm.css";

const AircraftForm = () => {
  // Initial form state
  const initialFormData = {
    name: "",
    aircraftType: "",
    destination: "",
    price: "",
    images: [],
    shortDescription: "",
    aircraftDetails: {
      guestCapacity: 0,
      numberOfPilots: 0,
      numberOfFlightAttendants: 0,
      luggageCapacity: 0,
      numberOfLavatory: 0,
      wifiAvailable: "No"
    },
    technicalSpecifications: {
      exterior: {
        length: "",
        wingspan: "",
        height: ""
      },
      range: {
        rangeKm: ""
      },
      speed: {
        highSpeed: "",
        typicalCruiseSpeed: ""
      },
      engines: {
        engineModel: "",
        thrustKN: "",
        flatRatedTo: ""
      },
      airfieldPerformance: {
        takeOffDistance: "",
        landingDistance: ""
      },
      avionics: "",
      operatingAltitude: ""
    }
  };

  const [formData, setFormData] = useState(initialFormData);
  const [aircraftList, setAircraftList] = useState([]);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // File upload states
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Fetch aircraft data
  useEffect(() => {
    const aircraftRef = ref(database, 'aircraft');
    const unsubscribe = onValue(aircraftRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const aircraftArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setAircraftList(aircraftArray);
      } else {
        setAircraftList([]);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Handle basic field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle nested object changes
  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Handle deeply nested object changes
  const handleDeepNestedChange = (section, subsection, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value
        }
      }
    }));
  };

  // Trigger file input click
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Limit to 4 images
    if (files.length > 4) {
      setAlert({
        show: true,
        type: "error",
        message: "You can only select up to 4 images"
      });
      setTimeout(() => {
        setAlert({ show: false, type: "", message: "" });
      }, 3000);
      return;
    }
    
    // Clear existing selections if selecting new files in non-edit mode
    if (!editMode) {
      setImageFiles(files);
      
      // Generate preview URLs
      const newPreviews = [];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          if (newPreviews.length === files.length) {
            setImagePreviewUrls(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      // In edit mode, only allow selecting up to 4 images total
      const totalImagesAfterAdd = imageFiles.length + files.length;
      if (totalImagesAfterAdd > 4) {
        setAlert({
          show: true,
          type: "error",
          message: "You can only have a maximum of 4 images"
        });
        setTimeout(() => {
          setAlert({ show: false, type: "", message: "" });
        }, 3000);
        return;
      }
      
      // Add new files to existing ones
      setImageFiles(prev => [...prev, ...files]);
      
      // Generate preview URLs for new files
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviewUrls(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove image from selection
  const removeImage = (index) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviewUrls];
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setImageFiles(newFiles);
    setImagePreviewUrls(newPreviews);
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    setEditMode(false);
    setEditId(null);
    setImageFiles([]);
    setImagePreviewUrls([]);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Load aircraft data for editing
  const handleEdit = (aircraft) => {
    setFormData({...aircraft});
    setEditMode(true);
    setEditId(aircraft.id);
    
    // Reset image states
    setImageFiles([]);
    setImagePreviewUrls(aircraft.images || []);
    
    window.scrollTo(0, 0);
  };

  // Delete aircraft
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this aircraft?")) {
      try {
        // First, get the aircraft to access its image URLs
        const aircraftRef = ref(database, `aircraft/${id}`);
        const snapshot = await new Promise((resolve) => {
          onValue(aircraftRef, resolve, { onlyOnce: true });
        });
        
        const aircraft = snapshot.val();
        
        // Delete images from storage if they exist
        if (aircraft && aircraft.images && aircraft.images.length > 0) {
          const deletePromises = aircraft.images.map(async (imageUrl) => {
            try {
              // Extract the file path from the URL
              const urlPath = imageUrl.split('?')[0];
              const fileName = urlPath.split('/').pop();
              const imagePath = `aircraft_images/${id}/${fileName}`;
              const imageRef = storageRef(storage, imagePath);
              
              await deleteObject(imageRef);
            } catch (error) {
              console.error("Error deleting image:", error);
            }
          });
          
          await Promise.all(deletePromises);
        }
        
        // Then delete the database entry
        await remove(aircraftRef);
        
        setAlert({
          show: true,
          type: "success",
          message: "Aircraft deleted successfully!"
        });
        setTimeout(() => {
          setAlert({ show: false, type: "", message: "" });
        }, 3000);
      } catch (error) {
        console.error("Error deleting data:", error);
        setAlert({
          show: true,
          type: "error",
          message: `Error: ${error.message}`
        });
      }
    }
  };

  // Upload images to Firebase Storage
  const uploadImages = async (aircraftId) => {
    if (imageFiles.length === 0 && imagePreviewUrls.length === 0) {
      return [];
    }
    
    // If in edit mode and no new files are selected, return existing URLs
    if (editMode && imageFiles.length === 0 && imagePreviewUrls.length > 0) {
      return formData.images || [];
    }
    
    const uploadPromises = [];
    const urls = [];
    
    // Upload new files
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileName = `${Date.now()}_${file.name}`;
      const imageRef = storageRef(storage, `aircraft_images/${aircraftId}/${fileName}`);
      
      const uploadTask = uploadBytes(imageRef, file)
        .then(snapshot => {
          setUploadProgress((i + 1) / imageFiles.length * 100);
          return getDownloadURL(snapshot.ref);
        })
        .then(url => {
          urls.push(url);
        });
      
      uploadPromises.push(uploadTask);
    }
    
    // Wait for all uploads to complete
    await Promise.all(uploadPromises);
    
    // If in edit mode, include existing URLs that weren't replaced
    if (editMode && formData.images) {
      const existingUrls = formData.images.filter(url => imagePreviewUrls.includes(url));
      return [...existingUrls, ...urls];
    }
    
    return urls;
  };

  // Save data to Firebase
  const handleSave = async () => {
    // Validate that we have at least one image
    if (imageFiles.length === 0 && (!editMode || (editMode && imagePreviewUrls.length === 0))) {
      setAlert({
        show: true,
        type: "error",
        message: "Please select at least one image"
      });
      setTimeout(() => {
        setAlert({ show: false, type: "", message: "" });
      }, 3000);
      return;
    }
    
    // Validate that we have no more than 4 images
    if (imageFiles.length > 4 || (editMode && imagePreviewUrls.length > 4)) {
      setAlert({
        show: true,
        type: "error",
        message: "You can only have a maximum of 4 images"
      });
      setTimeout(() => {
        setAlert({ show: false, type: "", message: "" });
      }, 3000);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create a reference to the database
      const aircraftRef = editMode
        ? ref(database, `aircraft/${editId}`) 
        : push(ref(database, 'aircraft'));
      
      // Get the ID (either existing or newly generated)
      const aircraftId = editMode ? editId : aircraftRef.key;
      
      // Upload images to Firebase Storage
      const imageUrls = await uploadImages(aircraftId);
      
      // Prepare data
      const dataToSave = { 
        ...formData,
        images: imageUrls,
      };
      
      // Remove ID if present
      if (dataToSave.id) {
        delete dataToSave.id;
      }
      
      // Save to Realtime Database
      await set(aircraftRef, dataToSave);
      
      // Show success message
      setAlert({
        show: true,
        type: "success",
        message: editMode ? "Aircraft updated successfully!" : "Aircraft added successfully!"
      });
      
      // Reset form
      resetForm();
      
      // Clear alert after 3 seconds
      setTimeout(() => {
        setAlert({ show: false, type: "", message: "" });
      }, 3000);
      
    } catch (error) {
      console.error("Error saving data:", error);
      setAlert({
        show: true,
        type: "error",
        message: `Error: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="aircraft-management">
      {/* Alert Dialog */}
      {alert.show && (
        <div className={`alert ${alert.type === "success" ? "alert-success" : "alert-error"}`}>
          <div className="alert-content">
            <span className="alert-icon">
              {alert.type === "success" ? (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            {alert.message}
          </div>
        </div>
      )}

      <div className="container">
        {/* Left Column - Form */}
        <div className="form-container">
          <div className="form-wrapper">
            <h1 className="page-title">
              {editMode ? "Edit Aircraft" : "Add New Aircraft"}
            </h1>

            {/* Basic Information */}
            <div className="form-section">
              <h2 className="section-title">Basic Information</h2>
              
              <div className="form-group">
                <label>Aircraft Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Global 6000"
                />
              </div>
              
              <div className="form-group">
                <label>Aircraft Type</label>
                <input
                  type="text"
                  name="aircraftType"
                  value={formData.aircraftType}
                  onChange={handleChange}
                  placeholder="e.g. Large Jet"
                />
              </div>
              
              <div className="form-group">
                <label>Destination</label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  placeholder="e.g. Delhi -------> Goa"
                />
              </div>
              
              <div className="form-group">
                <label>Price</label>
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g. ₹800000"
                />
              </div>
              
              <div className="form-group">
                <label>Short Description</label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Brief description of the aircraft..."
                ></textarea>
              </div>
            </div>
            
            {/* Images Upload */}
            <div className="form-section">
              <h2 className="section-title">Images (Max 4)</h2>
              
              <div className="form-group">
                <label>Upload Images</label>
                {/* Added visible button for selecting files */}
                <div className="file-upload-container">
                  <button 
                    type="button" 
                    className="btn btn-secondary file-select-btn"
                    onClick={handleBrowseClick}
                  >
                    Browse Files
                  </button>
                  <span className="selected-file-info">
                    {imageFiles.length > 0 ? `${imageFiles.length} file(s) selected` : "No files selected"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    ref={fileInputRef}
                    className="file-input"
                    style={{ display: 'none' }} // Hide the actual input
                  />
                </div>
                <small className="help-text">Select up to 4 images for the aircraft</small>
              </div>
              
              {/* Image Previews */}
              {imagePreviewUrls.length > 0 && (
                <div className="image-previews">
                  {imagePreviewUrls.map((url, index) => (
                    <div className="image-preview-item" key={index}>
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`} 
                      />
                      <button 
                        type="button" 
                        className="remove-image-btn"
                        onClick={() => removeImage(index)}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16">
                          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Upload Progress */}
              {uploadProgress > 0 && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{uploadProgress.toFixed(0)}% Uploaded</span>
                </div>
              )}
            </div>
            
            {/* Aircraft Details */}
            <div className="form-section">
              <h2 className="section-title">Aircraft Details</h2>
              
              <div className="form-group">
                <label>Guest Capacity</label>
                <input
                  type="number"
                  value={formData.aircraftDetails.guestCapacity}
                  onChange={(e) => handleNestedChange('aircraftDetails', 'guestCapacity', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="form-group">
                <label>Number of Pilots</label>
                <input
                  type="number"
                  value={formData.aircraftDetails.numberOfPilots}
                  onChange={(e) => handleNestedChange('aircraftDetails', 'numberOfPilots', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="form-group">
                <label>Number of Flight Attendants</label>
                <input
                  type="number"
                  value={formData.aircraftDetails.numberOfFlightAttendants}
                  onChange={(e) => handleNestedChange('aircraftDetails', 'numberOfFlightAttendants', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="form-group">
                <label>Luggage Capacity</label>
                <input
                  type="number"
                  value={formData.aircraftDetails.luggageCapacity}
                  onChange={(e) => handleNestedChange('aircraftDetails', 'luggageCapacity', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="form-group">
                <label>Number of Lavatories</label>
                <input
                  type="number"
                  value={formData.aircraftDetails.numberOfLavatory}
                  onChange={(e) => handleNestedChange('aircraftDetails', 'numberOfLavatory', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="form-group">
                <label>WiFi Available</label>
                <select
                  value={formData.aircraftDetails.wifiAvailable}
                  onChange={(e) => handleNestedChange('aircraftDetails', 'wifiAvailable', e.target.value)}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
            
            {/* Technical Specifications */}
            <div className="form-section">
              <h2 className="section-title">Technical Specifications</h2>
              
              {/* Exterior */}
              <div className="subsection">
                <h3 className="subsection-title">Exterior</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Length</label>
                    <input
                      type="text"
                      value={formData.technicalSpecifications.exterior.length}
                      onChange={(e) => handleDeepNestedChange('technicalSpecifications', 'exterior', 'length', e.target.value)}
                      placeholder="e.g. 99.5 ft"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Wingspan</label>
                    <input
                      type="text"
                      value={formData.technicalSpecifications.exterior.wingspan}
                      onChange={(e) => handleDeepNestedChange('technicalSpecifications', 'exterior', 'wingspan', e.target.value)}
                      placeholder="e.g. 94 ft"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Height</label>
                    <input
                      type="text"
                      value={formData.technicalSpecifications.exterior.height}
                      onChange={(e) => handleDeepNestedChange('technicalSpecifications', 'exterior', 'height', e.target.value)}
                      placeholder="e.g. 25 ft"
                    />
                  </div>
                </div>
              </div>
              
              {/* Range */}
              <div className="subsection">
                <h3 className="subsection-title">Range</h3>
                <div className="form-group">
                  <label>Range (km)</label>
                  <input
                    type="text"
                    value={formData.technicalSpecifications.range.rangeKm}
                    onChange={(e) => handleDeepNestedChange('technicalSpecifications', 'range', 'rangeKm', e.target.value)}
                    placeholder="e.g. 11112 Km"
                  />
                </div>
              </div>
              
              {/* Speed */}
              <div className="subsection">
                <h3 className="subsection-title">Speed</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>High Speed</label>
                    <input
                      type="text"
                      value={formData.technicalSpecifications.speed.highSpeed}
                      onChange={(e) => handleDeepNestedChange('technicalSpecifications', 'speed', 'highSpeed', e.target.value)}
                      placeholder="e.g. 944 Km/Hr"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Typical Cruise Speed</label>
                    <input
                      type="text"
                      value={formData.technicalSpecifications.speed.typicalCruiseSpeed}
                      onChange={(e) => handleDeepNestedChange('technicalSpecifications', 'speed', 'typicalCruiseSpeed', e.target.value)}
                      placeholder="e.g. 944 Km/Hr"
                    />
                  </div>
                </div>
              </div>
              
              {/* Other specs */}
              <div className="subsection">
                <h3 className="subsection-title">Operating Altitude</h3>
                <div className="form-group">
                  <input
                    type="text"
                    value={formData.technicalSpecifications.operatingAltitude}
                    onChange={(e) => handleNestedChange('technicalSpecifications', 'operatingAltitude', e.target.value)}
                    placeholder="e.g. 51,000 ft"
                  />
                </div>
              </div>
            </div>
            
            {/* Form Buttons */}
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={resetForm}
              >
                {editMode ? "Cancel" : "Reset"}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="loading-spinner">
                    <svg className="spinner" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  editMode ? "Update Aircraft" : "Save Aircraft"
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Right Column - Aircraft List */}
        <div className="list-container">
          <h2 className="section-title">Aircraft List</h2>
          
          {aircraftList.length === 0 ? (
            <div className="empty-state">
              <p>No aircraft added yet</p>
            </div>
          ) : (
            <div className="aircraft-list">
              {aircraftList.map(aircraft => (
                <div className="aircraft-card" key={aircraft.id}>
                  <div className="aircraft-card-header">
                    <h3>{aircraft.name}</h3>
                    <div className="card-actions">
                      <button 
                        className="btn-icon btn-edit" 
                        onClick={() => handleEdit(aircraft)}
                        title="Edit"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16">
                          <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                      </button>
                      <button 
                        className="btn-icon btn-delete" 
                        onClick={() => handleDelete(aircraft.id)}
                        title="Delete"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16">
                          <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="aircraft-card-content">
                    <div className="aircraft-info">
                      <p><strong>Type:</strong> {aircraft.aircraftType}</p>
                      <p><strong>Destination:</strong> {aircraft.destination}</p>
                      <p><strong>Price:</strong> {aircraft.price}</p>
                      <p><strong>Capacity:</strong> {aircraft.aircraftDetails?.guestCapacity || 0} guests</p>
                    </div>
                    {aircraft.images && aircraft.images[0] && (
                      <div className="aircraft-image">
                        <img src={aircraft.images[0]} alt={aircraft.name} onError={(e) => e.target.src = '/placeholder.jpg'} />
                      </div>
                    )}
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

export default AircraftForm;