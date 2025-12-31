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

    // --- 1. 🔐 THE ABSOLUTE USER ISOLATION ---
    // If a user refreshes or opens a new link, we check for a session.
    // No session = New User = CLEAR CART IMMEDIATELY.
    useEffect(() => {
        const sid = sessionStorage.getItem("customer_sid");
        if (!sid) {
            const newSid = Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem("customer_sid", newSid);
            if (clearCart) clearCart(); // Force the parent state to empty
        }
    }, [clearCart]);

    // --- 2. DATA SYNC ---
    useEffect(() => {
        if (currentRestId) {
            setRestaurantId?.(currentRestId);
            if (currentTable) setTableNum?.(currentTable);
        }
    }, [currentRestId, currentTable, setRestaurantId, setTableNum]);

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${API_BASE}/dishes?restaurantId=${currentRestId}`);
                setDishes(res.data);
                setLoading(false);
            } catch (err) { setLoading(false); }
        };
        fetchMenu();
    }, [currentRestId]);

    // --- 3. MATH & TOTALS ---
    const totalQty = useMemo(() => cart.reduce((acc, i) => acc + i.quantity, 0), [cart]);
    const totalPrice = useMemo(() => cart.reduce((acc, i) => acc + (i.price * i.quantity), 0), [cart]);
    const categories = ["All", ...new Set(dishes.map(d => d.category))];

    // Helper to find exact quantity from global cart
    const getQty = (dishId) => {
        const item = cart.find(i => i._id === dishId);
        return item ? item.quantity : 0;
    };

    // ✅ FIXED ACTION: Explicitly handles Plus and Minus
    const handleAction = (dish, type) => {
        if (type === "PLUS") {
            addToCart({ ...dish, quantity: 1 });
        } else {
            addToCart({ ...dish, quantity: -1 });
        }
    };

    if (loading) return <div style={styles.center}><div className="spinner"></div></div>;

    return (
        <div style={styles.container}>
            {/* HERO SECTION */}
            <div style={styles.hero}>
                <h1 style={styles.restName}>{currentRestId?.toUpperCase()}</h1>
                <div style={styles.searchContainer}>
                    <FaSearch style={styles.searchIcon} />
                    <input 
                        style={styles.searchInput} 
                        placeholder="Search our menu..." 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>
            </div>

            {/* CATEGORY NAV */}
            <div style={styles.stickyNav}>
                <div style={styles.catScroll}>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            style={{
                                ...styles.catBtn, 
                                background: activeCategory === cat ? '#f97316' : '#1a1a1a',
                                color: activeCategory === cat ? 'white' : '#888'
                            }}>{cat}</button>
                    ))}
                </div>
            </div>

            {/* DISH LIST - IMPROVED ARRANGEMENT */}
            <div style={styles.grid}>
                {dishes
                    .filter(d => (activeCategory === "All" || d.category === activeCategory) && d.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(dish => {
                        const qty = getQty(dish._id);
                        return (
                            <div key={dish._id} style={styles.card}>
                                <div style={styles.imgWrapper}>
                                    <img src={dish.image || "https://placehold.co/400x300/222/orange?text=Food"} style={styles.img} alt="" />
                                    {dish.isAvailable === false && <div style={styles.soldOut}>OUT</div>}
                                </div>
                                <div style={styles.info}>
                                    <div style={styles.row}>
                                        <span style={styles.dishTitle}>{dish.name}</span>
                                        <span style={styles.price}>₹{dish.price}</span>
                                    </div>
                                    <div style={styles.actionRow}>
                                        {qty > 0 ? (
                                            <div style={styles.counter}>
                                                <button onClick={() => handleAction(dish, "MINUS")} style={styles.countBtn}><FaMinus size={10}/></button>
                                                <span style={styles.qtyNum}>{qty}</span>
                                                <button onClick={() => handleAction(dish, "PLUS")} style={styles.countBtn}><FaPlus size={10}/></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleAction(dish, "PLUS")} style={styles.addBtn}>ADD</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                }
            </div>

            {/* 🛒 CENTERED FLOATING BAR (NO EXTRA TEXT) */}
            {totalQty > 0 && (
                <div style={styles.floatBarContainer}>
                    <button onClick={() => navigate('/cart')} style={styles.floatBar}>
                        <div style={styles.floatData}>
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
    container: { minHeight: "100vh", background: "#050505", color: "white", paddingBottom: "130px", fontFamily: 'Inter, sans-serif' },
    center: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: '#050505' },
    hero: { padding: "30px 20px 10px", background: "#0a0a0a", borderBottom: '1px solid #1a1a1a' },
    restName: { fontSize: "24px", fontWeight: "900", margin: "0 0 15px 0", letterSpacing: '-1px' },
    searchContainer: { position: "relative", marginBottom: '10px' },
    searchIcon: { position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#444" },
    searchInput: { width: "100%", padding: "12px 12px 12px 40px", borderRadius: "12px", background: "#111", border: "1px solid #222", color: "white", outline: "none", boxSizing: "border-box" },
    stickyNav: { position: "sticky", top: 0, background: "rgba(5, 5, 5, 0.95)", backdropFilter: "blur(10px)", padding: "12px 0", zIndex: 100 },
    catScroll: { display: "flex", gap: "8px", padding: "0 20px", overflowX: "auto", scrollbarWidth: 'none' },
    catBtn: { padding: "8px 20px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", border: "none", whiteSpace: 'nowrap' },
    grid: { padding: "15px", display: "flex", flexDirection: "column", gap: "12px" },
    card: { background: "#0a0a0a", borderRadius: "18px", border: "1px solid #111", display: "flex", height: "100px", overflow: "hidden" },
    imgWrapper: { width: "100px", height: "100%", position: 'relative' },
    img: { width: "100%", height: "100%", objectFit: "cover" },
    soldOut: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' },
    info: { flex: 1, padding: "12px 15px", display: "flex", flexDirection: "column", justifyContent: "space-between" },
    row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    dishTitle: { fontSize: "15px", fontWeight: "800" },
    price: { color: "#f97316", fontWeight: "900" },
    actionRow: { display: "flex", justifyContent: "flex-end" },
    addBtn: { background: "#fff", color: "#000", border: "none", padding: "6px 20px", borderRadius: "8px", fontWeight: "900", fontSize: "11px" },
    counter: { display: "flex", alignItems: "center", gap: "15px", background: "#1a1a1a", padding: "5px 12px", borderRadius: "10px", border: '1px solid #222' },
    countBtn: { background: "none", border: "none", color: "#f97316", cursor: "pointer", display: 'flex', alignItems: 'center' },
    qtyNum: { fontWeight: "900", fontSize: '14px' },
    floatBarContainer: { position: "fixed", bottom: "30px", left: "50%", transform: "translateX(-50%)", width: "90%", maxWidth: "420px", zIndex: 1000 },
    floatBar: { width: "100%", background: "#22c55e", border: "none", borderRadius: "25px", padding: "15px 25px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 40px rgba(34, 197, 94, 0.4)", cursor: 'pointer' },
    floatData: { display: "flex", flexDirection: "column", textAlign: "left" },
    floatQty: { fontSize: "10px", fontWeight: "900", color: "#052e16", letterSpacing: '1px' },
    floatPrice: { fontSize: "20px", fontWeight: "900", color: 'white' },
    cartCircle: { background: "rgba(0,0,0,0.15)", width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }
};

export default Menu;