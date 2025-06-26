import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// import api, { endpoints } from '@/services/api'; // Original import, replaced with simulation
import toast from 'react-hot-toast';

// --- Start of API Simulation for auth-store.js ---
const mockUser = {
  _id: 'user123',
  id: 'user123', // often APIs return 'id' as well or frontend expects it
  name: 'کاربر تست',
  email: 'test@example.com',
  role: 'user',
  // other fields that might be expected by the app
};

const endpoints = {
  login: '/api/auth/login',
  register: '/api/auth/register', // Added for completeness if register is also refactored
  logout: '/api/auth/logout',     // Added for completeness
  profile: '/api/auth/me',        // Added for checkAuth
  updateProfile: '/api/users/profile', // Placeholder, adjust if user-routes.js has this
  changePassword: '/api/auth/update-password' // From auth-routes.js
};

const api = {
  post: async (url, data) => {
    console.log(`SIMULATED API POST: ${url}`, data);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

    if (url === endpoints.login) {
      if (data.email === 'test@example.com' && data.password === 'password') {
        return {
          data: {
            user: mockUser,
            token: 'mock-jwt-token-12345',
            refreshToken: 'mock-refresh-token-67890' // auth-controller also sends this
          }
        };
      } else {
        // Simulate an error structure that the store's catch block might expect
        const error = new Error('Simulated API Error');
        error.response = { data: { message: 'ایمیل یا رمز عبور نامعتبر است' } };
        throw error;
      }
    }
    if (url === endpoints.register) {
      // Simulate registration success
      return {
        data: {
          user: { ...mockUser, email: data.email, name: data.name || 'کاربر جدید' },
          token: 'new-mock-jwt-token-for-register',
          refreshToken: 'new-mock-refresh-token'
        }
      };
    }
    if (url === endpoints.logout) {
      return { data: { success: true, message: 'با موفقیت خارج شدید (سیمولیتد)'}};
    }
    if (url === endpoints.changePassword) {
        // Simulate success, no specific data needed beyond status
        return { data: { success: true, message: 'رمز عبور با موفقیت تغییر یافت (سیمولیتد)' } };
    }

    // Default for unhandled POST endpoints
    const unhandledError = new Error(`Unhandled SIMULATED API POST endpoint: ${url}`);
    unhandledError.response = { data: { message: `Endpoint ${url} not handled in POST simulation.` } };
    throw unhandledError;
  },
  get: async (url) => {
    console.log(`SIMULATED API GET: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 500));

    if (url === endpoints.profile) {
      // Simulate fetching user profile if a token is present (logic handled by checkAuth)
      // For simulation, assume token is valid and return mockUser
      return { data: mockUser };
    }
    const unhandledError = new Error(`Unhandled SIMULATED API GET endpoint: ${url}`);
    unhandledError.response = { data: { message: `Endpoint ${url} not handled in GET simulation.` } };
    throw unhandledError;
  },
  put: async (url, data) => {
    console.log(`SIMULATED API PUT: ${url}`, data);
    await new Promise(resolve => setTimeout(resolve, 500));

    if (url === endpoints.updateProfile) {
        // Simulate profile update
        const updatedUser = { ...mockUser, ...data };
        // Update the mockUser in the simulation so getProfile reflects changes
        Object.assign(mockUser, updatedUser);
        return { data: updatedUser };
    }
    const unhandledError = new Error(`Unhandled SIMULATED API PUT endpoint: ${url}`);
    unhandledError.response = { data: { message: `Endpoint ${url} not handled in PUT simulation.` } };
    throw unhandledError;
  }
};
// --- End of API Simulation ---

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      // Login action
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await api.post(endpoints.login, credentials);
          const { user, token } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Save token to localStorage
          localStorage.setItem('auth_token', token);
          
          toast.success(`خوش آمدید ${user.name}`);
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.response?.data?.message };
        }
      },
      
      // Register action
      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await api.post(endpoints.register, userData);
          const { user, token } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          localStorage.setItem('auth_token', token);
          
          toast.success('ثبت نام با موفقیت انجام شد');
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.response?.data?.message };
        }
      },
      
      // Logout action
      logout: async () => {
        try {
          await api.post(endpoints.logout);
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          
          localStorage.removeItem('auth_token');
          toast.success('با موفقیت خارج شدید');
        }
      },
      
      // Update profile
      updateProfile: async (profileData) => {
        set({ isLoading: true });
        try {
          const response = await api.put(endpoints.updateProfile, profileData);
          const updatedUser = response.data;
          
          set({
            user: updatedUser,
            isLoading: false,
          });
          
          toast.success('پروفایل با موفقیت بروزرسانی شد');
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.response?.data?.message };
        }
      },
      
      // Check auth status
      checkAuth: async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null });
          return;
        }
        
        set({ isLoading: true }); // Indicate loading during checkAuth
        try {
          const response = await api.get(endpoints.profile);
          set({
            user: response.data,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          localStorage.removeItem('auth_token');
        }
      },
      
      // Change password
      changePassword: async (passwordData) => {
        set({ isLoading: true });
        try {
          await api.post(endpoints.changePassword, passwordData);
          set({ isLoading: false });
          
          toast.success('رمز عبور با موفقیت تغییر یافت');
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.response?.data?.message };
        }
      },
      
      // Clear auth state
      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        localStorage.removeItem('auth_token');
      },
    }),
    {
      name: 'auth-storage', // unique name
      partialize: (state) => ({ 
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
