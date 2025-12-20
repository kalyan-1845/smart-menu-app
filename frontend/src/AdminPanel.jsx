import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const AdminPanel = () => {
    const navigate = useNavigate();

    // --- STATE DEFINITIONS ---
    const [formData, setFormData] = useState({ 
        name: "", 
        price: "", 
        category: "Starters", 
        description: "", 
        image: "" 
    });
    
    // Default dishes to empty array to prevent crashes
    const [dishes, setDishes] = useState([]); 
    const [restaurantName, setRestaurantName] = useState("Dashboard");
    const [loading, setLoading] = useState(true);
    
    const [ownerId] = useState(localStorage.getItem("ownerId"));
    const [token] = useState(localStorage.getItem("ownerToken"));
    const [upiId, setUpiId] = useState("");
    const [isUpiSaved, setIsUpiSaved] = useState(false);

    // --- DATA FETCHING ---
    const fetchAdminData = async () => {
        if (!ownerId || !token) { 
            navigate("/login"); 
            return; 
        }

        try {
            setLoading(true);
            
            // 1. Fetch Restaurant Name (Using Correct Production URL)
            const nameRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${ownerId}`);
            setRestaurantName(nameRes.data.username || "Restaurant");

            // 2. Fetch Dishes
            const dishRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/dishes?restaurantId=${ownerId}`);
            
            // Crash Protection: Ensure data is an array
            if (dishRes.data && Array.isArray(dishRes.data)) {
                setDishes(dishRes.data);
            } else {
                setDishes([]);
            }

        } catch (error) {
            console.error("Failed to fetch admin details:", error);
            // Force logout on authentication error
            if (error.response && error.response.status === 401) {
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    };

    // Load saved UPI and fetch data on mount
    useEffect(() => {
        const savedUPI = localStorage.getItem("restaurantUPI");
        if (savedUPI) setUpiId(savedUPI);
        
        fetchAdminData();
        // eslint-disable-next-line
    }, []);

    // --- HANDLERS ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogout = () => {
        localStorage.removeItem("ownerToken");
        localStorage.removeItem("ownerId");
        window.location.href = "/"; 
    };

    const handleSaveUPI = () => {
        if (!upiId.includes("@")) {
            alert("Invalid UPI ID. It must contain '@' (e.g., business@okaxis)");
            return;
        }
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
            alert("✅ Dish Added Successfully!");
            setFormData({ name: "", price: "", category: "Starters", description: "", image: "" });
            fetchAdminData(); 
        } catch (error) {
            console.error(error);
            alert("❌ Error adding dish. Please check your session.");
        }
    };

    const handleDelete = async (dishId) => {
        if (!window.confirm("Delete this dish?")) return;
        try {
            await axios.delete(`https://smart-menu-backend-5ge7.onrender.com/api/dishes/${dishId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAdminData(); 
        } catch (error) {
            console.error(error);
            alert("❌ Failed to delete dish.");
        }
    };

    const loadExample = () => {
        setFormData({
            name: "BBQ Chicken Pizza",
            price: 450,
            category: "Pizza",
            description: "Smoky BBQ sauce, grilled chicken, and red onions.",
            image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500"
        });
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0A0F18] flex items-center justify-center text-white">
            <div className="text-center">
                <h2 className="text-xl font-bold mb-2">Connecting to Kitchen...</h2>
                <div className="w-8 h-8 border-4 border-[#FF9933] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A0F18] text-white p-6 md:p-10 font-sans">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-gray-700 pb-4 max-w-6xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-extrabold">
                    <span className="text-[#FF9933]">{restaurantName}</span> Admin 📊
                </h1>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <Link to="/chef">
                        <button className="bg-[#181D2A] hover:bg-gray-700 border border-gray-700 px-6 py-2 rounded-lg font-bold transition">
                            ← Kitchen
                        </button>
                    </Link>
                    <button onClick={handleLogout} className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded-lg font-bold transition">
                        Logout
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left Column: Settings & Forms */}
                <div className="space-y-8">
                    {/* UPI Settings */}
                    <div className="bg-[#181D2A] p-6 rounded-3xl border border-gray-700 shadow-xl">
                        <h2 className="text-xl font-bold text-[#FF9933] mb-4">💳 Payment UPI</h2>
                        <div className="flex gap-3">
                            <input 
                                value={upiId} 
                                onChange={(e) => setUpiId(e.target.value)} 
                                placeholder="business@okaxis" 
                                className="flex-1 p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-[#FF9933] outline-none" 
                            />
                            <button 
                                onClick={handleSaveUPI} 
                                className={`px-6 py-3 rounded-lg font-bold transition ${isUpiSaved ? 'bg-green-600 text-white' : 'bg-white text-black hover:bg-gray-200'}`}
                            >
                                {isUpiSaved ? "Saved" : "Save"}
                            </button>
                        </div>
                    </div>

                    {/* Add Dish Form */}
                    <div className="bg-[#181D2A] p-8 rounded-3xl border border-gray-700 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-[#FF9933]">Add New Item</h2>
                            <button onClick={loadExample} className="text-sm text-blue-400 hover:underline">Load Example</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input name="name" value={formData.name} onChange={handleChange} required className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 outline-none" placeholder="Dish Name" />
                            <div className="grid grid-cols-2 gap-4">
                                <input name="price" type="number" value={formData.price} onChange={handleChange} required className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 outline-none" placeholder="Price (₹)" />
                                <select name="category" value={formData.category} onChange={handleChange} className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 outline-none">
                                    <option>Starters</option><option>Main Course</option><option>Pizza</option><option>Burger</option><option>Drinks</option><option>Dessert</option>
                                </select>
                            </div>
                            <input name="image" value={formData.image} onChange={handleChange} className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 outline-none" placeholder="Image URL" />
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 outline-none" placeholder="Description..." />
                            <button type="submit" className="w-full bg-[#FF9933] hover:bg-orange-500 text-white font-bold py-3 rounded-lg shadow-lg transition transform active:scale-95">Publish Item 🚀</button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Menu List */}
                <div className="bg-[#181D2A] p-6 rounded-3xl border border-gray-700 shadow-xl h-[700px] overflow-y-auto custom-scrollbar">
                    <h2 className="text-2xl font-bold mb-4">Current Menu ({dishes.length})</h2>
                    <div className="space-y-4">
                        {dishes.length === 0 ? (
                            <p className="text-gray-500 text-center py-10">No items added yet.</p>
                        ) : (
                            dishes.map((dish) => (
                                <div key={dish._id} className="flex justify-between items-center bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-gray-500 transition">
                                    <div className="flex items-center gap-4">
                                        {dish.image && <img src={dish.image} alt="mini" className="w-12 h-12 rounded-lg object-cover hidden sm:block" />}
                                        <div>
                                            <p className="text-lg font-bold">{dish.name}</p>
                                            <p className="text-[#FF9933] font-bold">₹{dish.price} <span className="text-gray-500 text-xs font-normal ml-2 bg-gray-900 px-2 py-0.5 rounded">{dish.category}</span></p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(dish._id)} className="text-red-500 font-bold hover:text-red-400 border border-red-900/30 px-3 py-1 rounded bg-red-900/10">Delete</button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;