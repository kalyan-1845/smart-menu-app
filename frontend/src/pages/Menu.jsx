import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom"; 
import axios from "axios";
import { FaSearch, FaPlus, FaMinus, FaShoppingCart, FaArrowRight, FaSyncAlt, FaBullhorn, FaExclamationTriangle } from "react-icons/fa";
import { toast } from "react-hot-toast"; 
import LoadingSpinner from "../components/LoadingSpinner";

// ⚠️ CHANGE TO YOUR LIVE SERVER URL
const API_BASE = "https://smart-menu-app-production.up.railway.app/api";

const Menu = ({ cart, addToCart, setRestaurantId, setTableNum, setCart, customerId }) => {
    const params = useParams();
    const navigate = useNavigate(); 
    const [searchParams] = useSearchParams();
    
    // Support both /menu/id/5 and /menu/id?table=5
    const currentRestId = params.restaurantId || params.id;
    const queryTable = searchParams.get("table");
    const currentTable = params.table || queryTable;

    // --- STATES ---
    const [dishes, setDishes] = useState(() => {
        try {
            const cached = localStorage.getItem(`menu_cache_${currentRestId}`);
            return cached ? JSON.parse(cached) : [];
        } catch (e) { return []; }
    });

    const [activeCategory, setActiveCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(dishes.length === 0); 
    
    // --- CEO GLOBAL STATES ---
    const [systemBroadcast, setSystemBroadcast] = useState("");
    const [globalBanner, setGlobalBanner] = useState("");
    const [isMaintenance, setIsMaintenance] = useState(false);

    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const startY = useRef(0);

    const DEFAULT_IMG = "https://placehold.co/400x300/1e293b/white?text=Yummy";

    const fetchMenu = async () => {
        if (!currentRestId) return;
        try {
            const idRes = await axios.get(`${API_BASE}/auth/owner-id/${currentRestId}`);
            const realMongoId = idRes.data.id;

            // Fetch Menu & Global System Status
            const [menuRes, sysRes] = await Promise.all([
                axios.get(`${API_BASE}/dishes?restaurantId=${realMongoId}&t=${Date.now()}`),
                axios.get(`${API_BASE}/superadmin/system-status`)
            ]);
            
            setSystemBroadcast(sysRes.data.message || "");
            setGlobalBanner(sysRes.data.globalBanner || "");
            setIsMaintenance(sysRes.data.maintenance || false);

            const dishData = Array.isArray(menuRes.data) ? menuRes.data : (menuRes.data.dishes || []);
            setDishes(dishData);
            localStorage.setItem(`menu_cache_${currentRestId}`, JSON.stringify(dishData));
        
        } catch (err) {
            console.error("Fetch failed", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setPullDistance(0);
        }
    };

    useEffect(() => {
        fetchMenu();
        const interval = setInterval(fetchMenu, 30000);
        return () => clearInterval(interval);
    }, [currentRestId]);

    // ⚡️ SESSION LOGIC (Clears Table on Exit)
    useEffect(() => {
        if (currentTable) {
            // Use SESSION STORAGE so it clears when browser closes
            sessionStorage.setItem("last_table_scanned", currentTable);
            if (setTableNum) setTableNum(currentTable);
        }
        if (setRestaurantId) setRestaurantId(currentRestId);
    }, [currentRestId, currentTable]);

    const filteredDishes = useMemo(() => {
        let result = dishes;
        if (activeCategory !== "All") result = result.filter(d => d.category === activeCategory);
        if (searchTerm) result = result.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return result;
    }, [dishes, activeCategory, searchTerm]);

    const categories = useMemo(() => ["All", ...new Set(dishes.map(d => d.category))], [dishes]);
    const totalQty = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
    const totalPrice = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);

    const cartLink = `/${currentRestId}/cart/${customerId}`;

    if (isMaintenance) return (
        <div style={styles.center}>
            <FaExclamationTriangle size={60} color="#3b82f6"/>
            <h1 style={{color:'white', marginTop:20, textAlign:'center'}}>SYSTEM UPDATE</h1>
            <p style={{color:'#94a3b8', padding:'0 40px', textAlign:'center'}}>We are improving your experience. Back shortly.</p>
        </div>
    );

    if (loading && dishes.length === 0) return <LoadingSpinner />;

    return (
        <div style={styles.container} 
             onTouchStart={(e) => { if (window.scrollY === 0) startY.current = e.touches[0].pageY; }}
             onTouchMove={(e) => {
                const diff = e.touches[0].pageY - startY.current;
                if (window.scrollY === 0 && diff > 0 && diff < 70) setPullDistance(diff);
             }}
             onTouchEnd={() => {
                if (pullDistance > 50) { setRefreshing(true); fetchMenu(); } 
                else setPullDistance(0);
             }}>
            
            {/* Pull to Refresh Indicator */}
            <div style={{...styles.pullLoader, height: `${pullDistance}px`, opacity: pullDistance / 60}}>
                <FaSyncAlt className={refreshing ? "spin" : ""} style={{color: '#3b82f6'}} />
            </div>

            {/* CEO BROADCAST (Compact) */}
            {systemBroadcast && (
                <div style={styles.systemAlert}>
                    <FaBullhorn /> <span>{systemBroadcast}</span>
                </div>
            )}

            {/* MARQUEE (Fixed Colors: Dark Background, Orange Text) */}
            <div style={styles.marqueeWrapper}>
                <div style={styles.marqueeContent}>
                    <span>✦ JAI SHREE RAM ✦ WELCOME TO {currentRestId?.toUpperCase()} ✦ ENJOY YOUR MEAL ✦ </span>
                </div>
            </div>

            {/* CEO AD BANNER */}
            {globalBanner && (
                <div style={styles.adBanner}>
                    <img src={globalBanner} alt="Promo" style={{width:'100%', borderRadius:'12px', border:'1px solid rgba(59, 130, 246, 0.3)'}} />
                </div>
            )}

            {/* HEADER SECTION */}
            <div style={styles.header}>
                <div style={styles.headerRow}>
                    <div>
                        <h1 style={styles.restName}>
                            {currentRestId?.toUpperCase()} <span style={{color:'#3b82f6', fontWeight:400}}>X KOVIXA</span>
                        </h1>
                        <p style={styles.restSub}>
                            {currentTable ? `Table ${currentTable}` : "Takeaway / Walk-In"}
                        </p>
                    </div>
                    
                    {/* Cart Icon */}
                    <div onClick={() => totalQty > 0 ? navigate(cartLink) : toast.error("Cart is empty!")} style={styles.headerCart}>
                        <FaShoppingCart size={18} />
                        {totalQty > 0 && <span style={styles.badge}>{totalQty}</span>}
                    </div>
                </div>

                {/* Search Bar */}
                <div style={styles.searchContainer}>
                    <FaSearch style={styles.searchIcon} />
                    <input style={styles.searchInput} placeholder="Search for food..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* CATEGORIES */}
            <div style={styles.stickyNav}>
                <div style={styles.catScroll}>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            style={{...styles.catBtn, ...(activeCategory === cat ? styles.activeCat : {})}}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* FOOD GRID */}
            <div style={styles.grid}>
                {filteredDishes.map(dish => {
                    const itemInCart = cart.find(i => i._id === dish._id);
                    const qty = itemInCart ? itemInCart.quantity : 0;
                    const isAvailable = dish.isAvailable !== false;
                    return (
                        <div key={dish._id} style={{...styles.card, opacity: isAvailable ? 1 : 0.6}}>
                            <div style={styles.imgWrapper}>
                                <img src={dish.image || DEFAULT_IMG} alt={dish.name} style={styles.img} />
                                {!isAvailable && <div style={styles.soldOut}>SOLD OUT</div>}
                            </div>
                            <div style={styles.info}>
                                <div style={styles.row}>
                                    <h3 style={styles.dishTitle}>{dish.name}</h3>
                                    <p style={styles.desc}>{dish.category}</p>
                                </div>
                                <div style={{marginTop:'auto', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <span style={styles.price}>₹{dish.price}</span>
                                    {isAvailable ? (
                                        qty > 0 ? (
                                            <div style={styles.counter}>
                                                <button onClick={() => addToCart({...dish, quantity: -1})} style={styles.countBtn}><FaMinus size={10}/></button>
                                                <span style={styles.qtyNum}>{qty}</span>
                                                <button onClick={() => addToCart(dish)} style={styles.countBtn}><FaPlus size={10}/></button>
                                            </div>
                                        ) : <button onClick={() => addToCart(dish)} style={styles.addBtn}>ADD</button>
                                    ) : <button disabled style={styles.disabledBtn}>Unavailable</button>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* FLOATING CART BAR */}
            {totalQty > 0 && (
                <div style={styles.floatBarContainer}>
                    <div onClick={() => navigate(cartLink)} style={styles.floatBar}>
                        <div style={styles.floatInfo}>
                            <span style={styles.floatQty}>{totalQty} ITEMS</span>
                            <span style={styles.floatPrice}>₹{totalPrice}</span>
                        </div>
                        <div style={styles.viewCart}>View Cart <FaArrowRight style={{marginLeft:8}}/></div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#020617", color: "white", paddingBottom: "160px", fontFamily: "'Plus Jakarta Sans', sans-serif" },
    center: { display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', flexDirection:'column', background:'#020617' },
    
    // Alerts
    systemAlert: { background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '8px 15px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(59, 130, 246, 0.2)' },
    
    // ⚡️ MARQUEE FIX: Dark Background, Orange Text
    marqueeWrapper: { 
        background: '#0f172a', // Dark Blue/Black
        borderBottom: '1px solid #1e293b', 
        padding: '8px 0', 
        overflow: 'hidden' 
    },
    marqueeContent: { 
        display: 'inline-block', 
        paddingLeft: '100%', 
        animation: 'scroll 25s linear infinite', 
        color: '#f97316', // Orange Color for Saffron Look
        fontSize: '11px', 
        fontWeight: '900', 
        letterSpacing: '2px' 
    },

    adBanner: { padding: '0 15px', marginTop: '10px' },
    
    // Header
    header: { padding: "15px 15px 5px 15px" },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '10px' },
    restName: { fontSize: "18px", fontWeight: "900", letterSpacing: '-0.5px', margin: 0 },
    restSub: { fontSize: "11px", color: "#60a5fa", fontWeight: "600", marginTop: '2px' },
    
    headerCart: { position: 'relative', background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', cursor:'pointer' },
    headerBadge: { position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', fontSize: '9px', padding: '2px 5px', borderRadius: '10px', fontWeight: 'bold' },
    
    searchContainer: { position: "relative", marginBottom: '5px' },
    searchIcon: { position: "absolute", left: "12px", top: "12px", color: "#94a3b8", fontSize: '14px' },
    searchInput: { width: "100%", padding: "10px 15px 10px 40px", borderRadius: "12px", background: "#0f172a", border: "1px solid #1e293b", color: "white", outline: "none", fontSize: '14px' },
    
    stickyNav: { position: "sticky", top: 0, background: "rgba(2, 6, 23, 0.95)", backdropFilter: "blur(12px)", padding: "8px 0", zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.05)' },
    catScroll: { display: "flex", gap: "8px", padding: "0 15px", overflowX: "auto", scrollbarWidth: 'none' },
    catBtn: { padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap", border: '1px solid #1e293b', transition: '0.2s', cursor:'pointer', background: '#0f172a', color: '#94a3b8' },
    activeCat: { background: '#3b82f6', color: 'white', borderColor: '#3b82f6', fontWeight: '800', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)' },
    
    grid: { padding: "15px", display: "flex", flexDirection: "column", gap: "12px" },
    card: { background: "#0f172a", borderRadius: "16px", overflow: "hidden", border: "1px solid #1e293b", display: 'flex', height: '110px' },
    imgWrapper: { width: "110px", height: "100%", position: "relative" },
    img: { width: "100%", height: "100%", objectFit: "cover" },
    soldOut: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "900" },
    info: { padding: "12px", flex: 1, display: 'flex', flexDirection: 'column' },
    row: { marginBottom: 2 },
    dishTitle: { margin: 0, fontSize: "15px", fontWeight: "700", color: 'white' },
    price: { color: "#3b82f6", fontWeight: "900", fontSize: '16px' },
    desc: { color: "#64748b", fontSize: "10px", fontWeight: "600" },
    addBtn: { padding: "6px 16px", background: "#3b82f6", color: "#fff", fontWeight: "800", borderRadius: "8px", border: "none", fontSize: '11px', cursor:'pointer' },
    counter: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1e293b", borderRadius: "8px", width: "80px", border: '1px solid #3b82f6' },
    countBtn: { width: "26px", height: "28px", background: "transparent", border: "none", color: "#60a5fa", cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
    qtyNum: { fontWeight: "900", fontSize: '13px', color:'white' },
    
    floatBarContainer: { position: "fixed", bottom: "30px", left: "0", right: "0", padding: "0 20px", zIndex: 1000 },
    floatBar: { background: "#3b82f6", padding: "14px 20px", borderRadius: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 40px rgba(59, 130, 246, 0.4)", border: '1px solid rgba(255,255,255,0.1)' },
    floatInfo: { display: "flex", flexDirection: "column" },
    floatQty: { fontSize: "10px", color: "rgba(255,255,255,0.8)", fontWeight: "700" },
    floatPrice: { fontSize: "18px", fontWeight: "900", color: "white" },
    viewCart: { color: "white", fontWeight: "800", display: "flex", alignItems: "center", fontSize: "13px" },
    
    pullLoader: { width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', transition: '0.2s' },
    disabledBtn: { background: "#1e293b", color: "#64748b", padding: "6px", borderRadius: "8px", border: "none", fontSize: "10px" }
};

export default Menu;