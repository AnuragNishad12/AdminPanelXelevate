import React, { useState, useEffect } from "react";
import "./SignIn.css";

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
  });

  // Form validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setFormErrors(prev => ({
      ...prev,
      email: formData.email && !emailRegex.test(formData.email)
        ? "Please enter a valid email address"
        : ""
    }));

    setFormErrors(prev => ({
      ...prev,
      password: formData.password && formData.password.length < 6
        ? "Password must be at least 6 characters"
        : ""
    }));
  }, [formData.email, formData.password]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isFormValid = () => {
    return (
      formData.email &&
      formData.password &&
      !formErrors.email &&
      !formErrors.password
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      const errors = {};
      if (!formData.email) errors.email = "Email is required";
      if (!formData.password) errors.password = "Password is required";
      setFormErrors({ ...formErrors, ...errors });
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      alert("Sign In Successful!");
      setFormData({ email: "", password: "" });
    }, 2000);
  };

  return (
    <div className="signin-page-container">
      <div className="signin-form-container">
        <h2 className="signin-title">Welcome back</h2>
        <p className="signin-subtitle">Please enter your information to sign in</p>

        <form onSubmit={handleSubmit}>
          <div className="signin-form-group">
            <label htmlFor="email" className="signin-form-label">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`signin-form-input ${
                formData.email && (formErrors.email ? "input-invalid" : "input-valid")
              }`}
              placeholder="Enter your email..."
              aria-describedby="email-error"
              disabled={isLoading}
            />
            {formErrors.email && (
              <p id="email-error" className="validation-message error" aria-live="polite">
                {formErrors.email}
              </p>
            )}
          </div>

          <div className="signin-form-group">
            <label htmlFor="password" className="signin-form-label">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`signin-form-input ${
                formData.password && (formErrors.password ? "input-invalid" : "input-valid")
              }`}
              placeholder="Enter your password"
              aria-describedby="password-error"
              disabled={isLoading}
            />
            {formErrors.password && (
              <p id="password-error" className="validation-message error" aria-live="polite">
                {formErrors.password}
              </p>
            )}
          </div>

          <div className="forgot-password">
            <a href="/forgot-password">Forgot Password?</a>
          </div>

          <button 
            type="submit" 
            className="signin-form-button"
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? (
              <div className="button-spinner"></div>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="signup-footer">
          Don't have an account yet? <a href="/signup">Sign up</a>
        </div>

        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Signing in...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignIn;