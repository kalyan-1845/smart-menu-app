import React, { useEffect, useState } from "react";
import { FaDownload, FaTimes, FaMobileAlt } from "react-icons/fa";

const InstallButton = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Check if app is already installed (Standalone Mode)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        
        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="install-toast slide-up">
            <div style={styles.content}>
                <div style={styles.iconBox}>
                    <FaMobileAlt size={20} color="#3b82f6"/>
                </div>
                <div style={styles.text}>
                    <h3 style={styles.title}>Install App</h3>
                    <p style={styles.desc}>Add to Home Screen for faster access.</p>
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
            
            {/* ⚡️ RESPONSIVE CSS INJECTION */}
            <style>{`
                .install-toast {
                    position: fixed;
                    left: 0; 
                    right: 0;
                    z-index: 9999;
                    display: flex;
                    justify-content: center; /* Centers on PC/Laptop */
                    pointer-events: none; /* Lets clicks pass through the empty areas */
                    
                    /* PC / Default Position */
                    bottom: 30px; 
                    animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }
                
                /* Mobile Adjustment (Moves up to avoid Floating Cart) */
                @media (max-width: 768px) {
                    .install-toast {
                        bottom: 95px; 
                    }
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
        background: 'rgba(15, 23, 42, 0.95)', // Dark Premium Slate
        backdropFilter: 'blur(16px)',          // Glass Effect
        border: '1px solid rgba(59, 130, 246, 0.3)', // Subtle Blue Glow Border
        padding: '12px 16px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        
        // 📏 RESPONSIVE SIZING
        width: '90%',          // Good for Mobile
        maxWidth: '400px',     // Prevents it from being huge on PC
        
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        pointerEvents: 'auto'  // Re-enable clicks on the card itself
    },
    iconBox: {
        minWidth: '40px',
        height: '40px',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    text: {
        flex: 1
    },
    title: {
        margin: 0,
        color: '#fff',
        fontSize: '14px',
        fontWeight: '800',
        marginBottom: '2px',
        lineHeight: 1.2
    },
    desc: {
        margin: 0,
        color: '#94a3b8',
        fontSize: '11px',
        fontWeight: '500',
        lineHeight: 1.2
    },
    actions: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
    },
    installBtn: {
        background: '#3b82f6', 
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '10px',
        fontWeight: '700',
        fontSize: '12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        whiteSpace: 'nowrap' // Prevents text wrapping on tiny screens
    },
    closeBtn: {
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#94a3b8',
        width: '32px',
        height: '32px',
        borderRadius: '10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }
};

export default InstallButton;