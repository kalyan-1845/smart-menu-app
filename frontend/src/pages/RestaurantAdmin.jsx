import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaUtensils, FaUserTie, FaQrcode, FaPlus, FaTrash, FaEdit, 
  FaChartLine, FaSignOutAlt, FaLock, FaBars 
} from "react-icons/fa";

// --- API CONFIG ---
const API_URL = "https://smart-menu-backend-5ge7.onrender.com";

const RestaurantAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- STATE ---
  const [restaurant, setRestaurant] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [activeTab, setActiveTab] = useState("menu"); // 'menu', 'qr', 'staff'
  const [loading, setLoading] = useState(true);

  // Modal State for Staff Login
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [rolePassword, setRolePassword] = useState("");
  const [roleError, setRoleError] = useState("");

  // Menu Form State
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "Starters", image: "", description: "" });
  const [isEditing, setIsEditing] = useState(null);

  // --- FETCH DATA ---
  useEffect(() => {
    fetchRestaurantData();
    fetchDishes();
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/restaurant/${id}`);
      const data = await res.json();
      if (res.ok) setRestaurant(data);
    } catch (err) {
      console.error("Error fetching restaurant:", err);
    }
  };

  const fetchDishes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/menu/${id}`);
      const data = await res.json();
      setDishes(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching dishes:", err);
    }
  };

  // --- STAFF ACCESS LOGIC (The New Feature) ---
  const openStaffLogin = (role) => {
    setSelectedRole(role);
    setRolePassword("");
    setRoleError("");
    setShowStaffModal(true);
  };

  const handleStaffLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: id, 
          role: selectedRole, 
          password: rolePassword 
        }),
      });

      if (res.ok) {
        setShowStaffModal(false);
        // Open in new tab so Admin stays open
        window.open(`/${id}/${selectedRole}`, "_blank");
      } else {
        setRoleError("Wrong Password! (Try 'bitebox18')");
      }
    } catch (err) {
      setRoleError("Network Error");
    }
  };

  // --- MENU MANAGEMENT LOGIC ---
  const handleAddDish = async () => {
    if (!newItem.name || !newItem.price) return alert("Name and Price required");

    const endpoint = isEditing 
      ? `${API_URL}/api/menu/edit/${isEditing}` 
      : `${API_URL}/api/menu/add`;
    
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newItem, restaurantId: id }),
    });

    if (res.ok) {
      fetchDishes();
      setNewItem({ name: "", price: "", category: "Starters", image: "", description: "" });
      setIsEditing(null);
    }
  };

  const handleDelete = async (dishId) => {
    if (!window.confirm("Delete this item?")) return;
    await fetch(`${API_URL}/api/menu/delete/${dishId}`, { method: "DELETE" });
    fetchDishes();
  };

  const handleEdit = (dish) => {
    setNewItem(dish);
    setIsEditing(dish._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return <div style={{ color: "white", textAlign: "center", marginTop: "50px" }}>Loading Dashboard...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", paddingBottom: "80px" }}>
      
      {/* --- HEADER --- */}
      <div style={{ 
        padding: "20px", 
        background: "#111", 
        borderBottom: "1px solid #222", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <div>
          <h2 style={{ margin: 0, color: "#f97316" }}>{restaurant?.restaurantName || "Admin Panel"}</h2>
          <span style={{ fontSize: "12px", color: "#666" }}>Dashboard • {id}</span>
        </div>
        <button onClick={() => navigate("/")} style={{ background: "transparent", border: "none", color: "#666" }}>
          <FaSignOutAlt size={20} />
        </button>
      </div>

      {/* --- TAB NAVIGATION --- */}
      <div style={{ display: "flex", justifyContent: "space-around", background: "#000", padding: "10px 0", borderBottom: "1px solid #222" }}>
        {['menu', 'qr', 'staff'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              background: activeTab === tab ? "#f97316" : "transparent",
              color: activeTab === tab ? "white" : "#888",
              border: "none", padding: "8px 16px", borderRadius: "20px", fontWeight: "bold", textTransform: "capitalize"
            }}
          >
            {tab === 'qr' ? 'QR Code' : tab}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>

        {/* --- 1. MENU TAB --- */}
        {activeTab === 'menu' && (
          <div>
            {/* Add Item Form */}
            <div style={{ background: "#111", padding: "20px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #222" }}>
              <h3 style={{ marginTop: 0, marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                {isEditing ? <FaEdit color="#f97316"/> : <FaPlus color="#f97316"/>} 
                {isEditing ? "Edit Dish" : "Add New Dish"}
              </h3>
              
              <div style={{ display: "grid", gap: "10px" }}>
                <input 
                  placeholder="Item Name (e.g. Butter Chicken)" 
                  value={newItem.name} 
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                  style={inputStyle} 
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <input 
                    type="number" placeholder="Price (₹)" 
                    value={newItem.price} 
                    onChange={e => setNewItem({...newItem, price: e.target.value})}
                    style={{ ...inputStyle, flex: 1 }} 
                  />
                  <select 
                    value={newItem.category} 
                    onChange={e => setNewItem({...newItem, category: e.target.value})}
                    style={{ ...inputStyle, flex: 1 }}
                  >
                    <option>Starters</option>
                    <option>Main Course</option>
                    <option>Drinks</option>
                    <option>Desserts</option>
                    <option>Breads</option>
                  </select>
                </div>
                <button 
                  onClick={handleAddDish} 
                  style={{ background: "#f97316", color: "white", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", marginTop: "10px" }}
                >
                  {isEditing ? "Update Dish" : "Add to Menu"}
                </button>
                {isEditing && (
                  <button onClick={() => { setIsEditing(null); setNewItem({ name: "", price: "", category: "Starters", image: "", description: "" }); }} style={{ background: "#333", color: "white", border: "none", padding: "8px", borderRadius: "8px" }}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            {/* Menu List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {dishes.map((dish) => (
                <div key={dish._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111", padding: "15px", borderRadius: "12px", border: "1px solid #222" }}>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "16px" }}>{dish.name}</div>
                    <div style={{ color: "#888", fontSize: "14px" }}>₹{dish.price} • {dish.category}</div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => handleEdit(dish)} style={{ background: "#222", color: "#fff", border: "none", padding: "8px", borderRadius: "6px" }}><FaEdit /></button>
                    <button onClick={() => handleDelete(dish._id)} style={{ background: "#3a1111", color: "#ff4d4d", border: "none", padding: "8px", borderRadius: "6px" }}><FaTrash /></button>
                  </div>
                </div>
              ))}
              {dishes.length === 0 && <div style={{ textAlign: "center", color: "#666", padding: "20px" }}>No items yet. Add one above!</div>}
            </div>
          </div>
        )}

        {/* --- 2. QR CODE TAB --- */}
        {activeTab === 'qr' && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <FaQrcode size={80} color="white" style={{ background: "white", padding: "10px", borderRadius: "8px", color: "black" }} />
            <h3 style={{ marginTop: "20px" }}>Your Digital Menu QR</h3>
            <p style={{ color: "#888" }}>Scan to view menu</p>
            <div style={{ background: "#222", padding: "15px", borderRadius: "8px", wordBreak: "break-all", fontFamily: "monospace", fontSize: "12px", color: "#f97316" }}>
              https://smartmenuss.netlify.app/menu/{id}/1
            </div>
            <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>Print this code and stick it on your tables.</p>
          </div>
        )}

        {/* --- 3. STAFF ACCESS TAB (What you asked for!) --- */}
        {activeTab === 'staff' && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <h3 style={{ marginBottom: "30px" }}>Open Staff Panels</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Chef Button */}
              <div 
                onClick={() => openStaffLogin('chef')}
                style={{ background: "#1a1a1a", padding: "25px", borderRadius: "16px", border: "1px solid #333", cursor: "pointer", display: "flex", alignItems: "center", gap: "20px" }}
              >
                <div style={{ background: "#222", padding: "15px", borderRadius: "50%" }}>
                  <FaUtensils size={24} color="#f97316" />
                </div>
                <div style={{ textAlign: "left" }}>
                  <h4 style={{ margin: 0, fontSize: "18px" }}>Kitchen Display</h4>
                  <span style={{ color: "#666", fontSize: "13px" }}>For Chefs to manage orders</span>
                </div>
              </div>

              {/* Waiter Button */}
              <div 
                onClick={() => openStaffLogin('waiter')}
                style={{ background: "#1a1a1a", padding: "25px", borderRadius: "16px", border: "1px solid #333", cursor: "pointer", display: "flex", alignItems: "center", gap: "20px" }}
              >
                <div style={{ background: "#222", padding: "15px", borderRadius: "50%" }}>
                  <FaUserTie size={24} color="#3b82f6" />
                </div>
                <div style={{ textAlign: "left" }}>
                  <h4 style={{ margin: 0, fontSize: "18px" }}>Waiter Dashboard</h4>
                  <span style={{ color: "#666", fontSize: "13px" }}>For managing tables & bills</span>
                </div>
              </div>
            </div>

            <p style={{ marginTop: "30px", color: "#444", fontSize: "12px" }}>
              Default Password: <b>bitebox18</b>
            </p>
          </div>
        )}

      </div>

      {/* --- STAFF LOGIN MODAL --- */}
      {showStaffModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.85)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "#111", padding: "30px", borderRadius: "16px", width: "90%", maxWidth: "320px", textAlign: "center", border: "1px solid #333" }}>
            <FaLock size={24} color="#f97316" style={{ marginBottom: "15px" }} />
            <h3 style={{ margin: "0 0 15px 0" }}>
              {selectedRole === 'chef' ? 'Kitchen Access' : 'Waiter Access'}
            </h3>
            <input 
              type="password" 
              autoFocus
              placeholder="Enter Staff Password"
              value={rolePassword}
              onChange={e => setRolePassword(e.target.value)}
              style={{ ...inputStyle, textAlign: "center", marginBottom: "10px" }}
            />
            {roleError && <div style={{ color: "#ff4d4d", fontSize: "13px", marginBottom: "10px" }}>{roleError}</div>}
            
            <button 
              onClick={handleStaffLogin}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "#f97316", color: "white", border: "none", fontWeight: "bold", fontSize: "16px" }}
            >
              Unlock
            </button>
            <button 
              onClick={() => setShowStaffModal(false)}
              style={{ marginTop: "15px", background: "transparent", color: "#888", border: "none", textDecoration: "underline" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

const inputStyle = {
  width: "100%", padding: "12px", background: "#222", border: "1px solid #333", borderRadius: "8px", color: "white", outline: "none"
};

export default RestaurantAdmin;