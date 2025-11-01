// FreelanceHub - Professional Freelance Marketplace Design (Week 5)
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Project from './pages/Project';
import Admin from './pages/Admin';
import Notifications from './pages/Notifications';
import Search from './pages/Search';
import SearchFreelancers from './pages/SearchFreelancers';
import CreateProject from './pages/CreateProject';
import Profile from './pages/Profile';
import ViewProfile from './pages/ViewProfile';
import MyProposals from './pages/MyProposals';
import MyProjects from './pages/MyProjects';
import Messages from './pages/Messages';
import AuthModal from './components/AuthModal';
import axios from 'axios';
import './App.css';

function App() {
  const [serverStatus, setServerStatus] = useState<string>('checking...');
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Check server health and restore user session
  useEffect(() => {
    const checkServer = async () => {
      try {
        await axios.get('https://freelancehub-1-y9d7.onrender.com/health');
        setServerStatus(`✅ Connected`);
      } catch (error) {
        console.error('Server connection failed:', error);
        setServerStatus('❌ Offline');
      } finally {
        setIsLoading(false);
      }
    };

    // Restore user session from localStorage
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setUser(JSON.parse(savedUser));
    }

    checkServer();
  }, []);

  const handleAuthSuccess = (userData: any, userToken: string) => {
    setUser(userData);
    setShowAuthModal(false);
    console.log('User authenticated:', userData);
    console.log('Token received:', userToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowUserDropdown(false);
    // Dispatch event to notify other components (like Admin)
    window.dispatchEvent(new Event('userLogout'));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserDropdown && !target.closest('.user-dropdown-container')) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading FreelanceHub...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        {/* Professional Header */}
        <header className="header">
          <div className="header-content">
            <Link to="/" className="logo">
              <span className="logo-icon">🚀</span>
              FreelanceHub
            </Link>

            <nav className="main-nav">
              <Link to="/search" className="nav-item">Find Work</Link>
              {user && user.userType === 'client' && (
                <Link to="/search-freelancers" className="nav-item">Find Freelancers</Link>
              )}
              {user && (
                <>
                  <Link to="/notifications" className="nav-item">Notifications</Link>
                  <Link to="/admin" className="nav-item">Dashboard</Link>
                </>
              )}
            </nav>

            <div className="header-actions">
              <span className="server-status">{serverStatus}</span>
              {user ? (
                <div className="user-dropdown-container" style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      background: '#f8f9fa',
                      border: '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f0f9f0';
                      e.currentTarget.style.borderColor = '#e4e5e7';
                    }}
                    onMouseLeave={(e) => {
                      if (!showUserDropdown) {
                        e.currentTarget.style.background = '#f8f9fa';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                    className={showUserDropdown ? 'user-dropdown-active' : ''}
                  >
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '0.25rem'
                    }}>
                      <span style={{
                        color: '#333',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                      }}>
                        {user.firstName} {user.lastName}
                      </span>
                      <span style={{
                        color: '#666',
                        fontSize: '0.75rem',
                        textTransform: 'capitalize'
                      }}>
                        {user.userType}
                      </span>
                    </div>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #14a800 0%, #108e00 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '1rem',
                      boxShadow: '0 2px 4px rgba(20, 168, 0, 0.2)',
                      flexShrink: 0
                    }}>
                      {user.firstName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        transition: 'transform 0.2s ease',
                        transform: showUserDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}
                    >
                      <path
                        d="M6 9L1 4h10L6 9z"
                        fill="#666"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="user-dropdown-menu">
                      <div className="dropdown-header">
                        <div style={{ fontWeight: '600', color: '#333', fontSize: '0.9375rem' }}>
                          {user.firstName} {user.lastName}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.8125rem', textTransform: 'capitalize', marginTop: '0.25rem' }}>
                          {user.email}
                        </div>
                      </div>
                      <div className="dropdown-divider"></div>
                      {user.userType === 'freelancer' && (
                        <>
                          <Link
                            to="/profile"
                            className="dropdown-item"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            <span>👤</span>
                            <span>My Profile</span>
                          </Link>
                          <Link
                            to="/my-proposals"
                            className="dropdown-item"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            <span>📝</span>
                            <span>My Proposals</span>
                          </Link>
                          <Link
                            to="/my-projects"
                            className="dropdown-item"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            <span>💼</span>
                            <span>My Projects</span>
                          </Link>
                        </>
                      )}
                      {user.userType === 'client' && (
                        <>
                          <Link
                            to="/create-project"
                            className="dropdown-item"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            <span>➕</span>
                            <span>Post Project</span>
                          </Link>
                          <Link
                            to="/search-freelancers"
                            className="dropdown-item"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            <span>🔍</span>
                            <span>Find Freelancers</span>
                          </Link>
                        </>
                      )}
                      <Link
                        to="/notifications"
                        className="dropdown-item"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <span>🔔</span>
                        <span>Notifications</span>
                      </Link>
                      <Link
                        to="/messages"
                        className="dropdown-item"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <span>💬</span>
                        <span>Messages</span>
                      </Link>
                      <Link
                        to="/admin"
                        className="dropdown-item"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <span>📊</span>
                        <span>Dashboard</span>
                      </Link>
                      <div className="dropdown-divider"></div>
                      <button
                        onClick={handleLogout}
                        className="dropdown-item dropdown-item-danger"
                      >
                        <span>🚪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-primary"
                  style={{
                    padding: '0.625rem 1.5rem',
                    fontSize: '0.9375rem',
                    fontWeight: '600'
                  }}
                >
                  Sign In / Sign Up
                </button>
              )}
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/project/:id" element={<Project />} />
          <Route path="/create-project" element={<CreateProject />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-proposals" element={<MyProposals />} />
          <Route path="/my-projects" element={<MyProjects />} />
          <Route path="/freelancer/:id" element={<ViewProfile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:userId" element={<Messages />} />
          <Route path="/messages/project/:projectId" element={<Messages />} />
          <Route path="/messages/project/:projectId/user/:userId" element={<Messages />} />
          <Route path="/search" element={<Search />} />
          <Route path="/search-freelancers" element={<SearchFreelancers />} />
        </Routes>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-section">
              <h4>FreelanceHub</h4>
              <p>The world's work marketplace</p>
            </div>
            <div className="footer-section">
              <h4>For Clients</h4>
              <a href="#">How to Hire</a>
              <a href="#">Talent Marketplace</a>
              <a href="#">Project Catalog</a>
            </div>
            <div className="footer-section">
              <h4>For Freelancers</h4>
              <a href="#">How to Find Work</a>
              <a href="#">Direct Contracts</a>
              <a href="#">Find Freelance Jobs</a>
            </div>
            <div className="footer-section">
              <h4>Resources</h4>
              <a href="#">Help & Support</a>
              <a href="#">Success Stories</a>
              <a href="#">Reviews</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 FreelanceHub. All rights reserved.</p>
          </div>
        </footer>

        {/* Authentication Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    </Router>
  );
}

// Professional Homepage inspired by Upwork/Fiverr
const HomePage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <main className="homepage">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Find the perfect freelance services for your business</h1>
            <p>Work with talented people at the most affordable price to get the most out of your time and cost</p>

            {/* Search Bar */}
            <div className="hero-search">
              <input
                type="text"
                placeholder="Try 'building mobile app'"
                className="search-input"
              />
              <button className="search-btn">Search</button>
            </div>

            {/* Popular Searches */}
            <div className="popular-searches">
              <span>Popular:</span>
              <a href="#">Website Design</a>
              <a href="#">WordPress</a>
              <a href="#">Logo Design</a>
              <a href="#">AI Services</a>
            </div>
          </div>

          <div className="hero-image">
            <div className="hero-graphic">
              <div className="floating-card card-1">
                <div className="card-icon">💻</div>
                <div className="card-text">Web Development</div>
              </div>
              <div className="floating-card card-2">
                <div className="card-icon">🎨</div>
                <div className="card-text">Design</div>
              </div>
              <div className="floating-card card-3">
                <div className="card-icon">📱</div>
                <div className="card-text">Mobile Apps</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="trusted-by">
        <div className="container">
          <p>Trusted by:</p>
          <div className="company-logos">
            <div className="company-logo">Microsoft</div>
            <div className="company-logo">Airbnb</div>
            <div className="company-logo">Bissell</div>
            <div className="company-logo">P&G</div>
            <div className="company-logo">PayPal</div>
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="popular-services">
        <div className="container">
          <h2>Popular professional services</h2>
          <div className="services-grid">
            <Link to="/search?category=Web Development" className="service-card">
              <div className="service-icon">💻</div>
              <h3>Website Development</h3>
              <p>Custom websites and web applications</p>
            </Link>

            <Link to="/search?category=Design" className="service-card">
              <div className="service-icon">🎨</div>
              <h3>Logo & Brand Identity</h3>
              <p>Professional branding and design</p>
            </Link>

            <Link to="/search?category=Mobile Development" className="service-card">
              <div className="service-icon">📱</div>
              <h3>Mobile App Development</h3>
              <p>iOS and Android applications</p>
            </Link>

            <Link to="/search?category=Writing" className="service-card">
              <div className="service-icon">✍️</div>
              <h3>Content Writing</h3>
              <p>Articles, blogs, and copywriting</p>
            </Link>

            <Link to="/search?category=Marketing" className="service-card">
              <div className="service-icon">📈</div>
              <h3>Digital Marketing</h3>
              <p>SEO, social media, and advertising</p>
            </Link>

            <Link to="/search?category=Data Science" className="service-card">
              <div className="service-icon">📊</div>
              <h3>Data & Analytics</h3>
              <p>Data analysis and visualization</p>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2>How FreelanceHub works</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Post a job</h3>
              <p>Tell us what you need done and receive competitive proposals from freelancers within minutes.</p>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <h3>Choose freelancers</h3>
              <p>Compare profiles, reviews, and proposals, then interview your favorites and hire the best fit.</p>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <h3>Pay safely</h3>
              <p>Use our built-in messaging, time tracking, and milestone system to collaborate and pay with confidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">4M+</div>
              <div className="stat-label">Active freelancers</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">1M+</div>
              <div className="stat-label">Active clients</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">$3B+</div>
              <div className="stat-label">Paid to freelancers</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">99%</div>
              <div className="stat-label">Customer satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Find the talent needed to get your business growing.</h2>
            <div className="cta-buttons">
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn-primary-large"
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  display: 'inline-block',
                  background: 'white',
                  color: '#667eea',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Get Started
              </button>
              <Link to="/project/sample" className="btn-secondary-large">View Demo</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Features */}
      <section className="demo-features">
        <div className="container">
          <h2>Explore Our Features</h2>
          <div className="demo-grid">
            <Link to="/project/sample" className="demo-card">
              <div className="demo-icon">⏱️</div>
              <h3>Time Tracking</h3>
              <p>Built-in time tracking and project management tools</p>
            </Link>

            <Link to="/notifications" className="demo-card">
              <div className="demo-icon">🔔</div>
              <h3>Smart Notifications</h3>
              <p>Stay updated with real-time alerts and messages</p>
            </Link>

            <Link to="/admin" className="demo-card">
              <div className="demo-icon">📊</div>
              <h3>Admin Dashboard</h3>
              <p>Comprehensive management and analytics tools</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Authentication Modal for Homepage */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(user, token) => {
          // This would ideally be handled by a global state management
          console.log('User authenticated:', user, 'Token:', token);
          setShowAuthModal(false);
        }}
      />
    </main>
  );
};

export default App;