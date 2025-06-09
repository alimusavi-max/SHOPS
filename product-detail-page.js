import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Star, 
  Heart, 
  Share2, 
  ShoppingCart, 
  Truck, 
  Shield, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Check,
  X
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import useCartStore from '@/store/cartStore';
import useAuthStore from '@/store/authStore';
import ProductCard from '@/components/product/ProductCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, isInCart, getItemQuantity } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState('description');
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  
  // Mock data - در آینده از API می‌آید
  useEffect(() => {
    const mockProduct = {
      id: parseInt(id),
      name: 'هدفون بی‌سیم سونی WH-1000XM4',
      price: 4500000,
      discount: 15,
      category: 'electronics',
      brand: 'Sony',
      rating: 4.5,
      reviewsCount: 126,
      inStock: true,
      stockCount: 12,
      images: ['🎧', '📦', '🎵', '🔊'],
      colors: ['مشکی', 'نقره‌ای', 'آبی شب'],
      description: 'هدفون بی‌سیم سونی WH-1000XM4 با کیفیت صدای فوق‌العاده و نویز کنسلینگ پیشرفته، بهترین همراه شما برای گوش دادن به موسیقی است.',
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
      reviews: [
        { id: 1, user: 'علی احمدی', rating: 5, date: '1402/09/15', comment: 'کیفیت صدا عالیه، نویز کنسلینگ فوق‌العاده قوی' },
        { id: 2, user: 'سارا محمدی', rating: 4, date: '1402/09/10', comment: 'خیلی راحته و صدای خوبی داره، فقط کمی سنگینه' },
        { id: 3, user: 'محمد رضایی', rating: 5, date: '1402/09/05', comment: 'بهترین هدفونی که تا حالا داشتم!' }
      ]
    };
    
    const related = [
      { id: 2, name: 'هدفون JBL Tune 760NC', price: 2800000, category: 'electronics', image: '🎧', rating: 4.3, discount: 10 },
      { id: 3, name: 'ایرپاد اپل Pro', price: 6500000, category: 'electronics', image: '🎧', rating: 4.8, discount: 0 },
      { id: 4, name: 'هدفون بیتس Studio3', price: 5200000, category: 'electronics', image: '🎧', rating: 4.4, discount: 20 },
      { id: 5, name: 'هدفون سنهایزر HD 450BT', price: 3900000, category: 'electronics', image: '🎧', rating: 4.6, discount: 5 }
    ];
    
    setTimeout(() => {
      setProduct(mockProduct);
      setRelatedProducts(related);
      setLoading(false);
    }, 1000);
  }, [id]);
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };
  
  const calculateDiscountedPrice = (price, discount) => {
    return price - (price * discount / 100);
  };
  
  const handleAddToCart = () => {
    if (!product.inStock) {
      toast.error('این محصول موجود نیست');
      return;
    }
    
    addItem(product, quantity);
    setQuantity(1);
  };
  
  const handleAddToWishlist = () => {
    if (!isAuthenticated) {
      toast.error('برای افزودن به علاقه‌مندی‌ها باید وارد شوید');
      navigate('/login');
      return;
    }
    
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'از علاقه‌مندی‌ها حذف شد' : 'به علاقه‌مندی‌ها اضافه شد');
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `محصول ${product.name} در فروشگاه آنلاین`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('لینک محصول کپی شد');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">محصول یافت نشد</h2>
        <Button onClick={() => navigate('/products')}>
          بازگشت به محصولات
        </Button>
      </div>
    );
  }
  
  const itemInCart = isInCart(product.id);
  const cartQuantity = getItemQuantity(product.id);
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-600">
            <li><Link to="/" className="hover:text-primary-500">خانه</Link></li>
            <li><ChevronLeft className="w-4 h-4" /></li>
            <li><Link to="/products" className="hover:text-primary-500">محصولات</Link></li>
            <li><ChevronLeft className="w-4 h-4" /></li>
            <li className="text-gray-800">{product.name}</li>
          </ol>
        </nav>
        
        {/* Product Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Images Section */}
            <div>
              <Swiper
                spaceBetween={10}
                navigation={true}
                thumbs={{ swiper: thumbsSwiper }}
                modules={[FreeMode, Navigation, Thumbs]}
                className="mb-4 rounded-lg overflow-hidden"
              >
                {product.images.map((image, index) => (
                  <SwiperSlide key={index}>
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      <span className="text-[200px]">{image}</span>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
              
              <Swiper
                onSwiper={setThumbsSwiper}
                spaceBetween={10}
                slidesPerView={4}
                freeMode={true}
                watchSlidesProgress={true}
                modules={[FreeMode, Navigation, Thumbs]}
              >
                {product.images.map((image, index) => (
                  <SwiperSlide key={index}>
                    <div className="aspect-square bg-gray-100 rounded-lg cursor-pointer flex items-center justify-center">
                      <span className="text-6xl">{image}</span>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            
            {/* Info Section */}
            <div>
              {/* Title & Brand */}
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">برند: {product.brand}</p>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>
                
                {/* Rating */}
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
                  <span className="text-sm text-gray-500">{product.reviewsCount} نظر</span>
                </div>
              </div>
              
              {/* Price */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                {product.discount > 0 ? (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl font-bold text-primary-500">
                        {formatPrice(calculateDiscountedPrice(product.price, product.discount))} تومان
                      </span>
                      <span className="badge badge-danger">
                        {product.discount}% تخفیف
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 line-through">
                        {formatPrice(product.price)} تومان
                      </span>
                      <span className="text-green-600 font-semibold">
                        {formatPrice(product.price * product.discount / 100)} تومان سود شما
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-gray-800">
                    {formatPrice(product.price)} تومان
                  </span>
                )}
              </div>
              
              {/* Colors */}
              {product.colors && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-2">رنگ:</p>
                  <div className="flex gap-2">
                    {product.colors.map((color, index) => (
                      <button
                        key={index}
                        className={`px-4 py-2 border rounded-lg text-sm hover:border-primary-500 transition-colors ${
                          index === 0 ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Stock Status */}
              <div className="mb-6">
                {product.inStock ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-5 h-5" />
                    <span>موجود در انبار ({product.stockCount} عدد)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <X className="w-5 h-5" />
                    <span>ناموجود</span>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Quantity */}
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    disabled={!product.inStock}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    disabled={!product.inStock || quantity >= product.stockCount}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Add to Cart */}
                <Button
                  onClick={handleAddToCart}
                  variant="primary"
                  size="lg"
                  disabled={!product.inStock}
                  className="flex-1"
                  icon={<ShoppingCart className="w-5 h-5" />}
                >
                  {itemInCart ? `در سبد (${cartQuantity} عدد)` : 'افزودن به سبد خرید'}
                </Button>
                
                {/* Wishlist */}
                <button
                  onClick={handleAddToWishlist}
                  className={`p-3 border rounded-lg transition-colors ${
                    isWishlisted 
                      ? 'bg-red-50 border-red-300 text-red-600' 
                      : 'border-gray-300 hover:border-primary-500'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
                
                {/* Share */}
                <button
                  onClick={handleShare}
                  className="p-3 border border-gray-300 rounded-lg hover:border-primary-500 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
              
              {/* Features */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Truck className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                  <span className="text-xs text-gray-600">ارسال رایگان</span>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                  <span className="text-xs text-gray-600">ضمانت اصالت</span>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                  <span className="text-xs text-gray-600">7 روز بازگشت</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs Section */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          {/* Tab Headers */}
          <div className="border-b">
            <div className="flex gap-8 px-6">
              <button
                onClick={() => setSelectedTab('description')}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  selectedTab === 'description' 
                    ? 'border-primary-500 text-primary-500' 
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                توضیحات
              </button>
              <button
                onClick={() => setSelectedTab('specifications')}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  selectedTab === 'specifications' 
                    ? 'border-primary-500 text-primary-500' 
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                مشخصات فنی
              </button>
              <button
                onClick={() => setSelectedTab('reviews')}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  selectedTab === 'reviews' 
                    ? 'border-primary-500 text-primary-500' 
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                نظرات ({product.reviewsCount})
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {selectedTab === 'description' && (
              <div>
                <p className="text-gray-700 mb-4 leading-relaxed">{product.description}</p>
                <h3 className="font-semibold text-lg mb-3">ویژگی‌های کلیدی:</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {selectedTab === 'specifications' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    {Object.entries(product.specifications).map(([key, value], index) => (
                      <tr key={key} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="py-3 px-4 font-semibold text-gray-700 w-1/3">{key}</td>
                        <td className="py-3 px-4 text-gray-600">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {selectedTab === 'reviews' && (
              <div>
                {/* Review Summary */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-800 mb-1">{product.rating}</div>
                      <div className="flex text-yellow-400 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`} 
                          />
                        ))}
                      </div>
                      <div className="text-sm text-gray-600">از {product.reviewsCount} نظر</div>
                    </div>
                    
                    <div className="flex-1">
                      {[5, 4, 3, 2, 1].map(stars => (
                        <div key={stars} className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-600 w-8">{stars}</span>
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-yellow-400"
                              style={{ width: stars === 5 ? '60%' : stars === 4 ? '30%' : '10%' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Reviews List */}
                <div className="space-y-4">
                  {product.reviews.map(review => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800">{review.user}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${i < review.rating ? 'fill-current' : ''}`} 
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">{review.date}</span>
                          </div>
                        </div>
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          خرید تایید شده
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
                
                {/* Add Review Button */}
                {isAuthenticated && (
                  <div className="mt-6">
                    <Button variant="outline">
                      ثبت نظر جدید
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Related Products */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">محصولات مرتبط</h2>
          <div className="product-grid">
            {relatedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;