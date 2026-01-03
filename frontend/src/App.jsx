import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Menu from "./pages/Menu"; 

// ⚠️ EMERGENCY MODE: REMOVED ALL OTHER PAGES TO ISOLATE THE CRASH
// We only import 'Menu' because that is what we need to fix.

const ScrollToTop = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return null;
};

function App() {
  // 🛑 SAFE CART INITIALIZATION
  const [cart, setCart] = useState([]); 

  // --- SIMPLE ADD TO CART ---
  const addToCart = (dish) => {
    setCart((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const exists = safePrev.find((item) => item._id === dish._id);
      if (exists) {
          return safePrev.map((i) => i._id === dish._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...safePrev, { ...dish, quantity: 1 }];
    });
  };

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* --- THE ONLY ROUTE THAT MATTERS RIGHT NOW --- */}
        <Route path="/menu/:restaurantId" element={
            <Menu 
                cart={cart} 
                addToCart={addToCart} 
                setRestaurantId={() => {}} 
                setTableNum={() => {}} 
                setCart={setCart} 
            />
        } />
        
        {/* Redirect everything else to a test menu so you see SOMETHING */}
        <Route path="*" element={<Navigate to="/menu/kalyanresto1" />} />
      </Routes>
    </Router>
  );
}

export default App;