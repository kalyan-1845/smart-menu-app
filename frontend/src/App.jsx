import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// --- PAGES ---
import LandingPage from "./pages/LandingPage.jsx"; 
import Menu from "./pages/Menu.jsx"; 
import Cart from "./pages/Cart.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import OrderTracker from "./pages/OrderTracker.jsx";

// 👇 THIS WAS MISSING! YOU MUST INCLUDE THIS LINE 👇
import Pricing from "./pages/Pricing.jsx"; 

// --- STAFF PANELS ---
import SuperAdmin from "./pages/SuperAdmin.jsx";
import RestaurantAdmin from "./pages/RestaurantAdmin.jsx";
import ChefDashboard from "./pages/ChefDashboard.jsx"; 
import WaiterDashboard from "./pages/WaiterDashboard.jsx";

/**
 * GLOBAL STYLES
 */
const GlobalStyles = () => (
  <style>{`
    :root { background-color: #050505; color: white; font-family: 'Inter', sans-serif; }
    body { margin: 0; padding: 0; background: #050505; overflow-x: hidden; }
    * { box-sizing: border-box; }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-thumb { background: #f97316; border-radius: 10px; }
    #kot-receipt { display: none; }
    @media print { #kot-receipt { display: block !important; } }
  `}</style>
);

function App() {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("smartMenu_Cart");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [restaurantId, setRestaurantId] = useState(null);
  const [tableNum, setTableNum] = useState(""); 

  useEffect(() => {
    localStorage.setItem("smartMenu_Cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (dish) => {
    setCart((prev) => {
      const exists = prev.find((item) => item._id === dish._id);
      if (exists) return prev.map((i) => i._id === dish._id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...dish, quantity: 1 }];
    });
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) return removeFromCart(id);
    setCart((prev) => prev.map((item) => item._id === id ? { ...item, quantity: newQuantity } : item));
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((item) => item._id !== id));
  const clearCart = () => setCart([]);

  return (
    <Router>
      <GlobalStyles /> 
      <Routes>
        <Route path="/" element={<LandingPage />} /> 
        
        {/* ✅ THIS ROUTE WORKS NOW BECAUSE WE IMPORTED 'Pricing' AT THE TOP */}
        <Route path="/pricing" element={<Pricing />} />

        <Route path="/menu/:id/:table" element={<Menu cart={cart} addToCart={addToCart} setRestaurantId={setRestaurantId} setTableNum={setTableNum} />} />
        <Route path="/menu/:id" element={<Menu cart={cart} addToCart={addToCart} setRestaurantId={setRestaurantId} setTableNum={setTableNum} />} />
        <Route path="/cart" element={<Cart cart={cart} removeFromCart={removeFromCart} clearCart={clearCart} updateQuantity={updateQuantity} restaurantId={restaurantId} tableNum={tableNum} setTableNum={setTableNum} />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/track/:id" element={<OrderTracker />} />

        <Route path="/superadmin" element={<SuperAdmin />} />
        <Route path="/:id/admin" element={<RestaurantAdmin />} />
        <Route path="/:id/chef" element={<ChefDashboard />} />
        <Route path="/:id/kitchen" element={<ChefDashboard />} />
        <Route path="/:id/waiter" element={<WaiterDashboard />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;