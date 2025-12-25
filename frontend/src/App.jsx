import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// --- PAGES ---
// Ensure filenames match exactly (casing matters on Netlify/Linux)
import LandingPage from "./pages/LandingPage.jsx"; 
import Menu from "./pages/Menu.jsx"; 
import Cart from "./pages/Cart.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import OrderTracker from "./pages/OrderTracker.jsx";
import Pricing from "./pages/Pricing.jsx"; // ✅ ADDED: Resolves the ReferenceError

// --- STAFF PANELS ---
import SuperAdmin from "./pages/SuperAdmin.jsx";
import RestaurantAdmin from "./pages/RestaurantAdmin.jsx";
import ChefDashboard from "./pages/ChefDashboard.jsx"; 
import WaiterDashboard from "./pages/WaiterDashboard.jsx";

/**
 * ✅ GLOBAL STYLES (Inline Injection)
 * Ensures the dark theme and custom scrollbars are applied instantly.
 */
const GlobalStyles = () => (
  <style>{`
    :root {
      background-color: #050505;
      color: white;
      font-family: 'Inter', sans-serif;
    }
    body {
      margin: 0;
      padding: 0;
      background: #050505;
      overflow-x: hidden;
    }
    * {
      box-sizing: border-box;
    }
    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: #111; }
    ::-webkit-scrollbar-thumb { background: #f97316; border-radius: 10px; }
    
    /* Hide Thermal Receipt on Screen */
    #kot-receipt { display: none; }
    @media print {
      #kot-receipt { display: block !important; }
    }
  `}</style>
);

function App() {
  // --- 🛒 CART STATE LOGIC ---
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("smartMenu_Cart");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [restaurantId, setRestaurantId] = useState(null);
  const [tableNum, setTableNum] = useState(""); 

  useEffect(() => {
    localStorage.setItem("smartMenu_Cart", JSON.stringify(cart));
  }, [cart]);

  // --- 🛠️ CART ACTIONS ---
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
        {/* --- PUBLIC / CUSTOMER SIDE --- */}
        <Route path="/" element={<LandingPage />} /> 
        <Route path="/pricing" element={<Pricing />} /> {/* ✅ ADDED ROUTE */}
        
        <Route 
          path="/menu/:id/:table" 
          element={<Menu cart={cart} addToCart={addToCart} setRestaurantId={setRestaurantId} setTableNum={setTableNum} />} 
        />
        
        <Route 
          path="/menu/:id" 
          element={<Menu cart={cart} addToCart={addToCart} setRestaurantId={setRestaurantId} setTableNum={setTableNum} />} 
        />
        
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

        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/track/:id" element={<OrderTracker />} />

        {/* --- STAFF / ADMIN SIDE --- */}
        <Route path="/superadmin" element={<SuperAdmin />} />
        <Route path="/:id/admin" element={<RestaurantAdmin />} />
        <Route path="/:id/chef" element={<ChefDashboard />} />
        <Route path="/:id/kitchen" element={<ChefDashboard />} />
        <Route path="/:id/waiter" element={<WaiterDashboard />} />

        {/* --- FALLBACK --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;