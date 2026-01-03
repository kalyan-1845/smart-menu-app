import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { Toaster } from 'react-hot-toast';

// --- 🛠️ STABLE INDUSTRIAL SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // 1. Clean registration of the Service Worker
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('✅ BiteBox OS Active:', reg.scope);

        // 2. Handle background updates properly without force-reloading URLs
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker == null) return;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🚀 System update ready. Refresh to apply.');
            }
          };
        };
      })
      .catch(err => console.error('❌ Sync Failed:', err));
  });
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