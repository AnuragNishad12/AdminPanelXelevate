import React, { useState, useEffect } from 'react';
import { database, storage, ref as dbRef, set, push } from '../firebaseConfig';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { onValue, remove, update } from 'firebase/database';

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

    // Scroll to form on mobile
    if (window.innerWidth < 768) {
      document.getElementById('yachtForm').scrollIntoView({ behavior: 'smooth' });
    }
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
   <div className=" flex flex-col md:flex-row bg-[#161617] text-gray-200 min-h-screen">

      {/* Form Section - Left Side */}
      <div className="w-full md:w-2/5 p-6 overflow-y-auto border-r border-gray-800 ">
        <h2 className="text-2xl font-bold mb-6 text-white uppercase tracking-wider">
          {editingId ? 'Edit Yacht' : 'Add New Yacht'}
        </h2>
        
        <form id="yachtForm" onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2 uppercase">
              Basic Information
            </h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-white"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Price (per week)</label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-white"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Route</label>
              <input
                type="text"
                name="route"
                value={formData.route}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-white"
              />
            </div>
          </div>
          
          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2 uppercase">
              Images
            </h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Cover Image</label>
              <input
                id="coverImage"
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                required={!editingId}
                className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white file:text-[#161617] hover:file:bg-gray-200"
              />
              {editingId && <p className="text-xs text-gray-400 mt-1">Leave empty to keep current image</p>}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Additional Images (max 5)</label>
              <input
                id="additionalImages"
                type="file"
                accept="image/*"
                multiple
                onChange={handleAdditionalImagesChange}
                className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white file:text-[#161617] hover:file:bg-gray-200"
              />
              {editingId && <p className="text-xs text-gray-400 mt-1">Upload new images to replace existing ones</p>}
            </div>
          </div>
          
          {/* Specifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2 uppercase">
              Specifications
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Length</label>
                <input
                  type="text"
                  name="specifications.length"
                  value={formData.specifications.length}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Beam</label>
                <input
                  type="text"
                  name="specifications.beam"
                  value={formData.specifications.beam}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Draft</label>
                <input
                  type="text"
                  name="specifications.draft"
                  value={formData.specifications.draft}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Gross Tonnage</label>
                <input
                  type="text"
                  name="specifications.grossTonnage"
                  value={formData.specifications.grossTonnage}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Cruising Speed</label>
                <input
                  type="text"
                  name="specifications.cruisingSpeed"
                  value={formData.specifications.cruisingSpeed}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Max Speed</label>
                <input
                  type="text"
                  name="specifications.maxSpeed"
                  value={formData.specifications.maxSpeed}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Built</label>
                <input
                  type="text"
                  name="specifications.built"
                  value={formData.specifications.built}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Builder</label>
                <input
                  type="text"
                  name="specifications.builder"
                  value={formData.specifications.builder}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Exterior</label>
                <input
                  type="text"
                  name="specifications.exterior"
                  value={formData.specifications.exterior}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Interior</label>
                <input
                  type="text"
                  name="specifications.interior"
                  value={formData.specifications.interior}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Guests</label>
                <input
                  type="number"
                  name="specifications.guests"
                  value={formData.specifications.guests}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Cabins</label>
                <input
                  type="number"
                  name="specifications.cabins"
                  value={formData.specifications.cabins}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex space-x-4 pt-6">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={loading}
                className="px-6 py-3 bg-transparent border border-white text-red-500 rounded-md hover:bg-gray-800 transition flex-1 uppercase tracking-wider font-medium"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-white text-[#161617] rounded-md hover:bg-gray-200 transition flex-1 uppercase tracking-wider font-medium"
            >
              {loading ? 'Processing...' : editingId ? 'Update Yacht' : 'Add Yacht'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Yacht List Section - Right Side */}
      <div className="w-full md:w-3/5 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-white uppercase tracking-wider">Yacht List</h2>
        
        {yachts.length === 0 ? (
          <div className="p-8 bg-gray-800 bg-opacity-50 rounded-lg text-center">
            <p className="text-gray-400">No yachts added yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {yachts.map((yacht) => (
              <div key={yacht.id} className="bg-[#1c1c1d] rounded-lg shadow-xl overflow-hidden border border-gray-800">
                <div className="flex flex-col md:flex-row">
                  {/* Yacht Image */}
                  <div className="w-full md:w-2/5 h-64 md:h-auto overflow-hidden">
                    {yacht.image ? (
                      <img 
                        src={yacht.image} 
                        alt={yacht.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-700">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Yacht Details */}
                  <div className="w-full md:w-3/5 p-6">
                    <h3 className="text-xl font-bold text-white uppercase">{yacht.name}</h3>
                    <p className="text-green-400 text-lg font-semibold">{yacht.price}</p>
                    <p className="text-gray-400 mb-4">{yacht.route}</p>
                    
                    <div className="mt-3">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2 uppercase">Specifications:</h4>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <p><span className="text-gray-400">Length:</span> {yacht.specifications?.length}</p>
                        <p><span className="text-gray-400">Guests:</span> {yacht.specifications?.guests}</p>
                        <p><span className="text-gray-400">Cabins:</span> {yacht.specifications?.cabins}</p>
                        <p><span className="text-gray-400">Builder:</span> {yacht.specifications?.builder}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex space-x-4">
                      <button
                        onClick={() => handleEdit(yacht)}
                        className="px-5 py-2 bg-white text-[#161617] rounded-md hover:bg-gray-200 transition font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(yacht)}
                        className="px-5 py-2 bg-transparent border border-white text-red-500 rounded-md hover:bg-gray-800 transition font-medium"
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