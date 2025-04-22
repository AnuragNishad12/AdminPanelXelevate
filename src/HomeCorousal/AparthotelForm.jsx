import { useEffect, useState } from "react";
import { ref, push, set, onValue, remove, update } from "firebase/database";
import { storage, database } from "../../src/firebaseConfig";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

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
    <div className="min-h-screen flex items-center justify-center">
       <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Form Section */}
        <div className="md:w-1/3">
          <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-400">Deal of the Day</h2>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Upload Image</label>
              <input 
                type="file" 
                name="imageFile" 
                onChange={handleChange}
                className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-500 file:text-white
                  hover:file:bg-blue-600"
              />
            </div>

            {[
              { name: 'from', placeholder: 'From (e.g., Delhi to Mumbai)' },
              { name: 'aircraft', placeholder: 'Service (e.g., Citation XL)' },
              { name: 'capacity', placeholder: 'Capacity (e.g., 08 seater)' },
              { name: 'date', placeholder: 'Date (e.g., 09-04-2025)' },
              { name: 'time', placeholder: 'Time (e.g., 1330 H)' },
              { name: 'quote', placeholder: 'Quote (e.g., 50,000/- per seat)' },
            ].map((field) => (
              <input
                key={field.name}
                type="text"
                name={field.name}
                value={formData[field.name]}
                placeholder={field.placeholder}
                onChange={handleChange}
                required
                className="w-full mb-4 p-3 rounded-lg bg-gray-700 border border-gray-600 
                         text-white placeholder-gray-400 focus:outline-none 
                         focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            ))}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold 
                       py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {editingKey ? "Update Deal" : "Save Deal"}
            </button>
          </form>
        </div>

        {/* Preview Section */}
        <div className="md:w-2/3">
          <h2 className="text-2xl font-bold mb-6 text-center text-blue-400">All Deals</h2>
          <div className="space-y-6">
            {deals.map((deal) => (
              <div key={deal.id} className="bg-gray-800 rounded-lg shadow-xl p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <img 
                    src={deal.imageUrl} 
                    alt={deal.from} 
                    className="w-full md:w-48 h-48 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold mb-2 text-blue-300">{deal.from}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <p><span className="text-gray-400">Aircraft:</span> {deal.aircraft}</p>
                      <p><span className="text-gray-400">Capacity:</span> {deal.capacity}</p>
                      <p><span className="text-gray-400">Date:</span> {deal.date}</p>
                      <p><span className="text-gray-400">Time:</span> {deal.time}</p>
                      <p className="col-span-2">
                        <span className="text-gray-400">Quote:</span> {deal.quote}
                      </p>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleEdit(deal)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg 
                                 transition-colors duration-200 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(deal.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg 
                                 transition-colors duration-200 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}