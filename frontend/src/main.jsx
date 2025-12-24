import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { Toaster } from 'react-hot-toast'; // For those pro notifications

// --- 🛠️ SERVICE WORKER REGISTRATION ---
// This tells the browser to use our background script for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ Service Worker Active:', reg.scope))
      .catch(err => console.error('❌ Service Worker Failed:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* The Toaster handles all your "Success" and "Error" popups globally */}
    <Toaster position="top-center" reverseOrder={false} />
    <App />
  </React.StrictMode>,
)