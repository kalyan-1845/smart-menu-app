import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaSearch, FaShoppingCart, FaUtensils, FaInfoCircle, FaPlus } from "react-icons/fa";
import axios from "axios";

const CATEGORIES = ["All", "Starters", "Main Course", "Fast Food", "Dessert", "Beverages"];

const Menu = ({ cart, addToCart, removeFromCart, setRestaurantId, setTableNum }) => {
  const { id, table } = useParams(); 
  const navigate = useNavigate();
  
  const [restaurantName, setRestaurantName] = useState("Loading...");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (table) setTableNum(table);

    const fetchMenuData = async () => {
      try {
        // STEP 1: Get the Restaurant Details (ID) from the Username
        // This fixes the issue where dishes wouldn't load for the username
        const resInfo = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${id}`);
        
        const realOwnerId = resInfo.data._id; // This is the ID the dishes are linked to
        setRestaurantName(resInfo.data.restaurantName);
        setRestaurantId(realOwnerId);

        // STEP 2: Fetch Dishes using the REAL ID
        const resDishes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/dishes?restaurantId=${realOwnerId}`);
        setDishes(resDishes.data);
        
        setLoading(false);
      } catch (e) {
        console.error("Menu Load Failed", e);
        setError("Restaurant not found or menu is empty.");
        setLoading(false);
      }
    };

    if (id) fetchMenuData();
  }, [id, table, setRestaurantId, setTableNum]);

  // --- FILTERING LOGIC ---
  const filteredItems = dishes.filter(item => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (loading) return <div style={styles.centerMsg}><div className="spinner"></div>Loading Menu...</div>;
  if (error) return <div style={styles.centerMsg}>{error}</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", paddingBottom: "120px", fontFamily: "'Inter', sans-serif" }}>
      
      {/* HEADER */}
      <div style={{ padding: "20px", background: "#111", position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid #222" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h1 style={{ fontSize: "22px", margin: 0, display: "flex", alignItems: "center", gap: "10px", textTransform: 'uppercase' }}>
            <FaUtensils color="#f97316" /> {restaurantName}
          </h1>
          {table && <div style={{ background: "#222", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", color: "#f97316", fontWeight: 'bold' }}>TABLE {table}</div>}
        </div>

        {/* SEARCH */}
        <div style={{ position: "relative", marginBottom: "15px" }}>
          <FaSearch style={{ position: "absolute", left: "15px", top: "12px", color: "#666" }} />
          <input 
            type="text" 
            placeholder="Search dishes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "12px", background: "#222", border: "none", color: "white", outline: "none" }}
          />
        </div>

        {/* CATEGORIES */}
        <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "5px", scrollbarWidth: "none" }}>
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 16px", borderRadius: "20px", border: "none", whiteSpace: "nowrap", cursor: "pointer", fontSize: '13px',
                background: activeCategory === cat ? "#f97316" : "#222",
                color: activeCategory === cat ? "black" : "#aaa",
                fontWeight: activeCategory === cat ? "900" : "normal"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* DISH GRID */}
      <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "15px" }}>
        {filteredItems.length === 0 ? (
           <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "#444" }}>
              <p>No dishes found in <strong>{activeCategory}</strong></p>
              <button onClick={() => setActiveCategory("All")} style={{ background: 'none', border: '1px solid #333', color: '#f97316', padding: '10px 20px', borderRadius: '10px', marginTop: '10px' }}>Show All</button>
           </div>
        ) : (
          filteredItems.map(item => (
            <div key={item._id} style={{ background: "#111", borderRadius: "16px", overflow: "hidden", border: "1px solid #222", display: "flex", flexDirection: "column" }}>
              <div style={{ height: "130px", overflow: "hidden", position: "relative" }}>
                {item.image ? (
                   <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                   <div style={{width:'100%', height:'100%', background:'#222', display:'flex', alignItems:'center', justifyContent:'center'}}><FaUtensils size={30} color="#333"/></div>
                )}
                {!item.isAvailable && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", fontWeight: "900", letterSpacing:'1px' }}>
                    SOLD OUT
                  </div>
                )}
              </div>

              <div style={{ padding: "12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: "15px", margin: "0 0 5px 0", lineHeight: "1.3" }}>{item.name}</h3>
                  <p style={{ fontSize: "11px", color: "#666", margin: "0 0 10px 0", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description || item.category}</p>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: "900", fontSize: "16px", color: '#fff' }}>₹{item.price}</div>
                  <button 
                    disabled={!item.isAvailable}
                    onClick={() => addToCart(item)} 
                    style={{ background: item.isAvailable ? "#f97316" : "#333", border: "none", color: item.isAvailable ? "#000" : "#555", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "900" }}
                  >
                    ADD
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FLOATING CART */}
      {totalItems > 0 && (
        <div style={styles.cartSticky}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "baseline" }}>
              <span style={{ fontSize: "16px", fontWeight: "900", color: "#000" }}>₹{totalPrice}</span>
              <span style={{ fontSize: "10px", fontWeight: "bold", color: "#333" }}>{totalItems} ITEMS</span>
            </div>
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
        POWERED BY BITEBOX
      </div>
    </div>
  );
};

const styles = {
  centerMsg: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#f97316", fontWeight: "bold", background: '#050505', flexDirection: 'column', gap: '15px' },
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