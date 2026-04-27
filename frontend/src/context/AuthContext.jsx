import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('auth/profile');
                setUser(response.data);
            } catch (error) {
                console.error('Session check failed:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();

        // Ensure deviceId persistence for hardware binding
        if (!localStorage.getItem('twishh_device_id')) {
            const newId = `TS-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
            localStorage.setItem('twishh_device_id', newId);
        }
    }, []);

    const login = async (email, password) => {
        console.log("INITIATING HANDSHAKE FOR:", email);
        const deviceId = localStorage.getItem('twishh_device_id');
        const response = await api.post('auth/login', { email, password, deviceId });
        console.log("HANDSHAKE SUCCESSFUL - ROLE:", response.data.user?.role);
        setUser(response.data.user);
        return response.data; // Return full response data for OTP detection
    };

  const verifyOTP = async (email, otp) => {
    const deviceId = localStorage.getItem('twishh_device_id');
    const response = await api.post('auth/verify-otp', { email, otp, deviceId });
    setUser(response.data.user);
    return response.data.user;
  };

  const setSession = (userData) => {
    setUser(userData);
  };

  const signup = async (data) => {
    console.log("INITIATING AGENT REGISTRATION...");
    const response = await api.post('auth/register-company', data);
    console.log("REGISTRATION SUCCESSFUL - ASCENDING TO HUB");
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = async () => {
    try {
        await api.post('auth/logout');
    } finally {
        setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, verifyOTP, setSession, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
};

export const useAuth = () => useContext(AuthContext);
