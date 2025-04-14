import React, { useState, useEffect } from 'react';
import { database, storage, ref as dbRef, set, push } from '../firebaseConfig';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { onValue, remove, update } from 'firebase/database';
import '../YachtManager/YachtManagementSystem.css'

function YachtManagementSystem() {
  // State for form data
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    route: '',
    image: null,
    additionalImages: [],
    specifications: {
      length: '',
      beam: '',
      draft: '',
      grossTonnage: '',
      cruisingSpeed: '',
      maxSpeed: '',
      built: '',
      builder: '',
      exterior: '',
      interior: '',
      guests: '',
      cabins: ''
    }
  });

  // State for yacht list
  const [yachts, setYachts] = useState([]);
  // State for editing
  const [editingId, setEditingId] = useState(null);
  // State for loading
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch yacht data from Firebase
    const yachtsRef = dbRef(database, 'yachts');
    const unsubscribe = onValue(yachtsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const yachtList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setYachts(yachtList);
      } else {
        setYachts([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (specifications)
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleCoverImageChange = (e) => {
    if (e.target.files[0]) {
      setFormData({
        ...formData,
        image: e.target.files[0]
      });
    }
  };

  const handleAdditionalImagesChange = (e) => {
    if (e.target.files) {
      // Convert FileList to array and limit to 5 images
      const filesArray = Array.from(e.target.files).slice(0, 5);
      setFormData({
        ...formData,
        additionalImages: filesArray
      });
    }
  };

  const uploadImage = async (file, path) => {
    const imageRef = storageRef(storage, path);
    await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';
      let additionalImageUrls = [];

      // Upload cover image
      if (formData.image) {
        const fileName = `yachts/${Date.now()}_${formData.image.name}`;
        imageUrl = await uploadImage(formData.image, fileName);
      }

      // Upload additional images
      if (formData.additionalImages.length > 0) {
        const uploadPromises = formData.additionalImages.map((file, index) => {
          const fileName = `yachts/${Date.now()}_${index}_${file.name}`;
          return uploadImage(file, fileName);
        });
        additionalImageUrls = await Promise.all(uploadPromises);
      }

      const yachtData = {
        name: formData.name,
        price: formData.price,
        route: formData.route,
        image: imageUrl,
        images: additionalImageUrls,
        specifications: formData.specifications,
      };

      // Update existing yacht or create new one
      if (editingId) {
        await update(dbRef(database, `yachts/${editingId}`), yachtData);
        setEditingId(null);
      } else {
        const newYachtRef = push(dbRef(database, 'yachts'));
        await set(newYachtRef, yachtData);
      }

      // Reset form
      setFormData({
        name: '',
        price: '',
        route: '',
        image: null,
        additionalImages: [],
        specifications: {
          length: '',
          beam: '',
          draft: '',
          grossTonnage: '',
          cruisingSpeed: '',
          maxSpeed: '',
          built: '',
          builder: '',
          exterior: '',
          interior: '',
          guests: '',
          cabins: ''
        }
      });

      // Reset file inputs
      document.getElementById('coverImage').value = '';
      document.getElementById('additionalImages').value = '';

    } catch (error) {
      console.error("Error submitting yacht data:", error);
      alert("Failed to save yacht data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (yacht) => {
    setEditingId(yacht.id);
    
    // Fill form with yacht data
    setFormData({
      name: yacht.name || '',
      price: yacht.price || '',
      route: yacht.route || '',
      image: null, // Can't set back the File object
      additionalImages: [], // Can't set back the File objects
      specifications: {
        length: yacht.specifications?.length || '',
        beam: yacht.specifications?.beam || '',
        draft: yacht.specifications?.draft || '',
        grossTonnage: yacht.specifications?.grossTonnage || '',
        cruisingSpeed: yacht.specifications?.cruisingSpeed || '',
        maxSpeed: yacht.specifications?.maxSpeed || '',
        built: yacht.specifications?.built || '',
        builder: yacht.specifications?.builder || '',
        exterior: yacht.specifications?.exterior || '',
        interior: yacht.specifications?.interior || '',
        guests: yacht.specifications?.guests || '',
        cabins: yacht.specifications?.cabins || ''
      }
    });

    // Scroll to form
    document.getElementById('yachtForm').scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (yacht) => {
    if (window.confirm(`Are you sure you want to delete ${yacht.name}?`)) {
      try {
        setLoading(true);
        
        // Delete cover image from storage
        if (yacht.image) {
          try {
            const imageRef = storageRef(storage, yacht.image);
            await deleteObject(imageRef);
          } catch (error) {
            console.error("Error deleting cover image:", error);
          }
        }
        
        // Delete additional images from storage
        if (yacht.images && yacht.images.length > 0) {
          for (const imageUrl of yacht.images) {
            try {
              const imageRef = storageRef(storage, imageUrl);
              await deleteObject(imageRef);
            } catch (error) {
              console.error("Error deleting additional image:", error);
            }
          }
        }
        
        // Delete yacht data from database
        await remove(dbRef(database, `yachts/${yacht.id}`));
        
      } catch (error) {
        console.error("Error deleting yacht:", error);
        alert("Failed to delete yacht. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      price: '',
      route: '',
      image: null,
      additionalImages: [],
      specifications: {
        length: '',
        beam: '',
        draft: '',
        grossTonnage: '',
        cruisingSpeed: '',
        maxSpeed: '',
        built: '',
        builder: '',
        exterior: '',
        interior: '',
        guests: '',
        cabins: ''
      }
    });
    document.getElementById('coverImage').value = '';
    document.getElementById('additionalImages').value = '';
  };

  return (
    <div className="yacht-container">
      {/* Form Section */}
      <div className="form-section">
        <h2>{editingId ? 'Edit Yacht' : 'Add New Yacht'}</h2>
        
        <form id="yachtForm" onSubmit={handleSubmit} className="space-y">
          {/* Basic Information */}
          <div className="space-y">
            <h3 className="form-section-title">Basic Information</h3>
            
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Price (per week)</label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Route</label>
              <input
                type="text"
                name="route"
                value={formData.route}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          {/* Images */}
          <div className="space-y">
            <h3 className="form-section-title">Images</h3>
            
            <div className="form-group">
              <label>Cover Image</label>
              <input
                id="coverImage"
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                required={!editingId}
              />
              {editingId && <p className="help-text">Leave empty to keep current image</p>}
            </div>
            
            <div className="form-group">
              <label>Additional Images (max 5)</label>
              <input
                id="additionalImages"
                type="file"
                accept="image/*"
                multiple
                onChange={handleAdditionalImagesChange}
              />
              {editingId && <p className="help-text">Upload new images to replace existing ones</p>}
            </div>
          </div>
          
          {/* Specifications */}
          <div className="space-y">
            <h3 className="form-section-title">Specifications</h3>
            
            <div className="specs-grid">
              <div className="form-group">
                <label>Length</label>
                <input
                  type="text"
                  name="specifications.length"
                  value={formData.specifications.length}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Beam</label>
                <input
                  type="text"
                  name="specifications.beam"
                  value={formData.specifications.beam}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Draft</label>
                <input
                  type="text"
                  name="specifications.draft"
                  value={formData.specifications.draft}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Gross Tonnage</label>
                <input
                  type="text"
                  name="specifications.grossTonnage"
                  value={formData.specifications.grossTonnage}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Cruising Speed</label>
                <input
                  type="text"
                  name="specifications.cruisingSpeed"
                  value={formData.specifications.cruisingSpeed}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Max Speed</label>
                <input
                  type="text"
                  name="specifications.maxSpeed"
                  value={formData.specifications.maxSpeed}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Built</label>
                <input
                  type="text"
                  name="specifications.built"
                  value={formData.specifications.built}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Builder</label>
                <input
                  type="text"
                  name="specifications.builder"
                  value={formData.specifications.builder}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Exterior</label>
                <input
                  type="text"
                  name="specifications.exterior"
                  value={formData.specifications.exterior}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Interior</label>
                <input
                  type="text"
                  name="specifications.interior"
                  value={formData.specifications.interior}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Guests</label>
                <input
                  type="number"
                  name="specifications.guests"
                  value={formData.specifications.guests}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Cabins</label>
                <input
                  type="number"
                  name="specifications.cabins"
                  value={formData.specifications.cabins}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="button-container">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="button button-secondary"
                disabled={loading}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="button button-primary"
              disabled={loading}
            >
              {loading ? 'Processing...' : editingId ? 'Update Yacht' : 'Add Yacht'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Yacht List Section */}
      <div className="list-section">
        <h2>Yacht List</h2>
        
        {yachts.length === 0 ? (
          <div className="empty-list">
            <p>No yachts added yet</p>
          </div>
        ) : (
          <div className="yacht-list">
            {yachts.map((yacht) => (
              <div key={yacht.id} className="yacht-card">
                <div className="yacht-content">
                  {/* Yacht Image */}
                  <div className="yacht-image-container">
                    {yacht.image ? (
                      <img 
                        src={yacht.image} 
                        alt={yacht.name} 
                        className="yacht-image"
                      />
                    ) : (
                      <div className="no-image">
                        <span>No Image</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Yacht Details */}
                  <div className="yacht-details">
                    <h3 className="yacht-name">{yacht.name}</h3>
                    <p className="yacht-price">{yacht.price}</p>
                    <p className="yacht-route">{yacht.route}</p>
                    
                    <div className="yacht-specs">
                      <h4>Specifications:</h4>
                      <div className="specs-display-grid">
                        <p><span className="spec-label">Length:</span> {yacht.specifications?.length}</p>
                        <p><span className="spec-label">Guests:</span> {yacht.specifications?.guests}</p>
                        <p><span className="spec-label">Cabins:</span> {yacht.specifications?.cabins}</p>
                        <p><span className="spec-label">Builder:</span> {yacht.specifications?.builder}</p>
                      </div>
                    </div>
                    
                    <div className="yacht-actions">
                      <button
                        onClick={() => handleEdit(yacht)}
                        className="button button-primary button-small"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(yacht)}
                        className="button button-danger button-small"
                        disabled={loading}
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
  );
}

export default YachtManagementSystem;