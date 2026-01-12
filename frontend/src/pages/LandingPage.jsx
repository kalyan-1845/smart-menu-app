import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaUtensils, FaQrcode, FaArrowRight, FaServer, FaGlobe, FaNetworkWired, FaCheckCircle, FaTimes } from "react-icons/fa";

const LandingPage = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // 🔄 AUTO-DETECT SCREEN SIZE & POPUP TIMER
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 800); 
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="landing-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');

        :root {
          --primary: #3b82f6; /* Electric Blue */
          --primary-dark: #2563eb;
          --accent: #06b6d4; /* Cyan */
          --bg: #020617; /* Deep Slate */
          --surface: #0f172a;
          --surface-light: #1e293b;
          --text: #f8fafc;
          --text-muted: #94a3b8;
          --border: rgba(255,255,255,0.08);
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; outline: none; }
        body { background-color: var(--bg); color: var(--text); font-family: 'Plus Jakarta Sans', sans-serif; overflow-x: hidden; }

        /* BACKGROUND GRID EFFECT */
        .landing-container {
            background-color: var(--bg);
            background-image: 
                linear-gradient(to right, rgba(30, 41, 59, 0.5) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(30, 41, 59, 0.5) 1px, transparent 1px);
            background-size: 50px 50px;
            position: relative;
            min-height: 100vh;
        }
        .landing-container::after {
            content: "";
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at 50% 0%, transparent 0%, var(--bg) 80%);
            pointer-events: none;
        }

        /* ANIMATIONS */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); } 70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); } 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } }

        .animate-in { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }

        /* --- NAVBAR --- */
        .navbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 5%;
          position: sticky; top: 0; z-index: 100;
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          background: rgba(2, 6, 23, 0.8);
        }
        .brand { 
            font-size: 22px; font-weight: 800; display: flex; align-items: center; gap: 12px; 
            color: #fff; text-decoration: none; letter-spacing: -0.5px;
        }
        .brand-icon { 
            width: 32px; height: 32px; background: linear-gradient(135deg, var(--primary), var(--accent)); 
            border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white;
        }
        
        .nav-links { display: flex; gap: 30px; align-items: center; }
        .nav-link { text-decoration: none; color: var(--text-muted); font-weight: 600; font-size: 14px; transition: 0.2s; }
        .nav-link:hover { color: white; }

        /* BUTTONS */
        .btn {
            padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px;
            text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
            transition: all 0.2s ease; cursor: pointer; border: none;
        }
        .btn-primary {
            background: var(--primary); color: white;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        }
        .btn-primary:hover { background: var(--primary-dark); transform: translateY(-2px); }
        
        .btn-outline {
            background: rgba(255,255,255,0.03); color: white; border: 1px solid var(--border);
        }
        .btn-outline:hover { background: rgba(255,255,255,0.08); border-color: var(--text-muted); }

        /* HERO */
        .hero {
            position: relative; z-index: 2;
            padding: 120px 20px 80px;
            text-align: center;
            max-width: 1000px; margin: 0 auto;
        }
        
        .status-pill {
            display: inline-flex; align-items: center; gap: 8px;
            background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.2);
            color: var(--accent); padding: 6px 16px; border-radius: 30px;
            font-size: 12px; font-family: 'JetBrains Mono', monospace; font-weight: 700;
            margin-bottom: 30px;
        }
        .blink { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; animation: pulseGlow 2s infinite; }

        .hero h1 {
            font-size: 72px; line-height: 1.1; font-weight: 800; letter-spacing: -2px;
            background: linear-gradient(to bottom right, #ffffff, #94a3b8);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            margin-bottom: 25px;
        }
        .hero h1 span {
            background: linear-gradient(to right, var(--primary), var(--accent));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        
        .hero p {
            font-size: 18px; color: var(--text-muted); line-height: 1.6;
            max-width: 600px; margin: 0 auto 40px;
        }

        /* FEATURES */
        .features {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px;
            max-width: 1200px; margin: 0 auto 100px; padding: 0 20px;
            position: relative; z-index: 2;
        }
        .feature-card {
            background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(10px);
            border: 1px solid var(--border); padding: 40px 30px; border-radius: 20px;
            transition: 0.3s;
        }
        .feature-card:hover {
            border-color: var(--primary);
            transform: translateY(-10px);
            background: rgba(15, 23, 42, 0.9);
        }
        .icon-wrap {
            width: 50px; height: 50px; background: linear-gradient(135deg, var(--surface-light), var(--bg));
            border: 1px solid var(--border); border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            color: var(--primary); font-size: 20px; margin-bottom: 20px;
        }
        .f-title { font-size: 18px; font-weight: 700; color: white; margin-bottom: 10px; }
        .f-desc { color: var(--text-muted); font-size: 14px; line-height: 1.5; }

        /* FOOTER */
        .footer {
            border-top: 1px solid var(--border); padding: 60px 20px; text-align: center;
            background: var(--bg); position: relative; z-index: 2;
        }
        .footer-links { display: flex; justify-content: center; gap: 40px; margin-top: 30px; }
        .footer-link { color: var(--text-muted); text-decoration: none; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
        .footer-link:hover { color: var(--primary); }

        /* POPUP */
        .popup-overlay {
            position: fixed; inset: 0; background: rgba(2, 6, 23, 0.9); backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center; z-index: 999;
        }
        .popup-box {
            background: var(--surface); border: 1px solid var(--border);
            padding: 40px; border-radius: 24px; text-align: center; width: 400px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            animation: fadeUp 0.4s ease-out;
        }
        .sys-badge {
            background: rgba(34, 197, 94, 0.1); color: #22c55e;
            padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 800; 
            letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px; display: inline-block;
        }

        /* MEDIA QUERIES */
        @media (max-width: 768px) {
            .nav-links { display: none; }
            .hero h1 { font-size: 42px; }
            .features { grid-template-columns: 1fr; }
            .footer-links { flex-direction: column; gap: 20px; }
        }
      `}</style>

      {/* --- WELCOME SYSTEM POPUP --- */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <div style={{display:'flex', justifyContent:'flex-end'}}>
                <button onClick={() => setShowPopup(false)} style={{background:'none', border:'none', color:'#666', cursor:'pointer'}}><FaTimes/></button>
            </div>
            <div className="sys-badge">● SYSTEM ONLINE</div>
            <h2 style={{fontSize: '28px', fontWeight: 800, marginBottom: '10px'}}>Kovixa OS v2.0</h2>
            <p style={{color: 'var(--text-muted)', marginBottom: '30px', fontSize: '14px'}}>
              The enterprise-grade operating system for modern restaurants. <br/> Zero latency. 100% Uptime.
            </p>
            <button className="btn btn-primary" style={{width: '100%', justifyContent: 'center'}} onClick={() => setShowPopup(false)}>
              Initialize Dashboard
            </button>
          </div>
        </div>
      )}

      {/* --- NAVBAR --- */}
      <nav className="navbar">
        <Link to="/" className="brand">
          <div className="brand-icon"><FaNetworkWired size={16}/></div>
          KOVIXA
        </Link>
        <div className="nav-links">
          <Link to="/login" className="nav-link">PARTNER LOGIN</Link>
          <Link to="/super-login" className="nav-link">SYSTEM STATUS</Link>
          <Link to="/register" className="btn btn-primary">
            Create Account
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="hero">
        <div className="status-pill animate-in">
            <div className="blink"></div> SYSTEM OPERATIONAL
        </div>
        
        <h1 className="animate-in" style={{animationDelay: '0.1s'}}>
          The Operating System <br/> for <span>Modern Dining.</span>
        </h1>
        
        <p className="animate-in" style={{animationDelay: '0.2s'}}>
          Replace fragmented tools with one powerful cloud platform. 
          QR Ordering, Kitchen Display Systems (KDS), and Inventory Logic in a single codebase.
        </p>
        
        <div className="animate-in" style={{animationDelay: '0.3s', display: 'flex', justifyContent: 'center', gap: '15px', flexDirection: isMobile ? 'column' : 'row'}}>
          <Link to="/register" className="btn btn-primary" style={{justifyContent: 'center'}}>
            Deploy Restaurant <FaArrowRight size={12} />
          </Link>
          <Link to="/login" className="btn btn-outline" style={{justifyContent: 'center'}}>
            Live Demo Environment
          </Link>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="features">
        <div className="feature-card animate-in" style={{animationDelay: '0.4s'}}>
          <div className="icon-wrap"><FaQrcode /></div>
          <h3 className="f-title">Contactless Core</h3>
          <p className="f-desc">Direct-to-table QR ordering system. Eliminates hardware costs and reduces wait times by 40%.</p>
        </div>
        <div className="feature-card animate-in" style={{animationDelay: '0.5s'}}>
          <div className="icon-wrap"><FaServer /></div>
          <h3 className="f-title">Kitchen Logic</h3>
          <p className="f-desc">Real-time KDS synchronization. Orders move from table to kitchen instantly via WebSocket pipelines.</p>
        </div>
        <div className="feature-card animate-in" style={{animationDelay: '0.6s'}}>
          <div className="icon-wrap"><FaGlobe /></div>
          <h3 className="f-title">Global Cloud</h3>
          <p className="f-desc">Manage multi-chain operations from a single dashboard. Enterprise-grade security and uptime.</p>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="footer">
        <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:15}}>
            <FaNetworkWired color="#3b82f6"/> <span style={{fontWeight:800, letterSpacing:-0.5}}>KOVIXA SYSTEMS</span>
        </div>
        <p style={{color: '#475569', fontSize: '13px'}}>Engineered for scale. Built in Hyderabad.</p>
        
        <div className="footer-links">
            <Link to="/login" className="footer-link">Owner Portal</Link>
            <Link to="/register" className="footer-link">New Deployment</Link>
            <Link to="/terms" className="footer-link">Protocols</Link>
            <Link to="/super-login" className="footer-link">Admin Node</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;