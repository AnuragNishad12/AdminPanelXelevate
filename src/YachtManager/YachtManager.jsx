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
    <div className="flex flex-col md:flex-row p-4 gap-6">
      {/* Form Section */}
      <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">{editingId ? 'Edit Yacht' : 'Add New Yacht'}</h2>
        
        <form id="yachtForm" onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Price (per week)</label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Route</label>
              <input
                type="text"
                name="route"
                value={formData.route}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Images</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Cover Image</label>
              <input
                id="coverImage"
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required={!editingId}
              />
              {editingId && <p className="text-sm text-gray-500 mt-1">Leave empty to keep current image</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Additional Images (max 5)</label>
              <input
                id="additionalImages"
                type="file"
                accept="image/*"
                multiple
                onChange={handleAdditionalImagesChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {editingId && <p className="text-sm text-gray-500 mt-1">Upload new images to replace existing ones</p>}
            </div>
          </div>
          
          {/* Specifications */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Specifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Length</label>
                <input
                  type="text"
                  name="specifications.length"
                  value={formData.specifications.length}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Beam</label>
                <input
                  type="text"
                  name="specifications.beam"
                  value={formData.specifications.beam}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Draft</label>
                <input
                  type="text"
                  name="specifications.draft"
                  value={formData.specifications.draft}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Gross Tonnage</label>
                <input
                  type="text"
                  name="specifications.grossTonnage"
                  value={formData.specifications.grossTonnage}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Cruising Speed</label>
                <input
                  type="text"
                  name="specifications.cruisingSpeed"
                  value={formData.specifications.cruisingSpeed}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Speed</label>
                <input
                  type="text"
                  name="specifications.maxSpeed"
                  value={formData.specifications.maxSpeed}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Built</label>
                <input
                  type="text"
                  name="specifications.built"
                  value={formData.specifications.built}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Builder</label>
                <input
                  type="text"
                  name="specifications.builder"
                  value={formData.specifications.builder}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Exterior</label>
                <input
                  type="text"
                  name="specifications.exterior"
                  value={formData.specifications.exterior}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Interior</label>
                <input
                  type="text"
                  name="specifications.interior"
                  value={formData.specifications.interior}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Guests</label>
                <input
                  type="number"
                  name="specifications.guests"
                  value={formData.specifications.guests}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Cabins</label>
                <input
                  type="number"
                  name="specifications.cabins"
                  value={formData.specifications.cabins}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-between pt-4">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                disabled={loading}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? 'Processing...' : editingId ? 'Update Yacht' : 'Add Yacht'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Yacht List Section */}
      <div className="w-full md:w-1/2">
        <h2 className="text-2xl font-bold mb-6">Yacht List</h2>
        
        {yachts.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-500">No yachts added yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {yachts.map((yacht) => (
              <div key={yacht.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex flex-col md:flex-row">
                  {/* Yacht Image */}
                  <div className="w-full md:w-1/3 mb-4 md:mb-0">
                    {yacht.image ? (
                      <img 
                        src={yacht.image} 
                        alt={yacht.name} 
                        className="w-full h-48 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-md">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Yacht Details */}
                  <div className="w-full md:w-2/3 md:pl-4">
                    <h3 className="text-xl font-bold">{yacht.name}</h3>
                    <p className="text-blue-600 font-semibold">{yacht.price}</p>
                    <p className="text-gray-600">{yacht.route}</p>
                    
                    <div className="mt-2">
                      <h4 className="font-semibold">Specifications:</h4>
                      <div className="grid grid-cols-2 gap-1 text-sm">
                        <p><span className="font-medium">Length:</span> {yacht.specifications?.length}</p>
                        <p><span className="font-medium">Guests:</span> {yacht.specifications?.guests}</p>
                        <p><span className="font-medium">Cabins:</span> {yacht.specifications?.cabins}</p>
                        <p><span className="font-medium">Builder:</span> {yacht.specifications?.builder}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => handleEdit(yacht)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(yacht)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
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