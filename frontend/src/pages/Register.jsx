import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  CheckCircle,
  ArrowLeft,
  Shield,
  UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }
    if (!formData.password) {
      toast.error('Please enter a password');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (!formData.acceptTerms) {
      toast.error('Please accept the terms and conditions');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      
      // Save user data to localStorage
      const userData = {
        id: 'USER' + Date.now().toString().slice(-8),
        ...formData,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      
      toast.success('Registration successful! Welcome to Food Order.');
      navigate('/');
    }, 2000);
  };

  const handleSocialRegister = (provider) => {
    toast.loading(`Connecting with ${provider}...`);
    setTimeout(() => {
      toast.dismiss();
      toast.success(`Connected with ${provider}`);
    }, 1500);
  };

  return (
    <RegisterContainer>
      <RegisterCard>
        <BackButton to="/">
          <ArrowLeft size={20} />
          Back to Home
        </BackButton>
        
        <RegisterHeader>
          <UserPlus size={48} color="var(--primary-color)" />
          <h1>Create Your Account</h1>
          <p>Join thousands of customers enjoying delicious food</p>
        </RegisterHeader>

        <RegisterForm onSubmit={handleSubmit}>
          <FormGrid>
            <FormGroup>
              <FormLabel>Full Name *</FormLabel>
              <InputWithIcon>
                <User size={20} />
                <FormControl
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </InputWithIcon>
            </FormGroup>
            
            <FormGroup>
              <FormLabel>Email Address *</FormLabel>
              <InputWithIcon>
                <Mail size={20} />
                <FormControl
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  required
                />
              </InputWithIcon>
            </FormGroup>
            
            <FormGroup>
              <FormLabel>Phone Number *</FormLabel>
              <InputWithIcon>
                <Phone size={20} />
                <FormControl
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </InputWithIcon>
            </FormGroup>
            
            <FormGroup>
              <FormLabel>Delivery Address</FormLabel>
              <InputWithIcon>
                <MapPin size={20} />
                <FormControl
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your delivery address"
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
                    placeholder="Create a password"
                    required
                  />
                </InputWithIcon>
                <PasswordToggle onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </PasswordToggle>
              </PasswordInput>
              <PasswordHint>At least 6 characters</PasswordHint>
            </FormGroup>
            
            <FormGroup>
              <FormLabel>Confirm Password *</FormLabel>
              <PasswordInput>
                <InputWithIcon>
                  <Lock size={20} />
                  <FormControl
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    required
                  />
                </InputWithIcon>
                <PasswordToggle onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </PasswordToggle>
              </PasswordInput>
            </FormGroup>
          </FormGrid>
          
          <TermsAgreement>
            <Checkbox
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleInputChange}
            />
            <label htmlFor="acceptTerms">
              I agree to the <Link to="/terms">Terms of Service</Link> and{' '}
              <Link to="/privacy">Privacy Policy</Link>
            </label>
          </TermsAgreement>
          
          <RegisterButton type="submit" disabled={loading}>
            {loading ? (
              'Creating Account...'
            ) : (
              <>
                <CheckCircle size={20} />
                Create Account
              </>
            )}
          </RegisterButton>
          
          <SecurityNotice>
            <Shield size={16} />
            <span>Your information is secure and encrypted</span>
          </SecurityNotice>
        </RegisterForm>

        <Divider>
          <span>Or register with</span>
        </Divider>

        <SocialRegister>
          <SocialButton google onClick={() => handleSocialRegister('Google')}>
            <GoogleIcon>G</GoogleIcon>
            Continue with Google
          </SocialButton>
          <SocialButton facebook onClick={() => handleSocialRegister('Facebook')}>
            <FacebookIcon>f</FacebookIcon>
            Continue with Facebook
          </SocialButton>
          <SocialButton apple onClick={() => handleSocialRegister('Apple')}>
            <AppleIcon></AppleIcon>
            Continue with Apple
          </SocialButton>
        </SocialRegister>

        <LoginPrompt>
          Already have an account? <Link to="/login">Sign in here</Link>
        </LoginPrompt>

        <RestaurantPrompt>
          <h4>Are you a restaurant owner?</h4>
          <p>Register your restaurant to start accepting orders</p>
          <RestaurantLink to="/owner-login">
            Restaurant Owner Login
          </RestaurantLink>
        </RestaurantPrompt>
      </RegisterCard>
    </RegisterContainer>
  );
};

const RegisterContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
`;

const RegisterCard = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 40px;
  width: 100%;
  max-width: 700px;
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

const RegisterHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
  
  h1 {
    margin: 20px 0 10px;
  }
  
  p {
    color: var(--gray-color);
  }
`;

const RegisterForm = styled.form`
  margin-bottom: 30px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 25px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  &:nth-child(5), &:nth-child(6) {
    grid-column: 1 / -1;
  }
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

const PasswordHint = styled.div`
  font-size: 12px;
  color: var(--gray-color);
  margin-top: 5px;
`;

const TermsAgreement = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 25px;
  
  label {
    font-size: 14px;
    line-height: 1.5;
    cursor: pointer;
    
    a {
      color: var(--primary-color);
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
`;

const Checkbox = styled.input`
  margin-top: 3px;
  cursor: pointer;
`;

const RegisterButton = styled.button`
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

const Divider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  margin: 30px 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid var(--light-gray);
  }
  
  span {
    padding: 0 15px;
    color: var(--gray-color);
    font-size: 14px;
  }
`;

const SocialRegister = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
`;

const SocialButton = styled.button`
  width: 100%;
  padding: 15px;
  background: ${props => {
    if (props.google) return '#FFFFFF';
    if (props.facebook) return '#1877F2';
    if (props.apple) return '#000000';
    return 'var(--light-gray)';
  }};
  color: ${props => {
    if (props.google) return '#000000';
    if (props.facebook || props.apple) return '#FFFFFF';
    return 'var(--dark-color)';
  }};
  border: ${props => props.google ? '1px solid #DADCE0' : 'none'};
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow);
    
    ${props => props.google && `
      background: #F8F9FA;
    `}
    ${props => props.facebook && `
      background: #166FE5;
    `}
    ${props => props.apple && `
      background: #333333;
    `}
  }
`;

const GoogleIcon = styled.div`
  width: 24px;
  height: 24px;
  background: conic-gradient(from -45deg, #ea4335 110deg, #4285f4 90deg 180deg, #34a853 180deg 270deg, #fbbc05 270deg) 73% 55%/150% 150% no-repeat;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
`;

const FacebookIcon = styled.div`
  width: 24px;
  height: 24px;
  background: #FFFFFF;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1877F2;
  font-weight: bold;
  font-size: 18px;
`;

const AppleIcon = styled.div`
  font-size: 20px;
`;

const LoginPrompt = styled.div`
  text-align: center;
  padding: 25px;
  background: var(--light-gray);
  border-radius: var(--radius);
  margin-bottom: 25px;
  
  a {
    font-weight: 600;
    color: var(--primary-color);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const RestaurantPrompt = styled.div`
  text-align: center;
  padding-top: 25px;
  border-top: 1px solid var(--light-gray);
  
  h4 {
    margin-bottom: 10px;
  }
  
  p {
    color: var(--gray-color);
    margin-bottom: 20px;
  }
`;

const RestaurantLink = styled(Link)`
  display: inline-block;
  padding: 12px 24px;
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  border-radius: var(--radius);
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--primary-color);
    color: white;
  }
`;

export default Register;