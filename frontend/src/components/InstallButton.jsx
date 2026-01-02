import React, { useState, useEffect } from "react";
import { FaRocket, FaDownload } from "react-icons/fa";

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the browser's default prompt from showing immediately
      e.preventDefault();
      // Store the event so it can be triggered later
      setDeferredPrompt(e);
      console.log("✅ PWA Install prompt is ready");
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the native install prompt
    deferredPrompt.prompt();
    
    // Check if the user accepted
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
      setDeferredPrompt(null);
    } else {
      console.log("User dismissed the install prompt");
    }
  };

  // Only show the button if installation is supported and not yet installed
  if (!deferredPrompt) return null;

  return (
    <button 
      onClick={handleInstallClick}
      className="flex items-center gap-2 bg-[#f97316] hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase transition-all shadow-lg shadow-orange-500/20"
    >
      <FaRocket /> Install App
    </button>
  );
};

export default InstallButton;