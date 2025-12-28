import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserSecret, FaLock, FaArrowRight } from "react-icons/fa";

const SuperLogin = () => {
  const [secret, setSecret] = useState("");
  const [isShake, setIsShake] = useState(false);
  const navigate = useNavigate();

  // 🛡️ SECURITY CONFIGURATION
  const LOCKOUT_KEY = "system_integrity_check"; // Stores time when locked
  const ATTEMPT_KEY = "sys_retry_count";        // Stores number of wrong attempts
  const LOCKOUT_TIME = 2 * 60 * 60 * 1000;      // 2 Hours
  const MASTER_KEY = "srividyabb1972"; 
  const MAX_ATTEMPTS = 3;                       // 3 Strikes Rule

  const handleLogin = (e) => {
    e.preventDefault();

    // 🚨 BACKDOOR RESET (Clears Lock & Attempts)
    if (secret === "RESET") {
        localStorage.removeItem(LOCKOUT_KEY);
        localStorage.removeItem(ATTEMPT_KEY);
        alert("🔒 SYSTEM RESET: Lock & Attempts cleared.");
        setSecret("");
        return;
    }

    // 1. CHECK IF ALREADY LOCKED
    const lockedUntil = localStorage.getItem(LOCKOUT_KEY);
    const currentTime = Date.now();

    if (lockedUntil && currentTime < parseInt(lockedUntil)) {
      console.log("⛔ System is LOCKED. Wait 2 hours.");
      triggerSilentFail(); 
      return;
    }

    // 2. VERIFY PASSWORD
    if (secret === MASTER_KEY) {
      // ✅ SUCCESS
      console.log("✅ Access Granted");
      sessionStorage.setItem("isSuperAdmin", "true"); 
      
      // Clear security keys on success
      localStorage.removeItem(LOCKOUT_KEY); 
      localStorage.removeItem(ATTEMPT_KEY);
      
      navigate("/ceo");
    } else {
      // ❌ WRONG PASSWORD LOGIC
      handleFailedAttempt();
    }
  };

  const handleFailedAttempt = () => {
    // Get current fails (default to 0)
    let currentAttempts = parseInt(localStorage.getItem(ATTEMPT_KEY) || "0");
    currentAttempts += 1;

    console.log(`❌ Wrong Password. Attempt ${currentAttempts}/${MAX_ATTEMPTS}`);

    if (currentAttempts >= MAX_ATTEMPTS) {
        // ⛔ 3RD STRIKE: LOCK THE SYSTEM
        const newLockoutTime = Date.now() + LOCKOUT_TIME;
        localStorage.setItem(LOCKOUT_KEY, newLockoutTime.toString());
        localStorage.removeItem(ATTEMPT_KEY); // Reset count so they start fresh after 2 hours
        console.log("🔒 SYSTEM LOCKED FOR 2 HOURS");
    } else {
        // ⚠️ SAVE ATTEMPT COUNT
        localStorage.setItem(ATTEMPT_KEY, currentAttempts.toString());
    }

    triggerSilentFail();
  };

  const triggerSilentFail = () => {
    setIsShake(true);
    setSecret(""); 
    setTimeout(() => setIsShake(false), 500);
  };

  return (
    <div style={{ height: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "Inter" }}>
      <div style={{ width: "350px", padding: "40px", background: "#111", borderRadius: "20px", border: "1px solid #222", textAlign: "center" }}>
        <FaUserSecret size={50} color="#f97316" style={{ marginBottom: "20px" }} />
        <h1 style={{ fontSize: "24px", fontWeight: "900", margin: "0 0 10px 0" }}>CEO ACCESS</h1>
        <p style={{ color: "#666", fontSize: "12px", marginBottom: "30px" }}>Restricted Area. Authorized Personnel Only.</p>
        
        <form onSubmit={handleLogin}>
          <div style={{ position: "relative", marginBottom: "20px" }}>
            <FaLock style={{ position: "absolute", left: "15px", top: "15px", color: "#555" }} />
            <input 
              type="password" 
              placeholder="Enter Master Key" 
              value={secret} 
              onChange={(e) => setSecret(e.target.value)}
              className={isShake ? "shake" : ""}
              style={{ 
                width: "100%", 
                padding: "15px 15px 15px 45px", 
                background: "#000", 
                border: isShake ? "1px solid #ef4444" : "1px solid #333", 
                borderRadius: "10px", 
                color: "white", 
                outline: "none",
                transition: "border 0.2s"
              }}
            />
          </div>
          <button type="submit" style={{ width: "100%", padding: "15px", background: "#f97316", border: "none", borderRadius: "10px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            ENTER PANEL <FaArrowRight />
          </button>
        </form>
      </div>

      <style>{`
        .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};

export default SuperLogin;