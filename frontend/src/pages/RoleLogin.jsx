import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { User, Shield, Store, ArrowLeft, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

const RoleLogin = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ ROLES UPDATED: Chef and Waiter removed as per your request
  const roles = [
    {
      id: 'customer',
      name: 'Customer',
      description: 'Order food from restaurants',
      icon: User,
      color: '#4ECDC4'
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

    setLoading(true);
    
    // Simulate processing delay
    setTimeout(() => {
      setLoading(false);
      
      switch(selectedRole) {
        case 'customer':
          navigate('/');
          toast.success("Welcome Guest!");
          break;
        case 'owner':
          navigate('/login'); // Points to owner login page
          break;
        case 'super_admin':
          navigate('/super-login'); // Points to CEO/SuperAdmin login page
          break;
        default:
          navigate('/');
      }
    }, 800);
  };

  return (
    <LoginContainer>
      <LoginCard>
        <BackButton to="/">
          <ArrowLeft size={20} />
          Back to Home
        </BackButton>
        
        <LoginHeader>
          <Shield size={48} color="#f97316" />
          <h1>Welcome to Kovixa</h1>
          <p>Select your role to access your dashboard</p>
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
          <LoginButton type="submit" disabled={loading}>
            {loading ? (
              'Redirecting...'
            ) : (
              <>
                <LogIn size={20} />
                Continue to Login
              </>
            )}
          </LoginButton>

          <RegisterLink>
            Want to list your restaurant? <Link to="/register">Join Kovixa</Link>
          </RegisterLink>
        </LoginForm>

        <QuickLinks>
          <QuickLink to="/login">Owner Portal</QuickLink>
          <QuickLink to="/super-login">CEO Dashboard</QuickLink>
        </QuickLinks>
      </LoginCard>
    </LoginContainer>
  );
};

// --- STYLED COMPONENTS (Simplified) ---

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #050505;
`;

const LoginCard = styled.div`
  background: #0a0a0a;
  border: 1px solid #222;
  border-radius: 24px;
  padding: 40px;
  width: 100%;
  max-width: 500px;
  color: white;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #666;
  margin-bottom: 20px;
  text-decoration: none;
  font-size: 14px;
  &:hover { color: #f97316; }
`;

const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
  h1 { font-size: 24px; font-weight: 900; margin-top: 15px; }
  p { color: #666; font-size: 14px; }
`;

const RoleSelection = styled.div` margin-bottom: 20px; `;
const RoleLabel = styled.div` font-size: 12px; font-weight: 700; color: #444; text-transform: uppercase; margin-bottom: 15px; `;
const RoleGrid = styled.div` display: grid; gap: 12px; `;

const RoleOption = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 1px solid ${props => props.selected ? '#f97316' : '#111'};
  border-radius: 12px;
  cursor: pointer;
  background: ${props => props.selected ? 'rgba(249, 115, 22, 0.05)' : '#0f0f0f'};
  &:hover { border-color: #f97316; }
`;

const RoleIcon = styled.div`
  width: 45px;
  height: 45px;
  border-radius: 12px;
  background: ${props => `${props.color}15`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color};
`;

const RoleInfo = styled.div` flex: 1; `;
const RoleName = styled.div` font-size: 14px; font-weight: 700; `;
const RoleDescription = styled.div` font-size: 11px; color: #555; `;

const LoginForm = styled.form` margin-top: 20px; `;
const LoginButton = styled.button`
  width: 100%;
  padding: 16px;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  &:disabled { opacity: 0.5; }
`;

const RegisterLink = styled.div` text-align: center; margin-top: 20px; color: #444; font-size: 13px; a { color: #f97316; font-weight: 700; text-decoration: none; } `;
const QuickLinks = styled.div` display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #111; `;
const QuickLink = styled(Link)` color: #333; text-decoration: none; font-size: 11px; &:hover { color: #f97316; } `;

export default RoleLogin;