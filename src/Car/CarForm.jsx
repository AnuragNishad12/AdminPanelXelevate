// CarForm.jsx
import React, { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, database } from "../firebaseConfig";
import { push, ref as dbRef } from "firebase/database";
import { v4 as uuidv4 } from "uuid";

const CarForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    totalTime: "",
    pax: "",
    price: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) return alert("Please select an image first");

    setUploading(true);
    const imageRef = ref(storage, `car_images/${uuidv4()}`);
    const uploadTask = uploadBytesResumable(imageRef, imageFile);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
       
      },
      (error) => {
        setUploading(false);
        alert("Upload failed: " + error.message);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const newCar = {
          ...formData,
          img: downloadURL,
        };

        await push(dbRef(database, "cars"), newCar);
        setUploading(false);
        alert("Car added successfully!");

        setFormData({
          title: "",
          description: "",
          totalTime: "",
          pax: "",
          price: "",
        });
        setImageFile(null);
      }
    );
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-lg rounded-2xl mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Add Car Details</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Car Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>

        {["title", "description", "totalTime", "pax", "price"].map((field) => (
          <div key={field}>
            <label className="block text-gray-700 capitalize mb-1">{field}</label>
            <input
              type={field === "pax" ? "number" : "text"}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 transition"
        >
          {uploading ? "Uploading..." : "Save to Firebase"}
        </button>
      </form>
    </div>
  );
};

export default CarForm;
