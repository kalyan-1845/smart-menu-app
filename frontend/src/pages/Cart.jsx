import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaTrash, FaLongArrowAltLeft, FaUtensils, FaCheckCircle } from "react-icons/fa";

const getApiBase = () => {
    const host = window.location.hostname;
    if (host === "localhost" || host.startsWith("192.168") || host.startsWith("10.") || host === "127.0.0.1") {
        return `http://${window.location.hostname}:5000/api`;
    }
    return "https://smart-menu-backend-5ge7.onrender.com/api";
};

const Cart = ({ cart, removeFromCart, clearCart, updateQuantity, restaurantId, tableNum, setTableNum }) => {
  const navigate = useNavigate();
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [notes, setNotes] = useState("");

  // ✅ Force Numbers for calculation
  const total = cart.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0);
  const API_BASE = getApiBase(); 

  const handleBackToMenu = () => {
      const activeId = restaurantId || localStorage.getItem("activeResId");
      if (activeId) navigate(`/menu/${activeId}`); 
      else navigate(-1); 
  };

  const handlePlaceOrder = async (payMethod) => {
    if (cart.length === 0) return;
    
    const finalResId = restaurantId || localStorage.getItem("activeResId");
    if (!finalResId) {
        alert("System Error: Restaurant ID not found.");
        return;
    }

    setLoading(true);

    // ✅ Clean Payload
    const orderData = {
      restaurantId: finalResId, 
      tableNumber: tableNum || "Takeaway",
      items: cart.map(i => ({
        name: i.name,
        quantity: Number(i.quantity),
        price: Number(i.price),
        id: i._id,
        image: i.image || ""
      })),
      totalAmount: Number(total), // Force Number
      customerName: guestName || "Guest",
      note: notes,
      paymentMethod: payMethod
    };

    console.log("🚀 Payload Leaving Cart:", orderData);

    try {
      const res = await axios.post(`${API_BASE}/orders`, orderData);
      
      setIsOrderPlaced(true);
      clearCart();
      
      // Handle response structure variations
      const orderId = res.data.order ? res.data.order._id : res.data._id;
      
      setTimeout(() => {
          navigate(`/track/${orderId}`);
      }, 1500); 
      
    } catch (error) {
      console.error("Order Error:", error);
      alert("Order Failed. Check console for details.");
      setLoading(false);
    }
  };

  if (isOrderPlaced) {
    return (
      <div style={{...styles.container, justifyContent:'center', alignItems:'center'}}>
        <FaCheckCircle size={80} color="#22c55e" />
        <h1 style={{marginTop:'20px'}}>Order Sent!</h1>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <h2>Your Bag is Empty</h2>
        <button onClick={handleBackToMenu} style={styles.backBtn}>
           <FaLongArrowAltLeft /> Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
         <button onClick={handleBackToMenu} style={styles.iconBtn}><FaLongArrowAltLeft /></button>
         <h2 style={{margin:0, fontSize:'18px'}}>Your Bag</h2>
         <div style={{width:'30px'}}></div>
      </div>

      <div style={styles.scrollArea}>
        <div style={styles.infoCard}>
            <label style={{fontSize:'10px', color:'#888', fontWeight:'bold'}}>DELIVER TO</label>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'5px'}}>
                <span style={{fontSize:'16px', fontWeight:'bold', color:'#f97316'}}>
                    {tableNum ? `Table ${tableNum}` : "Takeaway"}
                </span>
                <button onClick={() => {
                    const t = prompt("Enter Table Number:");
                    if(t) { setTableNum(t); localStorage.setItem("activeTable", t); }
                }} style={{background:'none', border:'none', color:'#666', fontSize:'12px', cursor:'pointer'}}>CHANGE</button>
            </div>
            <div style={{marginTop:'15px'}}>
                 <label style={{fontSize:'10px', color:'#888', fontWeight:'bold'}}>GUEST NAME</label>
                 <input placeholder="Enter your name" value={guestName} onChange={e => setGuestName(e.target.value)} style={styles.input}/>
            </div>
        </div>

        <div style={{marginTop:'20px'}}>
            {cart.map(item => (
                <div key={item._id} style={styles.itemRow}>
                    <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                        <div style={styles.imgBox}>
                            {item.image ? <img src={item.image} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <FaUtensils color="#555"/>}
                        </div>
                        <div>
                            <p style={{margin:0, fontWeight:'bold', fontSize:'14px'}}>{item.name}</p>
                            <p style={{margin:0, fontSize:'12px', color:'#888'}}>₹{item.price} × {item.quantity}</p>
                        </div>
                    </div>
                    <div style={styles.qtyWrapper}>
                        <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={styles.qtyBtn}>-</button>
                        <span style={{fontSize:'13px', fontWeight:'bold'}}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={styles.qtyBtn}>+</button>
                    </div>
                    <button onClick={() => removeFromCart(item._id)} style={{background:'none', border:'none', color:'#444'}}><FaTrash /></button>
                </div>
            ))}
        </div>
        <div style={{marginTop:'20px'}}>
             <label style={{fontSize:'10px', color:'#666', fontWeight:'bold'}}>🍽️ KITCHEN NOTE</label>
             <textarea placeholder="Notes?" value={notes} onChange={e => setNotes(e.target.value)} style={styles.textArea}/>
        </div>
      </div>

      <div style={styles.footer}>
         <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'15px'}}>
             <span style={{color:'#888', fontSize:'14px'}}>Total to Pay</span>
             <span style={{fontSize:'24px', fontWeight:'900'}}>₹{total}</span>
         </div>
         {loading ? (
             <div style={styles.loadingBox}><p style={{fontWeight:'bold'}}>Processing...</p></div>
         ) : (
             <div style={{display:'flex', gap:'10px'}}>
                 <button onClick={() => handlePlaceOrder("Cash")} style={styles.payBtnOutline}>💵 Pay Cash</button>
                 <button onClick={() => handlePlaceOrder("Online")} style={styles.payBtnSolid}>📱 Pay Online</button>
             </div>
         )}
      </div>
    </div>
  );
};

