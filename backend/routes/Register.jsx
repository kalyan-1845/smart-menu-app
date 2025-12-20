import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Create Account
      const res = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/auth/register", {
        username,
        password
      });

      // Auto Login
      localStorage.setItem("ownerToken", res.data.token);
      localStorage.setItem("ownerId", res.data._id); // Save ID for later
      
      alert(`🎉 Welcome, ${username}! Your restaurant is created.`);
      navigate("/admin"); // Go to Add Dish page
    } catch (error) {
      alert("❌ Registration failed. Username might be taken.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-96 border border-gray-700">
        <h2 className="text-3xl font-bold text-center text-white mb-2">🚀 Start Up</h2>
        <p className="text-gray-400 text-center mb-6">Create your Restaurant Account</p>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm">Restaurant Name</label>
            <input 
              type="text" 
              className="w-full p-2 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Pizza Hut"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">Password</label>
            <input 
              type="password" 
              className="w-full p-2 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded transition">
            Create Account
          </button>
        </form>

        <p className="text-gray-400 text-center mt-4 text-sm">
          Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;