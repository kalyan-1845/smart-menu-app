import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  CheckCircle,
  Clock,
  MapPin,
  Smartphone,
  Share2,
  Printer,
  Home,
  ShoppingBag,
  Truck,
  Shield,
  Star
} from 'lucide-react';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  useEffect(() => {
    // Load order from localStorage
    const savedOrder = JSON.parse(localStorage.getItem('current_order'));
    
    if (!savedOrder || savedOrder.id !== orderId) {
      toast.error('Order not found');
      navigate('/');
      return;
    }

    setOrder(savedOrder);
    
    // Calculate estimated delivery time (current time + 30-45 minutes)
    const now = new Date();
    const deliveryTime = new Date(now.getTime() + 35 * 60000); // 35 minutes
    setEstimatedDelivery(deliveryTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }));

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [orderId, navigate]);

  const shareOrder = () => {
    const orderDetails = `
Order #${order.id}
Restaurant: ${order.restaurant.name}
Total: $${order.total.toFixed(2)}
Status: ${order.status}
    `.trim();

    if (navigator.share) {
      navigator.share({
        title: `Order ${order.id} Confirmed`,
        text: orderDetails,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(orderDetails);
      toast.success('Order details copied to clipboard');
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const rateOrder = () => {
    toast.success('Rating submitted! Thank you for your feedback.');
  };

  if (!order) {
    return <Loading>Loading order details...</Loading>;
  }

  return (
    <SuccessContainer>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}
      
      <SuccessContent>
        {/* Success Header */}
        <SuccessHeader>
          <SuccessIcon>
            <CheckCircle size={64} color="var(--success-color)" />
          </SuccessIcon>
          <h1>Order Confirmed!</h1>
          <p>Thank you for your order. We've received it and started preparing.</p>
          <OrderNumber>Order #{order.id}</OrderNumber>
        </SuccessHeader>

        {/* Order Summary Card */}
        <SummaryCard>
          <CardHeader>
            <h2>Order Summary</h2>
            <StatusBadge status={order.status}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </StatusBadge>
          </CardHeader>
          
          <RestaurantInfo>
            <RestaurantLogo>
              <ShoppingBag size={24} />
            </RestaurantLogo>
            <div>
              <RestaurantName>{order.restaurant.name}</RestaurantName>
              <OrderTime>
                Ordered at {new Date(order.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </OrderTime>
            </div>
          </RestaurantInfo>
          
          <OrderItems>
            {order.items.map((item, index) => (
              <OrderItem key={index}>
                <ItemQuantity>{item.quantity}x</ItemQuantity>
                <ItemName>{item.name}</ItemName>
                <ItemPrice>${(item.price * item.quantity).toFixed(2)}</ItemPrice>
              </OrderItem>
            ))}
          </OrderItems>
          
          <OrderTotals>
            <TotalRow>
              <span>Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </TotalRow>
            <TotalRow>
              <span>Tax (8.5%)</span>
              <span>${order.tax.toFixed(2)}</span>
            </TotalRow>
            <TotalRow>
              <span>Delivery Fee</span>
              <span>
                {order.deliveryFee === 0 ? 'Free' : `$${order.deliveryFee.toFixed(2)}`}
              </span>
            </TotalRow>
            {order.discount > 0 && (
              <TotalRow discount>
                <span>Discount</span>
                <span>-${order.discount.toFixed(2)}</span>
              </TotalRow>
            )}
            <TotalRow total>
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </TotalRow>
          </OrderTotals>
        </SummaryCard>

        {/* Delivery Information */}
        <InfoGrid>
          <InfoCard>
            <InfoIcon>
              <Clock size={24} />
            </InfoIcon>
            <div>
              <InfoTitle>Estimated Delivery</InfoTitle>
              <InfoValue>{estimatedDelivery}</InfoValue>
              <InfoNote>Approximately 30-45 minutes</InfoNote>
            </div>
          </InfoCard>
          
          <InfoCard>
            <InfoIcon>
              <MapPin size={24} />
            </InfoIcon>
            <div>
              <InfoTitle>Delivery Address</InfoTitle>
              <InfoValue>{order.deliveryInfo.address}</InfoValue>
              <InfoNote>
                {order.deliveryInfo.instructions || 'No special instructions'}
              </InfoNote>
            </div>
          </InfoCard>
          
          <InfoCard>
            <InfoIcon>
              <Smartphone size={24} />
            </InfoIcon>
            <div>
              <InfoTitle>Contact Information</InfoTitle>
              <InfoValue>{order.deliveryInfo.name}</InfoValue>
              <InfoNote>{order.deliveryInfo.phone}</InfoNote>
            </div>
          </InfoCard>
          
          <InfoCard>
            <InfoIcon>
              <Truck size={24} />
            </InfoIcon>
            <div>
              <InfoTitle>Delivery Status</InfoTitle>
              <InfoValue>Preparing your order</InfoValue>
              <InfoNote>Your food is being cooked</InfoNote>
            </div>
          </InfoCard>
        </InfoGrid>

        {/* Payment Information */}
        <PaymentCard>
          <h3>Payment Information</h3>
          <PaymentDetails>
            <PaymentMethod>
              <span>Payment Method:</span>
              <strong>
                {order.paymentMethod === 'card' && 'Credit/Debit Card'}
                {order.paymentMethod === 'cash' && 'Cash on Delivery'}
                {order.paymentMethod === 'digital' && 'Digital Wallet'}
              </strong>
            </PaymentMethod>
            <PaymentStatus>
              <Shield size={16} />
              <span>Payment Successful</span>
            </PaymentStatus>
          </PaymentDetails>
        </PaymentCard>

        {/* Action Buttons */}
        <ActionButtons>
          <ActionButton primary onClick={() => navigate('/track-order/' + order.id)}>
            <Truck size={20} />
            Track Order
          </ActionButton>
          
          <ActionButton onClick={shareOrder}>
            <Share2 size={20} />
            Share Order
          </ActionButton>
          
          <ActionButton onClick={printReceipt}>
            <Printer size={20} />
            Print Receipt
          </ActionButton>
          
          <ActionButton onClick={rateOrder}>
            <Star size={20} />
            Rate Order
          </ActionButton>
        </ActionButtons>

        {/* Next Steps */}
        <NextSteps>
          <h3>What's Next?</h3>
          <Steps>
            <Step>
              <StepNumber>1</StepNumber>
              <div>
                <StepTitle>Order Preparation</StepTitle>
                <StepDescription>The restaurant is preparing your order</StepDescription>
              </div>
            </Step>
            <Step>
              <StepNumber>2</StepNumber>
              <div>
                <StepTitle>Quality Check</StepTitle>
                <StepDescription>Our team ensures food quality</StepDescription>
              </div>
            </Step>
            <Step>
              <StepNumber>3</StepNumber>
              <div>
                <StepTitle>Delivery</StepTitle>
                <StepDescription>Your order will be delivered soon</StepDescription>
              </div>
            </Step>
          </Steps>
        </NextSteps>

        {/* Support & Help */}
        <SupportSection>
          <h3>Need Help?</h3>
          <p>
            If you have any questions about your order, contact our support team.
          </p>
          <SupportButtons>
            <SupportButton href="tel:+15551234567">
              📞 Call Support
            </SupportButton>
            <SupportButton href="mailto:support@foodorder.com">
              ✉️ Email Support
            </SupportButton>
          </SupportButtons>
        </SupportSection>

        {/* Continue Shopping */}
        <ContinueShopping>
          <h3>Hungry for More?</h3>
          <p>Check out other restaurants in your area</p>
          <HomeButton to="/">
            <Home size={20} />
            Back to Restaurants
          </HomeButton>
        </ContinueShopping>
      </SuccessContent>
    </SuccessContainer>
  );
};

const SuccessContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  
  @media print {
    background: white;
    padding: 0;
  }
`;

const SuccessContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 30px;
  
  @media print {
    gap: 20px;
  }
`;

const SuccessHeader = styled.div`
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  
  @media print {
    box-shadow: none;
    border: 1px solid var(--light-gray);
  }
`;

const SuccessIcon = styled.div`
  margin-bottom: 20px;
  
  svg {
    filter: drop-shadow(0 4px 12px rgba(6, 214, 160, 0.3));
  }
`;

const OrderNumber = styled.div`
  display: inline-block;
  margin-top: 15px;
  padding: 10px 20px;
  background: var(--light-gray);
  color: var(--dark-color);
  border-radius: 20px;
  font-weight: 600;
  font-size: 1.1rem;
`;

const SummaryCard = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow);
  
  @media print {
    box-shadow: none;
    border: 1px solid var(--light-gray);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--light-gray);
  
  h2 {
    margin: 0;
    font-size: 1.3rem;
  }
`;

const StatusBadge = styled.span`
  padding: 6px 16px;
  background: ${props => {
    switch(props.status) {
      case 'confirmed': return 'rgba(255, 214, 102, 0.2)';
      case 'preparing': return 'rgba(78, 205, 196, 0.2)';
      case 'delivered': return 'rgba(6, 214, 160, 0.2)';
      default: return 'var(--light-gray)';
    }
  }};
  color: ${props => {
    switch(props.status) {
      case 'confirmed': return 'var(--warning-color)';
      case 'preparing': return 'var(--accent-color)';
      case 'delivered': return 'var(--success-color)';
      default: return 'var(--gray-color)';
    }
  }};
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
`;

const RestaurantInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--light-gray);
`;

const RestaurantLogo = styled.div`
  width: 60px;
  height: 60px;
  background: var(--light-gray);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
`;

const RestaurantName = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 5px;
`;

const OrderTime = styled.div`
  color: var(--gray-color);
  font-size: 14px;
`;

const OrderItems = styled.div`
  margin-bottom: 25px;
`;

const OrderItem = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 0;
  border-bottom: 1px solid var(--light-gray);
  
  &:last-child {
    border-bottom: none;
  }
`;

const ItemQuantity = styled.span`
  color: var(--primary-color);
  font-weight: 600;
  min-width: 30px;
`;

const ItemName = styled.span`
  flex: 1;
`;

const ItemPrice = styled.span`
  font-weight: 600;
  color: var(--dark-color);
`;

const OrderTotals = styled.div`
  padding-top: 20px;
  border-top: 2px solid var(--light-gray);
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: ${props => {
    if (props.discount) return 'var(--success-color)';
    if (props.total) return 'var(--dark-color)';
    return 'var(--gray-color)';
  }};
  font-weight: ${props => props.total ? '700' : '400'};
  font-size: ${props => props.total ? '1.1rem' : '1rem'};
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InfoCard = styled.div`
  background: white;
  border-radius: var(--radius);
  padding: 25px;
  box-shadow: var(--shadow);
  display: flex;
  align-items: flex-start;
  gap: 20px;
  
  @media print {
    box-shadow: none;
    border: 1px solid var(--light-gray);
  }
`;

const InfoIcon = styled.div`
  width: 50px;
  height: 50px;
  background: var(--light-gray);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
`;

const InfoTitle = styled.div`
  font-weight: 500;
  margin-bottom: 5px;
  color: var(--dark-color);
`;

const InfoValue = styled.div`
  font-weight: 600;
  margin-bottom: 5px;
  font-size: 1.1rem;
`;

const InfoNote = styled.div`
  color: var(--gray-color);
  font-size: 14px;
`;

const PaymentCard = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 25px;
  box-shadow: var(--shadow);
  
  @media print {
    box-shadow: none;
    border: 1px solid var(--light-gray);
  }
  
  h3 {
    margin-bottom: 20px;
  }
`;

const PaymentDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
`;

const PaymentMethod = styled.div`
  span {
    color: var(--gray-color);
    margin-right: 10px;
  }
`;

const PaymentStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(6, 214, 160, 0.1);
  color: var(--success-color);
  border-radius: 20px;
  font-weight: 500;
  font-size: 14px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
  
  @media print {
    display: none;
  }
`;

const ActionButton = styled.button`
  flex: 1;
  min-width: 150px;
  padding: 15px 25px;
  background: ${props => props.primary ? 'var(--primary-color)' : 'white'};
  color: ${props => props.primary ? 'white' : 'var(--dark-color)'};
  border: ${props => props.primary ? 'none' : '2px solid var(--light-gray)'};
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.primary ? '#E55A2E' : 'var(--light-gray)'};
    transform: translateY(-2px);
  }
`;

const NextSteps = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow);
  
  @media print {
    box-shadow: none;
    border: 1px solid var(--light-gray);
  }
  
  h3 {
    text-align: center;
    margin-bottom: 30px;
  }
`;

const Steps = styled.div`
  display: flex;
  justify-content: space-between;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 25px;
    left: 50px;
    right: 50px;
    height: 2px;
    background: var(--light-gray);
    z-index: 1;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 30px;
    
    &::before {
      display: none;
    }
  }
`;

const Step = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  z-index: 2;
  flex: 1;
  
  @media (max-width: 768px) {
    flex-direction: row;
    text-align: left;
    gap: 20px;
  }
`;

const StepNumber = styled.div`
  width: 50px;
  height: 50px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  margin-bottom: 15px;
  
  @media (max-width: 768px) {
    margin-bottom: 0;
    flex-shrink: 0;
  }
`;

const StepTitle = styled.div`
  font-weight: 600;
  margin-bottom: 5px;
`;

const StepDescription = styled.div`
  color: var(--gray-color);
  font-size: 14px;
`;

const SupportSection = styled.div`
  text-align: center;
  background: white;
  border-radius: var(--radius-lg);
  padding: 40px 30px;
  box-shadow: var(--shadow);
  
  @media print {
    box-shadow: none;
    border: 1px solid var(--light-gray);
  }
  
  h3 {
    margin-bottom: 15px;
  }
  
  p {
    color: var(--gray-color);
    margin-bottom: 30px;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const SupportButtons = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const SupportButton = styled.a`
  padding: 12px 25px;
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  border-radius: var(--radius);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--primary-color);
    color: white;
  }
`;

const ContinueShopping = styled.div`
  text-align: center;
  background: white;
  border-radius: var(--radius-lg);
  padding: 40px 30px;
  box-shadow: var(--shadow);
  
  @media print {
    display: none;
  }
  
  h3 {
    margin-bottom: 10px;
  }
  
  p {
    color: var(--gray-color);
    margin-bottom: 30px;
  }
`;

const HomeButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 15px 30px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-weight: 600;
  text-decoration: none;
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

export default OrderSuccess;