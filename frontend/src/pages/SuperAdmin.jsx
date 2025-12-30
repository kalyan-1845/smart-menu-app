import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  Building,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Settings,
  Filter,
  Search,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  Bell,
  LogOut,
  Shield,
  BarChart3,
  Package,
  Plus,
  CheckCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const SuperAdmin = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    activeRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingApprovals: 0
  });
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');

  useEffect(() => {
    // Check if user is super admin
    const isSuperAdmin = localStorage.getItem('super_admin');
    if (!isSuperAdmin) {
      toast.error('Unauthorized access');
      navigate('/super-login');
      return;
    }

    // Load super admin data
    const mockStats = {
      totalRestaurants: 48,
      activeRestaurants: 42,
      totalOrders: 12456,
      totalRevenue: 245689.50,
      pendingApprovals: 6,
      activeUsers: 1254,
      todayOrders: 245,
      todayRevenue: 5689.25
    };

    const mockRestaurants = [
      { id: 'RST001', name: 'Spice Heaven', owner: 'John Doe', status: 'active', orders: 1245, revenue: 24560.89, rating: 4.5, joined: '2024-01-15' },
      { id: 'RST002', name: 'Pasta Paradise', owner: 'Jane Smith', status: 'active', orders: 892, revenue: 18945.75, rating: 4.7, joined: '2024-02-10' },
      { id: 'RST003', name: 'Sushi Zen', owner: 'Bob Johnson', status: 'pending', orders: 0, revenue: 0, rating: 0, joined: '2024-03-01' },
      { id: 'RST004', name: 'Burger Hub', owner: 'Alice Brown', status: 'active', orders: 1567, revenue: 32145.25, rating: 4.3, joined: '2024-01-20' },
      { id: 'RST005', name: 'Taco Fiesta', owner: 'Charlie Wilson', status: 'suspended', orders: 234, revenue: 5678.90, rating: 3.8, joined: '2024-02-15' },
      { id: 'RST006', name: 'Pizza Palace', owner: 'David Lee', status: 'active', orders: 2013, revenue: 45678.12, rating: 4.6, joined: '2024-01-05' }
    ];

    const mockUsers = [
      { id: 'USR001', name: 'Customer 1', email: 'customer1@email.com', orders: 45, spent: 1256.78, status: 'active', joined: '2024-01-10' },
      { id: 'USR002', name: 'Customer 2', email: 'customer2@email.com', orders: 23, spent: 789.45, status: 'active', joined: '2024-01-15' },
      { id: 'USR003', name: 'Customer 3', email: 'customer3@email.com', orders: 67, spent: 2345.67, status: 'inactive', joined: '2024-01-20' },
      { id: 'USR004', name: 'Customer 4', email: 'customer4@email.com', orders: 12, spent: 345.67, status: 'active', joined: '2024-02-01' },
      { id: 'USR005', name: 'Customer 5', email: 'customer5@email.com', orders: 89, spent: 4567.89, status: 'active', joined: '2024-01-25' },
      { id: 'USR006', name: 'Customer 6', email: 'customer6@email.com', orders: 34, spent: 1234.56, status: 'suspended', joined: '2024-02-10' }
    ];

    const mockOrders = [
      { id: 'ORD001', restaurant: 'Spice Heaven', customer: 'John Doe', amount: 45.99, status: 'completed', time: '10:30 AM', type: 'delivery' },
      { id: 'ORD002', restaurant: 'Pasta Paradise', customer: 'Jane Smith', amount: 28.50, status: 'completed', time: '10:45 AM', type: 'pickup' },
      { id: 'ORD003', restaurant: 'Burger Hub', customer: 'Bob Johnson', amount: 67.25, status: 'cancelled', time: '11:00 AM', type: 'delivery' },
      { id: 'ORD004', restaurant: 'Pizza Palace', customer: 'Alice Brown', amount: 89.99, status: 'completed', time: '11:30 AM', type: 'delivery' },
      { id: 'ORD005', restaurant: 'Sushi Zen', customer: 'Charlie Wilson', amount: 125.75, status: 'pending', time: '12:00 PM', type: 'pickup' },
      { id: 'ORD006', restaurant: 'Taco Fiesta', customer: 'David Lee', amount: 32.50, status: 'completed', time: '12:30 PM', type: 'delivery' }
    ];

    setStats(mockStats);
    setRestaurants(mockRestaurants);
    setUsers(mockUsers);
    setOrders(mockOrders);
  }, [navigate]);

  const revenueData = [
    { month: 'Jan', revenue: 45000, restaurants: 35 },
    { month: 'Feb', revenue: 52000, restaurants: 38 },
    { month: 'Mar', revenue: 61000, restaurants: 42 },
    { month: 'Apr', revenue: 58000, restaurants: 44 },
    { month: 'May', revenue: 72000, restaurants: 46 },
    { month: 'Jun', revenue: 69000, restaurants: 48 }
  ];

  const handleRestaurantAction = (restaurantId, action) => {
    switch(action) {
      case 'approve':
        toast.success(`Restaurant ${restaurantId} approved`);
        break;
      case 'suspend':
        toast.error(`Restaurant ${restaurantId} suspended`);
        break;
      case 'delete':
        toast.error(`Restaurant ${restaurantId} deleted`);
        break;
      case 'view':
        toast.success(`Viewing restaurant ${restaurantId}`);
        break;
    }
  };

  const handleUserAction = (userId, action) => {
    switch(action) {
      case 'suspend':
        toast.error(`User ${userId} suspended`);
        break;
      case 'activate':
        toast.success(`User ${userId} activated`);
        break;
      case 'delete':
        toast.error(`User ${userId} deleted`);
        break;
      case 'view':
        toast.success(`Viewing user ${userId}`);
        break;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('super_admin');
    toast.success('Logged out successfully');
    navigate('/super-login');
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <OverviewTab>
            {/* Stats Cards */}
            <StatsGrid>
              <StatCard>
                <StatIcon>
                  <Building size={24} />
                </StatIcon>
                <StatInfo>
                  <StatValue>{stats.totalRestaurants}</StatValue>
                  <StatLabel>Total Restaurants</StatLabel>
                  <StatTrend positive>
                    <TrendingUp size={16} />
                    <span>+{stats.activeRestaurants} active</span>
                  </StatTrend>
                </StatInfo>
              </StatCard>
              
              <StatCard>
                <StatIcon>
                  <Users size={24} />
                </StatIcon>
                <StatInfo>
                  <StatValue>{stats.activeUsers?.toLocaleString() || '1,254'}</StatValue>
                  <StatLabel>Active Users</StatLabel>
                  <StatTrend positive>
                    <TrendingUp size={16} />
                    <span>+5% this month</span>
                  </StatTrend>
                </StatInfo>
              </StatCard>
              
              <StatCard>
                <StatIcon>
                  <DollarSign size={24} />
                </StatIcon>
                <StatInfo>
                  <StatValue>${(stats.totalRevenue / 1000).toFixed(0)}K</StatValue>
                  <StatLabel>Total Revenue</StatLabel>
                  <StatTrend positive>
                    <TrendingUp size={16} />
                    <span>+12% growth</span>
                  </StatTrend>
                </StatInfo>
              </StatCard>
              
              <StatCard>
                <StatIcon>
                  <AlertCircle size={24} />
                </StatIcon>
                <StatInfo>
                  <StatValue>{stats.pendingApprovals}</StatValue>
                  <StatLabel>Pending Approvals</StatLabel>
                  <StatTrend negative>
                    <AlertCircle size={16} />
                    <span>Needs review</span>
                  </StatTrend>
                </StatInfo>
              </StatCard>
            </StatsGrid>

            {/* Revenue Chart */}
            <ChartCard>
              <ChartHeader>
                <h3>Platform Growth</h3>
                <TimeframeSelector>
                  <TimeframeButton 
                    active={selectedTimeframe === 'week'}
                    onClick={() => setSelectedTimeframe('week')}
                  >
                    Week
                  </TimeframeButton>
                  <TimeframeButton 
                    active={selectedTimeframe === 'month'}
                    onClick={() => setSelectedTimeframe('month')}
                  >
                    Month
                  </TimeframeButton>
                  <TimeframeButton 
                    active={selectedTimeframe === 'year'}
                    onClick={() => setSelectedTimeframe('year')}
                  >
                    Year
                  </TimeframeButton>
                </TimeframeSelector>
              </ChartHeader>
              <ChartContainer>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#FF6B35" strokeWidth={2} dot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="restaurants" name="Restaurants" stroke="#4ECDC4" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </ChartCard>

            {/* Pending Approvals */}
            <PendingApprovals>
              <SectionHeader>
                <h3>Pending Approvals ({stats.pendingApprovals})</h3>
                <ViewAllLink>View All</ViewAllLink>
              </SectionHeader>
              <ApprovalsGrid>
                {restaurants
                  .filter(r => r.status === 'pending')
                  .map(restaurant => (
                    <ApprovalCard key={restaurant.id}>
                      <RestaurantInfo>
                        <RestaurantAvatar>
                          <Building size={20} />
                        </RestaurantAvatar>
                        <div>
                          <RestaurantName>{restaurant.name}</RestaurantName>
                          <RestaurantOwner>{restaurant.owner}</RestaurantOwner>
                        </div>
                      </RestaurantInfo>
                      <ApprovalActions>
                        <ApproveButton onClick={() => handleRestaurantAction(restaurant.id, 'approve')}>
                          <CheckCircle size={16} />
                          Approve
                        </ApproveButton>
                        <RejectButton onClick={() => handleRestaurantAction(restaurant.id, 'delete')}>
                          <Trash2 size={16} />
                          Reject
                        </RejectButton>
                      </ApprovalActions>
                    </ApprovalCard>
                  ))}
              </ApprovalsGrid>
            </PendingApprovals>
          </OverviewTab>
        );
        
      case 'restaurants':
        return (
          <RestaurantsTab>
            <SectionHeader>
              <h2>Restaurant Management</h2>
              <ActionBar>
                <AddButton onClick={() => navigate('/setup-wizard')}>
                  <Plus size={20} />
                  Add Restaurant
                </AddButton>
                <SearchBox>
                  <Search size={20} />
                  <input type="text" placeholder="Search restaurants..." />
                </SearchBox>
                <FilterButton>
                  <Filter size={20} />
                  Filter
                </FilterButton>
              </ActionBar>
            </SectionHeader>
            
            <RestaurantsTable>
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                  <th>Rating</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map(restaurant => (
                  <tr key={restaurant.id}>
                    <td>
                      <RestaurantCell>
                        <Building size={16} />
                        <div>
                          <strong>{restaurant.name}</strong>
                          <span className="id">ID: {restaurant.id}</span>
                        </div>
                      </RestaurantCell>
                    </td>
                    <td>{restaurant.owner}</td>
                    <td>
                      <StatusBadge status={restaurant.status}>
                        {restaurant.status}
                      </StatusBadge>
                    </td>
                    <td>{restaurant.orders.toLocaleString()}</td>
                    <td>${restaurant.revenue.toLocaleString()}</td>
                    <td>
                      {restaurant.rating > 0 ? (
                        <Rating>
                          <span className="stars">★★★★★</span>
                          <span className="value">{restaurant.rating}</span>
                        </Rating>
                      ) : 'N/A'}
                    </td>
                    <td>{new Date(restaurant.joined).toLocaleDateString()}</td>
                    <td>
                      <ActionButtons>
                        <ActionButton onClick={() => handleRestaurantAction(restaurant.id, 'view')}>
                          <Eye size={16} />
                        </ActionButton>
                        {restaurant.status === 'pending' && (
                          <ActionButton success onClick={() => handleRestaurantAction(restaurant.id, 'approve')}>
                            <CheckCircle size={16} />
                          </ActionButton>
                        )}
                        {restaurant.status === 'active' && (
                          <ActionButton danger onClick={() => handleRestaurantAction(restaurant.id, 'suspend')}>
                            <AlertCircle size={16} />
                          </ActionButton>
                        )}
                        <ActionButton danger onClick={() => handleRestaurantAction(restaurant.id, 'delete')}>
                          <Trash2 size={16} />
                        </ActionButton>
                      </ActionButtons>
                    </td>
                  </tr>
                ))}
              </tbody>
            </RestaurantsTable>
          </RestaurantsTab>
        );
        
      case 'users':
        return (
          <UsersTab>
            <SectionHeader>
              <h2>User Management</h2>
              <ActionBar>
                <SearchBox>
                  <Search size={20} />
                  <input type="text" placeholder="Search users..." />
                </SearchBox>
                <FilterButton>
                  <Filter size={20} />
                  Filter
                </FilterButton>
                <DownloadButton>
                  <Download size={20} />
                  Export
                </DownloadButton>
              </ActionBar>
            </SectionHeader>
            
            <UsersTable>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <UserCell>
                        <UserAvatar>
                          {user.name.charAt(0)}
                        </UserAvatar>
                        <div>
                          <strong>{user.name}</strong>
                          <span className="id">ID: {user.id}</span>
                        </div>
                      </UserCell>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.orders}</td>
                    <td>${user.spent.toFixed(2)}</td>
                    <td>
                      <StatusBadge status={user.status}>
                        {user.status}
                      </StatusBadge>
                    </td>
                    <td>{new Date(user.joined).toLocaleDateString()}</td>
                    <td>
                      <ActionButtons>
                        <ActionButton onClick={() => handleUserAction(user.id, 'view')}>
                          <Eye size={16} />
                        </ActionButton>
                        {user.status === 'active' && (
                          <ActionButton danger onClick={() => handleUserAction(user.id, 'suspend')}>
                            <AlertCircle size={16} />
                          </ActionButton>
                        )}
                        {user.status === 'inactive' && (
                          <ActionButton success onClick={() => handleUserAction(user.id, 'activate')}>
                            <CheckCircle size={16} />
                          </ActionButton>
                        )}
                        <ActionButton danger onClick={() => handleUserAction(user.id, 'delete')}>
                          <Trash2 size={16} />
                        </ActionButton>
                      </ActionButtons>
                    </td>
                  </tr>
                ))}
              </tbody>
            </UsersTable>
          </UsersTab>
        );
        
      case 'orders':
        return (
          <OrdersTab>
            <SectionHeader>
              <h2>Platform Orders</h2>
              <ActionBar>
                <SearchBox>
                  <Search size={20} />
                  <input type="text" placeholder="Search orders..." />
                </SearchBox>
                <FilterButton>
                  <Filter size={20} />
                  Filter
                </FilterButton>
                <DownloadButton>
                  <Download size={20} />
                  Export
                </DownloadButton>
              </ActionBar>
            </SectionHeader>
            
            <OrdersTable>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Restaurant</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <OrderId>{order.id}</OrderId>
                    </td>
                    <td>{order.restaurant}</td>
                    <td>{order.customer}</td>
                    <td>${order.amount.toFixed(2)}</td>
                    <td>
                      <StatusBadge status={order.status}>
                        {order.status}
                      </StatusBadge>
                    </td>
                    <td>
                      <TypeBadge type={order.type}>
                        {order.type}
                      </TypeBadge>
                    </td>
                    <td>{order.time}</td>
                    <td>
                      <ActionButtons>
                        <ActionButton onClick={() => toast.success(`Viewing order ${order.id}`)}>
                          <Eye size={16} />
                        </ActionButton>
                        <ActionButton danger onClick={() => toast.error(`Order ${order.id} cancelled`)}>
                          <Trash2 size={16} />
                        </ActionButton>
                      </ActionButtons>
                    </td>
                  </tr>
                ))}
              </tbody>
            </OrdersTable>
          </OrdersTab>
        );
        
      default:
        return null;
    }
  };

  return (
    <SuperAdminContainer>
      {/* Sidebar */}
      <Sidebar>
        <AdminInfo>
          <Shield size={32} />
          <AdminDetails>
            <AdminName>Super Admin</AdminName>
            <AdminRole>Platform Administrator</AdminRole>
          </AdminDetails>
        </AdminInfo>
        
        <NavMenu>
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            <BarChart3 size={20} />
            <span>Overview</span>
          </NavItem>
          <NavItem active={activeTab === 'restaurants'} onClick={() => setActiveTab('restaurants')}>
            <Building size={20} />
            <span>Restaurants</span>
            {stats.pendingApprovals > 0 && (
              <NotificationBadge>{stats.pendingApprovals}</NotificationBadge>
            )}
          </NavItem>
          <NavItem active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
            <Users size={20} />
            <span>Users</span>
          </NavItem>
          <NavItem active={activeTab === 'orders'} onClick={() => setActiveTab('orders')}>
            <Package size={20} />
            <span>Orders</span>
          </NavItem>
          <NavItem>
            <Settings size={20} />
            <span>Settings</span>
          </NavItem>
          <NavItem onClick={() => navigate('/qr-generator')}>
            <Shield size={20} />
            <span>QR Generator</span>
          </NavItem>
        </NavMenu>
        
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
            <h1>Super Admin Dashboard</h1>
            <HeaderSubtitle>Manage restaurants, users, and platform settings</HeaderSubtitle>
          </HeaderTitle>
          
          <HeaderActions>
            <NotificationButton>
              <Bell size={20} />
              <NotificationDot />
            </NotificationButton>
            <RefreshButton>
              <RefreshCw size={20} />
            </RefreshButton>
            <TodayStats>
              <TodayStat>
                <span>Today's Orders</span>
                <strong>{stats.todayOrders}</strong>
              </TodayStat>
              <TodayStat>
                <span>Today's Revenue</span>
                <strong>${stats.todayRevenue?.toFixed(2) || '5,689.25'}</strong>
              </TodayStat>
            </TodayStats>
          </HeaderActions>
        </Header>

        <ContentArea>
          {renderTabContent()}
        </ContentArea>

        {/* Platform Stats Footer */}
        <FooterStats>
          <StatItem>
            <span>Total Revenue</span>
            <strong>${stats.totalRevenue.toLocaleString()}</strong>
          </StatItem>
          <StatItem>
            <span>Total Orders</span>
            <strong>{stats.totalOrders.toLocaleString()}</strong>
          </StatItem>
          <StatItem>
            <span>Avg. Order Value</span>
            <strong>${(stats.totalRevenue / stats.totalOrders).toFixed(2)}</strong>
          </StatItem>
          <StatItem>
            <span>Platform Fee</span>
            <strong>15%</strong>
          </StatItem>
        </FooterStats>
      </MainContent>
    </SuperAdminContainer>
  );
};

const SuperAdminContainer = styled.div`
  min-height: 100vh;
  display: flex;
  background: #f8f9fa;
`;

const Sidebar = styled.div`
  width: 250px;
  background: var(--dark-color);
  color: white;
  display: flex;
  flex-direction: column;
  padding: 30px 20px;
`;

const AdminInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 40px;
  
  svg {
    color: var(--accent-color);
  }
`;

const AdminDetails = styled.div`
  flex: 1;
`;

const AdminName = styled.div`
  font-weight: 600;
  margin-bottom: 5px;
  font-size: 1.1rem;
`;

const AdminRole = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
`;

const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
`;

const NavItem = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  span {
    flex: 1;
  }
`;

const NotificationBadge = styled.div`
  background: var(--primary-color);
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
`;

const SidebarFooter = styled.div`
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  background: rgba(239, 71, 111, 0.1);
  color: var(--danger-color);
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(239, 71, 111, 0.2);
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  background: white;
  padding: 25px 30px;
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
  gap: 20px;
  align-items: center;
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

const TodayStats = styled.div`
  display: flex;
  gap: 20px;
`;

const TodayStat = styled.div`
  text-align: right;
  
  span {
    display: block;
    color: var(--gray-color);
    font-size: 12px;
    margin-bottom: 2px;
  }
  
  strong {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--dark-color);
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 30px;
  overflow-y: auto;
`;

const OverviewTab = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: var(--radius);
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: var(--shadow);
`;

const StatIcon = styled.div`
  width: 60px;
  height: 60px;
  background: var(--light-gray);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  color: var(--gray-color);
  margin-bottom: 10px;
`;

const StatTrend = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: ${props => props.positive ? 'var(--success-color)' : props.negative ? 'var(--danger-color)' : 'var(--gray-color)'};
`;

const ChartCard = styled.div`
  background: white;
  border-radius: var(--radius);
  padding: 25px;
  box-shadow: var(--shadow);
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h3 {
    margin: 0;
    font-size: 1.1rem;
  }
`;

const TimeframeSelector = styled.div`
  display: flex;
  gap: 10px;
`;

const TimeframeButton = styled.button`
  padding: 6px 12px;
  background: ${props => props.active ? 'var(--primary-color)' : 'var(--light-gray)'};
  color: ${props => props.active ? 'white' : 'var(--dark-color)'};
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: ${props => props.active ? '#E55A2E' : '#dde0e3'};
  }
`;

const ChartContainer = styled.div`
  height: 300px;
`;

const PendingApprovals = styled.div`
  background: white;
  border-radius: var(--radius);
  padding: 25px;
  box-shadow: var(--shadow);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h3 {
    margin: 0;
    font-size: 1.1rem;
  }
