import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import axios from "axios";

// --- PAGES ---
import LandingPage from "./pages/LandingPage"; 
import Menu from "./pages/Menu"; 
import Cart from "./pages/Cart";
import OrderTracker from "./pages/OrderTracker";
import OwnerLogin from "./pages/OwnerLogin"; 
import Register from "./pages/Register"; 
import SuperLogin from "./pages/SuperLogin"; 
import Terms from './pages/Terms';
import Maintenance from './pages/Maintenance'; 
import NotFound from './pages/NotFound';

// --- STAFF PANELS ---
import SuperAdmin from "./pages/SuperAdmin";
import RestaurantAdmin from "./pages/RestaurantAdmin";
import ChefDashboard from "./pages/ChefDashboard"; 
import WaiterDashboard from "./pages/WaiterDashboard";

const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const ProtectedSuperAdmin = ({ children }) => {
  const isAuthenticated = localStorage.getItem("superAdminAuth") === "true";
  return isAuthenticated ? children : <Navigate to="/super-login" replace />;
};

const GlobalStyles = () => (
  <style>{`
    :root { font-family: Inter, sans-serif; color: white; background-color: #050505; }
    body { margin: 0; min-height: 100vh; overflow-x: hidden; }
    #root { width: 100%; margin: 0 auto; text-align: center; }
    .page-transition { animation: slideUp 0.4s ease-out forwards; }
    @keyframes slideUp { from { transform: translateY(15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `}</style>
);

function App() {
  // 🛑 FIX: This is the ONLY change. It stops the White Screen crash.
  const [cart, setCart] = useState(() => {
    try {
        const saved = localStorage.getItem("smartMenu_Cart");
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        // If data is broken, reset it instead of crashing the app
        console.error("Cart data corrupted. Resetting.");
        localStorage.removeItem("smartMenu_Cart"); 
        return [];
    }
  });

  const [restaurantId, setRestaurantId] = useState(localStorage.getItem("smartMenu_RestaurantId") || null);
  const [tableNum, setTableNum] = useState(localStorage.getItem("last_table_num") || "");
  const [isMaintenance, setIsMaintenance] = useState(false); 

  // ✅ 1. MAINTENANCE ENGINE
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE}/superadmin/maintenance-status`);
        if (res.data.enabled) setIsMaintenance(true);
      } catch (e) { console.error("System Status Check Failed"); }
    };
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 60000); 
    return () => clearInterval(interval);
  }, []);

  // 2. Persistence Sync
  useEffect(() => { localStorage.setItem("smartMenu_Cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { if(restaurantId) localStorage.setItem("smartMenu_RestaurantId", restaurantId); }, [restaurantId]);

  // --- CART ACTIONS ---
  const addToCart = (dish) => {
    setCart((prev) => {
      // Safety check to prevent crashes if 'prev' is somehow not an array
      const safePrev = Array.isArray(prev) ? prev : [];
      
      const exists = safePrev.find((item) => item._id === dish._id);
      if (exists) return safePrev.map((i) => i._id === dish._id ? { ...i, quantity: i.quantity + (dish.quantity || 1) } : i);
      return [...safePrev, { ...dish, quantity: dish.quantity || 1 }];
    });
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) { setCart(prev => prev.filter(i => i._id !== id)); return; }
    setCart((prev) => prev.map((item) => item._id === id ? { ...item, quantity: newQuantity } : item));
  };

  // ✅ REDIRECT TO MAINTENANCE SCREEN IF ENABLED
  if (isMaintenance && !window.location.pathname.startsWith('/superadmin') && !window.location.pathname.startsWith('/super-login')) {
      return <Maintenance />;
  }

  return (
    <Router>
      <GlobalStyles />
      <ScrollToTop />
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/" element={<LandingPage />} /> 
        <Route path="/login" element={<OwnerLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/terms" element={<Terms />} />
          
        {/* --- CUSTOMER MENU --- */}
        <Route path="/menu/:restaurantId" element={
            <div className="page-transition">
              <Menu cart={cart} addToCart={addToCart} setRestaurantId={setRestaurantId} setTableNum={setTableNum} setCart={setCart} />
            </div>
        } />
        <Route path="/menu/:restaurantId/:table" element={
            <div className="page-transition">
              <Menu cart={cart} addToCart={addToCart} setRestaurantId={setRestaurantId} setTableNum={setTableNum} setCart={setCart} />
            </div>
        } />

        {/* --- CHECKOUT & TRACKING --- */}
        <Route path="/cart" element={
            <div className="page-transition">
              <Cart cart={cart} removeFromCart={(id) => updateQuantity(id, 0)} clearCart={() => setCart([])} updateQuantity={updateQuantity} restaurantId={restaurantId} tableNum={tableNum} setTableNum={setTableNum} />
            </div>
        } />
        <Route path="/track/:id" element={<div className="page-transition"><OrderTracker /></div>} />

        {/* --- 🔐 SUPER ADMIN --- */}
        <Route path="/super-login" element={<SuperLogin />} />
        <Route path="/superadmin" element={<ProtectedSuperAdmin><SuperAdmin /></ProtectedSuperAdmin>} />
        
        {/* --- STAFF PANELS --- */}
        <Route path="/:id/admin" element={<RestaurantAdmin />} />
        <Route path="/:id/chef" element={<ChefDashboard />} />
        <Route path="/:id/kitchen" element={<ChefDashboard />} />
        <Route path="/:id/waiter" element={<WaiterDashboard />} />

        {/* ✅ FINAL CATCH-ALL (404) */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;