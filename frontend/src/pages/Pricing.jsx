import React from "react";
import { FaCheckCircle, FaRocket, FaCrown, FaWhatsapp } from "react-icons/fa";

const Pricing = () => {
  const plans = [
    {
      title: "Trial",
      price: "FREE",
      duration: "60 Days",
      icon: <FaRocket color="#60a5fa" size={30} />,
      features: ["Digital Menu", "Table QR Codes", "Basic Kitchen View", "No Credit Card Needed"],
      button: "Get Started",
      link: "/register", // Simple redirect to signup
      pro: false
    },
    {
      title: "Pro",
      price: "₹999",
      duration: "Monthly",
      icon: <FaCrown color="#f97316" size={30} />,
      features: ["Everything in Trial", "Custom Branding", "Sales Analytics", "Priority Support", "Manual Activation"],
      button: "Contact for Pro",
      link: "https://wa.me/yournumber", // Manual activation via WhatsApp
      pro: true
    }
  ];

  return (
    <section id="pricing" style={{ padding: "100px 20px", background: "#050505", color: "white" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        <header style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "36px", fontWeight: "900" }}>SMART <span style={{ color: "#f97316" }}>PLANS</span></h2>
          <p style={{ color: "#888" }}>Manual activation. No automated billing.</p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
          {plans.map((plan, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.02)",
              border: plan.pro ? "2px solid #f97316" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: "28px",
              padding: "40px",
              display: "flex",
              flexDirection: "column"
            }}>
              <div style={{ marginBottom: "25px" }}>{plan.icon}</div>
              <h3 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "10px" }}>{plan.title}</h3>
              <div style={{ marginBottom: "30px" }}>
                <span style={{ fontSize: "40px", fontWeight: "900" }}>{plan.price}</span>
                <span style={{ color: "#666" }}> /{plan.duration}</span>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 40px 0", flexGrow: 1 }}>
                {plan.features.map((feat, idx) => (
                  <li key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", color: "#bbb", fontSize: "14px" }}>
                    <FaCheckCircle color={plan.pro ? "#f97316" : "#22c55e"} size={14} /> {feat}
                  </li>
                ))}
              </ul>

              <a href={plan.link} style={{ textDecoration: 'none' }}>
                <button style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "14px",
                  border: "none",
                  background: plan.pro ? "#f97316" : "white",
                  color: plan.pro ? "white" : "black",
                  fontWeight: "900",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px"
                }}>
                  {plan.pro && <FaWhatsapp />} {plan.button}
                </button>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;