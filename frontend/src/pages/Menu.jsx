import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  ChevronRight,
  Plus,
  Minus,
  Heart,
  Share2,
  ArrowLeft,
  Utensils
} from 'lucide-react';
import toast from 'react-hot-toast';

const Menu = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    // Mock restaurant data
    const mockRestaurant = {
      id: restaurantId,
      name: 'Spice Heaven',
      cuisine: 'Indian',
      rating: 4.5,
      deliveryTime: '30-40 min',
      description: 'Authentic Indian cuisine with modern twists',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop'
    };

    const mockMenuItems = [
      { id: 1, name: 'Butter Chicken', description: 'Tender chicken in rich tomato butter sauce', price: 16.99, category: 'Main Course', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop', popular: true, spicy: true, vegetarian: false },
      { id: 2, name: 'Paneer Tikka', description: 'Grilled cottage cheese with spices', price: 14.99, category: 'Appetizers', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop', popular: true, spicy: false, vegetarian: true },
      { id: 3, name: 'Chicken Biryani', description: 'Fragrant rice with spiced chicken', price: 18.99, category: 'Main Course', image: 'https://images.unsplash.com/photo-1563379091339-03246963d9d6?w=400&h=300&fit=crop', popular: true, spicy: true, vegetarian: false },
      { id: 4, name: 'Garlic Naan', description: 'Traditional Indian bread with garlic', price: 4.99, category: 'Breads', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop', popular: false, spicy: false, vegetarian: true },
      { id: 5, name: 'Mango Lassi', description: 'Refreshing yogurt drink with mango', price: 5.99, category: 'Beverages', image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=400&h=300&fit=crop', popular: false, spicy: false, vegetarian: true },
      { id: 6, name: 'Vegetable Curry', description: 'Mixed vegetables in creamy sauce', price: 13.99, category: 'Main Course', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop', popular: false, spicy: false, vegetarian: true },
      { id: 7, name: 'Samosa', description: 'Crispy pastry with spiced potatoes', price: 6.99, category: 'Appetizers', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop', popular: true, spicy: false, vegetarian: true },
      { id: 8, name: 'Gulab Jamun', description: 'Sweet milk dumplings in syrup', price: 7.99, category: 'Desserts', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop', popular: false, spicy: false, vegetarian: true }
    ];

    const uniqueCategories = ['all', ...new Set(mockMenuItems.map(item => item.category))];
    
    setRestaurant(mockRestaurant);
    setMenuItems(mockMenuItems);
    setCategories(uniqueCategories);
    
    // Load cart from localStorage
    const savedCart = JSON.parse(localStorage.getItem(`cart_${restaurantId}`)) || [];
    setCart(savedCart);
    
    // Load favorites
    const savedFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
    setFavorites(savedFavorites);
  }, [restaurantId]);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    let updatedCart;
    if (existingItem) {
      updatedCart = cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    } else {
      updatedCart = [...cart, { ...item, quantity: 1 }];
    }
    
    setCart(updatedCart);
    localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(updatedCart));
    toast.success(`${item.name} added to cart`);
  };

  const removeFromCart = (itemId) => {
    const updatedCart = cart.filter(item => item.id !== itemId);
    setCart(updatedCart);
    localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(updatedCart));
    toast.success('Item removed from cart');
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    
    const updatedCart = cart.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(updatedCart));
  };

  const toggleFavorite = (itemId) => {
    let updatedFavorites;
    if (favorites.includes(itemId)) {
      updatedFavorites = favorites.filter(id => id !== itemId);
      toast.success('Removed from favorites');
    } else {
      updatedFavorites = [...favorites, itemId];
      toast.success('Added to favorites');
    }
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/cart');
  };

  if (!restaurant) {
    return <Loading>Loading menu...</Loading>;
  }

  return (
    <MenuContainer>
      {/* Restaurant Header */}
      <RestaurantHeader>
        <BackButton onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Back to Restaurants
        </BackButton>
        
        <RestaurantInfo>
          <RestaurantImage src={restaurant.image} alt={restaurant.name} />
          <RestaurantDetails>
            <h1>{restaurant.name}</h1>
            <RestaurantMeta>
              <CuisineBadge>
                <Utensils size={16} />
                {restaurant.cuisine}
              </CuisineBadge>
              <Rating>
                <Star size={16} fill="var(--warning-color)" color="var(--warning-color)" />
                <span>{restaurant.rating}</span>
              </Rating>
              <DeliveryTime>
                <Clock size={16} />
                <span>{restaurant.deliveryTime}</span>
              </DeliveryTime>
            </RestaurantMeta>
            <p>{restaurant.description}</p>
          </RestaurantDetails>
        </RestaurantInfo>
      </RestaurantHeader>

      {/* Search and Filter */}
      <SearchFilterSection>
        <SearchBox>
          <SearchIcon size={20} />
          <SearchInput
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBox>
        
        <CategoryFilter>
          <FilterLabel>
            <Filter size={16} />
            Categories
          </FilterLabel>
          <CategoryScroll>
            {categories.map(category => (
              <CategoryButton
                key={category}
                active={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All Items' : category}
              </CategoryButton>
            ))}
          </CategoryScroll>
        </CategoryFilter>
      </SearchFilterSection>

      {/* Menu Items */}
      <MenuSection>
        <SectionHeader>
          <h2>Menu Items</h2>
          <ItemCount>{filteredItems.length} items</ItemCount>
        </SectionHeader>
        
        <MenuGrid>
          {filteredItems.map(item => (
            <MenuItemCard key={item.id}>
              <ItemImage src={item.image} alt={item.name} />
              
              <ItemBadges>
                {item.popular && <Badge popular>Popular</Badge>}
                {item.spicy && <Badge spicy>Spicy</Badge>}
                {item.vegetarian && <Badge vegetarian>Vegetarian</Badge>}
              </ItemBadges>
              
              <FavoriteButton
                active={favorites.includes(item.id)}
                onClick={() => toggleFavorite(item.id)}
              >
                <Heart size={20} fill={favorites.includes(item.id) ? 'var(--danger-color)' : 'none'} />
              </FavoriteButton>
              
              <ItemInfo>
                <ItemHeader>
                  <ItemName>{item.name}</ItemName>
                  <ItemPrice>${item.price.toFixed(2)}</ItemPrice>
                </ItemHeader>
                
                <ItemDescription>{item.description}</ItemDescription>
                
                <ItemFooter>
                  <CategoryTag>{item.category}</CategoryTag>
                  <AddButton onClick={() => addToCart(item)}>
                    <Plus size={20} />
                    Add to Cart
                  </AddButton>
                </ItemFooter>
              </ItemInfo>
            </MenuItemCard>
          ))}
        </MenuGrid>
      </MenuSection>

      {/* Cart Sidebar */}
      <CartSidebar>
        <CartHeader>
          <h3>Your Order</h3>
          <CartCount>{cart.length} items</CartCount>
        </CartHeader>
        
        {cart.length === 0 ? (
          <EmptyCart>
            <ShoppingCart size={48} color="var(--light-gray)" />
            <p>Your cart is empty</p>
            <span>Add items from the menu</span>
          </EmptyCart>
        ) : (
          <>
            <CartItems>
              {cart.map(item => (
                <CartItem key={item.id}>
                  <CartItemInfo>
                    <CartItemName>{item.name}</CartItemName>
                    <CartItemPrice>${(item.price * item.quantity).toFixed(2)}</CartItemPrice>
                  </CartItemInfo>
                  
                  <CartItemActions>
                    <QuantityControls>
                      <QuantityButton onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus size={16} />
                      </QuantityButton>
                      <Quantity>{item.quantity}</Quantity>
                      <QuantityButton onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus size={16} />
                      </QuantityButton>
                    </QuantityControls>
                    
                    <RemoveButton onClick={() => removeFromCart(item.id)}>
                      Remove
                    </RemoveButton>
                  </CartItemActions>
                </CartItem>
              ))}
            </CartItems>
            
            <CartSummary>
              <SummaryRow>
                <span>Subtotal</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </SummaryRow>
              <SummaryRow>
                <span>Tax (8.5%)</span>
                <span>${(getCartTotal() * 0.085).toFixed(2)}</span>
              </SummaryRow>
              <SummaryRow>
                <span>Delivery</span>
                <span>$2.99</span>
              </SummaryRow>
              <SummaryTotal>
                <span>Total</span>
                <span>${(getCartTotal() * 1.085 + 2.99).toFixed(2)}</span>
              </SummaryTotal>
            </CartSummary>
            
            <CartActions>
              <ShareButton>
                <Share2 size={20} />
                Share Order
              </ShareButton>
              <CheckoutButton onClick={handleCheckout}>
                <ShoppingCart size={20} />
                Checkout
                <ChevronRight size={20} />
              </CheckoutButton>
            </CartActions>
          </>
        )}
      </CartSidebar>
    </MenuContainer>
  );
};

const MenuContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  background: #f8f9fa;
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 30px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const RestaurantHeader = styled.div`
  grid-column: 1 / -1;
  margin-bottom: 30px;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: var(--gray-color);
  font-size: 16px;
  cursor: pointer;
  padding: 10px 0;
  margin-bottom: 20px;
  
  &:hover {
    color: var(--primary-color);
  }
`;

const RestaurantInfo = styled.div`
  display: flex;
  gap: 30px;
  background: white;
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow);
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const RestaurantImage = styled.img`
  width: 300px;
  height: 200px;
  border-radius: var(--radius);
  object-fit: cover;
  
  @media (max-width: 768px) {
    width: 100%;
    height: 250px;
  }
`;

const RestaurantDetails = styled.div`
  flex: 1;
  
  h1 {
    margin-bottom: 15px;
  }
  
  p {
    color: var(--gray-color);
    line-height: 1.6;
  }
`;

const RestaurantMeta = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
`;

const CuisineBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: rgba(78, 205, 196, 0.1);
  color: var(--accent-color);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
`;

const Rating = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
`;

const DeliveryTime = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--gray-color);
`;

const SearchFilterSection = styled.div`
  grid-column: 1;
  margin-bottom: 30px;
