import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import axios from "axios";
import { FaLock, FaStore, FaKey, FaArrowRight } from "react-icons/fa";

// 🚀 SMART API SWITCHER
const getApiBase = () => {
    const host = window.location.hostname;
    // Check for local development environments
    if (host === "localhost" || host.startsWith("192.168") || host.startsWith("10.") || host === "127.0.0.1") {
        return `http://${window.location.hostname}:5000/api`;
    }
    // Production URL
    return "https://smart-menu-backend-5ge7.onrender.com/api";
};

// --- STYLES ---
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
.login-container { background: radial-gradient(circle at top, #1a0f0a 0%, #000000 70%); min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; font-family: 'Inter', sans-serif; padding: 20px; }
.login-card { background: rgba(20, 20, 20, 0.8); backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 40px 30px; width: 100%; max-width: 400px; z-index: 10; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
.input-group { position: relative; margin-bottom: 20px; }
.input-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #666; }
.input-field { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid #333; padding: 14px 14px 14px 45px; border-radius: 12px; color: white; font-size: 14px; transition: 0.3s; outline: none; }
.input-field:focus { border-color: #f97316; box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1); background: rgba(0,0,0,0.5); }
.login-btn { width: 100%; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 16px; border-radius: 14px; font-weight: 800; color: white; cursor: pointer; border: none; font-size: 14px; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; gap: 10px; transition: 0.3s; margin-top: 10px; }
.login-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(234, 88, 12, 0.3); }
.login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.error-message { color: #ef4444; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.2); padding: 12px; border-radius: 10px; margin-bottom: 20px; font-size: 13px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; }
.brand-icon { width: 60px; height: 60px; background: rgba(249, 115, 22, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 1px solid rgba(249, 115, 22, 0.2); }
`;

const OwnerLogin = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    
    // Auto-fill username from URL
    const [formData, setFormData] = useState({ username: id || "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    const API_BASE = getApiBase();

    // 🔒 SECURITY: Block access without ID
    useEffect(() => {
        if (!id) {
            // Optional: You could redirect to a general login page instead
            // navigate("/login"); 
        } else {
            setFormData(prev => ({ ...prev, username: id }));
        }
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await axios.post(`${API_BASE}/auth/login`, formData);
            
            if (response.data && response.data.token) {
                // ✅ 1. SAVE TO LOCAL STORAGE
                // Using keys consistent with your Admin Panel
                localStorage.setItem(`owner_token_${id}`, response.data.token);
                localStorage.setItem(`owner_id_${id}`, response.data._id || response.data.restaurant?._id);
                localStorage.setItem("activeResId", id); // Global backup

                // ✅ 2. NAVIGATE CORRECTLY
                // This ensures the URL is /restaurantName/admin
                navigate(`/${id}/admin`); 
            } else {
                setError("Login succeeded but server sent no token.");
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError(err.response?.data?.message || "Connection Failed. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    if (!id) {
        return (
            <div className="login-container">
                 <style>{styles}</style>
                 <div className="login-card" style={{textAlign: 'center'}}>
                    <h2 style={{color: 'white'}}>Welcome</h2>
                    <p style={{color: '#888', fontSize: '14px', marginBottom: '20px'}}>Please scan your QR code or use your specific restaurant link to log in.</p>
                 </div>
            </div>
        )
    }

    return (
        <div className="login-container">
            <style>{styles}</style>
            
            {/* Background decoration */}
            <div style={{position:'absolute', top:'-10%', left:'-10%', width:'300px', height:'300px', background:'#f97316', filter:'blur(150px)', opacity:'0.2', borderRadius:'50%'}}></div>

            <div className="login-card">
                <div className="brand-icon">
                    <FaStore size={24} color="#f97316" />
                </div>
                
                <h1 style={{color:'white', textAlign:'center', fontSize:'24px', margin:'0 0 5px 0', fontWeight:'800'}}>
                    {id.toUpperCase()}
                </h1>
                <p style={{color:'#888', textAlign:'center', fontSize:'13px', margin:'0 0 30px 0'}}>
                    Owner Dashboard Access
                </p>

                <form onSubmit={handleSubmit}>
                    {/* Username Field (Read Only) */}
                    <div className="input-group">
                        <FaStore className="input-icon" />
                        <input 
                            className="input-field" 
                            type="text" 
                            name="username" 
                            value={formData.username} 
                            readOnly 
                            style={{ opacity: 0.7, cursor: 'not-allowed' }}
                        />
                    </div>

                    {/* Password Field */}
                    <div className="input-group">
                        <FaKey className="input-icon" />
                        <input 
                            className="input-field"
                            type="password" 
                            name="password" 
                            value={formData.password} 
                            onChange={handleChange} 
                            placeholder="Enter Admin Password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            <FaLock size={12} /> {error}
                        </div>
                    )}

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? "Authenticating..." : <>Access Dashboard <FaArrowRight /></>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OwnerLogin;