import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Filter, 
  X, 
  ChevronDown, 
  Grid, 
  List,
  SlidersHorizontal,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import ProductCard from '@/components/product/ProductCard';
// import LoadingSpinner from '@/components/common/LoadingSpinner';
import Button from '@/components/ui/Button';
import apiGlobal, { endpoints as globalEndpoints } from '@/services/api'; // Use global api instance


// Removed local 'api' simulation object

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // const [allFetchedProducts, setAllFetchedProducts] = useState([]); // Will be fetched and set
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [categoriesFromAPI, setCategoriesFromAPI] = useState([]);

  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);

  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '', // This will be slug
    priceRange: '', // e.g., '0-1000000'
    rating: '', // e.g., '4+'
    discount: false,
    inStock: true
  });
  
  const [sortBy, setSortBy] = useState('default'); // e.g., 'price-asc', 'newest'

  // Fetch categories for filter dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const response = await apiGlobal.get(globalEndpoints.categories);
        // Assuming backend for categories returns: { status: 'success', data: { categories: [...] } }
        // or directly an array { data: [...] }
        // The interceptor returns response.data.
        const allCatsOption = { _id: 'all', id: 'all', name: 'همه دسته‌ها', slug: '' };
        setCategoriesFromAPI([allCatsOption, ...(response.data?.categories || response.data || [])]);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        // Global interceptor in api-config.js handles toast for error
        setCategoriesError(error.message || 'خطا در دریافت دسته‌بندی‌ها');
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch all products (or filtered products if API supports it)
  // For now, we fetch all and filter client-side.
  // TODO: Enhance to pass filters (category, search, sort, page) to API.
  const [allFetchedProducts, setAllFetchedProducts] = useState([]); // Added state back for clarity
  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      setProductsError(null);
      try {
        // For now, fetch all products. Later, pass searchParams to the API.
        // const queryParams = new URLSearchParams(searchParams).toString();
        // const response = await apiGlobal.get(`${globalEndpoints.products}?${queryParams}`);
        const response = await apiGlobal.get(globalEndpoints.products);
        // Assuming backend for products returns: { status: 'success', data: { products: [...] } }
        setAllFetchedProducts(response.data?.products || response.data || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProductsError(error.message || 'خطا در دریافت محصولات');
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams]); // Refetch if searchParams change, for future API-side filtering
  
  // Static filter options (priceRanges could also be dynamic in a real app)
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
    // Start with all products fetched from API
    let result = [...allFetchedProducts];
    
    // Apply category filter (filters.category is a slug string)
    if (filters.category && filters.category !== '') { // Ensure not 'All Categories'
      result = result.filter(p => p.category === filters.category); // Assumes product.category is a slug string
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
        // Sort by 'createdAt' date, newest first
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    
    return result;
  }, [filters, sortBy, searchParams, allFetchedProducts]); // Added allFetchedProducts dependency

  // This useEffect updates the displayed products whenever filters, sort, or fetched data changes.
  // It also handles the main loading state for the product list.
  useEffect(() => {
    // If products are still being fetched from the API, filteredProducts might be empty or based on old data.
    // So, we only update displayedProducts once initial productsLoading is false.
    if (!productsLoading) {
      setDisplayedProducts(filteredProducts);
    }
    // The visual loading for the list itself (productsLoading) is handled during the API fetch.
    // The setTimeout was for mock loading, not needed if productsLoading state is managed by fetch.
  }, [filteredProducts, productsLoading]);
  
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxFilterChange = (name, checked) => {
    setFilters(prev => ({ ...prev, [name]: checked }));
  };
  
  const clearFilters = () => {
    setFilters({ category: '', priceRange: '', rating: '', discount: false, inStock: true });
    setSortBy('default');
    // setSearchParams({}, { replace: true }); // This will be handled by useEffect for filters/sortBy
  };
  
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.priceRange) count++;
    if (filters.rating) count++;
    if (filters.discount) count++;
    if (!filters.inStock) count++; // inStock true is default, so only count if it's false
    return count;
  }, [filters]);

  // Effect to update URL search params when filters or sortBy change
  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    if (filters.category) newSearchParams.set('category', filters.category);
    if (filters.priceRange) newSearchParams.set('priceRange', filters.priceRange);
    if (filters.rating) newSearchParams.set('rating', filters.rating);
    if (filters.discount) newSearchParams.set('discount', String(filters.discount));
    if (filters.inStock !== undefined && !filters.inStock) newSearchParams.set('inStock', String(filters.inStock)); // only set if false
    if (sortBy !== 'default') newSearchParams.set('sortBy', sortBy);
    const currentSearch = searchParams.get('search');
    if (currentSearch) newSearchParams.set('search', currentSearch);

    setSearchParams(newSearchParams, { replace: true });
  }, [filters, sortBy, searchParams, setSearchParams]);


  const FilterSidebar = () => (
    <aside className="w-full lg:pr-4 space-y-6"> {/* Removed lg:w-1/4, width handled by parent */}
      <div>
        <h3 className="text-lg font-semibold mb-3">دسته‌بندی</h3>
        {categoriesLoading && <div className="flex justify-center py-2"><Loader2 className="w-5 h-5 animate-spin" /></div>}
        {categoriesError && <p className="text-red-500 text-sm">خطا در بارگذاری دسته‌بندی‌ها.</p>}
        {!categoriesLoading && !categoriesError && (
          <select
            name="category"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="input w-full"
            aria-label="انتخاب دسته‌بندی"
          >
            {categoriesFromAPI.map(cat => (
              <option key={cat.id || cat._id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">محدوده قیمت</h3>
        <select
          name="priceRange"
          value={filters.priceRange}
          onChange={(e) => handleFilterChange('priceRange', e.target.value)}
          className="input w-full"
          aria-label="انتخاب محدوده قیمت"
        >
          {priceRanges.map(range => (
            <option key={range.value} value={range.value}>{range.label}</option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">امتیاز</h3>
        <div className="space-y-1">
          {[4, 3, 2, 1].map(r => (
            <label key={r} className="flex items-center space-x-2 space-x-reverse cursor-pointer">
              <input type="radio" name="rating" value={String(r)} checked={filters.rating === String(r)} onChange={(e) => handleFilterChange('rating', e.target.value)} className="radio radio-primary radio-sm"/>
              <span>{r} ستاره و بیشتر</span>
            </label>
          ))}
          <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
              <input type="radio" name="rating" value="" checked={filters.rating === ''} onChange={(e) => handleFilterChange('rating', e.target.value)} className="radio radio-primary radio-sm"/>
              <span>همه امتیازها</span>
          </label>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-gray-200">
        <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
          <input type="checkbox" name="discount" checked={filters.discount} onChange={(e) => handleCheckboxFilterChange('discount', e.target.checked)} className="checkbox checkbox-primary checkbox-sm"/>
          <span>فقط محصولات تخفیف‌دار</span>
        </label>
        <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
          <input type="checkbox" name="inStock" checked={filters.inStock} onChange={(e) => handleCheckboxFilterChange('inStock', e.target.checked)} className="checkbox checkbox-primary checkbox-sm"/>
          <span>فقط کالاهای موجود</span>
        </label>
      </div>

      <Button onClick={clearFilters} variant="outline" className="w-full mt-4">پاک کردن فیلترها</Button>
    </aside>
  );
  
  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="container-custom">
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
            {searchParams.get('search') ? `نتایج جستجو برای: "${searchParams.get('search')}"` : 'همه محصولات'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {filters.category && categoriesFromAPI.find(c=>c.slug === filters.category) && filters.category !== '' ?
             `در دسته‌بندی: ${categoriesFromAPI.find(c=>c.slug === filters.category).name}` : ''}
          </p>
        </div>

        <div className="lg:hidden mb-4">
          <Button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center justify-center" aria-expanded={showFilters}>
            <SlidersHorizontal className="w-5 h-5 ml-2" />
            {showFilters ? 'بستن فیلترها' : `نمایش فیلترها ${activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}`}
          </Button>
        </div>

        {showFilters && (
          <div className="lg:hidden mb-6 bg-white p-4 rounded-lg shadow-lg">
            <FilterSidebar />
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0"> {/* Fixed width for desktop sidebar */}
             <div className="sticky top-24 bg-white p-4 rounded-lg shadow-lg"> {/* Sticky sidebar */}
               <FilterSidebar />
             </div>
          </div>

          <div className="w-full"> {/* Main content takes remaining space */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white rounded-lg shadow flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
              <div className="text-xs sm:text-sm text-gray-600">
                {!productsLoading && !productsError && (
                  <>نمایش {displayedProducts.length} از {allFetchedProducts.length} محصول</>
                )}
                 {productsLoading && "درحال بارگذاری..."}
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50">
                      مرتب‌سازی: {sortOptions.find(o => o.value === sortBy)?.label || 'پیش‌فرض'}
                      <ChevronDown className="-mr-1 ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                    </Menu.Button>
                  </div>
                  <Transition as={React.Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                    <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        {sortOptions.map(option => (
                          <Menu.Item key={option.value}>
                            {({ active }) => (
                              <button onClick={() => setSortBy(option.value)} className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block w-full text-right px-4 py-2 text-sm`}>{option.label}</button>
                            )}
                          </Menu.Item>
                        ))}
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
                <div className="flex items-center">
                  <button title="نمایش جدولی" onClick={() => setViewMode('grid')} className={`p-1.5 sm:p-2 rounded-md ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><Grid className="w-4 h-4 sm:w-5 sm:w-5" /></button>
                  <button title="نمایش لیستی" onClick={() => setViewMode('list')} className={`p-1.5 sm:p-2 rounded-md ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><List className="w-4 h-4 sm:w-5 sm:w-5" /></button>
                </div>
              </div>
            </div>

            {productsLoading && (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-primary-500" />
              </div>
            )}
            {productsError && (
              <div className="text-red-500 p-3 sm:p-4 bg-red-100 rounded-lg flex items-center gap-2 text-sm sm:text-base">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <span>خطا در بارگذاری محصولات: {productsError}. لطفا دوباره تلاش کنید.</span>
              </div>
            )}
            {!productsLoading && !productsError && displayedProducts.length === 0 && (
              <div className="text-center py-10 sm:py-12">
                <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-lg sm:text-xl text-gray-500">هیچ محصولی با این مشخصات یافت نشد.</p>
                <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">سعی کنید فیلترها را تغییر دهید یا جستجوی خود را اصلاح کنید.</p>
                <Button onClick={clearFilters} className="mt-4 sm:mt-6">پاک کردن فیلترها و جستجو</Button>
              </div>
            )}
            {!productsLoading && !productsError && displayedProducts.length > 0 && (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {displayedProducts.map(product => (
                    <ProductCard key={product.id || product._id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {displayedProducts.map(product => (
                    // TODO: Implement a ProductListCard component for list view for better layout
                    <div key={product.id || product._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                       {/* Basic list item, ideally use a dedicated list card component */}
                       <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )
            )}
            {/* TODO: Pagination controls if API supports it */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;