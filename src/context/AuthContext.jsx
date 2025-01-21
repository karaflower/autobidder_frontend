import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/user`);
      if (response.data) {
        setUser(response.data);
      } else {
        console.error('No user data received from server');
        logout(); // Clear invalid session
      }
    } catch (error) {
      console.error('Auth check failed:', error.response?.data || error.message);
      logout(); // Clear invalid session
    } finally {
      setLoading(false);
    }
  };

  const login = async (name, password) => {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
      name,
      password
    });
    
    const { token, user: userData } = response.data;
    
    // Set cookie with token that expires in 30 days
    Cookies.set('token', token, { expires: 30 });
    console.log(userData);
    Cookies.set('userid', userData.id, { expires: 30 });
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const register = async (name, password) => {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, {
      name,
      password
    });
    
    const { token, user: userData } = response.data;
    
    // Set cookie with token that expires in 30 days
    Cookies.set('token', token, { expires: 30 });
    Cookies.set('userid', userData.id, { expires: 30 });
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('userid');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 