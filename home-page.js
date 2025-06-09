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
  Gift
} from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [discountedProducts, setDiscountedProducts] = useState([]);
  
  // Mock data - در آینده از API می‌آید
  useEffect(() => {
    const mockProducts = [
      { id: 1, name: 'هدفون بی‌سیم سونی WH-1000XM4', price: 4500000, category: 'electronics', image: '🎧', rating: 4.5, discount: 15 },
      { id: 2, name: 'پاوربانک شیائومی 20000mAh', price: 890000, category: 'electronics', image: '🔋', rating: 4.8, discount: 0 },
      { id: 3, name: 'کیف دستی چرم طبیعی', price: 2300000, category: 'personal', image: '👜', rating: 4.2, discount: 25 },
      { id: 4, name: 'ساعت هوشمند اپل واچ سری 8', price: 12000000, category: 'electronics', image: '⌚', rating: 4.7, discount: 10 },
      { id: 5, name: 'عینک آفتابی ری بن', price: 3200000, category: 'personal', image: '🕶️', rating: 4.4, discount: 0 },
      { id: 6, name: 'اسپیکر بلوتوث JBL Flip 6', price: 3200000, category: 'electronics', image: '🔊', rating: 4.6, discount: 20 },
      { id: 7, name: 'کوله پشتی لپ تاپ', price: 1500000, category: 'personal', image: '🎒', rating: 4.3, discount: 30 },
      { id: 8, name: 'موس گیمینگ ریزر', price: 2800000, category: 'electronics', image: '🖱️', rating: 4.9, discount: 0 },
    ];
    
    setFeaturedProducts(mockProducts.slice(0, 4));
    setNewProducts(mockProducts.slice(2, 6));
    setDiscountedProducts(mockProducts.filter(p => p.discount > 0));
  }, []);
  
  const banners = [
    {
      id: 1,
      title: 'جشنواره فروش ویژه',
      subtitle: 'تا 70% تخفیف روی محصولات منتخب',
      bg: 'bg-gradient-to-l from-orange-500 to-red-500',
      link: '/offers'
    },
    {
      id: 2,
      title: 'محصولات جدید',
      subtitle: 'جدیدترین محصولات الکترونیکی',
      bg: 'bg-gradient-to-l from-blue-500 to-purple-500',
      link: '/products?sort=newest'
    },
    {
      id: 3,
      title: 'ارسال رایگان',
      subtitle: 'برای خرید بالای 500 هزار تومان',
      bg: 'bg-gradient-to-l from-green-500 to-teal-500',
      link: '/shipping'
    }
  ];
  
  const categories = [
    { id: 1, name: 'لوازم برقی', icon: '⚡', count: 245, color: 'bg-blue-100 text-blue-600' },
    { id: 2, name: 'وسایل شخصی', icon: '👤', count: 189, color: 'bg-purple-100 text-purple-600' },
    { id: 3, name: 'لوازم منزل', icon: '🏠', count: 156, color: 'bg-green-100 text-green-600' },
    { id: 4, name: 'ورزش و سفر', icon: '⚽', count: 98, color: 'bg-orange-100 text-orange-600' },
    { id: 5, name: 'مد و پوشاک', icon: '👕', count: 312, color: 'bg-pink-100 text-pink-600' },
    { id: 6, name: 'زیبایی و سلامت', icon: '💄', count: 223, color: 'bg-red-100 text-red-600' },
  ];
  
  return (
    <div className="min-h-screen">
      {/* Hero Slider */}
      <section className="relative">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={0}
          slidesPerView={1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation
          className="h-[300px] md:h-[400px] lg:h-[500px]"
        >
          {banners.map(banner => (
            <SwiperSlide key={banner.id}>
              <Link to={banner.link} className={`block h-full ${banner.bg} relative overflow-hidden`}>
                <div className="container-custom h-full flex items-center">
                  <div className="text-white max-w-lg animate-fade-in">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">{banner.title}</h2>
                    <p className="text-lg md:text-2xl mb-6">{banner.subtitle}</p>
                    <span className="inline-flex items-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                      مشاهده محصولات
                      <ArrowLeft className="w-5 h-5" />
                    </span>
                  </div>
                </div>
                <div className="absolute top-0 left-0 w-full h-full bg-black opacity-20"></div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
      
      {/* Categories */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">دسته‌بندی محصولات</h2>
            <Link to="/products" className="text-primary-500 hover:text-primary-600 flex items-center gap-1">
              مشاهده همه
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map(category => (
              <Link
                key={category.id}
                to={`/products?category=${category.name}`}
                className="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 group"
              >
                <div className={`w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center text-3xl ${category.color} group-hover:scale-110 transition-transform`}>
                  {category.icon}
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-500">{category.count} محصول</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Products */}
      <section className="py-12">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-8 h-8 text-primary-500" />
            <h2 className="text-2xl font-bold text-gray-800">محصولات ویژه</h2>
          </div>
          
          <div className="product-grid">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Special Offer Banner */}
      <section className="py-12 bg-gradient-to-l from-primary-500 to-primary-600">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white">
            <div className="text-center md:text-right">
              <h3 className="text-3xl font-bold mb-2 flex items-center gap-2 justify-center md:justify-start">
                <Zap className="w-8 h-8" />
                پیشنهاد شگفت‌انگیز
              </h3>
              <p className="text-lg">فقط تا پایان هفته - تخفیف 50% روی محصولات منتخب</p>
            </div>
            <Link to="/offers" className="btn bg-white text-primary-500 hover:bg-gray-100">
              مشاهده پیشنهادها
            </Link>
          </div>
        </div>
      </section>
      
      {/* New Products */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="w-8 h-8 text-primary-500" />
            <h2 className="text-2xl font-bold text-gray-800">جدیدترین محصولات</h2>
          </div>
          
          <div className="product-grid">
            {newProducts.map(product => (
              <ProductCard key={product.id} product={product} isNew />
            ))}
          </div>
        </div>
      </section>
      
      {/* Discounted Products */}
      <section className="py-12">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-8">
            <Gift className="w-8 h-8 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-800">تخفیف‌های ویژه</h2>
          </div>
          
          <Swiper
            modules={[Navigation]}
            spaceBetween={20}
            slidesPerView={1}
            navigation
            breakpoints={{
              640: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
              1280: { slidesPerView: 5 }
            }}
          >
            {discountedProducts.map(product => (
              <SwiperSlide key={product.id}>
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>
      
      {/* Features */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
              <ShoppingBag className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">خرید آسان</h3>
              <p className="text-gray-600">خرید با چند کلیک ساده و ارسال سریع</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
              <TrendingUp className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">قیمت مناسب</h3>
              <p className="text-gray-600">بهترین قیمت‌ها با تضمین کیفیت</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
              <Star className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">کیفیت تضمینی</h3>
              <p className="text-gray-600">همه محصولات دارای گارانتی معتبر</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;