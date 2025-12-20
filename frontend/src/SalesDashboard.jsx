import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SalesDashboard = () => {
    const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, avgValue: 0 });
    const [chartData, setChartData] = useState([]);
    const [recentSales, setRecentSales] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("ownerToken");
    const ownerId = localStorage.getItem("ownerId");

    useEffect(() => {
        const fetchSalesData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                
                // Fetch orders for this restaurant
                const res = await axios.get(`http://mongodb+srv://prsnlkalyan_db_user:vasudev1972@cluster0.phbbtix.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/api/orders?restaurantId=${ownerId}`, config);
                
                // 📊 LOGIC: Filter only successful/delivered orders for sales
                const successfulOrders = res.data.filter(o => o.status === "SERVED" || o.status === "Ready");

                // Calculate Totals
                const totalRevenue = successfulOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);
                const totalOrders = successfulOrders.length;
                const avgValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;

                setStats({ totalRevenue, totalOrders, avgValue });
                setRecentSales(successfulOrders.slice(0, 5)); // Get last 5 sales

                // Format data for the Chart (Grouping by date)
                const chartMap = {};
                successfulOrders.forEach(order => {
                    const date = new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
                    chartMap[date] = (chartMap[date] || 0) + order.totalAmount;
                });

                const formattedChartData = Object.keys(chartMap).map(key => ({
                    name: key,
                    amount: chartMap[key]
                }));

                setChartData(formattedChartData);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching sales:", err);
                setLoading(false);
            }
        };

        fetchSalesData();
    }, [ownerId, token]);

    if (loading) return <div className="min-h-screen bg-[#05080F] text-white flex items-center justify-center">Analyzing Data...</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#05080F', color: 'white', padding: '30px', fontFamily: 'sans-serif' }}>
            
            {/* 1. HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>SALES <span style={{ color: '#f97316' }}>INSIGHTS</span></h1>
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>Overview of your restaurant's performance</p>
                </div>
                <Link to="/chef">
                    <button style={{ background: '#111827', color: 'white', border: '1px solid #1f2937', padding: '12px 24px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Back to Kitchen
                    </button>
                </Link>
            </header>

            {/* 2. STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div style={{ background: '#111827', padding: '25px', borderRadius: '24px', border: '1px solid #1f2937' }}>
                    <p style={{ color: '#6b7280', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Revenue</p>
                    <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#22c55e', margin: '10px 0' }}>₹{stats.totalRevenue}</h2>
                    <span style={{ color: '#4b5563', fontSize: '12px' }}>Net earnings from completed orders</span>
                </div>
                <div style={{ background: '#111827', padding: '25px', borderRadius: '24px', border: '1px solid #1f2937' }}>
                    <p style={{ color: '#6b7280', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Orders</p>
                    <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#f97316', margin: '10px 0' }}>{stats.totalOrders}</h2>
                    <span style={{ color: '#4b5563', fontSize: '12px' }}>Customers served this period</span>
                </div>
                <div style={{ background: '#111827', padding: '25px', borderRadius: '24px', border: '1px solid #1f2937' }}>
                    <p style={{ color: '#6b7280', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Avg. Order Value</p>
                    <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#3b82f6', margin: '10px 0' }}>₹{stats.avgValue}</h2>
                    <span style={{ color: '#4b5563', fontSize: '12px' }}>Average spend per table</span>
                </div>
            </div>

            {/* 3. CHART & RECENT SALES SECTION */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                
                {/* Visual Sales Chart */}
                <div style={{ background: '#111827', padding: '30px', borderRadius: '32px', border: '1px solid #1f2937' }}>
                    <h3 style={{ marginBottom: '30px', fontSize: '20px', fontWeight: '800' }}>Weekly Revenue Trend</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ background: '#05080F', border: '1px solid #1f2937', borderRadius: '12px' }}
                                    cursor={{fill: 'transparent'}}
                                />
                                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#f97316' : '#fb923c'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Transaction Table */}
                <div style={{ background: '#111827', padding: '30px', borderRadius: '32px', border: '1px solid #1f2937' }}>
                    <h3 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '800' }}>Recent Sales</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {recentSales.length === 0 ? (
                            <p style={{ color: '#4b5563', textAlign: 'center' }}>No sales records yet.</p>
                        ) : (
                            recentSales.map((sale) => (
                                <div key={sale._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid #1f2937' }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>{sale.customerName}</p>
                                        <p style={{ margin: 0, color: '#6b7280', fontSize: '11px' }}>Table {sale.tableNumber}</p>
                                    </div>
                                    <span style={{ fontWeight: '900', color: '#22c55e' }}>+₹{sale.totalAmount}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SalesDashboard;