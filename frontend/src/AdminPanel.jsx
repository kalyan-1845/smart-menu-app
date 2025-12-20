import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const AdminPanel = () => {
    const navigate = useNavigate();

    // --- STATE DEFINITIONS ---
    const [formData, setFormData] = useState({ name: "", price: "", category: "Starters", description: "", image: "" });
    const [dishes, setDishes] = useState([]); 
    const [restaurantName, setRestaurantName] = useState("Dashboard");
    const [loading, setLoading] = useState(true);
    const [ownerId] = useState(localStorage.getItem("ownerId"));
    const [token] = useState(localStorage.getItem("ownerToken"));
    const [upiId, setUpiId] = useState("");
    const [isUpiSaved, setIsUpiSaved] = useState(false);

    // --- DATA FETCHING ---
    const fetchAdminData = async () => {
        if (!ownerId || !token) { navigate("/login"); return; }
        try {
            setLoading(true);
            // ✅ Ensure URL exactly matches the backend route to prevent 404
            const nameRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${ownerId}`);
            setRestaurantName(nameRes.data.username || "Restaurant");

            const dishRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/dishes?restaurantId=${ownerId}`);
            setDishes(Array.isArray(dishRes.data) ? dishRes.data : []);
        } catch (e) {
            const errorMessage = e.response ? e.response.data?.message : e.message;
            console.error(`Fetch failed: ${errorMessage}`, e);
            if (e.response?.status === 401) handleLogout();
        } finally { setLoading(false); }
    };

    useEffect(() => {
        const savedUPI = localStorage.getItem("restaurantUPI");
        if (savedUPI) setUpiId(savedUPI);
        fetchAdminData();
    }, [ownerId, token]);

    // --- HANDLERS ---
    const handleLogout = () => {
        localStorage.removeItem("ownerToken");
        localStorage.removeItem("ownerId");
        window.location.href = "/"; 
    };

    const handleSaveUPI = () => {
        if (!upiId.includes("@")) { alert("Invalid UPI ID"); return; }
        localStorage.setItem("restaurantUPI", upiId);
        setIsUpiSaved(true);
        setTimeout(() => setIsUpiSaved(false), 2000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/dishes", formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("✅ Dish Added!");
            setFormData({ name: "", price: "", category: "Starters", description: "", image: "" });
            fetchAdminData(); 
        } catch (error) { alert("❌ Error adding dish."); }
    };

    const handleDelete = async (dishId) => {
        if (!window.confirm("Delete this item?")) return;
        try {
            await axios.delete(`https://smart-menu-backend-5ge7.onrender.com/api/dishes/${dishId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAdminData();
        } catch (error) { alert("❌ Delete failed."); }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0A0F18] flex items-center justify-center text-white">
            <div className="text-center">
                <h2 className="text-xl font-bold mb-2">Connecting to Backend...</h2>
                <div className="w-8 h-8 border-4 border-[#FF9933] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-500 text-sm mt-2">Wait 60s if the server is sleeping.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A0F18] text-white p-6 md:p-10">
            <header className="flex flex-col md:flex-row justify-between items-center mb-10 max-w-6xl mx-auto border-b border-gray-700 pb-4">
                <h1 className="text-3xl font-extrabold"><span className="text-[#FF9933]">{restaurantName}</span> Admin 📊</h1>
                <div className="flex gap-4">
                    <Link to="/chef"><button className="bg-gray-800 px-6 py-2 rounded-lg hover:bg-gray-700 transition">Kitchen</button></Link>
                    <button onClick={handleLogout} className="bg-red-600 px-6 py-2 rounded-lg font-bold">Logout</button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                    {/* UPI Settings */}
                    <div className="bg-[#181D2A] p-6 rounded-3xl border border-gray-700 shadow-xl">
                        <h2 className="text-xl font-bold text-[#FF9933] mb-4">💳 Payment UPI</h2>
                        <div className="flex gap-3">
                            <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="business@okaxis" className="flex-1 p-3 rounded-lg bg-gray-700 outline-none text-white" />
                            <button onClick={handleSaveUPI} className={`px-6 py-3 rounded-lg font-bold ${isUpiSaved ? 'bg-green-600' : 'bg-white text-black'}`}>{isUpiSaved ? "Saved" : "Save"}</button>
                        </div>
                    </div>

                    {/* Add Dish Form */}
                    <div className="bg-[#181D2A] p-8 rounded-3xl border border-gray-700 shadow-xl">
                        <h2 className="text-2xl font-bold text-[#FF9933] mb-6">Add New Item</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Item Name" className="w-full p-3 rounded-lg bg-gray-700 text-white" required />
                            <div className="grid grid-cols-2 gap-4">
                                <input name="price" type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="Price" className="w-full p-3 rounded-lg bg-gray-700 text-white" required />
                                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full p-3 rounded-lg bg-gray-700 text-white">
                                    <option>Starters</option><option>Main Course</option><option>Pizza</option><option>Burger</option><option>Drinks</option><option>Dessert</option>
                                </select>
                            </div>
                            <input name="image" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} placeholder="Image URL" className="w-full p-3 rounded-lg bg-gray-700 text-white" />
                            <textarea name="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Description" className="w-full p-3 rounded-lg bg-gray-700 text-white" />
                            <button type="submit" className="w-full bg-[#FF9933] py-3 rounded-lg font-bold hover:bg-orange-500 transition shadow-lg">Publish Item 🚀</button>
                        </form>
                    </div>
                </div>

                {/* Menu List */}
                <div className="bg-[#181D2A] p-6 rounded-3xl border border-gray-700 shadow-xl h-[700px] overflow-y-auto">
                    <h2 className="text-2xl font-bold mb-4">Current Menu ({dishes.length})</h2>
                    <div className="space-y-4">
                        {dishes.length === 0 ? <p className="text-gray-500 text-center py-10">No items added yet.</p> : dishes.map((dish) => (
                            <div key={dish._id} className="flex justify-between items-center bg-gray-800 p-4 rounded-xl border border-gray-700">
                                <div className="flex items-center gap-4">
                                    {dish.image && <img src={dish.image} className="w-12 h-12 rounded-lg object-cover" alt="" />}
                                    <div><p className="font-bold">{dish.name}</p><p className="text-[#FF9933] font-bold">₹{dish.price}</p></div>
                                </div>
                                <button onClick={() => handleDelete(dish._id)} className="text-red-500 font-bold hover:text-red-400">Delete</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;