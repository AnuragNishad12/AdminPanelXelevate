import React, { useState, useEffect } from "react";
import { ref, set, push, onValue, remove, update } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { database, storage } from "../firebaseConfig";
import "./LuxuryJetForm.css";

export default function LuxuryJetForm() {
  const [jets, setJets] = useState([]);
  const [editingJet, setEditingJet] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    date: "",
    excerpt: "",
    category: "",
    image: null,
  });

  useEffect(() => {
    const jetsRef = ref(database, "luxuryJets");
    const unsubscribe = onValue(jetsRef, (snapshot) => {
      const jetsData = snapshot.val();
      const jetsArray = jetsData ? Object.keys(jetsData).map(key => ({
        id: key,
        ...jetsData[key]
      })) : [];
      setJets(jetsArray);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.image && !editingJet) return alert("Please upload an image");

      let imageURL = editingJet?.image;  // Fixed typo here

      if (formData.image) {
        if (editingJet) {
          // Delete old image
          const oldImageRef = storageRef(storage, editingJet.image);  // Fixed typo here
          await deleteObject(oldImageRef);
        }
        
        const imageRef = storageRef(storage, `jets/${formData.image.name}`);
        await uploadBytes(imageRef, formData.image);
        imageURL = await getDownloadURL(imageRef);
      }

      const jetData = {
        title: formData.title,
        author: formData.author,
        date: formData.date,
        excerpt: formData.excerpt,
        category: formData.category,
        image: imageURL,
      };

      if (editingJet) {
        await update(ref(database, `luxuryJets/${editingJet.id}`), jetData);
      } else {
        const newJetRef = push(ref(database, "luxuryJets"));
        await set(newJetRef, jetData);
      }

      resetForm();
      alert(`Jet ${editingJet ? 'updated' : 'added'} successfully!`);
    } catch (err) {
      console.error(err);
      alert("Operation failed");
    }
};

  const handleEdit = (jet) => {
    setEditingJet(jet);
    setFormData({
      title: jet.title,
      author: jet.author,
      date: jet.date,
      excerpt: jet.excerpt,
      category: jet.category,
      image: null, // Reset image input
    });
  };

  const handleDelete = async (jetId, imageUrl) => {
    if (window.confirm("Are you sure you want to delete this jet?")) {
      try {
        await remove(ref(database, `luxuryJets/${jetId}`));
        const imageRef = storageRef(storage, imageUrl);
        await deleteObject(imageRef);
        alert("Jet deleted successfully");
      } catch (err) {
        console.error(err);
        alert("Delete failed");
      }
    }
  };

  const resetForm = () => {
    setFormData({ title: "", author: "", date: "", excerpt: "", category: "", image: null });
    setEditingJet(null);
  };

  return (
    <div className="dashboard-container">
      <div className="form-section">
        <h2>{editingJet ? 'Edit Blog' : 'Add Blog'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Author</label>
              <input type="text" name="author" value={formData.author} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Excerpt</label>
            <textarea name="excerpt" value={formData.excerpt} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <input type="text" name="category" value={formData.category} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Image</label>
              <input type="file" accept="image/*" name="image" onChange={handleChange} />
              {editingJet?.image && <small>Current image: {editingJet.image.split('%2F')[1].split('?')[0]}</small>}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              {editingJet ? 'Update Jet' : 'Add Jet'}
            </button>
            {editingJet && <button type="button" className="cancel-btn" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="list-section">
        <h2>Blogs</h2>
        <div className="jets-grid">
          {jets.map((jet) => (
            <div key={jet.id} className="jet-card">
              <div className="card-image">
                {jet.image && <img src={jet.image} alt={jet.title} />}
              </div>
              <div className="card-content">
                <h3>{jet.title}</h3>
                <p className="category">{jet.category}</p>
                <p className="author">{jet.author} - {new Date(jet.date).toLocaleDateString()}</p>
                <p className="excerpt">
                  {jet.excerpt.split(" ").slice(0, 10).join(" ")}...
                </p>

                <div className="card-actions">
                  <button onClick={() => handleEdit(jet)} className="edit-btn">Edit</button>
                  <button onClick={() => handleDelete(jet.id, jet.image)} className="delete-btn">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}