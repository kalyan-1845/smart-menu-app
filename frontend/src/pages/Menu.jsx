import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import axios from "axios";
import { 
    FaSearch, FaPlus, FaMinus, FaShoppingCart, FaArrowRight, 
    FaLock, FaSyncAlt, FaLeaf, FaDrumstickBite, FaFire, FaStore, FaExclamationTriangle, FaBullhorn
} from "react-icons/fa";
import { toast } from "react-hot-toast"; 
import LoadingSpinner from "../components/LoadingSpinner";

const API_BASE = "https://smart-menu-app-production.up.railway.app/api";

const Menu = ({ cart, addToCart, setRestaurantId, setTableNum, setCart, customerId }) => {
    const params = useParams();
    const navigate = useNavigate(); 
    const currentRestId = params.restaurantId || params.id;
    const currentTable = params.table;

    // ⚡️ CACHE: Instant Load
    const [dishes, setDishes] = useState(() => {
        try {
            const cached = localStorage.getItem(`menu_cache_${currentRestId}`);
            return cached ? JSON.parse(cached) : [];
        } catch (e) { return []; }
    });

    const [activeCategory, setActiveCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(dishes.length === 0); 
    const [isSuspended, setIsSuspended] = useState(false);
    
    // CEO GLOBAL STATES
    const [systemBroadcast, setSystemBroadcast] = useState("");
    const [globalBanner, setGlobalBanner] = useState("");
    const [isMaintenance, setIsMaintenance] = useState(false);

    // Pull-to-refresh
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const startY = useRef(0);

    const DEFAULT_IMG = "https://placehold.co/400x300/1e293b/fbbf24?text=Tasty";

    // ✅ FETCH LOGIC
    const fetchMenu = async (isManual = false) => {
        if (!currentRestId) return;
        try {
            if (dishes.length === 0) setLoading(true);

            // 1. Get Real ID
            const idRes = await axios.get(`${API_BASE}/auth/owner-id/${currentRestId}`);
            const realMongoId = idRes.data.id;

            if (realMongoId) {
                // 2. Fetch Menu & Global Status
                const [menuRes, sysRes] = await Promise.all([
                    axios.get(`${API_BASE}/dishes?restaurantId=${realMongoId}&t=${Date.now()}`),
                    axios.get(`${API_BASE}/superadmin/system-status`)
                ]);
                
                // Set System Info
                setSystemBroadcast(sysRes.data.message || "");
                setGlobalBanner(sysRes.data.globalBanner || "");
                setIsMaintenance(sysRes.data.maintenance || false);

                if (menuRes.data.status === "suspended") {
                    setIsSuspended(true);
                } else {
                    const dishData = Array.isArray(menuRes.data) ? menuRes.data : (menuRes.data.dishes || []);
                    setDishes(dishData);
                    localStorage.setItem(`menu_cache_${currentRestId}`, JSON.stringify(dishData));
                }
            }
        } catch (err) {
            console.error("Fetch failed", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setPullDistance(0);
        }
    };

    useEffect(() => {
        if (!currentRestId) return;
        fetchMenu(); 
        const stockInterval = setInterval(() => { fetchMenu(); }, 30000);
        return () => clearInterval(stockInterval);
    }, [currentRestId]);

    // ✅ SESSION LOGIC
    useEffect(() => {
        const lastRest = localStorage.getItem("last_rest_scanned");
        if (lastRest !== currentRestId) {
            if (setCart) setCart([]); 
            localStorage.setItem("last_rest_scanned", currentRestId || "");
        }
        if (currentTable) {
            localStorage.setItem("last_table_scanned", currentTable);
            if (setTableNum) setTableNum(currentTable);
        } else {
            const savedTable = localStorage.getItem("last_table_scanned");
            if (savedTable && setTableNum) setTableNum(savedTable);
        }
        if (setRestaurantId) setRestaurantId(currentRestId);
    }, [currentRestId, currentTable, setRestaurantId, setTableNum, setCart]);

    // ⚡️ FILTERING
    const filteredDishes = useMemo(() => {
        let result = dishes;
        if (activeCategory !== "All") {
            result = result.filter(d => d.category === activeCategory);
        }
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(d => d.name.toLowerCase().includes(lowerTerm));
        }
        return result;
    }, [dishes, activeCategory, searchTerm]);

    const categories = useMemo(() => ["All", ...new Set(dishes.map(d => d.category))], [dishes]);
    const totalQty = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
    const totalPrice = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
    const cartLink = `/${currentRestId}/cart/${customerId}`;

    const handleAction = (dish, val = 1) => {
        if ("vibrate" in navigator) navigator.vibrate(40);
        addToCart(val === -1 ? {...dish, quantity: -1} : dish);
    };

    // Helper: Guess Veg/Non-Veg based on category/name
    const getDishTypeIcon = (dish) => {
        const txt = (dish.category + dish.name).toLowerCase();
        if (txt.includes('chicken') || txt.includes('mutton') || txt.includes('fish') || txt.includes('non')) {
            return <FaDrumstickBite color="#ef4444" size={12}/>; // Red for Non-Veg
        }
        return <FaLeaf color="#22c55e" size={12}/>; // Green for Veg
    };

    if (isMaintenance) return (
        <div style={styles.center}>
            <FaExclamationTriangle size={60} color="#f97316"/>
            <h1 style={{color:'white', marginTop:20, textAlign:'center', fontFamily:'Plus Jakarta Sans'}}>SERVER MAINTENANCE</h1>
            <p style={{color:'#666', padding:'0 40px', textAlign:'center'}}>Our systems are being upgraded. We will be back online shortly.</p>
        </div>
    );

    if (loading && dishes.length === 0) return <LoadingSpinner />;

    if (isSuspended) return (
        <div style={styles.center}>
            <div style={styles.lockIcon}><FaLock size={40} color="white"/></div>
            <h1 style={styles.closedTitle}>Restaurant Closed</h1>
            <p style={styles.closedSub}>We are currently not accepting orders.</p>
        </div>
    );

    return (
        <div style={styles.container} 
             onTouchStart={(e) => { if (window.scrollY === 0) startY.current = e.touches[0].pageY; }}
             onTouchMove={(e) => {
                const diff = e.touches[0].pageY - startY.current;
                if (window.scrollY === 0 && diff > 0 && diff < 80) setPullDistance(diff);
             }}
             onTouchEnd={() => {
                if (pullDistance > 60) { setRefreshing(true); fetchMenu(true); } 
                else setPullDistance(0);
             }}>
            
            {/* 🔄 PULL REFRESH INDICATOR */}
            <div style={{...styles.pullLoader, height: `${pullDistance}px`, opacity: pullDistance / 60}}>
                <div style={styles.refreshIconBox}>
                    <FaSyncAlt className={refreshing ? "spin" : ""} size={14} color="#f59e0b" />
                </div>
            </div>

            {/* CEO GLOBAL BROADCAST ALERT */}
            {systemBroadcast && (
                <div style={styles.systemAlert}>
                    <FaBullhorn /> <span>{systemBroadcast}</span>
                </div>
            )}

            {/* 🟠 PREMIUM TICKER */}
            <div style={styles.marqueeWrapper}>
                <div style={styles.marqueeContent}>
                    <span>✦ KOVIXA POWERED ✦ LIVE KITCHEN ✦ FRESH INGREDIENTS ✦ </span>
                    <span>✦ FAST SERVICE ✦ HYGIENIC ✦ BEST TASTE ✦ </span>
                </div>
            </div>

            {/* CEO GLOBAL AD BANNER */}
            {globalBanner && (
                <div style={styles.adBanner}>
                    <img src={globalBanner} alt="Promo" style={{width:'100%', borderRadius:'15px'}} />
                </div>
            )}

            {/* 🏛️ HEADER SECTION */}
            <div style={styles.header}>
                <div style={styles.heroRow}>
                    <div style={styles.brandBox}>
                        <div style={styles.storeIcon}><FaStore size={18} /></div>
                        <div>
                            <h1 style={styles.restName}>{currentRestId?.toUpperCase()}</h1>
                            <div style={styles.tableBadge}>
                                {currentTable ? `Table ${currentTable}` : "Takeaway / Delivery"}
                            </div>
                        </div>
                    </div>
                    {/* Header Cart Icon */}
                    <div onClick={() => totalQty > 0 ? navigate(cartLink) : toast.error("Cart is empty!")} style={styles.headerCart}>
                        <FaShoppingCart size={20} />
                        {totalQty > 0 && <span style={styles.headerBadge}>{totalQty}</span>}
                    </div>
                </div>

                {/* 🔍 FLOATING SEARCH */}
                <div style={styles.searchWrapper}>
                    <FaSearch style={styles.searchIcon} />
                    <input 
                        style={styles.searchInput} 
                        placeholder="Search for dishes..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>
            </div>

            {/* 📑 CATEGORY PILLS (Sticky) */}
            <div style={styles.stickyNav}>
                <div style={styles.catScroll}>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            style={{
                                ...styles.catBtn, 
                                ...(activeCategory === cat ? styles.catBtnActive : {})
                            }}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* 🍱 DISH GRID */}
            <div style={styles.grid}>
                {filteredDishes.map(dish => {
                    const itemInCart = cart.find(i => i._id === dish._id);
                    const qty = itemInCart ? itemInCart.quantity : 0;
                    const isAvailable = dish.isAvailable !== false;

                    return (
                        <div key={dish._id} style={{...styles.card, opacity: isAvailable ? 1 : 0.6, pointerEvents: isAvailable ? 'auto' : 'none'}}>
                            
                            {/* Left Info Side */}
                            <div style={styles.info}>
                                <div style={styles.dishHeader}>
                                    <div style={styles.dishTypeIcon}>{getDishTypeIcon(dish)}</div>
                                    {dish.ratings?.average >= 4.5 && (
                                        <div style={styles.bestsellerBadge}><FaFire size={10}/> Best</div>
                                    )}
                                </div>
                                
                                <h3 style={styles.dishTitle}>{dish.name}</h3>
                                <p style={styles.desc}>{dish.category}</p>
                                <div style={styles.priceRow}>
                                    <span style={styles.price}>₹{dish.price}</span>
                                </div>
                            </div>

                            {/* Right Image Side */}
                            <div style={styles.imgWrapper}>
                                <img 
                                    src={dish.image || DEFAULT_IMG} 
                                    alt={dish.name} 
                                    style={styles.img} 
                                    loading="lazy" 
                                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMG; }}
                                />
                                {!isAvailable && <div style={styles.soldOutBadge}>SOLD OUT</div>}

                                {/* 🔘 ACTION BUTTON */}
                                <div style={styles.actionBox}>
                                    {isAvailable ? (
                                        qty > 0 ? (
                                            <div style={styles.counter}>
                                                <button onClick={() => handleAction(dish, -1)} style={styles.countBtn}><FaMinus size={10}/></button>
                                                <span style={styles.qtyNum}>{qty}</span>
                                                <button onClick={() => handleAction(dish)} style={styles.countBtn}><FaPlus size={10}/></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleAction(dish)} style={styles.addBtn}>
                                                ADD
                                            </button>
                                        )
                                    ) : (
                                        <div style={styles.unavailableBtn}>Busy</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 🛒 FLOATING CART "ISLAND" */}
            {totalQty > 0 && (
                <div style={styles.floatBarContainer} className="slide-up">
                    <div onClick={() => navigate(cartLink)} style={styles.floatBar}>
                        <div style={styles.floatLeft}>
                            <div style={styles.floatCount}>{totalQty}</div>
                            <div style={styles.floatMeta}>
                                <span style={styles.floatLabel}>Total</span>
                                <span style={styles.floatPrice}>₹{totalPrice}</span>
                            </div>
                        </div>
                        <div style={styles.viewCart}>
                            View Cart <FaArrowRight style={{marginLeft:8, fontSize:14}}/>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                
                body { background-color: #020617; font-family: 'Plus Jakarta Sans', sans-serif; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes slideUp { from { transform: translateY(100px); opacity:0; } to { transform: translateY(0); opacity:1; } }
                
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                
                ::-webkit-scrollbar { display: none; }
                * { -webkit-tap-highlight-color: transparent; user-select: none; box-sizing: border-box; }
            `}</style>
        </div>
    );
};

// 🎨 "MIDNIGHT GLASS" THEME SYSTEM
const styles = {
    container: { minHeight: "100vh", background: "#020617", paddingBottom: "140px", position: 'relative' },
    
    // Refresh
    pullLoader: { width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', transition: '0.2s' },
    refreshIconBox: { background: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: '50%' },

    // Lock Screen & Maintenance
    center: { display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', flexDirection:'column', background: '#020617' },
    lockIcon: { background: 'linear-gradient(135deg, #ef4444, #b91c1c)', padding: 20, borderRadius: '25px', marginBottom: 20, boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)' },
    closedTitle: { color: 'white', fontSize: 24, fontWeight: '800', margin: 0, fontFamily: 'Plus Jakarta Sans' },
    closedSub: { color: '#94a3b8', marginTop: 10, fontFamily: 'Plus Jakarta Sans' },

    // Marquee & Alerts
    marqueeWrapper: { background: '#1e1b4b', borderBottom: '1px solid #312e81', padding: '8px 0', overflow: 'hidden', whiteSpace: 'nowrap' },
    marqueeContent: { display: 'inline-block', animation: 'scroll 20s linear infinite', color: '#a5b4fc', fontSize: '10px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' },
    systemAlert: { background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', padding: '12px 20px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(249, 115, 22, 0.3)' },
    adBanner: { padding: '0 20px', marginTop: '15px' },

    // Header
    header: { padding: "20px", background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)" },
    heroRow: { display: "flex", justifyContent: "space-between", alignItems: 'center', marginBottom: 20 },
    brandBox: { display: 'flex', gap: 12, alignItems: 'center' },
    storeIcon: { width: 40, height: 40, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' },
    restName: { fontSize: "22px", fontWeight: "800", margin: 0, color: 'white', letterSpacing: "-0.5px" },
    tableBadge: { fontSize: "12px", color: "#94a3b8", fontWeight: "600" },
    headerCart: { position: 'relative', background: '#1e293b', padding: '10px', borderRadius: '12px', color: '#f97316', border: '1px solid #334155' },
    headerBadge: { position: 'absolute', top: '-5px', right: '-5px', background: '#22c55e', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight:'700' },

    // Search
    searchWrapper: { position: "relative" },
    searchIcon: { position: "absolute", left: "16px", top: "16px", color: "#64748b" },
    searchInput: { width: "100%", padding: "16px 16px 16px 48px", borderRadius: "16px", background: "#1e293b", border: "1px solid #334155", color: "white", fontSize: "15px", outline: "none", transition: '0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' },

    // Sticky Nav
    stickyNav: { position: "sticky", top: 0, background: "rgba(2, 6, 23, 0.95)", backdropFilter: "blur(12px)", padding: "15px 0", zIndex: 90, borderBottom: "1px solid #1e293b" },
    catScroll: { display: "flex", gap: "10px", padding: "0 20px", overflowX: "auto" },
    catBtn: { padding: "10px 20px", borderRadius: "30px", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", background: 'transparent', border: '1px solid #334155', color: '#94a3b8', transition: "0.2s" },
    catBtnActive: { background: '#f59e0b', color: '#000', borderColor: '#f59e0b', fontWeight: '800', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' },

    // Grid
    grid: { padding: "20px", display: "flex", flexDirection: 'column', gap: "16px" },
    
    // Card
    card: { background: "#111827", borderRadius: "20px", border: "1px solid #1f2937", display: 'flex', justifyContent: 'space-between', padding: "16px", position: 'relative', overflow: 'visible' },
    
    // Left Info
    info: { flex: 1, display: 'flex', flexDirection: 'column', paddingRight: 10 },
    dishHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
    dishTypeIcon: { border: '1px solid #374151', borderRadius: 4, padding: 2, display: 'flex' },
    bestsellerBadge: { fontSize: 9, background: 'linear-gradient(90deg, #f59e0b, #d97706)', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: '700', display: 'flex', alignItems: 'center', gap: 3 },
    
    dishTitle: { margin: 0, fontSize: "16px", fontWeight: "700", color:'#f3f4f6', lineHeight: '1.3', marginBottom: 4 },
    desc: { color: "#6b7280", fontSize: "12px", fontWeight: '500', marginBottom: 12 },
    priceRow: { marginTop: 'auto' },
    price: { color: "#f59e0b", fontWeight: "800", fontSize: "16px" },

    // Right Image
    imgWrapper: { width: "110px", position: "relative", display: 'flex', flexDirection: 'column', alignItems: 'center' },
    img: { width: "110px", height: "110px", objectFit: "cover", borderRadius: "16px", boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
    soldOutBadge: { position: "absolute", top: 40, background: "rgba(0,0,0,0.8)", color: "#ef4444", padding: "4px 8px", borderRadius: 6, fontSize: "10px", fontWeight: "900", backdropFilter: 'blur(4px)' },

    // Action Button Area (Overlapping Image)
    actionBox: { marginTop: -15, zIndex: 2 },
    addBtn: { width: "80px", padding: "8px", background: "#f8fafc", color: "#0f172a", fontWeight: "800", borderRadius: "10px", border: "none", fontSize: '13px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', cursor: 'pointer' },
    counter: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1e293b", borderRadius: "10px", width: "85px", height: "32px", border: '1px solid #334155', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' },
    countBtn: { width: "28px", height: "100%", background: "transparent", border: "none", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", cursor: 'pointer' },
    qtyNum: { fontWeight: "700", color: "white", fontSize: '13px' },
    unavailableBtn: { background: '#374151', color: '#9ca3af', fontSize: 10, padding: '8px 12px', borderRadius: 8, fontWeight: 700 },

    // Floating Cart (Island Style)
    floatBarContainer: { position: "fixed", bottom: "30px", left: "0", right: "0", padding: "0 20px", zIndex: 100 },
    floatBar: { background: "#f59e0b", padding: "12px 20px", borderRadius: "100px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 20px 50px rgba(245, 158, 11, 0.3)", cursor: 'pointer' },
    floatLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    floatCount: { background: '#000', color: '#f59e0b', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: '800' },
    floatMeta: { display: 'flex', flexDirection: 'column' },
    floatLabel: { fontSize: 9, color: '#78350f', fontWeight: '700', textTransform: 'uppercase' },
    floatPrice: { fontSize: 15, fontWeight: '900', color: '#0f172a' },
    viewCart: { color: "#0f172a", fontWeight: "800", display: "flex", alignItems: "center", fontSize: "14px" }
};

export default Menu;