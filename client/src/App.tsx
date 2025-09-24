// FreelanceHub main app with routing for Week 4 features
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Project from './pages/Project';
import Admin from './pages/Admin';
import { api } from './services/api';
import './App.css';

function App() {
  const [serverStatus, setServerStatus] = useState<string>('checking...');

  // Check server health on load
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await api.get('/health');
        setServerStatus(`✅ Server OK (uptime: ${Math.round(response.data.uptime)}s)`);
      } catch (error) {
        setServerStatus('❌ Server offline');
      }
    };
    checkServer();
  }, []);

  return (
    <Router>
      <div className="App">
        {/* Simple navigation */}
        <nav style={{
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #ccc',
          marginBottom: '2rem'
        }}>
          <h1 style={{ margin: 0, display: 'inline-block', marginRight: '2rem' }}>
            FreelanceHub
          </h1>
          <Link to="/" style={{ marginRight: '1rem', textDecoration: 'none' }}>
            Home
          </Link>
          <Link to="/project/sample" style={{ marginRight: '1rem', textDecoration: 'none' }}>
            Project Demo
          </Link>
          <Link to="/admin" style={{ marginRight: '1rem', textDecoration: 'none' }}>
            Admin
          </Link>
          <span style={{ float: 'right', fontSize: '0.9rem' }}>
            {serverStatus}
          </span>
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/project/:id" element={<Project />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
}

// Simple home page
const HomePage: React.FC = () => {
  return (
    <div className="container" style={{ padding: '2rem' }}>
      <h2>Welcome to FreelanceHub</h2>
      <p>A marketplace connecting freelancers with clients.</p>

      <div style={{ marginTop: '2rem' }}>
        <h3>Week 4 Features Demo:</h3>
        <ul>
          <li><Link to="/project/sample">Project Page</Link> - Timer, Payment, Reviews</li>
          <li><Link to="/admin">Admin Dashboard</Link> - User & Project Management</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', border: '1px solid #ccc' }}>
        <h4>Development Notes:</h4>
        <p><strong>Auth:</strong> Uses x-user-email header (dev only)</p>
        <p><strong>Database:</strong> MongoDB Atlas</p>
        <p><strong>Payments:</strong> Stripe (test mode)</p>
        <p><strong>File Uploads:</strong> Local storage (dev only)</p>
      </div>
    </div>
  );
};

export default App
