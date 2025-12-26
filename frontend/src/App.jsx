import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// --- PAGES IMPORT ---
import LandingPage from "./pages/LandingPage.jsx"; 
import Menu from "./pages/Menu.jsx"; 
import Cart from "./pages/Cart.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import OrderTracker from "./pages/OrderTracker.jsx"; 

// --- STAFF PANELS ---
import SuperAdmin from "./pages/SuperAdmin.jsx"; 
import RestaurantAdmin from "./pages/RestaurantAdmin.jsx"; 
import ChefDashboard from "./pages/ChefDashboard.jsx"; 
import WaiterDashboard from "./pages/WaiterDashboard.jsx"; 
import SuperLogin from "./pages/SuperLogin.jsx";

// --- AUTH PAGES ---
import OwnerLogin from "./pages/OwnerLogin.jsx"; 
import Register from "./pages/Register.jsx";

const GlobalStyles = () => (
  <style>{`
    :root { background-color: #050505; color: white; font-family: 'Inter', sans-serif; }
    body { margin: 0; padding: 0; background: #050505; overflow-x: hidden; }
    * { box-sizing: border-box; }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-thumb { background: #f97316; border-radius: 10px; }
  `}</style>
);

function App() {
  // --- STATE ---
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("smartMenu_Cart");
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  
  const [restaurantId, setRestaurantId] = useState(localStorage.getItem("activeResId") || null);
  const [tableNum, setTableNum] = useState(localStorage.getItem("activeTable") || ""); 

  // --- 🛡️ DATA ISOLATION LOGIC ---
  // This ensures Restaurant A's cart doesn't show up in Restaurant B
  const handleRestaurantChange = (newId) => {
    if (newId && newId !== restaurantId) {
      console.log(`🔄 Switching from ${restaurantId} to ${newId}. Clearing Cart.`);
      setCart([]); // WIPE OLD CART
      setRestaurantId(newId);
      localStorage.setItem("activeResId", newId);
    } else if (newId && !restaurantId) {
      // First time loading
      setRestaurantId(newId);
      localStorage.setItem("activeResId", newId);
    }
  };

  useEffect(() => {
    localStorage.setItem("smartMenu_Cart", JSON.stringify(cart));
    if (tableNum) localStorage.setItem("activeTable", tableNum);
  }, [cart, tableNum]);

  // --- CART HANDLERS ---
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
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/" element={<LandingPage />} /> 
        <Route path="/login" element={<OwnerLogin />} />
        <Route path="/register" element={<Register />} />

        {/* --- 🧍 CUSTOMER EXPERIENCE (MULTI-TENANT) --- */}
        {/* We pass 'handleRestaurantChange' instead of 'setRestaurantId' to enforce isolation */}
        <Route 
          path="/menu/:id/:table" 
          element={<Menu cart={cart} addToCart={addToCart} setRestaurantId={handleRestaurantChange} setTableNum={setTableNum} />} 
        />
        <Route 
          path="/menu/:id" 
          element={<Menu cart={cart} addToCart={addToCart} setRestaurantId={handleRestaurantChange} setTableNum={setTableNum} />} 
        />
        
        {/* Cart works for whichever 'restaurantId' is currently active */}
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
        
        {/* Tracker is unique because Order IDs are unique in Database */}
        <Route path="/track/:id" element={<OrderTracker />} />

        {/* --- 👑 SUPER ADMIN --- */}
        <Route path="/ceo" element={<SuperLogin />} />
        <Route path="/superadmin" element={<SuperAdmin />} />
        
        {/* --- 👨‍🍳 STAFF DASHBOARDS --- */}
        <Route path="/admin" element={<RestaurantAdmin />} /> 
        <Route path="/:id/admin" element={<RestaurantAdmin />} />
        
        <Route path="/chef" element={<ChefDashboard />} /> 
        <Route path="/:id/chef" element={<ChefDashboard />} />
        <Route path="/kitchen" element={<Navigate to="/chef" replace />} />

        <Route path="/waiter" element={<WaiterDashboard />} />
        <Route path="/:id/waiter" element={<WaiterDashboard />} />

        {/* --- FALLBACK --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;