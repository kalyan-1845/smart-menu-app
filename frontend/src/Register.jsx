import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

/**
 * Register Component
 * Allows new restaurant owners to create an account.
 * Automatically logs them in and redirects to the Chef Dashboard upon success.
 */
const Register = () => {
    const [formData, setFormData] = useState({
        restaurantName: '',
        username: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // 🎯 Clear any existing session data when the user lands on the register page
    useEffect(() => {
        localStorage.removeItem('ownerToken');
        localStorage.removeItem('ownerId');
        localStorage.removeItem('ownerUsername');
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simple validation
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            setLoading(false);
            return;
        }

        try {
            // 🎯 STEP 1: Send registration data to the backend
            // Ensure your backend authRoutes.js is listening on this endpoint
            const response = await axios.post('http://mongodb+srv://axios.post("https://smart-menu-backend-5ge7.onrender.com/api/auth/login", { ... })_db_user:vasudev1972@cluster0.phbbtix.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/api/auth/register', formData);
            
            // The backend returns the token, the new MongoDB _id, and the username
            const { token, _id, username } = response.data;

            if (token && _id) {
                // 🎯 STEP 2: Store credentials for the session
                localStorage.setItem('ownerToken', token);
                localStorage.setItem('ownerId', _id);
                localStorage.setItem('ownerUsername', username || formData.username);

                alert(`✅ Registration successful! Welcome, ${formData.restaurantName}.`);
                
                // 🎯 STEP 3: Hard Redirect
                // Using window.location.href forces a clean state refresh for the dashboard
                window.location.href = '/chef'; 
            } else {
                // Fallback if backend registers but doesn't provide a session token
                alert("✅ Account created! Please log in.");
                navigate('/login');
            }

        } catch (err) {
            console.error('Registration error:', err);
            // Extracts the specific error message from the backend (e.g., "Email already exists")
            const msg = err.response?.data?.message || 'Registration failed. Username or Email might already be taken.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0A0F18] p-6 font-sans selection:bg-[#FF9933] selection:text-white">
            <div className="bg-[#181D2A] p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-700/50">
                
                {/* --- Header --- */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-[#FF9933] mb-2">
                        🚀 Launch Your Menu
                    </h1>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Create your restaurant account and start taking orders.
                    </p>
                </div>

                {/* --- Registration Form --- */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Restaurant Name */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1" htmlFor="restaurantName">
                            Restaurant Name
                        </label>
                        <input
                            type="text"
                            name="restaurantName"
                            id="restaurantName"
                            value={formData.restaurantName}
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 focus:ring-2 focus:ring-[#FF9933] focus:border-transparent text-white transition outline-none placeholder:text-gray-600"
                            placeholder="e.g., Kalyan's Pizza Hub"
                        />
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1" htmlFor="username">
                            Username (Public ID)
                        </label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 focus:ring-2 focus:ring-[#FF9933] focus:border-transparent text-white transition outline-none placeholder:text-gray-600"
                            placeholder="e.g., kalyanresto"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1" htmlFor="email">
                            Business Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 focus:ring-2 focus:ring-[#FF9933] focus:border-transparent text-white transition outline-none placeholder:text-gray-600"
                            placeholder="contact@restaurant.com"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 focus:ring-2 focus:ring-[#FF9933] focus:border-transparent text-white transition outline-none placeholder:text-gray-600"
                            placeholder="Min. 6 characters"
                        />
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="text-red-400 bg-red-900/20 p-3 rounded-xl text-sm border border-red-800/50 text-center animate-pulse">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#138808] hover:bg-[#19ac0b] text-white font-black py-4 rounded-2xl shadow-lg shadow-green-900/20 transition transform active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm mt-2"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating Kitchen...
                            </span>
                        ) : (
                            'Create Account & Access 🚀'
                        )}
                    </button>
                </form>

                {/* --- Footer Links --- */}
                <div className="mt-8 text-center pt-6 border-t border-gray-700/30">
                    <p className="text-gray-400 text-sm">
                        Already have a restaurant account? 
                        <Link to="/login" className="text-[#FF9933] hover:text-orange-400 hover:underline ml-1 font-bold transition">
                            Log In Here
                        </Link>
                    </p>
                </div>
            </div>
            {/* Version Disclaimer */}
            <p className="fixed bottom-6 text-gray-700 text-[10px] uppercase tracking-widest">
                Restaurant SaaS Platform v2.0 • Data Encryption Active
            </p>
        </div>
    );
};

export default Register;