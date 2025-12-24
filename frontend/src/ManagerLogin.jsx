import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * ManagerLogin Component
 * Acts as a secondary security layer for the Admin Panel.
 * Requires a universal manager password ('bb1972') to proceed.
 */
const ManagerLogin = () => {
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    
    // Grabs the username of the currently logged-in owner
    const username = localStorage.getItem("ownerUsername") || "Authorized User";

    const handleAccessSubmit = (e) => {
        e.preventDefault();
        
        // 🔐 Universal Manager Password check
        if (password === "bb1972") {
            // Store a local flag to prove they passed this specific login gate
            localStorage.setItem("managerAuthenticated", "true");
            
            // Allow them into the Admin/Manage Menu area
            navigate("/admin");
        } else {
            // Clear input on failure to allow a fresh attempt
            setPassword("");
            alert("❌ Incorrect Manager Password. Access Denied.");
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleAccessSubmit} style={styles.card}>
                
                {/* Visual Identity */}
                <div style={styles.shieldIcon}>🛡️</div>
                <h2 style={styles.title}>Manager Access</h2>
                <p style={styles.subtitle}>
                    Verified Staff: <span style={styles.usernameText}>{username}</span>
                </p>
                
                {/* Input Area */}
                <div style={styles.inputWrapper}>
                    <label style={styles.label}>Secret Manager Password</label>
                    <input 
                        type="password" 
                        autoComplete="current-password"
                        placeholder="••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                        required
                        autoFocus
                    />
                </div>

                {/* Actions */}
                <button type="submit" style={styles.submitBtn}>
                    UNLOCK ADMIN AREA
                </button>

                <button 
                    type="button" 
                    onClick={() => navigate(-1)} 
                    style={styles.backBtn}
                >
                    ← Back to Dashboard
                </button>
            </form>
        </div>
    );
};

// --- MODERN STYLES ---
const styles = {
    container: { 
        minHeight: '100vh', 
        background: 'radial-gradient(circle at 50% -10%, #1e1b4b 0%, #05080F 60%)', 
        color: 'white', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        fontFamily: "'Inter', sans-serif", 
        padding: '20px' 
    },
    card: { 
        background: 'rgba(17, 24, 39, 0.8)', 
        backdropFilter: 'blur(10px)',
        padding: '40px', 
        borderRadius: '32px', 
        border: '1px solid rgba(255, 255, 255, 0.1)', 
        width: '100%', 
        maxWidth: '380px', 
        textAlign: 'center', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' 
    },
    shieldIcon: { 
        fontSize: '50px', 
        marginBottom: '20px',
        filter: 'drop-shadow(0 0 10px rgba(249, 115, 22, 0.4))'
    },
    title: { 
        fontSize: '26px', 
        fontWeight: '900', 
        marginBottom: '8px', 
        color: '#f97316',
        letterSpacing: '-0.5px'
    },
    subtitle: { 
        color: '#9ca3af', 
        fontSize: '14px', 
        marginBottom: '30px' 
    },
    usernameText: { 
        color: 'white', 
        fontWeight: 'bold' 
    },
    inputWrapper: { 
        textAlign: 'left', 
        marginBottom: '25px' 
    },
    label: { 
        fontSize: '10px', 
        fontWeight: '900', 
        color: '#4b5563', 
        textTransform: 'uppercase', 
        marginLeft: '10px',
        letterSpacing: '1px'
    },
    input: { 
        width: '100%', 
        padding: '18px', 
        background: '#05080F', 
        border: '1px solid #1f2937', 
        borderRadius: '16px', 
        color: 'white', 
        marginTop: '8px', 
        outline: 'none', 
        fontSize: '20px', 
        textAlign: 'center', 
        letterSpacing: '6px',
        fontWeight: 'bold'
    },
    submitBtn: { 
        width: '100%', 
        padding: '20px', 
        background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', 
        color: 'white', 
        border: 'none', 
        borderRadius: '16px', 
        fontWeight: '900', 
        cursor: 'pointer', 
        boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.3)', 
        transition: '0.3s transform ease',
        fontSize: '14px',
        letterSpacing: '1px'
    },
    backBtn: { 
        background: 'none', 
        border: 'none', 
        color: '#4b5563', 
        marginTop: '25px', 
        cursor: 'pointer', 
        fontSize: '12px', 
        textDecoration: 'none',
        fontWeight: '600'
    }
};

export default ManagerLogin;