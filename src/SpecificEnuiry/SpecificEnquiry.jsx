import React, { useEffect, useState } from "react";
import { database } from "../firebaseConfig";
import { ref, onValue } from "firebase/database";
import "../SpecificEnuiry/SpecificEnquiry.css";

function SpecificEnquiry() {
  const [travelData, setTravelData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const travelRef = ref(database, "aircraftEnquiries");
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

  return (
    <div className="app">
      <header className="header">
        <h1>Travel Details Dashboard</h1>
      </header>
      <main className="main">
        {loading ? (
          <div className="loader">Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : travelData.length === 0 ? (
          <div className="no-data">No travel details available.</div>
        ) : (
          <div className="card-container">
            {travelData.map((item) => (
              <div className="card" key={item.id}>
                <div className="card-header">
                  <h2>{item.fullName}</h2>
                </div>
                <div className="card-body">
                  <p>
                    <strong>Message:</strong> {item.message}
                  </p>
                  <p>
                    <strong>Phone:</strong> {item.phoneNumber}
                  </p>
                  <p>
                    <strong>Transport:</strong>{" "}
                    {item.preferredTransport || "Not specified"}
                  </p>
                  <p>
                    <strong>Travel Date:</strong> {item.travelDate}
                  </p>
                  <p>
                    <strong>Timestamp:</strong>{" "}
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default SpecificEnquiry;