import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { 
    FaSearch, FaPlus, FaMinus, FaStar, FaArrowRight, 
    FaLock, FaSyncAlt, FaCommentAlt, FaSpinner 
} from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";
import FeedbackModal from "../components/FeedbackModal"; 

const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";

const Menu = ({ cart, addToCart, setRestaurantId, setTableNum, setCart }) => {
    const params = useParams();
    const currentRestId = params.restaurantId || params.id;
    const currentTable = params.table;

    // ✅ CACHING LAYER (FIXED): Prevents crash if cache has old Object format
    const [dishes, setDishes] = useState(() => {
        try {
            const cached = localStorage.getItem(`menu_cache_${currentRestId}`);
            if (!cached) return [];
            
            const parsed = JSON.parse(cached);
            
            // 🛡️ SAFETY CHECK: Force it to be an Array
            if (Array.isArray(parsed)) return parsed;
            if (parsed.dishes && Array.isArray(parsed.dishes)) return parsed.dishes;
            
            return []; // Fallback to empty array if data is corrupted
        } catch (e) {
            return [];
        }
    });
    
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(dishes.length === 0); 
    const [isSuspended, setIsSuspended] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDishForFeedback, setSelectedDishForFeedback] = useState(null); 
    const startY = useRef(0);

    const DEFAULT_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";

    const fetchMenu = async () => {
        if (!currentRestId) return;
        try {
            // ✅ SYNC NODE: Fetches real-time data
            const res = await axios.get(`${API_BASE}/dishes?restaurantId=${currentRestId}&t=${Date.now()}`);
            
            // 🛡️ PARSE DATA: Handle both Array and Object formats
            let dishData = [];
            if (Array.isArray(res.data)) {
                dishData = res.data;
            } else if (res.data.dishes && Array.isArray(res.data.dishes)) {
                dishData = res.data.dishes;
            }

            setDishes(dishData);
            
            // Update Cache with CLEAN Array
            localStorage.setItem(`menu_cache_${currentRestId}`, JSON.stringify(dishData));
            setIsSuspended(false);

        } catch (err) { 
            // 🛑 KILL SWITCH DETECTION
            if (err.response && err.response.status === 503) {
                console.warn("⛔ MENU KILLED BY ADMIN");
                setIsSuspended(true);
            } else {
                console.error("Cloud Sync Error", err); 
            }
        } finally { 
            setLoading(false); 
            setRefreshing(false); 
            setPullDistance(0); 
        }
    };

    useEffect(() => { 
        fetchMenu();
        if (setRestaurantId) setRestaurantId(currentRestId);
        if (setTableNum && currentTable) setTableNum(currentTable);
    }, [currentRestId]);

    const filteredDishes = useMemo(() => {
        return dishes.filter(d => {
            const matchesCat = activeCategory === "All" || d.category === activeCategory;
            const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCat && matchesSearch;
        });
    }, [dishes, activeCategory, searchTerm]);

    const categories = useMemo(() => ["All", ...new Set(dishes.map(d => d.category))], [dishes]);

    // --- 🚜 PULL TO REFRESH LOGIC ---
    const onTouchStart = (e) => { if (window.scrollY === 0) startY.current = e.touches[0].pageY; };
    const onTouchMove = (e) => {
        const diff = e.touches[0].pageY - startY.current;
        if (window.scrollY === 0 && diff > 0 && diff < 80) setPullDistance(diff);
    };
    const onTouchEnd = () => {
        if (pullDistance > 60) { setRefreshing(true); fetchMenu(); } 
        else setPullDistance(0);
    };

    const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    if (loading && dishes.length === 0) return <LoadingSpinner />;
    
    // 🔒 THE MAINTENANCE SCREEN (Shows if isSuspended is true)
    if (isSuspended) return (
        <div style={styles.center}>
            <FaLock size={60} color="#f97316"/>
            <h1 style={{color:'white', marginTop:20, fontSize: '24px', fontWeight: '900'}}>UNDER MAINTENANCE</h1>
            <p style={{color: '#666', marginTop: 10}}>Service temporarily suspended by admin.</p>
        </div>
    );

    return (
        <div style={styles.container} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            
            {/* ✅ DYNAMIC FEEDBACK OVERLAY */}
            {selectedDishForFeedback && (
                <FeedbackModal 
                    dish={selectedDishForFeedback} 
                    onClose={() => setSelectedDishForFeedback(null)} 
                    onSuccess={() => {
                        setSelectedDishForFeedback(null);
                        fetchMenu(); // Refresh ratings after feedback
                    }}
                />
            )}

            <div style={{...styles.pullLoader, height: `${pullDistance}px`, opacity: pullDistance / 60}}>
                <FaSyncAlt className={refreshing ? "spin" : ""} style={{color: '#f97316'}} />
            </div>

            <div style={styles.hero}>
                <div style={styles.heroTop}>
                    <h1 style={styles.restName}>{currentRestId?.toUpperCase()}</h1>
                    <div style={styles.ratingBadge}><FaStar color="#fbbf24"/> 4.9</div>
                </div>
                <div style={styles.searchContainer}>
                    <FaSearch style={styles.searchIcon} />
                    <input style={styles.searchInput} placeholder="Search for food..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            <div style={styles.stickyNav}>
                <div style={styles.catScroll}>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            style={{
                                ...styles.catBtn, 
                                background: activeCategory === cat ? '#f97316' : '#111', 
                                color: activeCategory === cat ? 'white' : '#666',
                                borderColor: activeCategory === cat ? '#f97316' : '#222'
                            }}>{cat}</button>
                    ))}
                </div>
            </div>

            <div style={styles.grid}>
                {filteredDishes.map(dish => {
                    const cartItem = cart.find(i => i._id === dish._id);
                    const qty = cartItem ? cartItem.quantity : 0;
                    return (
                        <div key={dish._id} style={styles.card}>
                            <div style={styles.imgBox}>
                                <img src={dish.image || DEFAULT_IMG} alt={dish.name} style={styles.img} loading="lazy" />
                                {!dish.isAvailable && <div style={styles.soldOut}>OUT OF STOCK</div>}
                            </div>
                            <div style={styles.details}>
                                <div style={styles.detailsTop}>
                                    <div style={{maxWidth: '75%'}}>
                                        <h3 style={styles.dishTitle}>{dish.name}</h3>
                                        
                                        {/* ⭐ SOCIAL PROOF LAYER */}
                                        <div style={styles.ratingInfo}>
                                            <FaStar color="#fbbf24" size={10}/>
                                            <span style={styles.ratingText}>{dish.ratings?.average || 4.5}</span>
                                            <span style={styles.countText}>({dish.ratings?.count || 12}+)</span>
                                        </div>
                                    </div>
                                    <span style={styles.price}>₹{dish.price}</span>
                                </div>
                                
                                <div style={styles.actionRow}>
                                    {/* ✅ FEEDBACK TRIGGER */}
                                    <button 
                                        onClick={() => setSelectedDishForFeedback(dish)}
                                        style={styles.feedbackLink}
                                    >
                                        <FaCommentAlt size={10}/> Rate Dish
                                    </button>

                                    {dish.isAvailable !== false ? (
                                        qty > 0 ? (
                                            <div style={styles.counter}>
                                                <button onClick={() => addToCart({...dish, quantity: -1})} style={styles.btnSmall}><FaMinus/></button>
                                                <span style={styles.qty}>{qty}</span>
                                                <button onClick={() => addToCart(dish)} style={styles.btnSmall}><FaPlus/></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => addToCart(dish)} style={styles.addBtn}>ADD</button>
                                        )
                                    ) : <span style={styles.soldOutText}>Not Available</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {totalQty > 0 && (
                <div style={styles.checkoutFloat}>
                    <Link to="/cart" style={styles.checkoutBar}>
                        <div style={styles.checkLeft}>
                            <span style={styles.checkQty}>{totalQty} ITEMS IN BASKET</span>
                            <span style={styles.checkPrice}>₹{totalPrice}</span>
                        </div>
                        <div style={styles.checkRight}>CHECKOUT <FaArrowRight size={12}/></div>
                    </Link>
                </div>
            )}
            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#000", color: "#fff", paddingBottom: "120px", fontFamily: "'Inter', sans-serif", width: '100%', overflowX: 'hidden' },
    center: { height: "100vh", display: "flex", flexDirection:'column', justifyContent: "center", alignItems: "center", background: '#000' },
    pullLoader: { width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', transition: '0.2s' },
    hero: { padding: "30px 20px 20px", background: "#000" },
    heroTop: { display: "flex", justifyContent: "space-between", alignItems:'center', marginBottom: '20px' },
    restName: { fontSize: "28px", fontWeight: "900", letterSpacing: "-1px", textTransform: 'uppercase' },
    ratingBadge: { background: "#111", padding: "6px 12px", borderRadius: "100px", fontSize: "12px", fontWeight:'800', border: '1px solid #222' },
    searchContainer: { position: "relative" },
    searchIcon: { position: "absolute", left: "16px", top: "16px", color: "#444" },
    searchInput: { width: "100%", padding: "16px 16px 16px 48px", borderRadius: "16px", background: "#0a0a0a", border: "1px solid #1a1a1a", color: "#fff", fontSize: "16px", outline: 'none' },
    stickyNav: { position: "sticky", top: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(15px)", padding: "15px 0", zIndex: 100 },
    catScroll: { display: "flex", gap: "10px", padding: "0 20px", overflowX: "auto", scrollbarWidth: 'none' },
    catBtn: { padding: "10px 22px", borderRadius: "100px", fontSize: "12px", fontWeight: "800", whiteSpace: "nowrap", border: '1px solid', transition: "0.2s", cursor: 'pointer' },
    grid: { padding: "0 20px", display: "flex", flexDirection: 'column', gap: "16px" },
    card: { background: "#0a0a0a", borderRadius: "24px", border: "1px solid #111", display: 'flex', height: '140px', overflow:'hidden' },
    imgBox: { width: "120px", height: "100%", position: "relative" },
    img: { width: "100%", height: "100%", objectFit: "cover" },
    soldOut: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "900" },
    details: { flex: 1, padding: "12px", display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
    detailsTop: { display:'flex', justifyContent:'space-between', alignItems:'flex-start' },
    dishTitle: { margin: 0, fontSize: "15px", fontWeight: "800", color: '#fff' },
    price: { color: "#f97316", fontWeight: "900", fontSize: "16px" },
    ratingInfo: { display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' },
    ratingText: { fontSize: '11px', fontWeight: '900', color: '#fff' },
    countText: { fontSize: '10px', color: '#333', fontWeight: '700' },
    actionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    feedbackLink: { background: 'none', border: 'none', color: '#444', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0 },
    addBtn: { padding: "8px 25px", background: "#fff", color: "#000", fontWeight: "900", borderRadius: "12px", border: "none", fontSize: '12px' },
    counter: { display: "flex", alignItems: "center", gap: "12px", background: "#f97316", padding: "6px 10px", borderRadius: "12px" },
    btnSmall: { background: "none", border: "none", color: "#fff", fontSize: '10px', cursor: 'pointer' },
    qty: { fontWeight: "900", fontSize: "14px", color: "#fff" },
    soldOutText: { color: '#ef4444', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' },
    checkoutFloat: { position: "fixed", bottom: "30px", left: "0", right: "0", padding: "0 20px", zIndex: 1000 },
    checkoutBar: { background: "#22c55e", padding: "16px 25px", borderRadius: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none" },
    checkLeft: { display: 'flex', flexDirection: 'column' },
    checkQty: { fontSize: "10px", fontWeight: "900", color: "#052e16", textTransform: 'uppercase' },
    checkPrice: { fontSize: "20px", fontWeight: "900", color: "#fff" },
    checkRight: { fontWeight: "900", fontSize: "14px", color: "#fff", display: 'flex', alignItems: 'center', gap: '8px' },
};

export default Menu;