import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { FaSearch, FaPlus, FaMinus, FaStar, FaUtensils, FaArrowRight, FaLock, FaSyncAlt } from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";

// 🔗 SMART API CONNECTION
const API_BASE = window.location.hostname === "localhost" || window.location.hostname.startsWith("192.168")
    ? "http://localhost:5000/api" 
    : "https://smart-menu-backend-5ge7.onrender.com/api";

const Menu = ({ cart, addToCart, setRestaurantId, setTableNum, setCart }) => {
    const params = useParams();
    const currentRestId = params.restaurantId || params.id;
    const currentTable = params.table;

    // 🚀 MOBILE SPEED: Pre-fill state from LocalStorage cache for instant load
    const [dishes, setDishes] = useState(() => {
        const cached = localStorage.getItem(`menu_cache_${currentRestId}`);
        return cached ? JSON.parse(cached) : [];
    });
    const [filteredDishes, setFilteredDishes] = useState(dishes);
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(dishes.length === 0); 
    const [error, setError] = useState(false);
    const [isSuspended, setIsSuspended] = useState(false);

    // 🔄 Pull-to-Refresh State
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const startY = useRef(0);

    const DEFAULT_IMG = "https://placehold.co/400x300/222/orange?text=Yummy";

    // 🔄 NEW CUSTOMER SESSION LOGIC
    useEffect(() => {
        const lastTable = localStorage.getItem("last_table_scanned");
        const lastRest = localStorage.getItem("last_rest_scanned");
        if (lastTable !== currentTable || lastRest !== currentRestId) {
            if (setCart) setCart([]); 
            localStorage.setItem("last_table_scanned", currentTable || "");
            localStorage.setItem("last_rest_scanned", currentRestId || "");
        }
    }, [currentRestId, currentTable, setCart]);

    // 1. ✅ SYNC PARAMS
    useEffect(() => {
        if (!currentRestId) return;
        if (setRestaurantId) setRestaurantId(currentRestId);
        if (setTableNum && currentTable) setTableNum(currentTable);
    }, [currentRestId, currentTable]);

    // 2. ✅ FETCH MENU (Background Sync)
    const fetchMenu = async (isManual = false) => {
        if (!currentRestId) return;
        try {
            if (!isManual && dishes.length === 0) setLoading(true);
            const res = await axios.get(`${API_BASE}/dishes?restaurantId=${currentRestId}`, { timeout: 8000 });
            
            if (res.data.status === "suspended") {
                setIsSuspended(true);
            } else {
                const dishData = Array.isArray(res.data) ? res.data : (res.data.dishes || []);
                setDishes(dishData);
                setFilteredDishes(dishData);
                // ⚡️ Cache data for instant next-time load
                localStorage.setItem(`menu_cache_${currentRestId}`, JSON.stringify(dishData));
            }
            setError(false);
        } catch (err) {
            if (dishes.length === 0) setError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setPullDistance(0);
        }
    };

    useEffect(() => { fetchMenu(); }, [currentRestId]);

    // 3. ✅ MOBILE GESTURES (Pull to Refresh)
    const handleTouchStart = (e) => { if (window.scrollY === 0) startY.current = e.touches[0].pageY; };
    const handleTouchMove = (e) => {
        const diff = e.touches[0].pageY - startY.current;
        if (window.scrollY === 0 && diff > 0 && diff < 70) setPullDistance(diff);
    };
    const handleTouchEnd = () => {
        if (pullDistance > 50) { setRefreshing(true); fetchMenu(true); } 
        else setPullDistance(0);
    };

    // 4. ✅ MOBILE HAPTICS (Vibrate on Add)
    const handleAction = (dish, val = 1) => {
        if ("vibrate" in navigator) navigator.vibrate(40); // ⚡️ High-speed haptic feedback
        addToCart(val === -1 ? {...dish, quantity: -1} : dish);
    };

    // 5. Search & Filter
    useEffect(() => {
        let result = dishes;
        if (activeCategory !== "All") result = result.filter(d => d.category === activeCategory);
        if (searchTerm) result = result.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
        setFilteredDishes(result);
    }, [searchTerm, activeCategory, dishes]);

    const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const categories = ["All", ...new Set(dishes.map(d => d.category))];

    if (loading && dishes.length === 0) return <LoadingSpinner />;

    if (isSuspended) return (
        <div style={styles.center}>
            <FaLock size={60} color="#f97316"/>
            <h1 style={{color:'white', marginTop:20}}>SERVICE UNAVAILABLE</h1>
        </div>
    );

    return (
        <div style={styles.container} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            
            {/* 🔄 Pull Indicator */}
            <div style={{...styles.pullLoader, height: `${pullDistance}px`, opacity: pullDistance / 60}}>
                <FaSyncAlt className={refreshing ? "spin" : ""} style={{color: '#f97316'}} />
            </div>

            <div style={styles.marqueeWrapper}>
                <div style={styles.marqueeContent}>
                    <span>JAI SHREE RAM • JAI SHREE RAM • JAI SHREE RAM • JAI SHREE RAM • </span>
                    <span>JAI SHREE RAM • JAI SHREE RAM • JAI SHREE RAM • JAI SHREE RAM • </span>
                </div>
            </div>

            <div style={styles.hero}>
                <div style={styles.heroContent}>
                    <div>
                        <h1 style={styles.restName}>{currentRestId?.toUpperCase()}</h1>
                        <p style={styles.restSub}>Premium Food & Drinks</p>
                    </div>
                    <div style={styles.ratingBadge}><FaStar color="#fbbf24"/> 4.8</div>
                </div>
                <div style={styles.searchContainer}>
                    <FaSearch style={styles.searchIcon} />
                    <input style={styles.searchInput} placeholder="Search dishes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            <div style={styles.stickyNav}>
                <div style={styles.catScroll}>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            style={{...styles.catBtn, background: activeCategory === cat ? '#f97316' : '#27272a', color: activeCategory === cat ? 'white' : '#a1a1aa' }}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div style={styles.grid}>
                {filteredDishes.map(dish => {
                    const item = cart.find(i => i._id === dish._id);
                    const qty = item ? item.quantity : 0;
                    return (
                        <div key={dish._id} style={styles.card}>
                            <div style={styles.imgWrapper}>
                                <img src={dish.image || DEFAULT_IMG} alt={dish.name} style={styles.img} loading="lazy" />
                                {dish.isAvailable === false && <div style={styles.soldOut}>SOLD OUT</div>}
                            </div>
                            <div style={styles.info}>
                                <div style={styles.row}>
                                    <h3 style={styles.dishTitle}>{dish.name}</h3>
                                    <span style={styles.price}>₹{dish.price}</span>
                                </div>
                                <p style={styles.desc}>{dish.description}</p>
                                <div style={{marginTop:'auto', alignSelf: 'flex-end'}}>
                                    {dish.isAvailable !== false ? (
                                        qty > 0 ? (
                                            <div style={styles.counter}>
                                                <button onClick={() => handleAction(dish, -1)} style={styles.countBtn}><FaMinus size={10}/></button>
                                                <span style={styles.qtyNum}>{qty}</span>
                                                <button onClick={() => handleAction(dish)} style={styles.countBtn}><FaPlus size={10}/></button>
                                            </div>
                                        ) : ( <button onClick={() => handleAction(dish)} style={styles.addBtn}>ADD</button> )
                                    ) : <button disabled style={styles.disabledBtn}>Unavailable</button>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {totalQty > 0 && (
                <div style={styles.floatBarContainer}>
                    <Link to="/cart" style={styles.floatBar}>
                        <div style={styles.floatInfo}>
                            <span style={styles.floatQty}>{totalQty} ITEMS</span>
                            <span style={styles.floatPrice}>₹{totalPrice}</span>
                        </div>
                        <div style={styles.viewCart}>View Cart <FaArrowRight style={{marginLeft:8}}/></div>
                    </Link>
                </div>
            )}

            <style>{`
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                * { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
                body { overscroll-behavior-y: contain; }
            `}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#09090b", color: "white", paddingBottom: "100px", fontFamily: "'Inter', sans-serif" },
    pullLoader: { width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', background: "#09090b" },
    marqueeWrapper: { background: "#f97316", padding: "8px 0", overflow: "hidden", whiteSpace: "nowrap" },
    marqueeContent: { display: "flex", width: "max-content", animation: "marquee 20s linear infinite", fontSize: "11px", fontWeight: "900", letterSpacing: "3px" },
    center: { height: "100vh", display: "flex", flexDirection:'column', justifyContent: "center", alignItems: "center", background: "#09090b" },
    hero: { padding: "20px 20px 10px", background: "#111", borderBottom: '1px solid #27272a' },
    heroContent: { display: "flex", justifyContent: "space-between" },
    restName: { fontSize: "24px", fontWeight: "900", margin: 0 },
    restSub: { fontSize: "12px", color: "#a1a1aa" },
    ratingBadge: { background: "#222", padding: "6px 10px", borderRadius: "12px", fontSize: "12px" },
    searchContainer: { position: "relative", marginTop: 15 },
    searchIcon: { position: "absolute", left: "15px", top: "14px", color: "#71717a" },
    searchInput: { width: "100%", padding: "12px 12px 12px 45px", borderRadius: "12px", background: "#27272a", border: "none", color: "white", fontSize: "16px" },
    stickyNav: { position: "sticky", top: 0, background: "rgba(9, 9, 11, 0.95)", backdropFilter: "blur(10px)", padding: "15px 0", zIndex: 10 },
    catScroll: { display: "flex", gap: "10px", padding: "0 20px", overflowX: "auto" },
    catBtn: { padding: "8px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", border: '1px solid #333' },
    grid: { padding: "20px", display: "grid", gap: "20px" },
    card: { background: "#18181b", borderRadius: "16px", overflow: "hidden", border: "1px solid #27272a", display: 'flex', height: '130px' },
    imgWrapper: { width: "120px", height: "100%", position: "relative" },
    img: { width: "100%", height: "100%", objectFit: "cover" },
    soldOut: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" },
    info: { padding: "12px", flex: 1, display: 'flex', flexDirection: 'column' },
    row: { display: "flex", justifyContent: "space-between" },
    dishTitle: { margin: 0, fontSize: "15px", color: '#e4e4e7' },
    price: { color: "#f97316", fontWeight: "800" },
    desc: { color: "#71717a", fontSize: "11px", overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' },
    addBtn: { width: "80px", padding: "10px", background: "white", color: "black", fontWeight: "800", borderRadius: "8px" },
    counter: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#27272a", borderRadius: "8px", width: "95px" },
    countBtn: { width: "30px", height: "30px", background: "#3f3f46", border: "none", color: "white", borderRadius: "6px" },
    qtyNum: { fontWeight: "bold" },
    floatBarContainer: { position: "fixed", bottom: "20px", left: "0", right: "0", padding: "0 20px" },
    floatBar: { background: "#22c55e", padding: "15px 25px", borderRadius: "50px", display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none" },
    floatInfo: { display: "flex", flexDirection: "column" },
    floatQty: { fontSize: "10px", color: "#052e16" },
    floatPrice: { fontSize: "16px", fontWeight: "900", color: "white" },
    viewCart: { color: "white", fontWeight: "bold", display: "flex", alignItems: "center" }
};

export default Menu;