import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaCheckCircle, FaTrash, FaUtensils } from "react-icons/fa";
import { toast } from "react-hot-toast";

const API_BASE = "https://smart-menu-app-production.up.railway.app/api";

const Cart = ({ cart, clearCart, removeFromCart, tableNum }) => {
    const { restaurantId } = useParams();
    const navigate = useNavigate();
    const [done, setDone] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Logic: Use prop first, then local storage
    const finalTable = tableNum || localStorage.getItem("last_table");
    const totalPrice = cart.reduce((a, b) => a + (b.price * b.quantity), 0);

    const handleOrder = async () => {
        if (isSubmitting) return;
        if (!finalTable) return toast.error("Please scan the Table QR again!");
        if (cart.length === 0) return toast.error("Cart is empty");

        setIsSubmitting(true);
        try {
            // 1. Resolve ID (The Bridge)
            const idRes = await axios.get(`${API_BASE}/auth/owner-id/${restaurantId}`);
            
            // 2. Send Order
            await axios.post(`${API_BASE}/orders`, {
                restaurantId: idRes.data.id,
                tableNum: finalTable,
                items: cart,
                totalAmount: totalPrice,
                status: "Pending" // Starts active
            });
            
            setDone(true);
            clearCart();
        } catch (e) { 
            console.error(e);
            toast.error("Failed to connect. Try again.");
            setIsSubmitting(false);
        }
    };

    if (done) return (
        <div style={{height:'100vh', background:'#020617', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'white', textAlign:'center', padding:20}}>
            <FaCheckCircle size={80} color="#22c55e" />
            <h1 style={{marginTop:20, fontSize:28}}>Order Sent!</h1>
            <p style={{color:'#94a3b8', fontSize:16, marginTop:10}}>
                Table {finalTable} • Kitchen Notified<br/>
                Sit back and relax!
            </p>
            <div style={{marginTop:40, width:'100%', maxWidth:300}}>
                <button onClick={() => navigate(-1)} style={{width:'100%', padding:15, background:'#3b82f6', color:'white', border:'none', borderRadius:12, fontWeight:'bold', fontSize:16}}>
                    ADD MORE ITEMS
                </button>
            </div>
        </div>
    );

    return (
        <div style={{minHeight:'100vh', background:'#020617', color:'white', paddingBottom:100, fontFamily:"'Plus Jakarta Sans', sans-serif"}}>
            {/* Header */}
            <div style={{display:'flex', alignItems:'center', gap:15, padding:20, background:'rgba(2,6,23,0.95)', borderBottom:'1px solid #1e293b', position:'sticky', top:0, zIndex:10}}>
                <FaArrowLeft onClick={() => navigate(-1)} size={20} style={{cursor:'pointer'}}/>
                <div>
                    <h2 style={{margin:0, fontSize:18}}>Your Cart</h2>
                    <div style={{fontSize:12, color:'#94a3b8'}}>Table {finalTable || "?"}</div>
                </div>
            </div>
            
            {/* Items */}
            <div style={{padding:20, display:'flex', flexDirection:'column', gap:15}}>
                {cart.length === 0 ? (
                    <div style={{textAlign:'center', marginTop:100, color:'#64748b'}}>
                        <FaUtensils size={40} style={{marginBottom:15, opacity:0.5}}/>
                        <h3>Hungry?</h3>
                        <p>Add some tasty food from the menu!</p>
                        <button onClick={() => navigate(-1)} style={{marginTop:20, background:'#f59e0b', color:'black', border:'none', padding:'10px 20px', borderRadius:8, fontWeight:'bold'}}>Go to Menu</button>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item._id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'#1e293b', padding:15, borderRadius:12, border:'1px solid #334155'}}>
                            <div>
                                <div style={{fontWeight:'bold', fontSize:15}}>{item.name}</div>
                                <div style={{fontSize:12, color:'#94a3b8', marginTop:4}}>x{item.quantity}</div>
                            </div>
                            <div style={{display:'flex', alignItems:'center', gap:15}}>
                                <div style={{fontWeight:'bold', color:'#f59e0b'}}>₹{item.price * item.quantity}</div>
                                <button onClick={() => removeFromCart(item._id)} style={{background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'none', width:30, height:30, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center'}}><FaTrash size={12}/></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
                <div style={{position:'fixed', bottom:0, left:0, right:0, background:'#0f172a', padding:20, borderTop:'1px solid #334155'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:15, fontSize:16}}>
                        <span style={{color:'#94a3b8'}}>Total to Pay</span>
                        <span style={{fontWeight:'bold', color:'white'}}>₹{totalPrice}</span>
                    </div>
                    <button onClick={handleOrder} disabled={isSubmitting} style={{width:'100%', padding:16, background: isSubmitting ? '#64748b' : '#f59e0b', color: isSubmitting ? 'white' : 'black', border:'none', borderRadius:12, fontWeight:'bold', fontSize:16}}>
                        {isSubmitting ? "SENDING..." : "CONFIRM ORDER"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Cart;