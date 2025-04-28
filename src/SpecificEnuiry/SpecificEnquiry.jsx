import React, { useEffect, useState } from "react";
import { database } from "../firebaseConfig";
import { ref, onValue, remove } from "firebase/database";

function EnquiryDetailsForTravels() {
  const [travelData, setTravelData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ id: null, status: null });

  useEffect(() => {
    const travelRef = ref(database, "EnquiryDetailsForTravels");
    onValue(
      travelRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const dataArray = Object.keys(data).map((key) => ({
              id: key,
              ...data[key],
            }));
            setTravelData(dataArray);
          } else {
            setTravelData([]);
          }
          setLoading(false);
        } catch (err) {
          setError("Failed to fetch data. Please try again later.");
          setLoading(false);
        }
      },
      (err) => {
        setError("Failed to connect to the database.");
        setLoading(false);
      }
    );
  }, []);

  const handleDelete = async (id) => {
    try {
      setDeleteStatus({ id, status: "deleting" });
      const entryRef = ref(database, `EnquiryDetailsForTravels/${id}`);
      await remove(entryRef);
      setDeleteStatus({ id, status: "success" });
      setTimeout(() => {
        setDeleteStatus({ id: null, status: null });
      }, 2000);
    } catch (err) {
      console.error("Error deleting entry:", err);
      setDeleteStatus({ id, status: "error" });
      setTimeout(() => {
        setDeleteStatus({ id: null, status: null });
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-6 border-b border-gray-700">
        <h1 className="text-3xl font-bold text-center">Travel Enquiries Dashboard</h1>
      </header>
      <main className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg animate-pulse">Loading...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 text-red-400">
            <p>{error}</p>
          </div>
        ) : travelData.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">No travel enquiries available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {travelData.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-100">{item.fullName}</h2>
                  <p className="text-sm text-gray-400">{item.email}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm">
                    <span className="font-medium text-gray-400">Message: </span>
                    <span className="text-gray-200">{item.message}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-gray-400">Contact: </span>
                    <span className="text-gray-200">{item.number}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-gray-400">Service: </span>
                    <span className="text-gray-200">{item.serviceName || "Not specified"}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-gray-400">Starting Price: </span>
                    <span className="text-gray-200">{item.startingPrice || "Not specified"}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-gray-400">Date: </span>
                    <span className="text-gray-200">{item.date}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-gray-400">Timestamp: </span>
                    <span className="text-gray-200">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </p>
                  <div className="mt-4">
                  <button
  className={`w-full py-2 px-4 rounded-md font-medium transition-colors duration-200 
    ${
      deleteStatus.id === item.id && deleteStatus.status === "deleting"
        ? "bg-gray-600 text-red-500 cursor-not-allowed"
        : deleteStatus.id === item.id && deleteStatus.status === "success"
        ? "bg-green-600 text-red-500"
        : deleteStatus.id === item.id && deleteStatus.status === "error"
        ? "bg-red-600 text-red-500"
        : "bg-red-500 hover:bg-red-600 text-red-500"
    }`}
  onClick={() => handleDelete(item.id)}
  disabled={deleteStatus.id === item.id && deleteStatus.status === "deleting"}
>
  {deleteStatus.id === item.id && deleteStatus.status === "deleting"
    ? "Deleting..."
    : deleteStatus.id === item.id && deleteStatus.status === "success"
    ? "Deleted!"
    : deleteStatus.id === item.id && deleteStatus.status === "error"
    ? "Failed!"
    : "Delete"}
</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default EnquiryDetailsForTravels;