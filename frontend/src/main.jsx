import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { Toaster } from 'react-hot-toast'; // For those pro notifications

// --- 🛠️ ENHANCED SERVICE WORKER REGISTRATION ---
// This tells the browser to use our background script for offline support & Push Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('✅ BiteBox Service Worker Active:', reg.scope);

        // Check for updates every time the app is opened
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content is available; force reload or notify user
                console.log('🚀 New version available! Refreshing...');
                window.location.reload();
              }
            }
          };
        };
      })
      .catch(err => console.error('❌ Service Worker Failed:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* The Toaster handles all your "Success" and "Error" popups globally */}
    <Toaster 
      position="top-center" 
      reverseOrder={false} 
      toastOptions={{
        style: {
          background: '#111',
          color: '#fff',
          border: '1px solid #333',
          borderRadius: '12px',
          fontFamily: 'Inter, sans-serif'
        }
      }}
    />
    <App />
  </React.StrictMode>,
)