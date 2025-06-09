import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Filter, 
  X, 
  ChevronDown, 
  Grid, 
  List,
  SlidersHorizontal
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import ProductCard from '@/components/product/ProductCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Button from '@/components/ui/Button';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    priceRange: '',
    rating: '',
    discount: false,
    inStock: true
  });
  
  const [sortBy, setSortBy] = useState('default');
  
  // Mock data
  const allProducts = [
    { id: 1, name: 'هدفون بی‌سیم سونی WH-1000XM4', price: 4500000, category: 'electronics', image: '🎧', rating: 4.5, discount: 15, inStock: true },
    { id: 2, name: 'پاوربانک شیائومی 20000mAh', price: 890000, category: 'electronics', image: '🔋', rating: 4.8, discount: 0, inStock: true },
    { id: 3, name: 'کیف دستی چرم طبیعی', price: 2300000, category: 'personal', image: '👜', rating: 4.2, discount: 25, inStock: true },
    { id: 4, name: 'ساعت هوشمند اپل واچ سری 8', price: 12000000, category: 'electronics', image: '⌚', rating: 4.7, discount: 10, inStock: false },
    { id: 5, name: 'عینک آفتابی ری بن', price: 3200000, category: 'personal', image: '🕶️', rating: 4.4, discount: 0, inStock: true },
    { id: 6, name: 'اسپیکر بلوتوث JBL Flip 6', price: 3200000, category: 'electronics', image: '🔊', rating: 4.6, discount: 20, inStock: true },
    { id: 7, name: 'کوله پشتی لپ تاپ', price: 1500000, category: 'personal', image: '🎒', rating: 4.3, discount: 30, inStock: true },
    { id: 8, name: 'موس گیمینگ ریزر', price: 2800000, category: 'electronics', image: '🖱️', rating: 4.9, discount: 0, inStock: true },
    { id: 9, name: 'کیبورد مکانیکال', price: 3500000, category: 'electronics', image: '⌨️', rating: 4.7, discount: 15, inStock: true },
    { id: 10, name: 'دوربین کانن EOS R5', price: 85000000, category: 'electronics', image: '📷', rating: 4.9, discount: 5, inStock: false },
  ];
  
  const categories = [
    { value: '', label: 'همه دسته‌ها' },
    { value: 'electronics', label: 'لوازم برقی' },
    { value: 'personal', label: 'وسایل شخصی' },
    { value: 'home', label: 'لوازم منزل' },
    { value: 'sports', label: 'ورزش و سفر' }
  ];
  
  const priceRanges = [
    { value: '', label: 'همه قیمت‌ها' },
    { value: '0-1000000', label: 'زیر 1 میلیون تومان' },
    { value: '1000000-5000000', label: '1 تا 5 میلیون تومان' },
    { value: '5000000-10000000', label: '5 تا 10 میلیون تومان' },
    { value: '10000000+', label: 'بالای 10 میلیون تومان' }
  ];
  
  const sortOptions = [
    { value: 'default', label: 'پیش‌فرض' },
    { value: 'price-asc', label: 'قیمت: کم به زیاد' },
    { value: 'price-desc', label: 'قیمت: زیاد به کم' },
    { value: 'rating', label: 'بیشترین امتیاز' },
    { value: 'discount', label: 'بیشترین تخفیف' },
    { value: 'newest', label: 'جدیدترین' }
  ];
  
  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];
    
    // Apply category filter
    if (filters.category) {
      result = result.filter(p => p.category === filters.category);
    }
    
    // Apply price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(p => parseInt(p) || 0);
      if (filters.priceRange.includes('+')) {
        result = result.filter(p => p.price >= min);
      } else {
        result = result.filter(p => p.price >= min && p.price <= max);
      }
    }
    
    // Apply rating filter
    if (filters.rating) {
      const minRating = parseFloat(filters.rating);
      result = result.filter(p => p.rating >= minRating);
    }
    
    // Apply discount filter
    if (filters.discount) {
      result = result.filter(p => p.discount > 0);
    }
    
    // Apply stock filter
    if (filters.inStock) {
      result = result.filter(p => p.inStock);
    }
    
    // Apply search
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'discount':
        result.sort((a, b) => b.discount - a.discount);
        break;
      case 'newest':
        result.sort((a, b) => b.id - a.id);
        break;
    }
    
    return result;
  }, [filters, sortBy, searchParams]);
  
  useEffect(() => {
    // Simulate loading
    setLoading(true);
    setTimeout(() => {
      setProducts(filteredProducts);
      setLoading(false);
    }, 500);
  }, [filteredProducts]);
  
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const clearFilters = () => {
    setFilters({
      category: '',
      priceRange: '',
      rating: '',
      discount: false,
      inStock: true
    });
    setSearchParams({});
  };
  
  const activeFiltersCount = Object.values(filters).filter(v => v && v !== true).length;
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">محصولات</h1>
          <p className="text-gray-600">
            {searchParams.get('search') 
              ? `نتایج جست