import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaUtensils, FaQrcode, FaChartLine, FaBars, FaTimes, FaArrowRight, FaBox, FaShieldAlt, FaGlobe } from "react-icons/fa";

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Trigger pop-up on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 500); 
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="landing-container">
      {/* --- INTERNAL CSS --- */}
      <style>{`
        :root {
          --primary: #f97316;
          --bg: #050505;
          --card-bg: #0c0c0c;
          --text: #ffffff;
          --text-muted: #71717a;
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        body { background-color: var(--bg); color: var(--text); overflow-x: hidden; }

        /* ANIMATIONS */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-in { animation: fadeInUp 0.8s ease forwards; }

        /* WELCOME POPUP */
        .popup-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(15px);
          display: flex; justify-content: center; align-items: center;
          z-index: 1000;
        }
        .popup-content {
          background: var(--card-bg); padding: 50px 30px; border-radius: 40px;
          border: 1px solid #222; text-align: center;
          max-width: 90%; width: 400px;
        }
        .popup-logo { font-size: 50px; color: var(--primary); margin-bottom: 20px; }
        .popup-text { font-size: 32px; font-weight: 900; margin-bottom: 5px; }
        .popup-subtext { color: var(--primary); font-weight: 800; font-size: 14px; letter-spacing: 3px; margin-bottom: 30px; }

        /* NAVBAR */
        .navbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 5%; background: rgba(5, 5, 5, 0.8);
          backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 100;
          border-bottom: 1px solid #111;
        }
        .brand { font-size: 22px; font-weight: 900; display: flex; align-items: center; gap: 10px; color: #fff; text-decoration: none; }
        .brand span { color: var(--primary); }
        
        .nav-links { display: flex; gap: 30px; align-items: center; }
        .nav-links a { text-decoration: none; color: #a1a1aa; font-weight: 600; font-size: 14px; transition: 0.2s; }
        .nav-links a:hover { color: var(--primary); }
        
        /* HERO */
        .hero {
          text-align: center; padding: 120px 20px;
          background: radial-gradient(circle at top, rgba(249,115,22,0.12) 0%, rgba(5,5,5,1) 60%);
        }
        .live-badge {
            background: rgba(34, 197, 94, 0.1); color: #22c55e;
            padding: 6px 15px; border-radius: 50px; font-size: 12px;
            font-weight: 800; display: inline-flex; align-items: center; gap: 8px;
            margin-bottom: 25px; border: 1px solid rgba(34, 197, 94, 0.2);
        }
        .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: blink 1.5s infinite; }
        @keyframes blink { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }

        .hero h1 { font-size: clamp(40px, 8vw, 72px); line-height: 1.1; font-weight: 900; margin-bottom: 25px; letter-spacing: -2px; }
        .hero p { color: var(--text-muted); font-size: 18px; max-width: 650px; margin: 0 auto 45px; line-height: 1.7; }
        
        /* BUTTONS */
        .btn-primary {
          background: var(--primary); color: white; padding: 16px 32px;
          border-radius: 14px; font-weight: 800; text-decoration: none;
          display: inline-flex; align-items: center; gap: 10px; transition: 0.3s; border: none;
        }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(249, 115, 22, 0.3); }

        .btn-outline {
          background: #111; color: white; padding: 15px 30px;
          border: 1px solid #222; border-radius: 14px; font-weight: 700;
          text-decoration: none; margin-left: 15px; transition: 0.2s;
        }
        .btn-outline:hover { background: #1a1a1a; border-color: #444; }

        /* FEATURES */
        .features-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px; padding: 60px 5%; max-width: 1300px; margin: 0 auto;
        }
        .feature-card {
          background: var(--card-bg); padding: 40px; border-radius: 30px;
          border: 1px solid #111; transition: 0.4s;
        }
        .feature-card:hover { border-color: #333; transform: translateY(-10px); background: #111; }
        .icon-box {
          width: 55px; height: 55px; background: rgba(249, 115, 22, 0.1);
          color: var(--primary); display: flex; align-items: center;
          justify-content: center; border-radius: 14px; font-size: 24px; margin-bottom: 25px;
        }
        .feature-title { font-size: 22px; font-weight: 800; margin-bottom: 15px; }
        .feature-desc { color: #71717a; font-size: 15px; line-height: 1.7; }

        /* MOBILE MENU */
        .mobile-toggle { display: none; background: none; border: none; color: white; font-size: 24px; }

        @media (max-width: 768px) {
          .nav-links { display: none; }
          .mobile-toggle { display: block; }
          .hero { padding: 80px 20px; }
          .btn-outline { margin-left: 0; margin-top: 15px; display: block; }
        }
      `}</style>

      {/* --- WELCOME POPUP --- */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content animate-in">
            <div className="popup-logo"><FaBox /></div>
            <h2 className="popup-text">Jai Shree Ram</h2>
            <div className="popup-subtext">SMART MENU v2.0</div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '15px' }}>
              Scale your restaurant with the world's <br/> most powerful cloud OS.
            </p>
            <button className="btn-primary" style={{width: '100%', justifyContent:'center'}} onClick={() => setShowPopup(false)}>
              Launch Experience
            </button>
          </div>
        </div>
      )}

      {/* --- NAVBAR --- */}
      <nav className="navbar">
        <Link to="/" className="brand">
          <FaBox color="#f97316" /> BiteBox<span>.</span>
        </Link>
        
        <div className="nav-links">
          <Link to="/login">Partner Login</Link>
          <Link to="/register" className="btn-primary" style={{padding:'10px 20px', borderRadius:'10px', fontSize:'13px'}}>Create Account</Link>
        </div>

        <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="hero">
        <div className="live-badge animate-in">
            <div className="dot"></div> BITEBOX NETWORK IS LIVE
        </div>
        <h1 className="animate-in">Modernize Your <br /><span style={{color: 'var(--primary)'}}>Restaurant Growth.</span></h1>
        <p className="animate-in" style={{animationDelay: '0.1s'}}>
          Stop using paper. Start using data. BiteBox provides QR ordering, 
          live kitchen tracking, and CEO-level analytics for smart food owners.
        </p>
        <div className="animate-in" style={{animationDelay: '0.2s'}}>
          <Link to="/register" className="btn-primary">Get Started Free <FaArrowRight size={12} /></Link>
          <Link to="/login" className="btn-outline">Watch Demo</Link>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="features-grid">
        <div className="feature-card animate-in" style={{animationDelay: '0.3s'}}>
          <div className="icon-box"><FaQrcode /></div>
          <h3 className="feature-title">Scan & Order</h3>
          <p className="feature-desc">Give your customers a premium digital experience. No app downloads required. Just scan, pick, and pay.</p>
        </div>

        <div className="feature-card animate-in" style={{animationDelay: '0.4s'}}>
          <div className="icon-box"><FaUtensils /></div>
          <h3 className="feature-title">Kitchen OS</h3>
          <p className="feature-desc">Real-time KDS (Kitchen Display System) that connects Chefs and Waiters instantly. Zero delay, zero errors.</p>
        </div>

        <div className="feature-card animate-in" style={{animationDelay: '0.5s'}}>
          <div className="icon-box"><FaGlobe /></div>
          <h3 className="feature-title">Global Cloud</h3>
          <p className="feature-desc">Manage your restaurant from your phone, laptop, or tablet anywhere in the world. 100% uptime guaranteed.</p>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer style={{padding: '80px 20px', textAlign: 'center', borderTop: '1px solid #111'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom: '20px'}}>
            <FaBox color="#f97316" size={24}/> <span style={{fontWeight: 900, fontSize: '20px'}}>BiteBox</span>
        </div>
        <p style={{color: '#444', fontSize: '13px', marginBottom: '30px'}}>© {new Date().getFullYear()} BiteBox SaaS Cloud. Built for Industrial Scale.</p>
        
        <div style={{display:'flex', justifyContent:'center', gap:'40px'}}>
            <Link to="/login" style={{color:'#666', textDecoration:'none', fontSize:'12px', fontWeight: 700}}>LOGIN</Link>
            <Link to="/register" style={{color:'#666', textDecoration:'none', fontSize:'12px', fontWeight: 700}}>REGISTER</Link>
            <Link to="/super-login" style={{color:'#666', textDecoration:'none', fontSize:'12px', fontWeight: 700}}>NETWORK CONTROL</Link>
        </div>
      </footer>
    </div>
  );
};
<div style={{display:'flex', justifyContent:'center', gap:'40px'}}>
    <Link to="/login" style={styles.footerLink}>LOGIN</Link>
    <Link to="/register" style={styles.footerLink}>REGISTER</Link>
    <Link to="/terms" style={styles.footerLink}>TERMS & PRIVACY</Link> {/* ✅ Add this */}
</div>
export default LandingPage;