import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import axios from "axios";

// --- ✅ 1. MAKE SURE THESE IMPORTS EXIST ---
import LandingPage from "./pages/LandingPage"; 
import Menu from "./pages/Menu"; 
import Cart from "./pages/Cart";
import OrderTracker from "./pages/OrderTracker";
import OwnerLogin from "./pages/OwnerLogin"; // <--- CRITICAL
import Register from "./pages/Register";     // <--- CRITICAL
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
    * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; outline: none; }
  `}</style>
);

function App() {
  // 1. UNIQUE CUSTOMER FINGERPRINT
  const [customerId] = useState(() => {
    let id = localStorage.getItem("smartMenu_CustomerId");
    if (!id) {
      id = `CUST-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
      localStorage.setItem("smartMenu_CustomerId", id);
    }
    return id;
  });

  // 2. RESTAURANT STATE
  const [restaurantId, setRestaurantId] = useState(localStorage.getItem("smartMenu_ActiveRest") || null);

  // 3. CART STATE (Locked to Restaurant + Customer)
  const [cart, setCart] = useState(() => {
    const activeRest = localStorage.getItem("smartMenu_ActiveRest");
    if (!activeRest) return [];
    const saved = localStorage.getItem(`cart_${activeRest}_${customerId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [tableNum, setTableNum] = useState(localStorage.getItem(`table_${restaurantId}`) || "");
  const [isMaintenance, setIsMaintenance] = useState(false);

  // 4. MAINTENANCE CHECK
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE}/superadmin/maintenance-status?t=${Date.now()}`);
        if (res.data.enabled) setIsMaintenance(true);
      } catch (e) { }
    };
    checkSystemStatus();
  }, []);

  // 5. PERSISTENCE
  useEffect(() => { 
    if (restaurantId) {
      localStorage.setItem(`cart_${restaurantId}_${customerId}`, JSON.stringify(cart));
      localStorage.setItem("smartMenu_ActiveRest", restaurantId);
    }
  }, [cart, restaurantId, customerId]);

  const addToCart = (dish) => {
    if ("vibrate" in navigator) navigator.vibrate(40);
    setCart((prev) => {
      const exists = prev.find((item) => item._id === dish._id);
      if (exists) {
        return prev.map((i) => i._id === dish._id ? { ...i, quantity: i.quantity + (dish.quantity || 1) } : i );
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
    if (restaurantId !== id) {
      const saved = localStorage.getItem(`cart_${id}_${customerId}`);
      setCart(saved ? JSON.parse(saved) : []);
      setRestaurantId(id);
      localStorage.setItem("smartMenu_ActiveRest", id);
    }
  };

  const handleSetTable = (num) => {
    setTableNum(num);
    localStorage.setItem(`table_${restaurantId}`, num);
  };

  // MAINTENANCE REDIRECT
  if (isMaintenance && !window.location.pathname.includes('super')) {
      return <Maintenance />;
  }

  return (
    <Router>
      <GlobalStyles />
      <ScrollToTop />
      <Routes>
        {/* --- PUBLIC PAGES --- */}
        <Route path="/" element={<LandingPage />} /> 
        
        {/* ✅ 2. HERE ARE THE MISSING ROUTES */}
        <Route path="/login" element={<OwnerLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/terms" element={<Terms />} />
          
        {/* --- CUSTOMER MENU FLOW --- */}
        <Route path="/menu/:restaurantId" element={
            <div className="page-transition">
              <Menu 
                cart={cart} 
                addToCart={addToCart} 
                setRestaurantId={handleSetRestaurantId} 
                setTableNum={handleSetTable} 
                setCart={setCart} 
                customerId={customerId} // Required for unique links
              />
            </div>
        } />
        <Route path="/menu/:restaurantId/:table" element={
            <div className="page-transition">
              <Menu 
                cart={cart} 
                addToCart={addToCart} 
                setRestaurantId={handleSetRestaurantId} 
                setTableNum={handleSetTable} 
                setCart={setCart} 
                customerId={customerId} 
              />
            </div>
        } />

        {/* --- CART FLOW (Unique URL) --- */}
        <Route path="/:restaurantId/cart/:customerId" element={
            <div className="page-transition">
              <Cart 
                cart={cart} 
                customerId={customerId} 
                removeFromCart={(id) => updateQuantity(id, 0)} 
                clearCart={() => {
                   setCart([]); 
                   localStorage.removeItem(`cart_${restaurantId}_${customerId}`);
                }} 
                updateQuantity={updateQuantity} 
                tableNum={tableNum} 
                setTableNum={handleSetTable} 
              />
            </div>
        } />
        
        {/* --- TRACKING FLOW --- */}
        <Route path="/track/:id" element={<div className="page-transition"><OrderTracker /></div>} />
        
        {/* --- ADMIN & STAFF --- */}
        <Route path="/super-login" element={<SuperLogin />} />
        <Route path="/superadmin" element={<ProtectedSuperAdmin><SuperAdmin /></ProtectedSuperAdmin>} />
        
        <Route path="/:id/admin" element={<RestaurantAdmin />} />
        <Route path="/:id/chef" element={<ChefDashboard />} />
        <Route path="/:id/kitchen" element={<ChefDashboard />} />
        <Route path="/:id/waiter" element={<WaiterDashboard />} />

        {/* --- 404 PAGE --- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;