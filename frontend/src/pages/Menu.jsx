import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client"; 
import { FaSearch, FaPlus, FaMinus, FaStar, FaUtensils, FaArrowRight, FaLock, FaSyncAlt, FaBell, FaRedo } from "react-icons/fa";
import LoadingSpinner from "./components/LoadingSpinner";

const API_BASE = window.location.hostname === "localhost" || window.location.hostname.startsWith("192.168")
    ? "http://localhost:5000/api" 
    : "https://smart-menu-backend-5ge7.onrender.com/api";

const SOCKET_URL = window.location.hostname === "localhost" || window.location.hostname.startsWith("192.168")
    ? "http://localhost:5000"
    : "https://smart-menu-backend-5ge7.onrender.com";

const Menu = ({ cart = [], addToCart, setRestaurantId, setTableNum, setCart }) => {
    const params = useParams();
    const currentRestId = params.restaurantId || params.id;
    const currentTable = params.table;

    // 🟢 FIX 1: Initialize State, but don't trust cache blindly
    const [dishes, setDishes] = useState(() => {
        try {
            const cached = localStorage.getItem(`menu_cache_${currentRestId}`);
            return cached ? JSON.parse(cached) : [];
        } catch (e) { return []; }
    });

    const [filteredDishes, setFilteredDishes] = useState(dishes);
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(dishes.length === 0); 
    const [error, setError] = useState(false);
    const [isSuspended, setIsSuspended] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // Pull to Refresh State
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const startY = useRef(0);
    const prevDishCount = useRef(dishes.length);

    const DEFAULT_IMG = "https://placehold.co/400x300/222/orange?text=Yummy";

    // ⚡ FIX 2: FORCE FETCH FUNCTION (Bypasses Cache)
    const fetchMenu = useCallback(async (isManual = false) => {
        if (!currentRestId) return;
        try {
            if (!isManual && dishes.length === 0) setLoading(true);

            // 🟢 Add random timestamp to URL to force mobile browser to fetch fresh data
            const res = await axios.get(`${API_BASE}/dishes?restaurantId=${currentRestId}&_t=${Date.now()}`, { timeout: 8000 });
            
            if (res.data.status === "suspended") {
                setIsSuspended(true);
            } else {
                let dishData = Array.isArray(res.data) ? res.data : (res.data.dishes || res.data.data || []);

                // ⚡ Socket/Toast Logic
                if (prevDishCount.current > 0 && dishData.length > prevDishCount.current) {
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 4000);
                }
                prevDishCount.current = dishData.length;

                // 🟢 FIX: Update State & LocalStorage Immediately
                setDishes(dishData);
                localStorage.setItem(`menu_cache_${currentRestId}`, JSON.stringify(dishData));
                
                // Only reset filter if user isn't searching
                if (!searchTerm && activeCategory === "All") {
                   setFilteredDishes(dishData);
                } else {
                   // Re-apply filters to new data if searching
                   let result = dishData;
                   if (activeCategory !== "All") result = result.filter(d => d.category === activeCategory);
                   if (searchTerm) result = result.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
                   setFilteredDishes(result);
                }
            }
            setError(false);
        } catch (err) {
            console.error("Menu Fetch Error:", err);
            if (dishes.length === 0) setError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setPullDistance(0);
        }
    }, [currentRestId, searchTerm, activeCategory]); // Removed 'dishes' dependency to avoid loops

    // 🚀 SOCKET.IO CONNECTION
    useEffect(() => {
        if (!currentRestId) return;

        const socket = io(SOCKET_URL, {
            transports: ['websocket'], 
            reconnectionAttempts: 5
        });

        socket.emit("join-restaurant", currentRestId);

        // 🟢 FIX: When socket says "menu-updated", force fetch immediately
        socket.on("menu-updated", () => {
            console.log("⚡ Instant Update Received via Socket");
            fetchMenu(true); 
        });

        // 🟢 NEW: Also listen for 'new-dish-added' event specifically
        socket.on("new-dish-added", () => {
             console.log("⚡ New Dish Added Event");
             fetchMenu(true);
        });

        return () => socket.disconnect();
    }, [currentRestId, fetchMenu]);

    // 🟢 FIX 3: Force Initial Fetch on Mount (Even if cache exists)
    // This ensures that if the admin added an item 1 min ago, we see it now.
    useEffect(() => {
        fetchMenu(false);
    }, [fetchMenu]);

    // 🔄 STOCK CHECKER (Fallback)
    useEffect(() => {
        if (!currentRestId) return;
        const stockInterval = setInterval(() => {
            fetchMenu(true); 
        }, 30000); 
        return () => clearInterval(stockInterval);
    }, [currentRestId, fetchMenu]);

    // 📱 VISIBILITY REFRESH (When user switches tabs back)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") fetchMenu(true); 
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [currentRestId, fetchMenu]);

    // ⚙️ SETUP IDS
    useEffect(() => {
        const lastTable = localStorage.getItem("last_table_scanned");
        const lastRest = localStorage.getItem("last_rest_scanned");
        if (lastTable !== currentTable || lastRest !== currentRestId) {
            if (setCart) setCart([]); 
            localStorage.setItem("last_table_scanned", currentTable || "");
            localStorage.setItem("last_rest_scanned", currentRestId || "");
        }
    }, [currentRestId, currentTable, setCart]);

    useEffect(() => {
        if (!currentRestId) return;
        if (setRestaurantId) setRestaurantId(currentRestId);
        if (setTableNum && currentTable) setTableNum(currentTable);
    }, [currentRestId, currentTable, setRestaurantId, setTableNum]);

    // 👆 TOUCH HANDLERS (Pull to Refresh)
    const handleTouchStart = (e) => { if (window.scrollY === 0) startY.current = e.touches[0].pageY; };
    const handleTouchMove = (e) => {
        const diff = e.touches[0].pageY - startY.current;
        if (window.scrollY === 0 && diff > 0 && diff < 70) setPullDistance(diff);
    };
    const handleTouchEnd = () => {
        if (pullDistance > 50) { setRefreshing(true); fetchMenu(true); } 
        else setPullDistance(0);
    };

    const handleAction = (dish, val = 1) => {
        if ("vibrate" in navigator) navigator.vibrate(40); 
        addToCart(val === -1 ? {...dish, quantity: -1} : dish);
    };

    // 🔍 SEARCH & FILTER LOGIC
    useEffect(() => {
        let result = dishes;
        if (activeCategory !== "All") result = result.filter(d => d.category === activeCategory);
        if (searchTerm) result = result.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
        setFilteredDishes(result);
    }, [searchTerm, activeCategory, dishes]);

    const totalQty = cart ? cart.reduce((acc, item) => acc + item.quantity, 0) : 0;
    const totalPrice = cart ? cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) : 0;
    
    const categories = ["All", ...new Set(dishes.map(d => d.category))];

    if (loading && dishes.length === 0) return <LoadingSpinner />;

    if (isSuspended) return (
        <div style={styles.center}>
            <FaLock size={60} color="#f97316"/>
            <h1 style={{color:'white', marginTop:20, fontFamily: 'sans-serif'}}>SERVICE UNAVAILABLE</h1>
        </div>
    );

    return (
        <div style={styles.container} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            
            {/* THETA NOTIFICATION TOAST */}
            <div style={{...styles.toast, transform: showToast ? 'translateY(0)' : 'translateY(-100px)', opacity: showToast ? 1 : 0}}>
                <FaBell style={{marginRight: 10}} /> NEW DISHES ADDED! REFRESHING...
            </div>

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
                    <div style={{display:'flex', gap: '10px', alignItems: 'center'}}>
                         {/* 🟢 Manual Refresh Button for Mobile Users */}
                         <button onClick={() => { setRefreshing(true); fetchMenu(true); }} style={styles.iconBtn}>
                            <FaRedo size={14} className={refreshing ? "spin" : ""} />
                         </button>
                         <div style={styles.ratingBadge}><FaStar color="#fbbf24"/> 4.8</div>
                    </div>
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
                            style={{
                                ...styles.catBtn, 
                                background: activeCategory === cat ? '#f97316' : '#18181b', 
                                color: activeCategory === cat ? 'white' : '#a1a1aa',
                                boxShadow: activeCategory === cat ? '0 0 20px rgba(249, 115, 22, 0.5)' : 'none',
                                border: (showToast && cat === "All") ? '2px solid #f97316' : '1px solid #333'
                            }}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div style={styles.grid}>
                {filteredDishes.map(dish => {
                    const item = cart ? cart.find(i => i._id === dish._id) : null;
                    const qty = item ? item.quantity : 0;
                    return (
                        <div key={dish._id} style={styles.card}>
                            <div style={styles.imgWrapper}>
                                <img src={dish.image || DEFAULT_IMG} alt={dish.name} style={styles.img} loading="lazy" />
                                {dish.isAvailable === false && <div style={styles.soldOut}>OUT OF STOCK</div>}
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
                                    ) : <button disabled style={styles.disabledBtn}>Sold Out</button>}
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
                            <span style={styles.floatQty}>{totalQty} ITEMS IN CART</span>
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
                body { overscroll-behavior-y: contain; background: #09090b; }
                ::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#09090b", color: "white", paddingBottom: "100px", fontFamily: "'Inter', sans-serif" },
    toast: { position: 'fixed', top: '20px', left: '20px', right: '20px', background: '#f97316', color: 'white', padding: '15px', borderRadius: '15px', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.5s ease', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
    pullLoader: { width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    marqueeWrapper: { background: "#f97316", padding: "8px 0", overflow: "hidden", whiteSpace: "nowrap" },
    marqueeContent: { display: "flex", width: "max-content", animation: "marquee 20s linear infinite", fontSize: "11px", fontWeight: "900", letterSpacing: "3px" },
    center: { height: "100vh", display: "flex", flexDirection:'column', justifyContent: "center", alignItems: "center", background: "#09090b" },
    hero: { padding: "20px 20px 10px", background: "linear-gradient(to bottom, #111, #09090b)", borderBottom: '1px solid #27272a' },
    heroContent: { display: "flex", justifyContent: "space-between", alignItems: 'center' },
    restName: { fontSize: "26px", fontWeight: "900", margin: 0, letterSpacing: "-1px" },
    restSub: { fontSize: "12px", color: "#a1a1aa" },
    ratingBadge: { background: "#18181b", padding: "6px 12px", borderRadius: "12px", fontSize: "12px", border: "1px solid #27272a" },
    iconBtn: { background: "#18181b", border: "1px solid #27272a", color: "#f97316", padding: "8px", borderRadius: "10px", display: 'flex', alignItems: 'center', justifyContent: 'center' },
    searchContainer: { position: "relative", marginTop: 15 },
    searchIcon: { position: "absolute", left: "15px", top: "14px", color: "#71717a" },
    searchInput: { width: "100%", padding: "12px 12px 12px 45px", borderRadius: "12px", background: "#18181b", border: "1px solid #27272a", color: "white", fontSize: "16px", outline: "none" },
    stickyNav: { position: "sticky", top: 0, background: "rgba(9, 9, 11, 0.9)", backdropFilter: "blur(15px)", padding: "12px 0", zIndex: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" },
    catScroll: { display: "flex", gap: "10px", padding: "0 20px", overflowX: "auto" },
    catBtn: { padding: "10px 20px", borderRadius: "25px", fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap", transition: "0.4s cubic-bezier(0.4, 0, 0.2, 1)" },
    grid: { padding: "20px", display: "grid", gap: "16px" },
    card: { background: "#111113", borderRadius: "20px", overflow: "hidden", border: "1px solid #27272a", display: 'flex', height: '130px', boxShadow: "0 4px 20px rgba(0,0,0,0.4)" },
    imgWrapper: { width: "120px", height: "100%", position: "relative" },
    img: { width: "100%", height: "100%", objectFit: "cover" },
    soldOut: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "900", letterSpacing: "1px" },
    info: { padding: "12px", flex: 1, display: 'flex', flexDirection: 'column' },
    row: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
    dishTitle: { margin: 0, fontSize: "16px", color: '#fff', fontWeight: "700" },
    price: { color: "#f97316", fontWeight: "900", fontSize: "16px" },
    desc: { color: "#71717a", fontSize: "11px", marginTop: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' },
    addBtn: { width: "80px", padding: "8px", background: "#fff", color: "#000", fontWeight: "900", borderRadius: "10px", border: "none" },
    counter: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f97316", borderRadius: "10px", width: "100px", padding: "2px", boxShadow: "0 0 15px rgba(249, 115, 22, 0.3)" },
    countBtn: { width: "32px", height: "32px", background: "transparent", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center" },
    qtyNum: { fontWeight: "900", color: "white" },
    floatBarContainer: { position: "fixed", bottom: "25px", left: "0", right: "0", padding: "0 20px", zIndex: 100 },
    floatBar: { background: "#22c55e", padding: "16px 25px", borderRadius: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", boxShadow: "0 15px 35px rgba(34, 197, 94, 0.5)", border: "1px solid rgba(255,255,255,0.25)", transition: "0.3s transform active" },
    floatInfo: { display: "flex", flexDirection: "column" },
    floatQty: { fontSize: "11px", color: "#052e16", fontWeight: "800" },
    floatPrice: { fontSize: "18px", fontWeight: "900", color: "white" },
    viewCart: { color: "white", fontWeight: "900", display: "flex", alignItems: "center", fontSize: "16px" },
    disabledBtn: { background: "#27272a", color: "#71717a", padding: "8px", borderRadius: "10px", border: "none", fontSize: "12px", fontWeight: "700" }
};

export default Menu;