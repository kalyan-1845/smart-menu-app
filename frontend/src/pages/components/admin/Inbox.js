import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FaInbox, FaDownload } from "react-icons/fa";

const Inbox = ({ restaurantId, restaurantName }) => {
  const [orders, setOrders] = useState([]);
  const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";

  // 1. Fetch only orders where isDownloaded is false
  const fetchInbox = async () => {
    if (!restaurantId) return;
    try {
      const res = await axios.get(`${API_BASE}/orders/inbox/${restaurantId}`);
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching inbox:", err);
    }
  };

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [restaurantId]);

  // 2. Generate PDF and Clear Database
  const handleDownloadAndClear = async () => {
    if (orders.length === 0) {
      alert("No new orders to download!");
      return;
    }

    const doc = new jsPDF();

    // PDF Header
    doc.setFontSize(18);
    doc.text(`${restaurantName || "Restaurant"} - Order Receipts`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Batch Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 30);
    doc.text(`Total Customers in Batch: ${orders.length}`, 14, 36);

    // Prepare Table Data
    const tableRows = orders.map((order, index) => [
      index + 1,
      order.tableNum, // Matches your schema
      order.items.map(item => `${item.name} x${item.quantity}`).join(', '),
      `Rs. ${order.totalAmount}`, // Matches your schema
      new Date(order.createdAt).toLocaleTimeString()
    ]);

    // Generate Table
    doc.autoTable({
      head: [['#', 'Table', 'Items Ordered', 'Total', 'Time']],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [255, 153, 51] }, // Match your orange theme
    });

    // Save PDF
    doc.save(`${restaurantName}_Receipts_${Date.now()}.pdf`);

    // 3. Clear from Database (Mark as downloaded)
    try {
      await axios.put(`${API_BASE}/orders/clear-inbox/${restaurantId}`);
      alert("✅ PDF Downloaded. Inbox has been cleared!");
      setOrders([]); // UI clears immediately
    } catch (err) {
      console.error("Clear error:", err);
      alert("PDF saved, but database could not be cleared.");
    }
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>
          <FaInbox color="#FF9933" style={{ marginRight: '10px' }} /> 
          Pending Receipts ({orders.length})
        </h2>
        <button
          onClick={handleDownloadAndClear}
          className="btn-glass"
          style={{ background: '#FF9933', color: 'black', border: 'none', fontWeight: 'bold' }}
        >
          <FaDownload /> Download & Clear
        </button>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
          <p>No pending orders to download.</p>
        </div>
      ) : (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {orders.map((order) => (
            <div key={order._id} style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '15px', 
              borderRadius: '12px', 
              marginBottom: '10px',
              borderLeft: '4px solid #FF9933' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 900 }}>TABLE {order.tableNum}</span>
                <span style={{ fontSize: '12px', color: '#888' }}>{new Date(order.createdAt).toLocaleTimeString()}</span>
              </div>
              <p style={{ fontSize: '13px', margin: '5px 0' }}>
                {order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
              </p>
              <p style={{ fontWeight: 900, margin: 0 }}>Total: Rs. {order.totalAmount}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inbox;