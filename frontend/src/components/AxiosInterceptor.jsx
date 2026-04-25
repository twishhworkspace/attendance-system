import { useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const AxiosInterceptor = ({ children }) => {
  const { showToast } = useToast();
  const { logout } = useAuth();

  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error.response?.data?.error || error.response?.data?.message || error.message || 'An unexpected error occurred';
        
        // Handle 401 Unauthorized / Session Expired
        if (error.response?.status === 401) {
          showToast('Session expired. Please log in again.', 'error');
          logout();
        } else {
          showToast(message, 'error');
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [showToast, logout]);

  return children;
};

export default AxiosInterceptor;
