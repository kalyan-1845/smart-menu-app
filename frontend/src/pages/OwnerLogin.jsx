import React, { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import axios from "axios";
import { FaLock, FaStore, FaKey, FaArrowRight } from "react-icons/fa";

// --- INLINE STYLES ---
const styles = `
.login-container {
    background-color: #050505;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    font-family: 'Inter', sans-serif;
    padding: 20px;
}

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
    background: radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%);
}
.bottom-right {
    bottom: -100px;
    right: -100px;
    background: radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, transparent 70%);
}

.login-card {
    background: linear-gradient(180deg, rgba(30, 30, 30, 0.6) 0%, rgba(10, 10, 10, 0.8) 100%);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 40px 30px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    z-index: 1;
}

.icon-wrapper {
    width: 60px; height: 60px;
    background: rgba(249, 115, 22, 0.1);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 15px auto;
    border: 1px solid rgba(249, 115, 22, 0.2);
}

.lock-icon { font-size: 24px; color: #f97316; }

h1 { font-size: 26px; color: white; margin: 0 0 10px 0; font-weight: 900; text-align: center; }
.login-header p { color: #888; font-size: 14px; text-align: center; margin-bottom: 30px; }

.input-group { margin-bottom: 20px; }
.input-group label { display: block; color: #666; font-size: 11px; text-transform: uppercase; font-weight: 900; margin-bottom: 8px; }

.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 15px; color: #444; font-size: 14px; }
.input-wrapper input {
    width: 100%;
    background: #0f0f0f;
    border: 1px solid #222;
    padding: 14px 14px 14px 45px;
    border-radius: 12px;
    color: white;
    font-size: 15px;
    outline: none;
}
.input-wrapper input:focus { border-color: #f97316; background: #151515; }

.error-message { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; padding: 12px; border-radius: 10px; font-size: 13px; text-align: center; margin-bottom: 20px; }

.login-btn {
    width: 100%;
    background: #f97316;
    color: black;
    border: none;
    padding: 16px;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 900;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    text-transform: uppercase;
}

.login-footer { margin-top: 30px; text-align: center; border-top: 1px solid #222; padding-top: 20px; }
.register-link { color: #f97316; text-decoration: none; font-weight: bold; }

.spinner {
    width: 20px; height: 20px;
    border: 3px solid rgba(0,0,0,0.1);
    border-top-color: black;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
`;

const OwnerLogin = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({ username: id || "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (id) setFormData(prev => ({ ...prev, username: id }));
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // --- 🔒 SUPER ADMIN MASTER KEY ---
        if (formData.username === "srinivas" && formData.password === "srividyabb1972") {
            sessionStorage.setItem("isSuperAdmin", "true");
            localStorage.setItem("ownerUsername", "srinivas");
            navigate("/superadmin");
            setLoading(false);
            return;
        }

        // --- NORMAL RESTAURANT OWNER LOGIN ---
        try {
            const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/auth/login", formData);
            
            if (response.data && response.data.token) {
                localStorage.setItem("ownerToken", response.data.token);
                localStorage.setItem("activeResId", response.data._id);
                localStorage.setItem("ownerUsername", response.data.username);
                
                navigate(`/${response.data.username}/admin`); 
            }
        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Invalid credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <style>{styles}</style>
            <div className="glow-spot top-left"></div>
            <div className="glow-spot bottom-right"></div>

            <div className="login-card">
                <div className="icon-wrapper">
                    <FaLock className="lock-icon" />
                </div>
                <h1>Staff Login</h1>
                <p>{id ? `Managing ${id.toUpperCase()}` : "Enter your credentials to manage your BiteBox menu."}</p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Restaurant ID</label>
                        <div className="input-wrapper">
                            <FaStore className="input-icon" />
                            <input 
                                type="text" name="username" placeholder="e.g. deccanfresh"
                                value={formData.username} onChange={handleChange} required
                                disabled={!!id} 
                                style={id ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <FaKey className="input-icon" />
                            <input 
                                type="password" name="password" placeholder="••••••••"
                                value={formData.password} onChange={handleChange} required
                            />
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? <div className="spinner"></div> : <>Enter Dashboard <FaArrowRight /></>}
                    </button>
                </form>

                <div className="login-footer">
                    {!id && <p style={{color:'#666', fontSize:'13px'}}>Need an account? <Link to="/register" className="register-link">Register</Link></p>}
                    <span style={{fontSize:'9px', color:'#333', letterSpacing:'1px'}}>SECURED BY BITEBOX SMART MENU</span>
                </div>
            </div>
        </div>
    );
};

export default OwnerLogin;