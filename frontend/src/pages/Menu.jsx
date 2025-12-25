import React, { useState } from "react";
import { FaSearch, FaShoppingCart, FaStar, FaPlus, FaMinus, FaUtensils } from "react-icons/fa";

// --- 1. SAMPLE DATA (15 ITEMS) ---
const MENU_ITEMS = [
  // STARTERS
  {
    id: 1,
    name: "Crispy Corn",
    price: 249,
    category: "Starters",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1621510456600-4db05c95660b?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 2,
    name: "Chicken 65",
    price: 329,
    category: "Starters",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 3,
    name: "Paneer Tikka",
    price: 299,
    category: "Starters",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&auto=format&fit=crop&q=60"
  },
  // MAIN COURSE
  {
    id: 4,
    name: "Hyderabadi Chicken Biryani",
    price: 499,
    category: "Main Course",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 5,
    name: "Butter Naan",
    price: 60,
    category: "Main Course",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 6,
    name: "Paneer Butter Masala",
    price: 349,
    category: "Main Course",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 7,
    name: "Mutton Rogan Josh",
    price: 549,
    category: "Main Course",
    rating: 4.8,
    image: "https://plus.unsplash.com/premium_photo-1661609678486-1361c47be5d8?w=800&auto=format&fit=crop&q=60"
  },
  // BURGERS & PIZZA
  {
    id: 8,
    name: "Classic Cheese Burger",
    price: 199,
    category: "Fast Food",
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 9,
    name: "Spicy Chicken Burger",
    price: 249,
    category: "Fast Food",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 10,
    name: "Margherita Pizza",
    price: 399,
    category: "Fast Food",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 11,
    name: "Pepperoni Pizza",
    price: 499,
    category: "Fast Food",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop&q=60"
  },
  // DESSERTS & DRINKS
  {
    id: 12,
    name: "Chocolate Brownie",
    price: 149,
    category: "Dessert",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 13,
    name: "Gulab Jamun",
    price: 99,
    category: "Dessert",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1601303516000-388647ba9510?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 14,
    name: "Mango Lassi",
    price: 129,
    category: "Beverages",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1634547986064-074474320b99?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 15,
    name: "Iced Cola",
    price: 79,
    category: "Beverages",
    rating: 4.2,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=60"
  }
];

const CATEGORIES = ["All", "Starters", "Main Course", "Fast Food", "Dessert", "Beverages"];

const Menu = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  // Filter Logic
  const filteredItems = MENU_ITEMS.filter(item => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart Logic
  const addToCart = (id) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[id] > 1) newCart[id] -= 1;
      else delete newCart[id];
      return newCart;
    });
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = MENU_ITEMS.find(i => i.id === parseInt(id));
    return sum + (item.price * qty);
  }, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", paddingBottom: "80px", fontFamily: "'Inter', sans-serif" }}>
      
      {/* --- HEADER --- */}
      <div style={{ padding: "20px", background: "#111", position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid #222" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h1 style={{ fontSize: "22px", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <FaUtensils color="#f97316" /> Deccan Fresh
          </h1>
          <div style={{ background: "#222", padding: "8px 15px", borderRadius: "20px", fontSize: "14px", fontWeight: "bold", color: "#f97316" }}>
            Table #4
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: "relative", marginBottom: "15px" }}>
          <FaSearch style={{ position: "absolute", left: "15px", top: "12px", color: "#666" }} />
          <input 
            type="text" 
            placeholder="Search for dishes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "12px", background: "#222", border: "none", color: "white", outline: "none" }}
          />
        </div>

        {/* Categories (Horizontal Scroll) */}
        <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "5px", scrollbarWidth: "none" }}>
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 16px", borderRadius: "20px", border: "none", whiteSpace: "nowrap", cursor: "pointer",
                background: activeCategory === cat ? "#f97316" : "#222",
                color: activeCategory === cat ? "white" : "#aaa",
                fontWeight: activeCategory === cat ? "bold" : "normal"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* --- MENU GRID --- */}
      <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "20px" }}>
        {filteredItems.map(item => (
          <div key={item.id} style={{ background: "#111", borderRadius: "16px", overflow: "hidden", border: "1px solid #222", display: "flex", flexDirection: "column" }}>
            {/* Image */}
            <div style={{ height: "140px", overflow: "hidden", position: "relative" }}>
              <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", bottom: "10px", left: "10px", background: "rgba(0,0,0,0.7)", padding: "4px 8px", borderRadius: "8px", fontSize: "12px", color: "#fbbf24", display: "flex", alignItems: "center", gap: "4px" }}>
                <FaStar /> {item.rating}
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: "12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: "16px", margin: "0 0 5px 0", lineHeight: "1.3" }}>{item.name}</h3>
                <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>{item.category}</p>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px" }}>
                <div style={{ fontWeight: "bold", fontSize: "16px" }}>₹{item.price}</div>
                
                {cart[item.id] ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f97316", padding: "5px 10px", borderRadius: "8px" }}>
                    <FaMinus size={10} onClick={() => removeFromCart(item.id)} style={{ cursor: "pointer" }} />
                    <span style={{ fontSize: "14px", fontWeight: "bold" }}>{cart[item.id]}</span>
                    <FaPlus size={10} onClick={() => addToCart(item.id)} style={{ cursor: "pointer" }} />
                  </div>
                ) : (
                  <button onClick={() => addToCart(item.id)} style={{ background: "#222", border: "1px solid #333", color: "#f97316", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
                    ADD
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div style={{ textAlign: "center", padding: "50px", color: "#666" }}>
          <FaSearch size={40} style={{ marginBottom: "15px", opacity: 0.5 }} />
          <p>No dishes found. Try a different category.</p>
        </div>
      )}

      {/* --- FLOATING CART BUTTON --- */}
      {totalItems > 0 && (
        <div style={{ position: "fixed", bottom: "20px", left: "5%", width: "90%", background: "#f97316", padding: "15px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 30px rgba(249, 115, 22, 0.4)", zIndex: 200, cursor: "pointer" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", opacity: 0.9 }}>{totalItems} ITEMS</span>
            <span style={{ fontSize: "16px", fontWeight: "bold" }}>₹{totalPrice}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "bold" }}>
            View Cart <FaShoppingCart />
          </div>
        </div>
      )}

    </div>
  );
};

export default Menu;