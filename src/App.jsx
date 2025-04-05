import { useState } from 'react';
// import './App.css';

import AparthotelForm from './HomeCorousal/AparthotelForm';
import ReviewForm from './ReviewCustomer/ReviewForm';
import AircraftForm from './AircraftForm/AircraftForm';
import CarForm from './Car/CarForm';
import MainPage from './MainPage';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignUp from './SignUp';
import SignIn from './SignIn';

function App() {
  const [count, setCount] = useState(0);

  const Dashboard = () => <h2>Dashboard Page</h2>; // temporary route component

  return (
    <>
      <Router>
        <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/SignUp" element={<SignUp />} />
          <Route path="/MainPage" element={<MainPage />} />
          <Route path="/Dealoftheday" element={<AparthotelForm />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
