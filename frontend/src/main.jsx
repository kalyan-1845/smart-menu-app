import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// REMOVED: import { Toaster } from 'react-hot-toast'; 

// --- 1. MOBILE AUTO-FIX SYSTEM ---
const APP_VERSION = "v7.0"; 

const performMobileCleanup = async () => {
  const currentVersion = localStorage.getItem("app_version");

  if (currentVersion !== APP_VERSION) {
    console.log("🧹 New Update Found! Cleaning mobile data...");
    localStorage.clear();
    sessionStorage.clear();
    
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    localStorage.setItem("app_version", APP_VERSION);
    window.location.reload(); 
  }
};

performMobileCleanup();

// --- 2. SERVICE WORKER REGISTRATION ---
//#if ('serviceWorker' in navigator) {
 // window.addEventListener('load', () => {
//  navigator.serviceWorker.register('/sw.js')
   //  .then(registration => console.log('✅ SW Active'))
   //  # .catch(err => console.error('❌ SW Failed:', err));
 // });
//#endregion}

// --- 3. RENDER APP ---
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* REMOVED: <Toaster /> */}
    <App />
  </React.StrictMode>,
);