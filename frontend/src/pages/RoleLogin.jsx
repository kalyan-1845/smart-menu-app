import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Chef, User, Shield, Store, ArrowLeft, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

const RoleLogin = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const roles = [
    {
      id: 'customer',
      name: 'Customer',
      description: 'Order food from restaurants',
      icon: User,
      color: '#4ECDC4'
    },
    {
      id: 'chef',
      name: 'Chef',
      description: 'Prepare and manage orders',
      icon: Chef,
      color: '#FF6B35'
    },
    {
      id: 'waiter',
      name: 'Waiter',
      description: 'Serve and manage tables',
      icon: User,
      color: '#FFA500'
    },
    {
      id: 'owner',
      name: 'Restaurant Owner',
      description: 'Manage restaurant operations',
      icon: Store,
      color: '#06D6A0'
    },
    {
      id: 'super_admin',
      name: 'Super Admin',
      description: 'Manage multiple restaurants',
      icon: Shield,
      color: '#292F36'
    }
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success(`Logged in as ${roles.find(r => r.id === selectedRole).name}`);
      
      // Redirect based on role
      switch(selectedRole) {
        case 'customer':
          navigate('/');
          break;
        case 'chef':
          navigate('/chef-dashboard');
          break;
        case 'waiter':
          navigate('/waiter-dashboard');
          break;
        case 'owner':
          navigate('/restaurant-admin');
          break;
        case 'super_admin':
          navigate('/super-admin');
          break;
        default:
          navigate('/');
      }
    }, 1500);
  };

  return (
    <LoginContainer>
      <LoginCard>
        <BackButton to="/">
          <ArrowLeft size={20} />
          Back to Home
        </BackButton>
        
        <LoginHeader>
          <Shield size={48} color="var(--primary-color)" />
          <h1>Welcome Back</h1>
          <p>Select your role and sign in to continue</p>
        </LoginHeader>

        <RoleSelection>
          <RoleLabel>Select Your Role</RoleLabel>
          <RoleGrid>
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <RoleOption
                  key={role.id}
                  selected={selectedRole === role.id}
                  onClick={() => handleRoleSelect(role.id)}
                >
                  <RoleIcon color={role.color}>
                    <Icon size={24} />
                  </RoleIcon>
                  <RoleInfo>
                    <RoleName>{role.name}</RoleName>
                    <RoleDescription>{role.description}</RoleDescription>
                  </RoleInfo>
                </RoleOption>
              );
            })}
          </RoleGrid>
        </RoleSelection>

        <LoginForm onSubmit={handleLogin}>
          <FormGroup>
            <FormLabel>Email Address</FormLabel>
            <FormControl
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormGroup>

          <FormGroup>
            <FormLabel>Password</FormLabel>
            <FormControl
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormGroup>

          <FormOptions>
            <RememberMe>
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </RememberMe>
            <ForgotPassword to="/forgot-password">
              Forgot Password?
            </ForgotPassword>
          </FormOptions>

          <LoginButton type="submit" disabled={loading}>
            {loading ? (
              'Signing in...'
            ) : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </LoginButton>

          <RegisterLink>
            Don't have an account? <Link to="/register">Sign up now</Link>
          </RegisterLink>
        </LoginForm>

        <QuickLinks>
          <QuickLink to="/owner-login">Restaurant Owner Login</QuickLink>
          <QuickLink to="/super-login">Super Admin Login</QuickLink>
        </QuickLinks>
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
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
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
  margin-bottom: 40px;
  
  h1 {
    margin: 20px 0 10px;
  }
  
  p {
    color: var(--gray-color);
  }
`;

const RoleSelection = styled.div`
  margin-bottom: 30px;
`;

const RoleLabel = styled.div`
  font-weight: 500;
  margin-bottom: 15px;
  color: var(--dark-color);
`;

const RoleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const RoleOption = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 2px solid ${props => props.selected ? 'var(--primary-color)' : 'var(--light-gray)'};
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.selected ? 'rgba(255, 107, 53, 0.05)' : 'white'};
  
  &:hover {
    border-color: var(--primary-color);
    transform: translateY(-2px);
  }
`;

const RoleIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${props => `${props.color}15`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color};
`;

const RoleInfo = styled.div`
  flex: 1;
`;

const RoleName = styled.div`
  font-weight: 600;
  margin-bottom: 5px;
`;

const RoleDescription = styled.div`
  font-size: 12px;
  color: var(--gray-color);
`;

const LoginForm = styled.form`
  margin-top: 30px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--dark-color);
`;

const FormControl = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--light-gray);
  border-radius: var(--radius);
  font-size: 16px;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const FormOptions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
`;

const RememberMe = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
  
  label {
    cursor: pointer;
    color: var(--dark-color);
  }
`;

const ForgotPassword = styled(Link)`
  color: var(--primary-color);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 14px;
  background-color: var(--primary-color);
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
    background-color: #E55A2E;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const RegisterLink = styled.div`
  text-align: center;
  margin-top: 25px;
  color: var(--gray-color);
  
  a {
    font-weight: 600;
  }
`;

const QuickLinks = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid var(--light-gray);
`;

const QuickLink = styled(Link)`
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

export default RoleLogin;