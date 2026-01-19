import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom"; 
import axios from "axios";
import { FaSearch, FaPlus, FaMinus, FaShoppingCart, FaArrowRight, FaStore } from "react-icons/fa";
import { toast } from "react-hot-toast"; 
import LoadingSpinner from "../components/LoadingSpinner";

const Menu = ({ cart, addToCart, setRestaurantId, setTableNum, setCart, customerId }) => {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate(); 
    const currentRestId = params.restaurantId || params.id;
    const currentTable = params.table || searchParams.get("table");
    const API_BASE = "https://smart-menu-app-production.up.railway.app/api";

    const [dishes, setDishes] = useState([]);
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentRestId) return;
        const fetchMenu = async () => {
            try {
                const idRes = await axios.get(`${API_BASE}/auth/owner-id/${currentRestId}`);
                if (idRes.data.id) {
                    const res = await axios.get(`${API_BASE}/dishes?restaurantId=${idRes.data.id}`);
                    setDishes(Array.isArray(res.data) ? res.data : res.data.dishes || []);
                }
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchMenu();
    }, [currentRestId]);

    useEffect(() => {
        if (currentTable) localStorage.setItem("last_table_scanned", currentTable);
        setRestaurantId(currentRestId);
        setTableNum(currentTable || localStorage.getItem("last_table_scanned"));
    }, [currentRestId, currentTable]);

    const filteredDishes = useMemo(() => {
        return dishes.filter(d => (activeCategory === "All" || d.category === activeCategory) && d.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [dishes, activeCategory, searchTerm]);

    const categories = ["All", ...new Set(dishes.map(d => d.category))];
    const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleAction = (dish, val) => {
        if (navigator.vibrate) navigator.vibrate(40);
        addToCart(val === -1 ? {...dish, quantity: -1} : dish);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div style={styles.container}>
            <div style={styles.stickyHeader}>
                <div style={styles.marquee}><span>✦ WELCOME TO {currentRestId?.toUpperCase()} ✦ ENJOY YOUR MEAL ✦</span></div>
                <div style={styles.heroRow}>
                    <div style={{display:'flex', gap:10, alignItems:'center'}}>
                        <div style={styles.iconBox}><FaStore/></div>
                        <div>
                            <h1 style={styles.restName}>KOVIXA <span style={{color:'#f59e0b'}}>x</span> {currentRestId}</h1>
                            <div style={styles.tableBadge}>{currentTable ? `Table ${currentTable}` : "Takeaway"}</div>
                        </div>
                    </div>
                    <div onClick={() => navigate(`/${currentRestId}/cart/${customerId}`)} style={styles.cartIcon}>
                        <FaShoppingCart size={20} />
                        {totalQty > 0 && <span style={styles.badge}>{totalQty}</span>}
                    </div>
                </div>
                <div style={styles.searchBox}>
                    <FaSearch style={styles.searchIcon} />
                    <input style={styles.input} placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div style={styles.catScroll}>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} style={{...styles.catBtn, ...(activeCategory === cat ? styles.activeCat : {})}}>{cat}</button>
                    ))}
                </div>
            </div>
            <div style={styles.grid}>
                {filteredDishes.map(dish => {
                    const itemInCart = cart.find(i => i._id === dish._id);
                    const qty = itemInCart ? itemInCart.quantity : 0;
                    return (
                        <div key={dish._id} style={styles.card}>
                            <div style={{flex:1}}>
                                <h3 style={styles.title}>{dish.name}</h3><p style={styles.desc}>{dish.category}</p><span style={styles.price}>₹{dish.price}</span>
                            </div>
                            <div style={styles.imgBox}>
                                <img src={dish.image || "https://placehold.co/100"} style={styles.img} alt={dish.name} />
                                <div style={styles.actions}>
                                    {qty > 0 ? (
                                        <div style={styles.counter}>
                                            <button onClick={() => handleAction(dish, -1)} style={styles.btn}>-</button><span>{qty}</span><button onClick={() => handleAction(dish, 1)} style={styles.btn}>+</button>
                                        </div>
                                    ) : ( <button onClick={() => handleAction(dish, 1)} style={styles.addBtn}>ADD</button> )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {totalQty > 0 && (
                <div onClick={() => navigate(`/${currentRestId}/cart/${customerId}`)} style={styles.floatCart}>
                    <div><div style={{fontSize:10}}>TOTAL</div><div style={{fontSize:16, fontWeight:'bold'}}>₹{totalPrice}</div></div>
                    <div style={{display:'flex', alignItems:'center', gap:5, fontWeight:'bold'}}>View Cart <FaArrowRight/></div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#020617", paddingBottom: "100px", color: 'white', fontFamily: 'sans-serif' },
    stickyHeader: { position: "sticky", top: 0, background: "rgba(2,6,23,0.95)", backdropFilter: "blur(10px)", zIndex: 50, borderBottom: "1px solid #1e293b", paddingBottom: 10 },
    marquee: { background: '#1e1b4b', padding: '8px', fontSize: 10, textAlign: 'center', color: '#a5b4fc', letterSpacing: 2 },
    heroRow: { display: 'flex', justifyContent: 'space-between', padding: '15px' },
    iconBox: { width: 40, height: 40, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    restName: { margin: 0, fontSize: 18, fontWeight: 'bold' },
    tableBadge: { fontSize: 12, color: '#94a3b8' },
    cartIcon: { position: 'relative', background: '#1e293b', padding: 10, borderRadius: 12, color: '#f59e0b' },
    badge: { position: 'absolute', top: -5, right: -5, background: '#22c55e', color: 'white', fontSize: 10, padding: '2px 6px', borderRadius: 10 },
    searchBox: { position: 'relative', margin: '0 15px' },
    searchIcon: { position: 'absolute', left: 15, top: 12, color: '#64748b' },
    input: { width: '100%', padding: '12px 12px 12px 40px', background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: 'white', outline: 'none' },
    catScroll: { display: 'flex', gap: 10, overflowX: 'auto', padding: '15px 15px 5px' },
    catBtn: { padding: '8px 16px', borderRadius: 20, background: 'transparent', border: '1px solid #334155', color: '#94a3b8', whiteSpace: 'nowrap' },
    activeCat: { background: '#f59e0b', color: 'black', borderColor: '#f59e0b', fontWeight: 'bold' },
    grid: { padding: 15, display: 'grid', gap: 15 },
    card: { background: '#111827', padding: 15, borderRadius: 20, display: 'flex', justifyContent: 'space-between', border: '1px solid #1f2937' },
    title: { margin: 0, fontSize: 16 },
    desc: { color: '#6b7280', fontSize: 12, margin: '5px 0' },
    price: { color: '#f59e0b', fontWeight: 'bold' },
    imgBox: { width: 100, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    img: { width: 100, height: 100, borderRadius: 15, objectFit: 'cover' },
    actions: { marginTop: -15 },
    addBtn: { background: 'white', color: 'black', border: 'none', padding: '5px 15px', borderRadius: 8, fontWeight: 'bold' },
    counter: { display: 'flex', background: '#1e293b', borderRadius: 8, alignItems: 'center', width: 80, justifyContent: 'space-between', border: '1px solid #334155' },
    btn: { background: 'transparent', color: '#f59e0b', border: 'none', width: 25, fontSize: 16 },
    floatCart: { position: 'fixed', bottom: 20, left: 20, right: 20, background: '#f59e0b', padding: 15, borderRadius: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'black', zIndex: 100, boxShadow: '0 10px 25px rgba(245, 158, 11, 0.4)' }
};

export default Menu;