const styles = {
    container: { minHeight:'100vh', background:'#050505', color:'white', fontFamily:'Inter, sans-serif', display:'flex', flexDirection:'column' },
    emptyContainer: { minHeight:'100vh', background:'#050505', color:'white', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' },
    header: { padding:'15px 20px', borderBottom:'1px solid #1a1a1a', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'#050505', zIndex:10 },
    scrollArea: { flex:1, padding:'20px', overflowY:'auto' },
    iconBtn: { background:'none', border:'none', color:'white', fontSize:'18px', cursor:'pointer' },
    backBtn: { padding:'10px 20px', borderRadius:'10px', background:'#222', color:'white', border:'none', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' },
    infoCard: { background:'#111', padding:'15px', borderRadius:'12px', border:'1px solid #222' },
    input: { width:'100%', background:'transparent', border:'none', borderBottom:'1px solid #333', color:'white', padding:'5px 0', fontSize:'14px', outline:'none', marginTop:'5px' },
    itemRow: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px 0', borderBottom:'1px solid #1a1a1a' },
    imgBox: { width:'50px', height:'50px', borderRadius:'8px', background:'#222', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' },
    qtyWrapper: { display:'flex', alignItems:'center', gap:'10px', background:'#1a1a1a', padding:'5px 10px', borderRadius:'8px' },
    qtyBtn: { background:'none', border:'none', color:'white', fontSize:'16px', cursor:'pointer', width:'20px' },
    textArea: { width:'100%', background:'#111', border:'1px solid #222', borderRadius:'10px', padding:'10px', color:'white', marginTop:'5px', outline:'none', fontSize:'13px', minHeight:'60px' },
    footer: { padding:'20px', background:'#111', borderTop:'1px solid #222', marginTop:'auto' },
    payBtnOutline: { flex:1, padding:'15px', borderRadius:'12px', background:'transparent', border:'1px solid #333', color:'white', fontWeight:'bold', cursor:'pointer' },
    payBtnSolid: { flex:1, padding:'15px', borderRadius:'12px', background:'#f97316', border:'none', color:'black', fontWeight:'bold', cursor:'pointer' },
    loadingBox: { textAlign:'center', padding:'15px', background:'#1a1a1a', borderRadius:'12px' }
};

export default Cart;