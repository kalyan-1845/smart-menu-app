import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  Store, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Key,
  Building,
  Shield,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const OwnerLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    restaurantId: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const restaurants = [
    { id: 'RST001', name: 'Spice Heaven', address: '123 Main St' },
    { id: 'RST002', name: 'Pasta Paradise', address: '456 Oak Ave' },
    { id: 'RST003', name: 'Sushi Zen', address: '789 Pine Rd' },
    { id: 'RST004', name: 'Burger Hub', address: '321 Elm St' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.restaurantId) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Login successful!');
      
      // Save to localStorage
      if (rememberMe) {
        localStorage.setItem('owner_email', formData.email);
        localStorage.setItem('restaurant_id', formData.restaurantId);
      }
      
      // Navigate to restaurant admin dashboard
      navigate('/restaurant-admin');
    }, 1500);
  };

  const handleForgotPassword = () => {
    toast.loading('Sending password reset email...');
    setTimeout(() => {
      toast.dismiss();
      toast.success('Password reset email sent!');
    }, 1500);
  };

  const handleQuickLogin = (restaurantId) => {
    setFormData(prev => ({
      ...prev,
      restaurantId,
      email: 'owner@example.com',
      password: 'password123'
    }));
    toast.success('Demo credentials filled');
  };

  return (
    <LoginContainer>
      <LoginCard>
        <BackButton to="/">
          <ArrowLeft size={20} />
          Back to Home
        </BackButton>
        
        <LoginHeader>
          <Store size={48} color="var(--primary-color)" />
          <h1>Restaurant Owner Login</h1>
          <p>Access your restaurant management dashboard</p>
        </LoginHeader>

        {/* Quick Select Restaurant */}
        <RestaurantSelect>
          <h3>Quick Select Restaurant</h3>
          <RestaurantGrid>
            {restaurants.map(restaurant => (
              <RestaurantOption
                key={restaurant.id}
                selected={formData.restaurantId === restaurant.id}
                onClick={() => handleQuickLogin(restaurant.id)}
              >
                <Building size={20} />
                <RestaurantInfo>
                  <RestaurantName>{restaurant.name}</RestaurantName>
                  <RestaurantAddress>{restaurant.address}</RestaurantAddress>
                </RestaurantInfo>
                <RestaurantId>{restaurant.id}</RestaurantId>
              </RestaurantOption>
            ))}
          </RestaurantGrid>
        </RestaurantSelect>

        <LoginForm onSubmit={handleSubmit}>
          <FormGroup>
            <FormLabel>Restaurant ID</FormLabel>
            <InputWithIcon>
              <Key size={20} />
              <FormControl
                type="text"
                name="restaurantId"
                value={formData.restaurantId}
                onChange={handleInputChange}
                placeholder="Enter your Restaurant ID"
                required
              />
            </InputWithIcon>
          </FormGroup>

          <FormGroup>
            <FormLabel>Email Address</FormLabel>
            <InputWithIcon>
              <Mail size={20} />
              <FormControl
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="owner@restaurant.com"
                required
              />
            </InputWithIcon>
          </FormGroup>

          <FormGroup>
            <FormLabel>Password</FormLabel>
            <PasswordInput>
              <InputWithIcon>
                <Lock size={20} />
                <FormControl
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                />
              </InputWithIcon>
              <PasswordToggle onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </PasswordToggle>
            </PasswordInput>
          </FormGroup>

          <FormOptions>
            <RememberMeOption>
              <Checkbox
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember">Remember me</label>
            </RememberMeOption>
            <ForgotPassword onClick={handleForgotPassword}>
              Forgot Password?
            </ForgotPassword>
          </FormOptions>

          <LoginButton type="submit" disabled={loading}>
            {loading ? (
              'Signing in...'
            ) : (
              <>
                <CheckCircle size={20} />
                Sign In to Dashboard
              </>
            )}
          </LoginButton>

          <SecurityNotice>
            <Shield size={16} />
            <span>Your data is protected with 256-bit encryption</span>
          </SecurityNotice>
        </LoginForm>

        <RegisterSection>
          <h3>New Restaurant Owner?</h3>
          <p>Register your restaurant to get started</p>
          <RegisterButton to="/setup-wizard">
            <Store size={20} />
            Register Restaurant
          </RegisterButton>
        </RegisterSection>

        <SupportSection>
          <h4>Need Help?</h4>
          <SupportLinks>
            <SupportLink href="tel:+15551234567">
              📞 Call Owner Support
            </SupportLink>
            <SupportLink href="mailto:owners@foodorder.com">
              ✉️ Email Support
            </SupportLink>
            <SupportLink to="/qr-generator">
              🖨️ QR Code Generator
            </SupportLink>
          </SupportLinks>
        </SupportSection>
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
  max-width: 600px;
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

const RestaurantSelect = styled.div`
  margin-bottom: 30px;
  
  h3 {
    margin-bottom: 15px;
    font-size: 1.1rem;
  }
`;

const RestaurantGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const RestaurantOption = styled.div`
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
  
  svg {
    color: ${props => props.selected ? 'var(--primary-color)' : 'var(--gray-color)'};
  }
`;

const RestaurantInfo = styled.div`
  flex: 1;
`;

const RestaurantName = styled.div`
  font-weight: 500;
  margin-bottom: 5px;
`;

const RestaurantAddress = styled.div`
  font-size: 12px;
  color: var(--gray-color);
`;

const RestaurantId = styled.div`
  font-size: 12px;
  padding: 4px 8px;
  background: var(--light-gray);
  border-radius: 4px;
  color: var(--dark-color);
  font-family: monospace;
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
    border-color: var(--primary-color);
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

const FormOptions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
`;

const RememberMeOption = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  label {
    cursor: pointer;
    color: var(--dark-color);
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const ForgotPassword = styled.button`
  background: transparent;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 16px;
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

const SecurityNotice = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  padding: 15px;
  background: var(--light-gray);
  border-radius: var(--radius);
  font-size: 14px;
  color: var(--gray-color);
  
  svg {
    color: var(--success-color);
  }
`;

const RegisterSection = styled.div`
  text-align: center;
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid var(--light-gray);
  
  h3 {
    margin-bottom: 10px;
  }
  
  p {
    color: var(--gray-color);
    margin-bottom: 20px;
  }
`;

const RegisterButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 15px 30px;
  background: var(--secondary-color);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.3s ease;
  
  &:hover {
    background: #E59400;
  }
`;

const SupportSection = styled.div`
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid var(--light-gray);
  
  h4 {
    text-align: center;
    margin-bottom: 20px;
    color: var(--gray-color);
  }
`;

const SupportLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
`;

const SupportLink = styled.a`
  padding: 10px 20px;
  background: var(--light-gray);
  color: var(--dark-color);
  border-radius: var(--radius);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--primary-color);
    color: white;
  }
`;

export default OwnerLogin;