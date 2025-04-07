// BookingsDisplay.js
import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../firebaseConfig';
import '../BookingsDisplay/BookingsDisplay.css';

const BookingsDisplay = () => {
  const [bookings, setBookings] = useState([]);

  // Fetch bookings from Firebase
  useEffect(() => {
    const bookingsRef = ref(database, 'bookings');
    
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bookingsArray = Object.entries(data).map(([id, value]) => ({
          id,
          ...value
        }));
        setBookings(bookingsArray);
      } else {
        setBookings([]);
      }
    }, (error) => {
      console.error('Error fetching bookings:', error);
    });

    return () => off(bookingsRef, 'value', unsubscribe);
  }, []);


  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const bookingRef = ref(database, `bookings/${id}`);
        await remove(bookingRef);
        alert('Booking deleted successfully!');
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Failed to delete booking. Please try again.');
      }
    }
  };



  return (
    <div className="bookings-container">
      <h2>Bookings</h2>
      {bookings.length === 0 ? (
        <p className="no-bookings">No bookings available.</p>
      ) : (
        <div className="bookings-grid">
          {bookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <h3>{booking.name}</h3>
              <p><strong>Email:</strong> {booking.email}</p>
              <p><strong>Phone:</strong> {booking.phone}</p>
              <p><strong>Date:</strong> {booking.date}</p>
              <p><strong>Helicopter Type:</strong> {booking.helicopterType}</p>
              <p><strong>Message:</strong> {booking.message || 'N/A'}</p>
              {booking.createdAt && (
                <p className="created-at">
                  <strong>Booked on:</strong> {new Date(booking.createdAt).toLocaleString()}
                </p>
              )}
              <button 
                onClick={() => handleDelete(booking.id)} 
                className="delete-button"
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