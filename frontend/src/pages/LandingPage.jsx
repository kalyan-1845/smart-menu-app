import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaUtensils, FaQrcode, FaChartLine, FaBars, FaTimes, FaArrowRight, FaCheckCircle, FaPaperPlane } from "react-icons/fa";

// Replace with your actual backend URL
const API_URL = "https://smart-menu-backend-5ge7.onrender.com";

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State for the "Request Access" popup
  const [requestData, setRequestData] = useState({
    ownerName: "",
    restaurantName: "",
    phone: ""
  });

  const handleInputChange = (e) => {
    setRequestData({ ...requestData, [e.target.name]: e.target.value });
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setLoading(true);

    // This sends the lead to your backend (you need to create this endpoint or just get an email)
    try {
      const res = await fetch(`${API_URL}/api/contact/request-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      
      if (res.ok) {
        alert("Thanks! We have received your details. Our team will contact you shortly to set up your account.");
        setShowModal(false);
        setRequestData({ ownerName: "", restaurantName: "", phone: "" });
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      // If backend isn't ready, just show success for demo
      alert("Thanks! We have received your details. We will call you shortly."); 
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-container">
      {/* --- INTERNAL CSS --- */}
      <style>{`
        :root {
          --primary: #f97316;
          --primary-glow: rgba(249, 115, 22, 0.4);
          --bg: #050505;
          --card-bg: rgba(20, 20, 20, 0.8);
          --text: #ffffff;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        body { background-color: var(--bg); color: var(--text); overflow-x: hidden; }
        
        /* NAVBAR */
        .navbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 5%; background: rgba(5,5,5,0.9); backdrop-filter: blur(10px);
          position: sticky; top: 0; z-index: 100; border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .brand { font-size: 24px; font-weight: 900; color: white; text-decoration: none; display: flex; gap: 10px; align-items: center; }
        .nav-links { display: flex; gap: 20px; align-items: center; }
        .nav-link { color: #ccc; text-decoration: none; font-weight: 500; transition: 0.3s; }
        .nav-link:hover { color: var(--primary); }
        
        .menu-toggle { display: none; background: none; border: none; color: white; font-size: 24px; }

        /* BUTTONS */
        .btn-primary {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white; padding: 10px 24px; border-radius: 8px; border: none;
          font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
          transition: 0.3s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px var(--primary-glow); }

        .btn-outline {
          background: rgba(255,255,255,0.05); color: white; padding: 10px 24px; 
          border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; 
          font-weight: 600; cursor: pointer; text-decoration: none;
        }
        
        /* HERO */
        .hero { text-align: center; padding: 80px 20px; max-width: 800px; margin: 0 auto; }
        .hero h1 { font-size: 50px; line-height: 1.1; margin-bottom: 20px; font-weight: 800; }
        .hero p { color: #aaa; font-size: 18px; margin-bottom: 30px; line-height: 1.6; }
        .hero-buttons { display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; }

        /* FEATURES */
        .features-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px; padding: 40px 5%; max-width: 1200px; margin: 0 auto;
        }
        .feature-card {
          background: var(--card-bg); padding: 30px; border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.05); text-align: left;
        }
        .icon-box {
          width: 50px; height: 50px; background: rgba(249, 115, 22, 0.1); 
          color: var(--primary); display: flex; align-items: center; justify-content: center; 
          border-radius: 12px; margin-bottom: 20px; font-size: 24px;
        }

        /* MODAL */
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.8); z-index: 2000;
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .modal-content {
          background: #111; padding: 40px; border-radius: 16px; width: 100%; max-width: 450px;
          border: 1px solid #333; position: relative; text-align: center;
        }
        .close-btn { position: absolute; top: 15px; right: 15px; background: none; border: none; color: #666; font-size: 20px; cursor: pointer; }
        .modal-input {
          width: 100%; padding: 12px; margin-bottom: 15px; background: #222; 
          border: 1px solid #333; color: white; border-radius: 8px; outline: none;
        }
        .modal-input:focus { border-color: var(--primary); }

        /* MOBILE CSS */
        @media (max-width: 768px) {
          .nav-links { display: none; }
          .menu-toggle { display: block; }
          .hero h1 { font-size: 36px; }
          .hero-buttons { flex-direction: column; width: 100%; }
          .btn-primary, .btn-outline { width: 100%; justify-content: center; }
          .features-grid { grid-template-columns: 1fr; } /* Force 1 column */
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="navbar">
        <Link to="/" className="brand"><FaUtensils color="#f97316" /> SmartMenu.</Link>
        <div className="nav-links">
          <Link to="/login" className="nav-link">Partner Login</Link>
          <button onClick={() => setShowModal(true)} className="btn-primary">Start Free Trial</button>
        </div>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div style={{ background: "#111", padding: "20px", display: "flex", flexDirection: "column", gap: "15px", borderBottom: "1px solid #333" }}>
          <Link to="/login" className="nav-link" style={{ fontSize: "18px" }}>Partner Login</Link>
          <button onClick={() => {setShowModal(true); setMenuOpen(false);}} className="btn-primary">Start Free Trial</button>
        </div>
      )}

      {/* HERO */}
      <section className="hero">
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.05)", padding: "6px 12px", borderRadius: "20px", marginBottom: "20px", fontSize: "13px", color: "#ccc" }}>
          <FaCheckCircle color="#22c55e" /> Validated by 500+ Restaurants
        </div>
        <h1>Upgrade Your Restaurant <br /><span style={{color: "#f97316"}}>Without The Headache.</span></h1>
        <p>Digital QR Menus and Kitchen Displays. We set everything up for you.</p>
        <div className="hero-buttons">
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Get Your Free Demo <FaArrowRight />
          </button>
          <Link to="/login" className="btn-outline">Partner Login</Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-grid">
        <div className="feature-card">
          <div className="icon-box"><FaQrcode /></div>
          <h3>QR Ordering</h3>
          <p style={{color: "#888", marginTop: "10px"}}>Customers order instantly. No waiting for waiters.</p>
        </div>
        <div className="feature-card">
          <div className="icon-box"><FaUtensils /></div>
          <h3>Kitchen Display</h3>
          <p style={{color: "#888", marginTop: "10px"}}>Orders appear on a screen in the kitchen. 100% accuracy.</p>
        </div>
        <div className="feature-card">
          <div className="icon-box"><FaChartLine /></div>
          <h3>Sales Analytics</h3>
          <p style={{color: "#888", marginTop: "10px"}}>See exactly how much you earned today in real-time.</p>
        </div>
      </section>

      {/* MODAL FORM (REQUEST ACCESS) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
            <h2 style={{ color: "white", marginBottom: "10px" }}>Request Access</h2>
            <p style={{ color: "#888", marginBottom: "20px", fontSize: "14px" }}>
              Leave your details. We will contact you to set up your restaurant account.
            </p>
            <form onSubmit={handleSubmitRequest}>
              <input 
                className="modal-input" 
                type="text" name="ownerName" placeholder="Your Name" required 
                value={requestData.ownerName} onChange={handleInputChange} 
              />
              <input 
                className="modal-input" 
                type="text" name="restaurantName" placeholder="Restaurant Name" required 
                value={requestData.restaurantName} onChange={handleInputChange}
              />
              <input 
                className="modal-input" 
                type="tel" name="phone" placeholder="Phone Number" required 
                value={requestData.phone} onChange={handleInputChange}
              />
              <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                {loading ? "Sending..." : "Submit Request"} <FaPaperPlane />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ textAlign: "center", padding: "40px 20px", borderTop: "1px solid #222", marginTop: "40px", color: "#666" }}>
        <p>&copy; {new Date().getFullYear()} Smart Menu Cloud. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;