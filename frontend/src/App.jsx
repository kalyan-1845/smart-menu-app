import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import axios from "axios";

// --- IMPORTS ---
import LandingPage from "./pages/LandingPage"; 
import Menu from "./pages/Menu"; 
import Cart from "./pages/Cart";
import OrderTracker from "./pages/OrderTracker";
// ... (Your other imports like Admin, Login, etc.)

// --- STYLES ---
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

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

function App() {
  // ✅ 1. GLOBAL CUSTOMER ID (Follows the user everywhere)
  const [customerId] = useState(() => {
    let id = localStorage.getItem("smartMenu_CustomerId");
    if (!id) {
      // Generates a random ID unique to this phone
      id = `CUST-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
      localStorage.setItem("smartMenu_CustomerId", id);
    }
    return id;
  });

  // ✅ 2. DYNAMIC RESTAURANT DETECTION
  // We don't hardcode "kalyanresto1". We ask "Which restaurant is active right now?"
  const [restaurantId, setRestaurantId] = useState(localStorage.getItem("smartMenu_ActiveRest") || null);

  // ✅ 3. DYNAMIC CART
  // The cart key changes automatically based on the Restaurant Name
  const [cart, setCart] = useState(() => {
    const activeRest = localStorage.getItem("smartMenu_ActiveRest");
    if (!activeRest) return [];
    
    // 🔒 The Secret to Multi-Restaurant Support:
    // Key format: cart_RESTAURANTNAME_CUSTOMERID
    const saved = localStorage.getItem(`cart_${activeRest}_${customerId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [tableNum, setTableNum] = useState(localStorage.getItem(`table_${restaurantId}`) || "");

  // ✅ 4. AUTO-SAVE (Saves to the correct restaurant folder)
  useEffect(() => { 
    if (restaurantId) {
      localStorage.setItem(`cart_${restaurantId}_${customerId}`, JSON.stringify(cart));
      localStorage.setItem("smartMenu_ActiveRest", restaurantId);
    }
  }, [cart, restaurantId, customerId]);

  // ✅ 5. CART ACTIONS
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

  // ✅ 6. SWITCHING RESTAURANTS
  // If user scans a NEW QR code, this function clears the old cart and loads the new one
  const handleSetRestaurantId = (newId) => {
    if (restaurantId !== newId) {
      const saved = localStorage.getItem(`cart_${newId}_${customerId}`);
      setCart(saved ? JSON.parse(saved) : []); // Load fresh cart for new restaurant
      setRestaurantId(newId);
      localStorage.setItem("smartMenu_ActiveRest", newId);
    }
  };

  const handleSetTable = (num) => {
    setTableNum(num);
    localStorage.setItem(`table_${restaurantId}`, num);
  };

  return (
    <Router>
      <GlobalStyles />
      <ScrollToTop />
      <Routes>
        {/* --- UNIVERSAL ROUTES (Work for any restaurant name) --- */}
        
        {/* 1. MENU: /menu/pizzahut, /menu/dominos, etc. */}
        <Route path="/menu/:restaurantId" element={
            <div className="page-transition">
              <Menu 
                cart={cart} 
                addToCart={addToCart} 
                setRestaurantId={handleSetRestaurantId} 
                setTableNum={handleSetTable} 
                setCart={setCart} 
                customerId={customerId} // Pass the ID to generate links
              />
            </div>
        } />
        
        {/* 2. CART: /pizzahut/cart/CUST-123, /dominos/cart/CUST-123 */}
        {/* The :restaurantId part makes it work for everyone */}
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
        
        {/* 3. TRACKER: /track/659abc... (Unique Database ID) */}
        <Route path="/track/:id" element={<div className="page-transition"><OrderTracker /></div>} />
        
        {/* Other Public/Admin Routes */}
        <Route path="/" element={<LandingPage />} /> 
        {/* ... (Add your admin routes here) ... */}
      </Routes>
    </Router>
  );
}

export default App;