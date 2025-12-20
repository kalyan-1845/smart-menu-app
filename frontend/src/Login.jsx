import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
    const navigate = useNavigate();
    
    // State for form inputs
    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });
    
    // State for error/loading
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Handle typing in input boxes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle Login Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // ✅ FIX: This is the Clean URL. No "localhost".
            const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/auth/login", formData);
            
            // Save token and ownerId to localStorage
            localStorage.setItem("ownerToken", response.data.token);
            localStorage.setItem("ownerId", response.data.ownerId);

            // Redirect to Admin Dashboard
            navigate("/admin");

        } catch (err) {
            // ✅ FIX: Readable error message logging
            const errorMessage = err.response && err.response.data && err.response.data.message
                ? err.response.data.message
                : "Server not reachable. Please wait 60s for Render to wake up.";
            
            console.error("Login Failed Details:", err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center text-white font-sans">
            <div className="bg-[#1a1a1a] p-10 rounded-2xl w-full max-w-md shadow-2xl">
                <h2 className="text-center text-3xl font-bold mb-8 text-[#f97316]">
                    Staff Access 🔒
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    
                    <div>
                        <label className="block mb-2 text-sm text-gray-400">Restaurant ID / Username</label>
                        <input 
                            type="text" 
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            placeholder="Enter username"
                            className="w-full p-3 rounded-lg bg-[#0d0d0d] border border-gray-800 text-white focus:outline-none focus:border-[#f97316]"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm text-gray-400">Password</label>
                        <input 
                            type="password" 
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Enter password"
                            className="w-full p-3 rounded-lg bg-[#0d0d0d] border border-gray-800 text-white focus:outline-none focus:border-[#f97316]"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-900/20 border border-red-600 text-red-500 p-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full p-3 rounded-lg font-bold text-white transition ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#f97316] hover:bg-orange-600'}`}
                    >
                        {loading ? "Verifying..." : "Unlock Dashboard 🔑"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>New Restaurant Owner? <Link to="/register" className="text-[#f97316] hover:underline">Register Here</Link></p>
                </div>

            </div>
        </div>
    );
};

export default Login;