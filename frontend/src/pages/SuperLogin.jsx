import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  Shield, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Key,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const SuperLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    adminKey: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      toast.error('Please enter admin email');
      return false;
    }
    if (!formData.password) {
      toast.error('Please enter password');
      return false;
    }
    if (!formData.adminKey) {
      toast.error('Please enter admin key');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Simulate brute force protection
    if (attempts >= 3) {
      toast.error('Too many failed attempts. Please try again later.');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      
      // Demo credentials
      if (formData.email === 'admin@foodorder.com' && 
          formData.password === 'admin123' && 
          formData.adminKey === 'SUPER123') {
        
        localStorage.setItem('super_admin', 'true');
        toast.success('Super Admin login successful!');
        navigate('/super-admin');
      } else {
        setAttempts(prev => prev + 1);
        const remaining = 3 - attempts - 1;
        toast.error(`Invalid credentials. ${remaining > 0 ? `${remaining} attempts remaining` : 'Account locked'}`);
      }
    }, 1500);
  };

  const handleEmergencyAccess = () => {
    toast.loading('Requesting emergency access...');
    setTimeout(() => {
      toast.dismiss();
      toast.success('Emergency access request sent to primary admin');
    }, 2000);
  };

  return (
    <LoginContainer>
      <LoginCard>
        <BackButton to="/">
          <ArrowLeft size={20} />
          Back to Home
        </BackButton>
        
        <LoginHeader>
          <Shield size={48} color="var(--accent-color)" />
          <h1>Super Admin Portal</h1>
          <p>Restricted access - Platform administration only</p>
        </LoginHeader>

        <SecurityWarning>
          <AlertTriangle size={20} />
          <span>Warning: This area is restricted to authorized personnel only</span>
        </SecurityWarning>

        <LoginForm onSubmit={handleSubmit}>
          <FormGroup>
            <FormLabel>Admin Email *</FormLabel>
            <InputWithIcon>
              <Mail size={20} />
              <FormControl
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="admin@foodorder.com"
                required
              />
            </InputWithIcon>
          </FormGroup>

          <FormGroup>
            <FormLabel>Password *</FormLabel>
            <PasswordInput>
              <InputWithIcon>
                <Lock size={20} />
                <FormControl
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter admin password"
                  required
                />
              </InputWithIcon>
              <PasswordToggle onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </PasswordToggle>
            </PasswordInput>
          </FormGroup>

          <FormGroup>
            <FormLabel>Admin Security Key *</FormLabel>
            <InputWithIcon>
              <Key size={20} />
              <FormControl
                type="password"
                name="adminKey"
                value={formData.adminKey}
                onChange={handleInputChange}
                placeholder="Enter security key"
                required
              />
            </InputWithIcon>
            <KeyHint>Provided by system administrator</KeyHint>
          </FormGroup>

          {attempts > 0 && (
            <AttemptsWarning>
              <AlertTriangle size={16} />
              <span>{attempts} failed attempt(s)</span>
            </AttemptsWarning>
          )}

          <LoginButton type="submit" disabled={loading || attempts >= 3}>
            {loading ? (
              'Verifying credentials...'
            ) : attempts >= 3 ? (
              'Account Locked'
            ) : (
              <>
                <CheckCircle size={20} />
                Access Admin Portal
              </>
            )}
          </LoginButton>

          <SecurityInfo>
            <h4>Security Protocols:</h4>
            <ul>
              <li>• Two-factor authentication enabled</li>
              <li>• All actions are logged and monitored</li>
              <li>• IP address tracking active</li>
              <li>• Session timeout: 15 minutes</li>
            </ul>
          </SecurityInfo>
        </LoginForm>

        <EmergencyAccess>
          <h4>Emergency Access</h4>
          <p>Need immediate access? Request emergency credentials</p>
          <EmergencyButton onClick={handleEmergencyAccess}>
            <Shield size={20} />
            Request Emergency Access
          </EmergencyButton>
        </EmergencyAccess>

        <DemoCredentials>
          <h4>Demo Credentials</h4>
          <CredentialsGrid>
            <CredentialItem>
              <strong>Email:</strong> admin@foodorder.com
            </CredentialItem>
            <CredentialItem>
              <strong>Password:</strong> admin123
            </CredentialItem>
            <CredentialItem>
              <strong>Admin Key:</strong> SUPER123
            </CredentialItem>
          </CredentialsGrid>
        </DemoCredentials>

        <BackToNormal>
          <Link to="/owner-login">Restaurant Owner Login</Link>
          <Link to="/login">Customer/Staff Login</Link>
        </BackToNormal>
      </LoginCard>
    </LoginContainer>
  );
};

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #1a1e24 0%, var(--dark-color) 100%);
`;

const LoginCard = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 40px;
  width: 100%;
  max-width: 500px;
  box-shadow: var(--shadow-lg);
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--gray-color);
  margin-bottom: 30px;
  text-decoration: none;
  
  &:hover {
    color: var(--primary-color);
  }
`;

