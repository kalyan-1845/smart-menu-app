import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { Toaster } from 'react-hot-toast';

// --- 🛠️ INDUSTRIAL SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('✅ BiteBox Service Worker Active:', reg.scope);

        // Update logic: ensures the app stays fresh for Chefs and Waiters
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker == null) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Trigger a "New Version" toast or auto-reload
                console.log('🚀 New version available! Refreshing...');
                // We send a message to the SW to skipWaiting
                installingWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              } else {
                console.log('✨ BiteBox is ready for offline use.');
              }
            }
          };
        };
      })
      .catch(err => console.error('❌ Service Worker Registration Failed:', err));
  });
}

// Render the application root
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Global Toaster: Refined for the Dark Premium Theme */}
    <Toaster 
      position="top-center" 
      reverseOrder={false} 
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#0a0a0a',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '16px 24px',
          fontSize: '14px',
          fontWeight: '600',
          fontFamily: "'Inter', sans-serif",
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)' // Glassmorphism effect
        },
        success: {
          iconTheme: {
            primary: '#22c55e',
            secondary: '#000',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#000',
          },
        },
      }}
    />
    
    <App />
  </React.StrictMode>,
)