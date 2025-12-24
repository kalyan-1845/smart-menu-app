import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// --- PAGES ---
import LandingPage from "./pages/LandingPage"; // Ensure you have this
import Menu from "./pages/menu"; 
import Cart from "./pages/Cart";
import OrderSuccess from "./pages/OrderSuccess";
import OrderTracker from "./pages/OrderTracker";

// --- STAFF PANELS ---
import SuperAdmin from "./pages/SuperAdmin";
import RestaurantAdmin from "./pages/RestaurantAdmin";
import ChefDashboard from "./pages/ChefDashboard"; 
import WaiterDashboard from "./pages/WaiterDashboard";

// --- GLOBAL STYLES (Injected directly) ---
const GlobalStyles = () => (
  <style>{`
    :root {
      font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      font-weight: 400;
      color-scheme: light dark;
      color: rgba(255, 255, 255, 0.87);
      background-color: #050505;
      font-synthesis: none;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    body { margin: 0; min-width: 320px; min-height: 100vh; }

    #root {
      width: 100%;
      margin: 0 auto;
      text-align: center;
      /* Removed padding to let dashboards use full screen */
    }

    .logo { height: 6em; padding: 1.5em; will-change: filter; transition: filter 300ms; }
    .logo:hover { filter: drop-shadow(0 0 2em #646cffaa); }
    .logo.react:hover { filter: drop-shadow(0 0 2em #61dafbaa); }

    @keyframes logo-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    @media (prefers-reduced-motion: no-preference) {
      a:nth-of-type(2) .logo { animation: logo-spin infinite 20s linear; }
    }

    .card { padding: 2em; }
    .read-the-docs { color: #888; }
    
    /* Scrollbar Styling */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #111; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #f97316; }
  `}</style>
);

function App() {
  // --- GLOBAL STATE ---
  // Load cart from local storage to persist on refresh
  const [cart, setCart] = useState(() => {
      const saved = localStorage.getItem("smartMenu_Cart");
      return saved ? JSON.parse(saved) : [];
  });
  
  const [restaurantId, setRestaurantId] = useState(null);
  const [tableNum, setTableNum] = useState(""); 

  // Save cart to local storage whenever it changes
  useEffect(() => {
      localStorage.setItem("smartMenu_Cart", JSON.stringify(cart));
  }, [cart]);

  // --- CART FUNCTIONS ---
  const addToCart = (dish) => {
    setCart((prev) => {
      const exists = prev.find((item) => item._id === dish._id);
      if (exists) {
        return prev.map((i) => i._id === dish._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...dish, quantity: 1 }];
    });
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) => 
      prev.map((item) => item._id === id ? { ...item, quantity: newQuantity } : item)
    );
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((item) => item._id !== id));
  const clearCart = () => setCart([]);

  return (
    <Router>
      <GlobalStyles />
      <Routes>
        
        {/* --- PUBLIC LANDING --- */}
        <Route path="/" element={<LandingPage />} /> 
        
        {/* --- CUSTOMER ROUTES --- */}
        {/* Menu with Table ID */}
        <Route 
          path="/menu/:id/:table" 
          element={
            <Menu 
                cart={cart} 
                addToCart={addToCart} 
                setRestaurantId={setRestaurantId} 
                setTableNum={setTableNum} 
            />
          } 
        />
        {/* Menu for Takeaway (No Table) */}
        <Route 
          path="/menu/:id" 
          element={
            <Menu 
                cart={cart} 
                addToCart={addToCart} 
                setRestaurantId={setRestaurantId} 
                setTableNum={setTableNum} 
            />
          } 
        />
        
        {/* Cart & Checkout */}
        <Route 
          path="/cart" 
          element={
            <Cart 
                cart={cart} 
                removeFromCart={removeFromCart} 
                clearCart={clearCart} 
                updateQuantity={updateQuantity} 
                restaurantId={restaurantId} 
                tableNum={tableNum} 
                setTableNum={setTableNum} 
            />
          } 
        />

        {/* Post-Order Pages */}
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/track/:id" element={<OrderTracker />} />

        {/* --- STAFF PORTALS (Dynamic URL Based) --- */}
        
        {/* 1. Super Admin (Master Control) */}
        <Route path="/superadmin" element={<SuperAdmin />} />

        {/* 2. Restaurant Owner Admin */}
        <Route path="/:id/admin" element={<RestaurantAdmin />} />

        {/* 3. Kitchen Display System (KDS) */}
        <Route path="/:id/chef" element={<ChefDashboard />} />
        {/* Alias for kitchen */}
        <Route path="/:id/kitchen" element={<ChefDashboard />} />

        {/* 4. Waiter Dashboard */}
        <Route path="/:id/waiter" element={<WaiterDashboard />} />

        {/* --- FALLBACK --- */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;