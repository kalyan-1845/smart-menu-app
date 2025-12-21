import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
// 🎨 Icons
import { FaHistory, FaSearch, FaShoppingCart, FaBell } from "react-icons/fa";

const Menu = ({ cart = [], addToCart, setRestaurantId, setTableNum }) => {
    // --- STATE ---
    const { id, table } = useParams(); 
    const [dishes, setDishes] = useState([]);
    const [restaurant, setRestaurant] = useState({ name: "Loading...", _id: null });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [lastOrderId, setLastOrderId] = useState(null);

    // --- FETCH DATA & HISTORY ---
    useEffect(() => {
        // 1. Check for previous order history in localStorage
        const history = JSON.parse(localStorage.getItem("smartMenu_History") || "[]");
        if (history.length > 0) {
            setLastOrderId(history[0]); // Get the most recent order ID
        }

        const fetchMenu = async () => {
            try {
                setLoading(true);
                // 2. Fetch Restaurant Info
                const shopRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${id}`);
                setRestaurant({ name: shopRes.data.username || shopRes.data.restaurantName, _id: shopRes.data._id });
                
                if(setRestaurantId) setRestaurantId(shopRes.data._id);
                if (table && setTableNum) setTableNum(table);

                // 3. Fetch Dishes (Back-end now returns recipe/stock data)
                const dishRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/dishes?restaurantId=${shopRes.data._id}`);
                setDishes(dishRes.data);

            } catch (error) {
                console.error("Fetch Issue:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, [id, table, setRestaurantId, setTableNum]);

    // --- HELPERS ---
    const categories = ["All", ...new Set(dishes.map(d => d.category))];
    
    // Logic: Check if dish is out of stock based on ingredients
    const checkStock = (dish) => {
        if (!dish.recipe || dish.recipe.length === 0) return true; // Available if no recipe defined
        return dish.recipe.every(ing => ing.ingredientId.currentStock >= ing.quantityNeeded);
    };

    const filteredDishes = dishes.filter(dish => 
        (selectedCategory === "All" || dish.category === selectedCategory) &&
        dish.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- LOGIC: Call Waiter ---
    const handleCallWaiter = async () => {
        if (!table || table === "Takeaway") return alert("Table number required.");
        if (!window.confirm(`Call assistance for Table ${table}?`)) return;

        try {
            await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders/call-waiter", {
                restaurantId: restaurant._id || id,
                tableNumber: table,
                type: "help"
            });
            alert("🛎️ Staff notified!");
        } catch (error) {
            alert("🛎️ Staff Alerted!");
        }
    };

    if (loading) return (
        <div style={styles.loaderContainer}>
            <div style={styles.spinner}></div>
            <p>Fetching Fresh Menu...</p>
        </div>
    );

    return (
        <div style={styles.container}>
            
            {/* 1. STICKY HEADER */}
            <header style={styles.header}>
                <div>
                    <h1 style={styles.brandName}>{restaurant.name}</h1>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {table && <span style={styles.tableBadge}>Table {table}</span>}
                        {lastOrderId && (
                            <Link to={`/track/${lastOrderId}`} style={{ textDecoration: 'none' }}>
                                <span style={styles.historyBtn}><FaHistory /> Re-track</span>
                            </Link>
                        )}
                    </div>
                </div>
                <div style={styles.headerActions}>
                    <div style={styles.searchBox}>
                        <FaSearch style={styles.searchIcon} />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            style={styles.searchInput} 
                        />
                    </div>
                </div>
            </header>

            {/* 2. CATEGORY BAR */}
            <div style={styles.categoryBar}>
                {categories.map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => setSelectedCategory(cat)} 
                        style={{ ...styles.catBtn, background: selectedCategory === cat ? '#f97316' : '#1a1a1a', color: selectedCategory === cat ? 'white' : '#888' }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* 3. DISH GRID */}
            <div style={styles.grid}>
                {filteredDishes.map((dish) => {
                    const isAvailable = checkStock(dish);
                    return (
                        <div 
                            key={dish._id} 
                            onClick={() => isAvailable && addToCart(dish)} 
                            style={{ ...styles.card, opacity: isAvailable ? 1 : 0.6, pointerEvents: isAvailable ? 'auto' : 'none' }}
                        >
                            {!isAvailable && <div style={styles.soldOutBadge}>Sold Out</div>}
                            
                            <img src={dish.image} alt={dish.name} style={styles.dishImg} loading="lazy" />
                            <div style={styles.overlay}></div>
                            
                            <div style={styles.cardContent}>
                                <p style={styles.price}>₹{dish.price}</p>
                                <h3 style={styles.dishName}>{dish.name}</h3>
                            </div>

                            <div style={styles.addBtn}>
                                <span>{isAvailable ? "+" : "✖"}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 4. CALL WAITER */}
            <button onClick={handleCallWaiter} style={styles.floatingCall}>
                <FaBell />
            </button>

            {/* 5. VIEW CART BAR */}
            {cart.length > 0 && (
                <div style={styles.cartBarContainer}>
                    <Link to="/cart" style={{ textDecoration: 'none' }}>
                        <div style={styles.cartBar}>
                            <div>
                                <span style={styles.cartItemCount}>{cart.reduce((a,b)=>a+b.quantity,0)} ITEMS</span>
                                <span style={styles.cartTotal}>₹{cart.reduce((a, b) => a + (b.price * b.quantity), 0)}</span>
                            </div>
                            <div style={styles.cartLink}>
                                View Basket <FaShoppingCart style={{marginLeft: '8px'}} />
                            </div>
                        </div>
                    </Link>
                </div>
            )}
        </div>
    );
};

// --- STYLES ---
const styles = {
    container: { backgroundColor: '#080808', minHeight: '100vh', color: 'white', paddingBottom: '120px', fontFamily: 'sans-serif' },
    loaderContainer: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#080808', color: 'white' },
    spinner: { width: '40px', height: '40px', border: '4px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '15px' },
    
    header: { position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(8, 8, 8, 0.9)', backdropFilter: 'blur(15px)', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a1a1a' },
    brandName: { fontSize: '20px', fontWeight: '900', margin: 0, letterSpacing: '-1px' },
    tableBadge: { fontSize: '9px', color: '#f97316', fontWeight: '900', textTransform: 'uppercase', background: 'rgba(249, 115, 22, 0.1)', padding: '2px 8px', borderRadius: '5px' },
    historyBtn: { fontSize: '9px', color: '#888', fontWeight: '900', textTransform: 'uppercase', background: '#1a1a1a', padding: '2px 8px', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '4px' },
    
    headerActions: { display: 'flex', gap: '10px', alignItems: 'center' },
    searchBox: { position: 'relative', background: '#121212', borderRadius: '20px', padding: '6px 12px', display: 'flex', alignItems: 'center', border: '1px solid #222' },
    searchIcon: { fontSize: '12px', color: '#555', marginRight: '8px' },
    searchInput: { background: 'transparent', border: 'none', color: 'white', fontSize: '13px', width: '80px', outline: 'none' },

    categoryBar: { position: 'sticky', top: '70px', zIndex: 90, background: '#080808', padding: '12px 20px', overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex', gap: '10px' },
    catBtn: { padding: '8px 22px', borderRadius: '25px', fontSize: '12px', fontWeight: '800', border: 'none', cursor: 'pointer', transition: '0.3s', textTransform: 'uppercase' },

    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px', padding: '20px' },
    card: { position: 'relative', aspectRatio: '3/4', borderRadius: '24px', overflow: 'hidden', cursor: 'pointer', background: '#111', transition: 'transform 0.2s' },
    dishImg: { width: '100%', height: '100%', objectFit: 'cover' },
    overlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 70%)' },
    cardContent: { position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '15px' },
    price: { color: '#f97316', fontWeight: '900', fontSize: '14px', marginBottom: '2px' },
    dishName: { color: 'white', fontWeight: '700', fontSize: '15px', lineHeight: '1.2', margin: 0 },
    addBtn: { position: 'absolute', bottom: '15px', right: '15px', width: '35px', height: '35px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)', fontSize: '18px', fontWeight: 'bold' },
    
    soldOutBadge: { position: 'absolute', top: '12px', left: '12px', zIndex: 10, background: '#ef4444', color: 'white', fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)' },

    floatingCall: { position: 'fixed', bottom: '30px', right: '20px', width: '55px', height: '55px', borderRadius: '50%', background: '#f97316', color: 'white', border: 'none', fontSize: '20px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(249, 115, 22, 0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' },

    cartBarContainer: { position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 40px)', maxWidth: '450px', zIndex: 150 },
    cartBar: { background: 'white', padding: '18px 25px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 15px 35px rgba(0,0,0,0.4)' },
    cartItemCount: { fontSize: '10px', fontWeight: '900', color: '#888', display: 'block' },
    cartTotal: { fontSize: '20px', fontWeight: '900', color: 'black' },
    cartLink: { fontSize: '14px', fontWeight: '900', color: 'black', display: 'flex', alignItems: 'center' },
};

export default Menu;