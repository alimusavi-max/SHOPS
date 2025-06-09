import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api, { endpoints } from '@/services/api';
import toast from 'react-hot-toast';

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
        
        try {
          const response = await api.get(endpoints.profile);
          set({
            user: response.data,
            token,
            isAuthenticated: true,
          });
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
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