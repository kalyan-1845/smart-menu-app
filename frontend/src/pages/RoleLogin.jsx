import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
// ✅ FIXED: Changed 'Chef' to 'ChefHat'
import { ChefHat, User, Shield, Store, ArrowLeft, LogIn, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';

const RoleLogin = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
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
      icon: ChefHat, // ✅ FIXED: Uses ChefHat instead of Chef
      color: '#FF6B35'
    },
    {
      id: 'waiter',
      name: 'Waiter',
      description: 'Serve and manage tables',
      icon: Utensils, // ✅ FIXED: Uses Utensils or User
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
    setRestaurantId(''); // Reset input
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    // Validation for Chef/Waiter
    if ((selectedRole === 'chef' || selectedRole === 'waiter') && !restaurantId.trim()) {
       toast.error('Please enter the Restaurant Username');
       return;
    }

    setLoading(true);
    
    // Simulate processing
    setTimeout(() => {
      setLoading(false);
      
      switch(selectedRole) {
        case 'customer':
          navigate('/');
          toast.success("Welcome Guest!");
          break;
        case 'owner':
          navigate('/login');
          break;
        case 'super_admin':
          navigate('/super-login');
          break;
        case 'chef':
        case 'waiter':
          // Dynamic Navigation to specific restaurant dashboard
          navigate(`/${restaurantId}/${selectedRole}`);
          toast.success(`Entering ${selectedRole} panel...`);
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
          
          {/* ✅ CONDITIONAL INPUT FOR STAFF */}
          {isStaff && (
             <FormGroup style={{animation: 'fadeIn 0.3s'}}>
               <FormLabel>Restaurant Username (ID)</FormLabel>
               <FormControl
                 type="text"
                 placeholder="e.g. kalyanresto"
                 value={restaurantId}
                 onChange={(e) => setRestaurantId(e.target.value)}
                 required
                 autoFocus
               />
             </FormGroup>
          )}

          {!isStaff && selectedRole && (
             <div style={{textAlign:'center', marginBottom:'15px', fontSize:'13px', color:'#666'}}>
               Proceed to {roles.find(r=>r.id===selectedRole).name} Login
             </div>
          )}

          <LoginButton type="submit" disabled={loading}>
            {loading ? (
              'Redirecting...'
            ) : (
              <>
                <LogIn size={20} />
                Continue
              </>
            )}
          </LoginButton>

          <RegisterLink>
            Don't have an account? <Link to="/register">Sign up now</Link>
          </RegisterLink>
        </LoginForm>

        <QuickLinks>
          <QuickLink to="/login">Owner Login</QuickLink>
          <QuickLink to="/super-login">CEO Access</QuickLink>
        </QuickLinks>
      </LoginCard>
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
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  color: white;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #666;
  margin-bottom: 30px;
  text-decoration: none;
  font-weight: 600;
  
  &:hover {
    color: #f97316;
  }
`;

const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
  
  h1 {
    margin: 20px 0 10px;
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
  gap: 15px;
  padding: 15px;
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
  width: 45px;
  height: 45px;
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
  margin-bottom: 4px;
  font-size: 14px;
`;

const RoleDescription = styled.div`
  font-size: 11px;
  color: #666;
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
    accent-color: #f97316;
  }
  
  label {
    cursor: pointer;
    color: #666;
    font-size: 13px;
  }
`;

const ForgotPassword = styled(Link)`
  color: #f97316;
  text-decoration: none;
  font-size: 13px;
  
  &:hover {
    text-decoration: underline;
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

const RegisterLink = styled.div`
  text-align: center;
  margin-top: 25px;
  color: #666;
  font-size: 14px;
  
  a {
    font-weight: 700;
    color: #f97316;
    text-decoration: none;
    margin-left: 5px;
  }
`;

const QuickLinks = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  padding-top: 25px;
  border-top: 1px solid #222;
`;

const QuickLink = styled(Link)`
  color: #444;
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
  
  &:hover {
    color: #f97316;
  }
`;

export default RoleLogin;