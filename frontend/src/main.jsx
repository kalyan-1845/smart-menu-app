import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' 
import { Toaster } from 'react-hot-toast';

// --- 📲 1. PWA INSTALL CAPTURE (CRITICAL FIX) ---
// This listens for the browser's install event and saves it for your button.
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67+ from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later by <InstallButton />
  window.deferredPrompt = e;
  console.log("✅ PWA Install Event Captured");
});

// --- 🛠️ 2. INDUSTRIAL SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('✅ Service Worker Active:', reg.scope);

        // Auto-Update Logic
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker == null) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('🚀 New version available! Refreshing...');
                installingWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          };
        };
      })
      .catch(err => console.error('❌ SW Registration Failed:', err));
  });
}

// --- 3. RENDER APP ---
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Global Toaster: Matches "Midnight Glass" Theme */}
    <Toaster 
      position="top-center" 
      reverseOrder={false} 
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(15, 23, 42, 0.95)', // Dark Slate
          color: '#fff',
          border: '1px solid rgba(59, 130, 246, 0.3)', // Blue Glow
          borderRadius: '16px',
          padding: '16px 24px',
          fontSize: '14px',
          fontWeight: '600',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)'
        },
        success: {
          iconTheme: { primary: '#22c55e', secondary: '#000' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#000' },
        },
      }}
    />
    
    <App />
  </React.StrictMode>,
)