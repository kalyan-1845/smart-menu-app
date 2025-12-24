import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Registers.css"; // 👈 IMPORT THE CSS FILE HERE
import { FaLock } from "react-icons/fa"; // Ensure you have react-icons installed

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    restaurantName: "",
    username: "",
    email: "",
    password: ""
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNameChange = (e) => {
    const rawName = e.target.value;
    const cleanId = rawName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

    setFormData({
      restaurantName: rawName,
      username: cleanId,
      email: cleanId ? `${cleanId}@gmail.com` : "",
      password: formData.password
    });
  };

  const handlePasswordChange = (e) => {
    setFormData({ ...formData, password: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if(!formData.username) {
        setError("Please enter a valid restaurant name.");
        setLoading(false);
        return;
    }

    try {
      const res = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/auth/register", formData);
      if (res.data) {
        alert("Registration Successful! Please Login.");
        navigate("/login");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        
        {/* HEADER */}
        <div className="rocket-icon">🚀</div>
        <h1 className="title">Launch Your Menu</h1>
        <p className="subtitle">Create your restaurant account and start taking orders.</p>

        {/* ERROR BOX */}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          
          {/* Restaurant Name */}
          <div className="input-group">
            <label className="input-label">Restaurant Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Kalyan Resto"
              value={formData.restaurantName}
              onChange={handleNameChange}
              className="form-input"
            />
          </div>

          {/* Username */}
          <div className="input-group">
            <label className="input-label">Username (Public ID)</label>
            <input
              type="text"
              readOnly
              value={formData.username}
              className="form-input input-locked"
            />
          </div>

          {/* Email */}
          <div className="input-group">
            <label className="input-label">Business Email</label>
            <input
              type="email"
              readOnly
              value={formData.email}
              className="form-input input-locked"
            />
            <p className="helper-text">*Email is auto-generated for security.</p>
          </div>

          {/* Password */}
          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handlePasswordChange}
              className="form-input"
            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account & Access 🚀"}
          </button>

        </form>

        {/* Footer */}
        <div className="form-footer">
            Already have a restaurant account? 
            <Link to="/login" className="footer-link">Log In Here</Link>
        </div>
        
        <div className="version-text">
            <FaLock style={{fontSize: '10px'}}/> Restaurant SaaS Platform v2.0 • Encryption Active
        </div>

      </div>
    </div>
  );
};

export default Register;