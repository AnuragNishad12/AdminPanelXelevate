import React, { useState, useEffect } from "react";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, database } from "../firebaseConfig";
import { push, ref as dbRef, onValue, remove, update } from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import "./CarForm.css";

const CarForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    totalTime: "",
    pax: "",
    price: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      totalTime: "",
      pax: "",
      price: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingCar(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile && !editingCar) {
      alert("Please select an image first");
      return;
    }

    setUploading(true);

    try {
      let downloadURL = editingCar?.img || "";

      // Upload new image if provided
      if (imageFile) {
        const imageRef = ref(storage, `car_images/${uuidv4()}`);
        const uploadTask = uploadBytesResumable(imageRef, imageFile);
        
        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              // Progress tracking could be added here
            },
            reject,
            async () => {
              downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      const carData = {
        ...formData,
        img: downloadURL,
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
      description: car.description,
      totalTime: car.totalTime,
      pax: car.pax,
      price: car.price,
    });
    setImagePreview(car.img);
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
      
      // Delete image from storage if exists
      if (car.img) {
        try {
          // Extract the path from the URL (this approach may vary depending on your Firebase setup)
          const imageRef = ref(storage, car.img);
          await deleteObject(imageRef);
        } catch (imgError) {
          console.error("Error deleting image:", imgError);
          // Continue even if image deletion fails
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
            <div className="form-group">
              <label>Car Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
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
                placeholder="e.g., $50"
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
                  <img src={car.img} alt={car.title} />
                </div>
                <div className="car-details">
                  <h3>{car.title}</h3>
                  <p className="car-description">{car.description}</p>
                  <div className="car-info">
                    <span>Time: {car.totalTime}</span>
                    <span>Passengers: {car.pax}</span>
                    <span>Price: {car.price}</span>
                  </div>
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