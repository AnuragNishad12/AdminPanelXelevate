import React, { useState } from "react";
import { ref, push, set } from "firebase/database";
import { database } from "../firebaseConfig"; // Assuming firebase config is in a separate file

const AircraftForm = ({ existingData = null }) => {
  // Initial form state - use existing data if provided or default values
  const initialFormData = existingData || {
    name: "",
    aircraftType: "",
    destination: "",
    price: "",
    images: ["", "", "", ""],
    shortDescription: "",
    aircraftDetails: {
      guestCapacity: 0,
      numberOfPilots: 0,
      numberOfFlightAttendants: 0,
      luggageCapacity: 0,
      numberOfLavatory: 0,
      wifiAvailable: "No"
    },
    technicalSpecifications: {
      exterior: {
        length: "",
        wingspan: "",
        height: ""
      },
      range: {
        rangeKm: ""
      },
      speed: {
        highSpeed: "",
        typicalCruiseSpeed: ""
      },
      engines: {
        engineModel: "",
        thrustKN: "",
        flatRatedTo: ""
      },
      airfieldPerformance: {
        takeOffDistance: "",
        landingDistance: ""
      },
      avionics: "",
      operatingAltitude: ""
    }
  };

  const [formData, setFormData] = useState(initialFormData);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle basic field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle nested object changes
  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Handle deeply nested object changes
  const handleDeepNestedChange = (section, subsection, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value
        }
      }
    }));
  };

  // Handle image array changes
  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  // Save data to Firebase
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Reference to the 'aircraft' node in the database
      const aircraftRef = existingData?.id 
        ? ref(database, `aircraft/${existingData.id}`) 
        : push(ref(database, 'aircraft'));
      
      // Prepare data (remove any temporary fields)
      const dataToSave = { ...formData };
      if (existingData?.id) {
        delete dataToSave.id; // Don't save the ID as a field
      }

      // Save data
      await set(aircraftRef, dataToSave);
      
      // Show success alert
      setAlert({
        show: true,
        type: "success",
        message: existingData ? "Aircraft updated successfully!" : "Aircraft added successfully!"
      });
      
      // Clear alert after 3 seconds
      setTimeout(() => {
        setAlert({ show: false, type: "", message: "" });
      }, 3000);
      
    } catch (error) {
      console.error("Error saving data:", error);
      setAlert({
        show: true,
        type: "error",
        message: `Error: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          {existingData ? "Edit Aircraft" : "Add New Aircraft"}
        </h1>

        {/* Alert Dialog */}
        {alert.show && (
          <div className={`mb-6 p-4 rounded-md ${alert.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            <div className="flex items-center">
              <span className="mr-2">
                {alert.type === "success" ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
              {alert.message}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aircraft Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Global 6000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aircraft Type</label>
                <input
                  type="text"
                  name="aircraftType"
                  value={formData.aircraftType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Large Jet"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Delhi -------> Goa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. ₹800000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the aircraft..."
                ></textarea>
              </div>
            </div>
          </div>
          
          {/* Images */}
          <div className="bg-gray-50 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Images</h2>
            
            <div className="space-y-4">
              {formData.images.map((url, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL {index + 1}</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter image URL"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Aircraft Details */}
          <div className="bg-gray-50 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Aircraft Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guest Capacity</label>
                <input
                  type="number"
                  value={formData.aircraftDetails.guestCapacity}
                  onChange={(e) => handleNestedChange('aircraftDetails', 'guestCapacity', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Pilots</label>
                <input
                  type="number"
                  value={formData.aircraftDetails.numberOfPilots}
                  onChange={(e) => handleNestedChange('aircraftDetails', 'numberOfPilots', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Flight Attendants</label>
                <input
                  type="number"
                  value={formData.aircraftDetails.numberOfFlightAttendants}
                  onChange={(e) => handleNestedChange('aircraftDetails', 'numberOfFlightAttendants', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Luggage Capacity</label>
                <input
                  type="number"
                  value={formData.aircraftDetails.luggageCapacity}
                  onChange={(e) => handleNestedChange('aircraftDetails', 'luggageCapacity', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Lavatories</label>
                <input
                  type="number"
                  value={formData.aircraftDetails.numberOfLavatory}
                  onChange={(e) => handleNestedChange('aircraftDetails', 'numberOfLavatory', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WiFi Available</label>
                <select
                  value={formData.aircraftDetails.wifiAvailable}
                  onChange={(e) => handleNestedChange('aircraftDetails', 'wifiAvailable', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Technical Specifications */}
          <div className="bg-gray-50 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Technical Specifications</h2>
            
            <div className="space-y-6">
              {/* Exterior */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Exterior</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
                    <input
                      type="text"
                      value={formData.technicalSpecifications.exterior.length}
                      onChange={(e) => handleDeepNestedChange('technicalSpecifications', 'exterior', 'length', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 99.5 ft"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wingspan</label>
                    <input
                      type="text"
                      value={formData.technicalSpecifications.exterior.wingspan}
                      onChange={(e) => handleDeepNestedChange('technicalSpecifications', 'exterior', 'wingspan', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 94 ft"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                    <input
                      type="text"
                      value={formData.technicalSpecifications.exterior.height}
                      onChange={(e) => handleDeepNestedChange('technicalSpecifications', 'exterior', 'height', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 25 ft"
                    />
                  </div>
                </div>
              </div>
              
              {/* Range */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Range</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Range (km)</label>
                  <input
                    type="text"
                    value={formData.technicalSpecifications.range.rangeKm}
                    onChange={(e) => handleDeepNestedChange('technicalSpecifications', 'range', 'rangeKm', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 11112 Km"
                  />
                </div>
              </div>
              
              {/* Speed */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Speed</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">High Speed</label>
                    <input
                      type="text"
                      value={formData.technicalSpecifications.speed.highSpeed}
                      onChange={(e) => handleDeepNestedChange('technicalSpecifications', 'speed', 'highSpeed', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 944 Km/Hr"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Typical Cruise Speed</label>
                    <input
                      type="text"
                      value={formData.technicalSpecifications.speed.typicalCruiseSpeed}
                      onChange={(e) => handleDeepNestedChange('technicalSpecifications', 'speed', 'typicalCruiseSpeed', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 944 Km/Hr"
                    />
                  </div>
                </div>
              </div>
              
              {/* Other specs */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Operating Altitude</h3>
                <input
                  type="text"
                  value={formData.technicalSpecifications.operatingAltitude}
                  onChange={(e) => handleNestedChange('technicalSpecifications', 'operatingAltitude', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 51,000 ft"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className={`px-6 py-3 rounded-md text-white font-medium ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Aircraft'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AircraftForm;