`;

const ViewAllLink = styled.a`
  color: var(--primary-color);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ApprovalsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
`;

const ApprovalCard = styled.div`
  border: 1px solid var(--light-gray);
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const RestaurantInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const RestaurantAvatar = styled.div`
  width: 40px;
  height: 40px;
  background: var(--light-gray);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
`;

const RestaurantName = styled.div`
  font-weight: 500;
  margin-bottom: 5px;
`;

const RestaurantOwner = styled.div`
  font-size: 12px;
  color: var(--gray-color);
`;

const ApprovalActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ApproveButton = styled.button`
  padding: 8px 16px;
  background: var(--success-color);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    background: #05C48F;
  }
`;

const RejectButton = styled.button`
  padding: 8px 16px;
  background: transparent;
  color: var(--danger-color);
  border: 1px solid var(--danger-color);
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    background: var(--danger-color);
    color: white;
  }
`;

const RestaurantsTab = styled.div``;

const ActionBar = styled.div`
  display: flex;
  gap: 15px;
`;

const AddButton = styled.button`
  padding: 10px 20px;
  background: var(--success-color);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #05C48F;
  }
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
    min-width: 200px;
    
    &:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  }
`;

const FilterButton = styled.button`
  padding: 10px 20px;
  background: white;
  color: var(--dark-color);
  border: 2px solid var(--light-gray);
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: var(--light-gray);
  }
`;

const RestaurantsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 30px;
  
  th {
    text-align: left;
    padding: 12px 16px;
    border-bottom: 2px solid var(--light-gray);
    color: var(--gray-color);
    font-weight: 500;
    font-size: 14px;
  }
  
  td {
    padding: 16px;
    border-bottom: 1px solid var(--light-gray);
  }
  
  tbody tr:hover {
    background: #f8f9fa;
  }
`;

const RestaurantCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  svg {
    color: var(--primary-color);
  }
  
  .id {
    display: block;
    font-size: 12px;
    color: var(--gray-color);
    margin-top: 2px;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch(props.status) {
      case 'active': return 'rgba(6, 214, 160, 0.2)';
      case 'pending': return 'rgba(255, 214, 102, 0.2)';
      case 'suspended': return 'rgba(239, 71, 111, 0.2)';
      case 'inactive': return 'rgba(108, 117, 125, 0.2)';
      case 'completed': return 'rgba(6, 214, 160, 0.2)';
      case 'cancelled': return 'rgba(239, 71, 111, 0.2)';
      default: return 'var(--light-gray)';
    }
  }};
  color: ${props => {
    switch(props.status) {
      case 'active': return 'var(--success-color)';
      case 'pending': return 'var(--warning-color)';
      case 'suspended': return 'var(--danger-color)';
      case 'inactive': return 'var(--gray-color)';
      case 'completed': return 'var(--success-color)';
      case 'cancelled': return 'var(--danger-color)';
      default: return 'var(--gray-color)';
    }
  }};
`;

const Rating = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  
  .stars {
    color: var(--warning-color);
    letter-spacing: 1px;
  }
  
  .value {
    font-weight: 600;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  width: 32px;
  height: 32px;
  border: ${props => {
    if (props.danger) return '1px solid var(--danger-color)';
    if (props.success) return '1px solid var(--success-color)';
    return '1px solid var(--light-gray)';
  }};
  background: ${props => {
    if (props.danger) return 'transparent';
    if (props.success) return 'transparent';
    return 'white';
  }};
  color: ${props => {
    if (props.danger) return 'var(--danger-color)';
    if (props.success) return 'var(--success-color)';
    return 'var(--dark-color)';
  }};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background: ${props => {
      if (props.danger) return 'var(--danger-color)';
      if (props.success) return 'var(--success-color)';
      return 'var(--light-gray)';
    }};
    color: ${props => (props.danger || props.success) ? 'white' : 'var(--dark-color)'};
  }
`;

const UsersTab = styled.div``;

const DownloadButton = styled.button`
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #E55A2E;
  }
`;

const UsersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 30px;
  
  th {
    text-align: left;
    padding: 12px 16px;
    border-bottom: 2px solid var(--light-gray);
    color: var(--gray-color);
    font-weight: 500;
    font-size: 14px;
  }
  
  td {
    padding: 16px;
    border-bottom: 1px solid var(--light-gray);
  }
  
  tbody tr:hover {
    background: #f8f9fa;
  }
`;

const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
`;

const OrdersTab = styled.div``;

const OrdersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 30px;
  
  th {
    text-align: left;
    padding: 12px 16px;
    border-bottom: 2px solid var(--light-gray);
    color: var(--gray-color);
    font-weight: 500;
    font-size: 14px;
  }
  
  td {
    padding: 16px;
    border-bottom: 1px solid var(--light-gray);
  }
  
  tbody tr:hover {
    background: #f8f9fa;
  }
`;

const OrderId = styled.div`
  font-family: monospace;
  font-weight: 600;
  color: var(--primary-color);
`;

const TypeBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => props.type === 'delivery' ? 'rgba(255, 107, 53, 0.2)' : 'rgba(255, 166, 0, 0.2)'};
  color: ${props => props.type === 'delivery' ? 'var(--primary-color)' : 'var(--secondary-color)'};
`;

const FooterStats = styled.div`
  background: white;
  padding: 20px 30px;
  border-top: 1px solid var(--light-gray);
  display: flex;
  justify-content: space-between;
`;

const StatItem = styled.div`
  text-align: center;
  
  span {
    display: block;
    color: var(--gray-color);
    font-size: 14px;
    margin-bottom: 5px;
  }
  
  strong {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--dark-color);
  }
`;

export default SuperAdmin;