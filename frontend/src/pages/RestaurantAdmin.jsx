import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import jsPDF from 'jspdf';
import { FaFire, FaUtensils, FaQrcode, FaPrint, FaCheck } from "react-icons/fa";
import { toast } from "react-hot-toast";

const RestaurantAdmin = () => {
    const { id } = useParams();
    const API_BASE = "https://smart-menu-app-production.up.railway.app/api";
    
    const [orders, setOrders] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [auth, setAuth] = useState(false);
    const [pwd, setPwd] = useState("");
    const [tab, setTab] = useState("tables"); // tables, menu, qr

    // 1. Polling for Live Orders
    useEffect(() => {
        if (!auth) return;
        const fetchOrders = async () => {
            const rid = localStorage.getItem("oid");
            if (!rid) return;
            const res = await axios.get(`${API_BASE}/orders/inbox?restaurantId=${rid}`);
            setOrders(res.data);
        };
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, [auth]);

    // 2. MERGE ORDERS BY TABLE (The Core Logic)
    const tableData = useMemo(() => {
        const tables = {};
        // Initialize 15 tables
        for(let i=1; i<=15; i++) tables[i] = { num: i, total: 0, items: [], status: 'Free' };
        
        orders.forEach(order => {
            const t = tables[order.tableNum];
            if (t) {
                t.status = 'Occupied';
                t.total += order.totalAmount;
                // Merge items for the "Bill", but keep order batches for "KOT"
                t.orders = t.orders || [];
                t.orders.push(order); 
            }
        });
        return tables;
    }, [orders]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_BASE}/auth/login`, { username: id, password: pwd });
            localStorage.setItem("oid", res.data._id);
            setAuth(true);
        } catch (e) { toast.error("Invalid"); }
    };

    // 🖨️ BUTTON 1: PRINT KOT (Kitchen)
    const printKOT = (order) => {
        const w = window.open('', '', 'width=300,height=600');
        w.document.write(`<html><body style="font-family:monospace"><h3>KOT - T${order.tableNum}</h3><hr/>${order.items.map(i=>`<div>${i.name} x${i.quantity}</div>`).join('')}</body></html>`);
        w.print(); w.close();
    };

    // 🖨️ BUTTON 2: PRINT BILL (Customer)
    const printBill = (table) => {
        // Merge all items from all orders
        const allItems = [];
        table.orders.forEach(o => allItems.push(...o.items));
        
        const w = window.open('', '', 'width=300,height=600');
        w.document.write(`<html><body style="font-family:monospace"><h3 style="text-align:center">${id.toUpperCase()}</h3><div style="text-align:center">Table ${table.num}</div><hr/>${allItems.map(i=>`<div style="display:flex;justify-content:space-between"><span>${i.name} x${i.quantity}</span><span>${i.price*i.quantity}</span></div>`).join('')}<hr/><h3>Total: ${table.total}</h3></body></html>`);
        w.print(); w.close();
    };

    // ✅ COMPLETE TABLE
    const clearTable = async (tableNum) => {
        if(!window.confirm("Clear Table?")) return;
        await axios.put(`${API_BASE}/orders/complete-table`, {
            restaurantId: localStorage.getItem("oid"),
            tableNum: tableNum.toString()
        });
        toast.success("Table Cleared");
        // Optimistic update
        setOrders(orders.filter(o => o.tableNum !== tableNum.toString()));
        setSelectedTable(null);
    };

    if (!auth) return (
        <div style={{height:'100vh', background:'#020617', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:10}}>
                <input style={{padding:10}} placeholder="Password" type="password" value={pwd} onChange={e=>setPwd(e.target.value)}/>
                <button style={{padding:10, background:'#3b82f6', color:'white', border:'none'}}>LOGIN</button>
            </form>
        </div>
    );

    return (
        <div style={{minHeight:'100vh', background:'#020617', color:'white', padding:20}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
                <h2>{id} Admin</h2>
                <div style={{display:'flex', gap:10}}>
                    <button onClick={()=>setTab('tables')} style={{padding:10, background: tab==='tables'?'#3b82f6':'#1e293b', border:'none', color:'white'}}>TABLES</button>
                    <button onClick={()=>setTab('qr')} style={{padding:10, background: tab==='qr'?'#3b82f6':'#1e293b', border:'none', color:'white'}}>QR</button>
                </div>
            </div>

            {/* TABLE GRID */}
            {tab === 'tables' && (
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:15}}>
                    {Object.values(tableData).map(t => (
                        <div key={t.num} onClick={() => t.total > 0 && setSelectedTable(t)}
                             style={{
                                 aspectRatio:'1', background: t.total > 0 ? '#1e3a8a' : '#064e3b', 
                                 display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                                 borderRadius:10, border: t.total > 0 ? '2px solid #3b82f6' : '1px solid #059669'
                             }}>
                            <div style={{fontSize:24, fontWeight:'bold'}}>{t.num}</div>
                            <div>₹{t.total}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* QR GENERATOR */}
            {tab === 'qr' && (
                <div style={{textAlign:'center', marginTop:50}}>
                    <button onClick={() => {
                        const doc = new jsPDF();
                        let y = 10;
                        for(let i=1; i<=15; i++) {
                            const url = `https://kovixa.com/menu/${id}?table=${i}`;
                            const api = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
                            doc.text(`Table ${i}`, 10, y);
                            doc.addImage(api, 'PNG', 10, y+5, 30, 30);
                            y += 40;
                            if(y > 250) { doc.addPage(); y=10; }
                        }
                        doc.save('tables.pdf');
                    }} style={{padding:20, background:'#f59e0b', border:'none', fontWeight:'bold'}}>DOWNLOAD 15 QRs</button>
                </div>
            )}

            {/* MODAL (The Heart of the System) */}
            {selectedTable && (
                <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <div style={{background:'#1e293b', padding:20, borderRadius:15, width:'90%', maxWidth:400, maxHeight:'80vh', overflowY:'auto'}}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
                            <h3>Table {selectedTable.num}</h3>
                            <button onClick={()=>setSelectedTable(null)} style={{background:'none', border:'none', color:'white'}}>X</button>
                        </div>

                        {/* LIST OF ORDER BATCHES */}
                        {selectedTable.orders?.map(order => (
                            <div key={order._id} style={{background:'#0f172a', padding:10, marginBottom:10, borderRadius:8}}>
                                <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:'#94a3b8'}}>
                                    <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                                    {/* BUTTON 1: PRINT KOT */}
                                    <button onClick={()=>printKOT(order)} style={{background:'#3b82f6', border:'none', color:'white', padding:'2px 8px', borderRadius:4, fontSize:10}}>PRINT KOT</button>
                                </div>
                                {order.items.map(i => (
                                    <div key={i._id} style={{display:'flex', justifyContent:'space-between', marginTop:5}}>
                                        <span>{i.name} x{i.quantity}</span>
                                    </div>
                                ))}
                            </div>
                        ))}

                        <hr style={{borderColor:'#334155', margin:'20px 0'}}/>
                        
                        <div style={{display:'flex', justifyContent:'space-between', fontSize:18, fontWeight:'bold', marginBottom:20}}>
                            <span>Total Bill</span>
                            <span>₹{selectedTable.total}</span>
                        </div>

                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                            {/* BUTTON 2: PRINT BILL */}
                            <button onClick={()=>printBill(selectedTable)} style={{padding:15, background:'#f59e0b', border:'none', borderRadius:8, fontWeight:'bold'}}>PRINT BILL</button>
                            {/* CLEAR TABLE */}
                            <button onClick={()=>clearTable(selectedTable.num)} style={{padding:15, background:'#22c55e', border:'none', borderRadius:8, fontWeight:'bold'}}>CLEAR TABLE</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestaurantAdmin;