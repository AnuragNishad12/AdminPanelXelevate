import { useEffect, useState } from "react";
import { ref, push, set, onValue, remove, update } from "firebase/database";
import { storage, database } from "../../src/firebaseConfig";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import "./AparthotelForm.css";

export default function AparthotelForm() {
  const [formData, setFormData] = useState({
    from: "",
    aircraft: "",
    capacity: "",
    date: "",
    time: "",
    quote: "",
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
      from: formData.from,
      aircraft: formData.aircraft,
      capacity: formData.capacity,
      date: formData.date,
      time: formData.time,
      quote: formData.quote,
      imageUrl: imageUrl,
    };

    if (editingKey) {
      await update(ref(database, `admin/Dealoftehday/${editingKey}`), dataToSave);
      setEditingKey(null);
    } else {
      const newDealRef = push(ref(database, "admin/Dealoftehday"));
      await set(newDealRef, dataToSave);
    }

    alert("Data saved!");
    setFormData({
      from: "",
      aircraft: "",
      capacity: "",
      date: "",
      time: "",
      quote: "",
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
            name="from"
            value={formData.from}
            placeholder="From (e.g., Delhi to Mumbai)"
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="aircraft"
            value={formData.aircraft}
            placeholder="Service (e.g., Citation XL)"
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="capacity"
            value={formData.capacity}
            placeholder="Capacity (e.g., 08 seater)"
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="date"
            value={formData.date}
            placeholder="Date (e.g., 09-04-2025)"
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="time"
            value={formData.time}
            placeholder="Time (e.g., 1330 H)"
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="quote"
            value={formData.quote}
            placeholder="Quote (e.g., 50,000/- per seat)"
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
            <img src={deal.imageUrl} alt={deal.from} />
            <div>
              <h4>{deal.from}</h4>
              <p>Aircraft: {deal.aircraft}</p>
              <p>Capacity: {deal.capacity}</p>
              <p>Date: {deal.date}</p>
              <p>Time: {deal.time}</p>
              <p>Quote: {deal.quote}</p>
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