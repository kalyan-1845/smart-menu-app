import React, { useState, useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// --- 1. CRITICAL: DIRECT IMPORT FOR LANDING PAGE ---
// This ensures the first screen loads INSTANTLY (Fixes "Stuck Loading")
import LandingPage from "./pages/LandingPage.jsx";

// --- 2. LAZY LOAD OTHER PAGES (Keeps app fast) ---
const Menu = lazy(() => import("./pages/Menu.jsx"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess.jsx"));
const OrderTracker = lazy(() => import("./pages/OrderTracker.jsx"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin.jsx"));
const RestaurantAdmin = lazy(() => import("./pages/RestaurantAdmin.jsx"));
const ChefDashboard = lazy(() => import("./pages/ChefDashboard.jsx"));
const WaiterDashboard = lazy(() => import("./pages/WaiterDashboard.jsx"));
const SuperLogin = lazy(() => import("./pages/SuperLogin.jsx"));
const OwnerLogin = lazy(() => import("./pages/OwnerLogin.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));

// --- LOADING SPINNER (For transitions) ---
const LoadingScreen = () => (
  <div style={{ height: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316', flexDirection: 'column' }}>
    <div className="spinner"></div>
    <p style={{ marginTop: '20px', fontSize: '12px', fontWeight: 'bold' }}>LOADING...</p>
    <style>{`.spinner { width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #f97316; border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

const GlobalStyles = () => (
  <style>{`
    :root { background-color: #050505; color: white; font-family: 'Inter', sans-serif; }
    body { margin: 0; padding: 0; background: #050505; overflow-x: hidden; }
    * { box-sizing: border-box; }
  `}</style>
);

function App() {
  // --- STATE MANAGEMENT ---
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("smartMenu_Cart");
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  
  const [restaurantId, setRestaurantId] = useState(localStorage.getItem("activeResId") || null);
  const [tableNum, setTableNum] = useState(localStorage.getItem("activeTable") || ""); 

  // --- HANDLERS ---
  const handleRestaurantChange = (newId) => {
    if (newId) {
      setCart([]); 
      setRestaurantId(newId);
      localStorage.setItem("activeResId", newId);
    }
  };

  useEffect(() => {
    localStorage.setItem("smartMenu_Cart", JSON.stringify(cart));
    if (tableNum) localStorage.setItem("activeTable", tableNum);
  }, [cart, tableNum]);

  const addToCart = (dish) => {
    setCart((prev) => {
      // Safety check for invalid dishes
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
      {/* Suspense handles the loading state for the Lazy components */}
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
            {/* DIRECT LOAD (Instant) */}
            <Route path="/" element={<LandingPage />} /> 
            
            <Route path="/login" element={<OwnerLogin />} />
            <Route path="/register" element={<Register />} />

            {/* CUSTOMER ROUTES */}
            <Route path="/menu/:id/:table" element={<Menu cart={cart} addToCart={addToCart} setRestaurantId={handleRestaurantChange} setTableNum={setTableNum} />} />
            <Route path="/menu/:id" element={<Menu cart={cart} addToCart={addToCart} setRestaurantId={handleRestaurantChange} setTableNum={setTableNum} />} />
            
            <Route path="/cart" element={<Cart cart={cart} removeFromCart={removeFromCart} clearCart={clearCart} updateQuantity={updateQuantity} restaurantId={restaurantId} tableNum={tableNum} setTableNum={setTableNum} />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/track/:id" element={<OrderTracker />} />

            {/* ADMIN ROUTES */}
            <Route path="/ceo" element={<SuperLogin />} />
            <Route path="/superadmin" element={<SuperAdmin />} />
            <Route path="/admin" element={<RestaurantAdmin />} /> 
            <Route path="/:id/admin" element={<RestaurantAdmin />} />
            
            {/* STAFF ROUTES */}
            <Route path="/chef" element={<ChefDashboard />} /> 
            <Route path="/:id/chef" element={<ChefDashboard />} />
            <Route path="/waiter" element={<WaiterDashboard />} />
            <Route path="/:id/waiter" element={<WaiterDashboard />} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;