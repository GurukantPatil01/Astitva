import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import Home from './pages/Home';
import GroupDetail from './pages/GroupDetail';
import CreateGroup from './pages/CreateGroup';
import './App.css';

function AppNavbar({ darkMode, toggleDark }) {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isGroupDetail = location.pathname.startsWith('/groups/');
  const isCreateGroup = location.pathname === '/create-group';

  if (isLanding || isGroupDetail || isCreateGroup) return null;

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        <span className="logo">₹</span>
        Split It Fair
      </NavLink>
      <div className="navbar-links">
        <NavLink to="/app" className={({ isActive }) => isActive ? 'active' : ''}>
          Groups
        </NavLink>
        <button
          className="btn-icon"
          onClick={toggleDark}
          title="Toggle dark mode"
          style={{ marginLeft: 4 }}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: darkMode ? '#1a1a2e' : '#0a0a0a',
            color: '#fafafa',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 500,
            padding: '10px 16px',
          },
          duration: 2500,
        }}
      />
      <div className="app-container">
        <AppNavbar darkMode={darkMode} toggleDark={() => setDarkMode(!darkMode)} />
        <main className="page-container">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<Home />} />
            <Route path="/create-group" element={<CreateGroup />} />
            <Route path="/groups/:groupId" element={<GroupDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
