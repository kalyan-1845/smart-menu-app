import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";

const SmartRouter = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Check for Owner Login
    const ownerToken = localStorage.getItem("owner_token_kalyanresto1"); // Example ID check, or iterate keys
    // A better way is to check the last visited path or a generic role key
    const lastRole = localStorage.getItem("kovixa_last_role"); 
    const lastId = localStorage.getItem("kovixa_last_id");

    if (lastRole === "owner" && lastId) {
      navigate(`/admin/${lastId}`);
    } else if (lastRole === "chef" && lastId) {
      // Assuming you have a standalone route for chef, e.g., /chef/:id
      // If chef is just a tab in admin, you might need a query param
      navigate(`/admin/${lastId}?tab=chef`); 
    } else if (lastRole === "waiter" && lastId) {
      navigate(`/admin/${lastId}?tab=waiter`);
    } else {
      // Default: Go to Landing Page
      navigate("/landing");
    }
  }, [navigate]);

  return (
    <div style={{height: "100vh", background: "#050505", display: "flex", justifyContent: "center", alignItems: "center", color: "#f97316"}}>
      <FaSpinner className="spin" size={40} />
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SmartRouter;