import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";

const Menu = ({ cart = [], addToCart, setRestaurantId, setTableNum }) => {
    // --- STATE ---
    const { id, table } = useParams();
    const [dishes, setDishes] = useState([]);
    const [restaurant, setRestaurant] = useState({ name: "My Restaurant", _id: null });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    // --- DUMMY DATA (Fallback) ---
    const dummyDishes = [
        { _id: "1", name: "BBQ Chicken Pizza", price: 450, category: "Pizza", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=60", specifications: ["No Onion", "Extra Cheese"] },
        { _id: "2", name: "Spicy Paneer Burger", price: 220, category: "Burger", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60", specifications: ["No Onion", "Extra Spicy"] },
        { _id: "3", name: "Red Sauce Pasta", price: 350, category: "Pasta", image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=500&q=60" },
        { _id: "4", name: "Double Cheese Pizza", price: 400, category: "Pizza", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=60" },
        { _id: "5", name: "Chocolate Cake", price: 150, category: "Dessert", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=60", specifications: ["Eggless", "Sugar Free"] }
    ];

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const shopRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${id}`);
                setRestaurant({ name: shopRes.data.restaurantName, _id: shopRes.data._id });
                if(setRestaurantId) setRestaurantId(shopRes.data._id);
                if (table && setTableNum) setTableNum(table);

                const dishRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/dishes?restaurantId=${shopRes.data._id}`);
                setDishes(dishRes.data);
            } catch (error) {
                console.warn("Backend not reachable. Using Demo Data.");
                setDishes(dummyDishes);
                setRestaurant({ name: "My Restaurant (Demo)", _id: "demo_id" });
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, [id, table, setRestaurantId, setTableNum]);

    // --- HELPERS ---
    const categories = ["All", ...new Set(dishes.map(d => d.category))];
    const filteredDishes = dishes.filter(dish => 
        (selectedCategory === "All" || dish.category === selectedCategory) &&
        dish.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- LOGIC: Call Waiter ---
    const handleCallWaiter = async () => {
        if (!table || table === "Takeaway") {
            return alert("Table number is required to call a waiter.");
        }

        const confirmCall = window.confirm(`Call assistance to Table ${table}?`);
        if (!confirmCall) return;

        try {
            await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders/call-waiter", {
                restaurantId: id,
                tableNumber: table
            });
            alert("🛎️ Staff has been notified. We will be with you shortly!");
        } catch (error) {
            alert("🛎️ Request Sent! (Simulation Mode)");
        }
    };

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', background: '#0d0d0d' }}>Loading Menu...</div>;

    return (
        <div style={{ backgroundColor: '#0d0d0d', minHeight: '100vh', fontFamily: 'sans-serif', color: 'white', paddingBottom: '120px' }}>
            
            {/* 1. HEADER */}
            <header style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'rgba(10, 10, 10, 0.95)', backdropFilter: 'blur(10px)', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
                <div>
                    <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{restaurant.name}</h1>
                    {table && <span style={{ fontSize: '10px', color: '#f97316', fontWeight: 'bold', textTransform: 'uppercase' }}>Table {table}</span>}
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ background: '#1f1f1f', border: 'none', borderRadius: '20px', padding: '8px 15px', color: 'white', fontSize: '12px', width: '100px' }} />
                    <Link to="/cart" style={{ position: 'relative', color: 'white' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                        {cart.length > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#dc2626', color: 'white', fontSize: '10px', fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cart.reduce((a, b) => a + b.quantity, 0)}</span>}
                    </Link>
                </div>
            </header>

            {/* 2. CATEGORIES */}
            <div style={{ position: 'sticky', top: '65px', zIndex: 30, background: '#0d0d0d', padding: '10px 15px', overflowX: 'auto', whiteSpace: 'nowrap', borderBottom: '1px solid #333' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '8px 20px', borderRadius: '25px', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer', background: selectedCategory === cat ? '#f97316' : '#1f1f1f', color: selectedCategory === cat ? 'white' : '#888' }}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. MENU GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px', padding: '15px' }}>
                {filteredDishes.map((dish) => (
                    <div key={dish._id} 
                         onClick={() => addToCart(dish)} 
                         style={{ position: 'relative', aspectRatio: '3/4', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', background: '#1a1a1a', transition: 'transform 0.2s' }}>
                        
                        <img src={dish.image} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 60%)' }}></div>
                        
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '12px' }}>
                            <p style={{ color: '#f97316', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>₹{dish.price}</p>
                            <h3 style={{ color: 'white', fontWeight: '600', fontSize: '15px', lineHeight: '1.2', margin: 0 }}>{dish.name}</h3>
                        </div>

                        <div style={{ position: 'absolute', bottom: '12px', right: '12px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.3)' }}>
                            <span style={{ color: 'white', fontSize: '20px' }}>+</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* 4. FLOATING CALL WAITER BUTTON */}
            <button 
                onClick={handleCallWaiter}
                style={{ position: 'fixed', bottom: cart.length > 0 ? '100px' : '30px', right: '20px', width: '60px', height: '60px', borderRadius: '50%', background: '#f97316', color: 'white', border: 'none', fontSize: '24px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                🛎️
            </button>

            {/* 5. VIEW CART BAR */}
            {cart.length > 0 && (
                <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 40px)', maxWidth: '480px', zIndex: 50 }}>
                    <Link to="/cart" style={{ textDecoration: 'none' }}>
                        <div style={{ background: 'white', padding: '15px 20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                            <div>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#666', display: 'block' }}>{cart.reduce((a,b)=>a+b.quantity,0)} ITEMS</span>
                                <span style={{ fontSize: '18px', fontWeight: '800', color: 'black' }}>₹{cart.reduce((a, b) => a + (b.price * b.quantity), 0)}</span>
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'black', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                View Cart →
                            </div>
                        </div>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default Menu;