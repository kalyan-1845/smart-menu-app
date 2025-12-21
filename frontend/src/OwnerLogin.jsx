import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

/**
 * OwnerLogin Component
 * Handles secure authentication for restaurant staff/owners.
 */
const OwnerLogin = () => {
    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 🎯 STEP 1: Session Cleanup
            localStorage.removeItem("ownerToken");
            localStorage.removeItem("ownerId");
            localStorage.removeItem("ownerUsername");

            // 🎯 STEP 2: API Call
            // ✅ CLEAN URL FIX: Removed '...localhost:5000' to prevent 404 errors
            const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/auth/login", formData);
            
            // 🎯 STEP 3: Validation & Storage
            if (response.data) {
                const { token, _id, username } = response.data;

                if (token && _id) {
                    localStorage.setItem("ownerToken", token);
                    localStorage.setItem("ownerId", _id); 
                    localStorage.setItem("ownerUsername", username || formData.username);
                    
                    // 🎯 STEP 4: Hard Redirect for clean state
                    window.location.href = "/chef";
                } else {
                    throw new Error("Login successful, but server did not send a token.");
                }
            }

        } catch (err) {
            // ✅ "Mr" ERROR LOGGING FIX: Construct a readable message first
            const errorMessage = err.response
                ? err.response.data?.message || "Invalid credentials."
                : err.request
                ? "Server is not reachable. Please wait 60s for Render to wake up."
                : `Error: ${err.message}`;

            // Log the informative message instead of the minified object
            console.error(`Login attempt failed: ${errorMessage}`, err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0A0F18] p-6 font-sans selection:bg-[#FF9933] selection:text-white">
            <div className="bg-[#181D2A] p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700/50 text-white">
                
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-gray-800 rounded-full shadow-inner">
                            <span className="text-3xl">🔒</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-[#FF9933]">Staff Access</h1>
                    <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                        Enter your credentials to unlock the Kitchen, Waiter, and Admin dashboards.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="username">
                            Restaurant ID (Username)
                        </label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            autoComplete="username"
                            className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:ring-2 focus:ring-[#FF9933] focus:border-transparent text-white transition outline-none placeholder:text-gray-600"
                            placeholder="e.g., kalyanresto"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="password">
                            Staff Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            autoComplete="current-password"
                            className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:ring-2 focus:ring-[#FF9933] focus:border-transparent text-white transition outline-none placeholder:text-gray-600"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 bg-red-900/20 p-3 rounded-lg text-sm border border-red-800/50 text-center animate-pulse">
                            <strong>Login Failed:</strong> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#FF9933] hover:bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/20 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                    >
                        {loading ? "Authenticating..." : 'Unlock Dashboards 🔑'}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-gray-700/30">
                    <p className="text-gray-400 text-sm">
                        New Restaurant Owner? 
                        <Link to="/register" className="text-[#138808] hover:text-[#19ac0b] hover:underline ml-2 font-bold transition">
                            Register Your Business
                        </Link>
                    </p>
                </div>
            </div>
            
            <p className="fixed bottom-6 text-gray-600 text-[10px] uppercase tracking-widest font-mono">
                Smart Menu System v2.0 • Secure Session Encryption Enabled
            </p>
        </div>
    );
};

export default OwnerLogin;