import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaUtensils, FaQrcode, FaChartLine, FaBars, FaTimes, FaArrowRight, FaBox } from "react-icons/fa";

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Trigger pop-up on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 500); // Small delay for effect
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="landing-container">
      {/* --- INTERNAL CSS --- */}
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

        /* WELCOME POPUP STYLES */
        .popup-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(10px);
          display: flex; justify-content: center; align-items: center;
          z-index: 1000; transition: opacity 0.3s ease;
        }
        .popup-content {
          background: var(--card-bg); padding: 40px; border-radius: 32px;
          border: 1px solid #222; text-align: center;
          box-shadow: 0 0 50px rgba(249, 115, 22, 0.15);
          max-width: 90%; width: 420px; position: relative;
          animation: popIn 0.6s cubic-bezier(0.26, 0.53, 0.74, 1.48);
        }
        @keyframes popIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .popup-logo {
          font-size: 50px; color: var(--primary); margin-bottom: 15px;
          filter: drop-shadow(0 0 10px rgba(249, 115, 22, 0.3));
        }
        .popup-text {
          font-size: 36px; font-weight: 900; color: #fff;
          margin-bottom: 10px; letter-spacing: -1px;
        }
        .popup-subtext {
          font-size: 20px; color: var(--primary); font-weight: 800;
          margin-bottom: 25px; text-transform: uppercase; letter-spacing: 2px;
        }
        .popup-close {
          background: var(--primary); color: white; border: none;
          padding: 12px 35px; border-radius: 12px; font-weight: 800;
          cursor: pointer; transition: 0.2s; font-size: 15px;
        }
        .popup-close:hover { transform: scale(1.05); background: #ea580c; box-shadow: 0 5px 15px rgba(249, 115, 22, 0.4); }

        /* HEADER */
        .navbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 15px 25px; background: rgba(5, 5, 5, 0.8);
          backdrop-filter: blur(10px); position: sticky; top: 0; z-index: 100;
          border-bottom: 1px solid #1a1a1a;
        }
        .brand { 
          font-size: 24px; font-weight: 900; letter-spacing: -1.5px; 
          display: flex; align-items: center; gap: 10px; color: #fff;
          text-decoration: none;
        }
        .brand .logo-icon { color: var(--primary); }
        .brand span { color: var(--primary); }
        
        .nav-links { display: flex; gap: 25px; align-items: center; }
        .nav-links a { text-decoration: none; color: white; font-weight: 600; font-size: 14px; transition: 0.2s; }
        .nav-links a:hover { color: var(--primary); }
        
        .btn-primary {
          background: var(--primary); color: white; padding: 12px 24px;
          border-radius: 10px; font-weight: 700; text-decoration: none;
          transition: 0.2s; display: inline-block; border: none;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3); }

        .btn-outline {
          background: transparent; color: white; padding: 11px 23px;
          border: 1px solid #333; border-radius: 10px; font-weight: 700;
          text-decoration: none; margin-left: 10px; transition: 0.2s;
        }
        .btn-outline:hover { background: #111; border-color: #555; }

        /* HERO SECTION */
        .hero {
          text-align: center; padding: 100px 20px;
          background: radial-gradient(circle at top, rgba(249,115,22,0.15) 0%, rgba(5,5,5,1) 70%);
        }
        .hero h1 { font-size: 54px; line-height: 1; font-weight: 900; margin-bottom: 20px; letter-spacing: -2px; }
        .hero p { color: var(--text-muted); font-size: 18px; max-width: 600px; margin: 0 auto 40px; line-height: 1.6; }
        
        /* GRID LAYOUT */
        .features-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 25px; padding: 40px 20px; max-width: 1200px; margin: 0 auto;
        }
        .feature-card {
          background: #0a0a0a; padding: 35px; border-radius: 24px;
          border: 1px solid #1a1a1a; transition: all 0.3s ease;
          display: flex; flex-direction: column; align-items: flex-start;
        }
        .feature-card:hover { transform: translateY(-10px); border-color: var(--primary); background: #0f0f0f; }
        .icon-box {
          width: 60px; height: 60px; background: rgba(249, 115, 22, 0.1);
          color: var(--primary); display: flex; align-items: center;
          justify-content: center; border-radius: 16px; font-size: 28px;
          margin-bottom: 20px;
        }
        .feature-title { font-size: 20px; font-weight: 800; margin-bottom: 12px; color: #fff; }
        .feature-desc { color: var(--text-muted); font-size: 15px; line-height: 1.6; }

        /* FOOTER */
        footer {
          border-top: 1px solid #1a1a1a; padding: 60px 20px;
          text-align: center; margin-top: 60px; color: #444; font-size: 14px;
        }

        @media (max-width: 768px) {
          .hero h1 { font-size: 38px; }
          .nav-links { display: none; }
          .features-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* --- WELCOME POPUP --- */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-logo"><FaBox /></div>
            <h2 className="popup-text">Jai Shree Ram</h2>
            <div className="popup-subtext">BiteBox Kitchen</div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px', lineHeight: '1.5' }}>
              Experience the future of smart dining <br/> with Smart Menu Cloud.
            </p>
            <button className="popup-close" onClick={() => setShowPopup(false)}>
              Launch Dashboard
            </button>
          </div>
        </div>
      )}

      {/* --- NAVBAR --- */}
      <nav className="navbar">
        <Link to="/" className="brand">
          <FaBox className="logo-icon" size={26} />
          BiteBox<span>.</span>
        </Link>
        <div className="nav-links">
          <Link to="/login">Login</Link>
          <Link to="/register" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="hero">
        <div style={{color: 'var(--primary)', fontWeight: '800', marginBottom: '15px', letterSpacing: '2px'}}>POWERED BY BITEBOX AI</div>
        <h1>Run Your Restaurant <br /><span style={{color: '#f97316'}}>Without The Chaos.</span></h1>
        <p>
          Digital QR Menus, Kitchen Displays, and Profit Analytics. 
          The all-in-one OS for modern food businesses.
        </p>
        <div>
          <Link to="/register" className="btn-primary">Start 60-Day Free Trial <FaArrowRight style={{marginLeft: 8, fontSize: '12px'}} /></Link>
          <Link to="/login" className="btn-outline">Partner Login</Link>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="features-grid">
        <div className="feature-card">
          <div className="icon-box"><FaQrcode /></div>
          <div className="feature-title">Smart QR Ordering</div>
          <div className="feature-desc">
            Customers scan, order, and pay at the table. Reduce wait times by 40% and eliminate order errors entirely.
          </div>
        </div>

        <div className="feature-card">
          <div className="icon-box"><FaUtensils /></div>
          <div className="feature-title">Next-Gen KDS</div>
          <div className="feature-desc">
            A high-speed Kitchen Display System with live sync. Keep your chefs organized and your service lightning fast.
          </div>
        </div>

        <div className="feature-card">
          <div className="icon-box"><FaChartLine /></div>
          <div className="feature-title">Revenue Analytics</div>
          <div className="feature-desc">
            Track daily sales, top-selling items, and customer feedback from your master command center.
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer>
        <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom: '20px', color: '#fff', fontWeight: '800'}}>
            <FaBox color="#f97316"/> BITEBOX KITCHEN
        </div>
        <p>&copy; {new Date().getFullYear()} Smart Menu Cloud. All rights reserved.</p>
        <div style={{ marginTop: '20px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <Link to="/login" style={{ color: '#666', textDecoration: 'none' }}>Partner Login</Link>
          <Link to="/register" style={{ color: '#666', textDecoration: 'none' }}>Join Network</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;