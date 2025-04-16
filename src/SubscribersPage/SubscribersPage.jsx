import React, { useEffect, useState } from 'react';
import { ref, onValue, remove } from "firebase/database";
import { database } from "../firebaseConfig"; // Adjust path as needed
import '../SubscribersPage/SubscribersPage.css'; // We'll create this CSS file

const SubscribersPage = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteStatus, setDeleteStatus] = useState({ id: null, message: '' });

  useEffect(() => {
    // Reference to the 'subscribers' node in your Firebase database
    const subscribersRef = ref(database, 'subscribers');
    
    // Set up listener for subscribers data
    const unsubscribe = onValue(subscribersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert the object to an array with IDs included
        const subscribersArray = Object.entries(data).map(([id, details]) => ({
          id,
          ...details
        }));
        
        // Sort by timestamp (newest first)
        subscribersArray.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        setSubscribers(subscribersArray);
      } else {
        setSubscribers([]);
      }
      setLoading(false);
    });
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, []);

  // Function to format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to delete a subscriber
  const handleDelete = async (id) => {
    try {
      const subscriberRef = ref(database, `subscribers/${id}`);
      await remove(subscriberRef);
      setDeleteStatus({ id: null, message: 'Subscriber deleted successfully' });
      
      // Clear the status message after 3 seconds
      setTimeout(() => {
        setDeleteStatus({ id: null, message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      setDeleteStatus({ id: null, message: 'Failed to delete subscriber' });
    }
  };

  return (
    <div className="subscribers-page">
      <div className="subscribers-container">
        <h1 className="page-title">Newsletter Subscribers</h1>
        
        {deleteStatus.message && (
          <div className="status-message">
            {deleteStatus.message}
          </div>
        )}
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading subscribers...</p>
          </div>
        ) : subscribers.length > 0 ? (
          <div className="subscribers-grid">
            {subscribers.map(subscriber => (
              <div key={subscriber.id} className="subscriber-card">
                <div className="card-header">
                  <h3 className="subscriber-email">{subscriber.email}</h3>
                  <button 
                    className="delete-button"
                    onClick={() => handleDelete(subscriber.id)}
                    aria-label="Delete subscriber"
                  >
                    ×
                  </button>
                </div>
                <div className="card-content">
                  {/* <div className="info-item">
                    <span className="info-label">Source:</span>
                    <span className="info-value">
                      {subscriber.source || 'Direct'}
                    </span>
                  </div> */}
                  <div className="info-item">
                    <span className="info-label">Date:</span>
                    <span className="info-value">
                      {formatDate(subscriber.timestamp)}
                    </span>
                  </div>
                </div>
                <div className="card-badge">
                  {subscriber.source === 'blog_newsletter' ? 'Blog' : 'Website'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">
            <p>No subscribers found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscribersPage;