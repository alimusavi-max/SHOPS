import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Added Link
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
  // ChevronRight, // Not used directly in this version of breadcrumbs
  Minus,
  Plus,
  AlertCircle,
  Loader2 // Ensured Loader2 is imported
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import useCartStore from '@/store/cartStore';
import apiGlobal, { endpoints as globalEndpoints } from '@/services/api'; // Use global api instance

// Removed local 'api' simulation object and mockApiData

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItemToCart = useCartStore(state => state.addItem); // Get addItem from cart store
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  // const [selectedSize, setSelectedSize] = useState(''); // Not used in current mock
  const [activeTab, setActiveTab] = useState('description');
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) {
        setError('شناسه محصول نامعتبر است');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setProduct(null);
      try {
        // apiGlobal response interceptor returns response.data directly
        const response = await apiGlobal.get(globalEndpoints.productById(id));
        // Assuming backend returns { status: 'success', data: { product: {...} } }
        const fetchedProduct = response.data?.product || response.data;

        if (!fetchedProduct) { // If API returns success but no product data (should ideally be a 404 caught by interceptor)
            setError('محصول مورد نظر یافت نشد.');
        } else {
            setProduct(fetchedProduct);
            // Handle related products:
            // Option 1: If API sends relatedProducts directly within fetchedProduct
            if (fetchedProduct.relatedProducts && fetchedProduct.relatedProducts.length > 0) {
                setRelatedProducts(fetchedProduct.relatedProducts);
            }
            // Option 2: Fallback to fetch some general products (e.g., from same category, excluding current)
            else if (fetchedProduct.category) {
                try {
                    // Example: fetch other products from the same category
                    // The product controller's getAllProducts can take a category filter
                    // globalEndpoints.products might need to be adjusted to allow query params easily
                    // For now, let's fetch all and filter, or assume a specific related products endpoint if available
                    const relatedResponse = await apiGlobal.get(`${globalEndpoints.products}?category=${fetchedProduct.category.slug}&limit=5`);
                    setRelatedProducts(
                        (relatedResponse.data?.products || relatedResponse.data || [])
                        .filter(p => (p.id || p._id) !== id)
                        .slice(0, 4)
                    );
                } catch (relatedError) {
                    console.error("Failed to fetch related products:", relatedError);
                    // Non-critical, so don't set main error state
                }
            }
        }
      } catch (e) { // Errors should largely be handled by the global interceptor (toast, redirect)
        console.error("Failed to fetch product details:", e);
        // The interceptor might throw an error that's caught here if not re-thrown as Promise.reject(error)
        // Or if it's a non-HTTP error.
        if (!error) { // Avoid overwriting specific 404 error set above if interceptor didn't set one.
             setError(e.message || 'خطای ناشناخته در دریافت اطلاعات محصول.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [id, error]); // Added `error` to dependency array to avoid potential issues if error state is used to re-trigger

  const formatPrice = (price) => price ? new Intl.NumberFormat('fa-IR').format(price) : '0';

  const handleQuantityChange = (action) => {
    if (!product) return;
    if (action === 'increase' && quantity < product.stock) setQuantity(quantity + 1);
    else if (action === 'decrease' && quantity > 1) setQuantity(quantity - 1);
  };

  const handleAddToCart = () => {
    if (!product) return;
    // TODO: Consider selectedColor and selectedSize if they affect the product variant/SKU
    // For now, addItem expects the base product object and quantity.
    // The product object should contain all necessary info (id, name, price, image etc.)
    addItemToCart(product, quantity);
    // Toast notifications are handled within cartStore's addItem action
  };

  const handleToggleWishlist = () => setIsWishlisted(!isWishlisted);

  const handleShare = (platform) => {
    if (!product) return;
    const url = window.location.href;
    const text = `${product.name} - فروشگاه آنلاین`;
    switch (platform) {
      case 'telegram': window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`); break;
      case 'whatsapp': window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`); break;
      case 'twitter': window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`); break;
      case 'copy': navigator.clipboard.writeText(url).then(() => console.log('Link copied!')).catch(err => console.error('Copy failed', err)); break;
    }
    setShowShareMenu(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[70vh]"><Loader2 className="w-12 h-12 animate-spin text-primary-500" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <p className="text-xl text-gray-700 mb-2">خطا!</p>
        <p className="text-gray-600 mb-6">{error}</p>
        <button onClick={() => navigate('/products')} className="btn btn-primary">بازگشت به محصولات</button>
      </div>
    );
  }

  if (!product) { // Should be covered by error state if fetch fails, but as a fallback
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-xl text-gray-600">محصولی برای نمایش وجود ندارد.</p>
        <button onClick={() => navigate('/products')} className="mt-4 btn btn-primary">بازگشت به محصولات</button>
      </div>
    );
  }

  // Ensure product.images is an array, default to empty array if not
  const productImages = Array.isArray(product.images) ? product.images : [];
  const productColors = Array.isArray(product.colors) ? product.colors : [];
  const productFeatures = Array.isArray(product.features) ? product.features : [];
  const productSpecifications = product.specifications && typeof product.specifications === 'object' ? product.specifications : {};


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-600">
            <li><Link to="/" className="hover:text-primary-500">خانه</Link></li>
            <ChevronLeft className="w-4 h-4" />
            <li><Link to="/products" className="hover:text-primary-500">محصولات</Link></li>
            {product.category && product.category.slug && product.category.name && (
              <>
                <ChevronLeft className="w-4 h-4" />
                <li><Link to={`/products?category=${product.category.slug}`} className="hover:text-primary-500">{product.category.name}</Link></li>
              </>
            )}
            <ChevronLeft className="w-4 h-4" />
            <li className="font-medium text-gray-700">{product.name}</li>
          </ol>
        </nav>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 p-4 md:p-6 lg:p-8">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <Swiper modules={[Navigation, Pagination, Thumbs]} navigation pagination={{ clickable: true }} thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }} className="h-full">
                  {productImages.length > 0 ? productImages.map((image, index) => (
                    <SwiperSlide key={index}>
                      <div className="w-full h-full flex items-center justify-center p-4 sm:p-8">
                        {/* Assuming images are emojis for now. Replace with <img> if actual URLs */}
                        <span className="text-7xl sm:text-9xl">{image || '🖼️'}</span>
                      </div>
                    </SwiperSlide>
                  )) : (
                    <SwiperSlide>
                      <div className="w-full h-full flex items-center justify-center p-4 sm:p-8 text-gray-400">
                        <span className="text-7xl sm:text-9xl">🖼️</span> {/* Default image placeholder */}
                      </div>
                    </SwiperSlide>
                  )}
                </Swiper>
              </div>
              {productImages.length > 1 && (
                <Swiper onSwiper={setThumbsSwiper} spaceBetween={10} slidesPerView={4} freeMode={true} watchSlidesProgress={true} modules={[Thumbs]} className="thumbs-swiper">
                  {productImages.map((image, index) => (
                    <SwiperSlide key={index} className="cursor-pointer">
                      <div className="aspect-square bg-gray-100 rounded-md overflow-hidden flex items-center justify-center p-1">
                         <span className="text-3xl sm:text-4xl">{image || '🖼️'}</span>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>

            <div className="space-y-5 md:space-y-6">
              <div>
                {product.brand && <span className="text-sm text-gray-500 mb-1">برند: <span className="font-medium text-primary-500">{product.brand}</span></span>}
                <h1 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>
                <div className="flex items-center gap-4">
                  {typeof product.rating === 'number' && (
                    <div className="flex items-center gap-1">
                      <div className="flex text-yellow-400">{[...Array(5)].map((_, i) => <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-current' : (i < product.rating ? 'fill-yellow-200' : 'text-gray-300')}`} />)}</div>
                      <span className="text-sm text-gray-600">({product.rating.toFixed(1)})</span>
                    </div>
                  )}
                  {typeof product.reviewsCount === 'number' && <span className="text-sm text-gray-500">{product.reviewsCount} نظر</span>}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                {product.discount > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-500 line-through text-sm">{formatPrice(product.price)} تومان</span>
                      <span className="badge badge-danger">{product.discount}% تخفیف</span>
                    </div>
                    <div className="text-2xl lg:text-3xl font-bold text-primary-500">{formatPrice(product.finalPrice)} تومان</div>
                  </>
                ) : (
                  <div className="text-2xl lg:text-3xl font-bold text-gray-800">{formatPrice(product.price)} تومان</div>
                )}
              </div>

              {productColors.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2 text-sm">رنگ: {selectedColor || <span className="text-gray-500">انتخاب کنید</span>}</h3>
                  <div className="flex flex-wrap gap-2">
                    {productColors.map((color) => (
                      <button key={color.name} onClick={() => setSelectedColor(color.name)} disabled={!color.inStock} title={color.name}
                        className={`relative p-0.5 rounded-lg border-2 transition-all ${selectedColor === color.name ? 'border-primary-500' : 'border-gray-300'} ${!color.inStock ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-400'}`}>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md" style={{ backgroundColor: color.hex }}/>
                        {!color.inStock && <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50"><X className="w-5 h-5 text-gray-500" /></div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="font-medium text-sm">تعداد:</span>
                  <div className="flex items-center gap-1 border rounded-lg">
                    <button onClick={() => handleQuantityChange('decrease')} className="p-2 text-gray-600 hover:text-primary-500 disabled:opacity-50" disabled={quantity <= 1}><Minus className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                    <span className="w-10 text-center font-medium text-sm sm:text-base">{quantity}</span>
                    <button onClick={() => handleQuantityChange('increase')} className="p-2 text-gray-600 hover:text-primary-500 disabled:opacity-50" disabled={quantity >= product.stock}><Plus className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                  </div>
                  {typeof product.stock === 'number' && <span className="text-sm text-gray-500">{product.stock > 0 ? `${product.stock} عدد موجود` : 'ناموجود'}</span>}
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <button onClick={handleAddToCart} className="flex-1 btn btn-primary btn-sm sm:btn-md" disabled={product.stock === 0}>
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />افزودن به سبد
                  </button>
                  <button onClick={handleToggleWishlist} title="افزودن به علاقه‌مندی" className={`p-2 sm:p-3 rounded-lg border transition-all ${isWishlisted ? 'bg-red-50 border-red-500 text-red-500' : 'border-gray-300 hover:border-gray-400 text-gray-600'}`}>
                    <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                  <div className="relative">
                    <button onClick={() => setShowShareMenu(!showShareMenu)} title="اشتراک گذاری" className="p-2 sm:p-3 rounded-lg border border-gray-300 hover:border-gray-400 text-gray-600 transition-colors">
                      <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    {showShareMenu && (
                      <div className="absolute left-0 mt-2 w-40 bg-white rounded-lg shadow-xl border z-20">
                        {['telegram', 'whatsapp', 'twitter', 'copy'].map(platform => (
                           <button key={platform} onClick={() => handleShare(platform)} className="w-full px-3 py-2 text-right text-sm hover:bg-gray-100 transition-colors capitalize">{platform === 'copy' ? 'کپی لینک' : platform}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {product.shippingInfo && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t text-xs">
                  {product.shippingInfo.freeShipping && <div className="flex items-center gap-2"><Truck className="w-6 h-6 text-primary-500" /><span>ارسال رایگان</span></div>}
                  <div className="flex items-center gap-2"><Shield className="w-6 h-6 text-green-500" /><span>ضمانت اصالت</span></div>
                  <div className="flex items-center gap-2"><RefreshCw className="w-6 h-6 text-blue-500" /><span>۷ روز مهلت بازگشت</span></div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t">
            <div className="flex gap-4 sm:gap-8 px-4 sm:px-8">
              <button onClick={() => setActiveTab('description')} className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 text-sm sm:text-base transition-colors ${activeTab === 'description' ? 'border-primary-500 text-primary-500 font-semibold' : 'border-transparent text-gray-600 hover:text-gray-800'}`}>توضیحات</button>
              <button onClick={() => setActiveTab('specifications')} className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 text-sm sm:text-base transition-colors ${activeTab === 'specifications' ? 'border-primary-500 text-primary-500 font-semibold' : 'border-transparent text-gray-600 hover:text-gray-800'}`}>مشخصات فنی</button>
              <button onClick={() => setActiveTab('reviews')} className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 text-sm sm:text-base transition-colors ${activeTab === 'reviews' ? 'border-primary-500 text-primary-500 font-semibold' : 'border-transparent text-gray-600 hover:text-gray-800'}`}>نظرات ({product.reviewsCount || 0})</button>
            </div>
            <div className="p-4 sm:p-6 lg:p-8">
              {activeTab === 'description' && (
                <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed">
                  <p>{product.description || 'توضیحاتی برای این محصول ارائه نشده است.'}</p>
                  {productFeatures.length > 0 && (<>
                    <h3 className="text-md sm:text-lg font-semibold mt-4 mb-2">ویژگی‌های کلیدی:</h3>
                    <ul className="list-disc list-inside space-y-1">{productFeatures.map((feature, index) => <li key={index}>{feature}</li>)}</ul>
                  </셔>)}
                </div>
              )}
              {activeTab === 'specifications' && (
                Object.keys(productSpecifications).length > 0 ? (
                  <div className="overflow-x-auto"><table className="w-full text-sm sm:text-base"><tbody>
                    {Object.entries(productSpecifications).map(([key, value]) => (
                      <tr key={key} className="hover:bg-gray-50 border-b last:border-b-0"><td className="py-2 px-2 sm:px-4 font-medium text-gray-600 w-1/3 capitalize">{key}</td><td className="py-2 px-2 sm:px-4 text-gray-700">{String(value)}</td></tr>
                    ))}</tbody></table></div>
                ) : <p className="text-gray-500">مشخصات فنی برای این محصول ارائه نشده است.</p>
              )}
              {activeTab === 'reviews' && <div className="text-center py-10 text-gray-500">بخش نظرات در حال توسعه است.</div>}
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-10 sm:mt-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">محصولات مرتبط</h2>
            <Swiper spaceBetween={16} slidesPerView={2} navigation modules={[Navigation]} breakpoints={{ 640: { slidesPerView: 3 }, 1024: { slidesPerView: 4 }, 1280: { slidesPerView: 5 }}}>
              {relatedProducts.map((item) => (
                <SwiperSlide key={item.id || item._id}>
                  <Link to={`/products/${item.id || item._id}`} className="block bg-white rounded-lg shadow-sm p-3 sm:p-4 text-center group hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-gray-100 rounded-md mb-2 sm:mb-3 flex items-center justify-center overflow-hidden">
                      <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform">{item.image || '🛍️'}</span>
                    </div>
                    <h3 className="font-medium text-xs sm:text-sm text-gray-800 mb-1 line-clamp-2 group-hover:text-primary-500">{item.name}</h3>
                    <p className="text-primary-500 font-semibold text-sm sm:text-base">{formatPrice(item.price)} تومان</p>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;