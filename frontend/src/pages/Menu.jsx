import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { FaSearch, FaPlus, FaMinus, FaStar, FaUtensils, FaArrowRight } from "react-icons/fa";

const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";

const Menu = ({ cart, addToCart, setRestaurantId, setTableNum }) => {
    const { restaurantId, id, table } = useParams();
    const currentRestId = restaurantId || id;
    const currentTable = table;

    const [dishes, setDishes] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [loading, setLoading] = useState(true);

    // --- 1. PERFORMANCE: USEMEMO FOR FILTERING ---
    // This prevents the app from re-filtering the list of 100+ dishes on every keystroke
    const filteredDishes = useMemo(() => {
        return dishes.filter(dish => {
            const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === "All" || dish.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [dishes, searchTerm, activeCategory]);

    const categories = useMemo(() => ["All", ...new Set(dishes.map(d => d.category))], [dishes]);

    // --- 2. SAAS ISOLATION: PERSISTENCE ---
    useEffect(() => {
        if (currentRestId) {
            localStorage.setItem("last_restaurant_id", currentRestId);
            if (currentTable) localStorage.setItem("last_table_num", currentTable);
            setRestaurantId?.(currentRestId);
            setTableNum?.(currentTable);
        }
    }, [currentRestId, currentTable, setRestaurantId, setTableNum]);

    // --- 3. FAST DATA FETCHING ---
    useEffect(() => {
        if (!currentRestId) return;
        const fetchMenu = async () => {
            try {
                const res = await axios.get(`${API_BASE}/dishes?restaurantId=${currentRestId}`);
                setDishes(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Fetch failed");
                setLoading(false);
            }
        };
        fetchMenu();
    }, [currentRestId]);

    // --- 4. OPTIMIZED QUANTITY CALCULATION ---
    // Converts cart array to a Map for O(1) lookup speed (Critical for 1000 users)
    const cartMap = useMemo(() => {
        return new Map(cart.map(item => [item._id, item.quantity]));
    }, [cart]);

    const totalQty = useMemo(() => cart.reduce((acc, i) => acc + i.quantity, 0), [cart]);
    const totalPrice = useMemo(() => cart.reduce((acc, i) => acc + (i.price * i.quantity), 0), [cart]);

    if (loading) return <div style={styles.center}><div className="spinner"></div></div>;

    return (
        <div style={styles.container}>
            {/* HERO SECTION */}
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

            {/* CATEGORIES */}
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

            {/* DISH LIST - Optimized Vertical Scroll */}
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
                                <p style={styles.desc}>{dish.category}</p>
                                
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

            {/* 🛒 FLOATING CART - Mobile Ready */}
            {totalQty > 0 && (
                <div style={styles.floatBarContainer}>
                    <Link to="/cart" style={styles.floatBar}>
                        <div style={styles.floatInfo}>
                            <span style={styles.floatQty}>{totalQty} ITEMS</span>
                            <span style={styles.floatPrice}>₹{totalPrice}</span>
                        </div>
                        <div style={styles.viewCart}>
                            VIEW CART <FaArrowRight style={{marginLeft: 8}}/>
                        </div>
                    </Link>
                </div>
            )}
            <style>{`.spinner { width:40px; height:40px; border:4px solid #333; border-top:4px solid #f97316; border-radius:50%; animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#09090b", color: "white", paddingBottom: "110px", fontFamily: "'Inter', sans-serif" },
    center: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#09090b" },
    hero: { padding: "30px 20px 20px", background: "linear-gradient(180deg, #18181b 0%, #09090b 100%)", borderBottom: '1px solid #27272a' },
    heroContent: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
    restName: { fontSize: "26px", fontWeight: "900", margin: 0, color: "#fff", letterSpacing: "-1px" },
    restSub: { fontSize: "12px", color: "#71717a" },
    ratingBadge: { background: "#fbbf24", color: "#000", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "900", display: "flex", alignItems: "center", gap: "4px" },
    searchContainer: { position: "relative" },
    searchIcon: { position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#71717a" },
    searchInput: { width: "100%", padding: "12px 12px 12px 45px", borderRadius: "12px", background: "#18181b", border: "1px solid #27272a", color: "white", outline: "none", boxSizing: "border-box" },
    stickyNav: { position: "sticky", top: 0, background: "rgba(9, 9, 11, 0.8)", backdropFilter: "blur(20px)", padding: "12px 0", zIndex: 100, borderBottom: "1px solid #27272a" },
    catScroll: { display: "flex", gap: "10px", padding: "0 20px", overflowX: "auto", scrollbarWidth: "none" },
    catBtn: { padding: "8px 18px", borderRadius: "50px", fontSize: "12px", fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap", transition: "0.3s" },
    grid: { padding: "15px", display: "flex", flexDirection: "column", gap: "12px" },
    card: { background: "#18181b", borderRadius: "18px", overflow: "hidden", border: "1px solid #27272a", display: 'flex', height: '120px' },
    imgWrapper: { width: "110px", height: "100%", position: "relative" },
    img: { width: "100%", height: "100%", objectFit: "cover" },
    soldOut: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "9px" },
    info: { padding: "12px", flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
    row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    dishTitle: { margin: 0, fontSize: "15px", fontWeight: "800", color: '#fff' },
    price: { color: "#f97316", fontWeight: "900", fontSize: "15px" },
    desc: { color: "#71717a", fontSize: "11px", margin: 0 },
    actionRow: { display: 'flex', justifyContent: 'flex-end' },
    addBtn: { padding: "6px 20px", background: "#fff", color: "#000", fontWeight: "900", fontSize: "12px", border: "none", borderRadius: "8px" },
    counter: { display: "flex", alignItems: "center", gap: "15px", background: "#27272a", borderRadius: "8px", padding: "5px 10px" },
    countBtn: { background: "none", border: "none", color: "#f97316", fontSize: "12px" },
    qtyNum: { fontWeight: "900", fontSize: "14px" },
    floatBarContainer: { position: "fixed", bottom: "20px", left: "0", right: "0", padding: "0 15px", zIndex: 1000 },
    floatBar: { background: "#22c55e", padding: "16px 20px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", boxShadow: "0 10px 30px rgba(34, 197, 94, 0.4)" },
    floatInfo: { display: "flex", flexDirection: "column" },
    floatQty: { fontSize: "10px", fontWeight: "900", color: "#052e16" },
    floatPrice: { fontSize: "18px", fontWeight: "900", color: "white" },
    viewCart: { color: "white", fontWeight: "900", fontSize: "13px", display: "flex", alignItems: "center" }
};

export default Menu;