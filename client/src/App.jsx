import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import GroupDetail from './pages/GroupDetail';
import './App.css';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#f0f0f5',
            border: '1px solid #2a2a40',
            borderRadius: '12px',
          },
        }}
      />
      <div className="app-container">
        <nav className="navbar">
          <NavLink to="/" className="navbar-brand">
            <span className="logo">💰</span>
            Split It Fair
          </NavLink>
          <div className="navbar-links">
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
              Groups
            </NavLink>
          </div>
        </nav>
        <main className="page-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/groups/:groupId" element={<GroupDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
