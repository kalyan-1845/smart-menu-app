import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  User,
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
  DollarSign,
  Table,
  MessageCircle,
  Printer,
  CreditCard,
  Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';

const WalterDashboard = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    activeTables: 0,
    pendingOrders: 0,
    todayRevenue: 0,
    servedToday: 0
  });
  const [activeTab, setActiveTab] = useState('tables');
  const [waiterInfo, setWaiterInfo] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);

  useEffect(() => {
    // Check if user is logged in as waiter
    const waiterId = localStorage.getItem('waiter_id');
    if (!waiterId) {
      toast.error('Please login as waiter');
      navigate('/login');
      return;
    }

    // Load waiter info
    const mockWaiterInfo = {
      id: waiterId,
      name: 'Sarah Waiter',
      restaurant: 'Spice Heaven',
      section: 'Section A',
      tables: [1, 2, 3, 4, 5],
      rating: 4.9,
      image: null
    };

    const mockTables = [
      { id: 1, number: 'Table 1', status: 'occupied', customers: 4, orderId: 'ORD001', time: '45 min', bill: 89.99 },
      { id: 2, number: 'Table 2', status: 'occupied', customers: 2, orderId: 'ORD002', time: '30 min', bill: 45.50 },
      { id: 3, number: 'Table 3', status: 'available', customers: 0, orderId: null, time: null, bill: null },
      { id: 4, number: 'Table 4', status: 'reserved', customers: 6, orderId: 'RES001', time: '15 min', bill: null },
      { id: 5, number: 'Table 5', status: 'needs_attention', customers: 3, orderId: 'ORD003', time: '60 min', bill: 120.75 },
      { id: 6, number: 'Table 6', status: 'available', customers: 0, orderId: null, time: null, bill: null },
      { id: 7, number: 'Table 7', status: 'occupied', customers: 5, orderId: 'ORD004', time: '25 min', bill: 156.25 },
      { id: 8, number: 'Table 8', status: 'needs_cleaning', customers: 0, orderId: null, time: null, bill: null }
    ];

    const mockOrders = [
      { id: 'ORD001', table: 'Table 1', items: 6, status: 'served', time: '45 min', amount: 89.99, payment: 'pending' },
      { id: 'ORD002', table: 'Table 2', items: 3, status: 'serving', time: '30 min', amount: 45.50, payment: 'pending' },
      { id: 'ORD003', table: 'Table 5', items: 8, status: 'preparing', time: '60 min', amount: 120.75, payment: 'pending' },
      { id: 'ORD004', table: 'Table 7', items: 7, status: 'ordered', time: '25 min', amount: 156.25, payment: 'pending' },
      { id: 'ORD005', table: 'Takeaway', items: 2, status: 'ready', time: '15 min', amount: 32.99, payment: 'paid' },
      { id: 'ORD006', table: 'Delivery', items: 4, status: 'ready', time: '20 min', amount: 67.85, payment: 'paid' }
    ];

    const mockStats = {
      activeTables: 4,
      pendingOrders: 6,
      todayRevenue: 845.67,
      servedToday: 18,
      tips: 125.50,
      efficiency: 95
    };

    setWaiterInfo(mockWaiterInfo);
    setTables(mockTables);
    setOrders(mockOrders);
    setStats(mockStats);
  }, [navigate]);

  const handleTableAction = (tableId, action) => {
    const table = tables.find(t => t.id === tableId);
    
    switch(action) {
      case 'view':
        setSelectedTable(table);
        toast.success(`Viewing ${table.number}`);
        break;
      case 'serve':
        toast.success(`Order served to ${table.number}`);
        break;
      case 'bill':
        toast.success(`Bill presented to ${table.number}`);
        break;
      case 'clean':
        toast.success(`${table.number} marked as cleaned`);
        setTables(prev => prev.map(t => 
          t.id === tableId ? { ...t, status: 'available' } : t
        ));
        break;
      case 'call':
        toast.success(`Attending ${table.number}`);
        break;
    }
  };

  const handleOrderAction = (orderId, action) => {
    switch(action) {
      case 'serve':
        toast.success(`Order ${orderId} served`);
        break;
      case 'print':
        toast.success(`Printing bill for ${orderId}`);
        break;
      case 'payment':
        toast.success(`Processing payment for ${orderId}`);
        break;
      case 'cancel':
        toast.error(`Order ${orderId} cancelled`);
        break;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('waiter_id');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getTableStatusColor = (status) => {
    switch(status) {
      case 'occupied': return 'var(--primary-color)';
      case 'available': return 'var(--success-color)';
      case 'reserved': return 'var(--warning-color)';
      case 'needs_attention': return 'var(--danger-color)';
      case 'needs_cleaning': return 'var(--gray-color)';
      default: return 'var(--gray-color)';
    }
  };

  const getOrderStatusColor = (status) => {
    switch(status) {
      case 'ordered': return 'var(--warning-color)';
      case 'preparing': return 'var(--accent-color)';
      case 'ready': return 'var(--success-color)';
      case 'serving': return 'var(--primary-color)';
      case 'served': return 'var(--dark-color)';
      default: return 'var(--gray-color)';
    }
  };

  return (
    <WaiterContainer>
      {/* Sidebar */}
      <Sidebar>
        <WaiterProfile>
          <WaiterAvatar>
            {waiterInfo?.image ? (
              <img src={waiterInfo.image} alt={waiterInfo.name} />
            ) : (
              <User size={32} />
            )}
          </WaiterAvatar>
          <WaiterDetails>
            <WaiterName>{waiterInfo?.name}</WaiterName>
            <WaiterRestaurant>{waiterInfo?.restaurant}</WaiterRestaurant>
            <WaiterSection>{waiterInfo?.section}</WaiterSection>
          </WaiterDetails>
          <WaiterTables>
            <Table size={16} />
            <span>{waiterInfo?.tables?.length || 5} tables</span>
          </WaiterTables>
        </WaiterProfile>
        
        <NavMenu>
          <NavItem active={activeTab === 'tables'} onClick={() => setActiveTab('tables')}>
            <Table size={20} />
            <span>Tables ({stats.activeTables})</span>
          </NavItem>
          <NavItem active={activeTab === 'orders'} onClick={() => setActiveTab('orders')}>
            <Package size={20} />
            <span>Orders ({stats.pendingOrders})</span>
          </NavItem>
          <NavItem active={activeTab === 'payments'} onClick={() => setActiveTab('payments')}>
            <CreditCard size={20} />
            <span>Payments</span>
          </NavItem>
          <NavItem active={activeTab === 'messages'} onClick={() => setActiveTab('messages')}>
            <MessageCircle size={20} />
            <span>Messages</span>
            <NotificationBadge>3</NotificationBadge>
          </NavItem>
        </NavMenu>
        
        <StatsSidebar>
          <StatItem>
            <StatIcon>
              <DollarSign size={16} />
            </StatIcon>
            <div>
              <StatValue>${stats.todayRevenue.toFixed(2)}</StatValue>
              <StatLabel>Today's Revenue</StatLabel>
            </div>
          </StatItem>
          <StatItem>
            <StatIcon>
              <TrendingUp size={16} />
            </StatIcon>
            <div>
              <StatValue>${stats.tips.toFixed(2)}</StatValue>
              <StatLabel>Tips Today</StatLabel>
            </div>
          </StatItem>
          <StatItem>
            <StatIcon>
              <CheckCircle size={16} />
            </StatIcon>
            <div>
              <StatValue>{stats.servedToday}</StatValue>
              <StatLabel>Tables Served</StatLabel>
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
            <h1>Waiter Dashboard</h1>
            <HeaderSubtitle>Manage tables, orders, and customer service</HeaderSubtitle>
          </HeaderTitle>
          
          <HeaderActions>
            <SearchBox>
              <Search size={20} />
              <input type="text" placeholder="Search tables or orders..." />
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
              <StatCardIcon bgColor="rgba(255, 107, 53, 0.2)">
                <Table size={24} color="var(--primary-color)" />
              </StatCardIcon>
              <div>
                <StatCardValue>{stats.activeTables}</StatCardValue>
                <StatCardLabel>Active Tables</StatCardLabel>
              </div>
            </StatCard>
            
            <StatCard>
              <StatCardIcon bgColor="rgba(78, 205, 196, 0.2)">
                <Package size={24} color="var(--accent-color)" />
              </StatCardIcon>
              <div>
                <StatCardValue>{stats.pendingOrders}</StatCardValue>
                <StatCardLabel>Pending Orders</StatCardLabel>
              </div>
            </StatCard>
            
            <StatCard>
              <StatCardIcon bgColor="rgba(6, 214, 160, 0.2)">
                <DollarSign size={24} color="var(--success-color)" />
              </StatCardIcon>
              <div>
                <StatCardValue>${stats.todayRevenue.toFixed(2)}</StatCardValue>
                <StatCardLabel>Today's Revenue</StatCardLabel>
              </div>
            </StatCard>
            
            <StatCard>
              <StatCardIcon bgColor="rgba(255, 214, 102, 0.2)">
                <TrendingUp size={24} color="var(--warning-color)" />
              </StatCardIcon>
              <div>
                <StatCardValue>{stats.efficiency}%</StatCardValue>
                <StatCardLabel>Efficiency</StatCardLabel>
              </div>
            </StatCard>
          </StatsOverview>

          {/* Tables Grid */}
          {activeTab === 'tables' && (
            <TablesSection>
              <SectionHeader>
                <h2>Table Management</h2>
                <TableFilter>
                  <FilterButton active onClick={() => {}}>
                    All
                  </FilterButton>
                  <FilterButton onClick={() => {}}>
                    Occupied
                  </FilterButton>
                  <FilterButton onClick={() => {}}>
                    Available
                  </FilterButton>
                  <FilterButton onClick={() => {}}>
                    Needs Attention
                  </FilterButton>
                </TableFilter>
              </SectionHeader>

              <TablesGrid>
                {tables.map(table => (
                  <TableCard key={table.id} status={table.status}>
                    <TableHeader>
                      <TableNumber>{table.number}</TableNumber>
                      <TableStatus status={table.status}>
                        {table.status.replace('_', ' ')}
                      </TableStatus>
                    </TableHeader>
                    
                    <TableInfo>
                      <TableDetail>
                        <span>Customers:</span>
                        <strong>{table.customers || '-'}</strong>
                      </TableDetail>
                      {table.time && (
                        <TableDetail>
                          <span>Time:</span>
                          <strong>{table.time}</strong>
                        </TableDetail>
                      )}
                      {table.bill && (
                        <TableDetail>
                          <span>Bill:</span>
                          <strong>${table.bill.toFixed(2)}</strong>
                        </TableDetail>
                      )}
                    </TableInfo>
                    
                    <TableActions>
                      {table.status === 'occupied' && (
                        <>
                          <TableButton primary onClick={() => handleTableAction(table.id, 'serve')}>
                            <Package size={16} />
                            Serve
                          </TableButton>
                          <TableButton onClick={() => handleTableAction(table.id, 'bill')}>
                            <Receipt size={16} />
                            Bill
                          </TableButton>
                        </>
                      )}
                      {table.status === 'needs_attention' && (
                        <TableButton danger onClick={() => handleTableAction(table.id, 'call')}>
                          <AlertCircle size={16} />
                          Attend
                        </TableButton>
                      )}
                      {table.status === 'needs_cleaning' && (
                        <TableButton onClick={() => handleTableAction(table.id, 'clean')}>
                          <CheckCircle size={16} />
                          Clean
                        </TableButton>
                      )}
                      {table.status === 'available' && (
                        <TableButton success onClick={() => handleTableAction(table.id, 'view')}>
                          <User size={16} />
                          Seat
                        </TableButton>
                      )}
                      {table.status === 'reserved' && (
                        <TableButton onClick={() => handleTableAction(table.id, 'view')}>
                          <Clock size={16} />
                          View
                        </TableButton>
                      )}
                    </TableActions>
                  </TableCard>
                ))}
              </TablesGrid>
            </TablesSection>
          )}

          {/* Orders List */}
          {activeTab === 'orders' && (
            <OrdersSection>
              <SectionHeader>
                <h2>Order Management</h2>
                <OrderFilter>
                  <FilterButton active>All</FilterButton>
                  <FilterButton>Ready</FilterButton>
                  <FilterButton>Preparing</FilterButton>
                  <FilterButton>To Serve</FilterButton>
                </OrderFilter>
              </SectionHeader>

              <OrdersList>
                {orders.map(order => (
                  <OrderCard key={order.id}>
                    <OrderHeader>
                      <div>
                        <OrderId>{order.id}</OrderId>
                        <OrderTable>{order.table}</OrderTable>
                      </div>
                      <OrderStatus status={order.status}>
                        {order.status}
                      </OrderStatus>
                    </OrderHeader>
                    
                    <OrderDetails>
                      <OrderDetail>
                        <span>Items:</span>
                        <strong>{order.items}</strong>
                      </OrderDetail>
                      <OrderDetail>
                        <span>Amount:</span>
                        <strong>${order.amount.toFixed(2)}</strong>
                      </OrderDetail>
                      <OrderDetail>
                        <span>Time:</span>
                        <strong>{order.time}</strong>
                      </OrderDetail>
                      <OrderDetail>
                        <span>Payment:</span>
                        <PaymentStatus status={order.payment}>
                          {order.payment}
                        </PaymentStatus>
                      </OrderDetail>
                    </OrderDetails>
                    
                    <OrderActions>
                      {order.status === 'ready' && (
                        <OrderButton primary onClick={() => handleOrderAction(order.id, 'serve')}>
                          <Package size={16} />
                          Serve
                        </OrderButton>
                      )}
                      {order.status === 'served' && order.payment === 'pending' && (
                        <OrderButton success onClick={() => handleOrderAction(order.id, 'payment')}>
                          <CreditCard size={16} />
                          Collect Payment
                        </OrderButton>
                      )}
                      <OrderButton onClick={() => handleOrderAction(order.id, 'print')}>
                        <Printer size={16} />
                        Print Bill
                      </OrderButton>
                      <OrderButton danger onClick={() => handleOrderAction(order.id, 'cancel')}>
                        <AlertCircle size={16} />
                        Cancel
                      </OrderButton>
                    </OrderActions>
                  </OrderCard>
                ))}
              </OrdersList>
            </OrdersSection>
          )}

          {/* Selected Table Details */}
          {selectedTable && activeTab === 'tables' && (
            <TableDetails>
              <DetailsHeader>
                <h3>{selectedTable.number} Details</h3>
                <CloseButton onClick={() => setSelectedTable(null)}>×</CloseButton>
              </DetailsHeader>
              
              <DetailsContent>
                <DetailRow>
                  <span>Status:</span>
                  <TableStatus status={selectedTable.status}>
                    {selectedTable.status.replace('_', ' ')}
                  </TableStatus>
                </DetailRow>
                <DetailRow>
                  <span>Customers:</span>
                  <strong>{selectedTable.customers || 0}</strong>
                </DetailRow>
                {selectedTable.time && (
                  <DetailRow>
                    <span>Duration:</span>
                    <strong>{selectedTable.time}</strong>
                  </DetailRow>
                )}
                {selectedTable.bill && (
                  <DetailRow>
                    <span>Current Bill:</span>
                    <strong>${selectedTable.bill.toFixed(2)}</strong>
                  </DetailRow>
                )}
                {selectedTable.orderId && (
                  <DetailRow>
                    <span>Order ID:</span>
                    <strong>{selectedTable.orderId}</strong>
                  </DetailRow>
                )}
              </DetailsContent>
              
              <DetailsActions>
                <ActionButton primary>
                  <Receipt size={16} />
                  Generate Bill
                </ActionButton>
                <ActionButton>
                  <MessageCircle size={16} />
                  Message Chef
                </ActionButton>
                <ActionButton>
                  <Printer size={16} />
                  Print Receipt
                </ActionButton>
              </DetailsActions>
            </TableDetails>
          )}
        </ContentArea>

        {/* Quick Actions Footer */}
        <QuickActions>
          <QuickAction onClick={() => toast.success('Calling kitchen...')}>
            <AlertCircle size={20} />
            <span>Call Kitchen</span>
          </QuickAction>
          <QuickAction onClick={() => toast.success('Bills printed')}>
            <Printer size={20} />
            <span>Print All Bills</span>
          </QuickAction>
          <QuickAction onClick={() => toast.success('Cleaning staff notified')}>
            <CheckCircle size={20} />
            <span>Request Cleaning</span>
          </QuickAction>
          <QuickAction onClick={() => toast.success('Manager notified')}>
            <User size={20} />
            <span>Call Manager</span>
          </QuickAction>
        </QuickActions>
      </MainContent>
    </WaiterContainer>
  );
};

const WaiterContainer = styled.div`
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

const WaiterProfile = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 25px;
  border-bottom: 1px solid var(--light-gray);
`;

const WaiterAvatar = styled.div`
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

const WaiterDetails = styled.div`
  margin-bottom: 15px;
`;

const WaiterName = styled.div`
  font-weight: 600;
  font-size: 1.2rem;
  margin-bottom: 5px;
`;

const WaiterRestaurant = styled.div`
  color: var(--primary-color);
  font-weight: 500;
  margin-bottom: 5px;
`;

const WaiterSection = styled.div`
  color: var(--gray-color);
  font-size: 14px;
`;

const WaiterTables = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: rgba(255, 107, 53, 0.1);
  color: var(--primary-color);
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

const TablesSection = styled.div`
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

const TableFilter = styled.div`
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

const TablesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
`;

const TableCard = styled.div`
  border: 2px solid ${props => getTableStatusColor(props.status)};
  border-radius: var(--radius);
  padding: 20px;
  background: white;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const TableNumber = styled.div`
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--dark-color);
`;

const TableStatus = styled.span`
  padding: 4px 12px;
  background: ${props => {
    switch(props.status) {
      case 'occupied': return 'rgba(255, 107, 53, 0.2)';
      case 'available': return 'rgba(6, 214, 160, 0.2)';
      case 'reserved': return 'rgba(255, 214, 102, 0.2)';
      case 'needs_attention': return 'rgba(239, 71, 111, 0.2)';
      case 'needs_cleaning': return 'rgba(108, 117, 125, 0.2)';
      default: return 'var(--light-gray)';
    }
  }};
  color: ${props => getTableStatusColor(props.status)};
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const TableInfo = styled.div`
  margin-bottom: 20px;
`;

