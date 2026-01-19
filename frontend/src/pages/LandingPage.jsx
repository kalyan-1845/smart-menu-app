import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FaUtensils, FaQrcode, FaArrowRight, FaChartLine, 
  FaHandshake, FaStar, FaBolt
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
          padding: 25px 60px; position: sticky; top: 0; z-index: 100;
          backdrop-filter: blur(16px); border-bottom: 1px solid var(--border);
          background: rgba(2, 6, 23, 0.8);
        }
        .brand { 
            font-size: 32px; font-weight: 800; display: flex; align-items: center; gap: 15px; 
            color: #fff; text-decoration: none; letter-spacing: -1px;
        }
        .nav-links { display: flex; gap: 40px; align-items: center; }
        .nav-link { text-decoration: none; color: var(--text-muted); font-weight: 700; font-size: 18px; transition: 0.2s; }
        .nav-link:hover { color: white; }

        /* --- BUTTONS --- */
        .btn {
            padding: 18px 42px; border-radius: 16px; font-weight: 800; font-size: 18px;
            text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 12px;
            transition: all 0.2s ease; cursor: pointer; border: none; white-space: nowrap;
        }
        .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white;
            box-shadow: 0 8px 25px -5px var(--primary-glow);
        }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 35px -5px var(--primary-glow); }
        .btn-outline {
            background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--border);
        }
        .btn-outline:hover { background: rgba(255,255,255,0.1); border-color: white; }

        /* --- HERO --- */
        .hero {
            padding: 160px 20px 100px; text-align: center;
            max-width: 1400px; margin: 0 auto;
            display: flex; flex-direction: column; align-items: center;
        }
        .trust-badge {
            display: inline-flex; align-items: center; gap: 10px;
            background: rgba(59, 130, 246, 0.1); color: #60a5fa;
            padding: 10px 25px; border-radius: 50px; font-size: 16px; font-weight: 700;
            margin-bottom: 40px; border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .hero h1 {
            font-size: 90px; line-height: 1.05; font-weight: 900; letter-spacing: -3px;
            margin-bottom: 30px;
            background: linear-gradient(to right, #fff 20%, #94a3b8 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .hero p {
            font-size: 24px; color: var(--text-muted); line-height: 1.6;
            max-width: 800px; margin-bottom: 60px; font-weight: 500;
        }
        .cta-group { display: flex; gap: 25px; }

        /* --- GRID --- */
        .grid-section { max-width: 1400px; margin: 0 auto 160px; padding: 0 40px; }
        .section-header { text-align: center; margin-bottom: 80px; }
        .section-header h2 { font-size: 56px; font-weight: 800; margin-bottom: 20px; letter-spacing: -1px; }
        .section-header p { font-size: 22px; color: var(--text-muted); }

        .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
        .feature-card {
            background: var(--surface); border: 1px solid var(--border);
            padding: 50px; border-radius: 30px; transition: 0.3s;
            position: relative; overflow: hidden;
        }
        .feature-card:hover { border-color: var(--primary); transform: translateY(-10px); }
        .icon-box {
            width: 80px; height: 80px; background: rgba(59, 130, 246, 0.1);
            border-radius: 20px; display: flex; align-items: center; justify-content: center;
            color: var(--primary); font-size: 36px; margin-bottom: 30px;
        }
        .feature-card h3 { font-size: 28px; font-weight: 700; margin-bottom: 15px; }
        .feature-card p { color: var(--text-muted); line-height: 1.7; font-size: 18px; }

        /* --- PROMISE --- */
        .promise-box {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            border: 1px solid rgba(255,255,255,0.1); border-radius: 40px;
            padding: 100px; text-align: center; position: relative; overflow: hidden;
        }
        .shine {
            position: absolute; top: 0; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg, transparent, #3b82f6, transparent);
        }

        /* --- FOOTER --- */
        .footer {
            border-top: 1px solid var(--border); padding: 80px 40px;
            background: #020617; text-align: center;
        }
        .footer-nav { display: flex; justify-content: center; gap: 50px; margin-top: 40px; }
        .f-link { color: var(--text-muted); text-decoration: none; font-weight: 600; font-size: 18px; transition:0.2s; }
        .f-link:hover { color: white; }

        /* ========================================= */
        /* 📱 MOBILE OPTIMIZATIONS (Responsive Fixes) */
        /* ========================================= */
        @media (max-width: 768px) {
            .navbar { padding: 20px; }
            .brand { font-size: 24px; }
            .nav-links { display: none; }
            
            .hero { padding: 120px 20px 80px; }
            .hero h1 { font-size: 52px; margin-bottom: 20px; }
            .hero p { font-size: 18px; margin-bottom: 40px; }
            
            .cta-group { flex-direction: column; width: 100%; gap: 15px; }
            .btn { width: 100%; padding: 20px; font-size: 18px; }
            
            .section-header h2 { font-size: 36px; }
            .section-header p { font-size: 18px; }
            
            .features { grid-template-columns: 1fr; gap: 25px; }
            .feature-card { padding: 35px; }
            
            .promise-box { padding: 50px 25px; }
            .promise-box h2 { font-size: 32px; }
            
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
          <Link to="/register" className="btn btn-primary" style={{padding: '12px 30px', fontSize: '16px'}}>
            Create Restaurant
          </Link>
        </div>
        {isMobile && (
            <Link to="/login" className="btn btn-outline" style={{padding: '10px 20px', fontSize: '14px'}}>
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
            <div style={{display:'flex',justifyContent:'center',marginBottom:30}}>
                <FaHandshake size={80} color="#3b82f6" />
            </div>
            <h2 style={{color:'white', marginBottom:25, fontSize: '48px', fontWeight: '800'}}>100-Year Free Access</h2>
            <p style={{maxWidth:800, margin:'0 auto', color:'#94a3b8', fontSize:22, lineHeight:1.6}}>
                "We don't charge monthly fees for our partners. Kovixa is designed to support the 
                hardworking restaurant owners of India. Your success is our success."
            </p>
            <div style={{marginTop:50}}>
                <Link to="/register" className="btn btn-primary" style={{width: isMobile ? '100%' : 'auto', padding: '20px 50px', fontSize: '20px'}}>
                    Claim Your Account Now
                </Link>
            </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="footer">
        <div style={{marginBottom:30}}>
            <h3 style={{fontSize:32, fontWeight:800, color:'white'}}>KOVIXA</h3>
            <p style={{color:'#64748b', marginTop:15, fontSize: '18px'}}>Powering the next generation of dining.</p>
        </div>
        <div className="footer-nav">
            <Link to="/login" className="f-link">Owner Login</Link>
            <Link to="/register" className="f-link">Register</Link>
        </div>
        <div style={{marginTop: 50, color: '#334155', fontSize: 15, fontWeight: 600}}>
            &copy; 2026 Kovixa Systems. Secure & Encrypted.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;