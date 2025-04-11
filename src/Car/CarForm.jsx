import { useState, useEffect } from "react";
import { ref as dbRef, push, remove, update, onValue } from "firebase/database";
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { database, storage } from "../firebaseConfig";

const CarForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    city: "",           // New field for city
    description: "",
    totalTime: "",
    kilometers: "",     // New field for KM
    pax: "",
    price: "",
  });

  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [cars, setCars] = useState([]);
  const [editingCar, setEditingCar] = useState(null);

  // Fetch cars from database
  useEffect(() => {
    const carsRef = dbRef(database, "cars");
    const unsubscribe = onValue(carsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const carsList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setCars(carsList);
      } else {
        setCars([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 6) {
      alert("You can only upload up to 6 additional images");
      return;
    }

    setAdditionalImages(files);

    // Create image previews
    const imagePreviews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        imagePreviews.push(reader.result);
        if (imagePreviews.length === files.length) {
          setAdditionalImagePreviews([...imagePreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      city: "",
      description: "",
      totalTime: "",
      kilometers: "",
      pax: "",
      price: "",
    });
    setCoverImage(null);
    setCoverImagePreview(null);
    setAdditionalImages([]);
    setAdditionalImagePreviews([]);
    setEditingCar(null);
  };

  const uploadImage = async (file, path) => {
    const imageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(imageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Progress tracking could be added here
        },
        reject,
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coverImage && !editingCar) {
      alert("Please select a cover image first");
      return;
    }

    setUploading(true);

    try {
      let coverImageURL = editingCar?.coverImg || "";
      let additionalImageURLs = editingCar?.additionalImages || [];

      // Upload cover image if provided
      if (coverImage) {
        coverImageURL = await uploadImage(coverImage, `car_images/cover_${uuidv4()}`);
      }

      // Upload additional images if provided
      if (additionalImages.length > 0) {
        const uploadPromises = additionalImages.map((file, index) => 
          uploadImage(file, `car_images/additional_${uuidv4()}_${index}`)
        );
        additionalImageURLs = await Promise.all(uploadPromises);
      }

      const carData = {
        ...formData,
        coverImg: coverImageURL,
        additionalImages: additionalImageURLs,
      };

      if (editingCar) {
        // Update existing car
        await update(dbRef(database, `cars/${editingCar.id}`), carData);
        alert("Car updated successfully!");
      } else {
        // Add new car
        await push(dbRef(database, "cars"), carData);
        alert("Car added successfully!");
      }

      resetForm();
    } catch (error) {
      console.error("Error:", error);
      alert("Operation failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (car) => {
    setFormData({
      title: car.title,
      city: car.city || "",
      description: car.description,
      totalTime: car.totalTime,
      kilometers: car.kilometers || "",
      pax: car.pax,
      price: car.price,
    });
    setCoverImagePreview(car.coverImg || car.img);
    setAdditionalImagePreviews(car.additionalImages || []);
    setEditingCar(car);
    
    // Scroll to form
    document.querySelector('.car-form-container').scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  const handleDelete = async (car) => {
    if (!window.confirm(`Are you sure you want to delete ${car.title}?`)) {
      return;
    }

    try {
      // Delete from database
      await remove(dbRef(database, `cars/${car.id}`));
      
      // Delete cover image from storage if exists
      if (car.coverImg || car.img) {
        try {
          const imageRef = ref(storage, car.coverImg || car.img);
          await deleteObject(imageRef);
        } catch (imgError) {
          console.error("Error deleting cover image:", imgError);
        }
      }
      
      // Delete additional images from storage if they exist
      if (car.additionalImages && car.additionalImages.length > 0) {
        for (const imgUrl of car.additionalImages) {
          try {
            const imageRef = ref(storage, imgUrl);
            await deleteObject(imageRef);
          } catch (imgError) {
            console.error("Error deleting additional image:", imgError);
          }
        }
      }
      
      alert("Car deleted successfully!");
    } catch (error) {
      console.error("Error deleting car:", error);
      alert("Failed to delete car: " + error.message);
    }
  };

  return (
    <div className="car-management-container">
      <div className="car-form-section">
        <div className="car-form-container">
          <h2 className="form-title">{editingCar ? "Update Car Details" : "Add Car Details"}</h2>
          <form onSubmit={handleSubmit} className="car-form">
            {/* Cover Image Upload - Fixed Version */}
            <div className="form-group file-upload-group">
              <label htmlFor="cover-image">Cover Image</label>
              <div className="file-upload-container">
                <input
                  id="cover-image"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="file-input"
                />
                <label htmlFor="cover-image" className="custom-file-upload">
                  Choose Cover Image
                </label>
                <span className="file-name">
                  {coverImage ? coverImage.name : "No file chosen"}
                </span>
              </div>
              {coverImagePreview && (
                <div className="image-preview cover-preview">
                  <img src={coverImagePreview} alt="Cover Preview" />
                </div>
              )}
            </div>
            
            {/* Additional Images Upload - Fixed Version */}
            <div className="form-group file-upload-group">
              <label htmlFor="additional-images">Additional Images (Up to 6)</label>
              <div className="file-upload-container">
                <input
                  id="additional-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAdditionalImagesChange}
                  className="file-input"
                />
                <label htmlFor="additional-images" className="custom-file-upload">
                  Choose Additional Images
                </label>
                <span className="file-name">
                  {additionalImages.length > 0 
                    ? `${additionalImages.length} file(s) selected` 
                    : "No files chosen"}
                </span>
              </div>
              {additionalImagePreviews.length > 0 && (
                <div className="additional-images-preview">
                  {additionalImagePreviews.map((preview, index) => (
                    <div className="image-preview" key={index}>
                      <img src={preview} alt={`Additional Preview ${index + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Total Time</label>
              <input
                type="text"
                name="totalTime"
                value={formData.totalTime}
                onChange={handleChange}
                placeholder="e.g., 2 hours"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Kilometers</label>
              <input
                type="number"
                name="kilometers"
                value={formData.kilometers}
                onChange={handleChange}
                placeholder="e.g., 150"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Passengers</label>
              <input
                type="number"
                name="pax"
                value={formData.pax}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Price</label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g., ₹28,75,400"
                required
              />
            </div>
            
            <div className="form-actions">
              <button
                type="submit"
                disabled={uploading}
                className="submit-button"
              >
                {uploading ? "Processing..." : editingCar ? "Update Car" : "Add Car"}
              </button>
              
              {editingCar && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      
      <div className="car-list-section">
        <h2 className="list-title">Available Cars</h2>
        {cars.length === 0 ? (
          <div className="no-cars">No cars available</div>
        ) : (
          <div className="car-list">
            {cars.map((car) => (
              <div className="car-card" key={car.id}>
                <div className="car-image">
                  <img src={car.coverImg || car.img} alt={car.title} />
                </div>
                <div className="car-details">
                  <h3>{car.title}</h3>
                  {car.city && <p className="car-city">{car.city}</p>}
                  <p className="car-description">{car.description}</p>
                  <div className="car-info">
                    <span>Time: {car.totalTime}</span>
                    {car.kilometers && <span>KM: {car.kilometers}</span>}
                    <span>Passengers: {car.pax}</span>
                    <span>Price: {car.price}</span>
                  </div>
                  {car.additionalImages && car.additionalImages.length > 0 && (
                    <div className="car-gallery">
                      <div className="gallery-toggle">View Gallery ({car.additionalImages.length})</div>
                    </div>
                  )}
                </div>
                <div className="car-actions">
                  <button 
                    className="edit-button"
                    onClick={() => handleEdit(car)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDelete(car)}
                  >
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

export default CarForm;