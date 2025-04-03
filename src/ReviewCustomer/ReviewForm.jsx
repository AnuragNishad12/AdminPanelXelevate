import { useState } from "react";
import { db } from '../../src/firebaseConfig'; 
import { ref, push, set } from 'firebase/database';

export default function ReviewForm() {
  const [formData, setFormData] = useState({
    name: "Serginho La Gracia",
    rating: 4,
    text: "The Paul Pogba 16/17 Manchester United jersey arrived in perfect condition. Impressed with the quality and attention to detail!",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: false, message: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ success: false, message: "" });
    
    try {
      // Create a reference to the 'reviews' node in your database
      const reviewsRef = ref(db, 'reviews');
      
      // Generate a new child location using push()
      const newReviewRef = push(reviewsRef);
      
      // Set the data at the new location
      await set(newReviewRef, {
        ...formData,
        timestamp: Date.now()
      });
      
      console.log("Review submitted successfully!");
      setSubmitStatus({
        success: true,
        message: "Review submitted successfully!"
      });
      
      // Optional: reset the form after successful submission
      setFormData({
        name: "",
        rating: 5,
        text: "",
        image: ""
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      setSubmitStatus({
        success: false,
        message: `Error submitting review: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
      <h2 className="text-xl font-bold mb-4">Review Form</h2>
      
      {submitStatus.message && (
        <div className={`w-full p-3 mb-4 rounded ${submitStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {submitStatus.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <label className="block mb-2 font-medium">Name:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-4"
          required
        />
        
        <label className="block mb-2 font-medium">Rating (1-5):</label>
        <input
          type="number"
          name="rating"
          value={formData.rating}
          onChange={handleChange}
          min="1"
          max="5"
          className="w-full p-2 border rounded mb-4"
          required
        />
        
        <label className="block mb-2 font-medium">Review:</label>
        <textarea
          name="text"
          value={formData.text}
          onChange={handleChange}
          rows="4"
          className="w-full p-2 border rounded mb-4"
          required
        ></textarea>
        
        <label className="block mb-2 font-medium">Image URL:</label>
        <input
          type="text"
          name="image"
          value={formData.image}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-4"
        />
        
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}