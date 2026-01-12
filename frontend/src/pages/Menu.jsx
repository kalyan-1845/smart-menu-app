import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import axios from "axios";
import { FaSearch, FaPlus, FaMinus, FaShoppingCart, FaArrowRight, FaLock, FaSyncAlt, FaBullhorn, FaExclamationTriangle } from "react-icons/fa";
import { toast } from "react-hot-toast"; 
import LoadingSpinner from "../components/LoadingSpinner";

const API_BASE = "https://smart-menu-app-production.up.railway.app/api";

const Menu = ({ cart, addToCart, setRestaurantId, setTableNum, setCart, customerId }) => {
    const params = useParams();
    const navigate = useNavigate(); 
    const currentRestId = params.restaurantId || params.id;
    const currentTable = params.table;

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
    const [isSuspended, setIsSuspended] = useState(false);
    
    // --- CEO GLOBAL STATES ---
    const [systemBroadcast, setSystemBroadcast] = useState("");
    const [globalBanner, setGlobalBanner] = useState("");
    const [isMaintenance, setIsMaintenance] = useState(false);

    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const startY = useRef(0);

    const DEFAULT_IMG = "https://placehold.co/400x300/222/orange?text=Yummy";

    const fetchMenu = async () => {
        if (!currentRestId) return;
        try {
            const idRes = await axios.get(`${API_BASE}/auth/owner-id/${currentRestId}`);
            const realMongoId = idRes.data.id;

            // Fetch Menu & Global System Status at once
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

    useEffect(() => {
        const lastRest = localStorage.getItem("last_rest_scanned");
        if (lastRest !== currentRestId) {
            if (setCart) setCart([]); 
            localStorage.setItem("last_rest_scanned", currentRestId || "");
        }
        if (currentTable) {
            localStorage.setItem("last_table_scanned", currentTable);
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
            <FaExclamationTriangle size={60} color="#f97316"/>
            <h1 style={{color:'white', marginTop:20, textAlign:'center'}}>SERVER MAINTENANCE</h1>
            <p style={{color:'#666', padding:'0 40px', textAlign:'center'}}>Our systems are being upgraded. We will be back online in a few minutes.</p>
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
            
            <div style={{...styles.pullLoader, height: `${pullDistance}px`, opacity: pullDistance / 60}}>
                <FaSyncAlt className={refreshing ? "spin" : ""} style={{color: '#f97316'}} />
            </div>

            {/* CEO GLOBAL BROADCAST ALERT */}
            {systemBroadcast && (
                <div style={styles.systemAlert}>
                    <FaBullhorn /> <span>{systemBroadcast}</span>
                </div>
            )}

            {/* MARQUEE UI */}
            <div style={styles.marqueeWrapper}>
                <div style={styles.marqueeContent}>
                    <span>✦ JAI SHREE RAM ✦ JAI SHREE RAM ✦ JAI SHREE RAM ✦ JAI SHREE RAM ✦ </span>
                </div>
            </div>

            {/* CEO GLOBAL AD BANNER */}
            {globalBanner && (
                <div style={styles.adBanner}>
                    <img src={globalBanner} alt="Promo" style={{width:'100%', borderRadius:'15px'}} />
                </div>
            )}

            <div style={styles.hero}>
                <div style={styles.heroContent}>
                    <div>
                        <h1 style={styles.restName}>{currentRestId?.toUpperCase()}</h1>
                        <p style={styles.restSub}>{currentTable ? `Table No: ${currentTable}` : "Digital Menu"}</p>
                    </div>
                    <div onClick={() => totalQty > 0 ? navigate(cartLink) : toast.error("Cart is empty!")} style={styles.headerCart}>
                        <FaShoppingCart size={20} />
                        {totalQty > 0 && <span style={styles.headerBadge}>{totalQty}</span>}
                    </div>
                </div>
                <div style={styles.searchContainer}>
                    <FaSearch style={styles.searchIcon} />
                    <input style={styles.searchInput} placeholder="Search food..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            <div style={styles.stickyNav}>
                <div style={styles.catScroll}>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            style={{...styles.catBtn, background: activeCategory === cat ? '#f97316' : '#18181b', color: activeCategory === cat ? 'white' : '#a1a1aa'}}>
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
                        <div key={dish._id} style={{...styles.card, opacity: isAvailable ? 1 : 0.6}}>
                            <div style={styles.imgWrapper}>
                                <img src={dish.image || DEFAULT_IMG} alt={dish.name} style={styles.img} />
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
    container: { minHeight: "100vh", background: "#050505", color: "white", paddingBottom: "120px" },
    center: { display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', flexDirection:'column', background:'#050505' },
    systemAlert: { background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', padding: '12px 20px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(249, 115, 22, 0.3)' },
    adBanner: { padding: '0 20px', marginTop: '15px' },
    pullLoader: { width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', transition: '0.2s' },
    marqueeWrapper: { background: 'linear-gradient(90deg, #4a2c0f, #1a0b00, #4a2c0f)', borderBottom: '2px solid #f97316', padding: '8px 0', overflow: 'hidden' },
    marqueeContent: { display: 'inline-block', paddingLeft: '100%', animation: 'scroll 25s linear infinite', color: '#ffedd5', fontSize: '11px', fontWeight: '900', letterSpacing: '2px' },
    hero: { padding: "20px" },
    heroContent: { display: "flex", justifyContent: "space-between", alignItems: 'center' },
    restName: { fontSize: "24px", fontWeight: "950" },
    restSub: { fontSize: "12px", color: "#f97316", fontWeight: "700" },
    headerCart: { position: 'relative', background: '#111', padding: '12px', borderRadius: '15px', color: '#f97316' },
    headerBadge: { position: 'absolute', top: '-5px', right: '-5px', background: '#22c55e', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' },
    searchContainer: { position: "relative", marginTop: 15 },
    searchIcon: { position: "absolute", left: "15px", top: "14px", color: "#444" },
    searchInput: { width: "100%", padding: "12px 15px 12px 45px", borderRadius: "12px", background: "#0a0a0a", border: "1px solid #111", color: "white", outline: "none" },
    stickyNav: { position: "sticky", top: 0, background: "rgba(5, 5, 5, 0.9)", backdropFilter: "blur(10px)", padding: "10px 0", zIndex: 100 },
    catScroll: { display: "flex", gap: "8px", padding: "0 20px", overflowX: "auto" },
    catBtn: { padding: "8px 18px", borderRadius: "10px", fontSize: "11px", fontWeight: "900", whiteSpace: "nowrap", border: '1px solid #222' },
    grid: { padding: "15px", display: "grid", gap: "10px" },
    card: { background: "#0a0a0a", borderRadius: "18px", overflow: "hidden", border: "1px solid #111", display: 'flex', height: '120px' },
    imgWrapper: { width: "110px", height: "100%", position: "relative" },
    img: { width: "100%", height: "100%", objectFit: "cover" },
    soldOut: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "900" },
    info: { padding: "12px", flex: 1, display: 'flex', flexDirection: 'column' },
    row: { display: "flex", justifyContent: "space-between", gap: 5 },
    dishTitle: { margin: 0, fontSize: "15px", fontWeight: "800" },
    price: { color: "#f97316", fontWeight: "900" },
    desc: { color: "#444", fontSize: "10px", textTransform: 'uppercase', marginTop: 4 },
    addBtn: { width: "70px", padding: "8px", background: "#f97316", color: "#fff", fontWeight: "900", borderRadius: "10px", border: "none", fontSize: '11px' },
    counter: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111", borderRadius: "10px", width: "85px", border: '1px solid #f97316' },
    countBtn: { width: "28px", height: "32px", background: "transparent", border: "none", color: "#f97316" },
    qtyNum: { fontWeight: "900", fontSize: '13px' },
    floatBarContainer: { position: "fixed", bottom: "25px", left: "0", right: "0", padding: "0 20px", zIndex: 1000 },
    floatBar: { background: "#22c55e", padding: "15px 20px", borderRadius: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 15px 30px rgba(0,0,0,0.4)" },
    floatInfo: { display: "flex", flexDirection: "column" },
    floatQty: { fontSize: "9px", color: "#064e3b", fontWeight: "900" },
    floatPrice: { fontSize: "18px", fontWeight: "900", color: "white" },
    viewCart: { color: "white", fontWeight: "900", display: "flex", alignItems: "center", fontSize: "14px" },
    disabledBtn: { background: "#111", color: "#333", padding: "8px", borderRadius: "10px", border: "none", fontSize: "10px" }
};

export default Menu;