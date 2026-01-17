import React, { useEffect, useState } from "react";
import { FaDownload, FaTimes, FaMobileAlt } from "react-icons/fa";

const InstallButton = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="install-toast slide-up">
            <div style={styles.content}>
                
                {/* 🌟 LOGO BOX (Adjusted for Perfection) */}
                <div style={styles.iconBox}>
                    {/* OPTION 1: Default Icon */}
                    <FaMobileAlt size={24} color="#3b82f6" />

                    {/* OPTION 2: Use your real logo (Uncomment below and remove FaMobileAlt above) */}
                    {/* <img src="/logo.png" alt="App Logo" style={{width:'100%', height:'100%', objectFit:'cover'}} /> */}
                </div>

                <div style={styles.text}>
                    <h3 style={styles.title}>Install App</h3>
                    <p style={styles.desc}>Add to Home Screen</p>
                </div>
                
                <div style={styles.actions}>
                    <button onClick={() => setIsVisible(false)} style={styles.closeBtn}>
                        <FaTimes />
                    </button>
                    <button onClick={handleInstallClick} style={styles.installBtn}>
                        <FaDownload /> Install
                    </button>
                </div>
            </div>
            
            <style>{`
                .install-toast {
                    position: fixed; left: 0; right: 0; z-index: 9999;
                    display: flex; justify-content: center;
                    pointer-events: none;
                    bottom: 30px; 
                    animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }
                
                /* Mobile: Move up to avoid floating cart */
                @media (max-width: 768px) {
                    .install-toast { bottom: 95px; }
                }

                @keyframes slideUp { 
                    from { transform: translateY(100px); opacity: 0; } 
                    to { transform: translateY(0); opacity: 1; } 
                }
            `}</style>
        </div>
    );
};

const styles = {
    content: {
        background: 'rgba(15, 23, 42, 0.95)', 
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        padding: '10px 14px', // Tighter padding for a sleeker look
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        pointerEvents: 'auto'
    },
    
    // ✅ PERFECT LOGO BOX
    iconBox: {
        width: '48px',  // Standard App Icon Size
        height: '48px',
        minWidth: '48px',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', // Premium Gradient
        borderRadius: '12px', // Apple-style rounded corners
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden' // Ensures image stays inside corners
    },
    
    text: { flex: 1 },
    title: { margin: 0, color: '#fff', fontSize: '14px', fontWeight: '800', lineHeight: 1.2 },
    desc: { margin: 0, color: '#94a3b8', fontSize: '11px', fontWeight: '500', lineHeight: 1.2 },
    
    actions: { display: 'flex', gap: '8px', alignItems: 'center' },
    
    installBtn: {
        background: '#3b82f6', color: 'white', border: 'none',
        padding: '8px 16px', borderRadius: '10px',
        fontWeight: '700', fontSize: '12px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '6px',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        whiteSpace: 'nowrap'
    },
    
    closeBtn: {
        background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
        color: '#94a3b8', width: '30px', height: '30px', borderRadius: '50%',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }
};

export default InstallButton;