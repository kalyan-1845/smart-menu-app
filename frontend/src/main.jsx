import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { Toaster } from 'react-hot-toast'; 

// --- 1. MOBILE AUTO-FIX SYSTEM (CRITICAL) ---
// This runs BEFORE the app starts to fix "broken" phones automatically.
// We bump the version to v6.0 to force a clean reset for everyone.
const APP_VERSION = "v6.0"; 

const performMobileCleanup = async () => {
  const currentVersion = localStorage.getItem("app_version");

  // If the user has an old version (or no version), WIPE IT CLEAN
  if (currentVersion !== APP_VERSION) {
    console.log("🧹 New Update Found! Cleaning mobile data...");
    
    // 1. Clear Stale Data (Fixes the 400 Bad Request error)
    localStorage.clear();
    sessionStorage.clear();
    
    // 2. Kill Old "Zombie" Service Workers (Fixes the Stuck Loading Screen)
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log("💀 Killed old Service Worker");
      }
    }

    // 3. Save New Version & Reload Page
    localStorage.setItem("app_version", APP_VERSION);
    window.location.reload(); 
  }
};

// Execute Cleanup Immediately
performMobileCleanup();

// --- 2. SERVICE WORKER REGISTRATION (Single, Robust Block) ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker Active:', registration.scope);
        
        // Check for updates in the background
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('🔄 New content available; please refresh.');
              } else {
                console.log('✅ Content is cached for offline use.');
              }
            }
          };
        };
      })
      .catch(err => console.error('❌ Service Worker Failed:', err));
  });
}

// --- 3. RENDER APP ---
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Global Notification Popups */}
    <Toaster position="top-center" reverseOrder={false} />
    <App />
  </React.StrictMode>,
);