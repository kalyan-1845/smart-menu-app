import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaSearch, FaShoppingCart, FaPlus, FaMinus, FaInfoCircle, FaUtensils 
} from "react-icons/fa"; // ✅ Fixed typo here

const Menu = ({ cart, addToCart, setRestaurantId, setTableNum }) => {
  const { id, table } = useParams();
  const navigate = useNavigate();
  
  const [menu, setMenu] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");

  // --- 1. INITIALIZE & FETCH MENU ---
  useEffect(() => {
    if (id) {
      setRestaurantId(id); 
      if (table) setTableNum(table);
      
      const fetchMenu = async () => {
        try {
          const res = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/menu/${id}`);
          setMenu(res.data);
          
          const resInfo = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${id}`);
          setRestaurant(resInfo.data);
          
        } catch (err) {
          console.error("Menu Load Failed", err);
        } finally {
          setLoading(false);
        }
      };
      fetchMenu();
    }
  }, [id, table, setRestaurantId, setTableNum]);

  // --- 2. CALCULATE CART COUNTS ---
  const getQty = (itemId) => {
    const item = cart.find(i => i._id === itemId);
    return item ? item.quantity : 0;
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // --- 3. FILTERING ---
  const filteredItems = menu.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (category === "All" || item.category === category)
  );

  const categories = ["All", ...new Set(menu.map(item => item.category))];

  if (loading) return (
    <div style={{height:'100vh', background:'#050505', color:'#f97316', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'}}>
       <div className="spinner"></div>
       <p style={{marginTop:'20px', fontWeight:'bold'}}>LOADING MENU...</p>
       <style>{`.spinner { width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #f97316; border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={styles.container}>
      
      {/* --- TOP NAVBAR (Fixed) --- */}
      <div style={styles.navbar}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
             <div style={styles.logoBox}>
                <FaUtensils />
             </div>
             <div>
                <h2 style={styles.resName}>{restaurant?.restaurantName || "Smart Menu"}</h2>
                <p style={styles.tableBadge}>{table ? `Table ${table}` : "Takeaway / Counter"}</p>
             </div>
        </div>
        
        {/* CART ICON (Top Right) */}
        <div onClick={() => navigate('/cart')} style={styles.cartIconWrapper}>
            <FaShoppingCart size={20} color="white" />
            {totalItems > 0 && <span style={styles.cartBadge}>{totalItems}</span>}
        </div>
      </div>

      {/* --- SEARCH & CATEGORIES --- */}
      <div style={styles.controls}>
        <div style={styles.searchBox}>
            <FaSearch color="#666" />
            <input 
                type="text" 
                placeholder="Search dishes..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
            />
        </div>
        
        <div style={styles.catScroll}>
            {categories.map(cat => (
                <button 
                    key={cat} 
                    onClick={() => setCategory(cat)}
                    style={{
                        ...styles.catBtn, 
                        background: category === cat ? '#f97316' : '#1a1a1a',
                        color: category === cat ? 'white' : '#888'
                    }}
                >
                    {cat}
                </button>
            ))}
        </div>
      </div>

      {/* --- MENU GRID --- */}
      <div style={styles.grid}>
        {filteredItems.map(item => (
            <div key={item._id} style={styles.card}>
                <img src={item.image || "https://via.placeholder.com/150"} alt={item.name} style={styles.foodImg} />
                <div style={styles.cardContent}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                        <h3 style={styles.foodName}>{item.name}</h3>
                        {item.isVeg ? <span style={styles.vegDot}>●</span> : <span style={styles.nonVegDot}>●</span>}
                    </div>
                    <p style={styles.desc}>{item.description.slice(0, 45)}...</p>
                    <div style={styles.priceRow}>
                        <span style={styles.price}>₹{item.price}</span>
                        
                        {/* ADD BUTTON logic */}
                        {getQty(item._id) > 0 ? (
                            <div style={styles.qtyControl}>
                                <span style={{fontSize:'12px', fontWeight:'bold'}}>{getQty(item._id)}</span>
                                <span style={{fontSize:'10px'}}>ADDED</span>
                            </div>
                        ) : (
                            <button onClick={() => addToCart(item)} style={styles.addBtn}>
                                ADD <FaPlus size={10}/>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* --- BOTTOM FLOATING CART BAR (Only shows if items in cart) --- */}
      {totalItems > 0 && (
        <div onClick={() => navigate('/cart')} style={styles.floatingCart}>
            <div style={{display:'flex', flexDirection:'column'}}>
                <span style={{fontSize:'12px', opacity:0.8}}>{totalItems} ITEMS</span>
                <span style={{fontSize:'16px', fontWeight:'900'}}>₹{totalPrice}</span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'10px', fontWeight:'bold'}}>
                VIEW CART <FaShoppingCart />
            </div>
        </div>
      )}
    </div>
  );
};

const styles = {
    container: { minHeight:'100vh', background:'#050505', color:'white', fontFamily:'Inter, sans-serif', paddingBottom:'100px' },
    navbar: { position:'sticky', top:0, zIndex:50, background:'rgba(5,5,5,0.95)', backdropFilter:'blur(10px)', padding:'15px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #1a1a1a' },
    logoBox: { width:'40px', height:'40px', borderRadius:'10px', background:'#f97316', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', color:'white' },
    resName: { margin:0, fontSize:'16px', fontWeight:'800', lineHeight:1.2 },
    tableBadge: { margin:0, fontSize:'11px', color:'#f97316', fontWeight:'600' },
    cartIconWrapper: { position:'relative', padding:'8px', background:'#1a1a1a', borderRadius:'50%', cursor:'pointer' },
    cartBadge: { position:'absolute', top:-2, right:-2, background:'#f97316', color:'white', fontSize:'10px', fontWeight:'bold', width:'16px', height:'16px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #050505' },
    controls: { padding:'15px 20px', background:'#050505' },
    searchBox: { display:'flex', alignItems:'center', gap:'10px', background:'#111', padding:'12px 15px', borderRadius:'12px', border:'1px solid #222', marginBottom:'15px' },
    searchInput: { background:'transparent', border:'none', color:'white', width:'100%', fontSize:'14px', outline:'none' },
    catScroll: { display:'flex', gap:'10px', overflowX:'auto', paddingBottom:'5px', scrollbarWidth:'none' },
    catBtn: { padding:'8px 16px', borderRadius:'20px', border:'none', fontSize:'13px', fontWeight:'600', whiteSpace:'nowrap', cursor:'pointer', transition:'0.2s' },
    grid: { padding:'0 20px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:'15px' },
    card: { background:'#111', borderRadius:'16px', overflow:'hidden', border:'1px solid #1a1a1a', display:'flex', flexDirection:'column' },
    foodImg: { width:'100%', height:'120px', objectFit:'cover' },
    cardContent: { padding:'12px', flex:1, display:'flex', flexDirection:'column' },
    foodName: { margin:'0 0 5px 0', fontSize:'15px', fontWeight:'700', color:'#eee' },
    desc: { fontSize:'11px', color:'#777', margin:'0 0 10px 0', lineHeight:1.4 },
    priceRow: { marginTop:'auto', display:'flex', justifyContent:'space-between', alignItems:'center' },
    price: { fontSize:'15px', fontWeight:'800', color:'white' },
    addBtn: { background:'#1a1a1a', color:'#f97316', border:'1px solid #333', padding:'6px 12px', borderRadius:'8px', fontSize:'11px', fontWeight:'800', display:'flex', alignItems:'center', gap:'5px', cursor:'pointer' },
    qtyControl: { background:'#f97316', color:'black', padding:'6px 10px', borderRadius:'8px', display:'flex', flexDirection:'column', alignItems:'center', lineHeight:1 },
    vegDot: { color:'#22c55e', fontSize:'10px' },
    nonVegDot: { color:'#ef4444', fontSize:'10px' },
    floatingCart: { position:'fixed', bottom:'20px', left:'5%', width:'90%', background:'#f97316', color:'white', borderRadius:'16px', padding:'15px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 10px 30px rgba(249, 115, 22, 0.4)', zIndex:100, cursor:'pointer' }
};

export default Menu;