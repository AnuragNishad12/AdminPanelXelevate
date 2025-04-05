// MainPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./MainPage.css";

const cardData = [
  { title: "Deal of The day", route: "/Dealoftheday" },
  { title: "Users", route: "/users" },
  { title: "Reports", route: "/reports" },
  { title: "Settings", route: "/settings" },
  { title: "Analytics", route: "/analytics" },
  { title: "Support", route: "/support" },
  { title: "Notifications", route: "/notifications" },
  { title: "Logout", route: "/logout" },
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