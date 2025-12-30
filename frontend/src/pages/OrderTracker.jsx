import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  MapPin,
  Clock,
  User,
  Phone,
  Truck,
  CheckCircle,
  Package,
  Chef,
  ArrowLeft,
  RefreshCw,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';

// Fix for leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const OrderTracker = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState('preparing');
  const [driverLocation, setDriverLocation] = useState([40.7128, -74.0060]); // NYC coordinates
  const [estimatedTime, setEstimatedTime] = useState('30-40 min');
  const [driverInfo, setDriverInfo] = useState({
    name: 'John Doe',
    phone: '+1 (555) 123-4567',
    vehicle: 'Toyota Prius',
    licensePlate: 'ABC-123'
  });
  const [timeRemaining, setTimeRemaining] = useState(35); // minutes

  const statusSteps = [
    { id: 'ordered', title: 'Order Placed', description: 'Order received', icon: Package },
    { id: 'preparing', title: 'Preparing', description: 'Restaurant is preparing', icon: Chef },
    { id: 'ready', title: 'Ready', description: 'Order is ready for pickup', icon: CheckCircle },
    { id: 'picked', title: 'Picked Up', description: 'Driver picked up order', icon: Truck },
    { id: 'delivered', title: 'Delivered', description: 'Order delivered', icon: MapPin }
  ];

  useEffect(() => {
    // Load order from localStorage
    const savedOrder = JSON.parse(localStorage.getItem('current_order'));
    
    if (!savedOrder || savedOrder.id !== orderId) {
      toast.error('Order not found');
      navigate('/');
      return;
    }

    setOrder(savedOrder);
    
    // Simulate order tracking updates
    const interval = setInterval(() => {
      updateTrackingStatus();
      updateDriverLocation();
      updateTimeRemaining();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [orderId, navigate]);

  const updateTrackingStatus = () => {
    const statuses = ['ordered', 'preparing', 'ready', 'picked', 'delivered'];
    const currentIndex = statuses.indexOf(trackingStatus);
    
    if (currentIndex < statuses.length - 1) {
      const nextStatus = statuses[currentIndex + 1];
      setTrackingStatus(nextStatus);
      
      // Show notification for status change
      const statusTitle = statusSteps.find(s => s.id === nextStatus)?.title;
      toast.success(`Order status updated: ${statusTitle}`);
    }
  };

  const updateDriverLocation = () => {
    // Simulate driver moving closer to destination
    setDriverLocation(prev => [
      prev[0] + (Math.random() - 0.5) * 0.001,
      prev[1] + (Math.random() - 0.5) * 0.001
    ]);
  };

  const updateTimeRemaining = () => {
    if (timeRemaining > 0) {
      setTimeRemaining(prev => Math.max(0, prev - 5));
      
      if (timeRemaining <= 10) {
        setEstimatedTime('5-10 min');
      } else if (timeRemaining <= 20) {
        setEstimatedTime('15-20 min');
      }
    }
  };

  const getActiveStepIndex = () => {
    return statusSteps.findIndex(step => step.id === trackingStatus);
  };

  const callDriver = () => {
    toast.success(`Calling ${driverInfo.name}...`);
    window.open(`tel:${driverInfo.phone.replace(/\D/g, '')}`, '_blank');
  };

  const messageDriver = () => {
    toast.success('Opening messaging app...');
    window.open(`sms:${driverInfo.phone.replace(/\D/g, '')}`, '_blank');
  };

  const refreshOrder = () => {
    toast.loading('Refreshing order status...');
    setTimeout(() => {
      toast.dismiss();
      toast.success('Order status updated');
    }, 1000);
  };

  if (!order) {
    return <Loading>Loading order tracker...</Loading>;
  }

  const activeStepIndex = getActiveStepIndex();

  return (
    <TrackerContainer>
      <TrackerHeader>
        <BackButton onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Back
        </BackButton>
        <HeaderContent>
          <h1>Track Your Order</h1>
          <OrderNumber>Order #{order.id}</OrderNumber>
        </HeaderContent>
        <RefreshButton onClick={refreshOrder}>
          <RefreshCw size={20} />
          Refresh
        </RefreshButton>
      </TrackerHeader>

      <TrackerContent>
        {/* Order Status Timeline */}
        <StatusCard>
          <CardHeader>
            <h2>Order Status</h2>
            <TimeRemaining>
              <Clock size={16} />
              <span>{timeRemaining} min remaining</span>
            </TimeRemaining>
          </CardHeader>
          
          <Timeline>
            {statusSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index <= activeStepIndex;
              const isCurrent = index === activeStepIndex;
              
              return (
                <TimelineStep key={step.id} active={isActive} current={isCurrent}>
                  <StepIndicator active={isActive} current={isCurrent}>
                    {isActive ? (
                      <StepIcon size={20} color="white" />
                    ) : (
                      <div className="step-number">{index + 1}</div>
                    )}
                  </StepIndicator>
                  <StepContent>
                    <StepTitle>{step.title}</StepTitle>
                    <StepDescription>{step.description}</StepDescription>
                    {isCurrent && (
                      <StepStatus>In Progress</StepStatus>
                    )}
                    {isActive && !isCurrent && (
                      <StepTime>A few minutes ago</StepTime>
                    )}
                  </StepContent>
                </TimelineStep>
              );
            })}
          </Timeline>
        </StatusCard>

        {/* Driver Information */}
        <DriverCard>
          <CardHeader>
            <h2>Your Driver</h2>
            <DriverStatus>
              <Truck size={16} />
              <span>On the way</span>
            </DriverStatus>
          </CardHeader>
          
          <DriverInfo>
            <DriverAvatar>
              <User size={24} />
            </DriverAvatar>
            <DriverDetails>
              <DriverName>{driverInfo.name}</DriverName>
              <DriverMeta>
                <span>{driverInfo.vehicle}</span>
                <span>•</span>
                <span>{driverInfo.licensePlate}</span>
              </DriverMeta>
            </DriverDetails>
            <DriverActions>
              <DriverButton onClick={callDriver}>
                <Phone size={20} />
                Call
              </DriverButton>
              <DriverButton secondary onClick={messageDriver}>
                <MessageCircle size={20} />
                Message
              </DriverButton>
            </DriverActions>
          </DriverInfo>
          
          <DeliveryEstimate>
            <Clock size={20} />
            <div>
              <EstimateTitle>Estimated Delivery</EstimateTitle>
              <EstimateTime>{estimatedTime}</EstimateTime>
            </div>
          </DeliveryEstimate>
        </DriverCard>

        {/* Map Section */}
        <MapCard>
          <CardHeader>
            <h2>Live Tracking</h2>
            <MapLegend>
              <LegendItem>
                <LegendDot color="var(--primary-color)" />
                <span>Driver</span>
              </LegendItem>
              <LegendItem>
                <LegendDot color="var(--success-color)" />
                <span>Destination</span>
              </LegendItem>
            </MapLegend>
          </CardHeader>
          
          <MapWrapper>
            <MapContainer
              center={driverLocation}
              zoom={15}
              style={{ height: '400px', width: '100%', borderRadius: 'var(--radius)' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={driverLocation}>
                <Popup>
                  Your driver: {driverInfo.name}<br />
                  Vehicle: {driverInfo.vehicle}<br />
                  ETA: {estimatedTime}
                </Popup>
              </Marker>
              <Marker position={[40.7128, -74.0060]}>
                <Popup>
                  Delivery Location<br />
                  {order.deliveryInfo.address}
                </Popup>
              </Marker>
            </MapContainer>
          </MapWrapper>
        </MapCard>

        {/* Order Details */}
        <DetailsGrid>
          <DetailsCard>
            <CardHeader>
              <h3>Delivery Details</h3>
            </CardHeader>
            <DetailsList>
              <DetailItem>
                <DetailIcon>
                  <MapPin size={20} />
                </DetailIcon>
                <DetailContent>
                  <DetailLabel>Address</DetailLabel>
                  <DetailValue>{order.deliveryInfo.address}</DetailValue>
                </DetailContent>
              </DetailItem>
              <DetailItem>
                <DetailIcon>
                  <User size={20} />
                </DetailIcon>
                <DetailContent>
                  <DetailLabel>Recipient</DetailLabel>
                  <DetailValue>{order.deliveryInfo.name}</DetailValue>
                </DetailContent>
              </DetailItem>
              <DetailItem>
                <DetailIcon>
                  <Phone size={20} />
                </DetailIcon>
                <DetailContent>
                  <DetailLabel>Contact</DetailLabel>
                  <DetailValue>{order.deliveryInfo.phone}</DetailValue>
                </DetailContent>
              </DetailItem>
              {order.deliveryInfo.instructions && (
                <DetailItem>
                  <DetailIcon>
                    <AlertCircle size={20} />
                  </DetailIcon>
                  <DetailContent>
                    <DetailLabel>Instructions</DetailLabel>
                    <DetailValue>{order.deliveryInfo.instructions}</DetailValue>
                  </DetailContent>
                </DetailItem>
              )}
            </DetailsList>
          </DetailsCard>

          <DetailsCard>
            <CardHeader>
              <h3>Order Summary</h3>
            </CardHeader>
            <OrderSummary>
              <SummaryItem>
                <span>Restaurant</span>
                <span>{order.restaurant.name}</span>
              </SummaryItem>
              <SummaryItem>
                <span>Items</span>
                <span>{order.items.length}</span>
              </SummaryItem>
              <SummaryItem>
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </SummaryItem>
              <SummaryItem>
                <span>Delivery Fee</span>
                <span>{order.deliveryFee === 0 ? 'Free' : `$${order.deliveryFee.toFixed(2)}`}</span>
              </SummaryItem>
              <SummaryItem total>
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </SummaryItem>
            </OrderSummary>
          </DetailsCard>
        </DetailsGrid>

        {/* Support Section */}
        <SupportCard>
          <SupportHeader>
            <h3>Need Help?</h3>
            <p>Our support team is here to help you</p>
          </SupportHeader>
          <SupportActions>
            <SupportButton href="tel:+15551234567">
              <Phone size={20} />
              Call Support
            </SupportButton>
            <SupportButton href="mailto:support@foodorder.com">
              <MessageCircle size={20} />
              Email Support
            </SupportButton>
            <SupportButton as={Link} to={`/order-success/${order.id}`}>
              <CheckCircle size={20} />
              View Order Details
            </SupportButton>
          </SupportActions>
        </SupportCard>

        {/* Tips Section */}
        <TipsCard>
          <h3>Delivery Tips</h3>
          <TipsList>
            <Tip>
              <CheckCircle size={16} color="var(--success-color)" />
              <span>Keep your phone nearby for driver updates</span>
            </Tip>
            <Tip>
              <CheckCircle size={16} color="var(--success-color)" />
              <span>Have payment ready if paying by cash</span>
            </Tip>
            <Tip>
              <CheckCircle size={16} color="var(--success-color)" />
              <span>Provide clear delivery instructions</span>
            </Tip>
            <Tip>
              <CheckCircle size={16} color="var(--success-color)" />
              <span>Rate your experience after delivery</span>
            </Tip>
          </TipsList>
        </TipsCard>
      </TrackerContent>
    </TrackerContainer>
  );
};

const TrackerContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  background: #f8f9fa;
`;

const TrackerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: var(--gray-color);
  font-size: 16px;
  cursor: pointer;
  padding: 10px 0;
  
  &:hover {
    color: var(--primary-color);
  }
`;

const HeaderContent = styled.div`
  text-align: center;
  
  h1 {
    margin-bottom: 5px;
  }
`;

const OrderNumber = styled.div`
  color: var(--gray-color);
  font-size: 1.1rem;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  color: var(--dark-color);
  border: 2px solid var(--light-gray);
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--light-gray);
  }
`;

const TrackerContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 25px;
`;

const StatusCard = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  h2 {
    margin: 0;
    font-size: 1.3rem;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
`;

const TimeRemaining = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--light-gray);
  border-radius: 20px;
  font-weight: 500;
  font-size: 14px;
`;

const Timeline = styled.div`
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 40px;
    left: 20px;
    bottom: 40px;
    width: 2px;
    background: var(--light-gray);
    z-index: 1;
  }
`;

const TimelineStep = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 30px;
  position: relative;
  z-index: 2;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const StepIndicator = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.active ? 'var(--primary-color)' : 'white'};
  border: 2px solid ${props => props.active ? 'var(--primary-color)' : 'var(--light-gray)'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  
  ${props => props.current && `
    box-shadow: 0 0 0 5px rgba(255, 107, 53, 0.2);
  `}
  
  .step-number {
    color: var(--gray-color);
    font-weight: 600;
  }
`;

const StepContent = styled.div`
  flex: 1;
  padding-top: 8px;
`;

const StepTitle = styled.div`
  font-weight: 600;
  margin-bottom: 5px;
`;

const StepDescription = styled.div`
  color: var(--gray-color);
  font-size: 14px;
  margin-bottom: 5px;
`;

const StepStatus = styled.div`
  display: inline-block;
  padding: 4px 12px;
  background: rgba(255, 107, 53, 0.1);
  color: var(--primary-color);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const StepTime = styled.div`
  color: var(--gray-color);
  font-size: 12px;
  margin-top: 5px;
`;

const DriverCard = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow);
`;

const DriverStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(78, 205, 196, 0.1);
  color: var(--accent-color);
  border-radius: 20px;
  font-weight: 500;
  font-size: 14px;
`;

const DriverInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 25px;
  padding-bottom: 25px;
  border-bottom: 1px solid var(--light-gray);
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const DriverAvatar = styled.div`
  width: 80px;
  height: 80px;
  background: var(--light-gray);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  font-size: 2rem;
`;

const DriverDetails = styled.div`
  flex: 1;
`;

const DriverName = styled.div`
  font-weight: 600;
  font-size: 1.2rem;
  margin-bottom: 8px;
`;

const DriverMeta = styled.div`
  display: flex;
  gap: 10px;
  color: var(--gray-color);
  font-size: 14px;
`;

const DriverActions = styled.div`
  display: flex;
  gap: 10px;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const DriverButton = styled.button`
  padding: 10px 20px;
  background: ${props => props.secondary ? 'transparent' : 'var(--primary-color)'};
  color: ${props => props.secondary ? 'var(--primary-color)' : 'white'};
  border: ${props => props.secondary ? '2px solid var(--primary-color)' : 'none'};
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.secondary ? 'rgba(255, 107, 53, 0.1)' : '#E55A2E'};
  }
`;

const DeliveryEstimate = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  
  svg {
    color: var(--primary-color);
  }
`;

const EstimateTitle = styled.div`
  font-weight: 500;
  margin-bottom: 5px;
`;

const EstimateTime = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary-color);
`;

const MapCard = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow);
`;

const MapLegend = styled.div`
  display: flex;
  gap: 20px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--gray-color);
`;

const LegendDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.color};
`;

const MapWrapper = styled.div`
  border-radius: var(--radius);
  overflow: hidden;
  
  .leaflet-container {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DetailsCard = styled.div`
  background: white;
  border-radius: var(--radius);
  padding: 25px;
  box-shadow: var(--shadow);
`;

const DetailsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 15px;
`;

const DetailIcon = styled.div`
  width: 40px;
  height: 40px;
  background: var(--light-gray);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  flex-shrink: 0;
`;

const DetailContent = styled.div`
  flex: 1;
`;

const DetailLabel = styled.div`
  font-size: 14px;
  color: var(--gray-color);
  margin-bottom: 5px;
`;

const DetailValue = styled.div`
  font-weight: 500;
  line-height: 1.4;
`;

const OrderSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${props => props.total ? '15px 0' : '8px 0'};
  border-top: ${props => props.total ? '2px solid var(--dark-color)' : 'none'};
  font-weight: ${props => props.total ? '600' : '400'};
  font-size: ${props => props.total ? '1.1rem' : '1rem'};
  
  &:not(:last-child) {
    border-bottom: 1px solid var(--light-gray);
  }
`;

const SupportCard = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 40px 30px;
  box-shadow: var(--shadow);
  text-align: center;
`;

const SupportHeader = styled.div`
  margin-bottom: 30px;
  
  h3 {
    margin-bottom: 10px;
  }
  
  p {
    color: var(--gray-color);
  }
`;

const SupportActions = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--primary-color);
    color: white;
  }
`;

const TipsCard = styled.div`
  background: white;
  border-radius: var(--radius);
  padding: 25px;
  box-shadow: var(--shadow);
  
  h3 {
    margin-bottom: 20px;
  }
`;

const TipsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Tip = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  
  span {
    flex: 1;
    line-height: 1.5;
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

export default OrderTracker;