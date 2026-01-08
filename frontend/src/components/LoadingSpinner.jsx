import React from "react";

const LoadingSpinner = () => {
  // ✅ FIX: Styles moved inside the function to prevent ReferenceErrors on Netlify
  const styles = {
    overlay: {
      height: "100vh",
      width: "100%",
      background: "#050505",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 9999,
    },
    spinnerContainer: { textAlign: "center" },
    loader: {
      width: "50px",
      height: "50px",
      border: "4px solid #1a1a1a",
      borderTop: "4px solid #f97316",
      borderRadius: "50%",
      margin: "0 auto 20px auto",
      animation: "spin 1s linear infinite",
    },
    text: {
      color: "#f97316",
      fontSize: "20px",
      fontWeight: "900",
      letterSpacing: "4px",
      margin: 0,
      animation: "pulse 1.5s ease-in-out infinite",
    },
    subtext: {
      color: "#444",
      fontSize: "10px",
      fontWeight: "bold",
      marginTop: "5px",
      textTransform: "uppercase",
    },
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.spinnerContainer}>
        <div style={styles.loader}></div>
        <h2 style={styles.text}>KOVIXA</h2>
        <p style={styles.subtext}>Preparing your menu...</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); border-top-color: #f97316; }
          50% { border-top-color: #fb923c; }
          100% { transform: rotate(360deg); border-top-color: #f97316; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;