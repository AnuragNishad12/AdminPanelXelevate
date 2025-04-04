import { useState } from "react";
import { database, ref, push, set } from "../../src/firebaseConfig"; // Import Firebase functions

export default function AparthotelForm() {
  const [formData, setFormData] = useState({
    name: "Aparthotel Stare Miasto",
    location: "Old Town, Poland, Kraków",
    rating: "8.8",
    ratingText: "Fabulous",
    reviewCount: "3,177",
    price: "8,141",
    imageUrl:
      "https://plus.unsplash.com/premium_photo-1661919210043-fd847a58522d?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fA%3D%3D",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const newHotelRef = push(ref(database, "admin/Dealoftehday")); // Creates a unique entry
      await set(newHotelRef, formData); // Saves data to Firebase

      alert("Data saved successfully!");
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save data.");
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto shadow-lg rounded-2xl bg-white">
      <div className="p-4">
        <h2 className="text-x2 font-bold mb-4">Deal of The Day</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Image URL</label>
            <input
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>
          {/* <img
            src={formData.imageUrl}
            alt="Hotel Preview"
            className="w-full h-48 object-cover rounded-lg mb-4"
          /> */}
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Location</label>
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Rating</label>
            <input
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Rating Text</label>
            <input
              name="ratingText"
              value={formData.ratingText}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Review Count</label>
            <input
              name="reviewCount"
              value={formData.reviewCount}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Price</label>
            <input
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>
          <button type="submit" className="w-full px-4 py-2 bg-blue-500 text-white rounded">
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
