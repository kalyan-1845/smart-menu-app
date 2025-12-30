// frontend/src/pages/SetupWizard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Coffee, Utensils, Users, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const SetupWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: '',
    type: '',
    address: '',
    phone: '',
    email: '',
    cuisine: '',
    tables: 10,
    openingTime: '09:00',
    closingTime: '22:00',
  });

  const steps = [
    { id: 1, title: 'Basic Info', icon: <Coffee size={20} /> },
    { id: 2, title: 'Restaurant Details', icon: <Utensils size={20} /> },
    { id: 3, title: 'Staff Setup', icon: <Users size={20} /> },
    { id: 4, title: 'Menu Setup', icon: <Settings size={20} /> },
  ];

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      toast.success('Restaurant setup completed!');
      navigate('/admin');
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRestaurantInfo(prev => ({ ...prev, [name]: value }));
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <StepContent>
            <StepTitle>Basic Restaurant Information</StepTitle>
            <FormGroup>
              <Label>Restaurant Name</Label>
              <Input 
                type="text" 
                name="name"
                value={restaurantInfo.name}
                onChange={handleChange}
                placeholder="Enter restaurant name"
              />
            </FormGroup>
            <FormGroup>
              <Label>Restaurant Type</Label>
              <Select 
                name="type"
                value={restaurantInfo.type}
                onChange={handleChange}
              >
                <option value="">Select type</option>
                <option value="fine-dining">Fine Dining</option>
                <option value="casual">Casual Dining</option>
                <option value="fast-food">Fast Food</option>
                <option value="cafe">Cafe</option>
                <option value="bar">Bar & Grill</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Cuisine</Label>
              <Input 
                type="text" 
                name="cuisine"
                value={restaurantInfo.cuisine}
                onChange={handleChange}
                placeholder="e.g., Italian, Indian, Chinese"
              />
            </FormGroup>
          </StepContent>
        );
      
      case 2:
        return (
          <StepContent>
            <StepTitle>Contact & Location</StepTitle>
            <FormGroup>
              <Label>Address</Label>
              <Input 
                type="text" 
                name="address"
                value={restaurantInfo.address}
                onChange={handleChange}
                placeholder="Full address"
              />
            </FormGroup>
            <FormGroup>
              <Label>Phone Number</Label>
              <Input 
                type="tel" 
                name="phone"
                value={restaurantInfo.phone}
                onChange={handleChange}
                placeholder="Contact number"
              />
            </FormGroup>
            <FormGroup>
              <Label>Email</Label>
              <Input 
                type="email" 
                name="email"
                value={restaurantInfo.email}
                onChange={handleChange}
                placeholder="Business email"
              />
            </FormGroup>
            <FormGroup>
              <Label>Number of Tables</Label>
              <Input 
                type="number" 
                name="tables"
                value={restaurantInfo.tables}
                onChange={handleChange}
                min="1"
                max="100"
              />
            </FormGroup>
          </StepContent>
        );
      
      case 3:
        return (
          <StepContent>
            <StepTitle>Operating Hours</StepTitle>
            <TimeContainer>
              <FormGroup>
                <Label>Opening Time</Label>
                <Input 
                  type="time" 
                  name="openingTime"
                  value={restaurantInfo.openingTime}
                  onChange={handleChange}
                />
              </FormGroup>
              <FormGroup>
                <Label>Closing Time</Label>
                <Input 
                  type="time" 
                  name="closingTime"
                  value={restaurantInfo.closingTime}
                  onChange={handleChange}
                />
              </FormGroup>
            </TimeContainer>
            <InfoBox>
              <p>You can modify these settings later from the admin panel.</p>
            </InfoBox>
          </StepContent>
        );
      
      case 4:
        return (
          <StepContent>
            <StepTitle>Complete Setup</StepTitle>
            <Summary>
              <SummaryItem>
                <strong>Restaurant Name:</strong> {restaurantInfo.name}
              </SummaryItem>
              <SummaryItem>
                <strong>Type:</strong> {restaurantInfo.type}
              </SummaryItem>
              <SummaryItem>
                <strong>Cuisine:</strong> {restaurantInfo.cuisine}
              </SummaryItem>
              <SummaryItem>
                <strong>Tables:</strong> {restaurantInfo.tables}
              </SummaryItem>
              <SummaryItem>
                <strong>Hours:</strong> {restaurantInfo.openingTime} - {restaurantInfo.closingTime}
              </SummaryItem>
            </Summary>
            <InfoBox success>
              <Check size={20} />
              <div>
                <h4>Ready to Go!</h4>
                <p>Your restaurant profile is complete. You can now start adding menu items and staff members.</p>
              </div>
            </InfoBox>
          </StepContent>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container>
      <WizardCard>
        <Header>
          <Title>Restaurant Setup Wizard</Title>
          <Subtitle>Configure your restaurant in a few simple steps</Subtitle>
        </Header>
        
        <Progress>
          {steps.map((s) => (
            <Step key={s.id} active={s.id <= step}>
              <StepIcon>{s.id < step ? <Check size={16} /> : s.icon}</StepIcon>
              <StepTitleSmall>{s.title}</StepTitleSmall>
            </Step>
          ))}
        </Progress>
        
        {renderStep()}
        
        <Actions>
          <Button secondary onClick={handlePrev} disabled={step === 1}>
            Previous
          </Button>
          <Button onClick={handleNext}>
            {step === steps.length ? 'Finish Setup' : 'Next Step'}
            <ArrowRight size={18} />
          </Button>
        </Actions>
        
        <SkipLink onClick={() => navigate('/admin')}>
          Skip setup for now
        </SkipLink>
      </WizardCard>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
`;

const WizardCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  color: var(--dark-color);
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  color: var(--gray-color);
`;

const Progress = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--light-gray);
    z-index: 1;
  }
