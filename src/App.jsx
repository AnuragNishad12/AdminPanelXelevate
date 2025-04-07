import { useState } from 'react';


import AparthotelForm from './HomeCorousal/AparthotelForm';
import ReviewForm from './ReviewCustomer/ReviewForm';
import AircraftForm from './AircraftForm/AircraftForm';
import CarForm from './Car/CarForm';
import MainPage from './MainPage';
import Helicopter from './Helicopter/Helicopter'

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignUp from './SignUp';
import SignIn from './SignIn';
import LuxuryJetForm from './Blogs/LuxuryJetForm';
import TestimonialForm from './CustomerRevuiewHelicopter/TestimonialForm';
import BookingsDisplay from './BookingsDisplay/BookingsDisplay';

function App() {
  const [count, setCount] = useState(0);

  // const Dashboard = () => <h2>Dashboard Page</h2>; 

  return (
    <>
      <Router>
        <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/SignUp" element={<SignUp />} />
          <Route path="/MainPage" element={<MainPage />} />
          <Route path="/Dealoftheday" element={<AparthotelForm />} />
          <Route path="/Cars" element={<CarForm />} />
          <Route path="/CustomerReview" element={<ReviewForm />} />
          <Route path="/Aircraft" element={<AircraftForm />} />
          <Route path="/Blogs" element={<LuxuryJetForm />} />
          <Route path="/Helicopter" element={<Helicopter />} />
          <Route path="/Reviewhelicopter" element={<TestimonialForm />} />
          <Route path="/HelicopterEnquiry" element={<BookingsDisplay />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
