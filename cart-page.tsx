import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft,
  Tag,
  Truck,
  Shield,
  AlertCircle,
  Loader2
} from 'lucide-react';
import useCartStore from '@/store/cartStore';
import { Link, useNavigate } from 'react-router-dom'; // Added Link
import toast from 'react-hot-toast'; // For coupon messages

const CartPage = () => {
  const {
    items: cartItems,
    isLoading,
    fetchCart,
    removeItem,
    updateQuantity,
    // clearCart, // We'll add a button for this if needed
    // Selectors from store can also be used if they account for coupons,
    // but for now, local calculation with coupon is fine.
    // getTotalPrice,
  } = useCartStore();
  
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [showCouponError, setShowCouponError] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const handleUpdateQuantity = (productId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity >= 1) { // Ensure quantity doesn't go below 1 from here
      // Check against product stock if available
      const item = cartItems.find(i => (i.product.id || i.product._id) === productId);
      if (item && item.product.stock && newQuantity > item.product.stock) {
        toast.error(`حداکثر تعداد موجود (${item.product.stock}) انتخاب شده است.`);
        return;
      }
      updateQuantity(productId, newQuantity);
    } else if (newQuantity === 0) { // Remove if quantity becomes 0
        removeItem(productId);
    }
  };

  const handleRemoveItem = (productId) => {
    removeItem(productId);
  };

  const calculateSubtotal = () => {
    if (!cartItems) return 0;
    return cartItems.reduce((sum, item) => {
        const price = item.product.price || 0; // Ensure price exists
        return sum + (price * item.quantity);
    }, 0);
  };

  const calculateProductDiscountTotal = () => {
    if (!cartItems) return 0;
    return cartItems.reduce((sum, item) => {
      const price = item.product.price || 0;
      const discountPercent = item.product.discount || 0;
      const discountAmount = price * (discountPercent / 100) * item.quantity;
      return sum + discountAmount;
    }, 0);
  };

  const calculateTotalDiscount = () => {
    const productDiscount = calculateProductDiscountTotal();
    const couponDiscountValue = appliedCoupon ? appliedCoupon.amount : 0;
    return productDiscount + couponDiscountValue;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const totalDiscount = calculateTotalDiscount();
    return subtotal - totalDiscount;
  };

  const applyCoupon = () => {
    setShowCouponError(false);
    if (couponCode.trim() === '') {
      toast.error('لطفا کد تخفیف را وارد کنید');
      return;
    }
    // Mock coupon validation - In a real app, this would be an API call
    if (couponCode === 'WELCOME20') {
      const subtotal = calculateSubtotal();
      setAppliedCoupon({ code: 'WELCOME20', amount: subtotal * 0.2, type: 'percentage', value: 20 });
      toast.success('کد تخفیف با موفقیت اعمال شد');
    } else if (couponCode === 'SAVE100K') {
      setAppliedCoupon({ code: 'SAVE100K', amount: 100000, type: 'fixed', value: 100000 });
      toast.success('کد تخفیف با موفقیت اعمال شد');
    } else {
      setShowCouponError(true);
      setAppliedCoupon(null);
      toast.error('کد تخفیف نامعتبر است');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setShowCouponError(false);
    toast.success('کد تخفیف حذف شد');
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 py-12">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!isLoading && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center">
            <ShoppingCart className="w-20 h-20 sm:w-24 sm:h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">سبد خرید شما خالی است</h2>
            <p className="text-gray-600 mb-8">هنوز محصولی به سبد خرید اضافه نکرده‌اید.</p>
            <Link to="/products" className="btn btn-primary inline-flex items-center gap-2">
              شروع خرید <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 flex items-center gap-3">
          <ShoppingCart className="w-7 h-7 sm:w-8 sm:h-8 text-orange-500" />
          سبد خرید
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const product = item.product; // Product data is nested
              const itemSubtotal = (product.price || 0) * item.quantity;
              const itemFinalPrice = product.discount
                ? (product.price * (1 - (product.discount/100))) * item.quantity
                : itemSubtotal;

              return (
                <div key={product.id || product._id} className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-24 sm:h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 aspect-square sm:aspect-auto">
                      <span className="text-4xl sm:text-5xl">{product.image || '🛍️'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Link to={`/products/${product.id || product._id}`} className="font-semibold text-gray-800 hover:text-primary-500 mb-1 line-clamp-2">{product.name}</Link>
                          {product.color && <p className="text-xs sm:text-sm text-gray-600">رنگ: {product.color}</p>}
                        </div>
                        <button onClick={() => handleRemoveItem(product.id || product._id)} className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end">
                        <div className="flex items-center gap-1 sm:gap-2 border rounded-lg p-0.5 sm:p-1">
                          <button onClick={() => handleUpdateQuantity(product.id || product._id, item.quantity, -1)} className="p-1 sm:p-2 hover:bg-gray-100 transition-colors" disabled={item.quantity <= 1}><Minus className="w-4 h-4" /></button>
                          <span className="w-8 sm:w-10 text-center font-medium text-sm">{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(product.id || product._id, item.quantity, 1)} className="p-1 sm:p-2 hover:bg-gray-100 transition-colors" disabled={item.quantity >= (product.stock || Infinity)}><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="text-left sm:text-right mt-2 sm:mt-0">
                          {product.discount > 0 ? (
                            <>
                              <div className="flex items-center gap-1 sm:gap-2 justify-end">
                                <span className="text-xs sm:text-sm text-gray-400 line-through">{formatPrice(itemSubtotal)}</span>
                                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{product.discount}%</span>
                              </div>
                              <div className="text-md sm:text-lg font-semibold text-orange-500">{formatPrice(itemFinalPrice)} تومان</div>
                            </>
                          ) : (
                            <div className="text-md sm:text-lg font-semibold text-gray-800">{formatPrice(itemSubtotal)} تومان</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {cartItems.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4 sm:p-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 sm:gap-3"><Truck className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" /><div><p className="font-medium">ارسال رایگان</p><p className="text-xs text-gray-600">برای خرید بالای 500 هزار تومان</p></div></div>
                    <div className="flex items-center gap-2 sm:gap-3"><Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" /><div><p className="font-medium">ضمانت اصالت کالا</p><p className="text-xs text-gray-600">تضمین اصل بودن همه محصولات</p></div></div>
                    <div className="flex items-center gap-2 sm:gap-3"><Tag className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" /><div><p className="font-medium">تخفیف‌های ویژه</p><p className="text-xs text-gray-600">بهترین قیمت‌ها در بازار</p></div></div>
                </div>
                </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 sticky top-24"> {/* Adjusted sticky top */}
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">خلاصه سفارش</h2>
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">کد تخفیف</label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
                    <div>
                      <p className="font-medium text-green-800 text-sm">{appliedCoupon.code}</p>
                      <p className="text-xs text-green-600">{appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `${formatPrice(appliedCoupon.value)} تومان`} تخفیف</p>
                    </div>
                    <button onClick={removeCoupon} className="text-red-500 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="کد تخفیف" className="input input-sm sm:input-md flex-1"/>
                    <button onClick={applyCoupon} className="btn btn-neutral btn-sm sm:btn-md">اعمال</button>
                  </div>
                )}
                {showCouponError && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />کد تخفیف نامعتبر است</p>}
              </div>

              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 text-sm sm:text-base">
                <div className="flex justify-between text-gray-600"><span>قیمت کالاها ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})</span><span>{formatPrice(calculateSubtotal())} تومان</span></div>
                {calculateTotalDiscount() > 0 && <div className="flex justify-between text-red-500"><span>تخفیف کل</span><span>- {formatPrice(calculateTotalDiscount())} تومان</span></div>}
                <div className="flex justify-between text-gray-600"><span>هزینه ارسال</span><span className="text-green-500">رایگان</span></div>
                <div className="pt-2 sm:pt-3 border-t"><div className="flex justify-between text-md sm:text-lg font-semibold"><span>مبلغ قابل پرداخت</span><span className="text-orange-500">{formatPrice(calculateTotal())} تومان</span></div></div>
              </div>
              <button onClick={() => navigate('/checkout')} className="btn btn-primary w-full mb-2 sm:mb-3">ادامه و پرداخت</button>
              <Link to="/products" className="btn btn-outline w-full">بازگشت به فروشگاه</Link>
              <div className="mt-4 sm:mt-6 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600 flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />کالاهای موجود در سبد خرید شما ثبت و رزرو نشده‌اند، برای ثبت سفارش مراحل بعدی را تکمیل کنید.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;