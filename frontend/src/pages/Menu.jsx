import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom"; 
import axios from "axios";
import { FaSearch, FaPlus, FaMinus, FaShoppingCart, FaArrowRight, FaStore } from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";

const API_BASE = "https://smart-menu-app-production.up.railway.app/api";

const Menu = ({ cart, addToCart, setRestaurantId, setTableNum, customerId }) => {
    const { restaurantId } = useParams(); // URL param: "burger-king"
    const [searchParams] = useSearchParams();
    const navigate = useNavigate(); 
    
    const currentTable = searchParams.get("table");

    const [dishes, setDishes] = useState([]);
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    // 1. Fetch Menu (with ID Resolution)
    useEffect(() => {
        const init = async () => {
            try {
                // Bridge: Get Real ID from Username
                const idRes = await axios.get(`${API_BASE}/auth/owner-id/${restaurantId}`);
                const realId = idRes.data.id;
                
                // Set Global Context
                setRestaurantId(restaurantId);
                if (currentTable) {
                    setTableNum(currentTable);
                    localStorage.setItem("last_table", currentTable);
                }

                // Fetch Dishes
                const res = await axios.get(`${API_BASE}/dishes?restaurantId=${realId}`);
                setDishes(res.data.dishes || res.data || []);
            } catch (e) { console.error("Menu Load Error:", e); } 
            finally { setLoading(false); }
        };
        init();
    }, [restaurantId, currentTable, setRestaurantId, setTableNum]);

    // 2. Filtering Logic
    const filtered = useMemo(() => dishes.filter(d => 
        (activeCategory === "All" || d.category === activeCategory) &&
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [dishes, activeCategory, searchTerm]);

    const categories = ["All", ...new Set(dishes.map(d => d.category))];
    const totalQty = cart.reduce((acc, i) => acc + i.quantity, 0);
    const totalPrice = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);

    if (loading) return <LoadingSpinner />;

    return (
        <div style={styles.container}>
            {/* Sticky Header */}
            <div style={styles.stickyHeader}>
                <div style={styles.headerRow}>
                    <div>
                        <h2 style={{margin:0, fontSize:18, fontWeight:800}}>
                            {restaurantId?.toUpperCase()}
                        </h2>
                        <div style={{fontSize:12, color:'#94a3b8', fontWeight:600}}>
                            {currentTable ? `Table ${currentTable}` : "Takeaway Menu"}
                        </div>
                    </div>
                    {/* Cart Icon */}
                    <div style={styles.cartIcon} onClick={() => navigate(`/${restaurantId}/cart/${customerId}`)}>
                        <FaShoppingCart size={20} />
                        {totalQty > 0 && <span style={styles.badge}>{totalQty}</span>}
                    </div>
                </div>

                {/* Search */}
                <div style={styles.searchBox}>
                    <FaSearch style={styles.searchIcon} />
                    <input 
                        style={styles.input} 
                        placeholder="Search food..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>

                {/* Category Pills */}
                <div style={styles.catScroll}>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} 
                            style={{
                                ...styles.catBtn, 
                                ...(activeCategory === cat ? styles.activeCat : {})
                            }}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable Dish List */}
            <div style={styles.grid}>
                {filtered.map(dish => {
                    const qty = cart.find(i => i._id === dish._id)?.quantity || 0;
                    return (
                        <div key={dish._id} style={styles.card}>
                            {/* Image */}
                            <div style={styles.imgBox}>
                                <img src={dish.image || "https://placehold.co/150"} style={styles.img} alt={dish.name} />
                            </div>
                            
                            {/* Info */}
                            <div style={styles.info}>
                                <div style={{fontWeight:'bold', fontSize:16, marginBottom:4}}>{dish.name}</div>
                                <div style={{color:'#94a3b8', fontSize:12, marginBottom:8}}>{dish.category}</div>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <div style={{color:'#f59e0b', fontWeight:'bold', fontSize:16}}>₹{dish.price}</div>
                                    
                                    {/* Add Button */}
                                    {qty === 0 ? (
                                        <button onClick={() => addToCart(dish)} style={styles.addBtn}>ADD</button>
                                    ) : (
                                        <div style={styles.counter}>
                                            <button onClick={() => addToCart({...dish, quantity: -1})} style={styles.countBtn}>-</button>
                                            <span style={{fontWeight:'bold', fontSize:14}}>{qty}</span>
                                            <button onClick={() => addToCart(dish)} style={styles.countBtn}>+</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Floating Bottom Cart */}
            {totalQty > 0 && (
                <div style={styles.floatCart} onClick={() => navigate(`/${restaurantId}/cart/${customerId}`)}>
                    <div>
                        <div style={{fontSize:10, opacity:0.8}}>TOTAL</div>
                        <div style={{fontSize:16, fontWeight:'bold'}}>₹{totalPrice}</div>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:8, fontWeight:'bold', fontSize:14}}>
                        View Cart <FaArrowRight/>
                    </div>
                </div>
            )}
        </div>
    );
};

// 🎨 Styles (Native Scroll Enabled)
const styles = {
    container: { minHeight: "100vh", background: "#020617", paddingBottom: "100px", color: 'white', fontFamily: "'Plus Jakarta Sans', sans-serif" },
    stickyHeader: { position: "sticky", top: 0, background: "rgba(2,6,23,0.98)", backdropFilter: "blur(12px)", zIndex: 50, borderBottom: "1px solid #1e293b", paddingBottom: 10 },
    headerRow: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', alignItems: 'center' },
    cartIcon: { position: 'relative', padding: 10, background: '#1e293b', borderRadius: 12, color: '#f59e0b', cursor: 'pointer' },
    badge: { position: 'absolute', top: -5, right: -5, background: '#22c55e', color: 'white', fontSize: 10, padding: '2px 6px', borderRadius: 10, fontWeight: 'bold' },
    
    searchBox: { position: 'relative', margin: '0 15px 15px' },
    searchIcon: { position: 'absolute', left: 15, top: 14, color: '#64748b' },
    input: { width: '100%', padding: '12px 12px 12px 45px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: 'white', outline: 'none', fontSize: 15 },
    
    catScroll: { display: 'flex', gap: 10, overflowX: 'auto', padding: '0 15px 5px', scrollbarWidth: 'none' },
    catBtn: { padding: '8px 18px', borderRadius: 20, background: 'transparent', border: '1px solid #334155', color: '#94a3b8', whiteSpace: 'nowrap', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
    activeCat: { background: '#f59e0b', color: '#000', borderColor: '#f59e0b', fontWeight: 800 },
    
    grid: { padding: 15, display: 'flex', flexDirection: 'column', gap: 15 },
    card: { background: '#1e293b', borderRadius: 16, overflow: 'hidden', display: 'flex', border: '1px solid #334155' },
    imgBox: { width: 110, height: 110, flexShrink: 0 },
    img: { width: '100%', height: '100%', objectFit: 'cover' },
    info: { flex: 1, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    
    addBtn: { background: 'white', color: 'black', padding: '6px 18px', borderRadius: 8, fontWeight: 800, border: 'none', fontSize: 12, cursor: 'pointer' },
    counter: { display: 'flex', alignItems: 'center', gap: 10, background: '#0f172a', padding: '4px 8px', borderRadius: 8, border: '1px solid #334155' },
    countBtn: { background: 'transparent', color: '#f59e0b', border: 'none', fontSize: 16, width: 20, cursor: 'pointer' },
    
    floatCart: { position: 'fixed', bottom: 20, left: 20, right: 20, background: '#f59e0b', padding: '15px 25px', borderRadius: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'black', zIndex: 100, boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4)', cursor: 'pointer' }
};

export default Menu;