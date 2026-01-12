import React from "react";
import { FaChartBar, FaTrophy, FaCoins, FaArrowUp } from "react-icons/fa";

const RevenueStats = ({ restaurants = [] }) => {
    
    // 1. Sort by Revenue (High to Low)
    const sortedPerformers = [...restaurants]
        .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
        .slice(0, 5);

    // 2. Calculate Total System Revenue
    const totalSystemRevenue = restaurants.reduce((acc, res) => acc + (res.totalRevenue || 0), 0);

    // 3. Find Max Revenue for dynamic bar height scaling
    const maxRevenue = Math.max(...restaurants.map(r => r.totalRevenue || 0), 1); // Avoid div by 0

    return (
        <div className="stats-card">
            <div className="card-header">
                <div className="icon-box">
                    <FaChartBar />
                </div>
                <div>
                    <h2>PERFORMANCE METRICS</h2>
                    <p className="sub-text">Top earning locations this month</p>
                </div>
            </div>

            {/* 📊 DYNAMIC BAR CHART */}
            <div className="chart-area">
                {sortedPerformers.map((res, i) => {
                    // Calculate height percentage relative to the top performer
                    const heightPct = ((res.totalRevenue || 0) / maxRevenue) * 100;
                    
                    return (
                        <div key={i} className="bar-group">
                            <div className="bar-wrapper">
                                <div 
                                    className="bar" 
                                    style={{ 
                                        height: `${Math.max(heightPct, 5)}%`, // Min 5% height
                                        animationDelay: `${i * 0.1}s` 
                                    }}
                                >
                                    <div className="tooltip">₹{res.totalRevenue?.toLocaleString()}</div>
                                </div>
                            </div>
                            <span className="bar-label">{res.restaurantName?.substring(0, 6)}..</span>
                        </div>
                    );
                })}
                {sortedPerformers.length === 0 && <p className="no-data">No data available</p>}
            </div>

            {/* 🏆 LEADERBOARD LIST */}
            <div className="metrics-grid">
                <div className="list-section">
                    <h4><FaTrophy color="#fbbf24" /> LEADERBOARD</h4>
                    <div className="list-scroll">
                        {sortedPerformers.map((res, i) => (
                            <div key={i} className="list-row">
                                <span className="rank">#{i + 1}</span>
                                <span className="name">{res.restaurantName}</span>
                                <span className="amount">₹{res.totalRevenue?.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 💰 TOTAL CARD */}
                <div className="total-section">
                    <div className="total-icon"><FaCoins /></div>
                    <p>SYSTEM REVENUE</p>
                    <h3>₹{totalSystemRevenue.toLocaleString()}</h3>
                    <div className="trend-badge">
                        <FaArrowUp /> +12% vs last week
                    </div>
                </div>
            </div>

            <style>{`
                .stats-card {
                    background: rgba(30, 41, 59, 0.6);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 24px;
                    padding: 25px;
                    color: white;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }

                .card-header { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; }
                .icon-box { 
                    width: 45px; height: 45px; 
                    background: linear-gradient(135deg, #3b82f6, #2563eb); 
                    border-radius: 12px; display: flex; align-items: center; justifyContent: center; 
                    font-size: 20px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
                }
                .card-header h2 { margin: 0; font-size: 16px; font-weight: 800; letter-spacing: 0.5px; }
                .sub-text { margin: 0; font-size: 12px; color: #94a3b8; }

                /* CHART */
                .chart-area {
                    display: flex; align-items: flex-end; justify-content: space-around;
                    height: 160px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);
                    margin-bottom: 25px;
                }
                .bar-group { display: flex; flex-direction: column; align-items: center; width: 100%; }
                .bar-wrapper { height: 120px; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
                .bar {
                    width: 30%;
                    background: linear-gradient(to top, #3b82f6, #60a5fa);
                    border-radius: 8px 8px 0 0;
                    position: relative;
                    animation: growUp 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                    transform-origin: bottom;
                    transform: scaleY(0);
                    cursor: pointer;
                }
                .bar:hover { background: #60a5fa; box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); }
                
                /* Tooltip on Hover */
                .tooltip {
                    position: absolute; top: -30px; left: 50%; transform: translateX(-50%);
                    background: #0f172a; padding: 4px 8px; border-radius: 6px;
                    font-size: 10px; font-weight: bold; white-space: nowrap;
                    opacity: 0; transition: 0.2s; border: 1px solid #334155;
                    pointer-events: none;
                }
                .bar:hover .tooltip { opacity: 1; top: -35px; }

                .bar-label { font-size: 10px; color: #94a3b8; margin-top: 10px; font-weight: 600; text-transform: uppercase; }

                /* METRICS GRID */
                .metrics-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }
                
                .list-section h4 { margin: 0 0 15px 0; font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 8px; }
                .list-scroll { max-height: 150px; overflow-y: auto; padding-right: 5px; }
                .list-row { 
                    display: flex; justify-content: space-between; align-items: center; 
                    padding: 10px; border-radius: 10px; background: rgba(255,255,255,0.03); 
                    margin-bottom: 8px; font-size: 13px; 
                }
                .rank { color: #64748b; font-weight: 700; width: 30px; }
                .name { flex: 1; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .amount { color: #34d399; font-weight: 700; }

                /* TOTAL CARD */
                .total-section {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    border-radius: 20px; padding: 20px; text-align: center;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    border: 1px solid #334155;
                }
                .total-icon { 
                    font-size: 24px; color: #fbbf24; margin-bottom: 10px; 
                    background: rgba(251, 191, 36, 0.1); width: 50px; height: 50px; 
                    display: flex; align-items: center; justify-content: center; border-radius: 50%;
                }
                .total-section p { margin: 0; font-size: 10px; color: #94a3b8; letter-spacing: 1px; font-weight: 700; }
                .total-section h3 { margin: 5px 0 10px 0; font-size: 22px; color: white; font-weight: 800; }
                .trend-badge { 
                    background: rgba(16, 185, 129, 0.15); color: #34d399; 
                    padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 700;
                    display: flex; align-items: center; gap: 5px;
                }

                .no-data { text-align: center; width: 100%; color: #64748b; font-size: 12px; margin-top: 50px; }

                @keyframes growUp { to { transform: scaleY(1); } }
                
                @media (max-width: 768px) {
                    .metrics-grid { grid-template-columns: 1fr; }
                }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
            `}</style>
        </div>
    );
};

export default RevenueStats;