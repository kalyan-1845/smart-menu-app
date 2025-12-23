import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaLock, FaStore, FaKey, FaArrowRight } from "react-icons/fa";
import "./OwnerLogin.css";

const OwnerLogin = () => {
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Replace with your actual API URL
            const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/auth/login", formData);
            
            if (response.data && response.data.token) {
                // Store auth data
                localStorage.setItem("ownerToken", response.data.token);
                localStorage.setItem("ownerId", response.data._id);
                localStorage.setItem("ownerUsername", response.data.username);
                
                // Redirect to Admin Dashboard
                navigate("/admin/dashboard"); 
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Check credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Background Ambient Glows */}
            <div className="glow-spot top-left"></div>
            <div className="glow-spot bottom-right"></div>

            <div className="login-card glass-panel">
                <div className="login-header">
                    <div className="icon-wrapper">
                        <FaLock className="lock-icon" />
                    </div>
                    <h1>Staff Access</h1>
                    <p>Enter credentials to unlock the Owner Dashboard.</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label>Restaurant ID</label>
                        <div className="input-wrapper">
                            <FaStore className="input-icon" />
                            <input 
                                type="text" 
                                name="username"
                                placeholder="e.g. kalyanresto"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Staff Password</label>
                        <div className="input-wrapper">
                            <FaKey className="input-icon" />
                            <input 
                                type="password" 
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? <span className="spinner"></span> : <>Unlock Dashboards <FaArrowRight /></>}
                    </button>
                </form>

                <div className="login-footer">
                    <p>New Restaurant Owner? <Link to="/register" className="register-link">Register Business</Link></p>
                    <span className="secure-badge">Smart Menu v2.0 • 100% Secure</span>
                </div>
            </div>
        </div>
    );
};

export default OwnerLogin;