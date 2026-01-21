import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaCheckCircle, FaTrash, FaUtensils, FaReceipt } from "react-icons/fa";
import { toast } from "react-hot-toast";

// ⚠️ CHANGE TO YOUR LIVE SERVER URL
const API_BASE = "https://smart-menu-app-production.up.railway.app/api";

const Cart = ({ cart, clearCart, removeFromCart, tableNum }) => {
    const { restaurantId } = useParams();
    const navigate = useNavigate();
    const [done, setDone] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ⚡️ READ FROM SESSION STORAGE (Clears on Browser Close)
    const finalTable = tableNum || sessionStorage.getItem("last_table_scanned") || "Walk-In";

    const totalPrice = cart.reduce((a, b) => a + (b.price * b.quantity), 0);

    const handleOrder = async () => {
        if (isSubmitting) return;
        if (cart.length === 0) return toast.error("Cart is empty");

        setIsSubmitting(true);
        try {
            const idRes = await axios.get(`${API_BASE}/auth/owner-id/${restaurantId}`);
            
            await axios.post(`${API_BASE}/orders`, {
                restaurantId: idRes.data.id,
                tableNum: finalTable,
                items: cart,
                totalAmount: totalPrice,
                status: "Pending"
            });
            
            setDone(true);
            clearCart();
        } catch (e) { 
            console.error(e);
            toast.error("Network Error. Try again.");
            setIsSubmitting(false);
        }
    };

    if (done) return (
        <div style={{height:'100vh', background:'#020617', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'white', textAlign:'center', padding:20, fontFamily:"'Plus Jakarta Sans', sans-serif"}}>
            <div style={{width:100, height:100, background:'rgba(34, 197, 94, 0.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:25, border:'1px solid rgba(34, 197, 94, 0.3)'}}>
                <FaCheckCircle size={50} color="#22c55e" />
            </div>
            <h1 style={{margin:0, fontSize:32, fontWeight:'800', letterSpacing:'-1px'}}>Order Sent!</h1>
            <p style={{color:'#94a3b8', fontSize:16, marginTop:15, lineHeight:'1.5'}}>
                <span style={{color:'#3b82f6', fontWeight:'bold', background:'rgba(59, 130, 246, 0.1)', padding:'4px 12px', borderRadius:20}}>Table {finalTable}</span>
                <br/><br/>
                Your order has been sent to the kitchen.<br/>Sit back and relax!
            </p>
            <div style={{marginTop:50, width:'100%', maxWidth:300}}>
                <button onClick={() => navigate(-1)} style={{width:'100%', padding:18, background:'#3b82f6', color:'white', border:'none', borderRadius:16, fontWeight:'bold', fontSize:16, cursor:'pointer', boxShadow:'0 10px 30px rgba(59, 130, 246, 0.4)'}}>
                    PLACE NEW ORDER
                </button>
            </div>
        </div>
    );

    return (
        <div style={{minHeight:'100vh', background:'#020617', color:'white', paddingBottom:140, fontFamily:"'Plus Jakarta Sans', sans-serif"}}>
            
            {/* Header */}
            <div style={{display:'flex', alignItems:'center', gap:15, padding:'20px', background:'rgba(2,6,23,0.9)', borderBottom:'1px solid rgba(59, 130, 246, 0.2)', position:'sticky', top:0, zIndex:10, backdropFilter:'blur(10px)'}}>
                <div onClick={() => navigate(-1)} style={{padding:10, background:'rgba(255,255,255,0.05)', borderRadius:12, cursor:'pointer'}}>
                    <FaArrowLeft size={16} color="white"/>
                </div>
                <div style={{flex:1}}>
                    <h2 style={{margin:0, fontSize:18, fontWeight:'700'}}>Your Cart</h2>
                    <div style={{fontSize:12, color:'#94a3b8'}}>
                        {finalTable === "Walk-In" ? "Counter Order" : `Ordering for Table ${finalTable}`}
                    </div>
                </div>
            </div>
            
            {/* Items List */}
            <div style={{padding:20, display:'flex', flexDirection:'column', gap:15}}>
                {cart.length === 0 ? (
                    <div style={{textAlign:'center', marginTop:80, color:'#64748b'}}>
                        <div style={{width:80, height:80, background:'rgba(255,255,255,0.03)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px'}}>
                            <FaUtensils size={30} style={{opacity:0.5}}/>
                        </div>
                        <h3 style={{color:'#e2e8f0', margin:0}}>Cart is empty</h3>
                        <p style={{fontSize:14, marginTop:8}}>Add some delicious items to get started.</p>
                        <button onClick={() => navigate(-1)} style={{marginTop:25, background:'#3b82f6', color:'white', border:'none', padding:'14px 30px', borderRadius:12, fontWeight:'bold', cursor:'pointer'}}>Browse Menu</button>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item._id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(30, 41, 59, 0.4)', padding:'18px', borderRadius:18, border:'1px solid rgba(255,255,255,0.05)'}}>
                            <div style={{flex:1, paddingRight:10}}>
                                {/* ⚡️ BIGGER FONT HERE (19px Bold) */}
                                <div style={{fontWeight:'800', fontSize:'19px', color:'white', marginBottom:6, lineHeight:'1.3'}}>
                                    {item.name}
                                </div>
                                <div style={{fontSize:14, color:'#94a3b8', fontWeight:500}}>
                                    ₹{item.price} × {item.quantity}
                                </div>
                            </div>
                            
                            <div style={{display:'flex', alignItems:'center', gap:15}}>
                                <div style={{fontWeight:'900', color:'#3b82f6', fontSize:18}}>
                                    ₹{item.price * item.quantity}
                                </div>
                                <button onClick={() => removeFromCart(item._id)} style={{background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'none', width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
                                    <FaTrash size={16}/>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Checkout Footer */}
            {cart.length > 0 && (
                <div style={{position:'fixed', bottom:0, left:0, right:0, background:'#020617', padding:'20px 25px 30px', borderTop:'1px solid rgba(59, 130, 246, 0.2)', zIndex:100}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:20, alignItems:'flex-end'}}>
                        <span style={{color:'#94a3b8', fontSize:14}}>Total to Pay</span>
                        <span style={{fontWeight:'900', color:'white', fontSize:26}}>₹{totalPrice}</span>
                    </div>
                    <button onClick={handleOrder} disabled={isSubmitting} style={{
                        width:'100%', 
                        padding:18, 
                        background: isSubmitting ? '#475569' : '#3b82f6', 
                        color: 'white', 
                        border:'none', 
                        borderRadius:18, 
                        fontWeight:'800', 
                        fontSize:16, 
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
                        boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)'
                    }}>
                        {isSubmitting ? "SENDING ORDER..." : <><FaReceipt /> CONFIRM ORDER</>}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Cart;