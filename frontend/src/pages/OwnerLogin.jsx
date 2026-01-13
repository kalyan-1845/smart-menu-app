import React, { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import axios from "axios";
import { FaLock, FaStore, FaKey, FaArrowRight } from "react-icons/fa";

// --- INLINE STYLES ---
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* --- CONTAINER & BACKGROUND --- */
.login-container {
    background-color: #020617; /* Deep Slate */
    background-image: 
        linear-gradient(to right, rgba(30, 41, 59, 0.3) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(30, 41, 59, 0.3) 1px, transparent 1px);
    background-size: 40px 40px;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 20px;
}

/* Ambient Blue Glows */
.glow-spot {
    position: absolute;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    filter: blur(100px);
    z-index: 0;
    pointer-events: none;
}
.top-left {
    top: -150px;
    left: -150px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%);
}
.bottom-right {
    bottom: -150px;
    right: -150px;
    background: radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%);
}

/* --- GLASS CARD --- */
.login-card {
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 40px 35px;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    z-index: 1;
    position: relative;
}

/* --- HEADER --- */
.login-header {
    text-align: center;
    margin-bottom: 35px;
}

.icon-wrapper {
    width: 64px; height: 64px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(6, 182, 212, 0.1));
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px auto;
    border: 1px solid rgba(59, 130, 246, 0.2);
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.15);
}

.lock-icon { font-size: 24px; color: #3b82f6; }

h1 {
    font-size: 26px;
    color: white;
    margin: 0 0 8px 0;
    font-weight: 800;
    letter-spacing: -0.5px;
}

.login-header p {
    color: #94a3b8;
    font-size: 14px;
    line-height: 1.6;
}

/* --- FORM INPUTS --- */
.input-group { margin-bottom: 20px; }

.input-group label {
    display: block;
    color: #cbd5e1;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    font-weight: 700;
}

.input-wrapper {
    position: relative;
    display: flex; align-items: center;
}

.input-icon {
    position: absolute;
    left: 16px;
    color: #64748b;
    font-size: 16px;
    z-index: 2;
    transition: color 0.3s;
}

.input-wrapper:focus-within .input-icon { color: #3b82f6; }

.input-wrapper input {
    width: 100%;
    background: #0f172a;
    border: 1px solid #1e293b;
    padding: 16px 16px 16px 45px; /* Space for icon */
    border-radius: 12px;
    color: white;
    font-size: 15px;
    outline: none;
    transition: all 0.2s ease;
    font-weight: 500;
}

.input-wrapper input:focus {
    border-color: #3b82f6;
    background: #0f172a;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.input-wrapper input::placeholder { color: #475569; }

/* --- BUTTON & ERROR --- */
.error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #f87171;
    padding: 12px;
    border-radius: 10px;
    font-size: 13px;
    text-align: center;
    margin-bottom: 20px;
    font-weight: 600;
}

.login-btn {
    width: 100%;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border: none;
    padding: 16px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.login-btn:hover {
    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
    transform: translateY(-2px);
}

.login-btn:active { transform: scale(0.98); }

.login-btn:disabled { opacity: 0.7; cursor: wait; }

/* --- FOOTER --- */
.login-footer {
    margin-top: 30px;
    text-align: center;
    border-top: 1px solid rgba(255,255,255,0.05);
    padding-top: 25px;
}

.login-footer p { color: #64748b; font-size: 13px; margin-bottom: 20px; font-weight: 500; }

.register-link {
    color: #3b82f6;
    text-decoration: none;
    font-weight: 700;
    margin-left: 5px;
    transition: 0.2s;
}
.register-link:hover { color: #60a5fa; text-decoration: underline; }

.secure-badge {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 11px;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: rgba(255,255,255,0.03);
    padding: 6px 14px;
    border-radius: 20px;
    font-weight: 700;
    border: 1px solid rgba(255,255,255,0.02);
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
    const { restaurantId } = useParams(); 
    
    const [formData, setFormData] = useState({ username: restaurantId || "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Ensure state matches URL param if present
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
            const response = await axios.post("https://kovixa-backend-v99-production-a1b2.up.railway.app/api/auth/login", formData);
            
            if (response.data && response.data.token) {
                // Save Tokens
                localStorage.setItem("ownerToken", response.data.token);
                localStorage.setItem("activeResId", response.data._id);
                localStorage.setItem("ownerUsername", response.data.username);
                
                // Redirect to Admin Dashboard
                navigate(`/${response.data.username}/admin`); 
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{styles}</style>

            <div className="login-container">
                <div className="glow-spot top-left"></div>
                <div className="glow-spot bottom-right"></div>

                <div className="login-card">
                    <div className="login-header">
                        <div className="icon-wrapper">
                            <FaLock className="lock-icon" />
                        </div>
                        <h1>Owner Portal</h1>
                        <p>
                            {restaurantId 
                                ? <span>Login to manage <strong style={{color:'#3b82f6'}}>{restaurantId}</strong></span>
                                : "Enter your credentials to access the secure dashboard."
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
                                    disabled={!!restaurantId} 
                                    style={restaurantId ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Password</label>
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
                            {loading ? <span className="spinner"></span> : <>ACCESS DASHBOARD <FaArrowRight /></>}
                        </button>
                    </form>

                    <div className="login-footer">
                        {!restaurantId && (
                            <p>New Business? <Link to="/register" className="register-link">Create Account</Link></p>
                        )}
                        <span className="secure-badge"><FaLock size={10}/> 256-BIT SECURE LOGIN</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OwnerLogin;