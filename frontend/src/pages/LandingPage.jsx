import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaUtensils, FaQrcode, FaChartLine, FaBars, FaTimes, FaArrowRight, FaCheckCircle } from "react-icons/fa";

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="landing-container">
      {/* --- INTERNAL CSS --- */}
      <style>{`
        :root {
          --primary: #f97316;
          --primary-glow: rgba(249, 115, 22, 0.4);
          --bg: #050505;
          --card-bg: rgba(20, 20, 20, 0.6);
          --text: #ffffff;
          --text-muted: #a1a1aa;
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        
        body { 
          background-color: var(--bg); 
          color: var(--text); 
          overflow-x: hidden;
          background-image: radial-gradient(circle at 50% 0%, #1a100a 0%, #050505 60%);
        }

        /* --- ANIMATIONS --- */
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.8s ease-out forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.2s; }
        .delay-2 { animation-delay: 0.4s; }

        /* --- NAVBAR --- */
        .navbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 5%; width: 100%;
          background: rgba(5, 5, 5, 0.8);
          backdrop-filter: blur(12px); 
          position: sticky; top: 0; z-index: 1000;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .brand { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; display: flex; align-items: center; gap: 10px; color: white; text-decoration: none; }
        .brand span { color: var(--primary); }
        
        /* Desktop Nav */
        .nav-links { display: flex; gap: 30px; align-items: center; }
        .nav-link { text-decoration: none; color: #ccc; font-weight: 500; font-size: 15px; transition: 0.3s; }
        .nav-link:hover { color: white; }

        /* Mobile Menu Button */
        .menu-toggle { display: none; background: none; border: none; color: white; font-size: 24px; cursor: pointer; }

        /* Mobile Dropdown */
        .mobile-menu {
          position: absolute; top: 100%; left: 0; width: 100%;
          background: #0a0a0a; border-bottom: 1px solid #222;
          flex-direction: column; padding: 20px; gap: 20px;
          display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .mobile-menu.open { display: flex; animation: fadeIn 0.3s ease-out; }

        /* --- BUTTONS --- */
        .btn-primary {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white; padding: 12px 28px;
          border-radius: 12px; font-weight: 700; text-decoration: none;
          transition: all 0.3s; display: inline-flex; align-items: center; gap: 8px;
          box-shadow: 0 4px 20px var(--primary-glow);
          border: none; cursor: pointer;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px var(--primary-glow); }
        
        .btn-outline {
          background: rgba(255,255,255,0.05); color: white; padding: 12px 28px;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; font-weight: 600;
          text-decoration: none; transition: 0.3s;
        }
        .btn-outline:hover { background: rgba(255,255,255,0.1); border-color: white; }

        /* --- HERO --- */
        .hero {
          text-align: center; padding: 100px 20px 60px;
          max-width: 800px; margin: 0 auto;
        }
        .hero h1 { 
          font-size: 56px; line-height: 1.1; font-weight: 900; margin-bottom: 24px; 
          background: linear-gradient(to right, #fff, #aaa); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .hero p { color: var(--text-muted); font-size: 18px; margin: 0 auto 40px; line-height: 1.6; max-width: 600px; }
        
        .hero-buttons { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; }

        /* --- FEATURES GRID --- */
        .features-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 25px; padding: 40px 5%; max-width: 1200px; margin: 0 auto;
        }
        
        .feature-card {
          background: var(--card-bg); padding: 30px; border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.05); backdrop-filter: blur(10px);
          transition: all 0.3s ease; position: relative; overflow: hidden;
        }
        .feature-card:hover { transform: translateY(-8px); border-color: var(--primary); }
        
        .icon-box {
          width: 60px; height: 60px; background: rgba(255,255,255,0.03);
          color: var(--primary); display: flex; align-items: center;
          justify-content: center; border-radius: 16px; font-size: 26px;
          margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);
        }
        
        .feature-title { font-size: 20px; font-weight: 800; margin-bottom: 12px; color: white; }
        .feature-desc { color: var(--text-muted); font-size: 15px; line-height: 1.6; }

        /* --- TRUST BADGE --- */
        .trust-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 20px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: #ccc; font-size: 12px; font-weight: 600; margin-bottom: 25px;
        }

        /* --- FOOTER --- */
        footer {
          border-top: 1px solid rgba(255,255,255,0.05); padding: 50px 20px;
          text-align: center; margin-top: 80px; color: #666; font-size: 14px;
          background: #020202;
        }
        .footer-links { display: flex; gap: 20px; justify-content: center; margin-top: 20px; }
        .footer-links a { color: #888; text-decoration: none; transition: 0.2s; }
        .footer-links a:hover { color: var(--primary); }

        /* --- MOBILE RESPONSIVENESS --- */
        @media (max-width: 768px) {
          .nav-links { display: none; } /* Hide desktop nav */
          .menu-toggle { display: block; } /* Show hamburger */
          
          .hero h1 { font-size: 40px; }
          .hero p { font-size: 16px; padding: 0 10px; }
          
          .features-grid { padding: 20px; gap: 15px; }
          .hero-buttons { flex-direction: column; width: 100%; max-width: 300px; margin: 0 auto; }
          .btn-primary, .btn-outline { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* --- NAVBAR --- */}
      <nav className="navbar">
        <Link to="/" className="brand">
          <FaUtensils size={22} color="#f97316" />
          SmartMenu<span>.</span>
        </Link>
        
        {/* Desktop Links */}
        <div className="nav-links">
          <Link to="/login" className="nav-link">Log In</Link>
          <Link to="/register" className="btn-primary" style={{padding: '8px 20px'}}>Get Started</Link>
        </div>

        {/* Mobile Toggle */}
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Mobile Menu Dropdown */}
        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>Log In</Link>
          <Link to="/register" className="btn-primary" onClick={() => setMenuOpen(false)}>Start Free Trial</Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="hero fade-in">
        <div className="trust-badge">
          <FaCheckCircle color="#22c55e" /> Trusted by 500+ Restaurants
        </div>
        <h1>Run Your Restaurant <br /><span style={{color: '#f97316'}}>Without The Chaos.</span></h1>
        <p>
          The all-in-one operating system for modern restaurants. 
          Digital QR Menus, Kitchen Displays (KDS), and Profit Analytics.
        </p>
        <div className="hero-buttons">
          <Link to="/register" className="btn-primary">Start Free Trial <FaArrowRight /></Link>
          <Link to="/login" className="btn-outline">Partner Login</Link>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="features-grid fade-in delay-1">
        <div className="feature-card">
          <div className="icon-box"><FaQrcode /></div>
          <div className="feature-title">QR Ordering</div>
          <div className="feature-desc">
            Customers scan a QR code on the table to order and pay instantly. Increase table turnover by 30% and reduce staff workload.
          </div>
        </div>

        <div className="feature-card">
          <div className="icon-box"><FaUtensils /></div>
          <div className="feature-title">Kitchen Display System</div>
          <div className="feature-desc">
            Ditch the paper tickets. Orders pop up on a digital screen in the kitchen with loud alerts. Chefs mark items "Ready" with a tap.
          </div>
        </div>

        <div className="feature-card">
          <div className="icon-box"><FaChartLine /></div>
          <div className="feature-title">Real-Time Analytics</div>
          <div className="feature-desc">
            Track your best-selling dishes, peak hours, and daily revenue live. Make data-driven decisions to grow your profits.
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="fade-in delay-2">
        <p>&copy; {new Date().getFullYear()} Smart Menu Cloud. All rights reserved.</p>
        <div className="footer-links">
          <Link to="/login">Partner Login</Link>
          <Link to="/register">Create Account</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;