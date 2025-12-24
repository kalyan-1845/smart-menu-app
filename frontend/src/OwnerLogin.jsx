import React, { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import axios from "axios";
import { FaLock, FaStore, FaKey, FaArrowRight } from "react-icons/fa";

// --- INLINE STYLES (Previously in OwnerLogin.css) ---
const styles = `
/* --- CONTAINER & BACKGROUND --- */
.login-container {
    background-color: #050505;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 20px;
}

/* Ambient Orange Glows */
.glow-spot {
    position: absolute;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    filter: blur(80px);
    z-index: 0;
    pointer-events: none;
}
.top-left {
    top: -100px;
    left: -100px;
    background: radial-gradient(circle, rgba(255, 82, 0, 0.15) 0%, transparent 70%);
}
.bottom-right {
    bottom: -100px;
    right: -100px;
    background: radial-gradient(circle, rgba(255, 173, 0, 0.1) 0%, transparent 70%);
}

/* --- GLASS CARD --- */
.login-card {
    background: linear-gradient(180deg, rgba(30, 30, 30, 0.6) 0%, rgba(10, 10, 10, 0.8) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 40px 30px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    z-index: 1;
    position: relative;
}

/* --- HEADER --- */
.login-header {
    text-align: center;
    margin-bottom: 30px;
}

.icon-wrapper {
    width: 60px; height: 60px;
    background: rgba(255, 82, 0, 0.1);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 15px auto;
    border: 1px solid rgba(255, 82, 0, 0.2);
    box-shadow: 0 0 20px rgba(255, 82, 0, 0.1);
}

.lock-icon { font-size: 24px; color: #FF5200; }

h1 {
    font-size: 28px;
    color: white;
    margin: 0 0 10px 0;
    font-weight: 800;
    letter-spacing: -0.5px;
}

.login-header p {
    color: #888;
    font-size: 14px;
    line-height: 1.5;
}

/* --- FORM INPUTS --- */
.input-group { margin-bottom: 20px; }

.input-group label {
    display: block;
    color: #aaa;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
    font-weight: 600;
}

.input-wrapper {
    position: relative;
    display: flex; align-items: center;
}

.input-icon {
    position: absolute;
    left: 15px;
    color: #666;
    font-size: 14px;
    z-index: 2;
}

.input-wrapper input {
    width: 100%;
    background: #0f0f0f;
    border: 1px solid #333;
    padding: 14px 14px 14px 40px; /* Space for icon */
    border-radius: 12px;
    color: white;
    font-size: 15px;
    outline: none;
    transition: all 0.3s ease;
}

.input-wrapper input:focus {
    border-color: #FF5200;
    background: #1a1a1a;
    box-shadow: 0 0 0 4px rgba(255, 82, 0, 0.1);
}

.input-wrapper input::placeholder { color: #444; }

/* --- BUTTON & ERROR --- */
.error-message {
    background: rgba(255, 68, 68, 0.1);
    border: 1px solid rgba(255, 68, 68, 0.2);
    color: #ff6b6b;
    padding: 12px;
    border-radius: 10px;
    font-size: 13px;
    text-align: center;
    margin-bottom: 20px;
}

.login-btn {
    width: 100%;
    background: linear-gradient(135deg, #d34400 0%, #FF5200 100%);
    color: white;
    border: none;
    padding: 16px;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: transform 0.2s, box-shadow 0.2s;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.login-btn:hover {
    box-shadow: 0 5px 20px rgba(255, 82, 0, 0.3);
    transform: translateY(-2px);
}

.login-btn:active { transform: scale(0.98); }

.login-btn:disabled { opacity: 0.7; cursor: wait; }

/* --- FOOTER --- */
.login-footer {
    margin-top: 30px;
    text-align: center;
    border-top: 1px solid rgba(255,255,255,0.1);
    padding-top: 20px;
}

.login-footer p { color: #666; font-size: 13px; margin-bottom: 15px; }

.register-link {
    color: #FF9933;
    text-decoration: none;
    font-weight: bold;
    margin-left: 5px;
}
.register-link:hover { text-decoration: underline; }

.secure-badge {
    display: inline-block;
    font-size: 10px;
    color: #444;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: rgba(255,255,255,0.03);
    padding: 6px 12px;
    border-radius: 20px;
}

/* Spinner Animation */
.spinner {
    width: 20px; height: 20px;
    border: 3px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
`;

const OwnerLogin = () => {
    const { restaurantId } = useParams(); // Get ID from URL if available (e.g. /login/pizzahut)
    
    // Initialize username with URL param if it exists
    const [formData, setFormData] = useState({ username: restaurantId || "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // If the URL changes or component mounts, ensure the state matches the URL
    useEffect(() => {
        if (restaurantId) {
            setFormData(prev => ({ ...prev, username: restaurantId }));
        }
    }, [restaurantId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/auth/login", formData);
            
            if (response.data && response.data.token) {
                localStorage.setItem("ownerToken", response.data.token);
                localStorage.setItem("ownerId", response.data._id);
                localStorage.setItem("ownerUsername", response.data.username);
                
                // Redirect to the specific restaurant's admin dashboard
                navigate(`/${response.data.username}/admin`); 
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
        <>
            {/* Inject CSS Styles */}
            <style>{styles}</style>

            <div className="login-container">
                <div className="glow-spot top-left"></div>
                <div className="glow-spot bottom-right"></div>

                <div className="login-card glass-panel">
                    <div className="login-header">
                        <div className="icon-wrapper">
                            <FaLock className="lock-icon" />
                        </div>
                        <h1>Staff Access</h1>
                        {/* Display context if a restaurant is pre-selected */}
                        <p>
                            {restaurantId 
                                ? <span>Login to manage <strong style={{color:'#f97316'}}>{restaurantId}</strong></span>
                                : "Enter credentials to unlock the Owner Dashboard."
                            }
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="input-group">
                            <label>Restaurant ID</label>
                            <div className="input-wrapper">
                                <FaStore className="input-icon" />
                                <input 
                                    type="text" 
                                    name="username"
                                    autoComplete="username"
                                    placeholder="e.g. kalyanresto"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    // Disable editing if the ID is fixed via URL to prevent confusion
                                    disabled={!!restaurantId} 
                                    style={restaurantId ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
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
                                    autoComplete="current-password"
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
                        {/* Only show Register link if this is the generic login page, not a specific restaurant's login page */}
                        {!restaurantId && (
                            <p>New Restaurant Owner? <Link to="/register" className="register-link">Register Business</Link></p>
                        )}
                        <span className="secure-badge">Smart Menu v2.0 • 100% Secure</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OwnerLogin;