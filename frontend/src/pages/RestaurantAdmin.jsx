import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
    FaUtensils, FaPlus, FaTrash, FaEdit, FaSignOutAlt, 
    FaChartLine, FaClipboardList, FaUsers, FaToggleOn, FaToggleOff 
} from "react-icons/fa";

const RestaurantAdmin = () => {
    const { id } = useParams(); // Restaurant ID or Username
    const navigate = useNavigate();
    const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";

    // --- STATE ---
    const [activeTab, setActiveTab] = useState("menu");
    const [dishes, setDishes] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [restaurantInfo, setRestaurantInfo] = useState(null);

    // --- FORM STATE FOR NEW DISH ---
    const [newDish, setNewDish] = useState({
        name: "", price: "", category: "Main Course", description: "", image: ""
    });

    // --- 1. AUTH & DATA LOAD ---
    useEffect(() => {
        const token = localStorage.getItem(`admin_token_${id}`);
        if (!token) {
            // If no token, redirect to owner login
            navigate("/login");
            return;
        }
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem(`admin_token_${id}`)}` } };
            
            // Fetch Menu
            const dishRes = await axios.get(`${API_BASE}/dishes?restaurantId=${id}`);
            setDishes(dishRes.data);

            // Fetch Active Orders
            const orderRes = await axios.get(`${API_BASE}/orders`, config);
            setOrders(orderRes.data);

            setLoading(false);
        } catch (err) {
            console.error("Data fetch failed", err);
            setLoading(false);
        }
    };

    // --- 2. MENU ACTIONS ---
    const handleAddDish = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem(`admin_token_${id}`)}` } };
            await axios.post(`${API_BASE}/dishes`, newDish, config);
            setNewDish({ name: "", price: "", category: "Main Course", description: "", image: "" });
            fetchData();
            alert("Dish added to BiteBox menu!");
        } catch (err) { alert("Failed to add dish"); }
    };

    const handleDeleteDish = async (dishId) => {
        if (!window.confirm("Delete this dish?")) return;
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem(`admin_token_${id}`)}` } };
            await axios.delete(`${API_BASE}/dishes/${dishId}`, config);
            fetchData();
        } catch (err) { alert("Delete failed"); }
    };

    const toggleAvailability = async (dishId, currentStatus) => {
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem(`admin_token_${id}`)}` } };
            await axios.put(`${API_BASE}/dishes/${dishId}`, { isAvailable: !currentStatus }, config);
            fetchData();
        } catch (err) { alert("Stock update failed"); }
    };

    const handleLogout = () => {
        localStorage.removeItem(`admin_token_${id}`);
        navigate("/login");
    };

    return (
        <div style={styles.container}>
            {/* --- SIDEBAR --- */}
            <nav style={styles.sidebar}>
                <div style={styles.logoBox}>
                    <FaUtensils color="#f97316" size={24} />
                    <h2 style={styles.logoText}>BiteBox</h2>
                </div>
                
                <div style={styles.navLinks}>
                    <button onClick={() => setActiveTab("menu")} style={{...styles.navBtn, color: activeTab === 'menu' ? '#f97316' : '#888'}}>
                        <FaClipboardList /> Menu Manager
                    </button>
                    <button onClick={() => setActiveTab("orders")} style={{...styles.navBtn, color: activeTab === 'orders' ? '#f97316' : '#888'}}>
                        <FaChartLine /> Live Orders
                    </button>
                    <button onClick={() => setActiveTab("staff")} style={{...styles.navBtn, color: activeTab === 'staff' ? '#f97316' : '#888'}}>
                        <FaUsers /> Staff Settings
                    </button>
                </div>

                <button onClick={handleLogout} style={styles.logoutBtn}>
                    <FaSignOutAlt /> Logout
                </button>
            </nav>

            {/* --- MAIN CONTENT --- */}
            <main style={styles.mainContent}>
                <header style={styles.header}>
                    <h1 style={{margin:0, fontSize:'24px'}}>{activeTab.toUpperCase()}</h1>
                    <div style={styles.adminTag}>Administrator: {id}</div>
                </header>

                {activeTab === "menu" && (
                    <div style={styles.menuLayout}>
                        {/* ADD DISH FORM */}
                        <section style={styles.formSection}>
                            <h3 style={{marginTop:0}}><FaPlus /> Add New Dish</h3>
                            <form onSubmit={handleAddDish} style={styles.form}>
                                <input placeholder="Dish Name" value={newDish.name} onChange={e=>setNewOwner({...newDish, name: e.target.value})} style={styles.input} />
                                <input placeholder="Price (₹)" type="number" value={newDish.price} onChange={e=>setNewDish({...newDish, price: e.target.value})} style={styles.input} />
                                <select value={newDish.category} onChange={e=>setNewDish({...newDish, category: e.target.value})} style={styles.input}>
                                    <option>Starters</option>
                                    <option>Main Course</option>
                                    <option>Fast Food</option>
                                    <option>Dessert</option>
                                    <option>Beverages</option>
                                </select>
                                <button type="submit" style={styles.submitBtn}>Add to Menu</button>
                            </form>
                        </section>

                        {/* DISH LIST */}
                        <section style={styles.listSection}>
                            {dishes.map(dish => (
                                <div key={dish._id} style={styles.dishRow}>
                                    <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                                        <img src={dish.image || "https://via.placeholder.com/50"} style={styles.dishThumb} alt=""/>
                                        <div>
                                            <div style={{fontWeight:'bold'}}>{dish.name}</div>
                                            <div style={{fontSize:'12px', color:'#666'}}>₹{dish.price} • {dish.category}</div>
                                        </div>
                                    </div>
                                    <div style={{display:'flex', gap:'10px'}}>
                                        <button onClick={() => toggleAvailability(dish._id, dish.isAvailable)} style={styles.iconBtn}>
                                            {dish.isAvailable ? <FaToggleOn color="#22c55e" /> : <FaToggleOff color="#444" />}
                                        </button>
                                        <button onClick={() => handleDeleteDish(dish._id)} style={styles.deleteBtn}><FaTrash /></button>
                                    </div>
                                </div>
                            ))}
                        </section>
                    </div>
                )}

                {activeTab === "orders" && (
                    <div style={styles.ordersGrid}>
                        {orders.length === 0 ? <p>No active orders.</p> : orders.map(order => (
                            <div key={order._id} style={styles.orderCard}>
                                <div style={styles.orderHeader}>
                                    <strong>Table #{order.tableNumber}</strong>
                                    <span style={styles.orderStatus}>{order.status}</span>
                                </div>
                                <div style={styles.orderItems}>
                                    {order.items.map((i, idx) => <div key={idx}>{i.quantity}x {i.name}</div>)}
                                </div>
                                <div style={styles.orderFooter}>Total: ₹{order.totalAmount}</div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

// --- STYLES ---
const styles = {
    container: { display: 'flex', minHeight: '100vh', background: '#050505', color: 'white', fontFamily: 'Inter, sans-serif' },
    sidebar: { width: '260px', background: '#111', borderRight: '1px solid #222', padding: '30px 20px', display: 'flex', flexDirection: 'column' },
    logoBox: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' },
    logoText: { margin: 0, fontSize: '22px', fontWeight: '900', letterSpacing: '-1px' },
    navLinks: { display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 },
    navBtn: { background: 'none', border: 'none', textAlign: 'left', padding: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' },
    logoutBtn: { background: '#222', color: '#ef4444', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' },
    mainContent: { flex: 1, padding: '40px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #222', paddingBottom: '20px' },
    adminTag: { background: '#f973161a', color: '#f97316', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
    menuLayout: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' },
    formSection: { background: '#111', padding: '25px', borderRadius: '15px', border: '1px solid #222', height: 'fit-content' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    input: { background: '#050505', border: '1px solid #333', padding: '12px', borderRadius: '8px', color: 'white' },
    submitBtn: { background: '#f97316', color: 'black', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
    listSection: { display: 'flex', flexDirection: 'column', gap: '10px' },
    dishRow: { background: '#111', padding: '15px', borderRadius: '12px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    dishThumb: { width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' },
    iconBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' },
    deleteBtn: { background: '#3a1111', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' },
    ordersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' },
    orderCard: { background: '#111', padding: '20px', borderRadius: '15px', border: '1px solid #222' },
    orderHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #222' },
    orderStatus: { color: '#f97316', fontSize: '12px', fontWeight: 'bold' },
    orderItems: { fontSize: '14px', color: '#aaa', marginBottom: '15px' },
    orderFooter: { fontWeight: 'bold', textAlign: 'right', borderTop: '1px solid #222', paddingTop: '10px' }
};

export default RestaurantAdmin;