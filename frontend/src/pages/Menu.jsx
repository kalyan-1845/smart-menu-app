import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { FaSearch, FaPlus, FaMinus, FaShoppingBag, FaStar, FaUtensils, FaArrowRight } from "react-icons/fa";

// 🔗 SMART API CONNECTION
const API_BASE = window.location.hostname === "localhost" || window.location.hostname.startsWith("192.168")
    ? "http://localhost:5000/api" 
    : "https://smart-menu-backend-5ge7.onrender.com/api";

const Menu = ({ cart, addToCart, setRestaurantId, setTableNum }) => {
    const params = useParams();
    const currentRestId = params.restaurantId || params.id;
    const currentTable = params.table;

    // Local State
    const [dishes, setDishes] = useState([]);
    const [filteredDishes, setFilteredDishes] = useState([]);
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    // 🛑 PREVENT LOOP: Ref to track if we already synced
    const hasSyncedRef = useRef(false);

    const DEFAULT_IMG = "https://placehold.co/400x300/222/orange?text=Yummy";

    // 1. ✅ SAFE SYNC (Prevents Infinite Loop)
    useEffect(() => {
        if (!currentRestId) return;
        
        // Only update Parent if we haven't already, or if it changed
        if (setRestaurantId) setRestaurantId(currentRestId);
        if (setTableNum && currentTable) setTableNum(currentTable);
        
    }, [currentRestId, currentTable]); // Removed setters from dependency array to stop re-renders

    // 2. ✅ FETCH MENU (Runs once when ID changes)
    useEffect(() => {
        if (!currentRestId) return;

        const controller = new AbortController(); // Cancel previous requests if ID changes fast

        const fetchMenu = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${API_BASE}/dishes?restaurantId=${currentRestId}`, {
                    signal: controller.signal
                });
                setDishes(res.data);
                setFilteredDishes(res.data);
                setLoading(false);
            } catch (err) {
                if (axios.isCancel(err)) return;
                console.error("Fetch Error:", err);
                if (err.response && err.response.status === 429) {
                    alert("Too many requests! Please wait a moment.");
                } else {
                    setError(true);
                }
                setLoading(false);
            }
        };

        fetchMenu();

        return () => controller.abort(); // Cleanup on unmount
    }, [currentRestId]);

    // 3. Search & Filter
    useEffect(() => {
        let result = dishes;
        if (activeCategory !== "All") {
            result = result.filter(d => d.category === activeCategory);
        }
        if (searchTerm) {
            result = result.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        setFilteredDishes(result);
    }, [searchTerm, activeCategory, dishes]);

    // Cart Maths
    const cartItems = Object.values(cart);
    const totalQty = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const categories = ["All", ...new Set(dishes.map(d => d.category))];

    const getQty = (id) => {
        const item = cart.find(i => i._id === id);
        return item ? item.quantity : 0;
    };

    if (loading) return <div style={styles.center}><div className="spinner"></div><style>{styles.spinnerCss}</style></div>;
    
    if (error) return (
        <div style={styles.center}>
            <div style={{textAlign:'center'}}>
                <FaUtensils size={40} color="#ef4444"/>
                <h2 style={{marginTop: 20}}>Menu Unavailable</h2>
                <p style={{color:'#888'}}>Could not load dishes.</p>
                <button onClick={() => window.location.reload()} style={styles.retryBtn}>Retry</button>
            </div>
        </div>
    );

    return (
        <div style={styles.container}>
            {/* HERO HEADER */}
            <div style={styles.hero}>
                <div style={styles.heroContent}>
                    <div>
                        <h1 style={styles.restName}>{currentRestId?.toUpperCase()}</h1>
                        <p style={styles.restSub}>Premium Food & Drinks</p>
                    </div>
                    <div style={styles.ratingBadge}><FaStar color="#fbbf24"/> 4.8</div>
                </div>
                
                {/* SEARCH BAR */}
                <div style={styles.searchContainer}>
                    <FaSearch style={styles.searchIcon} />
                    <input 
                        style={styles.searchInput} 
                        placeholder="Search for dishes..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* STICKY CATEGORY NAV */}
            <div style={styles.stickyNav}>
                <div style={styles.catScroll}>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            style={{
                                ...styles.catBtn,
                                background: activeCategory === cat ? '#f97316' : '#27272a',
                                color: activeCategory === cat ? 'white' : '#a1a1aa',
                                border: activeCategory === cat ? 'none' : '1px solid #3f3f46'
                            }}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* MENU GRID */}
            <div style={styles.grid}>
                {filteredDishes.length === 0 ? (
                    <div style={styles.empty}>
                        <p>No dishes found.</p>
                    </div>
                ) : (
                    filteredDishes.map(dish => {
                        const qty = getQty(dish._id);
                        return (
                            <div key={dish._id} style={styles.card}>
                                <div style={styles.imgWrapper}>
                                    <img 
                                        src={dish.image || DEFAULT_IMG} 
                                        alt={dish.name} 
                                        style={styles.img} 
                                        loading="lazy"
                                        onError={(e) => { e.target.src = DEFAULT_IMG; }}
                                    />
                                    {dish.isAvailable === false && <div style={styles.soldOut}>SOLD OUT</div>}
                                </div>
                                
                                <div style={styles.info}>
                                    <div style={styles.row}>
                                        <h3 style={styles.dishTitle}>{dish.name}</h3>
                                        <span style={styles.price}>₹{dish.price}</span>
                                    </div>
                                    <p style={styles.desc}>{dish.description || "Freshly prepared."}</p>
                                    
                                    {dish.isAvailable !== false ? (
                                        qty > 0 ? (
                                            <div style={styles.counter}>
                                                <button onClick={() => addToCart({...dish, quantity: -1})} style={styles.countBtn}><FaMinus size={10}/></button>
                                                <span style={styles.qtyNum}>{qty}</span>
                                                <button onClick={() => addToCart(dish)} style={styles.countBtn}><FaPlus size={10}/></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => addToCart(dish)} style={styles.addBtn}>ADD</button>
                                        )
                                    ) : (
                                        <button disabled style={styles.disabledBtn}>Unavailable</button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* FLOATING CART */}
            {totalQty > 0 && (
                <div style={styles.floatBarContainer}>
                    <Link to="/cart" style={styles.floatBar}>
                        <div style={styles.floatInfo}>
                            <span style={styles.floatQty}>{totalQty} ITEMS</span>
                            <span style={styles.floatPrice}>₹{totalPrice}</span>
                        </div>
                        <div style={styles.viewCart}>
                            View Cart <FaArrowRight style={{marginLeft:8}}/>
                        </div>
                    </Link>
                </div>
            )}
        </div>
    );
};

// 🎨 DARK THEME STYLES
const styles = {
    container: { minHeight: "100vh", background: "#09090b", color: "white", paddingBottom: "100px", fontFamily: "'Inter', sans-serif" },
    center: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#09090b", color: "white" },
    spinnerCss: `.spinner { width:40px; height:40px; border:4px solid #333; border-top:4px solid #f97316; border-radius:50%; animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`,
    retryBtn: { marginTop: 20, padding: "10px 20px", background: "#f97316", border: "none", color: "white", borderRadius: 8, cursor: "pointer" },

    hero: { padding: "20px 20px 10px", background: "linear-gradient(180deg, #18181b 0%, #09090b 100%)", borderBottom: '1px solid #27272a' },
    heroContent: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
    restName: { fontSize: "24px", fontWeight: "900", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "1px", color: "#fff" },
    restSub: { fontSize: "12px", color: "#a1a1aa", margin: 0 },
    ratingBadge: { background: "rgba(255,255,255,0.1)", padding: "6px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px", border: "1px solid #333" },

    searchContainer: { position: "relative", marginBottom: "10px" },
    searchIcon: { position: "absolute", left: "15px", top: "14px", color: "#71717a" },
    searchInput: { width: "100%", padding: "12px 12px 12px 45px", borderRadius: "12px", background: "#27272a", border: "none", color: "white", outline: "none", boxSizing: "border-box", fontSize: "14px" },

    stickyNav: { position: "sticky", top: 0, background: "rgba(9, 9, 11, 0.95)", backdropFilter: "blur(12px)", padding: "15px 0", zIndex: 10, borderBottom: "1px solid #27272a" },
    catScroll: { display: "flex", gap: "10px", padding: "0 20px", overflowX: "auto", scrollbarWidth: "none" },
    catBtn: { padding: "8px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", transition: "0.2s" },

    grid: { padding: "20px", display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" },
    empty: { textAlign: "center", color: "#555", marginTop: "40px", width: "100%" },
    
    card: { background: "#18181b", borderRadius: "16px", overflow: "hidden", border: "1px solid #27272a", boxShadow: "0 4px 15px rgba(0,0,0,0.2)", display: 'flex', flexDirection: 'row', height: '130px' },
    imgWrapper: { width: "120px", height: "100%", position: "relative", flexShrink: 0 },
    img: { width: "100%", height: "100%", objectFit: "cover" },
    soldOut: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "12px" },
    
    info: { padding: "12px", flex: 1, display: 'flex', flexDirection: 'column' },
    row: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" },
    dishTitle: { margin: 0, fontSize: "15px", fontWeight: "700", lineHeight: "1.2", color: '#e4e4e7' },
    price: { color: "#f97316", fontWeight: "800", fontSize: "14px" },
    desc: { color: "#71717a", fontSize: "11px", margin: "0 0 auto 0", lineHeight: "1.3", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    
    addBtn: { width: "80px", padding: "8px", background: "white", color: "black", fontWeight: "800", fontSize: "12px", border: "none", borderRadius: "8px", cursor: "pointer", alignSelf: "flex-end" },
    disabledBtn: { width: "100%", padding: "8px", background: "#333", color: "#666", fontSize: "11px", border: "none", borderRadius: "8px", cursor: "not-allowed", marginTop: 'auto' },
    
    counter: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#27272a", borderRadius: "8px", padding: "4px", width: "90px", alignSelf: "flex-end" },
    countBtn: { width: "24px", height: "24px", background: "#3f3f46", border: "none", color: "white", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "10px" },
    qtyNum: { fontWeight: "bold", fontSize: "13px" },

    floatBarContainer: { position: "fixed", bottom: "20px", left: "0", right: "0", padding: "0 20px", zIndex: 50, display: 'flex', justifyContent: 'center' },
    floatBar: { background: "#22c55e", padding: "15px 25px", borderRadius: "50px", display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", boxShadow: "0 10px 25px rgba(34, 197, 94, 0.4)", width: "100%", maxWidth: "500px" },
    floatInfo: { display: "flex", flexDirection: "column" },
    floatQty: { fontSize: "10px", fontWeight: "800", color: "#052e16", textTransform: "uppercase", letterSpacing: '0.5px' },
    floatPrice: { fontSize: "16px", fontWeight: "900", color: "white" },
    viewCart: { color: "white", fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center" }
};

export default Menu;