import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  ArrowLeft,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  MapPin,
  Clock,
  Shield,
  CheckCircle,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: '',
    phone: '',
    address: '',
    instructions: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = JSON.parse(localStorage.getItem('current_cart')) || [];
    const restaurantId = localStorage.getItem('current_restaurant');
    
    if (savedCart.length === 0) {
      toast.error('Your cart is empty');
      navigate('/');
      return;
    }

    // Mock restaurant data
    const mockRestaurant = {
      id: restaurantId,
      name: 'Spice Heaven',
      deliveryTime: '30-40 min',
      minimumOrder: 15.00
    };

    setCart(savedCart);
    setRestaurant(mockRestaurant);

    // Load saved delivery info
    const savedInfo = JSON.parse(localStorage.getItem('delivery_info')) || {};
    setDeliveryInfo(prev => ({ ...prev, ...savedInfo }));
  }, [navigate]);

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }
    
    const updatedCart = cart.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    
    setCart(updatedCart);
    localStorage.setItem('current_cart', JSON.stringify(updatedCart));
  };

  const removeItem = (itemId) => {
    const updatedCart = cart.filter(item => item.id !== itemId);
    setCart(updatedCart);
    localStorage.setItem('current_cart', JSON.stringify(updatedCart));
    toast.success('Item removed from cart');
    
    if (updatedCart.length === 0) {
      navigate('/');
    }
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTax = () => {
    return getSubtotal() * 0.085; // 8.5% tax
  };

  const getDeliveryFee = () => {
    return getSubtotal() >= 15.00 ? 0 : 2.99;
  };

  const getDiscount = () => {
    if (discountApplied && discountCode.toLowerCase() === 'save10') {
      return getSubtotal() * 0.10;
    }
    return 0;
  };

  const getTotal = () => {
    return getSubtotal() + getTax() + getDeliveryFee() - getDiscount();
  };

  const applyDiscount = () => {
    if (discountCode.toLowerCase() === 'save10') {
      setDiscountApplied(true);
      toast.success('10% discount applied!');
    } else {
      toast.error('Invalid discount code');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryInfo(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Save to localStorage
    localStorage.setItem('delivery_info', JSON.stringify({
      ...deliveryInfo,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!deliveryInfo.name.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    if (!deliveryInfo.phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }
    if (!deliveryInfo.address.trim()) {
      toast.error('Please enter your delivery address');
      return false;
    }
    if (getSubtotal() < (restaurant?.minimumOrder || 15.00)) {
      toast.error(`Minimum order amount is $${restaurant?.minimumOrder}`);
      return false;
    }
    return true;
  };

  const handlePlaceOrder = () => {
    if (!validateForm()) return;

    // Generate order ID
    const orderId = 'ORD' + Date.now().toString().slice(-8);
    
    // Save order to localStorage
    const order = {
      id: orderId,
      restaurant: restaurant,
      items: cart,
      deliveryInfo,
      paymentMethod,
      subtotal: getSubtotal(),
      tax: getTax(),
      deliveryFee: getDeliveryFee(),
      discount: getDiscount(),
      total: getTotal(),
      timestamp: new Date().toISOString(),
      status: 'confirmed'
    };
    
    localStorage.setItem('current_order', JSON.stringify(order));
    
    // Clear cart
    localStorage.removeItem('current_cart');
    
    // Navigate to success page
    navigate(`/order-success/${orderId}`);
  };

  if (!restaurant) {
    return <Loading>Loading cart...</Loading>;
  }

  return (
    <CartContainer>
      <CartHeader>
        <BackButton onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Back to Menu
        </BackButton>
        <HeaderTitle>
          <ShoppingCart size={32} />
          <h1>Checkout</h1>
        </HeaderTitle>
      </CartHeader>

      <CartContent>
        {/* Left Column - Order Details & Delivery */}
        <LeftColumn>
          {/* Order Summary */}
          <SectionCard>
            <SectionTitle>
              <h2>Your Order</h2>
              <RestaurantInfo>
                <span>{restaurant.name}</span>
                <DeliveryTime>
                  <Clock size={16} />
                  {restaurant.deliveryTime}
                </DeliveryTime>
              </RestaurantInfo>
            </SectionTitle>
            
            <OrderItems>
              {cart.map(item => (
                <OrderItem key={item.id}>
                  <ItemDetails>
                    <ItemName>{item.name}</ItemName>
                    <ItemPrice>${(item.price * item.quantity).toFixed(2)}</ItemPrice>
                  </ItemDetails>
                  
                  <ItemControls>
                    <QuantityControls>
                      <QuantityButton onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus size={16} />
                      </QuantityButton>
                      <Quantity>{item.quantity}</Quantity>
                      <QuantityButton onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus size={16} />
                      </QuantityButton>
                    </QuantityControls>
                    
                    <RemoveButton onClick={() => removeItem(item.id)}>
                      <Trash2 size={18} />
                    </RemoveButton>
                  </ItemControls>
                </OrderItem>
              ))}
            </OrderItems>
          </SectionCard>

          {/* Delivery Information */}
          <SectionCard>
            <SectionTitle>
              <MapPin size={24} />
              <h2>Delivery Information</h2>
            </SectionTitle>
            
            <FormGrid>
              <FormGroup>
                <FormLabel>Full Name *</FormLabel>
                <FormControl
                  type="text"
                  name="name"
                  value={deliveryInfo.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <FormLabel>Phone Number *</FormLabel>
                <FormControl
                  type="tel"
                  name="phone"
                  value={deliveryInfo.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </FormGroup>
              
              <FormGroup fullWidth>
                <FormLabel>Delivery Address *</FormLabel>
                <FormControl
                  type="text"
                  name="address"
                  value={deliveryInfo.address}
                  onChange={handleInputChange}
                  placeholder="Enter complete delivery address"
                  required
                />
              </FormGroup>
              
              <FormGroup fullWidth>
                <FormLabel>Delivery Instructions (Optional)</FormLabel>
                <TextArea
                  name="instructions"
                  value={deliveryInfo.instructions}
                  onChange={handleInputChange}
                  placeholder="Gate code, floor, special instructions..."
                  rows={3}
                />
              </FormGroup>
            </FormGrid>
          </SectionCard>

          {/* Payment Method */}
          <SectionCard>
            <SectionTitle>
              <CreditCard size={24} />
              <h2>Payment Method</h2>
            </SectionTitle>
            
            <PaymentOptions>
              <PaymentOption
                active={paymentMethod === 'card'}
                onClick={() => setPaymentMethod('card')}
              >
                <RadioButton active={paymentMethod === 'card'} />
                <PaymentInfo>
                  <PaymentTitle>Credit/Debit Card</PaymentTitle>
                  <PaymentDescription>Pay with your card securely</PaymentDescription>
                </PaymentInfo>
                <CardIcons>💳 🏦</CardIcons>
              </PaymentOption>
              
              <PaymentOption
                active={paymentMethod === 'cash'}
                onClick={() => setPaymentMethod('cash')}
              >
                <RadioButton active={paymentMethod === 'cash'} />
                <PaymentInfo>
                  <PaymentTitle>Cash on Delivery</PaymentTitle>
                  <PaymentDescription>Pay with cash when order arrives</PaymentDescription>
                </PaymentInfo>
                <CashIcon>💵</CashIcon>
              </PaymentOption>
              
              <PaymentOption
                active={paymentMethod === 'digital'}
                onClick={() => setPaymentMethod('digital')}
              >
                <RadioButton active={paymentMethod === 'digital'} />
                <PaymentInfo>
                  <PaymentTitle>Digital Wallet</PaymentTitle>
                  <PaymentDescription>Apple Pay, Google Pay, etc.</PaymentDescription>
                </PaymentInfo>
                <WalletIcons>📱 💰</WalletIcons>
              </PaymentOption>
            </PaymentOptions>
          </SectionCard>
        </LeftColumn>

        {/* Right Column - Order Summary */}
        <RightColumn>
          <SummaryCard>
            <SummaryHeader>
              <h2>Order Summary</h2>
            </SummaryHeader>
            
            <SummaryDetails>
              <SummaryRow>
                <span>Subtotal ({cart.length} items)</span>
                <span>${getSubtotal().toFixed(2)}</span>
              </SummaryRow>
              
              <SummaryRow>
                <span>Tax (8.5%)</span>
                <span>${getTax().toFixed(2)}</span>
              </SummaryRow>
              
              <SummaryRow>
                <span>Delivery Fee</span>
                <span>
                  {getDeliveryFee() === 0 ? (
                    <FreeDelivery>Free</FreeDelivery>
                  ) : (
                    `$${getDeliveryFee().toFixed(2)}`
                  )}
                </span>
              </SummaryRow>
              
              {discountApplied && (
                <SummaryRow discount>
                  <span>Discount (SAVE10)</span>
                  <span>-${getDiscount().toFixed(2)}</span>
                </SummaryRow>
              )}
              
              <SummaryTotal>
                <span>Total</span>
                <span>${getTotal().toFixed(2)}</span>
              </SummaryTotal>
            </SummaryDetails>
            
            {/* Discount Code */}
            <DiscountSection>
              <DiscountInput>
                <Tag size={20} />
                <input
                  type="text"
                  placeholder="Enter discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  disabled={discountApplied}
                />
                <DiscountButton
                  onClick={applyDiscount}
                  disabled={discountApplied}
                >
                  {discountApplied ? 'Applied' : 'Apply'}
                </DiscountButton>
              </DiscountInput>
              {!discountApplied && (
                <DiscountHint>Try "SAVE10" for 10% off</DiscountHint>
              )}
            </DiscountSection>
            
            {/* Order Minimum */}
            {getSubtotal() < restaurant.minimumOrder && (
              <MinimumOrderWarning>
                <span>Minimum order: ${restaurant.minimumOrder}</span>
                <span>Add ${(restaurant.minimumOrder - getSubtotal()).toFixed(2)} more</span>
              </MinimumOrderWarning>
            )}
            
            {/* Security Badge */}
            <SecurityBadge>
              <Shield size={20} />
              <span>Secure checkout • Your data is protected</span>
            </SecurityBadge>
            
            {/* Place Order Button */}
            <PlaceOrderButton
              onClick={handlePlaceOrder}
              disabled={getSubtotal() < restaurant.minimumOrder}
            >
              <CheckCircle size={24} />
              Place Order
              <span>${getTotal().toFixed(2)}</span>
            </PlaceOrderButton>
            
            <TermsAgreement>
              By placing your order, you agree to our{' '}
              <Link to="/terms">Terms of Service</Link> and{' '}
              <Link to="/privacy">Privacy Policy</Link>
            </TermsAgreement>
          </SummaryCard>
          
          {/* Estimated Delivery */}
          <DeliveryEstimate>
            <Clock size={20} />
            <div>
              <h4>Estimated Delivery Time</h4>
              <p>{restaurant.deliveryTime}</p>
            </div>
          </DeliveryEstimate>
          
          {/* Support */}
          <SupportCard>
            <h4>Need Help?</h4>
            <p>Contact our support team for any questions about your order.</p>
            <SupportLink href="tel:+15551234567">
              📞 +1 (555) 123-4567
            </SupportLink>
          </SupportCard>
        </RightColumn>
      </CartContent>
    </CartContainer>
  );
};

const CartContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  background: #f8f9fa;
`;

const CartHeader = styled.div`
  max-width: 1200px;
  margin: 0 auto 30px;
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

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  
  h1 {
    margin: 0;
  }
  
  svg {
    color: var(--primary-color);
  }
`;

const CartContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 30px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
`;

const SectionCard = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow);
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--light-gray);
  
  h2 {
    margin: 0;
    font-size: 1.3rem;
  }
  
  svg {
    color: var(--primary-color);
  }
`;

const RestaurantInfo = styled.div`
  margin-left: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  
  span:first-child {
    font-weight: 600;
    color: var(--dark-color);
  }
`;

const DeliveryTime = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--gray-color);
  font-size: 14px;
`;

const OrderItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--light-gray);
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const ItemDetails = styled.div`
  flex: 1;
`;

const ItemName = styled.div`
  font-weight: 500;
  margin-bottom: 5px;
`;

const ItemPrice = styled.div`
  color: var(--primary-color);
  font-weight: 600;
`;

const ItemControls = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const QuantityButton = styled.button`
  width: 32px;
  height: 32px;
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
  min-width: 24px;
  text-align: center;
  font-weight: 500;
`;

const RemoveButton = styled.button`
  width: 40px;
  height: 40px;
  border: 1px solid var(--danger-color);
  background: transparent;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--danger-color);
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--danger-color);
    color: white;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  grid-column: ${props => props.fullWidth ? '1 / -1' : 'auto'};
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--dark-color);
`;

const FormControl = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--light-gray);
  border-radius: var(--radius);
  font-size: 16px;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--light-gray);
  border-radius: var(--radius);
  font-size: 16px;
  transition: border-color 0.3s ease;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const PaymentOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const PaymentOption = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border: 2px solid ${props => props.active ? 'var(--primary-color)' : 'var(--light-gray)'};
  border-radius: var(--radius);
  cursor: pointer;
  background: ${props => props.active ? 'rgba(255, 107, 53, 0.05)' : 'white'};
  transition: all 0.3s ease;
  
  &:hover {
    border-color: var(--primary-color);
  }
`;

const RadioButton = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${props => props.active ? 'var(--primary-color)' : 'var(--gray-color)'};
  border-radius: 50%;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    background: var(--primary-color);
    border-radius: 50%;
    opacity: ${props => props.active ? 1 : 0};
  }
`;

const PaymentInfo = styled.div`
  flex: 1;
`;

const PaymentTitle = styled.div`
  font-weight: 600;
  margin-bottom: 5px;
`;

const PaymentDescription = styled.div`
  font-size: 14px;
  color: var(--gray-color);
`;

const CardIcons = styled.div`
  font-size: 20px;
`;

const CashIcon = styled.div`
  font-size: 24px;
`;

const WalletIcons = styled.div`
  font-size: 20px;
`;

const SummaryCard = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow);
  position: sticky;
  top: 20px;
`;

const SummaryHeader = styled.div`
  margin-bottom: 25px;
  
  h2 {
    margin: 0;
    font-size: 1.3rem;
  }
`;

const SummaryDetails = styled.div`
  margin-bottom: 25px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  color: ${props => props.discount ? 'var(--success-color)' : 'var(--gray-color)'};
  font-weight: ${props => props.discount ? '600' : '400'};
`;

const FreeDelivery = styled.span`
  color: var(--success-color);
  font-weight: 600;
`;

const SummaryTotal = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid var(--dark-color);
  font-size: 1.2rem;
  font-weight: 700;
`;

const DiscountSection = styled.div`
  margin-bottom: 20px;
`;

const DiscountInput = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: 2px solid var(--light-gray);
  border-radius: var(--radius);
  margin-bottom: 8px;
  
  svg {
    color: var(--gray-color);
  }
  
  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 16px;
    
    &:disabled {
      background: transparent;
      color: var(--success-color);
    }
  }
