import React, { useState, useEffect, Suspense, lazy, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// --- LAZY IMPORTS (Faster Loading) ---
import LandingPage from "./pages/LandingPage.jsx";

const Menu = lazy(() => import("./pages/Menu.jsx"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess.jsx"));
const OrderTracker = lazy(() => import("./pages/OrderTracker.jsx"));

// Admin & Staff Pages
const SuperAdmin = lazy(() => import("./pages/SuperAdmin.jsx")); // CEO Dashboard
const SuperLogin = lazy(() => import("./pages/SuperLogin.jsx")); // CEO Lock Screen
const RestaurantAdmin = lazy(() => import("./pages/RestaurantAdmin.jsx"));
const ChefDashboard = lazy(() => import("./pages/ChefDashboard.jsx"));
const WaiterDashboard = lazy(() => import("./pages/WaiterDashboard.jsx"));
const OwnerLogin = lazy(() => import("./pages/OwnerLogin.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));

// --- LOADING SPINNER ---
const LoadingScreen = () => (
  <div style={{ height: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316', flexDirection: 'column' }}>
    <div className="spinner"></div>
    <p style={{ marginTop: '20px', fontSize: '12px', fontWeight: 'bold' }}>LOADING SYSTEM...</p>
    <style>{`.spinner { width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #f97316; border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
  <style>{`
    :root { background-color: #050505; color: white; font-family: 'Inter', sans-serif; }
    body { margin: 0; padding: 0; background: #050505; overflow-x: hidden; }
    * { box-sizing: border-box; }
    /* Hide Scrollbar for cleaner UI */
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #111; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #555; }
  `}</style>
);

function App() {
  // --- CART STATE MANAGEMENT ---
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("smartMenu_Cart");
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  
  const [restaurantId, setRestaurantId] = useState(localStorage.getItem("activeResId") || null);
  const [tableNum, setTableNum] = useState(localStorage.getItem("activeTable") || ""); 

  // Prevent infinite loops when switching menus
  const handleRestaurantChange = useCallback((newId) => {
    if (newId && newId !== restaurantId) { 
      setCart([]); 
      setRestaurantId(newId);
      localStorage.setItem("activeResId", newId);
    }
  }, [restaurantId]);

  useEffect(() => {
    localStorage.setItem("smartMenu_Cart", JSON.stringify(cart));
    if (tableNum) localStorage.setItem("activeTable", tableNum);
  }, [cart, tableNum]);

  // --- CART ACTIONS ---
  const addToCart = (dish) => {
    setCart((prev) => {
      if (!dish._id) return prev;
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
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
            {/* PUBLIC LANDING PAGE */}
            <Route path="/" element={<LandingPage />} /> 
            
            {/* AUTH ROUTES */}
            <Route path="/:id/login" element={<OwnerLogin />} />
            <Route path="/login" element={<OwnerLogin />} />
            <Route path="/register" element={<Register />} />

            {/* CUSTOMER MENU & ORDERING */}
            <Route path="/menu/:id/:table" element={<Menu cart={cart} addToCart={addToCart} setRestaurantId={handleRestaurantChange} setTableNum={setTableNum} />} />
            <Route path="/menu/:id" element={<Menu cart={cart} addToCart={addToCart} setRestaurantId={handleRestaurantChange} setTableNum={setTableNum} />} />
            
            <Route path="/cart" element={<Cart cart={cart} removeFromCart={removeFromCart} clearCart={clearCart} updateQuantity={updateQuantity} restaurantId={restaurantId} tableNum={tableNum} setTableNum={setTableNum} />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/track/:id" element={<OrderTracker />} />

            {/* 👑 SUPER ADMIN (CEO) ROUTES */}
            <Route path="/ceo-login" element={<SuperLogin />} /> {/* Login Screen */}
            <Route path="/ceo" element={<SuperAdmin />} />       {/* Dashboard */}
            
            {/* RESTAURANT ADMIN DASHBOARD */}
            <Route path="/admin" element={<RestaurantAdmin />} /> 
            <Route path="/:id/admin" element={<RestaurantAdmin />} />
            
            {/* KITCHEN & WAITER DASHBOARDS */}
            <Route path="/chef" element={<ChefDashboard />} /> 
            <Route path="/:id/chef" element={<ChefDashboard />} />
            <Route path="/waiter" element={<WaiterDashboard />} />
            <Route path="/:id/waiter" element={<WaiterDashboard />} />

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;