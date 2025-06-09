import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft,
  Tag,
  Truck,
  Shield,
  AlertCircle
} from 'lucide-react';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'هدفون بی‌سیم سونی WH-1000XM4',
      price: 4500000,
      discount: 15,
      finalPrice: 3825000,
      quantity: 1,
      stock: 12,
      image: '🎧',
      color: 'مشکی'
    },
    {
      id: 2,
      name: 'پاوربانک شیائومی 20000mAh',
      price: 890000,
      discount: 0,
      finalPrice: 890000,
      quantity: 2,
      stock: 45,
      image: '🔋'
    }
  ]);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [showCouponError, setShowCouponError] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCartItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, quantity: Math.min(newQuantity, item.stock) }
          : item
      )
    );
  };

  const removeItem = (itemId) => {
    setCartItems(items => items.filter(item => item.id !== itemId));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    const productDiscount = cartItems.reduce((sum, item) => {
      const discount = item.price * (item.discount / 100) * item.quantity;
      return sum + discount;
    }, 0);
    
    const couponDiscount = appliedCoupon ? appliedCoupon.amount : 0;
    
    return productDiscount + couponDiscount;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const applyCoupon = () => {
    // Mock coupon validation
    if (couponCode === 'WELCOME20') {
      setAppliedCoupon({
        code: 'WELCOME20',
        amount: calculateSubtotal() * 0.2,
        type: 'percentage',
        value: 20
      });
      setShowCouponError(false);
    } else if (couponCode === 'SAVE100K') {
      setAppliedCoupon({
        code: 'SAVE100K',
        amount: 100000,
        type: 'fixed',
        value: 100000
      });
      setShowCouponError(false);
    } else {
      setShowCouponError(true);
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setShowCouponError(false);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">سبد خرید شما خالی است</h2>
            <p className="text-gray-600 mb-8">
              هنوز محصولی به سبد خرید اضافه نکرده‌اید
            </p>
            <button className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center gap-2">
              شروع خرید
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-orange-500" />
          سبد خرید
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-5xl">{item.image}</span>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">
                          {item.name}
                        </h3>
                        {item.color && (
                          <p className="text-sm text-gray-600">رنگ: {item.color}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-end">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 border rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-gray-100 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-gray-100 transition-colors"
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        {item.discount > 0 ? (
                          <>
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-sm text-gray-400 line-through">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                                {item.discount}%
                              </span>
                            </div>
                            <div className="text-lg font-semibold text-orange-500">
                              {formatPrice(item.finalPrice * item.quantity)} تومان
                            </div>
                          </>
                        ) : (
                          <div className="text-lg font-semibold text-gray-800">
                            {formatPrice(item.price * item.quantity)} تومان
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Features */}
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Truck className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium">ارسال رایگان</p>
                    <p className="text-sm text-gray-600">برای خرید بالای 500 هزار تومان</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium">ضمانت اصالت کالا</p>
                    <p className="text-sm text-gray-600">تضمین اصل بودن همه محصولات</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Tag className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium">تخفیف‌های ویژه</p>
                    <p className="text-sm text-gray-600">بهترین قیمت‌ها در بازار</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">خلاصه سفارش</h2>

              {/* Coupon */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  کد تخفیف
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-green-800">{appliedCoupon.code}</p>
                      <p className="text-sm text-green-600">
                        {appliedCoupon.type === 'percentage' 
                          ? `${appliedCoupon.value}% تخفیف`
                          : `${formatPrice(appliedCoupon.value)} تومان تخفیف`
                        }
                      </p>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="کد تخفیف را وارد کنید"
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      onClick={applyCoupon}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                    >
                      اعمال
                    </button>
                  </div>
                )}
                {showCouponError && (
                  <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    کد تخفیف نامعتبر است
                  </p>
                )}
              </div>

              {/* Price Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>قیمت کالاها ({cartItems.length})</span>
                  <span>{formatPrice(calculateSubtotal())} تومان</span>
                </div>
                {calculateDiscount() > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>تخفیف</span>
                    <span>- {formatPrice(calculateDiscount())} تومان</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>هزینه ارسال</span>
                  <span className="text-green-500">رایگان</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>مبلغ قابل پرداخت</span>
                    <span className="text-orange-500">{formatPrice(calculateTotal())} تومان</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <button className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium mb-3">
                ادامه خرید
              </button>
              <button className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                بازگشت به فروشگاه
              </button>

              {/* Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  کالاهای موجود در سبد خرید شما ثبت و رزرو نشده‌اند، برای ثبت سفارش مراحل بعدی را تکمیل کنید.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;