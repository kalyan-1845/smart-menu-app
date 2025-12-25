import React from "react";
import { FaCheckCircle, FaRocket, FaCrown, FaWhatsapp } from "react-icons/fa";

const Pricing = () => {
  const plans = [
    {
      title: "Trial",
      price: "FREE",
      duration: "60 Days",
      icon: <FaRocket color="#60a5fa" size={30} />,
      features: ["Digital Menu", "Table QR Codes", "Basic Kitchen View"],
      button: "Start Free",
      link: "/", 
      pro: false
    },
    {
      title: "Pro",
      price: "₹999",
      duration: "Manual Pay",
      icon: <FaCrown color="#f97316" size={30} />,
      features: ["Custom Branding", "Sales Analytics", "Manual Activation"],
      button: "Contact for Pro",
      link: "https://wa.me/your_number", 
      pro: true
    }
  ];

  return (
    <section style={{ padding: "80px 20px", background: "#050505", color: "white", minHeight: '100vh' }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: "32px", fontWeight: "900" }}>SMART PLANS</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px", marginTop: "40px" }}>
          {plans.map((plan, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.03)",
              border: plan.pro ? "2px solid #f97316" : "1px solid #222",
              borderRadius: "24px",
              padding: "40px",
              display: "flex",
              flexDirection: "column"
            }}>
              <div style={{ marginBottom: "20px" }}>{plan.icon}</div>
              <h3>{plan.title}</h3>
              <div style={{ margin: "15px 0" }}><span style={{ fontSize: "40px", fontWeight: "900" }}>{plan.price}</span></div>
              <ul style={{ listStyle: "none", padding: 0, margin: "25px 0", flexGrow: 1 }}>
                {plan.features.map((f, idx) => (
                  <li key={idx} style={{ marginBottom: "10px", fontSize: "14px", color: "#aaa" }}>
                    <FaCheckCircle color={plan.pro ? "#f97316" : "#22c55e"} /> {f}
                  </li>
                ))}
              </ul>
              <a href={plan.link} target="_blank" rel="noreferrer">
                <button style={{
                  width: "100%", padding: "16px", borderRadius: "14px", border: "none",
                  background: plan.pro ? "#f97316" : "white", color: plan.pro ? "white" : "black",
                  fontWeight: "900", cursor: "pointer"
                }}>
                  {plan.button}
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