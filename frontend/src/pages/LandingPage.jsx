import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaUtensils, FaQrcode, FaArrowRight, FaBox, FaGlobe, FaBars, FaTimes } from "react-icons/fa";

const LandingPage = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // 🔄 AUTO-DETECT SCREEN SIZE
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 500); 
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="landing-container">
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

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-in { animation: fadeInUp 0.8s ease forwards; }

        /* --- 📱 MOBILE MODE (9:16) --- */
        @media (max-width: 768px) {
          .navbar { padding: 15px 20px; }
          .nav-links { display: none; } /* Hide desktop links */
          .hero h1 { font-size: 42px; line-height: 1.1; }
          .hero p { font-size: 16px; padding: 0 10px; }
          .features-grid { grid-template-columns: 1fr; padding: 40px 20px; }
          .footer-links { flex-direction: column; gap: 20px; }
        }

        /* --- 💻 LAPTOP MODE (16:9) --- */
        @media (min-width: 769px) {
          .navbar { padding: 25px 5%; }
          .hero { padding: 140px 0 100px; }
          .hero h1 { font-size: 80px; letter-spacing: -3px; }
          .hero p { font-size: 20px; max-width: 700px; }
          .features-grid { 
            grid-template-columns: repeat(3, 1fr); 
            gap: 40px; 
            max-width: 1400px; 
            padding: 80px 5%; 
          }
          .footer-links { flex-direction: row; gap: 50px; }
        }

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
          animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        .popup-logo { font-size: 50px; color: var(--primary); margin-bottom: 20px; }
        .popup-text { font-size: 32px; font-weight: 900; margin-bottom: 5px; }
        .popup-subtext { color: var(--primary); font-weight: 800; font-size: 14px; letter-spacing: 3px; margin-bottom: 30px; }

        /* NAVBAR */
        .navbar {
          display: flex; justify-content: space-between; align-items: center;
          background: rgba(5, 5, 5, 0.8); backdrop-filter: blur(12px); 
          position: sticky; top: 0; z-index: 100; border-bottom: 1px solid #111;
        }
        .brand { font-size: 24px; font-weight: 900; display: flex; align-items: center; gap: 10px; color: #fff; text-decoration: none; }
        .brand span { color: var(--primary); }
        
        .nav-links { display: flex; gap: 40px; align-items: center; }
        .nav-links a { text-decoration: none; color: #a1a1aa; font-weight: 600; font-size: 14px; transition: 0.2s; }
        .nav-links a:hover { color: var(--primary); }
        
        /* HERO */
        .hero {
          text-align: center; 
          background: radial-gradient(circle at 50% 0%, rgba(249,115,22,0.15) 0%, rgba(5,5,5,1) 70%);
          display: flex; flex-direction: column; align-items: center;
        }
        .live-badge {
          background: rgba(34, 197, 94, 0.1); color: #22c55e;
          padding: 6px 15px; border-radius: 50px; font-size: 12px;
          font-weight: 800; display: inline-flex; align-items: center; gap: 8px;
          margin-bottom: 30px; border: 1px solid rgba(34, 197, 94, 0.2);
        }
        .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: blink 1.5s infinite; }
        @keyframes blink { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }

        .hero h1 { font-weight: 900; margin-bottom: 25px; color: #fff; }
        .hero p { color: var(--text-muted); margin-bottom: 45px; line-height: 1.6; }
        
        .btn-primary {
          background: var(--primary); color: white; padding: 16px 32px;
          border-radius: 14px; font-weight: 800; text-decoration: none;
          display: inline-flex; align-items: center; gap: 10px; transition: 0.3s; border: none;
          cursor: pointer;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(249,115,22,0.3); }
        
        .btn-outline {
          background: #111; color: white; padding: 15px 30px;
          border: 1px solid #222; border-radius: 14px; font-weight: 700;
          text-decoration: none; margin-left: 15px; transition: 0.2s; cursor: pointer;
        }
        .btn-outline:hover { border-color: var(--primary); color: var(--primary); }

        .features-grid { margin: 0 auto; }
        .feature-card {
          background: var(--card-bg); padding: 40px; border-radius: 30px;
          border: 1px solid #1a1a1a; transition: 0.4s;
          display: flex; flex-direction: column; align-items: flex-start;
        }
        .feature-card:hover { border-color: #333; transform: translateY(-10px); background: #111; }
        .icon-box {
          width: 60px; height: 60px; background: rgba(249, 115, 22, 0.1);
          color: var(--primary); display: flex; align-items: center;
          justify-content: center; border-radius: 16px; font-size: 26px; margin-bottom: 25px;
        }
        .feature-title { font-size: 22px; font-weight: 800; margin-bottom: 10px; color: #fff; }
        .feature-desc { font-size: 15px; color: #888; line-height: 1.6; }

        /* FOOTER */
        .footer { padding: 80px 20px; text-align: center; border-top: 1px solid #111; background: #080808; }
        .footer-logo { display: flex; alignItems: center; justifyContent: center; gap: 10px; margin-bottom: 20px; }
        .footer-links { display: flex; justifyContent: center; margin-top: 30px; }
        .footer-link { color: #666; text-decoration: none; font-size: 13px; font-weight: 700; transition: 0.2s; text-transform: uppercase; letter-spacing: 1px; }
        .footer-link:hover { color: #fff; }

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
          <FaBox color="#f97316" /> Kovixa<span>.</span>
        </Link>
        <div className="nav-links">
          <Link to="/login">Partner Login</Link>
          <Link to="/super-login">Network Status</Link>
          <Link to="/register" className="btn-primary" style={{padding:'12px 24px', borderRadius:'12px', fontSize:'14px'}}>
            Create Account
          </Link>
        </div>
        {/* Mobile Menu Icon could go here */}
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="hero">
        <div className="live-badge animate-in">
            <div className="dot"></div> KOVIXA NETWORK IS LIVE
        </div>
        <h1 className="animate-in">
          Modernize Your <br />
          <span style={{color: 'var(--primary)'}}>Restaurant Growth.</span>
        </h1>
        <p className="animate-in" style={{animationDelay: '0.1s'}}>
          Stop using paper. Start using data. Kovixa provides QR ordering, 
          live kitchen tracking, and CEO-level analytics for smart food owners.
        </p>
        <div className="animate-in" style={{animationDelay: '0.2s', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '15px' : '0'}}>
          <Link to="/register" className="btn-primary" style={{justifyContent: 'center'}}>
            Get Started Free <FaArrowRight size={12} />
          </Link>
          <Link to="/login" className={`btn-outline ${isMobile ? '' : 'ml-4'}`} style={{textAlign: 'center', marginLeft: isMobile ? 0 : '15px'}}>
            Watch Demo
          </Link>
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
          <p className="feature-desc">Real-time KDS that connects Chefs and Waiters instantly. Zero delay, zero errors.</p>
        </div>
        <div className="feature-card animate-in" style={{animationDelay: '0.5s'}}>
          <div className="icon-box"><FaGlobe /></div>
          <h3 className="feature-title">Global Cloud</h3>
          <p className="feature-desc">Manage your restaurant from anywhere in the world. 100% uptime guaranteed.</p>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="footer">
        <div className="footer-logo">
            <FaBox color="#f97316" size={24}/> 
            <span style={{fontWeight: 900, fontSize: '20px', color:'#fff'}}>Kovixa</span>
        </div>
        <p style={{color: '#444', fontSize: '13px'}}>© {new Date().getFullYear()} Kovixa SaaS Cloud. Built for Industrial Scale.</p>
        
        <div className="footer-links">
            <Link to="/login" className="footer-link">LOGIN</Link>
            <Link to="/register" className="footer-link">REGISTER</Link>
            <Link to="/terms" className="footer-link">TERMS & PRIVACY</Link>
            <Link to="/super-login" className="footer-link">NETWORK CONTROL</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;