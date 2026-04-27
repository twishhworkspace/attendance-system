import React, { createContext, useState, useEffect, useContext } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
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

  const registerPasskey = async () => {
    try {
      console.log("[BIOMETRIC] Fetching registration options...");
      const optionsRes = await api.get('auth/passkey/register-options');
      
      console.log("[BIOMETRIC] Starting browser-level registration...");
      const attResp = await startRegistration(optionsRes.data);
      
      console.log("[BIOMETRIC] Sending verification to server...");
      const verifyRes = await api.post('auth/passkey/verify-registration', attResp);
      
      console.log("[BIOMETRIC] Registration status:", verifyRes.data.verified);
      return verifyRes.data.verified;
    } catch (err) {
      console.error('[BIOMETRIC_CRITICAL] Registration Failed:', err);
      // If it's a browser error, we want to know the name (e.g., NotAllowedError)
      if (err.name) console.error('[BIOMETRIC_ERROR_NAME]', err.name);
      throw err;
    }
  };

  const loginWithPasskey = async (email) => {
    try {
      console.log("[BIOMETRIC] Fetching login options for:", email);
      const optionsRes = await api.get(`auth/passkey/login-options?email=${email}`);
      
      console.log("[BIOMETRIC] Starting browser-level authentication...");
      const asseResp = await startAuthentication(optionsRes.data);
      
      console.log("[BIOMETRIC] Sending auth verification to server...");
      const verifyRes = await api.post('auth/passkey/verify-login', { body: asseResp, email });
      
      setUser(verifyRes.data.user);
      return verifyRes.data.user;
    } catch (err) {
      console.error('[BIOMETRIC_CRITICAL] Login Failed:', err);
      throw err;
    }
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
    <AuthContext.Provider value={{ user, login, signup, logout, registerPasskey, loginWithPasskey, verifyOTP, setSession, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
