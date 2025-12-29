import React, { useState, useEffect, Suspense, lazy, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

// --- LAZY IMPORTS (Performance Optimization) ---
// Public Pages
import LandingPage from "./pages/LandingPage.jsx";
const Menu = lazy(() => import("./pages/Menu.jsx"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess.jsx"));
const OrderTracker = lazy(() => import("./pages/OrderTracker.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const OwnerLogin = lazy(() => import("./pages/OwnerLogin.jsx"));

// Dashboard / Private Pages
const SuperAdmin = lazy(() => import("./pages/SuperAdmin.jsx"));
const SuperLogin = lazy(() => import("./pages/SuperLogin.jsx"));
const RestaurantAdmin = lazy(() => import("./pages/RestaurantAdmin.jsx"));
const ChefDashboard = lazy(() => import("./pages/ChefDashboard.jsx"));
const WaiterDashboard = lazy(() => import("./pages/WaiterDashboard.jsx"));

// --- PROTECTED ROUTE COMPONENTS ---

// Super Admin Route Protection
const SuperAdminRoute = ({ children }) => {
  const token = localStorage.getItem('superAdminToken') || localStorage.getItem('owner_token_ceo');
  
  if (!token) {
    return <Navigate to="/ceo-login" replace />;
  }
  
  // Verify token with backend (optional but recommended)
  const verifyToken = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/verify-token', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  };
  
  return children;
};

// Restaurant Admin Route Protection (basic)
const RestaurantAdminRoute = ({ children }) => {
  const token = localStorage.getItem('owner_token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// --- UTILITIES ---

// 1. Loading Spinner
const LoadingScreen = () => (
  <div style={styles.loadingContainer}>
    <div className="spinner"></div>
    <p style={styles.loadingText}>LOADING...</p>
    <style>{`
      .spinner { 
        width: 50px; 
        height: 50px; 
        border: 5px solid rgba(255,255,255,0.1); 
        border-top: 5px solid #f97316; 
        border-radius: 50%; 
        animation: spin 0.8s linear infinite; 
      }
      @keyframes spin { 
        0% { transform: rotate(0deg); } 
        100% { transform: rotate(360deg); } 
      }
    `}</style>
  </div>
);

// 2. Global Styles Wrapper
const GlobalStyles = () => (
  <style>{`
    :root { 
      --bg-dark: #050505;
      --bg-darker: #030303;
      --bg-panel: #111111;
      --border: #222222;
      --primary: #f97316;
      --primary-dark: #ea580c;
      --success: #22c55e;
      --danger: #ef4444;
      --warning: #f59e0b;
      --text: #ffffff;
      --text-muted: #888888;
    }
    
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    body { 
      background: var(--bg-dark); 
      color: var(--text);
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    ::-webkit-scrollbar { 
      width: 10px; 
      height: 10px; 
    }
    ::-webkit-scrollbar-track { 
      background: var(--bg-panel); 
      border-radius: 5px;
    }
    ::-webkit-scrollbar-thumb { 
      background: var(--border); 
      border-radius: 5px; 
    }
    ::-webkit-scrollbar-thumb:hover { 
      background: #444; 
    }
    
    a { 
      text-decoration: none; 
      color: inherit; 
    }
    
    button { 
      cursor: pointer; 
      font-family: inherit; 
      border: none; 
      outline: none;
    }
    
    input, textarea, select { 
      font-family: inherit; 
      background: var(--bg-panel);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    input:focus, textarea:focus, select:focus { 
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
      outline: none;
    }
    
    /* Utility Classes */
    .glass-panel {
      background: rgba(17, 17, 17, 0.7);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border);
      border-radius: 12px;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(249, 115, 22, 0.3);
    }
    
    .btn-secondary {
      background: var(--bg-panel);
      color: var(--text);
      border: 1px solid var(--border);
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    .btn-secondary:hover {
      background: rgba(255,255,255,0.05);
      border-color: #444;
    }
    
    /* Text Utilities */
    .text-primary { color: var(--primary); }
    .text-success { color: var(--success); }
    .text-danger { color: var(--danger); }
    .text-warning { color: var(--warning); }
    .text-muted { color: var(--text-muted); }
    
    /* Layout Utilities */
    .flex-center {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }
    
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    
    /* Animations */
    .fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .slide-in {
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from { transform: translateX(-20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .grid-2, .grid-3 {
        grid-template-columns: 1fr;
      }
      
      input, textarea, select {
        font-size: 16px; /* Prevents iOS zoom */
      }
    }
    
    /* Notification/Alert Styles */
    .alert-success {
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #86efac;
      padding: 12px 16px;
      border-radius: 8px;
    }
    
    .alert-error {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 12px 16px;
      border-radius: 8px;
    }
    
    .alert-warning {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fde68a;
      padding: 12px 16px;
      border-radius: 8px;
    }
    
    /* Loading States */
    .skeleton {
      background: linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 4px;
    }
    
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    /* Modal/Overlay */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
  `}</style>
);

// 3. Scroll To Top (UX Fix)
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// --- MAIN COMPONENT ---
function App() {
  // --- STATE ---
  const [restaurantId, setRestaurantId] = useState(localStorage.getItem("activeResId") || null);
  const [tableNum, setTableNum] = useState(localStorage.getItem("activeTable") || "");
  
  // Cart State with LocalStorage Persistence
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("smartMenu_Cart");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse cart", e);
      return [];
    }
  });

  // --- EFFECTS ---
  useEffect(() => {
    localStorage.setItem("smartMenu_Cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (tableNum) localStorage.setItem("activeTable", tableNum);
  }, [tableNum]);

  // --- HANDLERS ---
  
  const handleRestaurantChange = useCallback((newId) => {
    if (newId && newId !== restaurantId) {
      if (cart.length > 0) {
        if (window.confirm("Switching restaurants will clear your cart. Continue?")) {
          setCart([]);
          setRestaurantId(newId);
          localStorage.setItem("activeResId", newId);
        }
      } else {
        setRestaurantId(newId);
        localStorage.setItem("activeResId", newId);
      }
    }
  }, [restaurantId, cart.length]);

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
      <ScrollToTop />
      
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Register />} />
          
          {/* Login Routes */}
          <Route path="/login" element={<OwnerLogin />} />
          <Route path="/:id/login" element={<OwnerLogin />} />
          <Route path="/ceo-login" element={<SuperLogin />} />

          {/* --- CUSTOMER FLOW --- */}
          <Route 
            path="/menu/:id/:table" 
            element={
              <Menu 
                cart={cart} 
                addToCart={addToCart} 
                setRestaurantId={handleRestaurantChange} 
                setTableNum={setTableNum} 
              />
            } 
          />
          <Route 
            path="/menu/:id" 
            element={
              <Menu 
                cart={cart} 
                addToCart={addToCart} 
                setRestaurantId={handleRestaurantChange} 
                setTableNum={setTableNum} 
              />
            } 
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

          {/* --- STAFF & ADMIN DASHBOARDS --- */}
          
          {/* Super Admin (CEO) */}
          <Route 
            path="/ceo" 
            element={
              <SuperAdminRoute>
                <SuperAdmin />
              </SuperAdminRoute>
            } 
          />
          
          {/* Restaurant Admin */}
          <Route 
            path="/admin" 
            element={
              <RestaurantAdminRoute>
                <RestaurantAdmin />
              </RestaurantAdminRoute>
            } 
          />
          <Route 
            path="/:id/admin" 
            element={
              <RestaurantAdminRoute>
                <RestaurantAdmin />
              </RestaurantAdminRoute>
            } 
          />
          
          {/* Kitchen Staff */}
          <Route path="/chef" element={<ChefDashboard />} />
          <Route path="/:id/chef" element={<ChefDashboard />} />
          
          {/* Waiter Staff */}
          <Route path="/waiter" element={<WaiterDashboard />} />
          <Route path="/:id/waiter" element={<WaiterDashboard />} />

          {/* --- FALLBACK --- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

// Inline Styles for Loading Screen
const styles = {
  loadingContainer: {
    height: '100vh',
    background: '#050505',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#f97316',
    flexDirection: 'column',
    gap: '20px'
  },
  loadingText: {
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '2px',
    opacity: 0.7
  }
};

export default App;