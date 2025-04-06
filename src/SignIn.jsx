import React, { useState, useEffect } from "react";
import "./SignIn.css";
import { useNavigate } from "react-router-dom";
import { auth, firestore } from "./firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
    auth: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
  
        try {
          const userDoc = await getDoc(doc(firestore, "users", user.uid));
          if (userDoc.exists()) {
            navigate("/MainPage");
          } else {
            console.log("User authenticated but no Firestore record found");
          }
        } catch (error) {
          console.error("Error checking user in Firestore:", error);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);
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
    if (formErrors.auth) {
      setFormErrors(prev => ({ ...prev, auth: "" }));
    }
  };

  const isFormValid = () => {
    return (
      formData.email &&
      formData.password &&
      !formErrors.email &&
      !formErrors.password
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      const errors = {};
      if (!formData.email) errors.email = "Email is required";
      if (!formData.password) errors.password = "Password is required";
      setFormErrors({ ...formErrors, ...errors });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Attempting to sign in with email:", formData.email);
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      const user = userCredential.user;
      console.log("User signed in successfully:", user.uid);
    
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      
      if (userDoc.exists()) {
        console.log("User found in Firestore, redirecting to main page");
        navigate("/MainPage");
      } else {
        console.log("User authenticated but not found in Firestore");
        try {
          await setDoc(doc(firestore, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            createdAt: new Date().toISOString(),
          });
          navigate("/MainPage");
        } catch (error) {
          console.error("Error creating user in Firestore:", error);
          setFormErrors(prev => ({ 
            ...prev, 
            auth: "Error creating user profile. Please try again." 
          }));
        }
      }
    } catch (error) {
      console.error("Sign in error:", error);
      let errorMessage = "Failed to sign in. Please check your credentials.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email. Please sign up.";
        setTimeout(() => {
          navigate("/SignUp");
        }, 2000);
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
      }
      
      setFormErrors(prev => ({ ...prev, auth: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-page-container">
      <div className="signin-form-container">
        <h2 className="signin-title">Welcome back</h2>
        <p className="signin-subtitle">Please enter your information to sign in</p>

        {formErrors.auth && (
          <div className="auth-error-message">
            {formErrors.auth}
          </div>
        )}

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