import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

// --- PAGES ---
import LandingPage from "./pages/LandingPage"; 
import Menu from "./pages/Menu"; 
import Cart from "./pages/Cart";
import OrderTracker from "./pages/OrderTracker";
import OwnerLogin from "./pages/OwnerLogin"; 
import Register from "./pages/Register"; 
import SuperLogin from "./pages/SuperLogin"; 

// --- STAFF PANELS ---
import SuperAdmin from "./pages/SuperAdmin";
import RestaurantAdmin from "./pages/RestaurantAdmin";
import ChefDashboard from "./pages/ChefDashboard"; 
import WaiterDashboard from "./pages/WaiterDashboard";

// ==========================================
// 🛡️ HELPER: Scroll to top on navigation
// ==========================================
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { 
    window.scrollTo(0, 0); 
  }, [pathname]);
  return null;
};

// ==========================================
// 🛡️ THE ROUTE GUARD (CEO Access Control)
// ==========================================
const ProtectedSuperAdmin = ({ children }) => {
  const isAuthenticated = localStorage.getItem("superAdminAuth") === "true";
  if (!isAuthenticated) {
    return <Navigate to="/super-login" replace />;
  }
  return children;
};

const GlobalStyles = () => (
  <style>{`
    :root { font-family: Inter, system-ui, sans-serif; color: rgba(255, 255, 255, 0.87); background-color: #050505; }
    body { margin: 0; min-height: 100vh; overflow-x: hidden; }
    #root { width: 100%; margin: 0 auto; text-align: center; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #111; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #f97316; }
    
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .page-transition { animation: slideUp 0.4s ease-out forwards; }
  `}</style>
);

function App() {
  // 1. Load Cart & Restaurant ID from LocalStorage
  const [cart, setCart] = useState(() => {
      const saved = localStorage.getItem("smartMenu_Cart");
      return saved ? JSON.parse(saved) : [];
  });
  
  const [restaurantId, setRestaurantId] = useState(() => {
      return localStorage.getItem("smartMenu_RestaurantId") || null;
  });

  const [tableNum, setTableNum] = useState(() => {
      return localStorage.getItem("last_table_num") || "";
  }); 

  // 2. Sync State to LocalStorage
  useEffect(() => {
      localStorage.setItem("smartMenu_Cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
      if(restaurantId) {
          localStorage.setItem("smartMenu_RestaurantId", restaurantId);
      }
  }, [restaurantId]);

  // --- CART ACTIONS ---
  const addToCart = (dish) => {
    setCart((prev) => {
      const exists = prev.find((item) => item._id === dish._id);
      if (exists) return prev.map((i) => i._id === dish._id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...dish, quantity: 1 }];
    });
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) { removeFromCart(id); return; }
    setCart((prev) => prev.map((item) => item._id === id ? { ...item, quantity: newQuantity } : item));
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((item) => item._id !== id));
  const clearCart = () => setCart([]);

  return (
    <Router>
      <GlobalStyles />
      <ScrollToTop />
      <Routes>
        
        {/* --- PUBLIC CUSTOMER ROUTES --- */}
        <Route path="/" element={<LandingPage />} /> 
        <Route path="/login" element={<OwnerLogin />} />
        <Route path="/register" element={<Register />} />

        <Route path="/menu/:restaurantId" element={
            <div className="page-transition">
              <Menu 
                  cart={cart} 
                  addToCart={addToCart} 
                  setRestaurantId={setRestaurantId} 
                  setTableNum={setTableNum}
                  setCart={setCart}
              />
            </div>
        } />
        
        <Route path="/menu/:restaurantId/:table" element={
            <div className="page-transition">
              <Menu 
                  cart={cart} 
                  addToCart={addToCart} 
                  setRestaurantId={setRestaurantId} 
                  setTableNum={setTableNum}
                  setCart={setCart}
              />
            </div>
        } />

        <Route path="/cart" element={
            <div className="page-transition">
              <Cart 
                  cart={cart} 
                  removeFromCart={removeFromCart} 
                  clearCart={clearCart} 
                  updateQuantity={updateQuantity} 
                  restaurantId={restaurantId} 
                  tableNum={tableNum} 
                  setTableNum={setTableNum} 
              />
            </div>
        } />

        <Route path="/track/:id" element={<div className="page-transition"><OrderTracker /></div>} />

        {/* --- 🔐 PROTECTED CEO / SUPER ADMIN AREA --- */}
        <Route path="/super-login" element={<SuperLogin />} />
        <Route 
          path="/superadmin" 
          element={
            <ProtectedSuperAdmin>
              <SuperAdmin />
            </ProtectedSuperAdmin>
          } 
        />
        
        {/* --- STAFF DASHBOARDS --- */}
        <Route path="/:id/admin" element={<RestaurantAdmin />} />
        <Route path="/:id/chef" element={<ChefDashboard />} />
        <Route path="/:id/kitchen" element={<ChefDashboard />} />
        <Route path="/:id/waiter" element={<WaiterDashboard />} />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;