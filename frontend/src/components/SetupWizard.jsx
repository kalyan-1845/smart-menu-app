import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Chef, User, Shield, Store, ArrowLeft, LogIn, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';

const RoleLogin = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [restaurantId, setRestaurantId] = useState(''); // Only for Chef/Waiter
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const roles = [
    {
      id: 'customer',
      name: 'Customer',
      description: 'Browse menus & order food',
      icon: User,
      color: '#4ECDC4'
    },
    {
      id: 'chef',
      name: 'Chef',
      description: 'Kitchen display system',
      icon: Chef,
      color: '#FF6B35'
    },
    {
      id: 'waiter',
      name: 'Waiter',
      description: 'Table & order management',
      icon: Utensils,
      color: '#FFA500'
    },
    {
      id: 'owner',
      name: 'Restaurant Owner',
      description: 'Admin dashboard & setup',
      icon: Store,
      color: '#06D6A0'
    },
    {
      id: 'super_admin',
      name: 'Super Admin',
      description: 'CEO & Platform Control',
      icon: Shield,
      color: '#292F36'
    }
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setRestaurantId(''); // Reset input on change
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    setLoading(true);

    // Artificial delay for smooth UX
    setTimeout(() => {
      setLoading(false);
      
      // 🚀 SMART ROUTING LOGIC
      switch(selectedRole) {
        case 'customer':
          navigate('/');
          toast.success("Welcome Guest!");
          break;
          
        case 'owner':
          navigate('/login'); // Redirect to existing Owner Login
          break;
          
        case 'super_admin':
          navigate('/super-login'); // Redirect to existing Super Login
          break;
          
        case 'chef':
        case 'waiter':
          if (!restaurantId.trim()) {
            toast.error("Please enter the Restaurant Username");
            return;
          }
          // Redirect to dynamic URL: /:id/chef or /:id/waiter
          navigate(`/${restaurantId.trim()}/${selectedRole}`);
          toast.success(`Opening ${selectedRole} panel for ${restaurantId}`);
          break;
          
        default:
          navigate('/');
      }
    }, 800);
  };

  const isStaff = selectedRole === 'chef' || selectedRole === 'waiter';

  return (
    <LoginContainer>
      <LoginCard>
        <BackButton to="/">
          <ArrowLeft size={20} />
          Back to Home
        </BackButton>
        
        <LoginHeader>
          <Shield size={48} color="#f97316" />
          <h1>Access Portal</h1>
          <p>Select your role to continue</p>
        </LoginHeader>

        <RoleSelection>
          <RoleLabel>I am a...</RoleLabel>
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
          
          {/* 🔽 ONLY SHOW INPUT FOR CHEF/WAITER */}
          {isStaff ? (
            <FormGroup className="fade-in">
              <FormLabel>Restaurant Username (ID)</FormLabel>
              <FormControl
                type="text"
                placeholder="e.g. kalyanresto"
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                required
                autoFocus
              />
              <small style={{color:'#666', marginTop: 5, display:'block'}}>Enter the shop username to verify access.</small>
            </FormGroup>
          ) : (
            // Message for direct login roles
            selectedRole && (
              <div style={{textAlign:'center', marginBottom: 20, color:'#666', fontSize: 14}}>
                Click below to proceed to the <strong>{roles.find(r => r.id === selectedRole)?.name} Login</strong> page.
              </div>
            )
          )}

          <LoginButton type="submit" disabled={loading}>
            {loading ? (
              'Redirecting...'
            ) : (
              <>
                <LogIn size={20} />
                {isStaff ? `Enter ${selectedRole === 'chef' ? 'Kitchen' : 'Dining'} Area` : 'Continue'}
              </>
            )}
          </LoginButton>

        </LoginForm>

        <QuickLinks>
          <QuickLink to="/login">Forgot ID?</QuickLink>
          <QuickLink to="/">Need Help?</QuickLink>
        </QuickLinks>
      </LoginCard>
      
      <style>{`
        .fade-in { animation: fadeIn 0.3s ease-in; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </LoginContainer>
  );
};

// --- STYLED COMPONENTS ---

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: radial-gradient(circle at center, #1a1a1a 0%, #000 100%);
  font-family: 'Inter', sans-serif;
`;

const LoginCard = styled.div`
  background: #0a0a0a;
  border: 1px solid #222;
  border-radius: 24px;
  padding: 40px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  color: white;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #666;
  margin-bottom: 30px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  
  &:hover {
    color: #f97316;
  }
`;

const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
  
  h1 {
    margin: 15px 0 5px;
    font-size: 24px;
    font-weight: 900;
  }
  
  p {
    color: #666;
    font-size: 14px;
  }
`;

const RoleSelection = styled.div`
  margin-bottom: 30px;
`;

const RoleLabel = styled.div`
  font-weight: 700;
  margin-bottom: 15px;
  color: #888;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const RoleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
`;

const RoleOption = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid ${props => props.selected ? '#f97316' : '#222'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.selected ? 'rgba(249, 115, 22, 0.1)' : '#111'};
  
  &:hover {
    border-color: #f97316;
    transform: translateY(-2px);
  }
`;

const RoleIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => `${props.color}20`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color};
`;

const RoleInfo = styled.div`
  flex: 1;
`;

const RoleName = styled.div`
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 2px;
  color: white;
`;

const RoleDescription = styled.div`
  font-size: 10px;
  color: #666;
`;

const LoginForm = styled.form`
  margin-top: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #ccc;
  font-size: 14px;
`;

const FormControl = styled.input`
  width: 100%;
  padding: 14px 16px;
  background: #000;
  border: 1px solid #333;
  border-radius: 12px;
  font-size: 16px;
  color: white;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #f97316;
  }
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  &:hover:not(:disabled) {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const QuickLinks = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #222;
`;

const QuickLink = styled(Link)`
  color: #666;
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
  
  &:hover {
    color: #f97316;
  }
`;

export default RoleLogin;