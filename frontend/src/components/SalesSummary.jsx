import React from "react";
import { FaChartBar, FaTrophy, FaCoins } from "react-icons/fa";

const SalesSummary = ({ restaurants }) => {
    // Logic to find top earning restaurants
    const sortedPerformers = [...restaurants]
        .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
        .slice(0, 5);

    const totalSystemRevenue = restaurants.reduce((acc, res) => acc + (res.totalRevenue || 0), 0);

    return (
        <div className="sales-performance-card">
            <div className="card-header">
                <FaChartBar color="#f97316" />
                <h2>SALES PERFORMANCE</h2>
            </div>

            {/* BAR CHART VISUAL (Mock bars for the UI) */}
            <div className="chart-container">
                {restaurants.map((res, i) => (
                    <div key={i} className="chart-bar-wrapper">
                        <div 
                            className="bar" 
                            style={{ 
                                height: `${Math.min((res.totalRevenue / 1000) * 10, 100)}px`,
                                backgroundColor: i % 2 === 0 ? '#22c55e' : '#f97316'
                            }}
                        ></div>
                        <span className="bar-label">{res.restaurantName?.substring(0, 5)}</span>
                    </div>
                ))}
            </div>

            {/* TOP PERFORMERS LIST */}
            <div className="performer-metrics">
                <div className="top-list">
                    <h4><FaTrophy color="#FFD700" /> Top Performers</h4>
                    {sortedPerformers.map((res, i) => (
                        <div key={i} className="performer-row">
                            <span>{i + 1}. {res.restaurantName}</span>
                            <strong>₹{res.totalRevenue?.toLocaleString() || 0}</strong>
                        </div>
                    ))}
                </div>

                <div className="revenue-total">
                    <p>TOTAL MONTHLY REVENUE</p>
                    <h3>₹{totalSystemRevenue.toLocaleString()}</h3>
                </div>
            </div>

            <style>{`
                .sales-performance-card { background: #0a0a0a; border: 2px solid #333; border-radius: 20px; padding: 25px; margin-top: 20px; border-left: 5px solid #f97316; }
                .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
                .chart-container { display: flex; align-items: flex-end; gap: 15px; height: 120px; border-bottom: 1px solid #222; padding-bottom: 10px; margin-bottom: 20px; overflow-x: auto; }
                .chart-bar-wrapper { display: flex; flex-direction: column; align-items: center; min-width: 40px; }
                .bar { width: 15px; border-radius: 4px 4px 0 0; transition: height 0.5s ease; }
                .bar-label { font-size: 8px; color: #666; margin-top: 5px; text-transform: uppercase; }
                .performer-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
                .performer-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; color: #aaa; }
                .revenue-total { text-align: right; display: flex; flex-direction: column; justify-content: center; }
                .revenue-total p { font-size: 10px; color: #666; font-weight: 900; margin: 0; }
                .revenue-total h3 { font-size: 24px; color: white; margin: 5px 0 0 0; }
            `}</style>
        </div>
    );
};

export default SalesSummary;