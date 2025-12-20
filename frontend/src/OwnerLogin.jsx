import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

/**
 * OwnerLogin Component
 * Handles secure authentication for restaurant staff/owners.
 * Saves session data to LocalStorage and redirects to the Chef Dashboard.
 */
const OwnerLogin = () => {
    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Update state when user types in inputs
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 🎯 STEP 1: Session Cleanup
            // Removes data from any previous login to prevent "ghost" sessions
            localStorage.removeItem("ownerToken");
            localStorage.removeItem("ownerId");
            localStorage.removeItem("ownerUsername");

            // 🎯 STEP 2: API Call
            // Note: Ensure your Backend is running on port 5000 and CORS is enabled
            const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/...localhost:5000/api/auth/login", formData);
            
            // 🎯 STEP 3: Validation & Storage
            // We check if data exists before trying to use it to prevent crashes
            if (response.data) {
                const { token, _id, username } = response.data;

                if (token && _id) {
                    // Persist Session
                    localStorage.setItem("ownerToken", token);
                    localStorage.setItem("ownerId", _id); 
                    
                    // Save the username (Restaurant ID) to construct profile links later
                    localStorage.setItem("ownerUsername", username || formData.username);
                    
                    // 🎯 STEP 4: Hard Redirect
                    // Using window.location.href forces a full page refresh.
                    // This ensures all App components re-check authentication status from scratch.
                    window.location.href = "/chef";
                } else {
                    throw new Error("Login successful, but server did not send a token.");
                }
            } else {
                throw new Error("Server sent an empty response.");
            }

        } catch (err) {
            console.error("Login attempt failed:", err);
            
            // 🛠️ ROBUST ERROR HANDLING
            if (err.response) {
                // The server responded with a status code other than 2xx (e.g., 401, 400, 500)
                // This is where "Invalid Username/Password" messages come from
                const serverMessage = err.response.data?.message || "Invalid credentials.";
                setError(serverMessage);
            } else if (err.request) {
                // The request was made but no response was received
                // This usually means the Backend is offline or blocked by CORS
                setError("Server is not reachable. Is the Backend running on port 5000?");
            } else {
                // Something happened in setting up the request
                setError(`Error: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0A0F18] p-6 font-sans selection:bg-[#FF9933] selection:text-white">
            <div className="bg-[#181D2A] p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700/50 text-white">
                
                {/* --- Logo/Title Area --- */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-gray-800 rounded-full shadow-inner">
                            <span className="text-3xl">🔒</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-[#FF9933]">
                        Staff Access
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                        Enter your credentials to unlock the Kitchen, Waiter, and Admin dashboards.
                    </p>
                </div>

                {/* --- Login Form --- */}
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

                    {/* --- Error Feedback Display --- */}
                    {error && (
                        <div className="text-red-400 bg-red-900/20 p-3 rounded-lg text-sm border border-red-800/50 text-center animate-pulse">
                            <strong>Login Failed:</strong> {error}
                        </div>
                    )}

                    {/* --- Submit Button --- */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#FF9933] hover:bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/20 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="https://smart-menu-backend-5ge7.onrender.com/...www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Authenticating...
                            </span>
                        ) : (
                            'Unlock Dashboards 🔑'
                        )}
                    </button>
                </form>

                {/* --- Footer Registration Link --- */}
                <div className="mt-8 text-center pt-6 border-t border-gray-700/30">
                    <p className="text-gray-400 text-sm">
                        New Restaurant Owner? 
                        <Link to="/register" className="text-[#138808] hover:text-[#19ac0b] hover:underline ml-2 font-bold transition">
                            Register Your Business
                        </Link>
                    </p>
                </div>
            </div>
            
            {/* Version Badge */}
            <p className="fixed bottom-6 text-gray-600 text-[10px] uppercase tracking-widest font-mono">
                Smart Menu System v2.0 • Secure Session Encryption Enabled
            </p>
        </div>
    );
};

export default OwnerLogin;