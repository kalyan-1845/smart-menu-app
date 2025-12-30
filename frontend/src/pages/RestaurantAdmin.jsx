import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  BarChart3,
  Users,
  Package,
  DollarSign,
  Clock,
  TrendingUp,
  AlertCircle,
  Settings,
  QrCode,
  Plus,
  Filter,
  Search,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  Bell,
  LogOut,
  Store
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const RestaurantAdmin = () => {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('today');

  useEffect(() => {
    // Check if user is logged in as owner
    const restaurantId = localStorage.getItem('restaurant_id');
    if (!restaurantId) {
      toast.error('Please login as restaurant owner');
      navigate('/owner-login');
      return;
    }

    // Load restaurant data
    const mockRestaurant = {
      id: restaurantId,
      name: 'Spice Heaven',
      address: '123 Main St, New York, NY',
      phone: '+1 (555) 123-4567',
      email: 'info@spiceheaven.com',
      cuisine: 'Indian',
      status: 'active',
      openingHours: '09:00 AM - 11:00 PM',
      rating: 4.5,
      totalOrders: 1245
    };

    const mockStats = {
      totalOrders: 1245,
      todayOrders: 42,
      totalRevenue: 24560.89,
      pendingOrders: 8,
      completedOrders: 38,
      cancelledOrders: 4,
      averageOrderValue: 42.50,
      customerSatisfaction: 4.5
    };

    const mockOrders = [
      { id: 'ORD001', customer: 'John Doe', items: 3, total: 45.99, status: 'pending', time: '10:30 AM', type: 'delivery' },
      { id: 'ORD002', customer: 'Jane Smith', items: 2, total: 28.50, status: 'preparing', time: '10:45 AM', type: 'pickup' },
      { id: 'ORD003', customer: 'Bob Johnson', items: 4, total: 67.25, status: 'ready', time: '11:00 AM', type: 'delivery' },
      { id: 'ORD004', customer: 'Alice Brown', items: 1, total: 15.99, status: 'completed', time: '09:15 AM', type: 'pickup' },
      { id: 'ORD005', customer: 'Charlie Wilson', items: 5, total: 89.75, status: 'cancelled', time: '09:45 AM', type: 'delivery' },
      { id: 'ORD006', customer: 'David Lee', items: 2, total: 32.50, status: 'pending', time: '11:30 AM', type: 'pickup' }
    ];

    const mockMenuItems = [
      { id: 1, name: 'Butter Chicken', category: 'Main Course', price: 16.99, status: 'available', sales: 245 },
      { id: 2, name: 'Paneer Tikka', category: 'Appetizers', price: 14.99, status: 'available', sales: 189 },
      { id: 3, name: 'Chicken Biryani', category: 'Main Course', price: 18.99, status: 'out_of_stock', sales: 312 },
      { id: 4, name: 'Garlic Naan', category: 'Breads', price: 4.99, status: 'available', sales: 456 },
      { id: 5, name: 'Mango Lassi', category: 'Beverages', price: 5.99, status: 'available', sales: 278 },
      { id: 6, name: 'Samosa', category: 'Appetizers', price: 6.99, status: 'available', sales: 321 }
    ];

    const mockStaff = [
      { id: 1, name: 'John Chef', role: 'Chef', email: 'john@spiceheaven.com', phone: '+1 (555) 111-1111', status: 'active' },
      { id: 2, name: 'Sarah Waitress', role: 'Waitress', email: 'sarah@spiceheaven.com', phone: '+1 (555) 222-2222', status: 'active' },
      { id: 3, name: 'Mike Manager', role: 'Manager', email: 'mike@spiceheaven.com', phone: '+1 (555) 333-3333', status: 'inactive' },
      { id: 4, name: 'Lisa Cashier', role: 'Cashier', email: 'lisa@spiceheaven.com', phone: '+1 (555) 444-4444', status: 'active' }
    ];

    setRestaurant(mockRestaurant);
    setStats(mockStats);
    setOrders(mockOrders);
    setMenuItems(mockMenuItems);
    setStaff(mockStaff);
  }, [navigate]);

  const salesData = [
    { name: 'Mon', orders: 65, revenue: 850 },
    { name: 'Tue', orders: 72, revenue: 920 },
    { name: 'Wed', orders: 68, revenue: 890 },
    { name: 'Thu', orders: 85, revenue: 1120 },
    { name: 'Fri', orders: 92, revenue: 1350 },
    { name: 'Sat', orders: 105, revenue: 1680 },
    { name: 'Sun', orders: 78, revenue: 1020 }
  ];

  const categoryData = [
    { name: 'Main Course', value: 45 },
    { name: 'Appetizers', value: 25 },
    { name: 'Beverages', value: 15 },
    { name: 'Breads', value: 10 },
    { name: 'Desserts', value: 5 }
  ];

  const COLORS = ['#FF6B35', '#4ECDC4', '#FFD166', '#06D6A0', '#EF476F'];

  const handleOrderAction = (orderId, action) => {
    switch(action) {
      case 'view':
        toast.success(`Viewing order ${orderId}`);
        break;
      case 'prepare':
        toast.success(`Started preparing order ${orderId}`);
        break;
      case 'complete':
        toast.success(`Order ${orderId} marked as complete`);
        break;
      case 'cancel':
        toast.error(`Order ${orderId} cancelled`);
        break;
    }
  };

  const handleMenuItemAction = (itemId, action) => {
    switch(action) {
      case 'edit':
        toast.success(`Editing menu item ${itemId}`);
        break;
      case 'toggle':
        toast.success('Item status updated');
        break;
      case 'delete':
        toast.error('Item deleted');
        break;
    }
  };

  const handleStaffAction = (staffId, action) => {
    switch(action) {
      case 'edit':
        toast.success(`Editing staff ${staffId}`);
        break;
      case 'toggle':
        toast.success('Staff status updated');
        break;
      case 'delete':
        toast.error('Staff removed');
        break;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('restaurant_id');
    toast.success('Logged out successfully');
    navigate('/owner-login');
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
                  <Package size={24} />
                </StatIcon>
                <StatInfo>
                  <StatValue>{stats.todayOrders}</StatValue>
                  <StatLabel>Today's Orders</StatLabel>
                  <StatTrend positive>
                    <TrendingUp size={16} />
                    <span>+12%</span>
                  </StatTrend>
                </StatInfo>
              </StatCard>
              
              <StatCard>
                <StatIcon>
                  <DollarSign size={24} />
                </StatIcon>
                <StatInfo>
                  <StatValue>${stats.totalRevenue.toLocaleString()}</StatValue>
                  <StatLabel>Total Revenue</StatLabel>
                  <StatTrend positive>
                    <TrendingUp size={16} />
                    <span>+8%</span>
                  </StatTrend>
                </StatInfo>
              </StatCard>
              
              <StatCard>
                <StatIcon>
                  <Clock size={24} />
                </StatIcon>
                <StatInfo>
                  <StatValue>{stats.pendingOrders}</StatValue>
                  <StatLabel>Pending Orders</StatLabel>
                  <StatTrend negative>
                    <AlertCircle size={16} />
                    <span>Needs attention</span>
                  </StatTrend>
                </StatInfo>
              </StatCard>
              
              <StatCard>
                <StatIcon>
                  <Users size={24} />
                </StatIcon>
                <StatInfo>
                  <StatValue>{stats.completedOrders || 38}</StatValue>
                  <StatLabel>Completed Today</StatLabel>
                  <StatTrend positive>
                    <TrendingUp size={16} />
                    <span>+5%</span>
                  </StatTrend>
                </StatInfo>
              </StatCard>
            </StatsGrid>

            {/* Charts */}
            <ChartsGrid>
              <ChartCard>
                <ChartHeader>
                  <h3>Weekly Sales</h3>
                  <TimeRangeSelector>
                    <TimeRangeButton 
                      active={timeRange === 'today'}
                      onClick={() => setTimeRange('today')}
                    >
                      Today
                    </TimeRangeButton>
                    <TimeRangeButton 
                      active={timeRange === 'week'}
                      onClick={() => setTimeRange('week')}
                    >
                      Week
                    </TimeRangeButton>
                    <TimeRangeButton 
                      active={timeRange === 'month'}
                      onClick={() => setTimeRange('month')}
                    >
                      Month
                    </TimeRangeButton>
                  </TimeRangeSelector>
                </ChartHeader>
                <ChartContainer>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Bar yAxisId="left" dataKey="orders" name="Orders" fill="#FF6B35" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="revenue" name="Revenue ($)" fill="#4ECDC4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </ChartCard>
              
              <ChartCard>
                <ChartHeader>
                  <h3>Sales by Category</h3>
                </ChartHeader>
                <ChartContainer>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </ChartCard>
            </ChartsGrid>

            {/* Recent Orders */}
            <SectionCard>
              <SectionHeader>
                <h3>Recent Orders</h3>
                <ViewAllLink>View All</ViewAllLink>
              </SectionHeader>
              <OrdersTable>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(order => (
                    <tr key={order.id}>
                      <td>
                        <OrderId>{order.id}</OrderId>
                      </td>
                      <td>{order.customer}</td>
                      <td>{order.items}</td>
                      <td>${order.total.toFixed(2)}</td>
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
                      <td>
                        <ActionButtons>
                          <ActionButton onClick={() => handleOrderAction(order.id, 'view')}>
                            <Eye size={16} />
                          </ActionButton>
                          {order.status === 'pending' && (
                            <ActionButton onClick={() => handleOrderAction(order.id, 'prepare')}>
                              <Package size={16} />
                            </ActionButton>
                          )}
                          {order.status === 'ready' && (
                            <ActionButton onClick={() => handleOrderAction(order.id, 'complete')}>
                              <CheckCircle size={16} />
                            </ActionButton>
                          )}
                        </ActionButtons>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </OrdersTable>
            </SectionCard>
          </OverviewTab>
        );
        
      case 'orders':
        return (
          <OrdersTab>
            <SectionHeader>
              <h2>Order Management</h2>
              <FilterBar>
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
              </FilterBar>
            </SectionHeader>
            
            <OrdersGrid>
              {orders.map(order => (
                <OrderCard key={order.id}>
                  <OrderHeader>
                    <OrderId>{order.id}</OrderId>
                    <OrderTime>{order.time}</OrderTime>
                  </OrderHeader>
                  
                  <OrderCustomer>
                    <strong>{order.customer}</strong>
                    <span>{order.items} items • ${order.total.toFixed(2)}</span>
                  </OrderCustomer>
                  
                  <OrderStatusSection>
                    <StatusBadge status={order.status}>
                      {order.status}
                    </StatusBadge>
                    <TypeBadge type={order.type}>
                      {order.type}
                    </TypeBadge>
                  </OrderStatusSection>
                  
                  <OrderActions>
                    <OrderButton onClick={() => handleOrderAction(order.id, 'view')}>
                      <Eye size={16} />
                      View
                    </OrderButton>
                    {order.status === 'pending' && (
                      <OrderButton primary onClick={() => handleOrderAction(order.id, 'prepare')}>
                        <Package size={16} />
                        Prepare
                      </OrderButton>
                    )}
                    {order.status === 'preparing' && (
                      <OrderButton primary onClick={() => handleOrderAction(order.id, 'complete')}>
                        <CheckCircle size={16} />
                        Ready
                      </OrderButton>
                    )}
                    {order.status === 'ready' && (
                      <OrderButton success onClick={() => handleOrderAction(order.id, 'complete')}>
                        <CheckCircle size={16} />
                        Complete
                      </OrderButton>
                    )}
                    <OrderButton danger onClick={() => handleOrderAction(order.id, 'cancel')}>
                      <Trash2 size={16} />
                      Cancel
                    </OrderButton>
                  </OrderActions>
                </OrderCard>
              ))}
            </OrdersGrid>
          </OrdersTab>
        );
        
      case 'menu':
        return (
          <MenuTab>
            <SectionHeader>
              <h2>Menu Management</h2>
              <ActionBar>
                <AddButton>
                  <Plus size={20} />
                  Add Item
                </AddButton>
                <SearchBox>
                  <Search size={20} />
                  <input type="text" placeholder="Search menu..." />
                </SearchBox>
              </ActionBar>
            </SectionHeader>
            
            <MenuItemsTable>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Sales</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map(item => (
                  <tr key={item.id}>
                    <td>
                      <MenuItem>
                        <ItemName>{item.name}</ItemName>
                      </MenuItem>
                    </td>
                    <td>
                      <CategoryTag>{item.category}</CategoryTag>
                    </td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>
                      <StatusBadge status={item.status}>
                        {item.status.replace('_', ' ')}
                      </StatusBadge>
                    </td>
                    <td>{item.sales}</td>
                    <td>
                      <ActionButtons>
                        <ActionButton onClick={() => handleMenuItemAction(item.id, 'edit')}>
                          <Edit size={16} />
                        </ActionButton>
                        <ActionButton onClick={() => handleMenuItemAction(item.id, 'toggle')}>
                          <RefreshCw size={16} />
                        </ActionButton>
                        <ActionButton danger onClick={() => handleMenuItemAction(item.id, 'delete')}>
                          <Trash2 size={16} />
                        </ActionButton>
                      </ActionButtons>
                    </td>
                  </tr>
                ))}
              </tbody>
            </MenuItemsTable>
          </MenuTab>
        );
        
      case 'staff':
        return (
          <StaffTab>
            <SectionHeader>
              <h2>Staff Management</h2>
              <ActionBar>
                <AddButton>
                  <Plus size={20} />
                  Add Staff
                </AddButton>
                <SearchBox>
                  <Search size={20} />
                  <input type="text" placeholder="Search staff..." />
                </SearchBox>
              </ActionBar>
            </SectionHeader>
            
            <StaffGrid>
              {staff.map(member => (
                <StaffCard key={member.id}>
                  <StaffAvatar>
                    {member.name.charAt(0)}
                  </StaffAvatar>
                  <StaffInfo>
                    <StaffName>{member.name}</StaffName>
                    <StaffRole>{member.role}</StaffRole>
                    <StaffContact>
                      <span>{member.email}</span>
                      <span>{member.phone}</span>
                    </StaffContact>
                  </StaffInfo>
                  <StaffActions>
                    <StatusBadge status={member.status}>
                      {member.status}
                    </StatusBadge>
                    <ActionButtons>
                      <ActionButton onClick={() => handleStaffAction(member.id, 'edit')}>
                        <Edit size={16} />
                      </ActionButton>
                      <ActionButton onClick={() => handleStaffAction(member.id, 'toggle')}>
                        <RefreshCw size={16} />
                      </ActionButton>
                      <ActionButton danger onClick={() => handleStaffAction(member.id, 'delete')}>
                        <Trash2 size={16} />
                      </ActionButton>
                    </ActionButtons>
                  </StaffActions>
                </StaffCard>
              ))}
            </StaffGrid>
          </StaffTab>
        );
        
      default:
        return null;
    }
  };

  if (!restaurant) {
    return <Loading>Loading restaurant dashboard...</Loading>;
  }

  return (
    <AdminContainer>
      {/* Sidebar */}
      <Sidebar>
        <RestaurantInfo>
          <Store size={32} />
          <RestaurantDetails>
            <RestaurantName>{restaurant.name}</RestaurantName>
            <RestaurantStatus active={restaurant.status === 'active'}>
              {restaurant.status}
            </RestaurantStatus>
          </RestaurantDetails>
        </RestaurantInfo>
        
        <NavMenu>
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            <BarChart3 size={20} />
            <span>Overview</span>
          </NavItem>
          <NavItem active={activeTab === 'orders'} onClick={() => setActiveTab('orders')}>
            <Package size={20} />
            <span>Orders</span>
            <NotificationBadge>{stats.pendingOrders}</NotificationBadge>
          </NavItem>
          <NavItem active={activeTab === 'menu'} onClick={() => setActiveTab('menu')}>
            <DollarSign size={20} />
            <span>Menu</span>
          </NavItem>
          <NavItem active={activeTab === 'staff'} onClick={() => setActiveTab('staff')}>
            <Users size={20} />
            <span>Staff</span>
          </NavItem>
          <NavItem onClick={() => navigate('/qr-generator')}>
            <QrCode size={20} />
            <span>QR Codes</span>
          </NavItem>
          <NavItem>
            <Settings size={20} />
            <span>Settings</span>
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
            <h1>{restaurant.name} Dashboard</h1>
            <HeaderSubtitle>Welcome back! Here's what's happening today.</HeaderSubtitle>
          </HeaderTitle>
          
          <HeaderActions>
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
          {renderTabContent()}
        </ContentArea>

        {/* Quick Stats Footer */}
        <FooterStats>
          <StatItem>
            <span>Total Orders</span>
            <strong>{stats.totalOrders}</strong>
          </StatItem>
          <StatItem>
            <span>Today's Revenue</span>
            <strong>${(stats.todayOrders * stats.averageOrderValue).toFixed(2)}</strong>
          </StatItem>
          <StatItem>
            <span>Avg. Order Value</span>
            <strong>${stats.averageOrderValue?.toFixed(2)}</strong>
          </StatItem>
          <StatItem>
            <span>Satisfaction</span>
            <strong>{stats.customerSatisfaction}/5</strong>
          </StatItem>
        </FooterStats>
      </MainContent>
    </AdminContainer>
  );
};

const AdminContainer = styled.div`
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

const RestaurantInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 40px;
  
  svg {
    color: var(--primary-color);
  }
`;

const RestaurantDetails = styled.div`
  flex: 1;
`;

const RestaurantName = styled.div`
  font-weight: 600;
  margin-bottom: 5px;
  font-size: 1.1rem;
`;

const RestaurantStatus = styled.div`
  display: inline-block;
  padding: 4px 12px;
  background: ${props => props.active ? 'rgba(6, 214, 160, 0.2)' : 'rgba(239, 71, 111, 0.2)'};
  color: ${props => props.active ? 'var(--success-color)' : 'var(--danger-color)'};
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
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
  gap: 15px;
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
  
  svg {
    stroke-width: 3;
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
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

const TimeRangeSelector = styled.div`
  display: flex;
  gap: 10px;
`;

const TimeRangeButton = styled.button`
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

const SectionCard = styled.div`
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

const OrdersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
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

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch(props.status) {
      case 'pending': return 'rgba(255, 214, 102, 0.2)';
      case 'preparing': return 'rgba(78, 205, 196, 0.2)';
      case 'ready': return 'rgba(6, 214, 160, 0.2)';
      case 'completed': return 'rgba(6, 214, 160, 0.2)';
      case 'cancelled': return 'rgba(239, 71, 111, 0.2)';
      case 'available': return 'rgba(6, 214, 160, 0.2)';
      case 'out_of_stock': return 'rgba(239, 71, 111, 0.2)';
      case 'active': return 'rgba(6, 214, 160, 0.2)';
      case 'inactive': return 'rgba(239, 71, 111, 0.2)';
      default: return 'var(--light-gray)';
    }
  }};
  color: ${props => {
    switch(props.status) {
      case 'pending': return 'var(--warning-color)';
      case 'preparing': return 'var(--accent-color)';
      case 'ready': return 'var(--success-color)';
      case 'completed': return 'var(--success-color)';
      case 'cancelled': return 'var(--danger-color)';
      case 'available': return 'var(--success-color)';
      case 'out_of_stock': return 'var(--danger-color)';
      case 'active': return 'var(--success-color)';
      case 'inactive': return 'var(--danger-color)';
      default: return 'var(--gray-color)';
    }
  }};
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

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  width: 32px;
  height: 32px;
  border: ${props => props.danger ? '1px solid var(--danger-color)' : '1px solid var(--light-gray)'};
  background: ${props => {
    if (props.danger) return 'transparent';
    if (props.primary) return 'var(--primary-color)';
    if (props.success) return 'var(--success-color)';
    return 'white';
  }};
  color: ${props => {
    if (props.danger) return 'var(--danger-color)';
    if (props.primary || props.success) return 'white';
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
      if (props.primary) return '#E55A2E';
      if (props.success) return '#05C48F';
      return 'var(--light-gray)';
    }};
    color: ${props => props.danger ? 'white' : props.color};
  }
`;

