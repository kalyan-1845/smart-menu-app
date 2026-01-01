import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { Toaster } from 'react-hot-toast'; // ✅ Ensure you've run 'npm install react-hot-toast'

// --- 🛠️ ENHANCED SERVICE WORKER REGISTRATION ---
// Enables Offline Support, App Install (PWA), and Push Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Registers the worker located in the /public folder
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('✅ BiteBox Service Worker Active:', reg.scope);

        // Logic to detect new code updates and force a refresh
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker == null) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content is available; refresh the page to update the app
                console.log('🚀 New version available! Refreshing for latest updates...');
                window.location.reload();
              } else {
                // Content is now cached for the first time
                console.log('✨ Content is cached for offline use.');
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
    {/* Global Toaster: Configuration for system-wide alerts.
        Styled with a dark glassmorphism effect to match the BiteBox UI.
    */}
    <Toaster 
      position="top-center" 
      reverseOrder={false} 
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#111',
          color: '#fff',
          border: '1px solid #333',
          borderRadius: '16px',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '600',
          fontFamily: "'Inter', sans-serif",
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        },
        success: {
          iconTheme: {
            primary: '#22c55e', // Green for orders/payments
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444', // Red for system errors
            secondary: '#fff',
          },
        },
      }}
    />
    
    <App />
  </React.StrictMode>,
)