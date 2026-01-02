import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { Toaster } from 'react-hot-toast'; // For those pro notifications

// --- 🛠️ ENHANCED SERVICE WORKER REGISTRATION ---
// This enables Offline Support, App Install (PWA), and Push Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('✅ BiteBox Service Worker Active:', reg.scope);

        // Check for updates every time the app is opened
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker == null) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // At this point, the old content will have been purged and
                // the fresh content will have been added to the cache.
                console.log('🚀 New version available! Refreshing for latest updates...');
                window.location.reload();
              } else {
                // At this point, everything has been precached.
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
    {/* Global Toaster: Handles all "Success", "Error", and "Chef Ready" alerts */}
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
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        },
        success: {
          iconTheme: {
            primary: '#22c55e',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
    
    <App />
  </React.StrictMode>,
)