`;

const Step = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
  flex: 1;
`;

const StepIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.active ? 'var(--primary-color)' : 'var(--light-gray)'};
  color: ${props => props.active ? 'white' : 'var(--gray-color)'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  border: 3px solid white;
`;

const StepTitleSmall = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.active ? 'var(--primary-color)' : 'var(--gray-color)'};
`;

const StepContent = styled.div`
  margin-bottom: 40px;
`;

const StepTitle = styled.h2`
  margin-bottom: 25px;
  color: var(--dark-color);
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--dark-color);
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--light-gray);
  border-radius: var(--radius);
  font-size: 16px;
  transition: border-color 0.3s ease;
  
  &:focus {
    border-color: var(--primary-color);
    outline: none;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--light-gray);
  border-radius: var(--radius);
  font-size: 16px;
  background: white;
  cursor: pointer;
  
  &:focus {
    border-color: var(--primary-color);
    outline: none;
  }
`;

const TimeContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

const InfoBox = styled.div`
  padding: 20px;
  background: ${props => props.success ? 'rgba(6, 214, 160, 0.1)' : 'rgba(255, 214, 102, 0.1)'};
  border-radius: var(--radius);
  border-left: 4px solid ${props => props.success ? 'var(--success-color)' : 'var(--warning-color)'};
  display: flex;
  gap: 15px;
  align-items: flex-start;
  
  h4 {
    margin: 0 0 5px 0;
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
`;

const Summary = styled.div`
  background: var(--light-gray);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 25px;
`;

const SummaryItem = styled.div`
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 25px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 30px;
  background: ${props => props.secondary ? 'transparent' : 'var(--primary-color)'};
  color: ${props => props.secondary ? 'var(--dark-color)' : 'white'};
  border: ${props => props.secondary ? '2px solid var(--light-gray)' : 'none'};
  border-radius: var(--radius);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.secondary ? 'var(--light-gray)' : 'var(--primary-dark)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SkipLink = styled.button`
  display: block;
  width: 100%;
  text-align: center;
  background: transparent;
  border: none;
  color: var(--gray-color);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.3s ease;
  
  &:hover {
    color: var(--primary-color);
  }
`;

export default SetupWizard;