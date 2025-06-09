import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Search, 
  Menu, 
  X, 
  User, 
  Heart, 
  LogOut,
  Package,
  Settings,
  ChevronDown
} from 'lucide-react';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';
import useAuthStore from '@/store/authStore';
import useCartStore from '@/store/cartStore';
import CartDropdown from '@/components/cart/CartDropdown';

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  
  const { user, isAuthenticated, logout } = useAuthStore();
  const { getItemsCount, isOpen: isCartOpen, toggleCart } = useCartStore();
  const cartItemsCount = getItemsCount();
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  const categories = [
    { id: 1, name: 'لوازم برقی', slug: 'electronics', icon: '⚡' },
    { id: 2, name: 'وسایل شخصی', slug: 'personal', icon: '👤' },
    { id: 3, name: 'لوازم منزل', slug: 'home', icon: '🏠' },
    { id: 4, name: 'ورزش و سفر', slug: 'sports', icon: '⚽' },
  ];
  
  return (
    <>
      <header className={`bg-white sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'shadow-lg' : 'shadow-sm'
      }`}>
        {/* Top Bar */}
        <div className="bg-gray-900 text-white text-sm">
          <div className="container-custom py-2">
            <div className="flex items-center justify-between">
              <div className="hidden sm:flex items-center gap-4">
                <span>📞 پشتیبانی: 021-12345678</span>
                <span>📧 info@shop.com</span>
              </div>
              <div className="flex items-center gap-4 mr-auto">
                <Link to="/track-order" className="hover:text-primary-400">
                  پیگیری سفارش
                </Link>
                <Link to="/help" className="hover:text-primary-400">
                  راهنما
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Header */}
        <div className="container-custom">
          <div className="flex items-center justify-between py-4">
            {/* Logo & Menu Toggle */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">ف</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 hidden sm:block">
                  فروشگاه <span className="text-primary-500">آنلاین</span>
                </h1>
              </Link>
            </div>
            
            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  placeholder="جستجوی محصولات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pr-10"
                />
                <button 
                  type="submit"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>
            </div>
            
            {/* User Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Search Toggle - Mobile */}
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Search className="w-6 h-6 text-gray-600" />
              </button>
              
              {/* Wishlist */}
              <Link 
                to="/wishlist"
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Heart className="w-6 h-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  0
                </span>
              </Link>
              
              {/* Cart */}
              <button 
                onClick={toggleCart}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-6 h-6 text-gray-600" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </button>
              
              {/* User Menu */}
              {isAuthenticated ? (
                <HeadlessMenu as="div" className="relative">
                  <HeadlessMenu.Button className="flex items-center gap-2 bg-primary-500 text-white px-3 py-2 rounded-lg hover:bg-primary-600 transition-colors">
                    <User className="w-5 h-5" />
                    <span className="hidden sm:inline">{user?.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </HeadlessMenu.Button>
                  
                  <Transition
                    enter="transition duration-100 ease-out"
                    enterFrom="transform scale-95 opacity-0"
                    enterTo="transform scale-100 opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform scale-100 opacity-100"
                    leaveTo="transform scale-95 opacity-0"
                  >
                    <HeadlessMenu.Items className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden">
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <Link
                            to="/profile"
                            className={`flex items-center gap-2 px-4 py-2 text-sm ${
                              active ? 'bg-gray-100' : ''
                            }`}
                          >
                            <User className="w-4 h-4" />
                            پروفایل
                          </Link>
                        )}
                      </HeadlessMenu.Item>
                      
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <Link
                            to="/orders"
                            className={`flex items-center gap-2 px-4 py-2 text-sm ${
                              active ? 'bg-gray-100' : ''
                            }`}
                          >
                            <Package className="w-4 h-4" />
                            سفارشات من
                          </Link>
                        )}
                      </HeadlessMenu.Item>
                      
                      {user?.role === 'admin' && (
                        <>
                          <div className="border-t border-gray-100" />
                          <HeadlessMenu.Item>
                            {({ active }) => (
                              <Link
                                to="/admin"
                                className={`flex items-center gap-2 px-4 py-2 text-sm ${
                                  active ? 'bg-gray-100' : ''
                                }`}
                              >
                                <Settings className="w-4 h-4" />
                                پنل مدیریت
                              </Link>
                            )}
                          </HeadlessMenu.Item>
                        </>
                      )}
                      
                      <div className="border-t border-gray-100" />
                      
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-right text-red-600 ${
                              active ? 'bg-gray-100' : ''
                            }`}
                          >
                            <LogOut className="w-4 h-4" />
                            خروج
                          </button>
                        )}
                      </HeadlessMenu.Item>
                    </HeadlessMenu.Items>
                  </Transition>
                </HeadlessMenu>
              ) : (
                <Link 
                  to="/login"
                  className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">ورود | ثبت‌نام</span>
                </Link>
              )}
            </div>
          </div>
          
          {/* Mobile Search */}
          {isSearchOpen && (
            <div className="md:hidden pb-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="جستجوی محصولات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pr-10"
                  autoFocus
                />
                <button 
                  type="submit"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}
        </div>
        
        {/* Navigation */}
        <nav className={`${isMenuOpen ? 'block' : 'hidden'} lg:block border-t border-gray-200`}>
          <div className="container-custom">
            <ul className="flex flex-col lg:flex-row lg:items-center lg:gap-8 py-2">
              <li>
                <Link 
                  to="/products"
                  className="flex items-center gap-2 py-3 lg:py-2 px-2 hover:text-primary-500 transition-colors font-medium"
                >
                  همه محصولات
                </Link>
              </li>
              
              {categories.map(category => (
                <li key={category.id}>
                  <Link
                    to={`/products?category=${category.slug}`}
                    className="flex items-center gap-2 py-3 lg:py-2 px-2 hover:text-primary-500 transition-colors"
                  >
                    <span className="text-xl">{category.icon}</span>
                    <span>{category.name}</span>
                  </Link>
                </li>
              ))}
              
              <li className="mr-auto">
                <Link 
                  to="/offers"
                  className="flex items-center gap-2 py-3 lg:py-2 px-2 text-red-600 font-semibold hover:text-red-700 transition-colors"
                >
                  <span className="animate-pulse">🔥</span>
                  تخفیف‌های ویژه
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>
      
      {/* Cart Dropdown */}
      <CartDropdown />
    </>
  );
};

export default Header;