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
            {/* FIXED: Changed </chefInfo> to </ChefRestaurant> */}
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

// ... rest of the styled components remain the same ...