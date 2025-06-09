import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import useCartStore from '@/store/cartStore';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

// Lazy load pages
const Home = lazy(() => import('@/pages/Home'));
const Products = lazy(() => import('@/pages/Products'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Cart = lazy(() => import('@/pages/Cart'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Profile = lazy(() => import('@/pages/Profile'));
const Orders = lazy(() => import('@/pages/Orders'));
const AdminDashboard = lazy(() => import('@/pages/Admin/Dashboard'));
const AdminProducts = lazy(() => import('@/pages/Admin/ProductManagement'));
const AdminOrders = lazy(() => import('@/pages/Admin/OrderManagement'));

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Public Route Component (redirects if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Main Layout Component
const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner />
          </div>
        }>
          {children}
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

// Admin Layout Component
const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      }>
        {children}
      </Suspense>
    </div>
  );
};

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const syncCart = useCartStore((state) => state.syncCart);
  
  useEffect(() => {
    // Check authentication status on app load
    checkAuth();
    
    // Sync cart with server if authenticated
    const token = localStorage.getItem('auth_token');
    if (token) {
      syncCart();
    }
  }, [checkAuth, syncCart]);
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<MainLayout><Home /></MainLayout>} />
      <Route path="/products" element={<MainLayout><Products /></MainLayout>} />
      <Route path="/products/:id" element={<MainLayout><ProductDetail /></MainLayout>} />
      <Route path="/cart" element={<MainLayout><Cart /></MainLayout>} />
      
      {/* Auth Routes (redirect if already logged in) */}
      <Route path="/login" element={
        <PublicRoute>
          <MainLayout><Login /></MainLayout>
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <MainLayout><Register /></MainLayout>
        </PublicRoute>
      } />
      
      {/* Protected Routes */}
      <Route path="/checkout" element={
        <ProtectedRoute>
          <MainLayout><Checkout /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <MainLayout><Profile /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute>
          <MainLayout><Orders /></MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout><AdminDashboard /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/products" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout><AdminProducts /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/orders" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout><AdminOrders /></AdminLayout>
        </ProtectedRoute>
      } />
      
      {/* 404 Route */}
      <Route path="*" element={
        <MainLayout>
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-8">صفحه مورد نظر یافت نشد</p>
            <a href="/" className="btn btn-primary">
              بازگشت به صفحه اصلی
            </a>
          </div>
        </MainLayout>
      } />
    </Routes>
  );
}

export default App;