const OrdersTab = styled.div``;

const FilterBar = styled.div`
  display: flex;
  gap: 15px;
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

const OrdersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-top: 30px;
`;

const OrderCard = styled.div`
  background: white;
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const OrderTime = styled.div`
  color: var(--gray-color);
  font-size: 14px;
`;

const OrderCustomer = styled.div`
  margin-bottom: 15px;
  
  strong {
    display: block;
    margin-bottom: 5px;
  }
  
  span {
    color: var(--gray-color);
    font-size: 14px;
  }
`;

const OrderStatusSection = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const OrderActions = styled.div`
  display: flex;
  gap: 10px;
`;

const OrderButton = styled.button`
  flex: 1;
  padding: 10px;
  background: ${props => {
    if (props.primary) return 'var(--primary-color)';
    if (props.success) return 'var(--success-color)';
    if (props.danger) return 'transparent';
    return 'white';
  }};
  color: ${props => {
    if (props.primary || props.success) return 'white';
    if (props.danger) return 'var(--danger-color)';
    return 'var(--dark-color)';
  }};
  border: ${props => props.danger ? '1px solid var(--danger-color)' : 'none'};
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background: ${props => {
      if (props.primary) return '#E55A2E';
      if (props.success) return '#05C48F';
      if (props.danger) return 'var(--danger-color)';
      return 'var(--light-gray)';
    }};
    color: ${props => props.danger && 'white'};
  }
`;

const MenuTab = styled.div``;

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

const MenuItemsTable = styled.table`
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

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const ItemName = styled.div`
  font-weight: 500;
`;

const CategoryTag = styled.span`
  padding: 4px 12px;
  background: var(--light-gray);
  color: var(--gray-color);
  border-radius: 12px;
  font-size: 12px;
`;

const StaffTab = styled.div``;

const StaffGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 30px;
`;

const StaffCard = styled.div`
  background: white;
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  gap: 15px;
`;

const StaffAvatar = styled.div`
  width: 60px;
  height: 60px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
`;

const StaffInfo = styled.div`
  flex: 1;
`;

const StaffName = styled.div`
  font-weight: 600;
  margin-bottom: 5px;
`;

const StaffRole = styled.div`
  color: var(--primary-color);
  font-weight: 500;
  margin-bottom: 5px;
`;

const StaffContact = styled.div`
  font-size: 12px;
  color: var(--gray-color);
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StaffActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
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

const Loading = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: var(--gray-color);
`;

export default RestaurantAdmin;