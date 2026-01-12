import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import axios from "axios";
import { FaSearch, FaPlus, FaMinus, FaShoppingCart, FaArrowRight, FaLock, FaSyncAlt } from "react-icons/fa";
import { toast } from "react-hot-toast"; 
import LoadingSpinner from "../components/LoadingSpinner";

const API_BASE = "https://smart-menu-app-production.up.railway.app/api";

const Menu = ({ cart, addToCart, setRestaurantId, setTableNum, setCart, customerId }) => {
    const params = useParams();
    const navigate = useNavigate(); 
    const currentRestId = params.restaurantId || params.id;
    const currentTable = params.table;

    // ⚡️ OPTIMIZATION: Instant Load from Cache
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
    
    // Pull-to-refresh state
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const startY = useRef(0);

    const DEFAULT_IMG = "https://placehold.co/400x300/222/orange?text=Yummy";

    // ✅ FETCH LOGIC
    const fetchMenu = async (isManual = false) => {
        if (!currentRestId) return;
        try {
            if (dishes.length === 0) setLoading(true);

            // 1. Get Real ID
            const idRes = await axios.get(`${API_BASE}/auth/owner-id/${currentRestId}`);
            const realMongoId = idRes.data.id;

            if (realMongoId) {
                // 2. Fetch Menu
                const res = await axios.get(`${API_BASE}/dishes?restaurantId=${realMongoId}&t=${Date.now()}`);
                
                if (res.data.status === "suspended") {
                    setIsSuspended(true);
                } else {
                    const dishData = Array.isArray(res.data) ? res.data : (res.data.dishes || []);
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

    // ✅ SESSION & TABLE HANDLING (Isolated Cart Logic)
    useEffect(() => {
        const lastRest = localStorage.getItem("last_rest_scanned");
        
        // If restaurant changes, clear local cart to avoid mixing data
        if (lastRest !== currentRestId) {
            if (setCart) setCart([]); 
            localStorage.setItem("last_rest_scanned", currentRestId || "");
        }

        // Set Table Logic
        if (currentTable) {
            localStorage.setItem("last_table_scanned", currentTable);
            if (setTableNum) setTableNum(currentTable);
        } else {
            // Retrieve last known table if not in URL (for cart persistence)
            const savedTable = localStorage.getItem("last_table_scanned");
            if (savedTable && setTableNum) setTableNum(savedTable);
        }

        if (setRestaurantId) setRestaurantId(currentRestId);
    }, [currentRestId, currentTable, setRestaurantId, setTableNum, setCart]);

    // ⚡️ OPTIMIZATION: Memoized Filtering
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

    // ✅ UNIQUE CART LINK (Per Customer ID)
    const cartLink = `/${currentRestId}/cart/${customerId}`;

    const handleCartClick = () => {
        if (totalQty === 0) {
            toast.error("Cart is empty! Add items first.");
        } else {
            navigate(cartLink);
        }
    };

    const handleAction = (dish, val = 1) => {
        if ("vibrate" in navigator) navigator.vibrate(40);
        addToCart(val === -1 ? {...dish, quantity: -1} : dish);
    };

    if (loading && dishes.length === 0) return <LoadingSpinner />;

    if (isSuspended) return (
        <div style={styles.center}>
            <FaLock size={60} color="#f97316"/>
            <h1 style={{color:'white', marginTop:20}}>STORE CLOSED</h1>
        </div>
    );

    return (
        <div style={styles.container} 
             onTouchStart={(e) => { if (window.scrollY === 0) startY.current = e.touches[0].pageY; }}
             onTouchMove={(e) => {
                const diff = e.touches[0].pageY - startY.current;
                if (window.scrollY === 0 && diff > 0 && diff < 70) setPullDistance(diff);
             }}
             onTouchEnd={() => {
                if (pullDistance > 50) { setRefreshing(true); fetchMenu(true); } 
                else setPullDistance(0);
             }}>
            
            <div style={{...styles.pullLoader, height: `${pullDistance}px`, opacity: pullDistance / 60}}>
                <FaSyncAlt className={refreshing ? "spin" : ""} style={{color: '#f97316'}} />
            </div>

            {/* 🟠 MARQUEE UI */}
            <div style={styles.marqueeWrapper}>
                <div style={styles.marqueeContent}>
                    <span>✦ JAI SHREE RAM ✦ JAI SHREE RAM ✦ JAI SHREE RAM ✦ JAI SHREE RAM ✦ </span>
                    <span>✦ JAI SHREE RAM ✦ JAI SHREE RAM ✦ JAI SHREE RAM ✦ JAI SHREE RAM ✦ </span>
                </div>
            </div>

            <div style={styles.hero}>
                <div style={styles.heroContent}>
                    <div>
                        <h1 style={styles.restName}>{currentRestId?.toUpperCase()}</h1>
                        <p style={styles.restSub}>{currentTable ? `Table No: ${currentTable}` : "Digital Menu"}</p>
                    </div>
                    
                    <div onClick={handleCartClick} style={{...styles.headerCart, opacity: totalQty === 0 ? 0.5 : 1, cursor: 'pointer'}}>
                        <FaShoppingCart size={20} />
                        {totalQty > 0 && <span style={styles.headerBadge}>{totalQty}</span>}
                    </div>

                </div>
                <div style={styles.searchContainer}>
                    <FaSearch style={styles.searchIcon} />
                    <input 
                        style={styles.searchInput} 
                        placeholder="Search food..." 
                        value={searchTerm} 
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
                {filteredDishes.map(dish => {
                    const itemInCart = cart.find(i => i._id === dish._id);
                    const qty = itemInCart ? itemInCart.quantity : 0;
                    const isAvailable = dish.isAvailable !== false;

                    return (
                        <div key={dish._id} style={{...styles.card, opacity: isAvailable ? 1 : 0.7}}>
                            <div style={styles.imgWrapper}>
                                <img 
                                    src={dish.image || DEFAULT_IMG} 
                                    alt={dish.name} 
                                    style={styles.img} 
                                    loading="lazy" 
                                    decoding="async"
                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100?text=Yummy"; }}
                                />
                                {!isAvailable && <div style={styles.soldOut}>OUT OF STOCK</div>}
                            </div>
                            <div style={styles.info}>
                                <div style={styles.row}>
                                    <h3 style={styles.dishTitle}>{dish.name}</h3>
                                    <span style={styles.price}>₹{dish.price}</span>
                                </div>
                                <p style={styles.desc}>{dish.category}</p>
                                
                                <div style={{marginTop:'auto', display:'flex', justifyContent:'flex-end'}}>
                                    {isAvailable ? (
                                        qty > 0 ? (
                                            <div style={styles.counter}>
                                                <button onClick={() => handleAction(dish, -1)} style={styles.countBtn}><FaMinus size={10}/></button>
                                                <span style={styles.qtyNum}>{qty}</span>
                                                <button onClick={() => handleAction(dish)} style={styles.countBtn}><FaPlus size={10}/></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleAction(dish)} style={styles.addBtn}>ADD</button>
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

            {/* ✅ FIXED FLOATING CART FOR CUSTOMER */}
            {totalQty > 0 && (
                <div style={styles.floatBarContainer} className="slide-up">
                    <div onClick={() => navigate(cartLink)} style={{...styles.floatBar, cursor: 'pointer'}}>
                        <div style={styles.floatInfo}>
                            <span style={styles.floatQty}>{totalQty} ITEMS</span>
                            <span style={styles.floatPrice}>₹{totalPrice}</span>
                        </div>
                        <div style={styles.viewCart}>
                            View Cart <FaArrowRight style={{marginLeft:8}}/>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .slide-up { animation: slideUp 0.3s ease-out; }
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                
                ::-webkit-scrollbar { display: none; }
                * { -webkit-tap-highlight-color: transparent; user-select: none; }
            `}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#050505", color: "white", paddingBottom: "120px", fontFamily: "'Inter', sans-serif" },
    center: { display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', flexDirection:'column' },
    pullLoader: { width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', transition: '0.2s' },
    
    // Marquee
    marqueeWrapper: { 
        background: 'linear-gradient(90deg, #4a2c0f, #1a0b00, #4a2c0f)', 
        borderBottom: '2px solid #f97316', 
        padding: '10px 0', 
        overflow: 'hidden', 
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)' 
    },
    marqueeContent: { 
        display: 'inline-block', 
        paddingLeft: '100%', 
        animation: 'scroll 25s linear infinite', 
        color: '#ffedd5', 
        fontSize: '12px', 
        fontWeight: '900', 
        letterSpacing: '3px',
        textShadow: '0 0 10px rgba(249, 115, 22, 0.8)'
    },

    hero: { padding: "25px 20px", background: "linear-gradient(180deg, #0f0f0f 0%, #050505 100%)" },
    heroContent: { display: "flex", justifyContent: "space-between", alignItems: 'center' },
    restName: { fontSize: "28px", fontWeight: "900", margin: 0, letterSpacing: "-1px" },
    restSub: { fontSize: "13px", color: "#f97316", fontWeight: "700" },
    headerCart: { position: 'relative', background: '#111', padding: '12px', borderRadius: '15px', border: '1px solid #222', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    headerBadge: { position: 'absolute', top: '-5px', right: '-5px', background: '#22c55e', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: '900' },
    searchContainer: { position: "relative", marginTop: 20 },
    searchIcon: { position: "absolute", left: "15px", top: "14px", color: "#555" },
    searchInput: { width: "100%", padding: "14px 15px 14px 45px", borderRadius: "16px", background: "#0a0a0a", border: "1px solid #111", color: "white", fontSize: "15px", outline: "none" },
    stickyNav: { position: "sticky", top: 0, background: "rgba(5, 5, 5, 0.8)", backdropFilter: "blur(20px)", padding: "15px 0", zIndex: 100, borderBottom: "1px solid #111" },
    catScroll: { display: "flex", gap: "10px", padding: "0 20px", overflowX: "auto" },
    catBtn: { padding: "10px 22px", borderRadius: "14px", fontSize: "12px", fontWeight: "900", whiteSpace: "nowrap", border: '1px solid #111', transition: "0.3s", textTransform: 'uppercase' },
    grid: { padding: "15px", display: "grid", gap: "12px" },
    card: { background: "#0a0a0a", borderRadius: "22px", overflow: "hidden", border: "1px solid #111", display: 'flex', height: '140px' },
    imgWrapper: { width: "130px", height: "100%", position: "relative", background: '#111' },
    img: { width: "100%", height: "100%", objectFit: "cover" },
    soldOut: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "900", textAlign:'center', padding:5 },
    info: { padding: "15px", flex: 1, display: 'flex', flexDirection: 'column' },
    row: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 5 },
    dishTitle: { margin: 0, fontSize: "16px", fontWeight: "800", color:'#fff', lineHeight: '1.2' },
    price: { color: "#f97316", fontWeight: "900", fontSize: "17px" },
    desc: { color: "#444", fontSize: "11px", fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },
    addBtn: { width: "75px", padding: "10px", background: "#f97316", color: "#fff", fontWeight: "900", borderRadius: "12px", border: "none", fontSize: '12px' },
    counter: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111", borderRadius: "12px", width: "90px", border: '1px solid #f97316' },
    countBtn: { width: "30px", height: "35px", background: "transparent", border: "none", color: "#f97316", display: "flex", alignItems: "center", justifyContent: "center" },
    qtyNum: { fontWeight: "900", color: "white", fontSize: '14px' },
    
    // Fixed Cart Bar
    floatBarContainer: { position: "fixed", bottom: "30px", left: "0", right: "0", padding: "0 20px", zIndex: 1000 },
    floatBar: { background: "#22c55e", padding: "18px 25px", borderRadius: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" },
    floatInfo: { display: "flex", flexDirection: "column" },
    floatQty: { fontSize: "10px", color: "#064e3b", fontWeight: "900" },
    floatPrice: { fontSize: "20px", fontWeight: "900", color: "white" },
    viewCart: { color: "white", fontWeight: "900", display: "flex", alignItems: "center", fontSize: "15px" },
    disabledBtn: { background: "#111", color: "#333", padding: "10px", borderRadius: "12px", border: "none", fontSize: "11px", fontWeight: "800" }
};

export default Menu;