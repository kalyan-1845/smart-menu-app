// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Add basic global styles directly in JS
const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f8f9fa;
    color: #333;
  }

  #root {
    min-height: 100vh;
  }

  :root {
    --primary-color: #ff6b35;
    --primary-dark: #e55a2e;
    --secondary-color: #ffa600;
    --accent-color: #4ecdc4;
    --success-color: #06d6a0;
    --warning-color: #ffd666;
    --danger-color: #ef476f;
    --dark-color: #292f36;
    --gray-color: #6c757d;
    --light-gray: #e9ecef;
    --light-color: #f8f9fa;
    --radius: 8px;
    --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  button {
    font-family: inherit;
    cursor: pointer;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  input, textarea, select {
    font-family: inherit;
  }
`;

// Inject styles into the document head
const styleElement = document.createElement('style');
styleElement.innerHTML = globalStyles;
document.head.appendChild(styleElement);

// Create root and render the app
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);