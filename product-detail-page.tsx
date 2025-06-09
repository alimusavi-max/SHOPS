import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  Check, 
  X,
  Truck,
  Shield,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  AlertCircle
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Mock data - در آینده از API می‌آید
  useEffect(() => {
    const mockProduct = {
      id: 1,
      name: 'هدفون بی‌سیم سونی WH-1000XM4',
      price: 4500000,
      discount: 15,
      finalPrice: 3825000,
      category: { name: 'لوازم برقی', slug: 'electronics' },
      brand: 'Sony',
      rating: 4.5,
      reviewsCount: 126,
      inStock: true,
      stock: 12,
      sku: 'SNY-WH1000XM4',
      images: [
        '/images/products/sony-1.jpg',
        '/images/products/sony-2.jpg',
        '/images/products/sony-3.jpg',
        '/images/products/sony-4.jpg'
      ],
      colors: [
        { name: 'مشکی', hex: '#000000', inStock: true },
        { name: 'نقره‌ای', hex: '#C0C0C0', inStock: true },
        { name: 'آبی شب', hex: '#191970', inStock: false }
      ],
      sizes: [],
      description: 'هدفون بی‌سیم سونی WH-1000XM4 با کیفیت صدای فوق‌العاده و نویز کنسلینگ پیشرفته، بهترین همراه شما برای گوش دادن به موسیقی است. این هدفون با تکنولوژی‌های پیشرفته سونی، تجربه‌ای بی‌نظیر از شنیدن موسیقی را برای شما فراهم می‌کند.',
      features: [
        'نویز کنسلینگ هوشمند با پردازنده QN1',
        'باتری 30 ساعته با شارژ سریع',
        'کیفیت صدای Hi-Res و LDAC',
        'میکروفون با کیفیت برای مکالمات',
        'قابلیت اتصال همزمان به دو دستگاه',
        'کنترل لمسی هوشمند'
      ],
      specifications: {
        'نوع اتصال': 'بی‌سیم (بلوتوث 5.0)',
        'محدوده فرکانس': '4Hz - 40,000Hz',
        'مدت زمان شارژ': '3 ساعت',
        'وزن': '254 گرم',
        'رنگ': 'مشکی، نقره‌ای، آبی شب',
        'گارانتی': '18 ماه گارانتی شرکتی'
      },
      warranty: '18 ماه گارانتی شرکتی',
      shippingInfo: {
        freeShipping: true,
        estimatedDelivery: '3 تا 5 روز کاری'
      },
      relatedProducts: [
        { id: 2, name: 'کیس ایرپاد', price: 350000, image: '📦' },
        { id: 3, name: 'کابل شارژ USB-C', price: 150000, image: '🔌' },
        { id: 4, name: 'پایه نگهدارنده', price: 250000, image: '🎧' }
      ]
    };

    setTimeout(() => {
      setProduct(mockProduct);
      setLoading(false);
    }, 1000);
  }, [id]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const handleQuantityChange = (action) => {
    if (action === 'increase' && quantity < product.stock) {
      setQuantity(quantity + 1);
    } else if (action === 'decrease' && quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    // Add to cart logic
    console.log('Added to cart:', { product, quantity, color: selectedColor, size: selectedSize });
  };

  const handleToggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `${product.name} - فروشگاه آنلاین`;
    
    switch (platform) {
      case 'telegram':
        window.open(`https://t.me/share/url?url=${url}&text=${text}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${text} ${url}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        break;
    }
    setShowShareMenu(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-xl text-gray-600">محصول مورد نظر یافت نشد</p>
        <button 
          onClick={() => navigate('/products')}
          className="mt-4 btn btn-primary"
        >
          بازگشت به محصولات
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-600">
            <li><a href="/" className="hover:text-primary-500">خانه</a></li>
            <ChevronLeft className="w-4 h-4" />
            <li><a href="/products" className="hover:text-primary-500">محصولات</a></li>
            <ChevronLeft className="w-4 h-4" />
            <li><a href={`/products?category=${product.category.slug}`} className="hover:text-primary-500">{product.category.name}</a></li>
            <ChevronLeft className="w-4 h-4" />
            <li className="font-medium">{product.name}</li>
          </ol>
        </nav>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <Swiper
                  modules={[Navigation, Pagination, Thumbs]}
                  navigation
                  pagination={{ clickable: true }}
                  thumbs={{ swiper: thumbsSwiper }}
                  className="h-full"
                >
                  {product.images.map((image, index) => (
                    <SwiperSlide key={index}>
                      <div className="w-full h-full flex items-center justify-center p-8">
                        <div className="text-9xl">🎧</div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {/* Thumbnail Images */}
              <Swiper
                onSwiper={setThumbsSwiper}
                spaceBetween={10}
                slidesPerView={4}
                freeMode={true}
                watchSlidesProgress={true}
                modules={[Thumbs]}
                className="thumbs-swiper"
              >
                {product.images.map((image, index) => (
                  <SwiperSlide key={index}>
                    <div className="aspect-square bg-gray-100 rounded-lg cursor-pointer overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center p-2">
                        <div className="text-4xl">🎧</div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Title & Brand */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500">برند:</span>
                  <span className="font-medium text-primary-500">{product.brand}</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">({product.rating})</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {product.reviewsCount} نظر
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="bg-gray-50 rounded-lg p-4">
                {product.discount > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 line-through">
                        {formatPrice(product.price)} تومان
                      </span>
                      <span className="badge badge-danger">
                        {product.discount}% تخفیف
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-primary-500">
                      {formatPrice(product.finalPrice)} تومان
                    </div>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-gray-800">
                    {formatPrice(product.price)} تومان
                  </div>
                )}
              </div>

              {/* Colors */}
              {product.colors.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">رنگ:</h3>
                  <div className="flex gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        disabled={!color.inStock}
                        className={`relative p-1 rounded-lg border-2 transition-all ${
                          selectedColor === color.name 
                            ? 'border-primary-500' 
                            : 'border-gray-300'
                        } ${!color.inStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div 
                          className="w-10 h-10 rounded-md"
                          style={{ backgroundColor: color.hex }}
                        />
                        {!color.inStock && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <X className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedColor && (
                    <p className="text-sm text-gray-600 mt-2">
                      رنگ انتخابی: {selectedColor}
                    </p>
                  )}
                </div>
              )}

              {/* Quantity & Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="font-medium">تعداد:</span>
                  <div className="flex items-center gap-2 border rounded-lg">
                    <button
                      onClick={() => handleQuantityChange('decrease')}
                      className="p-2 hover:bg-gray-100 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange('increase')}
                      className="p-2 hover:bg-gray-100 transition-colors"
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    {product.stock} عدد موجود
                  </span>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handleAddToCart}
                    className="flex-1 btn btn-primary"
                  >
                    <ShoppingCart className="w-5 h-5 ml-2" />
                    افزودن به سبد خرید
                  </button>
                  <button
                    onClick={handleToggleWishlist}
                    className={`p-3 rounded-lg border transition-all ${
                      isWishlisted 
                        ? 'bg-red-50 border-red-500 text-red-500' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="p-3 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    {showShareMenu && (
                      <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                        <button 
                          onClick={() => handleShare('telegram')}
                          className="w-full px-4 py-2 text-right hover:bg-gray-50 transition-colors"
                        >
                          تلگرام
                        </button>
                        <button 
                          onClick={() => handleShare('whatsapp')}
                          className="w-full px-4 py-2 text-right hover:bg-gray-50 transition-colors"
                        >
                          واتساپ
                        </button>
                        <button 
                          onClick={() => handleShare('copy')}
                          className="w-full px-4 py-2 text-right hover:bg-gray-50 transition-colors"
                        >
                          کپی لینک
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Truck className="w-8 h-8 text-primary-500" />
                  <div>
                    <p className="font-medium">ارسال رایگان</p>
                    <p className="text-sm text-gray-500">3 تا 5 روز کاری</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="font-medium">ضمانت اصالت</p>
                    <p className="text-sm text-gray-500">تضمین اصل بودن</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium">7 روز مهلت</p>
                    <p className="text-sm text-gray-500">بازگشت کالا</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t">
            <div className="flex gap-8 px-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeTab === 'description' 
                    ? 'border-primary-500 text-primary-500' 
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                توضیحات
              </button>
              <button
                onClick={() => setActiveTab('specifications')}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeTab === 'specifications' 
                    ? 'border-primary-500 text-primary-500' 
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                مشخصات فنی
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeTab === 'reviews' 
                    ? 'border-primary-500 text-primary-500' 
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                نظرات ({product.reviewsCount})
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTab === 'description' && (
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-6">
                    {product.description}
                  </p>
                  <h3 className="text-lg font-semibold mb-4">ویژگی‌های کلیدی:</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === 'specifications' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody className="divide-y">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <tr key={key} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-700 w-1/3">
                            {key}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="text-center py-12 text-gray-500">
                  بخش نظرات در حال توسعه است
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {product.relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">محصولات مرتبط</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.relatedProducts.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-5xl">{item.image}</span>
                  </div>
                  <h3 className="font-medium text-sm mb-2">{item.name}</h3>
                  <p className="text-primary-500 font-semibold">
                    {formatPrice(item.price)} تومان
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;