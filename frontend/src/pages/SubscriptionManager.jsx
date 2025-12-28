import React, { useState, useMemo } from "react";
import axios from "axios";
import { FaCrown, FaMoneyBillWave, FaFilter, FaExclamationTriangle, FaCheckCircle, FaSearch } from "react-icons/fa";

const SubscriptionManager = ({ restaurants, refreshData }) => {
    const API_URL = "https://smart-menu-backend-5ge7.onrender.com/api";
    const [filter, setFilter] = useState("ALL"); // ALL, PRO, TRIAL, EXPIRING
    const [search, setSearch] = useState("");

    // --- 1. SMART FILTERING & SORTING (The "Shortcut" Logic) ---
    const processedList = useMemo(() => {
        let data = [...restaurants];

        // Search Filter
        if (search) {
            data = data.filter(r => r.restaurantName.toLowerCase().includes(search.toLowerCase()));
        }

        // Category Filter
        if (filter === "PRO") data = data.filter(r => r.isPro);
        if (filter === "TRIAL") data = data.filter(r => !r.isPro);
        if (filter === "EXPIRING") {
            data = data.filter(r => {
                const days = Math.ceil((new Date(r.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
                return days <= 5 && days >= 0; // Expiring in 5 days or less
            });
        }

        // Sort: Expiring & Trial accounts first (Money opportunities)
        return data.sort((a, b) => new Date(a.trialEndsAt) - new Date(b.trialEndsAt));
    }, [restaurants, filter, search]);

    // Calculate "Potential" Monthly Revenue (Assuming ₹999/mo for Pros)
    const activeRevenue = restaurants.filter(r => r.isPro).length * 999;

    // --- 2. ACTIVATION LOGIC ---
    const handleActivatePro = async (restaurantId, days, name) => {
        const confirmPay = window.confirm(`💰 Confirm payment for ${name}?\n\nExtend: ${days} Days\n\nThis will activate PRO features instantly.`);
        if (!confirmPay) return;

        try {
            await axios.put(`${API_URL}/auth/admin/update-subscription/${restaurantId}`, {
                isPro: true,
                extendDays: days
            });
            alert(`✅ Success! ${name} is now active for ${days} days.`);
            refreshData(); 
        } catch (err) {
            alert("❌ Update Failed. Check network.");
        }
    };

    return (
        <div className="glass-panel">
            {/* HEADER & STATS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{background: 'rgba(249, 115, 22, 0.2)', padding:'10px', borderRadius:'12px'}}>
                        <FaCrown color="#f97316" size={20} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '18px' }}>Subscriptions</h2>
                        <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Est. Monthly Rev: <span style={{color:'#22c55e', fontWeight:'bold'}}>₹{activeRevenue.toLocaleString()}</span></p>
                    </div>
                </div>
                
                {/* SEARCH BAR */}
                <div style={{position:'relative'}}>
                    <FaSearch style={{position:'absolute', left:'12px', top:'12px', color:'#555'}} />
                    <input 
                        placeholder="Search Client..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{background:'#000', border:'1px solid #333', padding:'10px 10px 10px 35px', borderRadius:'10px', color:'white', outline:'none', fontSize:'13px'}}
                    />
                </div>
            </div>

            {/* QUICK FILTERS */}
            <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                {['ALL', 'PRO', 'TRIAL', 'EXPIRING'].map(f => (
                    <button 
                        key={f} 
                        onClick={() => setFilter(f)}
                        style={{
                            padding: '8px 16px', 
                            borderRadius: '8px', 
                            border: filter === f ? '1px solid #f97316' : '1px solid #333',
                            background: filter === f ? 'rgba(249, 115, 22, 0.1)' : '#000',
                            color: filter === f ? '#f97316' : '#888',
                            fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
                        }}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* LIST */}
            <div className="sub-list">
                {processedList.length === 0 ? (
                    <div style={{textAlign:'center', padding:'20px', color:'#444', fontSize:'13px'}}>No clients found.</div>
                ) : (
                    processedList.map((res) => {
                        const daysLeft = Math.ceil((new Date(res.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
                        const isExpired = daysLeft < 0;
                        const isUrgent = daysLeft <= 5 && !res.isPro;

                        return (
                            <div key={res._id} className="sub-item" style={{borderLeft: isUrgent ? '3px solid #ef4444' : (res.isPro ? '3px solid #22c55e' : '3px solid #333')}}>
                                <div className="res-info">
                                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                        <strong style={{fontSize:'14px'}}>{res.restaurantName}</strong>
                                        {res.isPro ? <FaCheckCircle color="#22c55e" size={12}/> : <span style={{fontSize:'9px', background:'#222', padding:'2px 6px', borderRadius:'4px', color:'#888'}}>TRIAL</span>}
                                    </div>
                                    <div style={{ fontSize: '11px', color: isExpired ? '#ef4444' : (isUrgent ? '#f97316' : '#888'), display:'flex', alignItems:'center', gap:'6px', marginTop:'4px' }}>
                                        {isUrgent && <FaExclamationTriangle />}
                                        {isExpired ? `EXPIRED ${Math.abs(daysLeft)} DAYS AGO` : `${daysLeft} Days Remaining`}
                                    </div>
                                </div>

                                <div className="sub-actions">
                                    <button 
                                        onClick={() => handleActivatePro(res._id, 30, res.restaurantName)}
                                        className="action-btn-cash"
                                        title="Recieved Cash/UPI for 1 Month"
                                    >
                                        <FaMoneyBillWave /> 1 Mo
                                    </button>
                                    <button 
                                        onClick={() => handleActivatePro(res._id, 365, res.restaurantName)}
                                        className="action-btn-year"
                                        title="Recieved Cash/UPI for 1 Year"
                                    >
                                        <FaCrown /> 1 Yr
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <style>{`
                .glass-panel { background: #0a0a0a; border: 1px solid #1a1a1a; padding: 25px; border-radius: 24px; color: white; }
                .sub-list { display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; }
                .sub-item { 
                    background: #050505; padding: 12px 15px; border-radius: 12px; 
                    display: flex; justify-content: space-between; align-items: center;
                    border: 1px solid #222; transition: all 0.2s;
                }
                .sub-item:hover { border-color: #333; background: #080808; }
                .action-btn-cash { 
                    background: #1a1a1a; color: #22c55e; border: 1px solid #22c55e44;
                    padding: 8px 12px; border-radius: 8px; font-size: 11px; font-weight: 900;
                    cursor: pointer; margin-right: 8px; display: inline-flex; align-items: center; gap: 5px;
                }
                .action-btn-cash:hover { background: #22c55e; color: black; }
                .action-btn-year { 
                    background: #1a1a1a; color: #f97316; border: 1px solid #f9731644;
                    padding: 8px 12px; border-radius: 8px; font-size: 11px; font-weight: 900;
                    cursor: pointer; display: inline-flex; align-items: center; gap: 5px;
                }
                .action-btn-year:hover { background: #f97316; color: black; }
            `}</style>
        </div>
    );
};

export default SubscriptionManager;