import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const AdminPanel = () => {
    const navigate = useNavigate();
    

    // --- STATE DEFINITIONS ---
    
    // 1. Dish Form State
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        category: "Starters", // Default category
        description: "",
        image: ""
    });

    // 2. Data State
    const [dishes, setDishes] = useState([]);
    const [restaurantName, setRestaurantName] = useState("Dashboard");

    // 3. Auth State
    const [ownerId, setOwnerId] = useState(localStorage.getItem("ownerId"));
    const [token, setToken] = useState(localStorage.getItem("ownerToken"));

    // 4. UPI Payment State (NEW)
    const [upiId, setUpiId] = useState("");
    const [isUpiSaved, setIsUpiSaved] = useState(false);

    // --- EFFECTS ---

    // Effect 1: Load Admin Data (Restaurant Name & Menu)
    const fetchAdminData = async () => {
        if (!ownerId || !token) {
            navigate("/login");
            return;
        }

        try {
            // Fetch Restaurant Name
            const nameRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${ownerId}`);
            setRestaurantName(nameRes.data.username);

            // Fetch Dishes
            const dishRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/dishes?restaurantId=${ownerId}`);
            setDishes(dishRes.data);
        } catch (error) {
            console.error("Failed to fetch admin details:", error);
            if (error.response?.status === 401) {
                handleLogout();
            }
        }
    };

    // Effect 2: Load Saved UPI ID from LocalStorage
    useEffect(() => {
        const savedUPI = localStorage.getItem("restaurantUPI");
        if (savedUPI) setUpiId(savedUPI);
        
        // Trigger fetch
        fetchAdminData();
    }, [ownerId]);

    // --- HANDLERS ---

    // 1. Form Handlers
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 2. Auth Handler
    const handleLogout = () => {
        localStorage.removeItem("ownerToken");
        localStorage.removeItem("ownerId");
        window.location.href = "/"; 
    };

    // 3. Save UPI Handler (NEW)
    const handleSaveUPI = () => {
        if (!upiId.includes("@")) {
            alert("Invalid UPI ID. It must contain '@' (e.g., name@okaxis)");
            return;
        }
        localStorage.setItem("restaurantUPI", upiId);
        setIsUpiSaved(true);
        setTimeout(() => setIsUpiSaved(false), 2000); // Reset success message
    };

    // 4. Submit New Dish
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
            alert("❌ Error adding dish. Please check your session.");
        }
    };

    // 5. Delete Dish
    const handleDelete = async (dishId) => {
        if (!window.confirm("Delete this dish?")) return;
        try {
            await axios.delete(`https://smart-menu-backend-5ge7.onrender.com/api/dishes/${dishId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAdminData();
        } catch (error) {
            alert("❌ Failed to delete dish.");
        }
    };

    // 6. Helper
    const loadExample = () => {
        setFormData({
            name: "BBQ Chicken Pizza",
            price: 450,
            category: "Pizza",
            description: "Smoky BBQ sauce, grilled chicken, and red onions.",
            image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500"
        });
    };

    return (
        <div className="min-h-screen bg-[#0A0F18] font-sans text-white p-6 md:p-10">
            
            {/* --- HEADER --- */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 max-w-6xl mx-auto border-b border-gray-700 pb-4">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white">
                    <span className="text-[#FF9933]">{restaurantName}</span> Admin 📊
                </h1>
                <div className="flex gap-4">
                    <Link to="/chef">
                        <button className="bg-[#181D2A] hover:bg-gray-700 border border-gray-700 px-6 py-2 rounded-lg font-bold text-gray-300 transition">
                            ← Kitchen
                        </button>
                    </Link>
                    <button onClick={handleLogout} className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded-lg font-bold transition">
                        Logout
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* --- LEFT COLUMN: Settings & Forms --- */}
                <div className="space-y-8">
                    
                    {/* 1. UPI SETTINGS CARD (NEW) */}
                    <div className="bg-[#181D2A] p-6 rounded-3xl shadow-xl border border-gray-700">
                        <h2 className="text-xl font-bold text-[#FF9933] mb-4 flex items-center gap-2">
                            💳 Payment Settings <span className="text-xs text-gray-400 font-normal">(Required for Online Pay)</span>
                        </h2>
                        <label className="block text-sm text-gray-400 mb-2">Your UPI ID (e.g. business@okaxis)</label>
                        <div className="flex gap-3">
                            <input 
                                value={upiId} 
                                onChange={(e) => setUpiId(e.target.value)} 
                                placeholder="Enter UPI ID..." 
                                className="flex-1 p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-[#FF9933] outline-none text-white"
                            />
                            <button 
                                onClick={handleSaveUPI} 
                                className={`px-6 py-3 rounded-lg font-bold transition ${isUpiSaved ? 'bg-green-600 text-white' : 'bg-white text-black hover:bg-gray-200'}`}
                            >
                                {isUpiSaved ? "Saved!" : "Save"}
                            </button>
                        </div>
                    </div>

                    {/* 2. ADD DISH FORM */}
                    <div className="bg-[#181D2A] p-8 rounded-3xl shadow-xl border border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-[#FF9933]">Add New Item</h2>
                            <button onClick={loadExample} className="text-sm text-blue-400 hover:underline">Load Example</button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input name="name" value={formData.name} onChange={handleChange} required className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-[#FF9933] outline-none" placeholder="Dish Name" />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <input name="price" type="number" value={formData.price} onChange={handleChange} required className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 outline-none" placeholder="Price (₹)" />
                                {/* Changed category to Select for better UX */}
                                <select name="category" value={formData.category} onChange={handleChange} className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 outline-none text-white">
                                    <option value="Starters">Starters</option>
                                    <option value="Main Course">Main Course</option>
                                    <option value="Pizza">Pizza</option>
                                    <option value="Burger">Burger</option>
                                    <option value="Drinks">Drinks</option>
                                    <option value="Dessert">Dessert</option>
                                </select>
                            </div>

                            <input name="image" value={formData.image} onChange={handleChange} className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 outline-none" placeholder="Image URL (https://...)" />
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 outline-none" placeholder="Description..." />
                            
                            <button type="submit" className="w-full bg-[#FF9933] hover:bg-orange-500 text-white font-bold py-3 rounded-lg shadow-lg transition transform active:scale-95">
                                Publish Item 🚀
                            </button>
                        </form>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: Menu List --- */}
                <div>
                    <h2 className="text-2xl font-bold mb-4 text-white flex justify-between items-center">
                        Current Menu 
                        <span className="bg-gray-800 text-sm px-3 py-1 rounded-full text-gray-400">{dishes.length} Items</span>
                    </h2>
                    
                    <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                        {dishes.length === 0 ? (
                            <div className="text-center p-10 border border-dashed border-gray-700 rounded-xl">
                                <p className="text-gray-500">No dishes yet. Add your first item!</p>
                            </div>
                        ) : (
                            dishes.map((dish) => (
                                <div key={dish._id} className="bg-[#181D2A] p-4 rounded-xl flex justify-between items-center border border-gray-700 hover:border-gray-500 transition">
                                    <div className="flex items-center gap-4">
                                        {/* Optional: Show tiny image preview if exists */}
                                        {dish.image && <img src={dish.image} alt="mini" className="w-12 h-12 rounded-lg object-cover hidden sm:block" />}
                                        <div>
                                            <p className="text-lg font-bold text-white">{dish.name}</p>
                                            <p className="text-[#FF9933] font-extrabold">₹{dish.price} <span className="text-gray-500 text-xs font-normal ml-2 bg-gray-800 px-2 py-0.5 rounded">{dish.category}</span></p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(dish._id)} className="bg-red-600/20 text-red-500 border border-red-600/50 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg font-bold transition">
                                        Delete
                                    </button>
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