import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaCrown, FaStore, FaSync, FaSignOutAlt, FaTimes, 
  FaServer, FaSearch, FaMoneyBillWave, FaExclamationTriangle, 
  FaDatabase, FaFileInvoiceDollar, FaCheckCircle, FaBan, 
  FaExternalLinkAlt, FaKey, FaPlus, FaUsers, FaChartLine, 
  FaTrash, FaEye, FaCalendarAlt, FaPhone, FaEnvelope, FaBuilding,
  FaShieldAlt, FaLock, FaUnlock, FaUserCog, FaArrowUp,
  FaToggleOn, FaToggleOff, FaEdit, FaCopy, FaFilter,
  FaRupeeSign, FaFileExport, FaDownload, FaPrint,
  FaCogs, FaUserPlus, FaChartBar, FaHistory
} from "react-icons/fa";

// ==========================================
// 🚀 CONFIGURATION
// ==========================================
const getApiBase = () => {
  const host = window.location.hostname;
  return host === "localhost" || host.startsWith("192.168") 
    ? "http://localhost:5000/api" 
    : "https://smart-menu-backend-5ge7.onrender.com/api";
};

// ==========================================
// 👑 MAIN SUPER ADMIN COMPONENT
// ==========================================

const SuperAdmin = () => {
  const navigate = useNavigate();
  const BASE_URL = getApiBase();

  // State Management
  const [activeTab, setActiveTab] = useState("dashboard");
  const [restaurants, setRestaurants] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [timeRange, setTimeRange] = useState("all");
  const [exportFormat, setExportFormat] = useState("csv");
  
  // Stats
  const [stats, setStats] = useState({
    totalPartners: 0,
    totalRevenue: 0,
    activePartners: 0,
    premiumPartners: 0,
    premiumRevenue: 0,
    monthlyRevenue: 0,
    todayRevenue: 0
  });

  // Add Restaurant Form
  const [addForm, setAddForm] = useState({
    restaurantName: "",
    username: "",
    email: "",
    phone: "",
    password: "password123",
    isPro: false,
    trialDays: 30
  });

  // Fetch all partners
  const fetchData = async () => {
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("superAdminToken") || localStorage.getItem("owner_token_ceo");
      
      if (!token) {
        navigate("/ceo-login");
        return;
      }

      const config = {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      };
      
      // Fetch restaurants
      const res = await axios.get(`${BASE_URL}/superadmin/restaurants`, config);
      
      if (Array.isArray(res.data)) {
        setRestaurants(res.data);
        
        // Calculate stats
        const totalRevenue = res.data.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
        const activePartners = res.data.filter(r => r.isActive).length;
        const premiumPartners = res.data.filter(r => r.isPro).length;
        const premiumRevenue = premiumPartners * 999;
        const todayRevenue = res.data.reduce((acc, curr) => {
          const today = new Date().toDateString();
          const createdDate = new Date(curr.createdAt).toDateString();
          return today === createdDate ? acc + (curr.totalRevenue || 0) : acc;
        }, 0);
        
        setStats({
          totalPartners: res.data.length,
          totalRevenue,
          activePartners,
          premiumPartners,
          premiumRevenue,
          monthlyRevenue: totalRevenue / 12,
          todayRevenue
        });
      } else {
        setRestaurants([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      
      if (error.response?.status === 401) {
        setError("Session expired. Redirecting to login...");
        setTimeout(() => navigate("/ceo-login"), 2000);
      } else if (error.response?.status === 403) {
        setError("Access denied. You don't have permission.");
      } else {
        setError("Unable to connect to server. Please check your connection.");
      }
      
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  // Add new partner
  const handleAddPartner = async (formData) => {
    try {
      const token = localStorage.getItem("superAdminToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Prepare data
      const dataToSend = {
        restaurantName: formData.restaurantName,
        username: formData.username,
        email: formData.email || "",
        phone: formData.phone || "",
        password: formData.password,
        isPro: formData.isPro,
        trialDays: formData.trialDays
      };
      
      const response = await axios.post(
        `${BASE_URL}/superadmin/restaurant/add`, 
        dataToSend, 
        config
      );
      
      if (response.data.success) {
        alert("✅ Partner added successfully!");
        fetchData();
        setShowAddModal(false);
        setAddForm({
          restaurantName: "",
          username: "",
          email: "",
          phone: "",
          password: "password123",
          isPro: false,
          trialDays: 30
        });
        return Promise.resolve();
      } else {
        throw new Error(response.data.message || "Failed to add partner");
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  // Handle subscription activation
  const handleActivatePro = async (restaurantId, days, name) => {
    const confirmPay = window.confirm(`Activate PRO plan for ${name}?\n\nDuration: ${days} days`);
    if (!confirmPay) return;

    try {
      const token = localStorage.getItem("superAdminToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.put(`${BASE_URL}/auth/admin/update-subscription/${restaurantId}`, {
        isPro: true,
        extendDays: days
      }, config);
      
      alert(`✅ Success! ${name} is now active for ${days} days.`);
      fetchData();
    } catch (err) {
      alert("❌ Update Failed. Check network.");
    }
  };

  // Handle delete partner
  const handleDeletePartner = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("superAdminToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.delete(`${BASE_URL}/superadmin/delete-owner/${id}`, config);
      alert("✅ Partner deleted successfully!");
      fetchData();
      setSelectedPartner(null);
    } catch (error) {
      alert("❌ Failed to delete: " + (error.response?.data?.message || error.message));
    }
  };

  // Export revenue data
  const handleExportRevenue = () => {
    const data = restaurants.map(r => ({
      Restaurant: r.restaurantName,
      Owner: r.username,
      Status: r.isActive ? 'Active' : 'Inactive',
      Plan: r.isPro ? 'Premium' : 'Basic',
      Revenue: r.totalRevenue || 0,
      Orders: r.orders || 0,
      'Subscription Revenue': r.isPro ? 999 : 0,
      'Created Date': new Date(r.createdAt).toLocaleDateString()
    }));

    if (exportFormat === 'csv') {
      exportToCSV(data);
    } else {
      exportToPDF(data);
    }
  };

  const exportToCSV = (data) => {
    if (data.length === 0) {
      alert("No data to export!");
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = (data) => {
    alert('PDF export would be implemented with a PDF library');
  };

  // Calculate subscription stats
  const getSubscriptionStats = () => {
    const expiringSoon = restaurants.filter(r => {
      if (r.isPro) return false;
      const daysLeft = Math.ceil((new Date(r.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 5 && daysLeft >= 0;
    }).length;

    const expired = restaurants.filter(r => {
      if (r.isPro) return false;
      const daysLeft = Math.ceil((new Date(r.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
      return daysLeft < 0;
    }).length;

    return { expiringSoon, expired };
  };

  // Logout
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("superAdminToken");
      localStorage.removeItem("owner_token_ceo");
      navigate("/ceo-login");
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // 🎨 RENDER COMPONENTS
  // ==========================================

  return (
    <div className="super-admin-layout">
      <style>{cssStyles}</style>
      
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-logo-circle"><FaCrown /></div>
          <div>
            <span className="brand-name">BITEBOX CEO</span>
            <span className="admin-badge">SUPER ADMIN</span>
          </div>
        </div>
        
        <div className="user-profile-mini">
          <div className="avatar-circle">
            <FaShieldAlt />
          </div>
          <div className="user-info">
            <span className="name">Master Administrator</span>
            <span className="role">Full System Access</span>
          </div>
        </div>

        <div className="quick-stats">
          <div className="stat-item">
            <FaUsers />
            <div>
              <span className="number">{stats.totalPartners || 0}</span>
              <span className="label">Partners</span>
            </div>
          </div>
          <div className="stat-item">
            <FaMoneyBillWave />
            <div>
              <span className="number">₹{stats.totalRevenue?.toLocaleString() || 0}</span>
              <span className="label">Revenue</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <label className="nav-label">MAIN NAVIGATION</label>
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <FaChartLine />
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'restaurants' ? 'active' : ''}`}
            onClick={() => setActiveTab('restaurants')}
          >
            <FaStore />
            <span>Partner Management</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveTab('revenue')}
          >
            <FaFileInvoiceDollar />
            <span>Revenue</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscriptions')}
          >
            <FaCrown />
            <span>Subscriptions</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="system-status">
            <div className="status-indicator online"></div>
            <span>System Operational</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt /> <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="content-area">
        <header className="top-bar">
          <div className="header-left">
            <h1>BiteBox CEO Dashboard</h1>
            <p className="breadcrumb">Full System Access • Real-time Data</p>
          </div>
          <div className="header-right">
            <div className="user-menu">
              <span className="welcome">Master Administrator</span>
              <button 
                onClick={fetchData} 
                className="btn-refresh" 
                disabled={loading}
                title="Refresh Data"
              >
                <FaSync className={loading ? 'spin' : ''} />
              </button>
            </div>
          </div>
        </header>

        <div className="page-content">
          {/* Error Alert */}
          {error && (
            <div className="error-alert">
              <FaExclamationTriangle /> {error}
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {/* Loading State */}
          {loading && restaurants.length === 0 ? (
            <div className="loading-screen">
              <div className="spinner-large"></div>
              <p>Loading CEO Dashboard...</p>
              <p className="loading-sub">Fetching partner data from database</p>
            </div>
          ) : (
            <>
              {/* DASHBOARD TAB */}
              {activeTab === 'dashboard' && (
                <div className="fade-in">
                  <div className="dashboard-header">
                    <div>
                      <h1>CEO Dashboard</h1>
                      <p className="subtitle">
                        {new Date().toLocaleDateString('en-IN', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <button onClick={fetchData} className="btn-refresh">
                      <FaSync /> Refresh
                    </button>
                  </div>

                  <div className="stats-grid">
                    <div className="stat-card total-partners">
                      <div className="stat-icon"><FaUsers /></div>
                      <div className="stat-content">
                        <span className="number">{stats.totalPartners}</span>
                        <span className="label">Total Partners</span>
                        <span className="trend">All restaurants in system</span>
                      </div>
                    </div>
                    
                    <div className="stat-card active-partners">
                      <div className="stat-icon"><FaCheckCircle /></div>
                      <div className="stat-content">
                        <span className="number">{stats.activePartners}</span>
                        <span className="label">Active Now</span>
                        <span className="trend">Currently operational</span>
                      </div>
                    </div>
                    
                    <div className="stat-card premium-partners">
                      <div className="stat-icon"><FaCrown /></div>
                      <div className="stat-content">
                        <span className="number">{stats.premiumPartners}</span>
                        <span className="label">Premium Partners</span>
                        <span className="trend">Subscribed plans</span>
                      </div>
                    </div>
                    
                    <div className="stat-card total-revenue">
                      <div className="stat-icon"><FaMoneyBillWave /></div>
                      <div className="stat-content">
                        <span className="number">₹{stats.totalRevenue.toLocaleString()}</span>
                        <span className="label">Total Revenue</span>
                        <span className="trend">All-time collection</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="glass-panel">
                      <div className="panel-header">
                        <h3>Recent Partners</h3>
                        <button 
                          onClick={() => setShowAddModal(true)}
                          className="btn-small"
                        >
                          <FaPlus /> Add New
                        </button>
                      </div>
                      <div className="activity-list">
                        {restaurants.slice(0, 5).map((restaurant) => (
                          <div key={restaurant._id} className="activity-item">
                            <div className="activity-avatar">
                              {restaurant.restaurantName?.charAt(0) || "R"}
                            </div>
                            <div className="activity-details">
                              <div className="activity-title">
                                <strong>{restaurant.restaurantName || "Unnamed Restaurant"}</strong>
                                <span className="activity-time">
                                  Added {new Date(restaurant.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="activity-meta">
                                <span className={`tag status ${restaurant.isPro ? 'premium' : 'basic'}`}>
                                  {restaurant.isPro ? 'Premium' : 'Basic'}
                                </span>
                                <span className="tag revenue">₹{restaurant.totalRevenue?.toLocaleString() || 0}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="glass-panel">
                      <div className="panel-header">
                        <h3>Subscription Status</h3>
                      </div>
                      <div className="subscription-summary">
                        <div className="sub-stat">
                          <div className="sub-label">Active Premium</div>
                          <div className="sub-value">{stats.premiumPartners}</div>
                          <div className="sub-trend">₹{stats.premiumRevenue.toLocaleString()}/mo</div>
                        </div>
                        <div className="sub-stat">
                          <div className="sub-label">Expiring Soon</div>
                          <div className="sub-value">{getSubscriptionStats().expiringSoon}</div>
                          <div className="sub-trend">Within 5 days</div>
                        </div>
                        <div className="sub-stat">
                          <div className="sub-label">Expired Trials</div>
                          <div className="sub-value">{getSubscriptionStats().expired}</div>
                          <div className="sub-trend">Needs attention</div>
                        </div>
                      </div>
                      <div className="quick-actions">
                        <button 
                          onClick={() => setActiveTab('subscriptions')}
                          className="action-btn primary"
                        >
                          <FaCrown /> Manage Subscriptions
                        </button>
                        <button 
                          onClick={() => setActiveTab('revenue')}
                          className="action-btn"
                        >
                          <FaChartBar /> View Revenue
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PARTNER MANAGEMENT TAB */}
              {activeTab === 'restaurants' && (
                <div className="fade-in">
                  <div className="section-header">
                    <div>
                      <h1>Partner Management</h1>
                      <p className="subtitle">Manage all restaurant partners in the system</p>
                    </div>
                    <div className="header-actions">
                      <div className="search-wrapper">
                        <FaSearch />
                        <input
                          type="text"
                          placeholder="Search restaurants..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <button onClick={() => setShowAddModal(true)} className="btn-primary" disabled={loading}>
                        <FaPlus /> Add Partner
                      </button>
                    </div>
                  </div>

                  <div className="table-container">
                    {loading ? (
                      <div className="loading-table">
                        <div className="spinner"></div>
                        <p>Loading partner data...</p>
                      </div>
                    ) : (
                      <>
                        <div className="table-responsive">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Restaurant</th>
                                <th>Owner</th>
                                <th>Plan</th>
                                <th>Revenue</th>
                                <th>Created</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {restaurants
                                .filter(r => 
                                  (r.restaurantName || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (r.username || "").toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map(partner => (
                                <tr key={partner._id} className="table-row">
                                  <td>
                                    <div className="restaurant-cell">
                                      <div className="avatar">{partner.restaurantName?.charAt(0) || "R"}</div>
                                      <div className="restaurant-info">
                                        <strong>{partner.restaurantName || "Unnamed Restaurant"}</strong>
                                        <span className="restaurant-id">ID: {partner._id?.substring(0, 8)}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="owner-cell">
                                      <div className="owner-name">@{partner.username}</div>
                                      <div className="owner-email">{partner.email || "No email"}</div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`plan-badge ${partner.isPro ? 'premium' : 'basic'}`}>
                                      {partner.isPro ? 'Premium' : 'Basic'}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="revenue-cell">
                                      <div className="revenue-amount">₹{partner.totalRevenue?.toLocaleString() || 0}</div>
                                      <div className="revenue-meta">{partner.orders || 0} orders</div>
                                    </div>
                                  </td>
                                  <td>
                                    {new Date(partner.createdAt).toLocaleDateString()}
                                  </td>
                                  <td>
                                    <div className="action-buttons">
                                      <button 
                                        onClick={() => setSelectedPartner(partner)}
                                        className="btn-action view"
                                        title="View Details"
                                      >
                                        <FaEye />
                                      </button>
                                      <button 
                                        onClick={() => handleDeletePartner(partner._id, partner.restaurantName)}
                                        className="btn-action delete"
                                        title="Delete"
                                      >
                                        <FaTrash />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {restaurants.length === 0 && (
                          <div className="empty-table">
                            <div className="empty-state">
                              <FaStore size={48} />
                              <h3>No partners found</h3>
                              <p>Add your first partner to get started</p>
                              <button onClick={() => setShowAddModal(true)} className="btn-primary">
                                <FaPlus /> Add First Partner
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* REVENUE TAB */}
              {activeTab === 'revenue' && (
                <div className="fade-in">
                  <div className="section-header">
                    <div>
                      <h1>Revenue Dashboard</h1>
                      <p className="subtitle">Complete financial overview and reporting</p>
                    </div>
                    <div className="header-actions">
                      <div className="filter-group">
                        <select 
                          value={timeRange} 
                          onChange={(e) => setTimeRange(e.target.value)}
                          className="select-filter"
                        >
                          <option value="all">All Time</option>
                          <option value="month">This Month</option>
                          <option value="year">This Year</option>
                        </select>
                        <select 
                          value={exportFormat} 
                          onChange={(e) => setExportFormat(e.target.value)}
                          className="select-filter"
                        >
                          <option value="csv">CSV</option>
                          <option value="pdf">PDF</option>
                        </select>
                      </div>
                      <button onClick={handleExportRevenue} className="btn-primary">
                        <FaFileExport /> Export Report
                      </button>
                    </div>
                  </div>

                  <div className="stats-grid revenue-grid">
                    <div className="stat-card total-revenue-card">
                      <div className="stat-icon">
                        <FaMoneyBillWave />
                      </div>
                      <div className="stat-content">
                        <span className="number">₹{stats.totalRevenue.toLocaleString()}</span>
                        <span className="label">Total Revenue</span>
                        <span className="trend">All-time collection</span>
                      </div>
                    </div>
                    
                    <div className="stat-card premium-revenue-card">
                      <div className="stat-icon">
                        <FaCrown />
                      </div>
                      <div className="stat-content">
                        <span className="number">₹{stats.premiumRevenue.toLocaleString()}</span>
                        <span className="label">Subscription Revenue</span>
                        <span className="trend">From premium partners</span>
                      </div>
                    </div>
                    
                    <div className="stat-card avg-revenue-card">
                      <div className="stat-icon">
                        <FaChartLine />
                      </div>
                      <div className="stat-content">
                        <span className="number">₹{stats.totalPartners > 0 ? Math.round(stats.totalRevenue / stats.totalPartners) : 0}</span>
                        <span className="label">Average per Partner</span>
                        <span className="trend">Mean revenue</span>
                      </div>
                    </div>
                    
                    <div className="stat-card today-revenue-card">
                      <div className="stat-icon">
                        <FaCalendarAlt />
                      </div>
                      <div className="stat-content">
                        <span className="number">₹{stats.todayRevenue.toLocaleString()}</span>
                        <span className="label">Today's Revenue</span>
                        <span className="trend">From new partners</span>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Breakdown */}
                  <div className="glass-panel">
                    <div className="panel-header">
                      <h3>Revenue Breakdown</h3>
                    </div>
                    <div className="revenue-breakdown">
                      <div className="breakdown-item">
                        <div className="breakdown-label">
                          <div className="color-dot premium"></div>
                          <span>Premium Subscriptions</span>
                        </div>
                        <div className="breakdown-value">
                          ₹{stats.premiumRevenue.toLocaleString()}
                          <span className="percentage">
                            {stats.totalRevenue > 0 ? 
                              Math.round((stats.premiumRevenue / stats.totalRevenue) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      <div className="breakdown-item">
                        <div className="breakdown-label">
                          <div className="color-dot basic"></div>
                          <span>Partner Revenue</span>
                        </div>
                        <div className="breakdown-value">
                          ₹{(stats.totalRevenue - stats.premiumRevenue).toLocaleString()}
                          <span className="percentage">
                            {stats.totalRevenue > 0 ? 
                              Math.round(((stats.totalRevenue - stats.premiumRevenue) / stats.totalRevenue) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Partners */}
                  <div className="glass-panel">
                    <div className="panel-header">
                      <h3>Top Performing Partners</h3>
                    </div>
                    <div className="top-partners">
                      {restaurants
                        .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
                        .slice(0, 5)
                        .map((partner, index) => (
                          <div key={partner._id} className="partner-row">
                            <div className="partner-rank">#{index + 1}</div>
                            <div className="partner-info">
                              <div className="partner-name">{partner.restaurantName}</div>
                              <div className="partner-plan">{partner.isPro ? 'Premium' : 'Basic'}</div>
                            </div>
                            <div className="partner-revenue">₹{(partner.totalRevenue || 0).toLocaleString()}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SUBSCRIPTIONS TAB */}
              {activeTab === 'subscriptions' && (
                <div className="fade-in">
                  <div className="section-header">
                    <div>
                      <h1>Subscription Management</h1>
                      <p className="subtitle">Manage partner subscriptions and payments</p>
                    </div>
                  </div>

                  <div className="subscription-stats">
                    <div className="sub-stat-card premium">
                      <h3>Premium Partners</h3>
                      <div className="sub-stat-value">{stats.premiumPartners}</div>
                      <div className="sub-stat-label">Active Subscriptions</div>
                    </div>
                    <div className="sub-stat-card revenue">
                      <h3>Monthly Revenue</h3>
                      <div className="sub-stat-value">₹{stats.premiumRevenue.toLocaleString()}</div>
                      <div className="sub-stat-label">From Subscriptions</div>
                    </div>
                    <div className="sub-stat-card expiring">
                      <h3>Expiring Soon</h3>
                      <div className="sub-stat-value">{getSubscriptionStats().expiringSoon}</div>
                      <div className="sub-stat-label">Within 5 days</div>
                    </div>
                  </div>

                  <div className="glass-panel">
                    <div className="panel-header">
                      <h3>All Partners</h3>
                      <input
                        type="text"
                        placeholder="Search partners..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input-small"
                      />
                    </div>
                    <div className="subscription-list">
                      {restaurants
                        .filter(r => 
                          (r.restaurantName || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (r.username || "").toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map(partner => {
                          const daysLeft = partner.trialEndsAt 
                            ? Math.ceil((new Date(partner.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))
                            : 0;
                          const isExpired = daysLeft < 0;
                          const isUrgent = daysLeft <= 5 && !partner.isPro;
                          
                          return (
                            <div key={partner._id} className="subscription-item">
                              <div className="sub-info">
                                <div className="sub-name">
                                  <strong>{partner.restaurantName}</strong>
                                  <span className="sub-owner">@{partner.username}</span>
                                </div>
                                <div className="sub-status">
                                  <span className={`status-badge ${partner.isPro ? 'premium' : 'trial'}`}>
                                    {partner.isPro ? 'Premium' : 'Trial'}
                                  </span>
                                  <span className={`days-badge ${isUrgent ? 'urgent' : isExpired ? 'expired' : 'normal'}`}>
                                    {partner.isPro ? 'Active' : isExpired ? `Expired ${Math.abs(daysLeft)} days ago` : `${daysLeft} days left`}
                                  </span>
                                </div>
                              </div>
                              <div className="sub-actions">
                                {!partner.isPro ? (
                                  <>
                                    <button 
                                      onClick={() => handleActivatePro(partner._id, 30, partner.restaurantName)}
                                      className="btn-subscription month"
                                    >
                                      <FaMoneyBillWave /> 1 Month
                                    </button>
                                    <button 
                                      onClick={() => handleActivatePro(partner._id, 365, partner.restaurantName)}
                                      className="btn-subscription year"
                                    >
                                      <FaCrown /> 1 Year
                                    </button>
                                  </>
                                ) : (
                                  <span className="active-label">Active Premium</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ADD PARTNER MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content add-modal">
            <div className="modal-header">
              <h2><FaUserPlus /> Add New Partner</h2>
              <button onClick={() => setShowAddModal(false)} className="btn-close"><FaTimes /></button>
            </div>
            
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Restaurant Name *</label>
                  <input 
                    type="text" 
                    placeholder="Enter restaurant name"
                    value={addForm.restaurantName}
                    onChange={(e) => setAddForm({...addForm, restaurantName: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Owner Username *</label>
                  <input 
                    type="text" 
                    placeholder="Choose a username"
                    value={addForm.username}
                    onChange={(e) => setAddForm({...addForm, username: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="owner@example.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="+91 9876543210"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({...addForm, phone: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Password *</label>
                  <input 
                    type="text" 
                    placeholder="At least 6 characters"
                    value={addForm.password}
                    onChange={(e) => setAddForm({...addForm, password: e.target.value})}
                    required
                  />
                  <div className="form-hint">Default: password123</div>
                </div>
                
                <div className="form-group">
                  <label>Trial Days</label>
                  <input 
                    type="number" 
                    placeholder="30"
                    value={addForm.trialDays}
                    onChange={(e) => setAddForm({...addForm, trialDays: parseInt(e.target.value) || 30})}
                    min="1"
                    max="365"
                  />
                  <div className="form-hint">Free trial period in days</div>
                </div>
                
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={addForm.isPro}
                      onChange={(e) => setAddForm({...addForm, isPro: e.target.checked})}
                    />
                    <span>Premium Partner (₹999/year)</span>
                  </label>
                  <div className="form-hint">Unchecked = Basic Plan (Free trial)</div>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  onClick={() => handleAddPartner(addForm)}
                  className="btn-submit"
                  disabled={!addForm.restaurantName || !addForm.username || !addForm.password}
                >
                  <FaPlus /> Create Partner Account
                </button>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PARTNER DETAIL MODAL */}
      {selectedPartner && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">
                <h2>
                  <div className="partner-avatar-large">
                    {selectedPartner.restaurantName?.charAt(0) || "R"}
                  </div>
                  {selectedPartner.restaurantName || "Unnamed Restaurant"}
                </h2>
                <div className="partner-tags">
                  <span className={`tag ${selectedPartner.isPro ? 'premium' : 'basic'}`}>
                    {selectedPartner.isPro ? 'Premium' : 'Basic'}
                  </span>
                  <span className="tag id">ID: {selectedPartner._id?.substring(0, 10)}...</span>
                </div>
              </div>
              <button onClick={() => setSelectedPartner(null)} className="btn-close">
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="info-sections">
                <div className="info-section">
                  <h3><FaBuilding /> Restaurant Details</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Restaurant Name</label>
                      <div className="info-value">{selectedPartner.restaurantName || "Not set"}</div>
                    </div>
                    <div className="info-item">
                      <label>Owner Username</label>
                      <div className="info-value">@{selectedPartner.username}</div>
                    </div>
                    <div className="info-item">
                      <label>Email</label>
                      <div className="info-value">{selectedPartner.email || "Not set"}</div>
                    </div>
                    <div className="info-item">
                      <label>Phone</label>
                      <div className="info-value">{selectedPartner.phone || "Not set"}</div>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h3><FaChartLine /> Performance</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Total Revenue</label>
                      <div className="info-value revenue">₹{selectedPartner.totalRevenue?.toLocaleString() || 0}</div>
                    </div>
                    <div className="info-item">
                      <label>Total Orders</label>
                      <div className="info-value">{selectedPartner.orders || 0}</div>
                    </div>
                    <div className="info-item">
                      <label>Subscription Plan</label>
                      <div className={`info-value plan ${selectedPartner.isPro ? 'premium' : 'basic'}`}>
                        {selectedPartner.isPro ? 'Premium (₹999/year)' : 'Basic'}
                      </div>
                    </div>
                    <div className="info-item">
                      <label>Trial Ends</label>
                      <div className="info-value">
                        {selectedPartner.trialEndsAt ? new Date(selectedPartner.trialEndsAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="action-section">
                <h3><FaCogs /> Actions</h3>
                <div className="action-grid">
                  {!selectedPartner.isPro && (
                    <>
                      <button 
                        onClick={() => handleActivatePro(selectedPartner._id, 30, selectedPartner.restaurantName)}
                        className="action-btn primary"
                      >
                        <FaMoneyBillWave /> Activate 1 Month
                      </button>
                      <button 
                        onClick={() => handleActivatePro(selectedPartner._id, 365, selectedPartner.restaurantName)}
                        className="action-btn success"
                      >
                        <FaCrown /> Activate 1 Year
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => {
                      if (window.confirm(`Delete ${selectedPartner.restaurantName}?`)) {
                        handleDeletePartner(selectedPartner._id, selectedPartner.restaurantName);
                      }
                    }}
                    className="action-btn danger"
                  >
                    <FaTrash /> Delete Partner
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 🎨 CSS STYLES
// ==========================================
const cssStyles = `
/* Super Admin Dashboard Styles */

:root {
  --bg-dark: #050505;
  --bg-darker: #030303;
  --bg-panel: #111111;
  --bg-card: #1a1a1a;
  --border: #222222;
  --border-light: #333333;
  --primary: #f97316;
  --primary-dark: #ea580c;
  --success: #22c55e;
  --success-dark: #16a34a;
  --danger: #ef4444;
  --warning: #f59e0b;
  --info: #3b82f6;
  --text: #ffffff;
  --text-muted: #888888;
  --text-light: #cccccc;
}

/* Layout */
.super-admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-darker);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Sidebar */
.sidebar {
  width: 280px;
  background: var(--bg-dark);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 100;
}

.content-area {
  margin-left: 280px;
  flex: 1;
  background: var(--bg-darker);
}

.page-content {
  padding: 30px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* Top Bar */
.top-bar {
  background: var(--bg-dark);
  border-bottom: 1px solid var(--border);
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(10px);
}

.top-bar h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary), #fbbf24);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.breadcrumb {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Sidebar Components */
.sidebar-header {
  padding: 25px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo-circle {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.brand-name {
  font-size: 16px;
  font-weight: 800;
  display: block;
}

.admin-badge {
  background: var(--primary);
  color: white;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 8px;
}

.user-profile-mini {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border);
}

.avatar-circle {
  width: 45px;
  height: 45px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.user-info .name {
  font-weight: 600;
  font-size: 15px;
  display: block;
}

.user-info .role {
  font-size: 12px;
  color: var(--primary);
  font-weight: 500;
  display: block;
}

.quick-stats {
  padding: 20px;
  border-bottom: 1px solid var(--border);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.stat-item svg {
  color: var(--primary);
  font-size: 20px;
}

.stat-item .number {
  font-size: 18px;
  font-weight: 700;
  display: block;
}

.stat-item .label {
  font-size: 12px;
  color: var(--text-muted);
  display: block;
}

.sidebar-nav {
  padding: 20px 0;
  flex: 1;
}

.nav-label {
  font-size: 11px;
  font-weight: 800;
  color: var(--text-muted);
  padding: 0 20px;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.nav-item {
  background: transparent;
  border: none;
  width: 100%;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255,255,255,0.03);
  color: var(--text-light);
}

.nav-item.active {
  background: rgba(249, 115, 22, 0.1);
  color: var(--primary);
  border-right: 3px solid var(--primary);
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid var(--border);
}

.system-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  font-size: 13px;
  color: var(--text-muted);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.online {
  background: var(--success);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}

.logout-btn {
  width: 100%;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--danger);
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s;
  font-size: 14px;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-1px);
}

/* Dashboard */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
}

.subtitle {
  color: var(--text-muted);
  margin-top: 4px;
}

.btn-refresh {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 12px 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
}

.btn-refresh:hover {
  background: rgba(255,255,255,0.05);
  border-color: var(--border-light);
}

.btn-refresh .spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-light);
}

.stat-icon {
  width: 56px;
  height: 56px;
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--primary);
}

.stat-card.active-partners .stat-icon { color: var(--success); }
.stat-card.premium-partners .stat-icon { color: var(--warning); }
.stat-card.total-revenue .stat-icon { color: var(--info); }

.stat-content .number {
  font-size: 28px;
  font-weight: 800;
  display: block;
  line-height: 1;
}

.stat-content .label {
  font-size: 14px;
  color: var(--text-muted);
  display: block;
  margin-top: 4px;
}

.stat-content .trend {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* Grid Layout */
.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-top: 30px;
}

/* Glass Panel */
.glass-panel {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border);
  transition: all 0.2s;
}

.activity-item:hover {
  border-color: var(--border-light);
  transform: translateX(2px);
}

.activity-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  font-size: 16px;
  flex-shrink: 0;
}

.activity-details {
  flex: 1;
}

.activity-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-title strong {
  font-size: 14px;
}

.activity-time {
  font-size: 12px;
  color: var(--text-muted);
}

.activity-meta {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.tag {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.tag.username {
  background: rgba(100, 116, 139, 0.15);
  color: #64748b;
}

.tag.status.active {
  background: rgba(34, 197, 94, 0.15);
  color: var(--success);
}

.tag.status.inactive {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
}

.tag.premium {
  background: rgba(249, 115, 22, 0.15);
  color: var(--primary);
}

.tag.basic {
  background: rgba(100, 116, 139, 0.15);
  color: #64748b;
}

.tag.revenue {
  background: rgba(34, 197, 94, 0.15);
  color: var(--success);
}

/* Subscription Summary */
.subscription-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.sub-stat {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 15px;
  border-radius: 10px;
  text-align: center;
}

.sub-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 5px;
}

.sub-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 5px;
}

.sub-trend {
  font-size: 11px;
  color: var(--text-muted);
}

.quick-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.action-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  transition: all 0.2s;
  font-size: 14px;
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

/* Section Header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.section-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-wrapper {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 10px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 300px;
}

.search-wrapper input {
  background: transparent;
  border: none;
  color: var(--text);
  font-size: 14px;
  width: 100%;
  outline: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(249, 115, 22, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Table Container */
.table-container {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}

.loading-table {
  padding: 60px;
  text-align: center;
  color: var(--text-muted);
}

.loading-table .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

/* Table Styles */
.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 1000px;
}

.data-table thead {
  background: var(--bg-card);
}

.data-table th {
  padding: 16px;
  text-align: left;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--border);
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.table-row:hover {
  background: rgba(255,255,255,0.02);
}

/* Table Cells */
.restaurant-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.restaurant-info {
  display: flex;
  flex-direction: column;
}

.restaurant-info strong {
  font-size: 15px;
  margin-bottom: 2px;
}

.restaurant-id {
  font-size: 11px;
  color: var(--text-muted);
}

.owner-cell {
  display: flex;
  flex-direction: column;
}

.owner-name {
  font-weight: 600;
  font-size: 14px;
}

.owner-email {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* Status Badges */
.status-badge, .plan-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.plan-badge.premium {
  background: rgba(249, 115, 22, 0.15);
  color: var(--primary);
}

.plan-badge.basic {
  background: rgba(100, 116, 139, 0.15);
  color: #64748b;
}

.status-badge.premium {
  background: rgba(249, 115, 22, 0.15);
  color: var(--primary);
}

.status-badge.trial {
  background: rgba(100, 116, 139, 0.15);
  color: #64748b;
}

/* Revenue Cell */
.revenue-cell {
  display: flex;
  flex-direction: column;
}

.revenue-amount {
  font-size: 16px;
  font-weight: 700;
  color: var(--success);
}

.revenue-meta {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-action {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 14px;
}

.btn-action.view {
  background: rgba(59, 130, 246, 0.1);
  color: var(--info);
}

.btn-action.delete {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.btn-action:hover {
  transform: translateY(-2px);
  opacity: 0.8;
}

/* Empty Table */
.empty-table {
  text-align: center;
  padding: 60px 20px;
}

.empty-state {
  max-width: 400px;
  margin: 0 auto;
}

.empty-state svg {
  color: var(--text-muted);
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.empty-state p {
  color: var(--text-muted);
  margin-bottom: 20px;
}

/* Error Alert */
.error-alert {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1));
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fca5a5;
}

.error-alert button {
  margin-left: auto;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.error-alert button:hover {
  background: rgba(239, 68, 68, 0.3);
}

/* Loading Screen */
.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.spinner-large {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255,255,255,0.1);
  border-radius: 50%;
  border-top-color: var(--primary);
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-sub {
  font-size: 14px;
  color: var(--text-muted);
  margin-top: 8px;
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 20px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlide 0.3s ease-out;
}

@keyframes modalSlide {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.add-modal {
  max-width: 600px;
}

.modal-header {
  padding: 28px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-title {
  flex: 1;
}

.modal-title h2 {
  display: flex;
  align-items: center;
  gap: 20px;
}

.partner-avatar-large {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  font-size: 24px;
}

.partner-tags {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.btn-close {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close:hover {
  background: rgba(255,255,255,0.1);
  transform: rotate(90deg);
}

/* Modal Body */
.modal-body {
  padding: 28px;
}

/* Info Sections */
.info-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

.info-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
}

.info-section h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
}

.info-value.revenue {
  color: var(--success);
  font-size: 16px;
  font-weight: 700;
}

.info-value.plan.premium {
  color: var(--primary);
}

.info-value.plan.basic {
  color: var(--text-muted);
}

/* Action Section */
.action-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
}

.action-section h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.action-btn.success {
  background: linear-gradient(135deg, var(--success), var(--success-dark));
  color: white;
}

.action-btn.danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  opacity: 0.9;
}

/* Add Partner Form */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-light);
}

.form-group input {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  color: var(--text);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.form-group input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

.form-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.checkbox-group {
  margin-top: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  padding: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: all 0.2s;
}

.checkbox-label:hover {
  border-color: var(--primary);
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 30px;
}

.btn-submit {
  flex: 1;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  border: none;
  color: white;
  padding: 16px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(249, 115, 22, 0.4);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  flex: 1;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
  padding: 16px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel:hover:not(:disabled) {
  background: rgba(255,255,255,0.05);
}

/* Revenue Styles */
.revenue-grid .stat-card {
  border-left: 4px solid var(--primary);
}

.revenue-grid .total-revenue-card {
  border-left-color: #22c55e;
}

.revenue-grid .premium-revenue-card {
  border-left-color: #f97316;
}

.revenue-grid .avg-revenue-card {
  border-left-color: #3b82f6;
}

.revenue-grid .today-revenue-card {
  border-left-color: #8b5cf6;
}

.filter-group {
  display: flex;
  gap: 10px;
}

.select-filter {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}

.revenue-breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.breakdown-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.color-dot.premium {
  background: #f97316;
}

.color-dot.basic {
  background: #64748b;
}

.breakdown-value {
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

.percentage {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
}

.top-partners {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.partner-row {
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.partner-rank {
  background: var(--primary);
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-right: 15px;
}

.partner-info {
  flex: 1;
}

.partner-name {
  font-weight: 600;
  font-size: 14px;
}

.partner-plan {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.partner-revenue {
  font-size: 16px;
  font-weight: 700;
  color: var(--success);
}

/* Subscription Styles */
.subscription-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.sub-stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.sub-stat-card.premium {
  border-left: 4px solid var(--primary);
}

.sub-stat-card.revenue {
  border-left: 4px solid #22c55e;
}

.sub-stat-card.expiring {
  border-left: 4px solid #ef4444;
}

.sub-stat-card h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: var(--text-muted);
}

.sub-stat-value {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 5px;
}

.sub-stat-label {
  font-size: 12px;
  color: var(--text-muted);
}

.search-input-small {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 10px 16px;
  border-radius: 8px;
  color: var(--text);
  font-size: 14px;
  outline: none;
  width: 200px;
}

.subscription-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 500px;
  overflow-y: auto;
}

.subscription-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: var(--bg-card);
  border-radius: 10px;
  border: 1px solid var(--border);
}

.sub-info {
  flex: 1;
}

.sub-name {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sub-name strong {
  font-size: 16px;
}

.sub-owner {
  font-size: 12px;
  color: var(--text-muted);
}

.sub-status {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.days-badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.days-badge.urgent {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
}

.days-badge.expired {
  background: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
}

.days-badge.normal {
  background: rgba(100, 116, 139, 0.15);
  color: #64748b;
}

.sub-actions {
  display: flex;
  gap: 10px;
}

.btn-subscription {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.btn-subscription.month {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.btn-subscription.year {
  background: rgba(249, 115, 22, 0.1);
  color: var(--primary);
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.btn-subscription:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

.active-label {
  padding: 8px 16px;
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 1200px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 992px) {
  .sidebar {
    width: 250px;
  }
  
  .content-area {
    margin-left: 250px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
  
  .content-area {
    margin-left: 0;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .search-wrapper {
    width: 100%;
  }
  
  .btn-primary {
    width: 100%;
    justify-content: center;
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .info-sections {
    grid-template-columns: 1fr;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .subscription-summary {
    grid-template-columns: 1fr;
  }
  
  .subscription-stats {
    grid-template-columns: 1fr;
  }
  
  .subscription-item {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .sub-actions {
    width: 100%;
  }
  
  .btn-subscription {
    flex: 1;
  }
}
`;

export default SuperAdmin;