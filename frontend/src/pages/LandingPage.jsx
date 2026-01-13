import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FaUtensils, FaQrcode, FaArrowRight, FaChartLine, 
  FaShieldAlt, FaHandshake, FaBoxOpen, FaNetworkWired, FaCheck 
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
          --primary-dark: #2563eb;
          --accent: #10b981; /* Success Green for Trust */
          --bg: #020617;
          --surface: #0f172a;
          --text: #f8fafc;
          --text-muted: #94a3b8;
          --border: rgba(255,255,255,0.08);
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; outline: none; }
        body { background-color: var(--bg); color: var(--text); font-family: 'Plus Jakarta Sans', sans-serif; overflow-x: hidden; }

        /* PROFESSIONAL BACKGROUND */
        .landing-container {
            background-color: var(--bg);
            background-image: radial-gradient(circle at 50% 0%, #1e293b 0%, transparent 70%);
            min-height: 100vh;
        }

        /* ANIMATIONS */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }

        /* NAVBAR */
        .navbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 5%; position: sticky; top: 0; z-index: 100;
          backdrop-filter: blur(12px); border-bottom: 1px solid var(--border);
          background: rgba(2, 6, 23, 0.85);
        }
        .brand { 
            font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 10px; 
            color: #fff; text-decoration: none; letter-spacing: -0.5px;
        }
        .nav-links { display: flex; gap: 30px; align-items: center; }
        .nav-link { text-decoration: none; color: var(--text-muted); font-weight: 600; font-size: 14px; transition: 0.2s; }
        .nav-link:hover { color: white; }

        .btn {
            padding: 12px 28px; border-radius: 12px; font-weight: 700; font-size: 15px;
            text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
            transition: all 0.2s ease; cursor: pointer; border: none;
        }
        .btn-primary {
            background: var(--primary); color: white;
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
        }
        .btn-primary:hover { background: var(--primary-dark); transform: translateY(-2px); }
        .btn-outline {
            background: rgba(255,255,255,0.03); color: white; border: 1px solid var(--border);
        }
        .btn-outline:hover { background: rgba(255,255,255,0.08); border-color: var(--text-muted); }

        /* HERO */
        .hero {
            padding: 140px 20px 100px; text-align: center;
            max-width: 900px; margin: 0 auto;
        }
        .trust-badge {
            display: inline-flex; align-items: center; gap: 8px;
            background: rgba(16, 185, 129, 0.1); color: var(--accent);
            padding: 6px 16px; border-radius: 30px; font-size: 13px; font-weight: 700;
            margin-bottom: 30px; border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .hero h1 {
            font-size: 64px; line-height: 1.1; font-weight: 800; letter-spacing: -2px;
            margin-bottom: 25px;
        }
        .hero h1 span {
            background: linear-gradient(to right, #60a5fa, #a78bfa);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .hero p {
            font-size: 18px; color: var(--text-muted); line-height: 1.6;
            max-width: 650px; margin: 0 auto 40px;
        }

        /* FEATURES GRID */
        .grid-section {
            max-width: 1200px; margin: 0 auto 100px; padding: 0 20px;
        }
        .section-title { text-align: center; margin-bottom: 60px; }
        .section-title h2 { font-size: 36px; font-weight: 700; margin-bottom: 15px; }
        .section-title p { color: var(--text-muted); }

        .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; }
        .feature-card {
            background: var(--surface); border: 1px solid var(--border);
            padding: 35px; border-radius: 20px; transition: 0.3s;
        }
        .feature-card:hover { border-color: var(--primary); transform: translateY(-5px); }
        .icon-box {
            width: 50px; height: 50px; background: rgba(59, 130, 246, 0.1);
            border-radius: 12px; display: flex; align-items: center; justify-content: center;
            color: var(--primary); font-size: 22px; margin-bottom: 20px;
        }

        /* PROMISE SECTION */
        .promise-box {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            border: 1px solid var(--border); border-radius: 24px;
            padding: 60px; text-align: center; margin: 0 20px 100px;
            position: relative; overflow: hidden;
        }
        .promise-box::before {
            content: ""; position: absolute; top: 0; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg, transparent, var(--primary), transparent);
        }

        /* FOOTER */
        .footer {
            border-top: 1px solid var(--border); padding: 80px 20px;
            text-align: center; background: #020617;
        }
        .footer-links { display: flex; justify-content: center; gap: 40px; margin-top: 30px; }
        .footer-link { color: var(--text-muted); text-decoration: none; font-size: 14px; }
        .footer-link:hover { color: white; }

        @media (max-width: 768px) {
            .nav-links { display: none; }
            .hero h1 { font-size: 40px; }
            .features { grid-template-columns: 1fr; }
            .promise-box { padding: 40px 20px; }
            .footer-links { flex-direction: column; gap: 15px; }
        }
      `}</style>

      {/* --- NAVBAR --- */}
      <nav className="navbar">
        <Link to="/" className="brand">
          <FaUtensils className="text-blue-500" /> KOVIXA
        </Link>
        <div className="nav-links">
          <Link to="/login" className="nav-link">Owner Login</Link>
          <Link to="/super-login" className="nav-link">Admin</Link>
          <Link to="/register" className="btn btn-primary">Get Started Free</Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="hero">
        <div className="trust-badge animate-in">
           <FaShieldAlt /> 100% Secure & Reliable Platform
        </div>
        
        <h1 className="animate-in" style={{animationDelay: '0.1s'}}>
          Built for the <br/> <span>Hardworking Founder.</span>
        </h1>
        
        <p className="animate-in" style={{animationDelay: '0.2s'}}>
          Running a restaurant is hard work. We respect that. <br/>
          Kovixa gives you the tools to manage orders, inventory, and revenue 
          without the expensive fees. Focus on your food, we'll handle the tech.
        </p>
        
        <div className="animate-in" style={{animationDelay: '0.3s', display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap'}}>
          <Link to="/register" className="btn btn-primary">
            Start Your Journey <FaArrowRight />
          </Link>
          <Link to="/login" className="btn btn-outline">
            Access Dashboard
          </Link>
        </div>
      </section>

      {/* --- WHY FOUNDERS TRUST US --- */}
      <div className="grid-section">
        <div className="section-title">
            <h2>Everything You Need to Scale</h2>
            <p>Professional tools designed to make your daily operations smoother.</p>
        </div>

        <div className="features">
            <div className="feature-card">
                <div className="icon-box"><FaQrcode /></div>
                <h3>Smart QR Menu</h3>
                <p style={{color:'#94a3b8', marginTop:10, lineHeight:1.6}}>
                    Give your customers a seamless ordering experience. Update prices and items instantly without printing new menus.
                </p>
            </div>
            <div className="feature-card">
                <div className="icon-box"><FaChartLine /></div>
                <h3>Real Revenue Insights</h3>
                <p style={{color:'#94a3b8', marginTop:10, lineHeight:1.6}}>
                    Know exactly how much you made today. Track your best-selling items and grow your profits with data.
                </p>
            </div>
            <div className="feature-card">
                <div className="icon-box"><FaBoxOpen /></div>
                <h3>Inventory Control</h3>
                <p style={{color:'#94a3b8', marginTop:10, lineHeight:1.6}}>
                    Never run out of ingredients again. Track your stock levels and get alerts when supplies are low.
                </p>
            </div>
        </div>
      </div>

      {/* --- OUR PROMISE --- */}
      <div className="grid-section">
        <div className="promise-box">
            <div style={{display:'flex',justifyContent:'center',marginBottom:20}}>
                <FaHandshake size={50} color="#3b82f6" />
            </div>
            <h2 style={{fontSize:32, fontWeight:800, marginBottom:20}}>Our Promise to You</h2>
            <p style={{maxWidth:700, margin:'0 auto', color:'#94a3b8', fontSize:18, lineHeight:1.7}}>
                "We believe that technology should empower business owners, not drain their wallets. 
                That is why Kovixa offers a <b>100-Year Free Access</b> plan for early partners. 
                We succeed only when you succeed."
            </p>
            <div style={{marginTop:30}}>
                <Link to="/register" className="btn btn-primary">Claim Your Forever Account</Link>
            </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="footer">
        <div style={{marginBottom:20}}>
            <h3 style={{fontSize:20, fontWeight:800}}>KOVIXA</h3>
            <p style={{color:'#64748b', fontSize:14, marginTop:5}}>Empowering 100,000+ Restaurants across India.</p>
        </div>
        <div className="footer-links">
            <Link to="/login" className="footer-link">Owner Login</Link>
            <Link to="/register" className="footer-link">Register Restaurant</Link>
            <Link to="/super-login" className="footer-link">System Admin</Link>
            <span className="footer-link" style={{opacity:0.5}}>© 2026 Kovixa Systems</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;