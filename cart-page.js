import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Tag,
  Truck,
  ArrowLeft,
  ShoppingBag,
  Percent
} from 'lucide-react';
import useCartStore from '@/store/cartStore';
import useAuthStore from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart,
    getTotalPrice,
    getSubtotal,
    getTotalDiscount,
    getItemsCount
  } = useCartStore();
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  
  const subtotal = getSubtotal();
  const totalDiscount = getTotalDiscount();
  const totalPrice = getTotalPrice();
  const itemsCount = getItemsCount();
  
  // محاسبه هزینه ارسال
  const shippingCost = totalPrice >= 500000 ? 0 : 50000;
  
  // محاسبه تخفیف کوپن
  const couponDiscount = appliedCoupon ? totalPrice * (appliedCoupon.percent / 100) : 0;
  
  // مجموع نهایی
  const finalTotal = totalPrice + shippingCost - couponDiscount;
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };
  
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('لطفا کد تخفیف را وارد کنید');
      return;
    }
    
    setIsApplyingCoupon(true);
    
    // Mock coupon validation
    setTimeout(() => {
      if (couponCode.toUpperCase() === 'WELCOME10') {
        setAppliedCoupon({ code: 'WELCOME10', percent: 10 });
        toast.success('کد تخفیف با موفقیت اعمال شد');
      } else if (couponCode.toUpperCase() === 'SAVE20') {
        setAppliedCoupon({ code: 'SAVE20', percent: 20 });
        toast.success('کد تخفیف با موفقیت اعمال شد');
      } else {
        toast.error('کد تخفیف معتبر نیست');
      }
      setIsApplyingCoupon(false);
    }, 1000);
  };
  
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('کد تخفیف حذف شد');
  };
  
  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('برای ادامه خرید باید وارد حساب کاربری شوید');
      navigate('/login?redirect=/checkout');
      return;
    }
    
    navigate('/checkout');
  };
  
  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">سبد خرید شما خالی است</h2>
          <p className="text-gray-600 mb-8">هنوز هیچ محصولی به سبد خرید اضافه نکرده‌اید</p>
          <Link to="/products">
            <Button variant="primary" size="lg">
              مشاهده محصولات
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">سبد خرید</h1>
          <p className="text-gray-600">{itemsCount} کالا در سبد خرید شما</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  محصولات سبد خرید
                </h2>
                <button
                  onClick={() => {
                    if (window.confirm('آیا از حذف همه محصولات سبد خرید مطمئن هستید؟')) {
                      clearCart();
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  حذف همه
                </button>
              </div>
              
              {/* Items */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="border rounded-lg p-4">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <Link 
                        to={`/products/${item.product.id}`}
                        className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-gray-200 transition-colors"
                      >
                        <span className="text-4xl">{item.product.image}</span>
                      </Link>
                      
                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <Link 
                            to={`/products/${item.product.id}`}
                            className="text-gray-800 font-medium hover:text-primary-500 transition-colors"
                          >
                            {item.product.name}
                          </Link>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-red-500 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-3">
                          دسته‌بندی: {item.product.category === 'electronics' ? 'لوازم برقی' : 'وسایل شخصی'}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          {/* Price */}
                          <div>
                            {item.product.discount > 0 ? (
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-semibold text-primary-500">
                                    {formatPrice(
                                      item.product.price * (1 - item.product.discount / 100)
                                    )} تومان
                                  </span>
                                  <span className="badge badge-danger text-xs">
                                    {item.product.discount}%
                                  </span>
                                </div>
                                <span className="text-sm text-gray-400 line-through">
                                  {formatPrice(item.product.price)} تومان
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg font-semibold text-gray-800">
                                {formatPrice(item.product.price)} تومان
                              </span>
                            )}
                          </div>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1 border rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Item Total */}
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">مجموع:</span>
                            <span className="font-semibold">
                              {formatPrice(
                                item.product.discount 
                                  ? (item.product.price * (1 - item.product.discount / 100)) * item.quantity
                                  : item.product.price * item.quantity
                              )} تومان
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Coupon Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                کد تخفیف
              </h3>
              
              {appliedCoupon ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-green-800">
                        کد تخفیف {appliedCoupon.code} اعمال شد
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        {appliedCoupon.percent}% تخفیف روی مجموع خرید
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Input
                    placeholder="کد تخفیف را وارد کنید"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    variant="outline"
                    loading={isApplyingCoupon}
                  >
                    اعمال کد
                  </Button>
                </div>
              )}
              
              <div className="mt-3 text-xs text-gray-500">
                کدهای تخفیف فعال: WELCOME10 (10% تخفیف) | SAVE20 (20% تخفیف)
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-6">خلاصه سفارش</h3>
              
              {/* Summary Items */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">جمع کل کالاها:</span>
                  <span>{formatPrice(subtotal)} تومان</span>
                </div>
                
                {totalDiscount > 0 && (
                  <div className="flex items-center justify-between text-red-600">
                    <span>تخفیف محصولات:</span>
                    <span>-{formatPrice(totalDiscount)} تومان</span>
                  </div>
                )}
                
                {appliedCoupon && (
                  <div className="flex items-center justify-between text-green-600">
                    <span>تخفیف کد ({appliedCoupon.code}):</span>
                    <span>-{formatPrice(couponDiscount)} تومان</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">هزینه ارسال:</span>
                  {shippingCost === 0 ? (
                    <span className="text-green-600">رایگان</span>
                  ) : (
                    <span>{formatPrice(shippingCost)} تومان</span>
                  )}
                </div>
              </div>
              
              {/* Shipping Info */}
              {shippingCost === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                  <div className="flex items-center gap-2 text-green-700">
                    <Truck className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      ارسال رایگان برای خرید بالای 500 هزار تومان
                    </span>
                  </div>
                </div>
              )}
              
              {/* Total */}
              <div className="border-t pt-4 mb-6">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>مبلغ قابل پرداخت:</span>
                  <span className="text-primary-500">{formatPrice(finalTotal)} تومان</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handleCheckout}
                  variant="primary"
                  fullWidth
                  size="lg"
                  icon={<ArrowLeft className="w-5 h-5" />}
                >
                  ادامه خرید
                </Button>
                
                <Link to="/products" className="block">
                  <Button variant="ghost" fullWidth>
                    ادامه خرید محصولات
                  </Button>
                </Link>
              </div>
              
              {/* Benefits */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Percent className="w-4 h-4 text-primary-500" />
                  <span>ضمانت بهترین قیمت</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Truck className="w-4 h-4 text-primary-500" />
                  <span>ارسال سریع و مطمئن</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;