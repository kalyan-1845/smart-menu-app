import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  /* Modern Reset */
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent; /* Fixes blue flash on mobile tap */
  }

  :root {
    --primary: #f97316;
    --bg: #050505;
    --card: #111111;
    --border: #222222;
    --text-dim: #888888;
  }

  body {
    margin: 0;
    background: var(--bg);
    color: white;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
    line-height: 1.5;
  }

  /* Custom Scrollbar for a Premium Look */
  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: #0a0a0a;
  }

  ::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 10px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--primary);
  }

  /* Global Animations */
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .page-transition {
    animation: slideUp 0.4s ease-out forwards;
  }

  /* Prevent body scroll when modals are open */
  .no-scroll {
    overflow: hidden;
  }
`;

export default GlobalStyles;