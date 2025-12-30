import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- IMPORT YOUR EXISTING FILES ---
import OwnerLogin from './pages/OwnerLogin';       
import SuperLogin from './pages/SuperLogin';       
import SuperAdmin from './pages/SuperAdmin';       
import AddRestaurant from './pages/AddRestaurant'; // Your form component
import RestaurantAdmin from './pages/RestaurantAdmin'; 
import Menu from './pages/Menu';                   

const App = () => {
  return (
    <Router>
      <Routes>
        {/* 1. PUBLIC LANDING & LOGIN */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<OwnerLogin />} />

        {/* 2. CEO ROUTES */}
        <Route path="/superlogin" element={<SuperLogin />} />
        <Route path="/superadmin" element={<SuperAdmin />} />
        
        {/* 3. YOUR REQUESTED URL: /superresturant 
            This renders the AddRestaurant component full screen
        */}
        <Route path="/superresturant" element={
            <div style={{height:'100vh', background:'#050505', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <AddRestaurant onClose={() => window.location.href='/superadmin'} refreshList={() => {}} />
            </div>
        } />

        {/* 4. DYNAMIC RESTAURANT ADMIN
            Example: localhost:3000/kfc/admin 
        */}
        <Route path="/:id/admin" element={<RestaurantAdmin />} />
        
        {/* 5. CUSTOMER MENU
            Example: localhost:3000/kfc/menu 
        */}
        <Route path="/:id/menu" element={<Menu cart={[]} addToCart={()=>{}} setRestaurantId={()=>{}} setTableNum={()=>{}} />} /> 
        <Route path="/:id/menu/:table" element={<Menu cart={[]} addToCart={()=>{}} setRestaurantId={()=>{}} setTableNum={()=>{}} />} />

        {/* Fallback */}
        <Route path="*" element={<div style={{color:'white', background:'black', height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}>404 - Page Not Found</div>} />
      </Routes>
    </Router>
  );
};

export default App;