import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { FaSearch, FaPlus, FaMinus, FaStar, FaUtensils, FaArrowRight, FaLock, FaSyncAlt } from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";

const API_BASE = window.location.hostname === "localhost" || window.location.hostname.startsWith("192.168")
    ? "http://localhost:5000/api" 
    : "https://smart-menu-backend-5ge7.onrender.com/api";

const Menu = ({ cart, addToCart, setRestaurantId, setTableNum, setCart }) => {
    const params = useParams();
    const currentRestId = params.restaurantId || params.id;
    const currentTable = params.table;

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

    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const startY = useRef(0);

    const DEFAULT_IMG = "https://placehold.co/400x300/222/orange?text=Yummy";

    // 📡 ADMIN SYNC: Background heartbeat to check if Admin changed stock or prices
    const fetchMenu = useCallback(async (isManual = false) => {
        if (!currentRestId) return;
        try {
            if (!isManual && dishes.length === 0) setLoading(true);
            const res = await axios.get(`${API_BASE}/dishes?restaurantId=${currentRestId}`, { timeout: 8000 });
            
            // Handle Admin suspension
            if (res.data.status === "suspended") {
                setIsSuspended(true);
                return;
            }

            const dishData = Array.isArray(res.data) ? res.data : (res.data.dishes || []);
            
            // 🧹 SYNC LOGIC: If the total dish count changed, or names changed, update local state
            setDishes(dishData);
            localStorage.setItem(`menu_cache_${currentRestId}`, JSON.stringify(dishData));
            setError(false);
        } catch (err) {
            console.error("Sync Error");
            if (dishes.length === 0) setError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setPullDistance(0);
        }
    }, [currentRestId, dishes.length]);

    // ✅ 15s Auto-Sync with Admin changes
    useEffect(() => {
        fetchMenu();
        const interval = setInterval(() => fetchMenu(true), 15000);
        return () => clearInterval(interval);
    }, [fetchMenu]);

    // 📱 Pull to Refresh logic
    const handleTouchStart = (e) => { if (window.scrollY === 0) startY.current = e.touches[0].pageY; };
    const handleTouchMove = (e) => {
        const diff = e.touches[0].pageY - startY.current;
        if (window.scrollY === 0 && diff > 0 && diff < 80) setPullDistance(diff);
    };
    const handleTouchEnd = () => {
        if (pullDistance > 60) { setRefreshing(true); fetchMenu(true); } 
        else setPullDistance(0);
    };

    // 🛒 Cart Action
    const handleAction = (dish, val = 1) => {
        if ("vibrate" in navigator) navigator.vibrate(40); 
        addToCart(val === -1 ? {...dish, quantity: -1} : dish);
    };

    // 🔍 Dynamic Filtering (Matches Admin Categories)
    useEffect(() => {
        let result = dishes;
        if (activeCategory !== "All") result = result.filter(d => d.category === activeCategory);
        if (searchTerm) result = result.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
        setFilteredDishes(result);
    }, [searchTerm, activeCategory, dishes]);

    const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // 🔥 Admin Category Sync
    const categories = ["All", ...new Set(dishes.map(d => d.category))];

    if (loading && dishes.length === 0) return <LoadingSpinner />;

    if (isSuspended) return (
        <div style={styles.center}>
            <FaLock size={60} color="#f97316"/>
            <h1 style={{color:'white', marginTop:20, fontWeight:'900'}}>MENU SUSPENDED</h1>
            <p style={{color:'#666'}}>Please contact the restaurant</p>
        </div>
    );

    return (
        <div style={styles.container} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            
            {/* Pull Down Indicator */}
            <div style={{...styles.pullLoader, height: `${pullDistance}px`, opacity: pullDistance / 70}}>
                <FaSyncAlt className={refreshing ? "spin" : ""} style={{color: '#f97316'}} />
            </div>

            <div style={styles.hero}>
                <div style={styles.heroContent}>
                    <div>
                        <h1 style={styles.restName}>{currentRestId?.toUpperCase()}</h1>
                        <p style={styles.restSub}>Premium Selection</p>
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
                            style={{
                                ...styles.catBtn, 
                                background: activeCategory === cat ? '#f97316' : '#18181b', 
                                color: activeCategory === cat ? 'white' : '#a1a1aa',
                                borderColor: activeCategory === cat ? '#f97316' : '#27272a'
                            }}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div style={styles.grid}>
                {filteredDishes.length === 0 ? (
                    <div style={{textAlign:'center', padding:'50px', color:'#555'}}>No items found</div>
                ) : (
                    filteredDishes.map(dish => {
                        const item = cart.find(i => i._id === dish._id);
                        const qty = item ? item.quantity : 0;
                        
                        // 🔥 ADMIN SYNC: Check availability from Admin Dashboard
                        const outOfStock = dish.isAvailable === false;

                        return (
                            <div key={dish._id} style={{...styles.card, opacity: outOfStock ? 0.6 : 1}}>
                                <div style={styles.imgWrapper}>
                                    <img src={dish.image || DEFAULT_IMG} alt={dish.name} style={styles.img} loading="lazy" />
                                    {outOfStock && <div style={styles.soldOut}>OUT OF STOCK</div>}
                                </div>
                                <div style={styles.info}>
                                    <div style={styles.row}>
                                        <h3 style={styles.dishTitle}>{dish.name}</h3>
                                        <span style={styles.price}>₹{dish.price}</span>
                                    </div>
                                    <p style={styles.desc}>{dish.description || "Freshly prepared ingredients"}</p>
                                    <div style={{marginTop:'auto', alignSelf: 'flex-end'}}>
                                        {!outOfStock ? (
                                            qty > 0 ? (
                                                <div style={styles.counter}>
                                                    <button onClick={() => handleAction(dish, -1)} style={styles.countBtn}><FaMinus size={10}/></button>
                                                    <span style={styles.qtyNum}>{qty}</span>
                                                    <button onClick={() => handleAction(dish)} style={styles.countBtn}><FaPlus size={10}/></button>
                                                </div>
                                            ) : ( <button onClick={() => handleAction(dish)} style={styles.addBtn}>ADD</button> )
                                        ) : <button disabled style={styles.disabledBtn}>Out of Stock</button>}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
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
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                * { -webkit-tap-highlight-color: transparent; }
                body { overscroll-behavior-y: contain; background: #09090b; }
            `}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#09090b", color: "white", paddingBottom: "120px", fontFamily: "'Inter', sans-serif" },
    pullLoader: { width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', transition: 'height 0.2s' },
    hero: { padding: "20px 20px 10px", background: "linear-gradient(to bottom, #111, #09090b)", borderBottom: '1px solid #27272a' },
    heroContent: { display: "flex", justifyContent: "space-between" },
    restName: { fontSize: "24px", fontWeight: "900", margin: 0, letterSpacing: "-1px" },
    restSub: { fontSize: "12px", color: "#a1a1aa" },
    ratingBadge: { background: "#18181b", padding: "6px 12px", borderRadius: "12px", fontSize: "12px", border: "1px solid #27272a", display:'flex', alignItems:'center', gap:5 },
    searchContainer: { position: "relative", marginTop: 15 },
    searchIcon: { position: "absolute", left: "15px", top: "14px", color: "#71717a" },
    searchInput: { width: "100%", padding: "12px 12px 12px 45px", borderRadius: "12px", background: "#18181b", border: "1px solid #27272a", color: "white", fontSize: "16px", outline: "none" },
    stickyNav: { position: "sticky", top: 0, background: "rgba(9, 9, 11, 0.95)", backdropFilter: "blur(15px)", padding: "12px 0", zIndex: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" },
    catScroll: { display: "flex", gap: "10px", padding: "0 20px", overflowX: "auto" },
    catBtn: { padding: "8px 18px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap", border: '1px solid #333', transition: "0.2s" },
    grid: { padding: "20px", display: "grid", gap: "16px" },
    card: { background: "#111113", borderRadius: "20px", overflow: "hidden", border: "1px solid #27272a", display: 'flex', height: '135px', boxShadow: "0 4px 20px rgba(0,0,0,0.4)" },
    imgWrapper: { width: "120px", height: "100%", position: "relative", flexShrink: 0 },
    img: { width: "100%", height: "100%", objectFit: "cover" },
    soldOut: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "900", textAlign:'center' },
    info: { padding: "12px", flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
    row: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 5 },
    dishTitle: { margin: 0, fontSize: "15px", color: '#fff', fontWeight: "700", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
    price: { color: "#f97316", fontWeight: "900", fontSize: "15px" },
    desc: { color: "#71717a", fontSize: "10px", marginTop: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' },
    addBtn: { width: "70px", padding: "6px", background: "#fff", color: "#000", fontWeight: "900", borderRadius: "8px", border: "none", fontSize:'12px' },
    counter: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f97316", borderRadius: "8px", width: "90px", padding: "2px" },
    countBtn: { width: "28px", height: "28px", background: "transparent", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center" },
    qtyNum: { fontWeight: "900", color: "white", fontSize:'14px' },
    floatBarContainer: { position: "fixed", bottom: "20px", left: "0", right: "0", padding: "0 20px", zIndex: 100 },
    floatBar: { background: "#22c55e", padding: "14px 20px", borderRadius: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", boxShadow: "0 10px 30px rgba(34, 197, 94, 0.4)" },
    floatInfo: { display: "flex", flexDirection: "column" },
    floatQty: { fontSize: "10px", color: "#052e16", fontWeight: "800" },
    floatPrice: { fontSize: "16px", fontWeight: "900", color: "white" },
    viewCart: { color: "white", fontWeight: "900", display: "flex", alignItems: "center", fontSize: "14px" },
    disabledBtn: { background: "#27272a", color: "#71717a", padding: "6px 12px", borderRadius: "8px", border: "none", fontSize: "10px", fontWeight: "700" }
};

export default Menu;