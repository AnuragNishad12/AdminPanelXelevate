import React, { useState, useEffect } from "react";
import "./SignUp.css";

const SignUp = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    level: "empty",
    text: "",
  });
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  // Password validation logic
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength({ level: "empty", text: "" });
      return;
    }
    
    // Check password strength
    let strength = 0;
    if (formData.password.length >= 8) strength += 1;
    if (/[A-Z]/.test(formData.password)) strength += 1;
    if (/[0-9]/.test(formData.password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;
    
    // Determine strength level
    if (strength === 0 || strength === 1) {
      setPasswordStrength({ level: "weak", text: "Weak password" });
    } else if (strength === 2 || strength === 3) {
      setPasswordStrength({ level: "medium", text: "Medium password" });
    } else {
      setPasswordStrength({ level: "strong", text: "Strong password" });
    }
    
    // Validate password
    if (formData.password.length < 8) {
      setFormErrors(prev => ({ 
        ...prev, 
        password: "Password must be at least 8 characters long" 
      }));
    } else {
      setFormErrors(prev => ({ ...prev, password: "" }));
    }
    
    // Validate password confirmation
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setFormErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
    } else if (formData.confirmPassword) {
      setFormErrors(prev => ({ ...prev, confirmPassword: "" }));
    }
  }, [formData.password, formData.confirmPassword]);
  
  // Email validation on change
  useEffect(() => {
    if (!formData.email) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
    } else {
      setFormErrors(prev => ({ ...prev, email: "" }));
    }
  }, [formData.email]);
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const isFormValid = () => {
    return (
      formData.email && 
      formData.password && 
      formData.confirmPassword && 
      !formErrors.email && 
      !formErrors.password && 
      !formErrors.confirmPassword
    );
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      // Show all validation errors
      const errors = {};
      if (!formData.email) errors.email = "Email is required";
      if (!formData.password) errors.password = "Password is required";
      if (!formData.confirmPassword) errors.confirmPassword = "Please confirm your password";
      
      setFormErrors({ ...formErrors, ...errors });
      return;
    }
    
    // Simulate a sign-up process with a loading state
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert("Sign Up Successful!");
      // Reset form
      setFormData({ email: "", password: "", confirmPassword: "" });
    }, 2000); // Simulate a 2-second loading delay
  };
  
  return (
    <div className="signup-page-container">
      {isLoading ? (
        <div className="loading-circle">
          <div className="spinner"></div>
          <p>Creating your account...</p>
        </div>
      ) : (
        <div className="signup-form-container">
          <h2 className="signup-title">Sign Up</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="signup-form-group">
              <label className="signup-form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`signup-form-input ${
                  formData.email && (formErrors.email ? "input-invalid" : "input-valid")
                }`}
                placeholder="e.g., example@domain.com"
                required
              />
              {formErrors.email && (
                <p className="validation-message error">{formErrors.email}</p>
              )}
            </div>
            
            <div className="signup-form-group">
              <label className="signup-form-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`signup-form-input ${
                  formData.password && (formErrors.password ? "input-invalid" : "input-valid")
                }`}
                placeholder="Enter your password"
                required
              />
              {formData.password && (
                <div className="password-strength">
                  <div className={`strength-bars strength-${passwordStrength.level}`}>
                    <div className="strength-bar"></div>
                    <div className="strength-bar"></div>
                    <div className="strength-bar"></div>
                  </div>
                  <p className="strength-text" style={{
                    color: 
                      passwordStrength.level === "weak" ? "#ef4444" : 
                      passwordStrength.level === "medium" ? "#f59e0b" : 
                      "#10b981"
                  }}>
                    {passwordStrength.text}
                  </p>
                </div>
              )}
              {formErrors.password && (
                <p className="validation-message error">{formErrors.password}</p>
              )}
            </div>
            
            <div className="signup-form-group">
              <label className="signup-form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`signup-form-input ${
                  formData.confirmPassword && (formErrors.confirmPassword ? "input-invalid" : "input-valid")
                }`}
                placeholder="Confirm your password"
                required
              />
              {formErrors.confirmPassword && (
                <p className="validation-message error">{formErrors.confirmPassword}</p>
              )}
            </div>
            
            <button 
              type="submit" 
              className="signup-form-button"
              disabled={!isFormValid()}
            >
              Create Account
            </button>
          </form>
          
          <div className="auth-divider">
            <h2 className="auth-divider-text">Or sign up with</h2>
          </div>
          
          <div className="social-login-buttons">
            <button className="social-button" type="button">
              Google
            </button>
            <button className="social-button" type="button">
              Apple
            </button>
          </div>
          
          <div className="signup-footer">
            Already have an account? <a href="#">Log In</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignUp;