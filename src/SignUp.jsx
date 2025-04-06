import React, { useState, useEffect } from "react";
import "./SignUp.css";
import { useNavigate } from "react-router-dom";
import { auth, firestore } from "./firebaseConfig"; // Updated import path
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const SignUp = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ level: "empty", text: "" });
  const [formErrors, setFormErrors] = useState({ email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength({ level: "empty", text: "" });
      return;
    }

    let strength = 0;
    if (formData.password.length >= 8) strength += 1;
    if (/[A-Z]/.test(formData.password)) strength += 1;
    if (/[0-9]/.test(formData.password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;

    setPasswordStrength(
      strength <= 1
        ? { level: "weak", text: "Weak password" }
        : strength <= 3
        ? { level: "medium", text: "Medium password" }
        : { level: "strong", text: "Strong password" }
    );

    setFormErrors((prev) => ({
      ...prev,
      password:
        formData.password.length < 8 ? "Password must be at least 8 characters long" : "",
    }));

    setFormErrors((prev) => ({
      ...prev,
      confirmPassword:
        formData.confirmPassword && formData.password !== formData.confirmPassword
          ? "Passwords do not match"
          : "",
    }));
  }, [formData.password, formData.confirmPassword]);

  useEffect(() => {
    if (!formData.email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setFormErrors((prev) => ({
      ...prev,
      email: !emailRegex.test(formData.email) ? "Please enter a valid email address" : "",
    }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      const errors = {};
      if (!formData.email) errors.email = "Email is required";
      if (!formData.password) errors.password = "Password is required";
      if (!formData.confirmPassword) errors.confirmPassword = "Please confirm your password";
      setFormErrors({ ...formErrors, ...errors });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Attempting to create user with email:", formData.email);
      
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;
      console.log("User created successfully with UID:", user.uid);

      // Save user data to Firestore
      console.log("Saving user data to Firestore...");
      const userData = {
        uid: user.uid,
        email: formData.email,
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(firestore, "users", user.uid), userData);
      console.log("User data saved to Firestore successfully");

      alert("Sign Up Successful!");
      navigate("/"); // navigate to login
    } catch (error) {
      console.error("Error during sign up process:", error);
      alert("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignUp = (provider) => {
    // Placeholder for social sign-up functionality
    alert(`${provider} sign-up functionality will be implemented soon!`);
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
            {/* Email */}
            <div className="signup-form-group">
              <label className="signup-form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`signup-form-input ${formData.email && (formErrors.email ? "input-invalid" : "input-valid")}`}
                placeholder="e.g., example@domain.com"
                required
              />
              {formErrors.email && <p className="validation-message error">{formErrors.email}</p>}
            </div>

            {/* Password */}
            <div className="signup-form-group">
              <label className="signup-form-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`signup-form-input ${formData.password && (formErrors.password ? "input-invalid" : "input-valid")}`}
                  placeholder="Enter your password"
                  required
                />
                <span onClick={() => setShowPassword(!showPassword)} className="toggle-password-visibility">
                  {showPassword ? "🙈" : "👁️"}
                </span>
              </div>
              {formData.password && (
                <div className="password-strength">
                  <div className={`strength-bars strength-${passwordStrength.level}`}>
                    <div className="strength-bar"></div>
                    <div className="strength-bar"></div>
                    <div className="strength-bar"></div>
                  </div>
                  <p className="strength-text" style={{ color: passwordStrength.level === "weak" ? "#ef4444" : passwordStrength.level === "medium" ? "#f59e0b" : "#10b981" }}>
                    {passwordStrength.text}
                  </p>
                </div>
              )}
              {formErrors.password && <p className="validation-message error">{formErrors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="signup-form-group">
              <label className="signup-form-label">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`signup-form-input ${formData.confirmPassword && (formErrors.confirmPassword ? "input-invalid" : "input-valid")}`}
                  placeholder="Confirm your password"
                  required
                />
                <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="toggle-password-visibility">
                  {showConfirmPassword ? "🙈" : "👁️"}
                </span>
              </div>
              {formErrors.confirmPassword && <p className="validation-message error">{formErrors.confirmPassword}</p>}
            </div>

            <button type="submit" className="signup-form-button" disabled={!isFormValid()}>
              Create Account
            </button>
          </form>

          <div className="auth-divider"><h2 className="auth-divider-text">Or sign up with</h2></div>
          <div className="social-login-buttons">
            <button className="social-button" type="button" onClick={() => handleSocialSignUp('Google')}>Google</button>
            <button className="social-button" type="button" onClick={() => handleSocialSignUp('Apple')}>Apple</button>
          </div>

          <div className="signup-footer">
            Already have an account? <a href="/">Log In</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignUp;