import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminLogin.css';
import api from '../axios/axios';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('api/auth/admin-login', { username, password });
      
      // Store the token
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('role', data.role);
      
      // Navigate based on role
      if (data.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (data.role === 'question_uploader') {
        navigate('/question-upload');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className='admin-login-container'>
      <h1 className='title text-light'>Admin Login</h1>
      <div className="form-container">
        <form className="admin-form" onSubmit={handleAdminLogin}>
          <div className="input-group">
            <label htmlFor="username" className="label">Username</label>
            <input 
              className="input-field" 
              type="text" 
              id="username"
              placeholder='Enter username'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <label htmlFor="password" className="label">Password</label>
            <input 
              className="input-field" 
              type="password" 
              id="password"
              placeholder='Enter password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="admin-error-message">{error}</div>}

          <div className='admin-start'>
            <button type="submit" className='admin-btn'>Login</button>
          </div>
        </form>
      </div>
    </div>
  );
}
