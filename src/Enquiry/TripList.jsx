import React, { useEffect, useState } from "react";
import { database } from "../firebaseConfig";
import { ref, onValue, remove } from "firebase/database";

const TripList = () => {
  const [trips, setTrips] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ id: null, status: null });

  useEffect(() => {
    const tripsRef = ref(database, "Enquiry");
    setIsLoading(true);

    const unsubscribe = onValue(tripsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setTrips(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this enquiry?")) {
      setDeleteStatus({ id, status: "deleting" });
      try {
        await remove(ref(database, `Enquiry/${id}`));
        setDeleteStatus({ id, status: "success" });
        setTimeout(() => setDeleteStatus({ id: null, status: null }), 2000);
      } catch (error) {
        setDeleteStatus({ id, status: "error" });
        setTimeout(() => setDeleteStatus({ id: null, status: null }), 2000);
      }
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return (
        date.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }) +
        " at " +
        date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      return "Invalid date";
    }
  };

  const getTripTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "business":
        return "💼";
      case "leisure":
        return "🏖️";
      case "family":
        return "👨‍👩‍👧‍👦";
      default:
        return "✈️";
    }
  };

  const handleTripClick = (id) => {
    setSelectedTrip(selectedTrip === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#161617]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-lg text-white">Loading enquiries...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#161617]">
      <div className="max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-white text-center mb-8">
          Travel Enquiries
        </h2>

        {Object.keys(trips).length === 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <p className="text-xl text-gray-300">No travel enquiries found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(trips).map(([id, trip]) => (
              <div
                key={id}
                className={`bg-gray-800 rounded-lg shadow-lg p-6 cursor-pointer transition-all duration-300 ${
                  selectedTrip === id ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => handleTripClick(id)}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <div className="flex items-center mb-4 sm:mb-0">
                    <span className="text-2xl mr-2">{getTripTypeIcon(trip.tripType)}</span>
                    <h3 className="text-xl font-semibold text-white">
                      {trip.tripType?.toUpperCase() || "UNSPECIFIED"} TRIP
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <span>{trip.departure}</span>
                    <span className="text-blue-400">→</span>
                    <span>{trip.arrival}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 text-gray-300">
                  <div>
                    <span className="text-sm font-medium text-gray-400">Date:</span>
                    <p className="text-white">{formatDate(trip.departureDateTime)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-400">Passengers:</span>
                    <p className="text-white">
                      {trip.pax} {trip.pax === 1 ? "person" : "people"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-400">Transport:</span>
                    <p className="text-white">{trip.transportType || "Not specified"}</p>
                  </div>
                </div>

                {selectedTrip === id && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    {trip.notes && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-400">Notes:</span>
                        <p className="text-white">{trip.notes}</p>
                      </div>
                    )}
                    {trip.contactInfo && (
                      <div>
                        <span className="text-sm font-medium text-gray-400">Contact:</span>
                        <p className="text-white">{trip.contactInfo}</p>
                      </div>
                    )}
                  </div>
                )}

                <button
                  className={`w-full mt-4 py-2 px-4 rounded-md font-medium transition-colors duration-200 
                    ${
                      deleteStatus.id === id && deleteStatus.status === "deleting"
                        ? "bg-gray-600 text-red-500 cursor-not-allowed"
                        : deleteStatus.id === id && deleteStatus.status === "success"
                        ? "bg-green-600 text-red-500"
                        : deleteStatus.id === id && deleteStatus.status === "error"
                        ? "bg-red-600 text-red-500"
                        : "bg-red-500 hover:bg-red-600 text-red-500"
                    }`}
                  onClick={(e) => handleDelete(id, e)}
                  disabled={deleteStatus.id === id && deleteStatus.status === "deleting"}
                  aria-label="Delete enquiry"
                >
                  {deleteStatus.id === id && deleteStatus.status === "deleting" ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-red-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Deleting...
                    </span>
                  ) : deleteStatus.id === id && deleteStatus.status === "success" ? (
                    "Deleted!"
                  ) : deleteStatus.id === id && deleteStatus.status === "error" ? (
                    "Failed!"
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripList;