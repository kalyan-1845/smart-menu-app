import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  ChefHat,
  Clock,
  CheckCircle,
  AlertCircle,
  Bell,
  Filter,
  Search,
  RefreshCw,
  LogOut,
  TrendingUp,
  Package,
  Timer,
  Flame,
  Star,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';

const ChefDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    pendingOrders: 0,
    completedToday: 0,
    avgPrepTime: 0,
    rating: 0
  });
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [chefInfo, setChefInfo] = useState(null);

  useEffect(() => {
    // Check if user is logged in as chef
    const chefId = localStorage.getItem('chef_id');
    if (!chefId) {
      toast.error('Please login as chef');
      navigate('/login');
      return;
    }

    // Load chef info
    const mockChefInfo = {
      id: chefId,
      name: 'Chef John',
      restaurant: 'Spice Heaven',
      specialty: 'Indian Cuisine',
      experience: '8 years',
      rating: 4.8,
      image: null
    };

    const mockOrders = [
      { 
        id: 'ORD001', 
        customer: 'John Doe', 
        items: [
          { name: 'Butter Chicken', quantity: 2, specialInstructions: 'Extra spicy' },
          { name: 'Garlic Naan', quantity: 3 },
          { name: 'Mango Lassi', quantity: 1 }
        ], 
        status: 'pending', 
        time: '10:30 AM',
        prepTime: 20,
        table: 'Table 5',
        type: 'dine-in'
      },
      { 
        id: 'ORD002', 
        customer: 'Jane Smith', 
        items: [
          { name: 'Paneer Tikka', quantity: 1 },
          { name: 'Vegetable Biryani', quantity: 1, specialInstructions: 'No onions' }
        ], 
        status: 'preparing', 
        time: '10:45 AM',
        prepTime: 15,
        table: 'Delivery',
        type: 'delivery'
      },
      { 
        id: 'ORD003', 
        customer: 'Bob Johnson', 
        items: [
          { name: 'Chicken Tikka Masala', quantity: 2 },
          { name: 'Butter Naan', quantity: 4 },
          { name: 'Raita', quantity: 2 }
        ], 
        status: 'pending', 
        time: '11:00 AM',
        prepTime: 25,
        table: 'Table 2',
        type: 'dine-in'
      },
      { 
        id: 'ORD004', 
        customer: 'Alice Brown', 
        items: [
          { name: 'Samosa', quantity: 6 },
          { name: 'Chai', quantity: 2 }
        ], 
        status: 'ready', 
        time: '09:15 AM',
        prepTime: 10,
        table: 'Takeaway',
        type: 'takeaway'
      },
      { 
        id: 'ORD005', 
        customer: 'Charlie Wilson', 
        items: [
          { name: 'Lamb Rogan Josh', quantity: 1 },
          { name: 'Kashmiri Naan', quantity: 2 }
        ], 
        status: 'completed', 
        time: '09:45 AM',
        prepTime: 30,
        table: 'Table 8',
        type: 'dine-in'
      }
    ];

    const mockStats = {
      pendingOrders: 3,
      completedToday: 12,
      avgPrepTime: 18,
      rating: 4.8,
      efficiency: 92,
      specialRequests: 4
    };

    setChefInfo(mockChefInfo);
    setOrders(mockOrders);
    setStats(mockStats);
  }, [navigate]);

  const filteredOrders = orders.filter(order => {
    const matchesStatus = activeTab === 'all' || order.status === activeTab;
    const matchesSearch = searchTerm === '' || 
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleOrderAction = (orderId, action) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        let newStatus = order.status;
        switch(action) {
          case 'start':
            newStatus = 'preparing';
            toast.success(`Started preparing order ${orderId}`);
            break;
          case 'complete':
            newStatus = 'ready';
            toast.success(`Order ${orderId} marked as ready`);
            break;
          case 'deliver':
            newStatus = 'completed';
            toast.success(`Order ${orderId} completed`);
            break;
          case 'delay':
            toast.error(`Order ${orderId} delayed - notified customer`);
            break;
        }
        return { ...order, status: newStatus };
      }
      return order;
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('chef_id');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getOrderTotalItems = (order) => {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'var(--warning-color)';
      case 'preparing': return 'var(--accent-color)';
      case 'ready': return 'var(--success-color)';
      case 'completed': return 'var(--dark-color)';
      default: return 'var(--gray-color)';
    }
  };

  return (
    <ChefContainer>
      {/* Sidebar */}
      <Sidebar>
        <ChefProfile>
          <ChefAvatar>
            {chefInfo?.image ? (
              <img src={chefInfo.image} alt={chefInfo.name} />
            ) : (
              <ChefHat size={32} />
            )}
          </ChefAvatar>
          <ChefDetails>
            <ChefName>{chefInfo?.name}</ChefName>
            <ChefRestaurant>{chefInfo?.restaurant}</ChefRestaurant>
            <ChefSpecialty>{chefInfo?.specialty}</ChefSpecialty>
          </ChefDetails>
          <ChefRating>
            <Star size={16} fill="var(--warning-color)" color="var(--warning-color)" />
            <span>{chefInfo?.rating}</span>
          </ChefRating>
        </ChefProfile>
        
        <NavMenu>
          <NavItem active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>
            <Clock size={20} />
            <span>Pending ({stats.pendingOrders})</span>
          </NavItem>
          <NavItem active={activeTab === 'preparing'} onClick={() => setActiveTab('preparing')}>
            <Flame size={20} />
            <span>Preparing</span>
          </NavItem>
          <NavItem active={activeTab === 'ready'} onClick={() => setActiveTab('ready')}>
            <CheckCircle size={20} />
            <span>Ready</span>
          </NavItem>
          <NavItem active={activeTab === 'all'} onClick={() => setActiveTab('all')}>
            <Package size={20} />
            <span>All Orders</span>
          </NavItem>
        </NavMenu>
        
        <StatsSidebar>
          <StatItem>
            <StatIcon>
              <Timer size={16} />
            </StatIcon>
            <div>
              <StatValue>{stats.avgPrepTime} min</StatValue>
              <StatLabel>Avg. Prep Time</StatLabel>
            </div>
          </StatItem>
          <StatItem>
            <StatIcon>
              <TrendingUp size={16} />
            </StatIcon>
            <div>
              <StatValue>{stats.efficiency}%</StatValue>
              <StatLabel>Efficiency</StatLabel>
            </div>
          </StatItem>
          <StatItem>
            <StatIcon>
              <AlertCircle size={16} />
            </StatIcon>
            <div>
              <StatValue>{stats.specialRequests}</StatValue>
              <StatLabel>Special Requests</StatLabel>
            </div>
          </StatItem>
        </StatsSidebar>
        
        <SidebarFooter>
          <LogoutButton onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </LogoutButton>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <MainContent>
        <Header>
          <HeaderTitle>
            <h1>Chef Dashboard</h1>
            <HeaderSubtitle>Manage kitchen orders and preparation</HeaderSubtitle>
          </HeaderTitle>
          
          <HeaderActions>
            <SearchBox>
              <Search size={20} />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchBox>
            <NotificationButton>
              <Bell size={20} />
              <NotificationDot />
            </NotificationButton>
            <RefreshButton>
              <RefreshCw size={20} />
            </RefreshButton>
          </HeaderActions>
        </Header>

        <ContentArea>
          {/* Stats Overview */}
          <StatsOverview>
            <StatCard>
              <StatCardIcon bgColor="rgba(255, 214, 102, 0.2)">
                <Clock size={24} color="var(--warning-color)" />
              </StatCardIcon>
              <div>
                <StatCardValue>{stats.pendingOrders}</StatCardValue>
                <StatCardLabel>Pending Orders</StatCardLabel>
              </div>
            </StatCard>
            
            <StatCard>
              <StatCardIcon bgColor="rgba(6, 214, 160, 0.2)">
                <CheckCircle size={24} color="var(--success-color)" />
              </StatCardIcon>
              <div>
                <StatCardValue>{stats.completedToday}</StatCardValue>
                <StatCardLabel>Completed Today</StatCardLabel>
              </div>
            </StatCard>
            
            <StatCard>
              <StatCardIcon bgColor="rgba(78, 205, 196, 0.2)">
                <Timer size={24} color="var(--accent-color)" />
              </StatCardIcon>
              <div>
                <StatCardValue>{stats.avgPrepTime}m</StatCardValue>
                <StatCardLabel>Avg. Prep Time</StatCardLabel>
              </div>
            </StatCard>
            
            <StatCard>
              <StatCardIcon bgColor="rgba(255, 107, 53, 0.2)">
                <Star size={24} color="var(--primary-color)" />
              </StatCardIcon>
              <div>
                <StatCardValue>{stats.rating}/5</StatCardValue>
                <StatCardLabel>Chef Rating</StatCardLabel>
              </div>
            </StatCard>
          </StatsOverview>

          {/* Orders Section */}
          <OrdersSection>
            <SectionHeader>
              <h2>Kitchen Orders</h2>
              <OrderFilter>
                <FilterButton active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>
                  Pending
                </FilterButton>
                <FilterButton active={activeTab === 'preparing'} onClick={() => setActiveTab('preparing')}>
                  Preparing
                </FilterButton>
                <FilterButton active={activeTab === 'ready'} onClick={() => setActiveTab('ready')}>
                  Ready
                </FilterButton>
                <FilterButton active={activeTab === 'all'} onClick={() => setActiveTab('all')}>
                  All
                </FilterButton>
              </OrderFilter>
            </SectionHeader>

            {filteredOrders.length === 0 ? (
              <EmptyState>
                <Package size={48} color="var(--light-gray)" />
                <h3>No orders found</h3>
                <p>There are no {activeTab === 'all' ? '' : activeTab} orders at the moment</p>
              </EmptyState>
            ) : (
              <OrdersGrid>
                {filteredOrders.map(order => (
                  <OrderCard key={order.id} status={order.status}>
                    <OrderHeader>
                      <OrderId>{order.id}</OrderId>
                      <OrderTime>{order.time}</OrderTime>
                    </OrderHeader>
                    
                    <OrderCustomer>
                      <User size={16} />
                      <span>{order.customer}</span>
                      <OrderType type={order.type}>
                        {order.type}
                      </OrderType>
                      {order.table && (
                        <TableNumber>{order.table}</TableNumber>
                      )}
                    </OrderCustomer>
                    
                    <OrderItems>
                      <h4>Items ({getOrderTotalItems(order)})</h4>
                      {order.items.map((item, index) => (
                        <OrderItem key={index}>
                          <ItemQuantity>{item.quantity}x</ItemQuantity>
                          <ItemName>{item.name}</ItemName>
                          {item.specialInstructions && (
                            <ItemInstructions>
                              <AlertCircle size={12} />
                              <span>{item.specialInstructions}</span>
                            </ItemInstructions>
                          )}
                        </OrderItem>
                      ))}
                    </OrderItems>
                    
                    <OrderFooter>
                      <PrepTime>
                        <Timer size={16} />
                        <span>{order.prepTime} min</span>
                      </PrepTime>
                      
                      <OrderActions>
                        {order.status === 'pending' && (
                          <ActionButton primary onClick={() => handleOrderAction(order.id, 'start')}>
                            <Flame size={16} />
                            Start Prep
                          </ActionButton>
                        )}
                        {order.status === 'preparing' && (
                          <ActionButton success onClick={() => handleOrderAction(order.id, 'complete')}>
                            <CheckCircle size={16} />
                            Mark Ready
                          </ActionButton>
                        )}
                        {order.status === 'ready' && (
                          <ActionButton onClick={() => handleOrderAction(order.id, 'deliver')}>
                            <Package size={16} />
                            Delivered
                          </ActionButton>
                        )}
                        <ActionButton secondary onClick={() => handleOrderAction(order.id, 'delay')}>
                          <AlertCircle size={16} />
                          Delay
                        </ActionButton>
                      </OrderActions>
                    </OrderFooter>
                  </OrderCard>
                ))}
              </OrdersGrid>
            )}
          </OrdersSection>

          {/* Special Requests */}
          <SpecialRequests>
            <SectionHeader>
              <h2>Special Requests ({stats.specialRequests})</h2>
            </SectionHeader>
            <RequestsList>
              {orders
                .filter(order => order.items.some(item => item.specialInstructions))
                .map(order => (
                  <RequestCard key={order.id}>
                    <RequestHeader>
                      <strong>{order.id}</strong>
                      <span>{order.customer}</span>
                    </RequestHeader>
                    <RequestItems>
                      {order.items
                        .filter(item => item.specialInstructions)
                        .map((item, index) => (
                          <RequestItem key={index}>
                            <span>{item.quantity}x {item.name}</span>
                            <RequestText>{item.specialInstructions}</RequestText>
                          </RequestItem>
                        ))}
                    </RequestItems>
                  </RequestCard>
                ))}
            </RequestsList>
          </SpecialRequests>
        </ContentArea>

        {/* Kitchen Status Footer */}
        <KitchenStatus>
          <StatusItem>
            <StatusIndicator color="var(--warning-color)" />
            <span>Pending: {stats.pendingOrders}</span>
          </StatusItem>
          <StatusItem>
            <StatusIndicator color="var(--accent-color)" />
            <span>Preparing: {orders.filter(o => o.status === 'preparing').length}</span>
          </StatusItem>
          <StatusItem>
            <StatusIndicator color="var(--success-color)" />
            <span>Ready: {orders.filter(o => o.status === 'ready').length}</span>
          </StatusItem>
          <StatusItem>
            <StatusIndicator color="var(--dark-color)" />
            <span>Completed: {orders.filter(o => o.status === 'completed').length}</span>
          </StatusItem>
        </KitchenStatus>
      </MainContent>
    </ChefContainer>
  );
};

// ==================== STYLED COMPONENTS ====================

const ChefContainer = styled.div`
  min-height: 100vh;
  display: flex;
  background: #f8f9fa;
`;

const Sidebar = styled.div`
  width: 280px;
  background: white;
  display: flex;
  flex-direction: column;
  padding: 25px;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
`;

const ChefProfile = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 25px;
  border-bottom: 1px solid var(--light-gray);
`;

const ChefAvatar = styled.div`
  width: 80px;
  height: 80px;
  background: var(--light-gray);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  color: var(--primary-color);
  
  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
`;

const ChefDetails = styled.div`
  margin-bottom: 15px;
`;

const ChefName = styled.div`
  font-weight: 600;
  font-size: 1.2rem;
  margin-bottom: 5px;
`;

const ChefRestaurant = styled.div`
  color: var(--primary-color);
  font-weight: 500;
  margin-bottom: 5px;
`;

const ChefSpecialty = styled.div`
  color: var(--gray-color);
  font-size: 14px;
`;

const ChefRating = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: rgba(255, 214, 102, 0.2);
  color: var(--warning-color);
  border-radius: 20px;
  font-weight: 600;
`;

const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 30px;
`;

const NavItem = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.active ? 'rgba(255, 107, 53, 0.1)' : 'transparent'};
  color: ${props => props.active ? 'var(--primary-color)' : 'var(--dark-color)'};
  
  &:hover {
    background: rgba(255, 107, 53, 0.1);
  }
  
  svg {
    stroke-width: ${props => props.active ? 2.5 : 2};
  }
`;

const StatsSidebar = styled.div`
  background: var(--light-gray);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 30px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
`;

const StatIcon = styled.div`
  width: 36px;
  height: 36px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
`;

const StatValue = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 2px;
`;

const StatLabel = styled.div`
  color: var(--gray-color);
  font-size: 12px;
`;

const SidebarFooter = styled.div``;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 15px;
  background: transparent;
  color: var(--danger-color);
  border: 2px solid var(--danger-color);
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--danger-color);
    color: white;
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  background: white;
  padding: 20px 30px;
  border-bottom: 1px solid var(--light-gray);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderTitle = styled.div`
  h1 {
    margin: 0 0 5px 0;
    font-size: 1.5rem;
  }
`;

const HeaderSubtitle = styled.div`
  color: var(--gray-color);
  font-size: 14px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
`;

const SearchBox = styled.div`
  position: relative;
  
  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--gray-color);
  }
  
  input {
    padding: 10px 12px 10px 40px;
    border: 2px solid var(--light-gray);
    border-radius: var(--radius);
    font-size: 14px;
    min-width: 250px;
    
    &:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  }
`;

const NotificationButton = styled.button`
  position: relative;
  width: 40px;
  height: 40px;
  background: var(--light-gray);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background: #dde0e3;
  }
`;

const NotificationDot = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: var(--primary-color);
  border-radius: 50%;
`;

const RefreshButton = styled.button`
  width: 40px;
  height: 40px;
  background: var(--light-gray);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background: #dde0e3;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 30px;
  overflow-y: auto;
`;

const StatsOverview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: var(--shadow);
`;

const StatCardIcon = styled.div`
  width: 60px;
  height: 60px;
  background: ${props => props.bgColor};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatCardValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 5px;
`;

const StatCardLabel = styled.div`
  color: var(--gray-color);
  font-size: 14px;
`;

const OrdersSection = styled.div`
  background: white;
  border-radius: var(--radius);
  padding: 25px;
  box-shadow: var(--shadow);
  margin-bottom: 30px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  
  h2 {
    margin: 0;
    font-size: 1.3rem;
  }
`;

const OrderFilter = styled.div`
  display: flex;
  gap: 10px;
`;

const FilterButton = styled.button`
  padding: 8px 16px;
  background: ${props => props.active ? 'var(--primary-color)' : 'var(--light-gray)'};
  color: ${props => props.active ? 'white' : 'var(--dark-color)'};
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: ${props => props.active ? '#E55A2E' : '#dde0e3'};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  
  svg {
    margin-bottom: 20px;
    color: var(--light-gray);
  }
  
  h3 {
    margin-bottom: 10px;
    color: var(--gray-color);
  }
  
  p {
    color: var(--gray-color);
  }
`;

const OrdersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
`;

const OrderCard = styled.div`
  border: 2px solid ${props => {
    switch(props.status) {
      case 'pending': return 'rgba(255, 214, 102, 0.5)';
      case 'preparing': return 'rgba(78, 205, 196, 0.5)';
      case 'ready': return 'rgba(6, 214, 160, 0.5)';
      case 'completed': return 'rgba(41, 47, 54, 0.1)';
      default: return 'var(--light-gray)';
    }
  }};
  border-radius: var(--radius);
  padding: 20px;
  background: white;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--light-gray);
`;

const OrderId = styled.div`
  font-family: monospace;
  font-weight: 600;
  color: var(--primary-color);
  font-size: 1.1rem;
`;

const OrderTime = styled.div`
  color: var(--gray-color);
  font-size: 14px;
`;

const OrderCustomer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  
  svg {
    color: var(--gray-color);
  }
`;

const OrderType = styled.span`
  padding: 4px 12px;
  background: ${props => props.type === 'dine-in' ? 'rgba(255, 107, 53, 0.2)' : 
    props.type === 'delivery' ? 'rgba(6, 214, 160, 0.2)' : 'rgba(255, 166, 0, 0.2)'};
  color: ${props => props.type === 'dine-in' ? 'var(--primary-color)' : 
    props.type === 'delivery' ? 'var(--success-color)' : 'var(--secondary-color)'};
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const TableNumber = styled.span`
  padding: 4px 12px;
  background: var(--light-gray);
  color: var(--dark-color);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const OrderItems = styled.div`
  margin-bottom: 20px;
  
  h4 {
    margin: 0 0 15px 0;
    font-size: 14px;
    color: var(--dark-color);
  }
`;

const OrderItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px dashed var(--light-gray);
  
  &:last-child {
    border-bottom: none;
  }
`;

const ItemQuantity = styled.span`
  font-weight: 600;
  color: var(--primary-color);
  min-width: 25px;
`;

const ItemName = styled.span`
  flex: 1;
`;

const ItemInstructions = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--warning-color);
  
  svg {
    flex-shrink: 0;
  }
`;

const OrderFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid var(--light-gray);
`;

const PrepTime = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--gray-color);
  font-weight: 500;
`;

const OrderActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  background: ${props => {
    if (props.primary) return 'var(--primary-color)';
    if (props.success) return 'var(--success-color)';
    if (props.secondary) return 'transparent';
    return 'var(--light-gray)';
  }};
  color: ${props => {
    if (props.primary || props.success) return 'white';
    if (props.secondary) return 'var(--dark-color)';
    return 'var(--dark-color)';
  }};
  border: ${props => props.secondary ? '1px solid var(--light-gray)' : 'none'};
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  
  &:hover {
    background: ${props => {
      if (props.primary) return '#E55A2E';
      if (props.success) return '#05C48F';
      if (props.secondary) return 'var(--light-gray)';
      return '#dde0e3';
    }};
  }
`;

const SpecialRequests = styled.div`
  background: white;
  border-radius: var(--radius);
  padding: 25px;
  box-shadow: var(--shadow);
`;

const RequestsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const RequestCard = styled.div`
  border: 1px solid var(--light-gray);
  border-radius: var(--radius);
  padding: 15px;
`;

const RequestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--light-gray);
  
  strong {
    color: var(--primary-color);
  }
  
  span {
    color: var(--gray-color);
    font-size: 14px;
  }
`;

const RequestItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const RequestItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  
  span:first-child {
    font-weight: 500;
  }
`;

const RequestText = styled.div`
  padding: 8px;
  background: rgba(255, 214, 102, 0.1);
  border-left: 3px solid var(--warning-color);
  border-radius: 4px;
  font-size: 14px;
  color: var(--dark-color);
`;

const KitchenStatus = styled.div`
  background: white;
  padding: 15px 30px;
  border-top: 1px solid var(--light-gray);
  display: flex;
  justify-content: space-around;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  
  span {
    font-weight: 500;
    color: var(--dark-color);
  }
`;

const StatusIndicator = styled.div`
  width: 12px;
  height: 12px;
  background: ${props => props.color};
  border-radius: 50%;
`;

export default ChefDashboard;