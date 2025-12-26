import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  FaUtensils, FaQrcode, FaChartLine, FaArrowRight, 
  FaCheckCircle, FaPaperPlane, FaSpinner 
} from "react-icons/fa";

const LandingPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
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
    try {
      await fetch("https://smart-menu-backend-5ge7.onrender.com/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: "Partner Request", ...requestData }),
      });
      alert("Success! Srinivas's team will contact you shortly.");
      setShowModal(false);
      setRequestData({ ownerName: "", restaurantName: "", phone: "" });
    } catch (error) {
      alert("Request received. We will call you soon!"); 
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  // --- MAIN LANDING PAGE (NO AUTO-REDIRECT) ---
  return (
    <div className="landing-container">
      <style>{`
        :root { --primary: #f97316; --bg: #050505; --text: #ffffff; }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        body { background-color: var(--bg); color: var(--text); }
        
        .navbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 5%; background: rgba(5,5,5,0.9); backdrop-filter: blur(10px);
          position: sticky; top: 0; z-index: 100; border-bottom: 1px solid #111;
        }
        .brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .logo-img { width: 35px; height: 35px; border-radius: 8px; }
        .brand-name { font-size: 22px; font-weight: 900; color: white; letter-spacing: -1px; }

        .hero { text-align: center; padding: 100px 20px; max-width: 900px; margin: 0 auto; position: relative; }
        .centered-logo { width: 120px; height: 120px; margin-bottom: 30px; filter: drop-shadow(0 0 20px rgba(249,115,22,0.3)); }
        .hero h1 { font-size: 56px; font-weight: 900; line-height: 1; margin-bottom: 25px; }
        .hero p { color: #888; font-size: 18px; margin-bottom: 35px; max-width: 600px; margin-left: auto; margin-right: auto; }

        .btn-primary {
          background: var(--primary); color: black; padding: 16px 32px; border-radius: 12px; 
          font-weight: 900; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 10px;
          transition: 0.3s; border: none; text-transform: uppercase;
        }
        .btn-primary:hover { transform: scale(1.05); box-shadow: 0 10px 30px rgba(249, 115, 22, 0.4); }

        .features-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px; padding: 40px 5%; max-width: 1200px; margin: 0 auto;
        }
        .feature-card { background: #0a0a0a; padding: 40px; border-radius: 24px; border: 1px solid #111; transition: 0.3s; }
        .feature-card:hover { border-color: var(--primary); background: #0f0f0f; }
        .icon-box { font-size: 30px; color: var(--primary); margin-bottom: 20px; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-content { background: #111; padding: 40px; border-radius: 24px; width: 100%; max-width: 450px; border: 1px solid #222; text-align: center; }
        .modal-input { width: 100%; padding: 15px; margin-bottom: 15px; background: #000; border: 1px solid #333; color: white; border-radius: 12px; outline: none; }

        @media (max-width: 768px) { .hero h1 { font-size: 38px; } .nav-links { display: none; } }
      `}</style>

      <nav className="navbar">
        <Link to="/" className="brand">
          <img src="/logo192.png" className="logo-img" alt="BiteBox Logo" />
          <span className="brand-name">BiteBox</span>
        </Link>
        <div className="nav-links" style={{display:'flex', gap:'20px'}}>
          <Link to="/login" style={{color:'#888', textDecoration:'none', fontWeight:'bold', fontSize:'14px'}}>STAFF LOGIN</Link>
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{padding:'10px 20px', fontSize:'12px'}}>GET STARTED</button>
        </div>
      </nav>

      <section className="hero">
        <img src="/logo192.png" className="centered-logo" alt="BiteBox" />
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#111", padding: "8px 16px", borderRadius: "30px", marginBottom: "20px", fontSize: "12px", fontWeight: 'bold', color: "#22c55e" }}>
          <FaCheckCircle /> POWERING NEXT-GEN DINING
        </div>
        <h1>Your Restaurant. <br /><span style={{color: "var(--primary)"}}>Digitized in Minutes.</span></h1>
        <p>BiteBox provides high-speed QR ordering, live kitchen displays, and professional POS receipts. Start your 30-day trial today.</p>
        
        <div style={{display:'flex', justifyContent:'center', gap:'15px', flexWrap:'wrap'}}>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Request Access <FaArrowRight />
          </button>
          <Link to="/login" style={{background:'#111', border:'1px solid #222', color:'white', padding:'16px 32px', borderRadius:'12px', textDecoration:'none', fontWeight:'bold'}}>
            Partner Login
          </Link>
        </div>
      </section>

      <section className="features-grid">
        <div className="feature-card">
          <FaQrcode className="icon-box" />
          <h3>Contactless Ordering</h3>
          <p style={{color: "#666", marginTop: "10px"}}>Customers scan, order, and pay at the counter. No hardware required.</p>
        </div>
        <div className="feature-card">
          <FaUtensils className="icon-box" />
          <h3>KDS Arrangements</h3>
          <p style={{color: "#666", marginTop: "10px"}}>Real-time kitchen display system (KDS) ensures order accuracy and speed.</p>
        </div>
        <div className="feature-card">
          <FaChartLine className="icon-box" />
          <h3>Admin Control</h3>
          <p style={{color: "#666", marginTop: "10px"}}>Manage your menu, toggle stock availability, and track daily revenue instantly.</p>
        </div>
      </section>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: "10px" }}>Partner with BiteBox</h2>
            <p style={{ color: "#666", marginBottom: "25px", fontSize: "14px" }}>
              Our team will contact you to set up your restaurant and table QR codes.
            </p>
            <form onSubmit={handleSubmitRequest}>
              <input className="modal-input" type="text" name="ownerName" placeholder="Owner Name" required value={requestData.ownerName} onChange={handleInputChange} />
              <input className="modal-input" type="text" name="restaurantName" placeholder="Restaurant Name" required value={requestData.restaurantName} onChange={handleInputChange} />
              <input className="modal-input" type="tel" name="phone" placeholder="Phone Number" required value={requestData.phone} onChange={handleInputChange} />
              <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                {loading ? "Processing..." : "Submit Inquiry"} <FaPaperPlane />
              </button>
              <button type="button" onClick={() => setShowModal(false)} style={{background:'none', border:'none', color:'#444', marginTop:'20px', cursor:'pointer', fontWeight:'bold'}}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      <footer style={{ textAlign: "center", padding: "60px 20px", borderTop: "1px solid #111", color: "#333", fontSize:'12px', fontWeight:'bold' }}>
        <p>BITEBOX SMART MENU SYSTEM &copy; {new Date().getFullYear()}</p>
        <div style={{marginTop:'10px', color:'#222'}}>SECURED BY BKR TECHNOLOGIES</div>
      </footer>
    </div>
  );
};

export default LandingPage;