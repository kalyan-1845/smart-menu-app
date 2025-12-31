import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSearch, FaPlus, FaMinus, FaStar, FaArrowRight } from "react-icons/fa";

const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";

const Menu = ({ cart, addToCart, removeFromCart, setRestaurantId, setTableNum, clearCart }) => {
    const { restaurantId, id, table } = useParams();
    const navigate = useNavigate();
    const currentRestId = restaurantId || id;
    const currentTable = table;

    const [dishes, setDishes] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [loading, setLoading] = useState(true);

    // --- 🔐 THE TRUTH: SESSION ISOLATION ---
    // This part ensures that if I open the link, my cart is empty.
    // If you open the link, your cart is empty.
    useEffect(() => {
        const sid = sessionStorage.getItem("customer_sid");
        if (!sid) {
            const newSid = window.crypto?.randomUUID?.() || Math.random().toString(36).substring(2);
            sessionStorage.setItem("customer_sid", newSid);
            clearCart(); // ❗ This resets the cart for every new visitor
        }
    }, []); // Only runs once when the user first arrives

    useEffect(() => {
        if (currentRestId) {
            localStorage.setItem("last_restaurant_id", currentRestId);
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
            } catch (err) { setLoading(false); }
        };
        fetchMenu();
    }, [currentRestId]);

    const totalQty = useMemo(() => cart.reduce((acc, i) => acc + i.quantity, 0), [cart]);
    const totalPrice = useMemo(() => cart.reduce((acc, i) => acc + (i.price * i.quantity), 0), [cart]);
    const categories = useMemo(() => ["All", ...new Set(dishes.map(d => d.category))], [dishes]);
    
    // Helper to get quantity for a specific dish from the cart
    const getDishQty = (dishId) => {
        const item = cart.find(i => i._id === dishId);
        return item ? item.quantity : 0;
    };

    if (loading) return <div style={styles.center}><div className="spinner"></div></div>;

    return (
        <div style={styles.container}>
            {/* SEARCH & HERO */}
            <div style={styles.hero}>
                <h1 style={styles.restName}>{currentRestId?.toUpperCase()}</h1>
                <div style={styles.searchContainer}>
                    <FaSearch style={styles.searchIcon} />
                    <input style={styles.searchInput} placeholder="Search dishes..." onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* CATEGORIES */}
            <div style={styles.stickyNav}>
                <div style={styles.catScroll}>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            style={{...styles.catBtn, background: activeCategory === cat ? '#f97316' : '#27272a', color: 'white'}}>{cat}</button>
                    ))}
                </div>
            </div>

            {/* DISHES */}
            <div style={styles.grid}>
                {dishes.filter(d => (activeCategory === "All" || d.category === activeCategory) && d.name.toLowerCase().includes(searchTerm.toLowerCase())).map(dish => {
                    const qty = getDishQty(dish._id);
                    return (
                        <div key={dish._id} style={styles.card}>
                            <div style={styles.imgWrapper}>
                                <img src={dish.image || "https://placehold.co/400x300/222/orange?text=Food"} style={styles.img} alt="" />
                            </div>
                            <div style={styles.info}>
                                <div style={styles.row}>
                                    <span style={styles.dishTitle}>{dish.name}</span>
                                    <span style={styles.price}>₹{dish.price}</span>
                                </div>
                                <div style={styles.actionRow}>
                                    {qty > 0 ? (
                                        <div style={styles.counter}>
                                            {/* MINUS: Sends -1 to App.js logic */}
                                            <button onClick={() => addToCart({...dish, quantity: -1})} style={styles.countBtn}><FaMinus size={10}/></button>
                                            <span style={styles.qtyNum}>{qty}</span>
                                            {/* PLUS: Sends +1 to App.js logic */}
                                            <button onClick={() => addToCart({...dish, quantity: 1})} style={styles.countBtn}><FaPlus size={10}/></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => addToCart({...dish, quantity: 1})} style={styles.addBtn}>ADD</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 🛒 PURE CART BUTTON - NO "VIEW CART" TEXT */}
            {totalQty > 0 && (
                <div style={styles.floatBarContainer}>
                    <button onClick={() => navigate('/cart')} style={styles.floatBar}>
                        <div style={styles.floatLeft}>
                            <span style={styles.floatQty}>{totalQty} ITEMS</span>
                            <span style={styles.floatPrice}>₹{totalPrice}</span>
                        </div>
                        <div style={styles.cartCircle}>
                            <FaArrowRight color="white" size={16} />
                        </div>
                    </button>
                </div>
            )}
            <style>{`.spinner { width:40px; height:40px; border:4px solid #333; border-top:4px solid #f97316; border-radius:50%; animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#050505", color: "white", paddingBottom: "120px" },
    center: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" },
    hero: { padding: "30px 20px", background: "#0a0a0a" },
    restName: { fontSize: "24px", fontWeight: "900", margin: "0 0 15px 0" },
    searchContainer: { position: "relative" },
    searchIcon: { position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#444" },
    searchInput: { width: "100%", padding: "12px 12px 12px 40px", borderRadius: "12px", background: "#111", border: "1px solid #222", color: "white", outline: "none", boxSizing: "border-box" },
    stickyNav: { position: "sticky", top: 0, background: "rgba(5, 5, 5, 0.9)", backdropFilter: "blur(10px)", padding: "10px 0", zIndex: 100 },
    catScroll: { display: "flex", gap: "10px", padding: "0 20px", overflowX: "auto" },
    catBtn: { padding: "8px 20px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", border: "none", whiteSpace: "nowrap" },
    grid: { padding: "20px", display: "flex", flexDirection: "column", gap: "15px" },
    card: { background: "#0a0a0a", borderRadius: "15px", border: "1px solid #111", display: "flex", height: "110px", overflow: "hidden" },
    imgWrapper: { width: "110px", height: "100%" },
    img: { width: "100%", height: "100%", objectFit: "cover" },
    info: { flex: 1, padding: "15px", display: "flex", flexDirection: "column", justifyContent: "space-between" },
    row: { display: "flex", justifyContent: "space-between" },
    dishTitle: { fontSize: "16px", fontWeight: "bold" },
    price: { color: "#f97316", fontWeight: "bold" },
    actionRow: { display: "flex", justifyContent: "flex-end" },
    addBtn: { background: "#fff", color: "#000", border: "none", padding: "6px 20px", borderRadius: "8px", fontWeight: "900", fontSize: "12px" },
    counter: { display: "flex", alignItems: "center", gap: "15px", background: "#1a1a1a", padding: "5px 12px", borderRadius: "10px" },
    countBtn: { background: "none", border: "none", color: "#f97316", cursor: "pointer" },
    qtyNum: { fontWeight: "bold" },
    floatBarContainer: { position: "fixed", bottom: "30px", left: "50%", transform: "translateX(-50%)", width: "90%", maxWidth: "450px", zIndex: 1000 },
    floatBar: { width: "100%", background: "#22c55e", border: "none", borderRadius: "20px", padding: "15px 25px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 30px rgba(34, 197, 94, 0.4)" },
    floatLeft: { display: "flex", flexDirection: "column", textAlign: "left" },
    floatQty: { fontSize: "10px", fontWeight: "900", color: "#052e16" },
    floatPrice: { fontSize: "20px", fontWeight: "900" },
    cartCircle: { background: "rgba(0,0,0,0.1)", width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }
};

export default Menu;