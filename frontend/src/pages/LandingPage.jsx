import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaUtensils, FaQrcode, FaChartLine, FaBars, FaTimes, FaArrowRight } from "react-icons/fa";

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="landing-container">
      {/* --- INTERNAL CSS (No separate file needed) --- */}
      <style>{`
        :root {
          --primary: #f97316;
          --bg: #050505;
          --card-bg: #121212;
          --text: #ffffff;
          --text-muted: #a1a1aa;
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        
        body { background-color: var(--bg); color: var(--text); overflow-x: hidden; }

        /* HEADER */
        .navbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 15px 20px; background: rgba(5, 5, 5, 0.9);
          backdrop-filter: blur(10px); position: sticky; top: 0; z-index: 100;
          border-bottom: 1px solid #222;
        }
        .brand { font-size: 22px; font-weight: 900; letter-spacing: -1px; display: flex; align-items: center; gap: 8px; }
        .brand span { color: var(--primary); }
        
        .nav-links { display: flex; gap: 20px; align-items: center; }
        .nav-links a { text-decoration: none; color: white; font-weight: 600; font-size: 14px; transition: 0.2s; }
        .nav-links a:hover { color: var(--primary); }
        
        .btn-primary {
          background: var(--primary); color: white; padding: 10px 20px;
          border-radius: 8px; font-weight: 700; text-decoration: none;
          transition: transform 0.2s; display: inline-block;
        }
        .btn-primary:active { transform: scale(0.95); }

        .btn-outline {
          background: transparent; color: white; padding: 10px 20px;
          border: 1px solid #333; border-radius: 8px; font-weight: 700;
          text-decoration: none; margin-left: 10px;
        }

        /* HERO SECTION (Amazon Banner Style) */
        .hero {
          text-align: center; padding: 60px 20px;
          background: linear-gradient(180deg, rgba(249,115,22,0.1) 0%, rgba(5,5,5,1) 100%);
        }
        .hero h1 { font-size: 42px; line-height: 1.1; font-weight: 900; margin-bottom: 15px; }
        .hero p { color: var(--text-muted); font-size: 16px; max-width: 500px; margin: 0 auto 30px; line-height: 1.5; }
        
        /* GRID LAYOUT (Flipkart Product Grid Style) */
        .features-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px; padding: 20px; max-width: 1200px; margin: 0 auto;
        }
        
        .feature-card {
          background: var(--card-bg); padding: 25px; border-radius: 16px;
          border: 1px solid #222; transition: transform 0.2s;
          display: flex; flex-direction: column; align-items: flex-start;
        }
        .feature-card:hover { transform: translateY(-5px); border-color: var(--primary); }
        
        .icon-box {
          width: 50px; height: 50px; background: rgba(249, 115, 22, 0.1);
          color: var(--primary); display: flex; align-items: center;
          justify-content: center; border-radius: 12px; font-size: 24px;
          margin-bottom: 15px;
        }
        
        .feature-title { font-size: 18px; font-weight: 800; margin-bottom: 8px; }
        .feature-desc { color: var(--text-muted); font-size: 14px; line-height: 1.5; }

        /* FOOTER */
        footer {
          border-top: 1px solid #222; padding: 40px 20px;
          text-align: center; margin-top: 60px; color: #666; font-size: 13px;
        }

        /* MOBILE RESPONSIVENESS */
        @media (max-width: 768px) {
          .hero h1 { font-size: 32px; }
          .nav-links { display: none; } /* Hide standard nav on mobile */
          .mobile-menu-btn { display: block; }
          .features-grid { grid-template-columns: 1fr; } /* Stack cards on mobile */
        }
      `}</style>

      {/* --- NAVBAR --- */}
      <nav className="navbar">
        <div className="brand">
          <FaUtensils size={20} color="#f97316" />
          SmartMenu<span>.</span>
        </div>
        <div className="nav-links">
          <Link to="/login">Login</Link>
          <Link to="/register" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="hero">
        <h1>Run Your Restaurant <br /><span style={{color: '#f97316'}}>Without The Chaos.</span></h1>
        <p>
          Digital QR Menus, Kitchen Displays, and Profit Analytics. 
          Everything you need to scale from one table to a hundred.
        </p>
        <div>
          <Link to="/register" className="btn-primary">Start Free Trial <FaArrowRight style={{marginLeft: 8}} /></Link>
          <Link to="/login" className="btn-outline">Partner Login</Link>
        </div>
      </section>

      {/* --- FEATURES GRID (Product Cards Look) --- */}
      <section className="features-grid">
        <div className="feature-card">
          <div className="icon-box"><FaQrcode /></div>
          <div className="feature-title">QR Ordering</div>
          <div className="feature-desc">
            Customers scan a QR code on the table, order, and pay instantly. No waiters needed for order taking.
          </div>
        </div>

        <div className="feature-card">
          <div className="icon-box"><FaUtensils /></div>
          <div className="feature-title">Kitchen Display</div>
          <div className="feature-desc">
            Orders pop up on a screen in the kitchen with a loud notification. Chefs mark them "Ready" with one tap.
          </div>
        </div>

        <div className="feature-card">
          <div className="icon-box"><FaChartLine /></div>
          <div className="feature-title">Live Analytics</div>
          <div className="feature-desc">
            See your daily sales, popular dishes, and revenue charts in real-time. Make data-driven decisions.
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer>
        <p>&copy; {new Date().getFullYear()} Smart Menu Cloud. Built for modern restaurants.</p>
        <div style={{ marginTop: '15px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <Link to="/login" style={{ color: '#888', textDecoration: 'none' }}>Login</Link>
          <Link to="/register" style={{ color: '#888', textDecoration: 'none' }}>Register</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;