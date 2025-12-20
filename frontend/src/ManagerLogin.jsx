import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ManagerLogin = () => {
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    
    // Grabs the username of the currently logged-in owner
    const username = localStorage.getItem("ownerUsername") || "User";

    const handleAccessSubmit = (e) => {
        e.preventDefault();
        
        // 🔐 Universal Manager Password check
        if (password === "bb1972") {
            // Store a local flag to prove they passed this specific login
            localStorage.setItem("managerAuthenticated", "true");
            
            // Allow them into the Admin/Manage Menu area
            navigate("/admin");
        } else {
            alert("❌ Incorrect Manager Password. Access Denied.");
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#05080F', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
            <form onSubmit={handleAccessSubmit} style={{ background: '#111827', padding: '40px', borderRadius: '32px', border: '1px solid #1f2937', width: '100%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                <div style={{ fontSize: '50px', marginBottom: '20px' }}>🛡️</div>
                <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px', color: '#f97316' }}>Manager Access</h2>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '30px' }}>Current User: <span style={{ color: 'white', fontWeight: 'bold' }}>{username}</span></p>
                
                <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', marginLeft: '10px' }}>Secret Manager Password</label>
                    <input 
                        type="password" 
                        placeholder="Enter Code" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '16px', background: '#05080F', border: '1px solid #1f2937', borderRadius: '16px', color: 'white', marginTop: '8px', outline: 'none', fontSize: '18px', textAlign: 'center', letterSpacing: '4px' }}
                        required
                        autoFocus
                    />
                </div>

                <button type="submit" style={{ width: '100%', padding: '18px', background: '#f97316', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.3)' }}>
                    UNLOCK MENU
                </button>

                <button type="button" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#4b5563', marginTop: '20px', cursor: 'pointer', fontSize: '12px' }}>
                    ← Back to Dashboard
                </button>
            </form>
        </div>
    );
};

export default ManagerLogin;