`;

const DiscountButton = styled.button`
  padding: 8px 20px;
  background: ${props => props.disabled ? 'var(--success-color)' : 'var(--primary-color)'};
  color: white;
  border: none;
  border-radius: var(--radius);
  font-weight: 600;
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  transition: background-color 0.3s ease;
  
  &:hover:not(:disabled) {
    background: #E55A2E;
  }
`;

const DiscountHint = styled.div`
  font-size: 12px;
  color: var(--gray-color);
  text-align: center;
`;

const MinimumOrderWarning = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: rgba(255, 214, 102, 0.2);
  border: 1px solid var(--warning-color);
  border-radius: var(--radius);
  margin-bottom: 20px;
  font-size: 14px;
  
  span:first-child {
    color: var(--dark-color);
  }
  
  span:last-child {
    color: var(--primary-color);
    font-weight: 600;
  }
`;

const SecurityBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px;
  background: var(--light-gray);
  border-radius: var(--radius);
  margin-bottom: 25px;
  font-size: 14px;
  color: var(--gray-color);
  
  svg {
    color: var(--success-color);
  }
`;

const PlaceOrderButton = styled.button`
  width: 100%;
  padding: 20px;
  background: ${props => props.disabled ? 'var(--light-gray)' : 'var(--primary-color)'};
  color: ${props => props.disabled ? 'var(--gray-color)' : 'white'};
  border: none;
  border-radius: var(--radius);
  font-size: 18px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  transition: background-color 0.3s ease;
  
  &:hover:not(:disabled) {
    background: #E55A2E;
  }
  
  span {
    margin-left: auto;
    font-size: 1.2rem;
  }
`;

const TermsAgreement = styled.div`
  margin-top: 20px;
  text-align: center;
  font-size: 12px;
  color: var(--gray-color);
  
  a {
    color: var(--primary-color);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const DeliveryEstimate = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  
  svg {
    color: var(--primary-color);
  }
  
  h4 {
    margin: 0 0 5px 0;
    font-size: 1rem;
  }
  
  p {
    margin: 0;
    color: var(--gray-color);
    font-size: 14px;
  }
`;

const SupportCard = styled.div`
  padding: 20px;
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  
  h4 {
    margin: 0 0 10px 0;
    font-size: 1rem;
  }
  
  p {
    margin: 0 0 15px 0;
    color: var(--gray-color);
    font-size: 14px;
    line-height: 1.5;
  }
`;

const SupportLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
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

export default Cart;