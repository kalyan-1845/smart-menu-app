import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FaUtensils, FaQrcode, FaArrowRight, FaChartLine, 
  FaShieldAlt, FaHandshake, FaBoxOpen, FaStar, FaBolt
} from "react-icons/fa";

const LandingPage = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="landing-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        :root {
          --primary: #3b82f6;
          --primary-glow: rgba(59, 130, 246, 0.5);
          --bg: #020617;
          --surface: #0f172a;
          --text: #f8fafc;
          --text-muted: #94a3b8;
          --border: rgba(255,255,255,0.1);
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; outline: none; -webkit-tap-highlight-color: transparent; }
        html, body { overflow-x: hidden; }
        body { background-color: var(--bg); color: var(--text); font-family: 'Plus Jakarta Sans', sans-serif; }

        .landing-container {
            background-color: var(--bg);
            background-image: 
                radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.1) 0px, transparent 50%);
            min-height: 100vh;
            width: 100%;
        }

        /* --- NAVBAR --- */
        .navbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 40px; position: sticky; top: 0; z-index: 100;
          backdrop-filter: blur(16px); border-bottom: 1px solid var(--border);
          background: rgba(2, 6, 23, 0.8);
        }
        .brand { 
            font-size: 26px; font-weight: 800; display: flex; align-items: center; gap: 12px; 
            color: #fff; text-decoration: none; letter-spacing: -0.5px;
        }
        .nav-links { display: flex; gap: 30px; align-items: center; }
        .nav-link { text-decoration: none; color: var(--text-muted); font-weight: 600; font-size: 15px; transition: 0.2s; }
        .nav-link:hover { color: white; }

        /* --- BUTTONS --- */
        .btn {
            padding: 14px 32px; border-radius: 14px; font-weight: 700; font-size: 16px;
            text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 10px;
            transition: all 0.2s ease; cursor: pointer; border: none; white-space: nowrap;
        }
        .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white;
            box-shadow: 0 8px 25px -5px var(--primary-glow);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 30px -5px var(--primary-glow); }
        .btn-outline {
            background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--border);
        }
        .btn-outline:hover { background: rgba(255,255,255,0.1); border-color: white; }

        /* --- HERO --- */
        .hero {
            padding: 120px 20px 80px; text-align: center;
            max-width: 1200px; margin: 0 auto;
            display: flex; flex-direction: column; align-items: center;
        }
        .trust-badge {
            display: inline-flex; align-items: center; gap: 8px;
            background: rgba(59, 130, 246, 0.1); color: #60a5fa;
            padding: 8px 20px; border-radius: 50px; font-size: 14px; font-weight: 700;
            margin-bottom: 30px; border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .hero h1 {
            font-size: 72px; line-height: 1.05; font-weight: 800; letter-spacing: -2px;
            margin-bottom: 30px;
            background: linear-gradient(to right, #fff 20%, #94a3b8 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .hero p {
            font-size: 20px; color: var(--text-muted); line-height: 1.6;
            max-width: 700px; margin-bottom: 50px;
        }
        .cta-group { display: flex; gap: 20px; }

        /* --- GRID --- */
        .grid-section { max-width: 1200px; margin: 0 auto 120px; padding: 0 20px; }
        .section-header { text-align: center; margin-bottom: 60px; }
        .section-header h2 { font-size: 42px; font-weight: 800; margin-bottom: 15px; }
        .section-header p { font-size: 18px; color: var(--text-muted); }

        .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
        .feature-card {
            background: var(--surface); border: 1px solid var(--border);
            padding: 40px; border-radius: 24px; transition: 0.3s;
            position: relative; overflow: hidden;
        }
        .feature-card:hover { border-color: var(--primary); transform: translateY(-5px); }
        .icon-box {
            width: 60px; height: 60px; background: rgba(59, 130, 246, 0.1);
            border-radius: 16px; display: flex; align-items: center; justify-content: center;
            color: var(--primary); font-size: 28px; margin-bottom: 25px;
        }
        .feature-card h3 { font-size: 22px; font-weight: 700; margin-bottom: 12px; }
        .feature-card p { color: var(--text-muted); line-height: 1.6; font-size: 16px; }

        /* --- PROMISE --- */
        .promise-box {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            border: 1px solid rgba(255,255,255,0.1); border-radius: 30px;
            padding: 80px; text-align: center; position: relative; overflow: hidden;
        }
        .shine {
            position: absolute; top: 0; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg, transparent, #3b82f6, transparent);
        }

        /* --- FOOTER --- */
        .footer {
            border-top: 1px solid var(--border); padding: 60px 20px;
            background: #020617; text-align: center;
        }
        .footer-nav { display: flex; justify-content: center; gap: 40px; margin-top: 30px; }
        .f-link { color: var(--text-muted); text-decoration: none; font-weight: 600; transition:0.2s; }
        .f-link:hover { color: white; }

        /* ========================================= */
        /* 📱 MOBILE OPTIMIZATIONS (The Big Fixes) */
        /* ========================================= */
        @media (max-width: 768px) {
            .navbar { padding: 15px 20px; }
            .nav-links { display: none; } /* Hide secondary links on mobile */
            
            .hero { padding: 100px 20px 60px; text-align: left; }
            .hero h1 { font-size: 48px; line-height: 1.1; margin-bottom: 20px; }
            .hero p { font-size: 18px; margin-bottom: 40px; }
            
            .cta-group { flex-direction: column; width: 100%; gap: 15px; }
            .btn { width: 100%; padding: 18px; font-size: 18px; } /* BIG BUTTONS FOR MOBILE */
            
            .section-header h2 { font-size: 32px; }
            
            .features { grid-template-columns: 1fr; gap: 20px; } /* Stack cards */
            .feature-card { padding: 30px; }
            
            .promise-box { padding: 40px 20px; }
            .promise-box h2 { font-size: 28px; }
            
            .footer-nav { flex-direction: column; gap: 20px; }
        }
      `}</style>

      {/* --- NAVBAR --- */}
      <nav className="navbar">
        <Link to="/" className="brand">
          <FaUtensils className="text-blue-500" style={{color: '#3b82f6'}} /> KOVIXA
        </Link>
        <div className="nav-links">
          <Link to="/login" className="nav-link">Owner Login</Link>
          <Link to="/register" className="btn btn-primary" style={{padding: '10px 24px', fontSize: '14px'}}>
            Create Restaurant
          </Link>
        </div>
        {/* Mobile-Only Login Button */}
        {isMobile && (
            <Link to="/login" className="btn btn-outline" style={{padding: '8px 16px', fontSize: '13px'}}>
                Login
            </Link>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="hero">
        <div className="trust-badge">
           <FaStar color="#f59e0b" /> #1 Restaurant OS for 2026
        </div>
        
        <h1>
          The Future of <br/> 
          <span style={{color: '#60a5fa'}}>Food Business.</span>
        </h1>
        
        <p>
          Manage orders, kitchen, and revenue in one place. <br/>
          Simple enough for a food truck, powerful enough for a franchise.
        </p>
        
        <div className="cta-group">
          <Link to="/register" className="btn btn-primary">
            Start Free Account <FaArrowRight />
          </Link>
          <Link to="/login" className="btn btn-outline">
            Owner Dashboard
          </Link>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <div className="grid-section">
        <div className="section-header">
            <h2>Built for Speed</h2>
            <p>Everything is designed to be fast, stable, and easy.</p>
        </div>

        <div className="features">
            <div className="feature-card">
                <div className="icon-box"><FaQrcode /></div>
                <h3>QR Ordering</h3>
                <p>Customers scan & order directly. No waiters needed for taking orders. Faster turnover.</p>
            </div>
            <div className="feature-card">
                <div className="icon-box"><FaBolt /></div>
                <h3>Instant KOT</h3>
                <p>Orders flash on the Kitchen Display immediately with big, clear text for chefs.</p>
            </div>
            <div className="feature-card">
                <div className="icon-box"><FaChartLine /></div>
                <h3>Live Profits</h3>
                <p>Watch your revenue grow in real-time. Track cash vs online payments instantly.</p>
            </div>
        </div>
      </div>

      {/* --- PROMISE SECTION --- */}
      <div className="grid-section">
        <div className="promise-box">
            <div className="shine"></div>
            <div style={{display:'flex',justifyContent:'center',marginBottom:25}}>
                <FaHandshake size={60} color="#3b82f6" />
            </div>
            <h2 style={{color:'white', marginBottom:20}}>100-Year Free Access</h2>
            <p style={{maxWidth:700, margin:'0 auto', color:'#94a3b8', fontSize:18, lineHeight:1.6}}>
                "We don't charge monthly fees for our partners. Kovixa is designed to support the 
                hardworking restaurant owners of India. Your success is our success."
            </p>
            <div style={{marginTop:40}}>
                <Link to="/register" className="btn btn-primary" style={{width: isMobile ? '100%' : 'auto'}}>
                    Claim Your Account Now
                </Link>
            </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="footer">
        <div style={{marginBottom:20}}>
            <h3 style={{fontSize:24, fontWeight:800, color:'white'}}>KOVIXA</h3>
            <p style={{color:'#64748b', marginTop:10}}>Powering the next generation of dining.</p>
        </div>
        <div className="footer-nav">
            <Link to="/login" className="f-link">Owner Login</Link>
            <Link to="/register" className="f-link">Register</Link>
        </div>
        <div style={{marginTop: 40, color: '#334155', fontSize: 13}}>
            &copy; 2026 Kovixa Systems. Secure & Encrypted.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;