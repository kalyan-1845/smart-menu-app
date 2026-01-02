import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { Toaster } from 'react-hot-toast';

// --- 🛠️ EMERGENCY CACHE CLEAR & SERVICE WORKER ---
// This kills broken cached versions on customers' phones and registers a fresh worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // 1. Force unregister any existing broken workers first
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let registration of registrations) {
        registration.unregister();
      }
    });

    // 2. Register fresh Service Worker
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('✅ BiteBox OS Active:', reg.scope);

        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker == null) return;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Automatically reload to apply the fix for the customer
              console.log('🚀 Update found! Applying system fix...');
              window.location.reload();
            }
          };
        };
      })
      .catch(err => console.error('❌ Sync Failed:', err));
  });

  // 3. One-time URL bypass to kill "MIME type" browser caching
  if (!window.location.search.includes('v=2.1')) {
    const newUrl = window.location.href + (window.location.search ? '&' : '?') + 'v=2.1';
    window.location.replace(newUrl);
  }
}

// Render the application root
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Toaster 
      position="top-center" 
      toastOptions={{
        duration: 4000,
        style: {
          background: '#111',
          color: '#fff',
          border: '1px solid #333',
          borderRadius: '16px',
          fontFamily: 'Inter, sans-serif',
        },
        success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }}
    />
    <App />
  </React.StrictMode>
);