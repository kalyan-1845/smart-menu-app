import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaSearch, FaShoppingCart, FaStar, FaPlus, FaMinus, 
  FaUtensils, FaInfoCircle, FaFire 
} from "react-icons/fa";
import axios from "axios";

// --- CONSTANTS ---
const CATEGORIES = ["All", "Starters", "Main Course", "Fast Food", "Dessert", "Beverages"];
const FALLBACK_IMG = "https://cdn-icons-png.flaticon.com/512/706/706164.png";
const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";

// --- SKELETON LOADER COMPONENT (For perceived speed) ---
const SkeletonCard = () => (
  <div style={{...styles.card, height: '240px', animation: 'pulse 1.5s infinite'}}>
    <div style={{height: '140px', background: '#222'}}></div>
    <div style={{padding: '10px'}}>
      <div style={{height: '20px', width: '70%', background: '#333', marginBottom: '10px', borderRadius: '4px'}}></div>
      <div style={{height: '15px', width: '40%', background: '#333', borderRadius: '4px'}}></div>
    </div>
  </div>
);

// --- MAIN MENU COMPONENT ---
const Menu = ({ cart, addToCart, removeFromCart, setRestaurantId, setTableNum }) => {
  const { id, table } = useParams();
  const navigate = useNavigate();
  
  const [restaurantName, setRestaurantName] = useState("Loading...");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. INITIAL SETUP
  useEffect(() => {
    if (id) setRestaurantId(id);
    if (table) setTableNum(table);
    // eslint-disable-next-line
  }, [id, table]);

  // 2. DATA FETCHING
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // Fetch dishes using the restaurant ID (username from URL)
        const res = await axios.get(`${API_BASE}/dishes?restaurantId=${id}`);
        setDishes(res.data);
        setRestaurantName(id.toUpperCase());
      } catch (e) {
        console.error("Menu Load Failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [id]);

  // 3. OPTIMIZED FILTERING (Speed Boost)
  const filteredItems = useMemo(() => {
    return dishes.filter(item => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [dishes, activeCategory, searchTerm]);

  // 4. CART HELPERS
  const getItemQty = (itemId) => {
    const item = cart.find(c => c._id === itemId);
    return item ? item.quantity : 0;
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // --- RENDER ---
  return (
    <div style={styles.container}>
      {/* Inject Keyframes for Skeleton & Scrollbar hiding */}
      <style>
        {`
          .hide-scroll::-webkit-scrollbar { display: none; }
          .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
          @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        `}
      </style>

      {/* --- HEADER (Sticky) --- */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <h1 style={styles.restaurantTitle}>
            <FaUtensils color="#f97316" size={18} /> {restaurantName}
          </h1>
          <div style={styles.tableBadge}>
            {table ? `Table ${table}` : "Pickup"}
          </div>
        </div>

        {/* Search */}
        <div style={styles.searchWrapper}>
          <FaSearch style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search dishes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Categories */}
        <div className="hide-scroll" style={styles.categoryScroll}>
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              style={activeCategory === cat ? styles.catBtnActive : styles.catBtn}
            >
              {cat === "Fast Food" && <FaFire style={{marginRight: '5px'}} />}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* --- MENU GRID --- */}
      <div style={styles.grid}>
        {loading ? (
          // Show 4 Skeletons while loading
          [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
        ) : filteredItems.length > 0 ? (
          filteredItems.map(item => {
            const qty = getItemQty(item._id);
            return (
              <div key={item._id} style={styles.card}>
                {/* Image Section */}
                <div style={styles.imageWrapper}>
                  <img 
                    src={item.image || FALLBACK_IMG} 
                    alt={item.name} 
                    style={styles.dishImage}
                    loading="lazy" 
                  />
                  {!item.isAvailable && (
                    <div style={styles.soldOutOverlay}>SOLD OUT</div>
                  )}
                </div>

                {/* Info Section */}
                <div style={styles.cardContent}>
                  <div>
                    <div style={styles.dishHeader}>
                      <h3 style={styles.dishName}>{item.name}</h3>
                      {item.isVeg ? <span style={styles.vegDot}>●</span> : null}
                    </div>
                  </div>
                  
                  <div style={styles.cardFooter}>
                    <div style={styles.price}>₹{item.price}</div>
                    
                    {/* Add/Remove Logic */}
                    {item.isAvailable ? (
                        qty > 0 ? (
                            <div style={styles.qtyControl}>
                                <button onClick={() => removeFromCart(item)} style={styles.qtyBtn}><FaMinus size={10}/></button>
                                <span style={styles.qtyText}>{qty}</span>
                                <button onClick={() => addToCart(item)} style={styles.qtyBtn}><FaPlus size={10}/></button>
                            </div>
                        ) : (
                            <button onClick={() => addToCart(item)} style={styles.addBtn}>
                                ADD
                            </button>
                        )
                    ) : (
                        <button disabled style={styles.disabledBtn}>N/A</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
            <div style={styles.emptyState}>No dishes found.</div>
        )}
      </div>

      {/* --- FLOATING CART (Bottom Sticky) --- */}
      {totalItems > 0 && (
        <div style={styles.cartSticky}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "baseline" }}>
              <span style={{ fontSize: "16px", fontWeight: "900", color: "#fff" }}>₹{totalPrice}</span>
              <span style={{ fontSize: "10px", fontWeight: "bold", color: "#ddd" }}>{totalItems} ITEMS</span>
            </div>
            <div style={{ fontSize: "9px", color: "#eee", display: "flex", alignItems: "center", gap: "4px", fontWeight: "bold", marginTop: "2px" }}>
              <FaInfoCircle /> Pay at counter
            </div>
          </div>
          <button onClick={() => navigate("/cart")} style={styles.viewCartBtn}>
            View Cart <FaShoppingCart />
          </button>
        </div>
      )}

      <div style={styles.branding}>
        POWERED BY BITEBOX
      </div>

    </div>
  );
};

// --- STYLES (Mobile Optimized) ---
const styles = {
  container: { minHeight: "100vh", background: "#050505", color: "white", paddingBottom: "100px", fontFamily: "'Inter', sans-serif" },
  
  // Header
  header: { padding: "15px", background: "rgba(17, 17, 17, 0.95)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid #222" },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" },
  restaurantTitle: { fontSize: "18px", margin: 0, display: "flex", alignItems: "center", gap: "8px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "-0.5px" },
  tableBadge: { background: "#222", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", color: "#f97316", border: "1px solid #333" },
  
  // Search
  searchWrapper: { position: "relative", marginBottom: "15px" },
  searchIcon: { position: "absolute", left: "15px", top: "12px", color: "#666" },
  searchInput: { width: "100%", padding: "12px 12px 12px 40px", borderRadius: "12px", background: "#222", border: "1px solid #333", color: "white", outline: "none", fontSize: "14px" },

  // Categories
  categoryScroll: { display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "5px" },
  catBtn: { padding: "8px 16px", borderRadius: "20px", border: "1px solid #333", whiteSpace: "nowrap", cursor: "pointer", background: "#1a1a1a", color: "#aaa", fontSize: "12px", fontWeight: "600", display: 'flex', alignItems: 'center' },
  catBtnActive: { padding: "8px 16px", borderRadius: "20px", border: "1px solid #f97316", whiteSpace: "nowrap", cursor: "pointer", background: "#f97316", color: "white", fontSize: "12px", fontWeight: "bold", display: 'flex', alignItems: 'center' },

  // Grid & Cards
  grid: { 
    padding: "15px", 
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", // 2 Columns on Mobile
    gap: "15px" 
  },
  card: { background: "#111", borderRadius: "16px", overflow: "hidden", border: "1px solid #222", display: "flex", flexDirection: "column", height: "100%" },
  imageWrapper: { height: "140px", width: "100%", position: "relative", background: "#222" },
  dishImage: { width: "100%", height: "100%", objectFit: "cover" },
  soldOutOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", fontWeight: "900", fontSize: "14px", backdropFilter: "blur(2px)" },
  
  // Card Content
  cardContent: { padding: "12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" },
  dishHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "5px" },
  dishName: { fontSize: "14px", margin: 0, lineHeight: "1.3", fontWeight: "700", color: "#eee" },
  vegDot: { color: "#22c55e", fontSize: "10px", marginTop: "2px" },
  rating: { fontSize: "10px", color: "#888", display: "flex", alignItems: "center", gap: "3px", marginTop: "4px" },
  
  // Card Footer & Buttons
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" },
  price: { fontWeight: "900", fontSize: "15px", color: "#fff" },
  
  addBtn: { background: "#f97316", border: "none", color: "#fff", padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "11px", fontWeight: "900", boxShadow: "0 4px 10px rgba(249, 115, 22, 0.3)" },
  disabledBtn: { background: "#333", border: "none", color: "#666", padding: "6px 15px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold" },
  
  // Qty Control (+/-)
  qtyControl: { display: "flex", alignItems: "center", gap: "8px", background: "#222", padding: "4px", borderRadius: "8px", border: "1px solid #333" },
  qtyBtn: { width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", background: "#333", border: "none", color: "white", borderRadius: "6px", cursor: "pointer" },
  qtyText: { fontSize: "12px", fontWeight: "bold", minWidth: "15px", textAlign: "center" },

  // Floating Cart
  cartSticky: { 
    position: "fixed", bottom: "20px", left: "5%", width: "90%", 
    background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", 
    padding: "15px 20px", borderRadius: "16px", 
    display: "flex", justifyContent: "space-between", alignItems: "center", 
    boxShadow: "0 10px 30px rgba(249, 115, 22, 0.4)", zIndex: 200,
    border: "1px solid rgba(255,255,255,0.1)"
  },
  viewCartBtn: { 
    background: "#fff", color: "#ea580c", border: "none", 
    padding: "10px 18px", borderRadius: "10px", fontWeight: "900", 
    fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" 
  },

  emptyState: { gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#444", fontSize: "14px", fontWeight: "bold" },
  branding: { textAlign: "center", padding: "20px", opacity: 0.3, fontSize: "10px", letterSpacing: "1px", color: "#666" }
};

export default Menu;