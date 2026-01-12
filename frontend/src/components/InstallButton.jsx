import React, { useEffect, useState } from "react";
import { FaDownload, FaTimes } from "react-icons/fa";

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
        <div style={styles.container} className="slide-up">
            <div style={styles.content}>
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
            <style>{`
                .slide-up { animation: slideUp 0.4s ease-out; }
                @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

const styles = {
    container: {
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none' // Allows clicking through the container area
    },
    content: {
        background: 'rgba(15, 23, 42, 0.95)', // Dark Blue Slate
        backdropFilter: 'blur(16px)',
        border: '1px solid #3b82f6', // Electric Blue Border
        padding: '15px 20px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        pointerEvents: 'auto'
    },
    text: {
        flex: 1
    },
    title: {
        margin: 0,
        color: '#fff',
        fontSize: '14px',
        fontWeight: '800'
    },
    desc: {
        margin: 0,
        color: '#94a3b8',
        fontSize: '12px'
    },
    actions: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
    },
    installBtn: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', // Blue Gradient
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '12px',
        fontWeight: 'bold',
        fontSize: '13px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
    },
    closeBtn: {
        background: 'transparent',
        border: '1px solid #334155',
        color: '#94a3b8',
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }
};

export default InstallButton;