import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaSearch, FaShoppingCart, FaStar, FaPlus, FaMinus, FaUtensils, FaInfoCircle } from "react-icons/fa";
import axios from "axios";

const CATEGORIES = ["All", "Starters", "Main Course", "Fast Food", "Dessert", "Beverages"];

const Menu = ({ cart, addToCart, removeFromCart, setRestaurantId, setTableNum }) => {
  const { id, table } = useParams(); // Get restaurant name and table from URL
  const navigate = useNavigate();
  
  const [restaurantName, setRestaurantName] = useState("Loading...");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    // Sync URL params to global state
    if (id) setRestaurantId(id);
    if (table) setTableNum(table);

    const fetchMenu = async () => {
      try {
        const res = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/dishes?restaurantId=${id}`);
        setDishes(res.data);
        // Set dynamic restaurant name from ID
        setRestaurantName(id.toUpperCase());
        setLoading(false);
      } catch (e) {
        console.error("Menu Load Failed");
        setLoading(false);
      }
    };
    fetchMenu();
  }, [id, table, setRestaurantId, setTableNum]);

  // --- 2. LOGIC ---
  const filteredItems = dishes.filter(item => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (loading) return <div style={styles.loader}>Loading {id} Menu...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", paddingBottom: "120px", fontFamily: "'Inter', sans-serif" }}>
      
      {/* --- HEADER --- */}
      <div style={{ padding: "20px", background: "#111", position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid #222" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h1 style={{ fontSize: "22px", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <FaUtensils color="#f97316" /> {restaurantName}
          </h1>
          <div style={{ background: "#222", padding: "8px 15px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", color: "#f97316" }}>
            {table ? `Table #${table}` : "BiteBox Menu"}
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: "relative", marginBottom: "15px" }}>
          <FaSearch style={{ position: "absolute", left: "15px", top: "12px", color: "#666" }} />
          <input 
            type="text" 
            placeholder="Search for dishes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "12px", background: "#222", border: "none", color: "white", outline: "none" }}
          />
        </div>

        {/* Categories (Horizontal Scroll) */}
        <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "5px", scrollbarWidth: "none" }}>
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 16px", borderRadius: "20px", border: "none", whiteSpace: "nowrap", cursor: "pointer",
                background: activeCategory === cat ? "#f97316" : "#222",
                color: activeCategory === cat ? "white" : "#aaa",
                fontWeight: activeCategory === cat ? "bold" : "normal"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* --- MENU GRID --- */}
      <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "20px" }}>
        {filteredItems.map(item => (
          <div key={item._id} style={{ background: "#111", borderRadius: "16px", overflow: "hidden", border: "1px solid #222", display: "flex", flexDirection: "column" }}>
            <div style={{ height: "140px", overflow: "hidden", position: "relative" }}>
              <img src={item.image || "https://via.placeholder.com/150"} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {!item.isAvailable && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", color: "red", fontWeight: "bold" }}>
                  SOLD OUT
                </div>
              )}
            </div>

            <div style={{ padding: "12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: "16px", margin: "0 0 5px 0", lineHeight: "1.3" }}>{item.name}</h3>
                <p style={{ fontSize: "11px", color: "#666", margin: "0 0 10px 0" }}>{item.description}</p>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: "bold", fontSize: "16px" }}>₹{item.price}</div>
                <button 
                  disabled={!item.isAvailable}
                  onClick={() => addToCart(item)} 
                  style={{ background: "#f97316", border: "none", color: "#000", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "900", opacity: item.isAvailable ? 1 : 0.5 }}
                >
                  ADD
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- FLOATING CART: BiteBox Dine-In Style --- */}
      {totalItems > 0 && (
        <div style={styles.cartSticky}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "baseline" }}>
              <span style={{ fontSize: "16px", fontWeight: "900", color: "#000" }}>₹{totalPrice}</span>
              <span style={{ fontSize: "10px", fontWeight: "bold", color: "#333" }}>{totalItems} ITEMS</span>
            </div>
            {/* MVP Rule: Payment Info */}
            <div style={{ fontSize: "9px", color: "#222", display: "flex", alignItems: "center", gap: "4px", fontWeight: "bold", marginTop: "2px" }}>
              <FaInfoCircle /> Pay at counter after eating
            </div>
          </div>
          <button onClick={() => navigate("/cart")} style={styles.viewCartBtn}>
            View Cart <FaShoppingCart />
          </button>
        </div>
      )}

      <div style={{ textAlign: "center", padding: "20px", opacity: 0.3, fontSize: "10px", letterSpacing: "1px" }}>
        POWERED BY BITEBOX SMART MENU
      </div>

    </div>
  );
};

const styles = {
  loader: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#f97316", fontWeight: "bold" },
  cartSticky: { 
    position: "fixed", bottom: "20px", left: "5%", width: "90%", 
    background: "#f97316", padding: "15px", borderRadius: "16px", 
    display: "flex", justifyContent: "space-between", alignItems: "center", 
    boxShadow: "0 10px 40px rgba(0,0,0,0.5)", zIndex: 200 
  },
  viewCartBtn: { 
    background: "#000", color: "#fff", border: "none", 
    padding: "10px 18px", borderRadius: "10px", fontWeight: "900", 
    fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" 
  }
};

export default Menu;