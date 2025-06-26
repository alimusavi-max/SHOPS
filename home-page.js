import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  Star, 
  ArrowLeft,
  Sparkles,
  Zap,
  Gift,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import ProductCard from '@/components/product/ProductCard'; // Assuming this path alias works
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// Helper function to simulate API calls for now
// Replace with actual fetch/axios calls to your backend
const api = {
  get: async (url) => {
    console.log(`Fetching ${url}`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    if (url === '/api/products') {
      return {
        ok: true,
        json: async () => ({
          message: 'Placeholder: Get All Products',
          data: [
            { _id: '1', id: '1', name: 'هدفون بی‌سیم سونی WH-1000XM4 (API)', price: 4500000, category: 'electronics', image: '🎧', rating: 4.5, discount: 15, createdAt: new Date(2023, 1, 1).toISOString() },
            { _id: '2', id: '2', name: 'پاوربانک شیائومی 20000mAh (API)', price: 890000, category: 'electronics', image: '🔋', rating: 4.8, discount: 0, createdAt: new Date(2023, 1, 15).toISOString() },
            { _id: '3', id: '3', name: 'کیف دستی چرم طبیعی (API)', price: 2300000, category: 'personal', image: '👜', rating: 4.2, discount: 25, createdAt: new Date(2023, 0, 10).toISOString() },
            { _id: '4', id: '4', name: 'ساعت هوشمند اپل واچ سری 8 (API)', price: 12000000, category: 'electronics', image: '⌚', rating: 4.7, discount: 10, createdAt: new Date(2023, 2, 1).toISOString() },
            { _id: '5', id: '5', name: 'عینک آفتابی ری بن (API)', price: 3200000, category: 'personal', image: '🕶️', rating: 4.4, discount: 0, createdAt: new Date(2023, 0, 1).toISOString() },
            { _id: '6', id: '6', name: 'اسپیکر بلوتوث JBL Flip 6 (API)', price: 3200000, category: 'electronics', image: '🔊', rating: 4.6, discount: 20, createdAt: new Date(2023, 2, 5).toISOString() },
            { _id: '7', id: '7', name: 'کوله پشتی لپ تاپ (API)', price: 1500000, category: 'personal', image: '🎒', rating: 4.3, discount: 30, createdAt: new Date(2022, 11, 1).toISOString() },
            { _id: '8', id: '8', name: 'موس گیمینگ ریزر (API)', price: 2800000, category: 'electronics', image: '🖱️', rating: 4.9, discount: 0, createdAt: new Date(2023, 1, 20).toISOString() },
          ]
        })
      };
    }
    if (url === '/api/categories') {
      return {
        ok: true,
        json: async () => ({
          message: 'Placeholder: Get All Categories',
          data: [
            { _id: 'cat1', id: 'cat1', name: 'لوازم برقی (API)', icon: '⚡', slug: 'electronics', productCount: 245 },
            { _id: 'cat2', id: 'cat2', name: 'وسایل شخصی (API)', icon: '👤', slug: 'personal', productCount: 189 },
            { _id: 'cat3', id: 'cat3', name: 'لوازم منزل (API)', icon: '🏠', slug: 'home', productCount: 156 },
            { _id: 'cat4', id: 'cat4', name: 'ورزش و سفر (API)', icon: '⚽', slug: 'sports', productCount: 98 },
            { _id: 'cat5', id: 'cat5', name: 'مد و پوشاک (API)', icon: '👕', slug: 'fashion', productCount: 312 },
            { _id: 'cat6', id: 'cat6', name: 'زیبایی و سلامت (API)', icon: '💄', slug: 'beauty', productCount: 223 },
          ]
        })
      };
    }
    return { ok: false, status: 404, json: async () => ({ message: 'Not Found' }) };
  }
};

const Home = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [discountedProducts, setDiscountedProducts] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);

  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const response = await api.get('/api/categories'); // Replace with actual fetch
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        setCategoriesData(result.data || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategoriesError(error.message);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      setProductsError(null);
      try {
        const response = await api.get('/api/products'); // Replace with actual fetch
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        const products = result.data || [];
        setAllProducts(products);

        if (products.length > 0) {
          setFeaturedProducts(products.slice(0, 4));
          const sortedByNewest = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setNewProducts(sortedByNewest.slice(0, 4));
          setDiscountedProducts(products.filter(p => p.discount && p.discount > 0));
        } else {
          setFeaturedProducts([]); setNewProducts([]); setDiscountedProducts([]);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProductsError(error.message);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);
  
  const banners = [
    { id: 1, title: 'جشنواره فروش ویژه', subtitle: 'تا 70% تخفیف روی محصولات منتخب', bg: 'bg-gradient-to-l from-orange-500 to-red-500', link: '/offers' },
    { id: 2, title: 'محصولات جدید', subtitle: 'جدیدترین محصولات الکترونیکی', bg: 'bg-gradient-to-l from-blue-500 to-purple-500', link: '/products?sort=newest' },
    { id: 3, title: 'ارسال رایگان', subtitle: 'برای خرید بالای 500 هزار تومان', bg: 'bg-gradient-to-l from-green-500 to-teal-500', link: '/shipping' }
  ];
  
  return (
    <div className="min-h-screen">
      <section className="relative">
        <Swiper modules={[Autoplay, Pagination, Navigation]} spaceBetween={0} slidesPerView={1} autoplay={{ delay: 5000, disableOnInteraction: false }} pagination={{ clickable: true }} navigation className="h-[300px] md:h-[400px] lg:h-[500px]">
          {banners.map(banner => (
            <SwiperSlide key={banner.id}>
              <Link to={banner.link} className={`block h-full ${banner.bg} relative overflow-hidden`}>
                <div className="container-custom h-full flex items-center">
                  <div className="text-white max-w-lg animate-fade-in">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">{banner.title}</h2>
                    <p className="text-lg md:text-2xl mb-6">{banner.subtitle}</p>
                    <span className="inline-flex items-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">مشاهده محصولات <ArrowLeft className="w-5 h-5" /></span>
                  </div>
                </div>
                <div className="absolute top-0 left-0 w-full h-full bg-black opacity-20"></div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
      
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">دسته‌بندی محصولات</h2>
            <Link to="/products" className="text-primary-500 hover:text-primary-600 flex items-center gap-1">مشاهده همه <ArrowLeft className="w-4 h-4" /></Link>
          </div>
          {categoriesLoading && <div className="flex justify-center items-center h-32"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>}
          {categoriesError && <div className="text-red-500 p-4 bg-red-100 rounded-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5" /><span>خطا در بارگذاری دسته‌بندی‌ها: {categoriesError}</span></div>}
          {!categoriesLoading && !categoriesError && categoriesData.length === 0 && <p className="text-center text-gray-500">هیچ دسته‌بندی‌ای یافت نشد.</p>}
          {!categoriesLoading && !categoriesError && categoriesData.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categoriesData.map(category => (
                <Link key={category.id || category._id} to={`/products?category=${category.slug || category.name}`} className="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 group">
                  <div className={`w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center text-3xl bg-gray-100 text-gray-600 group-hover:scale-110 transition-transform`}>{category.icon || '🛍️'}</div>
                  <h3 className="font-semibold text-gray-800 mb-1">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.productCount !== undefined ? `${category.productCount} محصول` : ''}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      
      <section className="py-12">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-8"><Sparkles className="w-8 h-8 text-primary-500" /><h2 className="text-2xl font-bold text-gray-800">محصولات ویژه</h2></div>
          {productsLoading && <div className="flex justify-center items-center h-40"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>}
          {productsError && <div className="text-red-500 p-4 bg-red-100 rounded-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5" /><span>خطا در بارگذاری محصولات ویژه: {productsError}</span></div>}
          {!productsLoading && !productsError && featuredProducts.length === 0 && <p className="text-center text-gray-500">هیچ محصول ویژه‌ای یافت نشد.</p>}
          {!productsLoading && !productsError && featuredProducts.length > 0 && (
            <div className="product-grid">
              {featuredProducts.map(product => (<ProductCard key={product.id || product._id} product={product} />))}
            </div>
          )}
        </div>
      </section>
      
      <section className="py-12 bg-gradient-to-l from-primary-500 to-primary-600">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white">
            <div className="text-center md:text-right"><h3 className="text-3xl font-bold mb-2 flex items-center gap-2 justify-center md:justify-start"><Zap className="w-8 h-8" />پیشنهاد شگفت‌انگیز</h3><p className="text-lg">فقط تا پایان هفته - تخفیف 50% روی محصولات منتخب</p></div>
            <Link to="/offers" className="btn bg-white text-primary-500 hover:bg-gray-100">مشاهده پیشنهادها</Link>
          </div>
        </div>
      </section>
      
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-8"><Clock className="w-8 h-8 text-primary-500" /><h2 className="text-2xl font-bold text-gray-800">جدیدترین محصولات</h2></div>
          {productsLoading && <div className="flex justify-center items-center h-40"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>}
          {productsError && <div className="text-red-500 p-4 bg-red-100 rounded-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5" /><span>خطا در بارگذاری جدیدترین محصولات: {productsError}</span></div>}
          {!productsLoading && !productsError && newProducts.length === 0 && <p className="text-center text-gray-500">هیچ محصول جدیدی یافت نشد.</p>}
          {!productsLoading && !productsError && newProducts.length > 0 && (
            <div className="product-grid">
              {newProducts.map(product => (<ProductCard key={product.id || product._id} product={product} isNew />))}
            </div>
          )}
        </div>
      </section>
      
      <section className="py-12">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-8"><Gift className="w-8 h-8 text-red-500" /><h2 className="text-2xl font-bold text-gray-800">تخفیف‌های ویژه</h2></div>
          {productsLoading && <div className="flex justify-center items-center h-40"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>}
          {productsError && <div className="text-red-500 p-4 bg-red-100 rounded-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5" /><span>خطا در بارگذاری محصولات تخفیف‌دار: {productsError}</span></div>}
          {!productsLoading && !productsError && discountedProducts.length === 0 && <p className="text-center text-gray-500">هیچ محصول تخفیف‌داری یافت نشد.</p>}
          {!productsLoading && !productsError && discountedProducts.length > 0 && (
            <Swiper modules={[Navigation]} spaceBetween={20} slidesPerView={1} navigation breakpoints={{ 640: { slidesPerView: 2 }, 768: { slidesPerView: 3 }, 1024: { slidesPerView: 4 }, 1280: { slidesPerView: 5 }}}>
              {discountedProducts.map(product => (
                <SwiperSlide key={product.id || product._id}><ProductCard product={product} /></SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>
      
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow"><ShoppingBag className="w-12 h-12 text-primary-500 mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">خرید آسان</h3><p className="text-gray-600">خرید با چند کلیک ساده و ارسال سریع</p></div>
            <div className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow"><TrendingUp className="w-12 h-12 text-primary-500 mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">قیمت مناسب</h3><p className="text-gray-600">بهترین قیمت‌ها با تضمین کیفیت</p></div>
            <div className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow"><Star className="w-12 h-12 text-primary-500 mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">کیفیت تضمینی</h3><p className="text-gray-600">همه محصولات دارای گارانتی معتبر</p></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;