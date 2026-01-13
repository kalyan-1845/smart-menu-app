import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

// --- EXISTING IMPORTS ---
import LandingPage from "./pages/LandingPage"; 
import Menu from "./pages/Menu"; 
import Cart from "./pages/Cart";
import OwnerLogin from "./pages/OwnerLogin"; 
import Register from "./pages/Register";    
import Terms from './pages/Terms';
import Maintenance from './pages/Maintenance';
import NotFound from './pages/NotFound';

// --- STAFF PANELS ---
import SuperAdmin from "./pages/SuperAdmin"; 
import RestaurantAdmin from "./pages/RestaurantAdmin";

// ✅ NEW IMPORTS
import RoleLogin from "./pages/RoleLogin"; 
import ProjectFlyer from "./components/ProjectFlyer"; // Ensure this path is correct

const API_BASE = "https://smart-menu-app-production.up.railway.app/api";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

// --- 🚦 SMART ROUTER COMPONENT ---
const SmartHome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const lastRole = localStorage.getItem("kovixa_last_role");
    const lastId = localStorage.getItem("kovixa_last_id");

    if (lastId && lastRole === "owner") {
       navigate(`/${lastId}/admin`, { replace: true });
    }
  }, [navigate]);

  return <LandingPage />;
};

// 🎨 GLOBAL STYLES (Full Screen Fix)
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    :root { 
        font-family: 'Plus Jakarta Sans', sans-serif; 
        color: white; 
        background-color: #020617; 
    }

    html, body { 
        width: 100%; 
        height: 100%; 
        margin: 0; 
        padding: 0; 
        background-color: #020617; 
        overflow-x: hidden; 
    }

    #root { 
        width: 100%; 
        min-height: 100vh; 
        display: flex; 
        flex-direction: column;
    }

    /* Page Transitions */
    .page-transition { 
        flex: 1; 
        display: flex; 
        flex-direction: column; 
        animation: fadeUp 0.3s ease-out forwards; 
    }
    @keyframes fadeUp { 
        from { opacity: 0; transform: translateY(10px); } 
        to { opacity: 1; transform: translateY(0); } 
    }

    /* Reset & Scrollbar */
    * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; outline: none; }
    
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0f172a; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #475569; }
  `}</style>
);

function App() {
  const [customerId] = useState(() => {
    let id = localStorage.getItem("smartMenu_CustomerId");
    if (!id) {
      id = `CUST-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
      localStorage.setItem("smartMenu_CustomerId", id);
    }
    return id;
  });

  const [restaurantId, setRestaurantId] = useState(localStorage.getItem("smartMenu_ActiveRest") || null);

  const [cart, setCart] = useState(() => {
    const activeRest = localStorage.getItem("smartMenu_ActiveRest");
    if (!activeRest) return [];
    const saved = localStorage.getItem(`cart_${activeRest}_${customerId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [tableNum, setTableNum] = useState(localStorage.getItem(`table_${restaurantId}`) || "");
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE}/superadmin/maintenance-status?t=${Date.now()}`);
        if (res.data.enabled) setIsMaintenance(true);
      } catch (e) { }
    };
    checkSystemStatus();
  }, []);

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

  if (isMaintenance && !window.location.pathname.includes('super')) {
      return <Maintenance />;
  }

  return (
    <Router>
      <GlobalStyles />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<SmartHome />} /> 
        
        {/* Marketing Flyer Route */}
        <Route path="/flyer" element={<ProjectFlyer />} />
        
        <Route path="/portal" element={<RoleLogin />} />
        <Route path="/login" element={<OwnerLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/terms" element={<Terms />} />
          
        <Route path="/menu/:restaurantId" element={
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
        
        {/* --- 🏢 ADMIN & STAFF --- */}
        <Route path="/superadmin" element={<SuperAdmin />} />
        <Route path="/:id/admin" element={<RestaurantAdmin />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;