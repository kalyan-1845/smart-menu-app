import React, { useState } from "react";
import axios from "axios";

// This component goes INSIDE your Super Admin Dashboard
const AddRestaurant = ({ onClose, refreshList }) => {
  const [formData, setFormData] = useState({
    username: "", // This is the Login ID
    password: "", // You set this manually
    restaurantName: "",
    email: "",    // Required by backend
    phone: "",
    address: ""
  });

  const generatePassword = () => {
    const randomPass = Math.random().toString(36).slice(-8);
    setFormData({ ...formData, password: randomPass });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ✅ This creates the REAL account
      await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/auth/register", formData);
      alert(`Success! Creds:\nUser: ${formData.username}\nPass: ${formData.password}`);
      refreshList(); // Refresh your list of restaurants
      onClose();     // Close modal
    } catch (err) {
      alert("Failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ background: '#111', padding: '30px', borderRadius: '15px', maxWidth: '500px', margin: '0 auto', border: '1px solid #333' }}>
      <h2 style={{ color: 'white', marginBottom: '20px' }}>Create New Restaurant</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <input style={s.input} placeholder="Restaurant Name" value={formData.restaurantName} onChange={e => setFormData({...formData, restaurantName: e.target.value})} required />
        <input style={s.input} placeholder="Owner Full Name" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
        <input style={s.input} placeholder="Email (Required for Login)" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <input style={{...s.input, flex: 1}} placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
          <button type="button" onClick={generatePassword} style={s.genBtn}>Generate</button>
        </div>

        <input style={s.input} placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        <input style={s.input} placeholder="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />

        <button type="submit" style={s.submitBtn}>Create Account</button>
      </form>
    </div>
  );
};

const s = {
  input: { padding: '12px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '8px' },
  genBtn: { padding: '10px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  submitBtn: { padding: '15px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }
};

export default AddRestaurant;