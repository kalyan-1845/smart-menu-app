import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ManagerLogin = () => {
    const [password, setPassword] = useState("");
    const [error, setError] = useState(""); // Added error state for better UI feedback
    const navigate = useNavigate();
    
    const username = localStorage.getItem("ownerUsername") || "Authorized User";

    // Clear any stale auth state on mount
    useEffect(() => {
        localStorage.removeItem("managerAuthenticated");
    }, []);

    const handleAccessSubmit = (e) => {
        e.preventDefault();
        setError(""); // Clear previous errors

        if (password === "bb1972") {
            localStorage.setItem("managerAuthenticated", "true");
            navigate("/admin");
        } else {
            setPassword("");
            setError("❌ Incorrect Password"); // Set error message instead of alert
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleAccessSubmit} style={styles.card}>
                <div style={styles.shieldIcon}>🛡️</div>
                <h2 style={styles.title}>Manager Access</h2>
                <p style={styles.subtitle}>
                    Verified Staff: <span style={styles.usernameText}>{username}</span>
                </p>
                
                <div style={styles.inputWrapper}>
                    <label style={styles.label}>Secret Manager Password</label>
                    <input 
                        type="password" 
                        autoComplete="current-password"
                        placeholder="••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{...styles.input, borderColor: error ? '#ef4444' : '#1f2937'}} // Red border on error
                        required
                        autoFocus
                    />
                    {/* Error Message Display */}
                    {error && <p style={{color: '#ef4444', fontSize: '12px', marginTop: '5px', fontWeight: 'bold'}}>{error}</p>}
                </div>

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

const styles = {
    // ... (Your existing styles are fine, keep them here)
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