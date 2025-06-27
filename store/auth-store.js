import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiGlobal, { endpoints as globalEndpoints } from '@/services/api'; // Use global api instance
import toast from 'react-hot-toast';

// Removed local API simulation and local endpoints object

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
          const response = await apiGlobal.post(globalEndpoints.login, credentials);
          // Assuming backend response is { success: true, token, user, refreshToken }
          // The interceptor already returns response.data
          const { user, token, refreshToken } = response;

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
          const response = await apiGlobal.post(globalEndpoints.register, userData);
          // Assuming backend response is { success: true, token, user, refreshToken }
          const { user, token, refreshToken } = response;

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
          // Call the backend logout, though primary effect is client-side state clearing
          await apiGlobal.get(globalEndpoints.logout); // Changed to GET to match auth-routes.js
        } catch (error) {
          // Log error but proceed with client-side logout as it's crucial
          console.error('Logout API call error (client-side logout will proceed):', error);
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
          // globalEndpoints.updateProfile is '/users/profile'
          // user-routes.js should have PATCH /profile for this.
          const response = await apiGlobal.patch(globalEndpoints.updateProfile, profileData);
          // Assuming the backend controller for updating profile returns the updated user object.
          // The interceptor returns response.data. If that data is {user: ...}, then response.user.
          // If it's just the user object, then response.
          const updatedUser = response.user || response;

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
          // globalEndpoints.changePassword is now '/auth/update-password'
          // auth-routes.js uses PATCH for this
          await apiGlobal.patch(globalEndpoints.changePassword, passwordData);
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