const TableDetail = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed var(--light-gray);
  
  span {
    color: var(--gray-color);
  }
  
  strong {
    font-weight: 600;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const TableButton = styled.button`
  flex: 1;
  min-width: 100px;
  padding: 10px;
  background: ${props => {
    if (props.primary) return 'var(--primary-color)';
    if (props.success) return 'var(--success-color)';
    if (props.danger) return 'var(--danger-color)';
    return 'var(--light-gray)';
  }};
  color: ${props => props.primary || props.success || props.danger ? 'white' : 'var(--dark-color)'};
  border: none;
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  
  &:hover {
    background: ${props => {
      if (props.primary) return '#E55A2E';
      if (props.success) return '#05C48F';
      if (props.danger) return '#D43B5E';
      return '#dde0e3';
    }};
  }
`;

const OrdersSection = styled.div`
  background: white;
  border-radius: var(--radius);
  padding: 25px;
  box-shadow: var(--shadow);
`;

const OrderFilter = styled.div`
  display: flex;
  gap: 10px;
`;

const OrdersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const OrderCard = styled.div`
  border: 1px solid var(--light-gray);
  border-radius: var(--radius);
  padding: 20px;
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
`;

const OrderId = styled.div`
  font-family: monospace;
  font-weight: 600;
  color: var(--primary-color);
  font-size: 1.1rem;
`;

const OrderTable = styled.div`
  color: var(--gray-color);
  font-size: 14px;
  margin-top: 2px;
`;

const OrderStatus = styled.span`
  padding: 4px 12px;
  background: ${props => {
    switch(props.status) {
      case 'ordered': return 'rgba(255, 214, 102, 0.2)';
      case 'preparing': return 'rgba(78, 205, 196, 0.2)';
      case 'ready': return 'rgba(6, 214, 160, 0.2)';
      case 'serving': return 'rgba(255, 107, 53, 0.2)';
      case 'served': return 'rgba(41, 47, 54, 0.2)';
      default: return 'var(--light-gray)';
    }
  }};
  color: ${props => getOrderStatusColor(props.status)};
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const OrderDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const OrderDetail = styled.div`
  span {
    display: block;
    color: var(--gray-color);
    font-size: 12px;
    margin-bottom: 2px;
  }
  
  strong {
    font-weight: 600;
  }
`;

const PaymentStatus = styled.span`
  padding: 4px 8px;
  background: ${props => props.status === 'paid' ? 'rgba(6, 214, 160, 0.2)' : 'rgba(255, 214, 102, 0.2)'};
  color: ${props => props.status === 'paid' ? 'var(--success-color)' : 'var(--warning-color)'};
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
`;

const OrderActions = styled.div`
  display: flex;
  gap: 10px;
`;

const OrderButton = styled.button`
  padding: 8px 16px;
  background: ${props => {
    if (props.primary) return 'var(--primary-color)';
    if (props.success) return 'var(--success-color)';
    if (props.danger) return 'transparent';
    return 'var(--light-gray)';
  }};
  color: ${props => {
    if (props.primary || props.success) return 'white';
    if (props.danger) return 'var(--danger-color)';
    return 'var(--dark-color)';
  }};
  border: ${props => props.danger ? '1px solid var(--danger-color)' : 'none'};
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    background: ${props => {
      if (props.primary) return '#E55A2E';
      if (props.success) return '#05C48F';
      if (props.danger) return 'var(--danger-color)';
      return '#dde0e3';
    }};
    color: ${props => props.danger && 'white'};
  }
`;

const TableDetails = styled.div`
  background: white;
  border-radius: var(--radius);
  padding: 25px;
  box-shadow: var(--shadow);
  margin-top: 30px;
`;

const DetailsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--light-gray);
  
  h3 {
    margin: 0;
  }
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  background: var(--light-gray);
  border: none;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #dde0e3;
  }
`;

const DetailsContent = styled.div`
  margin-bottom: 25px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--light-gray);
  
  span {
    color: var(--gray-color);
  }
  
  strong {
    font-weight: 600;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const DetailsActions = styled.div`
  display: flex;
  gap: 15px;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 12px;
  background: ${props => props.primary ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.primary ? 'white' : 'var(--dark-color)'};
  border: ${props => props.primary ? 'none' : '1px solid var(--light-gray)'};
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background: ${props => props.primary ? '#E55A2E' : 'var(--light-gray)'};
  }
`;

const QuickActions = styled.div`
  background: white;
  padding: 15px 30px;
  border-top: 1px solid var(--light-gray);
  display: flex;
  justify-content: space-around;
`;

const QuickAction = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: var(--dark-color);
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 10px;
  border-radius: var(--radius);
  
  &:hover {
    background: var(--light-gray);
    transform: translateY(-2px);
    
    svg {
      color: var(--primary-color);
    }
  }
  
  svg {
    width: 24px;
    height: 24px;
  }
  
  span {
    font-size: 12px;
    font-weight: 500;
  }
`;

export default WalterDashboard;