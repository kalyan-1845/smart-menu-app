import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// --- COMPONENT IMPORTS ---
import Menu from "./Menu.jsx"; 
import Cart from "./Cart.jsx";
import ChefDashboard from "./ChefDashboard.jsx"; 
import OwnerLogin from "./OwnerLogin.jsx";
import AdminPanel from "./AdminPanel.jsx";
import Register from "./Register.jsx";
import OrderTracker from "./OrderTracker.jsx";
import WaiterDashboard from "./WaiterDashboard.jsx";
import SuperAdmin from './SuperAdmin.jsx';
import OrderSuccess from './OrderSuccess.jsx';
import ManagerLogin from "./ManagerLogin.jsx"; 

// --- PROTECTED ROUTE MIDDLEWARE ---
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("ownerToken");
  return token ? children : <Navigate to="/login" replace />;
};

const ManagerProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("ownerToken");
  const isManagerAuth = localStorage.getItem("managerAuthenticated") === "true";
  
  if (!token) return <Navigate to="/login" replace />;
  if (!isManagerAuth) return <Navigate to="/manager-login" replace />;
  
  return children;
};

const Home = () => <Navigate to="/login" replace />;

function App() {
  // ✅ FIX: Initialize state directly from localStorage so it never starts as null
  const [cart, setCart] = useState([]);
  const [restaurantId, setRestaurantId] = useState(localStorage.getItem("activeResId") || null);
  const [tableNum, setTableNum] = useState(localStorage.getItem("activeTable") || ""); 

  // --- PERSISTENCE: Save ID whenever it changes ---
  useEffect(() => {
    if (restaurantId) localStorage.setItem("activeResId", restaurantId);
    if (tableNum) localStorage.setItem("activeTable", tableNum);
  }, [restaurantId, tableNum]);

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
      prev.map((item) => 
        item._id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((item) => item._id !== id));
  const clearCart = () => setCart([]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} /> 
        <Route path="/login" element={<OwnerLogin />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/menu/:id/:table" element={
            <Menu cart={cart} addToCart={addToCart} setRestaurantId={setRestaurantId} setTableNum={setTableNum} />
        } />
        <Route path="/menu/:id" element={
            <Menu cart={cart} addToCart={addToCart} setRestaurantId={setRestaurantId} setTableNum={setTableNum} />
        } />
        
        <Route path="/cart" element={
            <Cart 
                cart={cart} 
                removeFromCart={removeFromCart} 
                clearCart={clearCart} 
                updateQuantity={updateQuantity} 
                restaurantId={restaurantId} // Passing the persistent ID
                tableNum={tableNum} 
                setTableNum={setTableNum} 
            />
        } />

        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/track/:id" element={<OrderTracker />} />

        {/* Staff Routes */}
        <Route path="/chef" element={<ProtectedRoute><ChefDashboard /></ProtectedRoute>} />
        <Route path="/kitchen" element={<Navigate to="/chef" replace />} />
        <Route path="/waiter" element={<ProtectedRoute><WaiterDashboard /></ProtectedRoute>} />
        <Route path="/manager-login" element={<ProtectedRoute><ManagerLogin /></ProtectedRoute>} />
        <Route path="/admin" element={<ManagerProtectedRoute><AdminPanel /></ManagerProtectedRoute>}>
             <Route path="dashboard" element={<AdminPanel />} />
        </Route>
        <Route path="/superadmin" element={<SuperAdmin />} />
      </Routes>
    </Router>
  );
}

export default App;