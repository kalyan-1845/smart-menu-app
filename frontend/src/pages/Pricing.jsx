import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// PAGES
import LandingPage from "./pages/LandingPage.jsx"; 
import Menu from "./pages/Menu.jsx"; 
import Cart from "./pages/Cart.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import OrderTracker from "./pages/OrderTracker.jsx";
import Pricing from "./pages/Pricing.jsx"; 

// STAFF
import SuperAdmin from "./pages/SuperAdmin.jsx";
import RestaurantAdmin from "./pages/RestaurantAdmin.jsx";
import ChefDashboard from "./pages/ChefDashboard.jsx"; 
import WaiterDashboard from "./pages/WaiterDashboard.jsx";

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
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("smartMenu_Cart");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [restaurantId, setRestaurantId] = useState(null);
  const [tableNum, setTableNum] = useState(""); 

  useEffect(() => {
    localStorage.setItem("smartMenu_Cart", JSON.stringify(cart));
  }, [cart]);

  // Cart Functions (addToCart, removeFromCart, etc.) ...

  return (
    <Router>
      <GlobalStyles /> 
      <Routes>
        <Route path="/" element={<LandingPage />} /> 
        <Route path="/pricing" element={<Pricing />} />
        
        <Route path="/menu/:id/:table" element={<Menu cart={cart} addToCart={addToCart} setRestaurantId={setRestaurantId} setTableNum={setTableNum} />} />
        <Route path="/menu/:id" element={<Menu cart={cart} addToCart={addToCart} setRestaurantId={setRestaurantId} setTableNum={setTableNum} />} />
        <Route path="/cart" element={<Cart cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} restaurantId={restaurantId} tableNum={tableNum} setTableNum={setTableNum} />} />
        
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/track/:id" element={<OrderTracker />} />

        <Route path="/superadmin" element={<SuperAdmin />} />
        <Route path="/:id/admin" element={<RestaurantAdmin />} />
        <Route path="/:id/chef" element={<ChefDashboard />} />
        <Route path="/:id/waiter" element={<WaiterDashboard />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;