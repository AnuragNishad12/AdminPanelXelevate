import { useEffect, useState } from "react";
import { ref, push, set, onValue, remove, update } from "firebase/database";
import { storage, database } from "../../src/firebaseConfig";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import "./AparthotelForm.css";

export default function AparthotelForm() {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    rating: "",
    ratingText: "",
    reviewCount: "",
    price: "",
    imageFile: null,
    imageUrl: "",
  });

  const [deals, setDeals] = useState([]);
  const [editingKey, setEditingKey] = useState(null);

  useEffect(() => {
    const dealsRef = ref(database, "admin/Dealoftehday");
    onValue(dealsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedDeals = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value,
        }));
        setDeals(loadedDeals);
      } else {
        setDeals([]);
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imageFile") {
      setFormData({ ...formData, imageFile: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let imageUrl = formData.imageUrl;

    if (formData.imageFile) {
      const fileRef = storageRef(storage, `deal_images/${formData.imageFile.name}`);
      await uploadBytes(fileRef, formData.imageFile);
      imageUrl = await getDownloadURL(fileRef);
    }

    const dataToSave = {
      ...formData,
      imageUrl,
      imageFile: undefined,
    };

    if (editingKey) {
      await update(ref(database, `admin/Dealoftehday/${editingKey}`), dataToSave);
      setEditingKey(null);
    } else {
      const newHotelRef = push(ref(database, "admin/Dealoftehday"));
      await set(newHotelRef, dataToSave);
    }

    alert("Data saved!");
    setFormData({
      name: "",
      location: "",
      rating: "",
      ratingText: "",
      reviewCount: "",
      price: "",
      imageFile: null,
      imageUrl: "",
    });
  };

  const handleEdit = (deal) => {
    setFormData({ ...deal, imageFile: null });
    setEditingKey(deal.id);
  };

  const handleDelete = async (id) => {
    await remove(ref(database, `admin/Dealoftehday/${id}`));
    alert("Deleted!");
  };

  return (
   
   <div className="main-containerdealoftheday">
      <div className="form-section">
        <form onSubmit={handleSubmit}>
          <h2>Deal of the Day</h2>

          <div className="form-group">
            <label>Upload Image</label>
            <input type="file" name="imageFile" onChange={handleChange} />
          </div>

          <input
            type="text"
            name="name"
            value={formData.name}
            placeholder="Hotel Name"
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="location"
            value={formData.location}
            placeholder="Location"
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="rating"
            value={formData.rating}
            placeholder="Rating"
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="ratingText"
            value={formData.ratingText}
            placeholder="Rating Text"
            onChange={handleChange}
          />
          <input
            type="text"
            name="reviewCount"
            value={formData.reviewCount}
            placeholder="Review Count"
            onChange={handleChange}
          />
          <input
            type="text"
            name="price"
            value={formData.price}
            placeholder="Price in PLN"
            onChange={handleChange}
            required
          />

          <button type="submit">{editingKey ? "Update Deal" : "Save Deal"}</button>
        </form>
      </div>

      <div className="preview-section">
        <h2>All Deals</h2>
        {deals.map((deal) => (
          <div className="deal-card" key={deal.id}>
            <img src={deal.imageUrl} alt={deal.name} />
            <div>
              <h4>{deal.name}</h4>
              <p>{deal.location}</p>
              <p>
                <strong>{deal.rating}</strong> {deal.ratingText} ({deal.reviewCount})
              </p>
              <p>{deal.price} PLN</p>
              <div className="action-buttons">
                <button onClick={() => handleEdit(deal)}>Edit</button>
                <button onClick={() => handleDelete(deal.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  
 
  );
}
