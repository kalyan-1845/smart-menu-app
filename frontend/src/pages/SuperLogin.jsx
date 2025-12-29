import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaUser, FaEye, FaEyeSlash, FaCrown, FaShieldAlt } from 'react-icons/fa';
import axios from 'axios';

const SuperLogin = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/super-login', credentials);
      
      if (response.data.success) {
        localStorage.setItem('superAdminToken', response.data.token);
        localStorage.setItem('owner_token_ceo', response.data.token);
        navigate('/ceo');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="super-login-container">
      <style>{`
        .super-login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          padding: 20px;
        }

        .login-card {
          background: rgba(17, 17, 17, 0.95);
          border: 1px solid #222;
          border-radius: 20px;
          padding: 40px;
          width: 100%;
          max-width: 400px;
          backdrop-filter: blur(10px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .login-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .login-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 32px;
          color: white;
        }

        .login-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          background: linear-gradient(135deg, #f97316, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-header p {
          color: #888;
          margin-top: 8px;
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .input-group {
          position: relative;
        }

        .input-group input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          background: rgba(255,255,255,0.05);
          border: 1px solid #333;
          border-radius: 12px;
          color: white;
          font-size: 16px;
          outline: none;
          transition: all 0.3s;
        }

        .input-group input:focus {
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #888;
          font-size: 18px;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
        }

        .login-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s;
          margin-top: 10px;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(249, 115, 22, 0.4);
        }

        .login-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
          text-align: center;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .security-note {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #222;
          text-align: center;
          color: #666;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .demo-credentials {
          background: rgba(255,255,255,0.03);
          border: 1px solid #222;
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
        }

        .demo-credentials h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #888;
        }

        .demo-credentials p {
          margin: 5px 0;
          font-size: 13px;
          color: #666;
          font-family: monospace;
        }

        .demo-credentials strong {
          color: #f97316;
        }
      `}</style>

      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <FaCrown />
          </div>
          <h1>CEO Portal</h1>
          <p>Full System Administration Access</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="input-group">
              <span className="input-icon">
                <FaUser />
              </span>
              <input
                type="text"
                placeholder="CEO Username"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                required
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-group">
              <span className="input-icon">
                <FaLock />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Master Password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading || !credentials.username || !credentials.password}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Authenticating...
              </>
            ) : (
              <>
                <FaShieldAlt />
                Secure Login
              </>
            )}
          </button>
        </form>

        <div className="demo-credentials">
          <h4>Default CEO Credentials:</h4>
          <p>Username: <strong>srinivas</strong></p>
          <p>Password: <strong>bsr18</strong></p>
        </div>

        <div className="security-note">
          <FaShieldAlt />
          Secure CEO Access Only
        </div>
      </div>
    </div>
  );
};

export default SuperLogin;