`;

const SearchBox = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-color);
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 16px 16px 16px 48px;
  border: 2px solid var(--light-gray);
  border-radius: var(--radius);
  font-size: 16px;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const CategoryFilter = styled.div`
  background: white;
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
`;

const FilterLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  font-weight: 500;
  color: var(--dark-color);
`;

const CategoryScroll = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 10px;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--light-gray);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--primary-color);
    border-radius: 2px;
  }
`;

const CategoryButton = styled.button`
  padding: 10px 20px;
  background: ${props => props.active ? 'var(--primary-color)' : 'var(--light-gray)'};
  color: ${props => props.active ? 'white' : 'var(--dark-color)'};
  border: none;
  border-radius: 20px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.active ? '#E55A2E' : '#dde0e3'};
  }
`;

const MenuSection = styled.div`
  grid-column: 1;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const ItemCount = styled.div`
  padding: 8px 16px;
  background: var(--light-gray);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
`;

const MenuItemCard = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
  }
`;

const ItemImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
`;

const ItemBadges = styled.div`
  position: absolute;
  top: 15px;
  left: 15px;
  display: flex;
  gap: 8px;
`;

const Badge = styled.span`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    if (props.popular) return 'var(--warning-color)';
    if (props.spicy) return 'var(--danger-color)';
    if (props.vegetarian) return 'var(--success-color)';
    return 'var(--gray-color)';
  }};
  color: white;
`;

const FavoriteButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  background: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    
    svg {
      color: var(--danger-color);
    }
  }
  
  svg {
    color: ${props => props.active ? 'var(--danger-color)' : 'var(--gray-color)'};
    transition: color 0.3s ease;
  }
`;

const ItemInfo = styled.div`
  padding: 20px;
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
`;

const ItemName = styled.h3`
  font-size: 1.1rem;
  margin: 0;
`;

const ItemPrice = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary-color);
`;

const ItemDescription = styled.p`
  color: var(--gray-color);
  font-size: 0.9rem;
  margin-bottom: 20px;
  line-height: 1.5;
`;

const ItemFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CategoryTag = styled.span`
  padding: 4px 12px;
  background: var(--light-gray);
  color: var(--gray-color);
  border-radius: 12px;
  font-size: 12px;
`;

const AddButton = styled.button`
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s ease;
  
  &:hover {
    background: #E55A2E;
  }
`;

const CartSidebar = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 25px;
  box-shadow: var(--shadow);
  height: fit-content;
  position: sticky;
  top: 20px;
  
  @media (max-width: 1024px) {
    position: static;
    margin-top: 30px;
  }
`;

const CartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--light-gray);
  
  h3 {
    margin: 0;
  }
`;

const CartCount = styled.div`
  padding: 6px 12px;
  background: var(--primary-color);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
`;

const EmptyCart = styled.div`
  text-align: center;
  padding: 40px 20px;
  
  svg {
    margin-bottom: 15px;
    color: var(--light-gray);
  }
  
  p {
    font-weight: 500;
    margin-bottom: 5px;
  }
  
  span {
    color: var(--gray-color);
    font-size: 14px;
  }
`;

const CartItems = styled.div`
  margin-bottom: 25px;
  max-height: 300px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--light-gray);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--primary-color);
    border-radius: 2px;
  }
`;

const CartItem = styled.div`
  padding: 15px 0;
  border-bottom: 1px solid var(--light-gray);
  
  &:last-child {
    border-bottom: none;
  }
`;

const CartItemInfo = styled.div`
  margin-bottom: 10px;
`;

const CartItemName = styled.div`
  font-weight: 500;
  margin-bottom: 5px;
`;

const CartItemPrice = styled.div`
  color: var(--primary-color);
  font-weight: 600;
`;

const CartItemActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const QuantityButton = styled.button`
  width: 28px;
  height: 28px;
  border: 1px solid var(--light-gray);
  background: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background: var(--light-gray);
  }
`;

const Quantity = styled.span`
  min-width: 20px;
  text-align: center;
  font-weight: 500;
`;

const RemoveButton = styled.button`
  padding: 6px 12px;
  background: transparent;
  color: var(--danger-color);
  border: 1px solid var(--danger-color);
  border-radius: var(--radius);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--danger-color);
    color: white;
  }
`;

const CartSummary = styled.div`
  margin-bottom: 25px;
  padding: 20px;
  background: var(--light-gray);
  border-radius: var(--radius);
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: var(--gray-color);
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SummaryTotal = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid var(--dark-color);
  font-weight: 600;
  font-size: 1.1rem;
`;

const CartActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ShareButton = styled.button`
  padding: 12px;
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 107, 53, 0.1);
  }
`;

const CheckoutButton = styled.button`
  padding: 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background-color 0.3s ease;
  
  &:hover {
    background: #E55A2E;
  }
`;

const Loading = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: var(--gray-color);
`;

export default Menu;