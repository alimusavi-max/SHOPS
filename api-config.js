import axios from 'axios';
import toast from 'react-hot-toast';

// Base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'; // Adjusted to HTTP and standard port

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add loading state if needed
    if (config.showLoading) {
      // You can dispatch a loading action here
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Hide loading state if it was shown
    if (response.config.showLoading) {
      // Dispatch hide loading action
    }
    
    return response.data;
  },
  (error) => {
    // Hide loading state
    if (error.config?.showLoading) {
      // Dispatch hide loading action
    }
    
    // Handle common errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
          toast.error('لطفا دوباره وارد شوید');
          break;
          
        case 403:
          toast.error('شما دسترسی به این بخش ندارید');
          break;
          
        case 404:
          toast.error('آدرس مورد نظر یافت نشد');
          break;
          
        case 422:
          // Validation errors
          const validationErrors = error.response.data.errors;
          if (validationErrors) {
            Object.values(validationErrors).forEach(errors => {
              errors.forEach(error => toast.error(error));
            });
          }
          break;
          
        case 500:
          toast.error('خطایی در سرور رخ داده است');
          break;
          
        default:
          toast.error(error.response.data.message || 'خطایی رخ داده است');
      }
    } else if (error.request) {
      // Network error
      toast.error('خطا در برقراری ارتباط با سرور');
    } else {
      // Other errors
      toast.error('خطایی رخ داده است');
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  login: '/auth/login',
  register: '/auth/register',
  logout: '/auth/logout',
  profile: '/auth/me', // Corrected to /auth/me for fetching current user
  refreshToken: '/auth/refresh',
  
  // Products
  products: '/products',
  productById: (id) => `/products/${id}`,
  productsByCategory: (category) => `/products/category/${category}`,
  searchProducts: '/products/search',
  
  // Categories
  categories: '/categories',
  categoryById: (id) => `/categories/${id}`,
  
  // Cart
  cart: '/cart', // GET
  addToCart: '/cart/add', // POST
  updateCartItem: (productId) => `/cart/item/${productId}`, // PUT
  removeFromCart: (productId) => `/cart/item/${productId}`, // DELETE
  clearCart: '/cart/clear', // DELETE
  syncCart: '/cart/sync', // POST
  
  // Orders
  orders: '/orders',
  orderById: (id) => `/orders/${id}`,
  createOrder: '/orders/create',
  cancelOrder: (id) => `/orders/${id}/cancel`,
  
  // User
  updateProfile: '/users/profile', // Correct: user-routes.js has PATCH /profile (base /api/users)
  changePassword: '/auth/update-password', // Corrected to match auth-routes.js
  addresses: '/users/addresses',
  addressById: (id) => `/users/addresses/${id}`,
  
  // Admin
  adminProducts: '/admin/products',
  adminOrders: '/admin/orders',
  adminUsers: '/admin/users',
  adminDashboard: '/admin/dashboard',
  
  // Payment
  initiatePayment: '/payment/initiate',
  verifyPayment: '/payment/verify',
  
  // Wishlist
  wishlist: '/wishlist',
  addToWishlist: (id) => `/wishlist/add/${id}`,
  removeFromWishlist: (id) => `/wishlist/remove/${id}`,
};

export default api;