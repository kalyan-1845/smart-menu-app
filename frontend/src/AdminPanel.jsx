import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [error, setError] = useState(""); 
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // ✅ FIX 1: Cleaned the production URL to remove "...localhost:5000"
            const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/auth/login", formData);
            
            // Store credentials
            localStorage.setItem("ownerToken", response.data.token);
            localStorage.setItem("ownerId", response.data.ownerId);
            
            alert("✅ Login Successful!");
            navigate("/admin");
        } catch (err) {
            // ✅ FIX 2: Constructed a readable error message based on your reference
            const errorMessage = err.response
                ? err.response.data?.message || "Invalid credentials."
                : err.request
                ? "Server is not reachable. Is the backend awake on Render?"
                : `Error: ${err.message}`;

            // This prevents the "Mr" log by providing specific context
            console.error(`Login attempt failed: ${errorMessage}`, err); 
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0F18] flex items-center justify-center text-white p-6 font-sans">
            <div className="bg-[#181D2A] p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-700/50">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-[#FF9933] mb-2">Staff Access 🔒</h1>
                    <p className="text-gray-400 text-sm">Enter your credentials to unlock the dashboard.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Restaurant ID</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 focus:ring-2 focus:ring-[#FF9933] text-white outline-none"
                            placeholder="e.g., kalyanresto1"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Staff Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 focus:ring-2 focus:ring-[#FF9933] text-white outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 bg-red-900/20 p-3 rounded-xl text-sm border border-red-800/50 text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#FF9933] hover:bg-orange-500 text-white font-black py-4 rounded-2xl shadow-lg transition transform active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm"
                    >
                        {loading ? "Verifying..." : "Unlock Dashboards 🔑"}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-gray-700/30">
                    <p className="text-gray-400 text-sm">
                        New Restaurant Owner? 
                        <Link to="/register" className="text-[#FF9933] hover:underline ml-1 font-bold">Register Here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;