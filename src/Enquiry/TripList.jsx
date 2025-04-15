import React, { useEffect, useState } from "react";
import { database } from "../firebaseConfig";
import { ref, onValue, remove } from "firebase/database";
import "./TripList.css";

const TripList = () => {
  const [trips, setTrips] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);

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

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this enquiry?")) {
      remove(ref(database, `Enquiry/${id}`));
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      }) + " at " + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const getTripTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'business':
        return '💼';
      case 'leisure':
        return '🏖️';
      case 'family':
        return '👨‍👩‍👧‍👦';
      default:
        return '✈️';
    }
  };

  const handleTripClick = (id) => {
    setSelectedTrip(selectedTrip === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading enquiries...</p>
      </div>
    );
  }

  return (
    <div className="enquiry_Container">

    
    <div className="trip-list-container">
      <h2 className="trip-list-title">Travel Enquiries</h2>
      
      {Object.keys(trips).length === 0 ? (
        <div className="no-trips-message">
          <p>No travel enquiries found.</p>
        </div>
      ) : (
        <div className="trip-list">
          {Object.entries(trips).map(([id, trip]) => (
            <div 
              className={`trip-card ${selectedTrip === id ? 'expanded' : ''}`} 
              key={id}
              onClick={() => handleTripClick(id)}
            >
              <div className="trip-header">
                <div className="trip-type">
                  <span className="trip-icon">{getTripTypeIcon(trip.tripType)}</span>
                  <h3>{trip.tripType?.toUpperCase() || 'UNSPECIFIED'} TRIP</h3>
                </div>
                <div className="trip-route">
                  <span className="departure">{trip.departure}</span>
                  <span className="route-arrow">→</span>
                  <span className="arrival">{trip.arrival}</span>
                </div>
              </div>
              
              <div className="trip-details">
                <div className="detail-item">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{formatDate(trip.departureDateTime)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Passengers:</span>
                  <span className="detail-value">{trip.pax} {trip.pax === 1 ? 'person' : 'people'}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Transport:</span>
                  <span className="detail-value">{trip.transportType || 'Not specified'}</span>
                </div>
                
                {selectedTrip === id && trip.notes && (
                  <div className="detail-item notes">
                    <span className="detail-label">Notes:</span>
                    <span className="detail-value">{trip.notes}</span>
                  </div>
                )}
                
                {selectedTrip === id && trip.contactInfo && (
                  <div className="detail-item">
                    <span className="detail-label">Contact:</span>
                    <span className="detail-value">{trip.contactInfo}</span>
                  </div>
                )}
              </div>
              
              <button 
                className="delete-button" 
                onClick={(e) => handleDelete(id, e)}
                aria-label="Delete enquiry"
              >
                Delete
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