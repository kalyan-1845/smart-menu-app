import React, { useState, useEffect, useCallback } from "react";
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
    :root { font-family: 'Inter', sans-serif; color: white; background-color: #050505; }
    body { margin: 0; min-height: 100vh; overflow-x: hidden; background-color: #050505; }
    #root { width: 100%; margin: 0 auto; text-align: center; }
    .page-transition { animation: slideUp 0.4s ease-out forwards; }
    @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  `}</style>
);

function App() {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("smartMenu_Cart") || "[]"));
  const [restaurantId, setRestaurantId] = useState(localStorage.getItem("smartMenu_RestaurantId") || null);
  const [tableNum, setTableNum] = useState(localStorage.getItem("last_table_scanned") || "");
  const [isMaintenance, setIsMaintenance] = useState(false);

  // ✅ 1. SYSTEM MAINTENANCE CHECK
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE}/superadmin/maintenance-status?t=${Date.now()}`);
        if (res.data.enabled) setIsMaintenance(true);
      } catch (e) { console.error("Maintenance check silent fail"); }
    };
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 60000); 
    return () => clearInterval(interval);
  }, []);

  // ✅ 2. SMART DATA PERSISTENCE
  useEffect(() => { 
    localStorage.setItem("smartMenu_Cart", JSON.stringify(cart)); 
  }, [cart]);

  // ✅ 3. CART ACTIONS (With Haptics)
  const addToCart = (dish) => {
    if ("vibrate" in navigator) navigator.vibrate(40);
    setCart((prev) => {
      const exists = prev.find((item) => item._id === dish._id);
      if (exists) {
        return prev.map((i) => i._id === dish._id 
          ? { ...i, quantity: i.quantity + (dish.quantity || 1) } 
          : i
        );
      }
      return [...prev, { ...dish, quantity: dish.quantity || 1 }];
    });
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(i => i._id !== id));
      return;
    }
    setCart((prev) => prev.map((item) => item._id === id ? { ...item, quantity: newQuantity } : item));
  };

  const handleSetRestaurantId = (id) => {
    const previousId = localStorage.getItem("smartMenu_RestaurantId");
    if (previousId && previousId !== id) {
      // Scanned a different restaurant - reset cart to prevent wrong orders
      setCart([]);
    }
    setRestaurantId(id);
    localStorage.setItem("smartMenu_RestaurantId", id);
  };

  // ✅ MAINTENANCE REDIRECT
  if (isMaintenance && !window.location.pathname.startsWith('/superadmin') && !window.location.pathname.startsWith('/super-login')) {
      return <Maintenance />;
  }

  return (
    <Router>
      <GlobalStyles />
      <ScrollToTop />
      <Routes>
        {/* --- PUBLIC --- */}
        <Route path="/" element={<LandingPage />} /> 
        <Route path="/login" element={<OwnerLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/terms" element={<Terms />} />
          
        {/* --- CUSTOMER FLOW --- */}
        <Route path="/menu/:restaurantId" element={
            <div className="page-transition">
              <Menu cart={cart} addToCart={addToCart} setRestaurantId={handleSetRestaurantId} setTableNum={setTableNum} setCart={setCart} />
            </div>
        } />
        <Route path="/menu/:restaurantId/:table" element={
            <div className="page-transition">
              <Menu cart={cart} addToCart={addToCart} setRestaurantId={handleSetRestaurantId} setTableNum={setTableNum} setCart={setCart} />
            </div>
        } />

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

        {/* --- 404 --- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;