import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSearch, FaPlus, FaMinus, FaStar, FaArrowRight } from "react-icons/fa";

const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";

const Menu = ({ cart, addToCart, setRestaurantId, setTableNum, clearCart }) => {
    const { restaurantId, id, table } = useParams();
    const navigate = useNavigate();
    const currentRestId = restaurantId || id;
    const currentTable = table;

    const [dishes, setDishes] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [loading, setLoading] = useState(true);

    // --- 1. USER ISOLATION LOGIC (Native Fix) ---
    const customerSessionId = useMemo(() => {
        let sid = sessionStorage.getItem("customer_sid");
        if (!sid) {
            // Generates a unique ID using native browser crypto (No 'uuid' package needed)
            sid = window.crypto?.randomUUID?.() || Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem("customer_sid", sid);
            clearCart?.(); 
        }
        return sid;
    }, []);

    // --- 2. PERFORMANCE: FILTERING ---
    const filteredDishes = useMemo(() => {
        return dishes.filter(dish => {
            const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === "All" || dish.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [dishes, searchTerm, activeCategory]);

    const categories = useMemo(() => ["All", ...new Set(dishes.map(d => d.category))], [dishes]);

    useEffect(() => {
        if (currentRestId) {
            sessionStorage.setItem("active_rest_id", currentRestId);
            if (currentTable) sessionStorage.setItem("active_table", currentTable);
            setRestaurantId?.(currentRestId);
            setTableNum?.(currentTable);
        }
    }, [currentRestId, currentTable]);

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const res = await axios.get(`${API_BASE}/dishes?restaurantId=${currentRestId}`);
                setDishes(res.data);
                setLoading(false);
            } catch (err) {
                setLoading(false);
            }
        };
        fetchMenu();
    }, [currentRestId]);

    const cartMap = useMemo(() => new Map(cart.map(item => [item._id, item.quantity])), [cart]);
    const totalQty = useMemo(() => cart.reduce((acc, i) => acc + i.quantity, 0), [cart]);
    const totalPrice = useMemo(() => cart.reduce((acc, i) => acc + (i.price * i.quantity), 0), [cart]);

    if (loading) return <div style={styles.center}><div className="spinner"></div></div>;

    return (
        <div style={styles.container}>
            <div style={styles.hero}>
                <div style={styles.heroContent}>
                    <div>
                        <h1 style={styles.restName}>{currentRestId?.toUpperCase()}</h1>
                        <p style={styles.restSub}>Premium Mobile Dining</p>
                    </div>
                    <div style={styles.ratingBadge}><FaStar /> 4.8</div>
                </div>
                <div style={styles.searchContainer}>
                    <FaSearch style={styles.searchIcon} />
                    <input 
                        style={styles.searchInput} 
                        placeholder="Search menu..." 
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div style={styles.stickyNav}>
                <div style={styles.catScroll}>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            style={{
                                ...styles.catBtn,
                                background: activeCategory === cat ? '#f97316' : '#27272a',
                                color: activeCategory === cat ? '#fff' : '#a1a1aa',
                                border: activeCategory === cat ? 'none' : '1px solid #3f3f46'
                            }}>{cat}</button>
                    ))}
                </div>
            </div>

            <div style={styles.grid}>
                {filteredDishes.map(dish => {
                    const qty = cartMap.get(dish._id) || 0;
                    return (
                        <div key={dish._id} style={styles.card}>
                            <div style={styles.imgWrapper}>
                                <img src={dish.image || "https://placehold.co/400x300/222/orange?text=Food"} alt={dish.name} style={styles.img} />
                                {dish.isAvailable === false && <div style={styles.soldOut}>OUT OF STOCK</div>}
                            </div>
                            <div style={styles.info}>
                                <div style={styles.row}>
                                    <h3 style={styles.dishTitle}>{dish.name}</h3>
                                    <span style={styles.price}>₹{dish.price}</span>
                                </div>
                                <div style={styles.actionRow}>
                                    {dish.isAvailable !== false ? (
                                        qty > 0 ? (
                                            <div style={styles.counter}>
                                                <button onClick={() => addToCart({...dish, quantity: -1})} style={styles.countBtn}><FaMinus/></button>
                                                <span style={styles.qtyNum}>{qty}</span>
                                                <button onClick={() => addToCart(dish)} style={styles.countBtn}><FaPlus/></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => addToCart(dish)} style={styles.addBtn}>ADD</button>
                                        )
                                    ) : (
                                        <button disabled style={styles.disabledBtn}>Unavailable</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {totalQty > 0 && (
                <div style={styles.floatBarContainer}>
                    <button onClick={() => navigate(`/cart?sid=${customerSessionId}`)} style={styles.floatBar}>
                        <div style={styles.floatInfo}>
                            <span style={styles.floatQty}>{totalQty} ITEMS</span>
                            <span style={styles.floatPrice}>₹{totalPrice}</span>
                        </div>
                        <div style={styles.cartCircle}>
                            <FaArrowRight color="white" />
                        </div>
                    </button>
                </div>
            )}
            <style>{`.spinner { width:40px; height:40px; border:4px solid #333; border-top:4px solid #f97316; border-radius:50%; animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#050505", color: "white", paddingBottom: "110px", fontFamily: "'Inter', sans-serif" },
    center: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#050505" },
    hero: { padding: "30px 20px 20px", background: "#0a0a0a", borderBottom: '1px solid #1a1a1a' },
    heroContent: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
    restName: { fontSize: "24px", fontWeight: "900", margin: 0, letterSpacing: "-1px" },
    restSub: { fontSize: "12px", color: "#666" },
    ratingBadge: { background: "#fbbf24", color: "#000", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "900", display: "flex", alignItems: "center", gap: "4px" },
    searchContainer: { position: "relative" },
    searchIcon: { position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#444" },
    searchInput: { width: "100%", padding: "10px 10px 10px 35px", borderRadius: "10px", background: "#111", border: "1px solid #222", color: "white", outline: "none", boxSizing: "border-box" },
    stickyNav: { position: "sticky", top: 0, background: "rgba(5, 5, 5, 0.9)", backdropFilter: "blur(10px)", padding: "12px 0", zIndex: 100, borderBottom: "1px solid #111" },
    catScroll: { display: "flex", gap: "8px", padding: "0 20px", overflowX: "auto", scrollbarWidth: "none" },
    catBtn: { padding: "6px 15px", borderRadius: "20px", fontSize: "11px", fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap" },
    grid: { padding: "15px", display: "flex", flexDirection: "column", gap: "12px" },
    card: { background: "#0a0a0a", borderRadius: "15px", overflow: "hidden", border: "1px solid #111", display: 'flex', height: '100px' },
    imgWrapper: { width: "100px", height: "100%", position: "relative" },
    img: { width: "100%", height: "100%", objectFit: "cover" },
    soldOut: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "8px" },
    info: { padding: "10px", flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
    row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    dishTitle: { margin: 0, fontSize: "14px", fontWeight: "700" },
    price: { color: "#f97316", fontWeight: "900", fontSize: "14px" },
    actionRow: { display: 'flex', justifyContent: 'flex-end' },
    addBtn: { padding: "5px 15px", background: "#fff", color: "#000", fontWeight: "900", fontSize: "11px", border: "none", borderRadius: "6px" },
    counter: { display: "flex", alignItems: "center", gap: "12px", background: "#111", borderRadius: "6px", padding: "4px 8px" },
    countBtn: { background: "none", border: "none", color: "#f97316", fontSize: "10px" },
    qtyNum: { fontWeight: "900", fontSize: "12px" },
    floatBarContainer: { position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", width: "90%", maxWidth: "400px", zIndex: 1000 },
    floatBar: { width: "100%", border: "none", background: "#22c55e", padding: "12px 20px", borderRadius: "15px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", boxShadow: "0 10px 20px rgba(34, 197, 94, 0.3)" },
    floatInfo: { textAlign: "left" },
    floatQty: { fontSize: "10px", fontWeight: "900", color: "#052e16", display: "block" },
    floatPrice: { fontSize: "16px", fontWeight: "900", color: "white" },
    cartCircle: { background: "rgba(0,0,0,0.2)", width: "35px", height: "35px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }
};

export default Menu;