const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
  
  h1 {
    margin: 20px 0 10px;
    color: var(--dark-color);
  }
  
  p {
    color: var(--gray-color);
  }
`;

const SecurityWarning = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: rgba(255, 214, 102, 0.2);
  border: 1px solid var(--warning-color);
  border-radius: var(--radius);
  margin-bottom: 30px;
  color: var(--warning-color);
  font-size: 14px;
  
  svg {
    flex-shrink: 0;
  }
`;

const LoginForm = styled.form`
  margin-bottom: 30px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--dark-color);
`;

const InputWithIcon = styled.div`
  position: relative;
  
  svg {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--gray-color);
  }
`;

const FormControl = styled.input`
  width: 100%;
  padding: 12px 16px 12px 48px;
  border: 2px solid var(--light-gray);
  border-radius: var(--radius);
  font-size: 16px;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
`;

const PasswordInput = styled.div`
  position: relative;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--gray-color);
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: var(--dark-color);
  }
`;

const KeyHint = styled.div`
  font-size: 12px;
  color: var(--gray-color);
  margin-top: 5px;
  font-style: italic;
`;

const AttemptsWarning = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(239, 71, 111, 0.1);
  border-radius: var(--radius);
  margin-bottom: 20px;
  color: var(--danger-color);
  font-size: 14px;
  
  svg {
    flex-shrink: 0;
  }
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 16px;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  &:hover:not(:disabled) {
    background-color: #3AB7AD;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: var(--gray-color);
  }
`;

const SecurityInfo = styled.div`
  margin-top: 25px;
  padding: 20px;
  background: var(--light-gray);
  border-radius: var(--radius);
  
  h4 {
    margin-bottom: 10px;
    font-size: 14px;
    color: var(--dark-color);
  }
  
  ul {
    margin: 0;
    padding-left: 20px;
    color: var(--gray-color);
    font-size: 13px;
    line-height: 1.6;
    
    li {
      margin-bottom: 5px;
    }
  }
`;

const EmergencyAccess = styled.div`
  text-align: center;
  margin: 30px 0;
  padding: 25px;
  background: rgba(239, 71, 111, 0.05);
  border: 1px solid rgba(239, 71, 111, 0.2);
  border-radius: var(--radius);
  
  h4 {
    margin-bottom: 10px;
    color: var(--danger-color);
  }
  
  p {
    color: var(--gray-color);
    margin-bottom: 20px;
    font-size: 14px;
  }
`;

const EmergencyButton = styled.button`
  padding: 12px 24px;
  background: transparent;
  color: var(--danger-color);
  border: 2px solid var(--danger-color);
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 0 auto;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--danger-color);
    color: white;
  }
`;

const DemoCredentials = styled.div`
  margin: 30px 0;
  padding: 20px;
  background: rgba(6, 214, 160, 0.05);
  border: 1px solid rgba(6, 214, 160, 0.2);
  border-radius: var(--radius);
  
  h4 {
    margin-bottom: 15px;
    color: var(--success-color);
    text-align: center;
  }
`;

const CredentialsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
`;

const CredentialItem = styled.div`
  padding: 10px;
  background: white;
  border-radius: var(--radius);
  font-family: monospace;
  font-size: 14px;
  
  strong {
    color: var(--dark-color);
    margin-right: 10px;
  }
`;

const BackToNormal = styled.div`
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid var(--light-gray);
  
  a {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

export default SuperLogin;