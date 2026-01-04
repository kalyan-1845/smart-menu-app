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

function App() {
  // ✅ 1. UNIQUE CUSTOMER IDENTITY
  // Generates a unique ID for THIS phone/browser so carts never mix
  const [customerId] = useState(() => {
    let id = localStorage.getItem("smartMenu_CustomerId");
    if (!id) {
      id = `CUST-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
      localStorage.setItem("smartMenu_CustomerId", id);
    }
    return id;
  });

  // ✅ 2. DYNAMIC RESTAURANT DETECTION
  const [restaurantId, setRestaurantId] = useState(localStorage.getItem("smartMenu_ActiveRest") || null);
  
  // ✅ 3. RESTAURANT-LOCKED CART
  // Loads cart specifically for THIS customer at THIS restaurant
  const [cart, setCart] = useState(() => {
    const activeId = restaurantId || "none";
    const saved = localStorage.getItem(`cart_${activeId}_${customerId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [tableNum, setTableNum] = useState(localStorage.getItem(`table_${restaurantId}`) || "");

  // ✅ 4. SAVE DATA WITH SESSION LOCK
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
      // Switched restaurants: Load that restaurant's specific cart for this user
      const saved = localStorage.getItem(`cart_${id}_${customerId}`);
      setCart(saved ? JSON.parse(saved) : []);
      setRestaurantId(id);
      localStorage.setItem("smartMenu_ActiveRest", id);
    }
  };

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/menu/:restaurantId" element={
            <Menu cart={cart} addToCart={addToCart} setRestaurantId={handleSetRestaurantId} setTableNum={setTableNum} setCart={setCart} />
        } />
        <Route path="/menu/:restaurantId/:table" element={
            <Menu cart={cart} addToCart={addToCart} setRestaurantId={handleSetRestaurantId} setTableNum={setTableNum} setCart={setCart} />
        } />
        <Route path="/cart" element={
            <Cart 
              cart={cart} 
              customerId={customerId} // Pass unique ID
              removeFromCart={(id) => updateQuantity(id, 0)} 
              clearCart={() => {
                setCart([]);
                localStorage.removeItem(`cart_${restaurantId}_${customerId}`);
              }} 
              restaurantId={restaurantId} 
              tableNum={tableNum} 
              setTableNum={setTableNum} 
            />
        } />
        <Route path="/track/:id" element={<OrderTracker />} />
        {/* ... other routes stay same */}
        <Route path="/login" element={<OwnerLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/:id/admin" element={<RestaurantAdmin />} />
        <Route path="/:id/chef" element={<ChefDashboard />} />
        <Route path="/:id/waiter" element={<WaiterDashboard />} />
      </Routes>
    </Router>
  );
}
export default App;