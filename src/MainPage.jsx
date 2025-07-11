// MainPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./MainPage.css";

const cardData = [
  { title: "Deal of The day", route: "/Dealoftheday" },
  { title: "Aircraft", route: "/Aircraft" },
  { title: "Helicopter", route: "/Helicopter" },
  { title: "Yatch Manager", route: "/YatchManager" },
  { title: "Cars", route: "/Cars" },
  // { title: "Customer Review Helicopter", route: "/logout" },
  // { title: "Helicopter Enquiry", route: "/HelicopterEnquiry" },
  { title: "Client Enquiry", route: "/ClientEnquiry" },
  { title: "Customer Review", route: "/CustomerReview" },
  { title: "Subscribers", route: "/Subscribers" },
  { title: "Blogs", route: "/Blogs" },
  {title:"Specific Enquiry",route:"/SpecificEnquiry"},
  { title: "Sign Up", route: "/SignUp" },
  
 
];

const MainPage = () => {
  const navigate = useNavigate();

  return (
    <div className="main-container">
      <header className="header">
        <h1>Xelevate Admin Panel</h1>
        <p className="header-subtitle">Manage your platform with ease</p>
      </header>
      <div className="card-grid">
        {cardData.map((card, index) => (
          <div
            key={index}
            className="card"
            onClick={() => navigate(card.route)}
          >
            <span className="card-title">{card.title}</span>
            <span className="card-icon">→</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainPage;