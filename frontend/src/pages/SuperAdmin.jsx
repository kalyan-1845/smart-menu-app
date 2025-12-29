import React, { useState, useEffect } from "react";
import { 
  FaCrown, FaStore, FaSync, FaSignOutAlt, FaTimes, 
  FaServer, FaSearch, FaMoneyBillWave, FaExclamationTriangle, 
  FaDatabase, FaFileInvoiceDollar, FaCheckCircle, FaBan, 
  FaExternalLinkAlt, FaKey, FaPlus, FaUsers, FaChartLine, 
  FaTrash, FaEye, FaCalendarAlt, FaPhone, FaEnvelope, FaBuilding,
  FaShieldAlt, FaLock, FaUnlock, FaUserCog, FaArrowUp,
  FaToggleOn, FaToggleOff, FaEdit, FaCopy
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
// 🧩 SUB-COMPONENTS
// ==========================================

// 1. SIDEBAR
const Sidebar = ({ activeTab, setActiveTab, onLogout, stats }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaChartLine /> },
    { id: 'restaurants', label: 'Partner Management', icon: <FaStore /> },
    { id: 'revenue', label: 'Revenue', icon: <FaFileInvoiceDollar /> },
    { id: 'system', label: 'System', icon: <FaServer /> },
  ];

  return (
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
        {menuItems.map(item => (
          <button 
            key={item.id} 
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <div className="status-indicator online"></div>
          <span>System Operational</span>
        </div>
        <button onClick={onLogout} className="logout-btn">
          <FaSignOutAlt /> <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

// 2. DASHBOARD OVERVIEW
const DashboardOverview = ({ restaurants, refreshData }) => {
  const totalRevenue = restaurants.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
  const activePartners = restaurants.filter(r => r.isActive).length;
  const premiumPartners = restaurants.filter(r => r.isPro).length;
  const today = new Date().toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="fade-in">
      <div className="dashboard-header">
        <div>
          <h1>CEO Dashboard</h1>
          <p className="subtitle">Complete control panel • {today}</p>
        </div>
        <button onClick={refreshData} className="btn-refresh">
          <FaSync /> Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card total-partners">
          <div className="stat-icon"><FaUsers /></div>
          <div className="stat-content">
            <span className="number">{restaurants.length}</span>
            <span className="label">Total Partners</span>
            <span className="trend">All restaurants in system</span>
          </div>
        </div>
        
        <div className="stat-card active-partners">
          <div className="stat-icon"><FaCheckCircle /></div>
          <div className="stat-content">
            <span className="number">{activePartners}</span>
            <span className="label">Active Now</span>
            <span className="trend">Currently operational</span>
          </div>
        </div>
        
        <div className="stat-card premium-partners">
          <div className="stat-icon"><FaCrown /></div>
          <div className="stat-content">
            <span className="number">{premiumPartners}</span>
            <span className="label">Premium Partners</span>
            <span className="trend">Subscribed plans</span>
          </div>
        </div>
        
        <div className="stat-card total-revenue">
          <div className="stat-icon"><FaMoneyBillWave /></div>
          <div className="stat-content">
            <span className="number">₹{totalRevenue.toLocaleString()}</span>
            <span className="label">Total Revenue</span>
            <span className="trend">All-time collection</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="glass-panel">
          <div className="panel-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="activity-list">
            {restaurants.slice(0, 4).map((restaurant, index) => (
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
                    <span className="tag username">@{restaurant.username}</span>
                    <span className={`tag status ${restaurant.isActive ? 'active' : 'inactive'}`}>
                      {restaurant.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel">
          <div className="panel-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions-grid">
            <button className="quick-action-btn add-partner">
              <FaPlus />
              <span>Add New Partner</span>
            </button>
            <button className="quick-action-btn view-reports">
              <FaChartLine />
              <span>View Reports</span>
            </button>
            <button className="quick-action-btn system-health">
              <FaServer />
              <span>System Health</span>
            </button>
            <button className="quick-action-btn export-data">
              <FaCopy />
              <span>Export Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. PARTNER MANAGEMENT TABLE
const PartnerManagement = ({ 
  restaurants, 
  onSelectPartner, 
  searchQuery, 
  setSearchQuery, 
  onAddPartner,
  loading 
}) => {
  const filteredRestaurants = restaurants.filter(r => 
    (r.restaurantName || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
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
          <button onClick={onAddPartner} className="btn-primary" disabled={loading}>
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
                    <th>Status</th>
                    <th>Plan</th>
                    <th>Revenue</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRestaurants.map(partner => (
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
                        <span className={`status-badge ${partner.isActive ? 'active' : 'inactive'}`}>
                          {partner.isActive ? (
                            <>Active <FaCheckCircle /></>
                          ) : (
                            <>Inactive <FaBan /></>
                          )}
                        </span>
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
                        <div className="action-buttons">
                          <button 
                            onClick={() => onSelectPartner(partner)}
                            className="btn-action view"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button 
                            className="btn-action edit"
                            title="Edit"
                            onClick={() => alert(`Edit ${partner.restaurantName}`)}
                          >
                            <FaEdit />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredRestaurants.length === 0 && (
              <div className="empty-table">
                <div className="empty-state">
                  <FaStore size={48} />
                  <h3>No partners found</h3>
                  <p>Try adjusting your search or add your first partner</p>
                  <button onClick={onAddPartner} className="btn-primary">
                    <FaPlus /> Add First Partner
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// 4. PARTNER DETAIL MODAL
const PartnerDetailModal = ({ partner, onClose, onAction }) => {
  if (!partner) return null;

  const handleBlockToggle = () => {
    onAction('TOGGLE_BLOCK', partner._id);
  };

  const handlePasswordReset = () => {
    const newPass = prompt(`Enter new password for ${partner.username}:`, "password123");
    if (newPass && newPass.length >= 6) {
      onAction('RESET_PASS', partner._id, newPass);
    } else if (newPass) {
      alert("Password must be at least 6 characters");
    }
  };

  const handleExtendPlan = () => {
    if (window.confirm(`Extend premium plan for ${partner.restaurantName}?`)) {
      onAction('EXTEND', partner._id);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`PERMANENTLY delete ${partner.restaurantName}?\n\nThis cannot be undone!`)) {
      onAction('DELETE', partner._id);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">
            <h2>
              <div className="partner-avatar-large">
                {partner.restaurantName?.charAt(0) || "R"}
              </div>
              {partner.restaurantName || "Unnamed Restaurant"}
            </h2>
            <div className="partner-tags">
              <span className={`tag ${partner.isActive ? 'active' : 'inactive'}`}>
                {partner.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className={`tag ${partner.isPro ? 'premium' : 'basic'}`}>
                {partner.isPro ? 'Premium' : 'Basic'}
              </span>
              <span className="tag id">ID: {partner._id?.substring(0, 10)}...</span>
            </div>
          </div>
          <button onClick={onClose} className="btn-close">
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
                  <div className="info-value">{partner.restaurantName || "Not set"}</div>
                </div>
                <div className="info-item">
                  <label>Owner Username</label>
                  <div className="info-value">@{partner.username}</div>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <div className="info-value">{partner.email || "Not set"}</div>
                </div>
                <div className="info-item">
                  <label>Phone</label>
                  <div className="info-value">{partner.phone || "Not set"}</div>
                </div>
                <div className="info-item">
                  <label>Created On</label>
                  <div className="info-value">
                    {new Date(partner.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3><FaChartLine /> Performance</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Total Revenue</label>
                  <div className="info-value revenue">₹{partner.totalRevenue?.toLocaleString() || 0}</div>
                </div>
                <div className="info-item">
                  <label>Total Orders</label>
                  <div className="info-value">{partner.orders || 0}</div>
                </div>
                <div className="info-item">
                  <label>Account Status</label>
                  <div className={`info-value status ${partner.isActive ? 'active' : 'inactive'}`}>
                    {partner.isActive ? 'Active' : 'Blocked'}
                  </div>
                </div>
                <div className="info-item">
                  <label>Subscription Plan</label>
                  <div className={`info-value plan ${partner.isPro ? 'premium' : 'basic'}`}>
                    {partner.isPro ? 'Premium (₹999/year)' : 'Basic'}
                  </div>
                </div>
                <div className="info-item">
                  <label>Subscription Ends</label>
                  <div className="info-value">
                    {partner.trialEndsAt ? new Date(partner.trialEndsAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="action-section">
            <h3><FaShieldAlt /> Management Actions</h3>
            <div className="action-grid">
              <button 
                onClick={handleBlockToggle}
                className={`action-btn ${partner.isActive ? 'danger' : 'success'}`}
              >
                {partner.isActive ? (
                  <>
                    <FaBan /> Block Access
                  </>
                ) : (
                  <>
                    <FaUnlock /> Unblock Access
                  </>
                )}
              </button>
              
              <button 
                onClick={handlePasswordReset}
                className="action-btn warning"
              >
                <FaLock /> Reset Password
              </button>
              
              <button 
                onClick={handleExtendPlan}
                className="action-btn primary"
              >
                <FaCalendarAlt /> Extend Plan
              </button>
              
              <button 
                onClick={handleDelete}
                className="action-btn danger"
              >
                <FaTrash /> Delete Partner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. ADD PARTNER MODAL
const AddPartnerModal = ({ show, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    restaurantName: "",
    username: "",
    email: "",
    phone: "",
    password: "password123",
    isPro: false
  });

  const [loading, setLoading] = useState(false);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.restaurantName.trim() || !formData.username.trim() || !formData.password.trim()) {
      alert("Please fill Restaurant Name, Username, and Password!");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters!");
      return;
    }

    setLoading(true);
    try {
      await onAdd(formData);
      onClose();
    } catch (error) {
      alert("Failed to add partner: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content add-modal">
        <div className="modal-header">
          <h2><FaPlus /> Add New Partner</h2>
          <button onClick={onClose} className="btn-close"><FaTimes /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Restaurant Name *</label>
                <input 
                  type="text" 
                  placeholder="Enter restaurant name"
                  value={formData.restaurantName}
                  onChange={(e) => setFormData({...formData, restaurantName: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Owner Username *</label>
                <input 
                  type="text" 
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="owner@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Password *</label>
                <input 
                  type="text" 
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  disabled={loading}
                />
                <div className="form-hint">Default: password123</div>
              </div>
              
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={formData.isPro}
                    onChange={(e) => setFormData({...formData, isPro: e.target.checked})}
                    disabled={loading}
                  />
                  <span>Premium Partner (₹999/year)</span>
                </label>
                <div className="form-hint">Unchecked = Basic Plan</div>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner-small"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FaPlus /> Create Partner Account
                  </>
                )}
              </button>
              <button 
                type="button" 
                onClick={onClose}
                className="btn-cancel"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 👑 MAIN COMPONENT
// ==========================================

const SuperAdmin = () => {
  const navigate = useNavigate();
  const BASE_URL = getApiBase();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [restaurants, setRestaurants] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState({
    totalPartners: 0,
    totalRevenue: 0,
    activePartners: 0
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
        
        setStats({
          totalPartners: res.data.length,
          totalRevenue,
          activePartners
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

  // Handle partner actions
  const handlePartnerAction = async (type, id, data) => {
    try {
      const token = localStorage.getItem("superAdminToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      let response;
      
      switch(type) {
        case 'TOGGLE_BLOCK':
          const partner = restaurants.find(r => r._id === id);
          response = await axios.put(
            `${BASE_URL}/superadmin/restaurant/${id}/status`, 
            { isActive: !partner.isActive }, 
            config
          );
          alert(`Partner ${!partner.isActive ? 'activated' : 'blocked'} successfully!`);
          break;
          
        case 'RESET_PASS':
          response = await axios.put(
            `${BASE_URL}/superadmin/restaurant/${id}/password`, 
            { password: data }, 
            config
          );
          alert("Password reset successfully!");
          break;
          
        case 'EXTEND':
          response = await axios.put(
            `${BASE_URL}/superadmin/restaurant/${id}/subscription`, 
            { days: 365 }, 
            config
          );
          alert("Plan extended by 1 year!");
          break;
          
        case 'DELETE':
          response = await axios.delete(
            `${BASE_URL}/superadmin/delete-owner/${id}`, 
            config
          );
          alert("Partner deleted successfully!");
          break;
          
        default:
          return;
      }
      
      // Refresh data after action
      fetchData();
      setSelectedPartner(null);
      
    } catch (err) {
      alert("Action failed: " + (err.response?.data?.message || err.message));
    }
  };

  // Add new partner
  const handleAddPartner = async (formData) => {
    try {
      const token = localStorage.getItem("superAdminToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.post(
        `${BASE_URL}/superadmin/restaurant/add`, 
        formData, 
        config
      );
      
      if (response.data.success) {
        alert("✅ Partner added successfully!");
        fetchData();
        return Promise.resolve();
      } else {
        throw new Error(response.data.message || "Failed to add partner");
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
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
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="super-admin-layout">
      <style>{cssStyles}</style>
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        stats={stats}
      />

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
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <DashboardOverview 
                  restaurants={restaurants} 
                  refreshData={fetchData} 
                />
              )}
              
              {/* Partner Management Tab */}
              {activeTab === 'restaurants' && (
                <PartnerManagement 
                  restaurants={restaurants}
                  onSelectPartner={setSelectedPartner}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onAddPartner={() => setShowAddModal(true)}
                  loading={loading}
                />
              )}
              
              {/* Revenue Tab */}
              {activeTab === 'revenue' && (
                <div className="revenue-tab">
                  <h2>Revenue Dashboard</h2>
                  <div className="revenue-summary">
                    <div className="revenue-card">
                      <h3>Total Platform Revenue</h3>
                      <div className="revenue-amount">₹{stats.totalRevenue.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* System Tab */}
              {activeTab === 'system' && (
                <div className="system-tab">
                  <h2>System Health</h2>
                  <div className="system-status-grid">
                    <div className="status-card ok">
                      <FaDatabase />
                      <div>Database Connected</div>
                    </div>
                    <div className="status-card ok">
                      <FaServer />
                      <div>API Server Online</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Partner Detail Modal */}
      {selectedPartner && (
        <PartnerDetailModal
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
          onAction={handlePartnerAction}
        />
      )}

      {/* Add Partner Modal */}
      <AddPartnerModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddPartner}
      />
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

/* Sidebar Styles */
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

.user-info {
  flex: 1;
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

.stat-item:last-child {
  margin-bottom: 0;
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
  position: relative;
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
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
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

.stat-card.total-partners .stat-icon { color: var(--primary); }
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

/* Quick Actions */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.quick-action-btn {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-action-btn:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
}

.quick-action-btn svg {
  font-size: 24px;
  color: var(--primary);
}

.quick-action-btn span {
  font-size: 13px;
  font-weight: 600;
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

.search-wrapper svg {
  color: var(--text-muted);
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

.status-badge.active {
  background: rgba(34, 197, 94, 0.15);
  color: var(--success);
}

.status-badge.inactive {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
}

.plan-badge.premium {
  background: rgba(249, 115, 22, 0.15);
  color: var(--primary);
}

.plan-badge.basic {
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

.btn-action.edit {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
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

.info-value.status.active {
  color: var(--success);
}

.info-value.status.inactive {
  color: var(--danger);
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

.action-btn {
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
}

.action-btn.success {
  background: linear-gradient(135deg, var(--success), var(--success-dark));
  color: white;
}

.action-btn.warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
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

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.form-group input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Revenue Tab */
.revenue-tab {
  padding: 20px;
}

.revenue-summary {
  margin-top: 30px;
}

.revenue-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 30px;
  text-align: center;
}

.revenue-card h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: var(--text-muted);
}

.revenue-amount {
  font-size: 42px;
  font-weight: 800;
  color: var(--success);
}

/* System Tab */
.system-tab {
  padding: 20px;
}

.system-status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.status-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-card.ok {
  border-left: 4px solid var(--success);
}

.status-card.ok svg {
  color: var(--success);
  font-size: 28px;
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
  
  .quick-actions-grid {
    grid-template-columns: 1fr;
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
}
`;

export default SuperAdmin;