// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Import pages - only import the ones that exist
// For now, let's just import ChefDashboard since we know it exists
import ChefDashboard from "./pages/ChefDashboard";

// Create a simple CSS style element
const injectGlobalStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    :root {
      /* Color Variables */
      --primary-color: #ff6b35;
      --primary-dark: #e55a2e;
      --secondary-color: #ffa600;
      --accent-color: #4ecdc4;
      --success-color: #06d6a0;
      --warning-color: #ffd666;
      --danger-color: #ef476f;
      --info-color: #118ab2;
      --dark-color: #292f36;
      --gray-color: #6c757d;
      --light-gray: #e9ecef;
      --light-color: #f8f9fa;
      
      /* Border Radius */
      --radius: 8px;
      --radius-lg: 12px;
      
      /* Shadows */
      --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      font-size: 16px;
      scroll-behavior: smooth;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      color: var(--dark-color);
      background-color: var(--light-color);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    #root {
      min-height: 100vh;
    }

    h1, h2, h3, h4, h5, h6 {
      font-weight: 600;
      line-height: 1.2;
      margin-bottom: 0.5em;
    }

    h1 { font-size: 2.5rem; }
    h2 { font-size: 2rem; }
    h3 { font-size: 1.75rem; }
    h4 { font-size: 1.5rem; }
    h5 { font-size: 1.25rem; }
    h6 { font-size: 1rem; }

    a {
      color: var(--primary-color);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    a:hover {
      color: var(--primary-dark);
    }

    button {
      font-family: inherit;
      cursor: pointer;
      border: none;
      outline: none;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    input, textarea, select {
      font-family: inherit;
      font-size: inherit;
      outline: none;
    }

    input:focus, textarea:focus, select:focus {
      border-color: var(--primary-color);
    }

    /* Scrollbar Styling */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: var(--light-gray);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb {
      background: var(--gray-color);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--primary-color);
    }
  `;
  document.head.appendChild(style);
};

// Call the function to inject styles
injectGlobalStyles();

// Simple placeholder components for missing pages
const PlaceholderPage = ({ title }) => (
  <div style={{ 
    padding: '50px', 
    textAlign: 'center',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <h1 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>{title}</h1>
    <p style={{ color: 'var(--gray-color)', marginBottom: '30px' }}>
      This page is under construction.
    </p>
    <button
      onClick={() => window.history.back()}
      style={{
        padding: '10px 20px',
        backgroundColor: 'var(--primary-color)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius)',
        cursor: 'pointer'
      }}
    >
      Go Back
    </button>
  </div>
);

// Simple container component
const AppContainer = ({ children }) => (
  <div style={{ minHeight: '100vh', width: '100%' }}>{children}</div>
);

const App = () => {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--dark-color)',
            color: 'var(--light-color)',
            borderRadius: 'var(--radius)',
            padding: '16px',
          },
          success: {
            style: {
              background: 'var(--success-color)',
            },
          },
          error: {
            style: {
              background: 'var(--danger-color)',
            },
          },
        }}
      />
      
      <Router>
        <AppContainer>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PlaceholderPage title="BiteBox Restaurant" />} />
            <Route path="/menu" element={<PlaceholderPage title="Menu" />} />
            <Route path="/cart" element={<PlaceholderPage title="Cart" />} />
            <Route path="/order-success" element={<PlaceholderPage title="Order Success" />} />
            <Route path="/track-order" element={<PlaceholderPage title="Order Tracker" />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<PlaceholderPage title="Login" />} />
            <Route path="/register" element={<PlaceholderPage title="Register" />} />
            <Route path="/super-login" element={<PlaceholderPage title="Super Login" />} />
            
            {/* Dashboard Routes - Chef Dashboard exists */}
            <Route path="/chef" element={<ChefDashboard />} />
            <Route path="/waiter" element={<PlaceholderPage title="Waiter Dashboard" />} />
            <Route path="/admin" element={<PlaceholderPage title="Restaurant Admin" />} />
            <Route path="/super-admin" element={<PlaceholderPage title="Super Admin" />} />
            <Route path="/setup" element={<PlaceholderPage title="Setup Wizard" />} />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppContainer>
      </Router>
    </>
  );
};

export default App;