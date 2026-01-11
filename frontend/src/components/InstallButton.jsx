import React, { useState, useEffect } from "react";
import { FaRocket, FaTimes, FaDownload } from "react-icons/fa";
import { useLocation, useParams } from "react-router-dom";

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const { id } = useParams(); // Get Restaurant ID if available

  useEffect(() => {
    // 🕵️‍♂️ SMART LOGIC: DETECT QR CODE VS REPEAT USER
    const path = window.location.pathname;
    const parts = path.split('/').filter(p => p !== "");

    // 1. HIDE for Customers eating once (QR Scans)
    //    Format: /menu/:id/:table
    const isQRScan = path.includes('/menu/') && parts.length >= 3;

    // 2. SHOW for Staff (Admin, Chef, Waiter)
    if (isQRScan) {
      console.log("QR Scan detected - Suppressing Install Prompt");
      return; 
    }

    // 3. Listen for browser install event
    const handler = (e) => {
      e.preventDefault(); 
      setDeferredPrompt(e);
      // Wait 3 seconds so it doesn't annoy them immediately
      setTimeout(() => setIsVisible(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // 🚀 CRITICAL STEP: SAVE CONTEXT BEFORE INSTALLING
    // This ensures the installed app opens to the right screen immediately.
    const path = location.pathname;
    
    if (id) {
        localStorage.setItem("kovixa_last_id", id);
        
        if (path.includes("/chef") || path.includes("/kitchen")) {
            localStorage.setItem("kovixa_last_role", "chef");
        } else if (path.includes("/waiter")) {
            localStorage.setItem("kovixa_last_role", "waiter");
        } else if (path.includes("/admin")) {
            localStorage.setItem("kovixa_last_role", "owner");
        }
    }

    // Show the browser prompt
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  if (!deferredPrompt || !isVisible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.card} className="slide-up">
        
        <button onClick={() => setIsVisible(false)} style={styles.closeBtn}>
          <FaTimes />
        </button>

        <div style={styles.content}>
          <div style={styles.iconBox}>
            <FaRocket size={24} color="#f97316" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={styles.title}>Install App</h3>
            <p style={styles.text}>
                {location.pathname.includes('chef') ? "Get the Kitchen Display App" : 
                 location.pathname.includes('waiter') ? "Get the Waiter App" : 
                 "Add to Home Screen for fullscreen access."}
            </p>
          </div>
        </div>

        <button onClick={handleInstallClick} style={styles.installBtn}>
          <FaDownload /> INSTALL NOW
        </button>

      </div>
      <style>{`
        .slide-up { animation: slideUp 0.5s ease-out forwards; }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none' 
  },
  card: {
    background: 'rgba(20, 20, 20, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid #333',
    borderRadius: '20px',
    padding: '20px',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    pointerEvents: 'auto',
    position: 'relative'
  },
  closeBtn: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    padding: '5px'
  },
  content: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' },
  iconBox: { width: '50px', height: '50px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { margin: '0 0 5px 0', color: 'white', fontSize: '16px', fontWeight: 'bold' },
  text: { margin: 0, color: '#888', fontSize: '12px', lineHeight: '1.4' },
  installBtn: { width: '100%', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)' }
};

export default InstallButton;