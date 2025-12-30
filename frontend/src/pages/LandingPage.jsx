import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Search, Utensils, Clock, Star, Shield, Users, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const LandingPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Mock data for demo
    const mockRestaurants = [
      {
        id: '1',
        name: 'Spice Heaven',
        cuisine: 'Indian',
        rating: 4.5,
        deliveryTime: '30-40 min',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
        featured: true
      },
      {
        id: '2',
        name: 'Pasta Paradise',
        cuisine: 'Italian',
        rating: 4.7,
        deliveryTime: '25-35 min',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        featured: true
      },
      {
        id: '3',
        name: 'Sushi Zen',
        cuisine: 'Japanese',
        rating: 4.8,
        deliveryTime: '20-30 min',
        image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w-400&h=300&fit=crop',
        featured: true
      },
      {
        id: '4',
        name: 'Burger Hub',
        cuisine: 'American',
        rating: 4.3,
        deliveryTime: '15-25 min',
        image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w-400&h=300&fit=crop',
        featured: false
      }
    ];
    setRestaurants(mockRestaurants);
    setFeaturedRestaurants(mockRestaurants.filter(r => r.featured));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // In a real app, this would filter restaurants
      toast.success(`Searching for: ${searchTerm}`);
    }
  };

  const handleRestaurantClick = (restaurantId) => {
    navigate(`/menu/${restaurantId}`);
  };

  return (
    <LandingContainer>
      {/* Hero Section */}
      <HeroSection>
        <HeroContent>
          <h1>Order Food from Your Favorite Restaurants</h1>
          <p>Discover delicious meals from multiple restaurants and get them delivered to your doorstep</p>
          <SearchForm onSubmit={handleSearch}>
            <SearchInputWrapper>
              <SearchIcon size={20} />
              <SearchInput 
                type="text" 
                placeholder="Search for restaurants or cuisines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchInputWrapper>
            <SearchButton type="submit">Search</SearchButton>
          </SearchForm>
        </HeroContent>
      </HeroSection>

      {/* Features Section */}
      <FeaturesSection>
        <h2 className="text-center mb-5">Why Choose Us?</h2>
        <FeaturesGrid>
          <FeatureCard>
            <Shield size={40} color="var(--primary-color)" />
            <h3>Secure Ordering</h3>
            <p>Safe and secure payment processing for all orders</p>
          </FeatureCard>
          <FeatureCard>
            <Clock size={40} color="var(--primary-color)" />
            <h3>Fast Delivery</h3>
            <p>Get your food delivered in under 30 minutes</p>
          </FeatureCard>
          <FeatureCard>
            <Users size={40} color="var(--primary-color)" />
            <h3>Multi-Restaurant</h3>
            <p>Order from multiple restaurants in one platform</p>
          </FeatureCard>
          <FeatureCard>
            <Utensils size={40} color="var(--primary-color)" />
            <h3>Fresh Food</h3>
            <p>Only the freshest ingredients from trusted partners</p>
          </FeatureCard>
        </FeaturesGrid>
      </FeaturesSection>

      {/* Featured Restaurants */}
      <RestaurantsSection>
        <SectionHeader>
          <h2>Featured Restaurants</h2>
          <Link to="/login" className="d-flex align-center gap-2">
            View All <ArrowRight size={20} />
          </Link>
        </SectionHeader>
        <RestaurantsGrid>
          {featuredRestaurants.map((restaurant) => (
            <RestaurantCard 
              key={restaurant.id}
              onClick={() => handleRestaurantClick(restaurant.id)}
            >
              <RestaurantImage src={restaurant.image} alt={restaurant.name} />
              <RestaurantInfo>
                <RestaurantName>{restaurant.name}</RestaurantName>
                <RestaurantCuisine>{restaurant.cuisine}</RestaurantCuisine>
                <RestaurantMeta>
                  <Rating>
                    <Star size={16} fill="var(--warning-color)" color="var(--warning-color)" />
                    <span>{restaurant.rating}</span>
                  </Rating>
                  <DeliveryTime>
                    <Clock size={16} />
                    <span>{restaurant.deliveryTime}</span>
                  </DeliveryTime>
                </RestaurantMeta>
              </RestaurantInfo>
            </RestaurantCard>
          ))}
        </RestaurantsGrid>
      </RestaurantsSection>

      {/* CTA Section */}
      <CTASection>
        <CTAContent>
          <h2>Ready to Order?</h2>
          <p>Join thousands of satisfied customers enjoying delicious food</p>
          <CTAButtons className="d-flex gap-3 justify-center">
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-outline">
              Sign In
            </Link>
          </CTAButtons>
        </CTAContent>
      </CTASection>

      {/* Role Selection */}
      <RoleSection>
        <h2 className="text-center mb-4">Are You a Restaurant?</h2>
        <RoleGrid>
          <RoleCard>
            <h3>Restaurant Owner</h3>
            <p>Manage your restaurant, menu, and orders</p>
            <Link to="/owner-login" className="btn btn-secondary w-100">
              Owner Login
            </Link>
          </RoleCard>
          <RoleCard>
            <h3>Staff Member</h3>
            <p>Chef or Waiter dashboard access</p>
            <Link to="/login" className="btn btn-secondary w-100">
              Staff Login
            </Link>
          </RoleCard>
          <RoleCard>
            <h3>Super Admin</h3>
            <p>Manage multiple restaurants</p>
            <Link to="/super-login" className="btn btn-secondary w-100">
              Admin Login
            </Link>
          </RoleCard>
        </RoleGrid>
      </RoleSection>
    </LandingContainer>
  );
};

// Styled Components
const LandingContainer = styled.div`
  min-height: 100vh;
`;

const HeroSection = styled.section`
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 100px 20px;
  text-align: center;
`;

const HeroContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  
  h1 {
    font-size: 3rem;
    margin-bottom: 20px;
  }
  
  p {
    font-size: 1.25rem;
    margin-bottom: 40px;
    opacity: 0.9;
  }
`;

const SearchForm = styled.form`
  display: flex;
  max-width: 600px;
  margin: 0 auto;
  gap: 10px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SearchInputWrapper = styled.div`
  flex: 1;
  position: relative;
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-color);
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 16px 16px 16px 48px;
  border: none;
  border-radius: var(--radius);
  font-size: 16px;
  
  &:focus {
    outline: none;
  }
`;

const SearchButton = styled.button`
  padding: 16px 32px;
  background: var(--dark-color);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover {
    background: #1a1e24;
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const FeaturesSection = styled.section`
  padding: 80px 20px;
  background: white;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
`;

const FeatureCard = styled.div`
  text-align: center;
  padding: 30px;
  
  h3 {
    margin: 20px 0 10px;
  }
  
  p {
    color: var(--gray-color);
  }
`;

const RestaurantsSection = styled.section`
  padding: 80px 20px;
  background: var(--light-gray);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  max-width: 1200px;
  margin: 0 auto 40px;
`;

const RestaurantsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
`;

const RestaurantCard = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
  }
`;

const RestaurantImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
`;

const RestaurantInfo = styled.div`
  padding: 20px;
`;

const RestaurantName = styled.h3`
  margin-bottom: 5px;
`;

const RestaurantCuisine = styled.p`
  color: var(--gray-color);
  margin-bottom: 15px;
`;

const RestaurantMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Rating = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
`;

const DeliveryTime = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--gray-color);
`;

const CTASection = styled.section`
  padding: 80px 20px;
  background: linear-gradient(135deg, var(--dark-color), #1a1e24);
  color: white;
  text-align: center;
`;

const CTAContent = styled.div`
  max-width: 600px;
  margin: 0 auto;
  
  h2 {
    margin-bottom: 20px;
  }
  
  p {
    margin-bottom: 40px;
    opacity: 0.9;
  }
`;

const CTAButtons = styled.div`
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const RoleSection = styled.section`
  padding: 80px 20px;
  background: white;
`;

const RoleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
`;

const RoleCard = styled.div`
  padding: 40px 30px;
  text-align: center;
  border: 2px solid var(--light-gray);
  border-radius: var(--radius-lg);
  transition: border-color 0.3s ease;
  
  &:hover {
    border-color: var(--primary-color);
  }
  
  h3 {
    margin-bottom: 10px;
  }
  
  p {
    color: var(--gray-color);
    margin-bottom: 30px;
  }
`;

export default LandingPage;