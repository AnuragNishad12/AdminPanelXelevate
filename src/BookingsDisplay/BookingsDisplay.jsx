import { useState, useEffect } from 'react';
import { ref, onValue, off, remove } from 'firebase/database';
import { database } from '../firebaseConfig';
import '../BookingsDisplay/BookingsDisplay.css';

const BookingsDisplay = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Fetch bookings from Firebase
  useEffect(() => {
    const bookingsRef = ref(database, 'bookings');
    setIsLoading(true);
    
    const handleBookingsData = (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bookingsArray = Object.entries(data)
          .map(([id, value]) => ({
            id,
            ...value
          }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // Sort by newest first
          
        setBookings(bookingsArray);
      } else {
        setBookings([]);
      }
      setIsLoading(false);
    };
    
    const unsubscribe = onValue(bookingsRef, handleBookingsData, (error) => {
      console.error('Error fetching bookings:', error);
      setIsLoading(false);
    });
    
    return () => off(bookingsRef, 'value', unsubscribe);
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const bookingRef = ref(database, `bookings/${id}`);
        await remove(bookingRef);
        // No need for alert as the UI will update automatically
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Failed to delete booking. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      }) + " at " + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleBookingClick = (id) => {
    setSelectedBooking(selectedBooking === id ? null : id);
  };

  const getHelicopterIcon = (type) => {
    if (!type) return '🚁';
    
    const lowercaseType = type.toLowerCase();
    if (lowercaseType.includes('private')) return '🛩️';
    if (lowercaseType.includes('tour')) return '🗺️';
    if (lowercaseType.includes('luxury')) return '✨';
    if (lowercaseType.includes('charter')) return '🚁';
    return '🚁';
  };

  if (isLoading) {
    return (
      <div className="bookings-loading">
        <div className="loading-spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    
    <div className="bookings-container">
      <div className="bookings-header">
        <h2>Helicopter Bookings</h2>
        <p className="bookings-count">{bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} found</p>
      </div>
      
      {bookings.length === 0 ? (
        <div className="no-bookings">
          <div className="no-bookings-icon">📭</div>
          <p>No bookings available.</p>
          <p className="no-bookings-subtitle">Bookings will appear here when customers make reservations.</p>
        </div>
      ) : (
        <div className="bookings-grid">
          {bookings.map((booking) => (
            <div 
              key={booking.id} 
              className={`booking-card ${selectedBooking === booking.id ? 'expanded' : ''}`}
              onClick={() => handleBookingClick(booking.id)}
            >
              <div className="booking-header">
                <div className="booking-icon">{getHelicopterIcon(booking.helicopterType)}</div>
                <div className="booking-title">
                  <h3>{booking.name}</h3>
                  <span className="booking-date">{formatDate(booking.date)}</span>
                </div>
              </div>
              
              <div className="booking-details">
                <div className="booking-info">
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{booking.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Phone:</span>
                    <span className="info-value">{booking.phone}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Helicopter:</span>
                    <span className="info-value">{booking.helicopterType || 'Not specified'}</span>
                  </div>
                  
                  {booking.message && (
                    <div className="booking-message">
                      <span className="info-label">Message:</span>
                      <p>{booking.message}</p>
                    </div>
                  )}
                </div>
                
                {booking.createdAt && (
                  <div className="booking-meta">
                    <span className="created-at">
                      Booked on {formatDateTime(booking.createdAt)}
                    </span>
                  </div>
                )}
              </div>
              
              <button
                onClick={(e) => handleDelete(booking.id, e)}
                className="delete-button"
                title="Delete booking"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
 
  );
};

export default BookingsDisplay;