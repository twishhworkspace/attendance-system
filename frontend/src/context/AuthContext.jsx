import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Synchronously initialize cached user to eliminate splash screen
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('twishh_token');
      const cached = localStorage.getItem('twishh_user');
      if (token && cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Failed to parse cached user:', e);
    }
    return null;
  });

  // If no token exists, unauthenticated state is immediately known (loading = false)
  // If token + cached user exist, hydrated immediately (loading = false)
  // Only true if a token exists but user object is not cached yet
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('twishh_token');
    const cached = localStorage.getItem('twishh_user');
    if (!token) return false;
    if (token && cached) return false;
    return true;
  });

  useEffect(() => {
    // Ensure deviceId persistence for hardware binding
    if (!localStorage.getItem('twishh_device_id')) {
      const newId = `TS-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
      localStorage.setItem('twishh_device_id', newId);
    }

    const token = localStorage.getItem('twishh_token');
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await api.get('auth/profile');
        if (response.data) {
          setUser(response.data);
          localStorage.setItem('twishh_user', JSON.stringify(response.data));
        }
      } catch (error) {
        console.error('Session check failed:', error);
        // If 401/403 (invalid/expired token), cleanly invalidate local session
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          localStorage.removeItem('twishh_token');
          localStorage.removeItem('twishh_user');
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      const hasPasskey = (user.authenticators && user.authenticators.length > 0) || user.hasPasskey === true;
      localStorage.setItem('has_passkey', hasPasskey ? 'true' : 'false');
      if (user.email) {
        localStorage.setItem('last_login_username', user.email);
      } else if (user.mobileNumber) {
        localStorage.setItem('last_login_username', user.mobileNumber);
      }
    }
  }, [user]);

  const refreshUser = async () => {
    try {
      const response = await api.get('auth/profile');
      if (response.data) {
        setUser(response.data);
        localStorage.setItem('twishh_user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  const login = async (email, password) => {
    const deviceId = localStorage.getItem('twishh_device_id');
    const response = await api.post('auth/login', { email, password, deviceId });
    
    if (response.data.token) {
      localStorage.setItem('twishh_token', response.data.token);
    }
    if (response.data.user) {
      localStorage.setItem('twishh_user', JSON.stringify(response.data.user));
      setUser(response.data.user);
    }
    return response.data;
  };

  const loginWithPasskey = async (email, credential) => {
    const response = await api.post('auth/passkey/login-verify', { email, credential });
    
    if (response.data.token) {
      localStorage.setItem('twishh_token', response.data.token);
    }
    if (response.data.user) {
      localStorage.setItem('twishh_user', JSON.stringify(response.data.user));
      setUser(response.data.user);
    }
    return response.data;
  };

  const verifyOTP = async (email, otp) => {
    const deviceId = localStorage.getItem('twishh_device_id');
    const response = await api.post('auth/verify-otp', { email, otp, deviceId });
    
    if (response.data.token) {
      localStorage.setItem('twishh_token', response.data.token);
    }
    if (response.data.user) {
      localStorage.setItem('twishh_user', JSON.stringify(response.data.user));
      setUser(response.data.user);
    }
    return response.data.user;
  };

  const setSession = (userData) => {
    if (userData) {
      localStorage.setItem('twishh_user', JSON.stringify(userData));
    }
    setUser(userData);
  };

  const signup = async (data) => {
    const response = await api.post('auth/register-company', data);
    
    if (response.data.token) {
      localStorage.setItem('twishh_token', response.data.token);
    }
    if (response.data.user) {
      localStorage.setItem('twishh_user', JSON.stringify(response.data.user));
      setUser(response.data.user);
    }
    return response.data.user;
  };

  const logout = async () => {
    try {
      await api.post('auth/logout');
    } catch (e) {
      console.warn('Logout request failed:', e);
    } finally {
      localStorage.removeItem('twishh_token');
      localStorage.removeItem('twishh_user');
      localStorage.removeItem('twishh_last_email');
      localStorage.removeItem('has_passkey');
      localStorage.removeItem('activeView');
      setUser(null);
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithPasskey, signup, logout, verifyOTP, setSession, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
