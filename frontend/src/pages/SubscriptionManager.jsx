import React, { useState } from "react";
import axios from "axios";
import { FaCrown, FaCalendarAlt, FaMoneyBillWave, FaHistory } from "react-icons/fa";

const SubscriptionManager = ({ restaurants, refreshData }) => {
    const API_URL = "https://smart-menu-backend-5ge7.onrender.com/api";

    // --- LOGIC: MANUALLY ACTIVATE PRO ---
    const handleActivatePro = async (restaurantId, days) => {
        const confirmPay = window.confirm(`Confirm receipt of Cash/UPI payment for ${days} days?`);
        if (!confirmPay) return;

        try {
            // Updates the status in your REAL database
            await axios.put(`${API_URL}/auth/admin/update-subscription/${restaurantId}`, {
                isPro: true,
                extendDays: days
            });
            alert("✨ PRO Status Activated! Partner notified.");
            refreshData(); // Refresh the CEO list instantly
        } catch (err) {
            alert("Error updating subscription");
        }
    };

    return (
        <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <FaCrown color="#f97316" />
                <h2 style={{ margin: 0 }}>Revenue & Subscriptions</h2>
            </div>

            <div className="sub-list">
                {restaurants.map((res) => {
                    const daysLeft = Math.ceil((new Date(res.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
                    
                    return (
                        <div key={res._id} className="sub-item">
                            <div className="res-info">
                                <strong>{res.restaurantName}</strong>
                                <p style={{ fontSize: '11px', color: res.isPro ? '#22c55e' : '#888' }}>
                                    {res.isPro ? "PREMIUM PARTNER" : `TRIAL: ${daysLeft} DAYS LEFT`}
                                </p>
                            </div>

                            <div className="sub-actions">
                                {/* Manually mark as paid */}
                                <button 
                                    onClick={() => handleActivatePro(res._id, 30)}
                                    className="action-btn-cash"
                                    title="Add 30 Days Pro"
                                >
                                    <FaMoneyBillWave /> +30 Days
                                </button>
                                <button 
                                    onClick={() => handleActivatePro(res._id, 365)}
                                    className="action-btn-year"
                                    title="Add 1 Year Pro"
                                >
                                    <FaCrown /> Yearly
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
                .sub-list { display: flex; flex-direction: column; gap: 12px; }
                .sub-item { 
                    background: #000; padding: 15px; border-radius: 16px; 
                    display: flex; justify-content: space-between; align-items: center;
                    border: 1px solid #111;
                }
                .action-btn-cash { 
                    background: #111; color: #22c55e; border: 1px solid #1a3a1a;
                    padding: 8px 12px; border-radius: 8px; font-size: 11px; font-weight: 900;
                    cursor: pointer; margin-right: 5px; display: inline-flex; align-items: center; gap: 5px;
                }
                .action-btn-year { 
                    background: rgba(249, 115, 22, 0.1); color: #f97316; border: 1px solid #3a2010;
                    padding: 8px 12px; border-radius: 8px; font-size: 11px; font-weight: 900;
                    cursor: pointer; display: inline-flex; align-items: center; gap: 5px;
                }
            `}</style>
        </div>
    );
};

export default SubscriptionManager;