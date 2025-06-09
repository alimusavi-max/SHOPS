import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  CreditCard, 
  Truck, 
  ChevronLeft,
  Check,
  Edit2,
  Plus,
  Clock,
  Calendar,
  Package,
  Shield,
  AlertCircle
} from 'lucide-react';
import useCartStore from '@/store/cartStore';
import useAuthStore from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    items, 
    getTotalPrice, 
    getSubtotal, 
    getTotalDiscount,
    clearCart 
  } = useCartStore();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // Form states
  const [selectedAddress, setSelectedAddress] = useState(0);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('normal');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [notes, setNotes] = useState('');
  
  // Address form
  const [addressForm, setAddressForm] = useState({
    title: '',
    receiver: '',
    phone: '',
    province: '',
    city: '',
    address: '',
    postalCode: '',
    isDefault: false
  });
  
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      title: 'منزل',
      receiver: user?.name || 'علی احمدی',
      phone: '09123456789',
      province: 'تهران',
      city: 'تهران',
      address: 'خیابان ولیعصر، پلاک 123، واحد 5',
      postalCode: '1234567890',
      isDefault: true
    }
  ]);
  
  const [errors, setErrors] = useState({});
  
  const subtotal = getSubtotal();
  const totalDiscount = getTotalDiscount();
  const totalPrice = getTotalPrice();
  
  // Calculate shipping cost
  const shippingCosts = {
    normal: totalPrice >= 500000 ? 0 : 50000,
    express: 100000,
    scheduled: 75000
  };
  
  const shippingCost = shippingCosts[shippingMethod];
  const finalTotal = totalPrice + shippingCost;
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };
  
  // Validate address form
  const validateAddressForm = () => {
    const newErrors = {};
    
    if (!addressForm.title.trim()) {
      newErrors.title = 'عنوان آدرس الزامی است';
    }
    
    if (!addressForm.receiver.trim()) {
      newErrors.receiver = 'نام گیرنده الزامی است';
    }
    
    if (!addressForm.phone) {
      newErrors.phone = 'شماره تماس الزامی است';
    } else if (!/^09\d{9}$/.test(addressForm.phone)) {
      newErrors.phone = 'شماره تماس معتبر نیست';
    }
    
    if (!addressForm.province) {
      newErrors.province = 'استان الزامی است';
    }
    
    if (!addressForm.city) {
      newErrors.city = 'شهر الزامی است';
    }
    
    if (!addressForm.address.trim()) {
      newErrors.address = 'آدرس کامل الزامی است';
    }
    
    if (!addressForm.postalCode) {
      newErrors.postalCode = 'کد پستی الزامی است';
    } else if (!/^\d{10}$/.test(addressForm.postalCode)) {
      newErrors.postalCode = 'کد پستی باید 10 رقم باشد';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle add new address
  const handleAddAddress = () => {
    if (!validateAddressForm()) return;
    
    const newAddress = {
      ...addressForm,
      id: addresses.length + 1
    };
    
    setAddresses([...addresses, newAddress]);
    setSelectedAddress(addresses.length);
    setShowAddressForm(false);
    setAddressForm({
      title: '',
      receiver: '',
      phone: '',
      province: '',
      city: '',
      address: '',
      postalCode: '',
      isDefault: false
    });
    toast.success('آدرس جدید اضافه شد');
  };
  
  // Handle step navigation
  const goToNextStep = () => {
    if (currentStep === 1 && selectedAddress === null) {
      toast.error('لطفا یک آدرس انتخاب کنید');
      return;
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle payment
  const handlePayment = async () => {
    setPaymentLoading(true);
    
    // Simulate payment process
    setTimeout(() => {
      // Clear cart
      clearCart();
      
      // Redirect to success page
      toast.success('سفارش شما با موفقیت ثبت شد');
      navigate('/orders');
    }, 2000);
  };
  
  if (items.length === 0) {
    navigate('/cart');
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4">
              {/* Step 1 */}
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {currentStep > 1 ? <Check className="w-5 h-5" /> : '1'}
                </div>
                <span className={`mr-2 ${currentStep >= 1 ? 'text-gray-800' : 'text-gray-500'}`}>
                  آدرس تحویل
                </span>
              </div>
              
              <ChevronLeft className="w-5 h-5 text-gray-400" />
              
              {/* Step 2 */}
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {currentStep > 2 ? <Check className="w-5 h-5" /> : '2'}
                </div>
                <span className={`mr-2 ${currentStep >= 2 ? 'text-gray-800' : 'text-gray-500'}`}>
                  روش ارسال
                </span>
              </div>
              
              <ChevronLeft className="w-5 h-5 text-gray-400" />
              
              {/* Step 3 */}
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  3
                </div>
                <span className={`mr-2 ${currentStep >= 3 ? 'text-gray-800' : 'text-gray-500'}`}>
                  پرداخت
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Address */}
            {currentStep === 1 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-primary-500" />
                  آدرس تحویل سفارش
                </h2>
                
                {/* Addresses List */}
                <div className="space-y-4 mb-6">
                  {addresses.map((address, index) => (
                    <div
                      key={address.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedAddress === index 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedAddress(index)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 mt-0.5 ${
                            selectedAddress === index 
                              ? 'border-primary-500 bg-primary-500' 
                              : 'border-gray-300'
                          }`}>
                            {selectedAddress === index && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{address.title}</h3>
                              {address.isDefault && (
                                <span className="badge badge-primary text-xs">پیش‌فرض</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              گیرنده: {address.receiver} - {address.phone}
                            </p>
                            <p className="text-sm text-gray-700">
                              {address.province}، {address.city}، {address.address}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              کد پستی: {address.postalCode}
                            </p>
                          </div>
                        </div>
                        
                        <button className="text-primary-500 hover:text-primary-600">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Add New Address */}
                {!showAddressForm ? (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    افزودن آدرس جدید
                  </button>
                ) : (
                  <div className="border-2 border-primary-100 rounded-lg p-4 bg-primary-50">
                    <h3 className="font-semibold mb-4">افزودن آدرس جدید</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="عنوان آدرس"
                        placeholder="مثال: منزل، محل کار"
                        value={addressForm.title}
                        onChange={(e) => setAddressForm({...addressForm, title: e.target.value})}
                        error={errors.title}
                        required
                      />
                      
                      <Input
                        label="نام گیرنده"
                        placeholder="نام و نام خانوادگی"
                        value={addressForm.receiver}
                        onChange={(e) => setAddressForm({...addressForm, receiver: e.target.value})}
                        error={errors.receiver}
                        required
                      />
                      
                      <Input
                        label="شماره تماس"
                        placeholder="09123456789"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                        error={errors.phone}
                        maxLength="11"
                        required
                      />
                      
                      <Input
                        label="کد پستی"
                        placeholder="1234567890"
                        value={addressForm.postalCode}
                        onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})}
                        error={errors.postalCode}
                        maxLength="10"
                        required
                      />
                      
                      <Input
                        label="استان"
                        placeholder="انتخاب استان"
                        value={addressForm.province}
                        onChange={(e) => setAddressForm({...addressForm, province: e.target.value})}
                        error={errors.province}
                        required
                      />
                      
                      <Input
                        label="شهر"
                        placeholder="انتخاب شهر"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                        error={errors.city}
                        required
                      />
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          آدرس کامل <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows="3"
                          className="input"
                          placeholder="خیابان، کوچه، پلاک، واحد"
                          value={addressForm.address}
                          onChange={(e) => setAddressForm({...addressForm, address: e.target.value})}
                        />
                        {errors.address && (
                          <p className="mt-1 text-sm text-red-500">{errors.address}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-3 mt-4">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowAddressForm(false);
                          setErrors({});
                        }}
                      >
                        انصراف
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleAddAddress}
                      >
                        ذخیره آدرس
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Navigation */}
                <div className="flex justify-end mt-6">
                  <Button
                    variant="primary"
                    onClick={goToNextStep}
                    icon={<ChevronLeft className="w-5 h-5" />}
                  >
                    ادامه
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 2: Shipping Method */}
            {currentStep === 2 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Truck className="w-6 h-6 text-primary-500" />
                  روش ارسال
                </h2>
                
                <div className="space-y-4">
                  {/* Normal Shipping */}
                  <label className={`block border rounded-lg p-4 cursor-pointer transition-all ${
                    shippingMethod === 'normal' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="shipping"
                      value="normal"
                      checked={shippingMethod === 'normal'}
                      onChange={(e) => setShippingMethod(e.target.value)}
                      className="hidden"
                    />
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 mt-0.5 ${
                          shippingMethod === 'normal' 
                            ? 'border-primary-500 bg-primary-500' 
                            : 'border-gray-300'
                        }`}>
                          {shippingMethod === 'normal' && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold mb-1">ارسال عادی</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            تحویل در 3 تا 5 روز کاری
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>ارسال از انبار تهران</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-left">
                        {shippingCosts.normal === 0 ? (
                          <span className="text-green-600 font-semibold">رایگان</span>
                        ) : (
                          <span className="font-semibold">{formatPrice(shippingCosts.normal)} تومان</span>
                        )}
                      </div>
                    </div>
                  </label>
                  
                  {/* Express Shipping */}
                  <label className={`block border rounded-lg p-4 cursor-pointer transition-all ${
                    shippingMethod === 'express' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="shipping"
                      value="express"
                      checked={shippingMethod === 'express'}
                      onChange={(e) => setShippingMethod(e.target.value)}
                      className="hidden"
                    />
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 mt-0.5 ${
                          shippingMethod === 'express' 
                            ? 'border-primary-500 bg-primary-500' 
                            : 'border-gray-300'
                        }`}>
                          {shippingMethod === 'express' && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold mb-1">ارسال فوری</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            تحویل در 1 روز کاری
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Package className="w-4 h-4" />
                            <span>ارسال با پیک موتوری</span>
                          </div>
                        </div>
                      </div>
                      
                      <span className="font-semibold">{formatPrice(shippingCosts.express)} تومان</span>
                    </div>
                  </label>
                  
                  {/* Scheduled Shipping */}
                  <label className={`block border rounded-lg p-4 cursor-pointer transition-all ${
                    shippingMethod === 'scheduled' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="shipping"
                      value="scheduled"
                      checked={shippingMethod === 'scheduled'}
                      onChange={(e) => setShippingMethod(e.target.value)}
                      className="hidden"
                    />
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 mt-0.5 ${
                          shippingMethod === 'scheduled' 
                            ? 'border-primary-500 bg-primary-500' 
                            : 'border-gray-300'
                        }`}>
                          {shippingMethod === 'scheduled' && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold mb-1">ارسال زمان‌بندی شده</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            انتخاب زمان دلخواه برای تحویل
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>تحویل در بازه زمانی مشخص</span>
                          </div>
                        </div>
                      </div>
                      
                      <span className="font-semibold">{formatPrice(shippingCosts.scheduled)} تومان</span>
                    </div>
                  </label>
                </div>
                
                {/* Notes */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    توضیحات (اختیاری)
                  </label>
                  <textarea
                    rows="3"
                    className="input"
                    placeholder="در صورت نیاز توضیحات خود را وارد کنید..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                
                {/* Navigation */}
                <div className="flex justify-between mt-6">
                  <Button
                    variant="ghost"
                    onClick={goToPreviousStep}
                  >
                    مرحله قبل
                  </Button>
                  <Button
                    variant="primary"
                    onClick={goToNextStep}
                    icon={<ChevronLeft className="w-5 h-5" />}
                  >
                    ادامه
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-primary-500" />
                  پرداخت نهایی
                </h2>
                
                {/* Payment Methods */}
                <div className="space-y-4 mb-6">
                  <label className={`block border rounded-lg p-4 cursor-pointer transition-all ${
                    paymentMethod === 'online' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="hidden"
                    />
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 mt-0.5 ${
                        paymentMethod === 'online' 
                          ? 'border-primary-500 bg-primary-500' 
                          : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'online' && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">پرداخت آنلاین</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          پرداخت امن با کارت‌های عضو شتاب
                        </p>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600">پرداخت امن با درگاه بانکی</span>
                        </div>
                      </div>
                    </div>
                  </label>
                  
                  <label className={`block border rounded-lg p-4 cursor-pointer transition-all ${
                    paymentMethod === 'cash' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="hidden"
                    />
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 mt-0.5 ${
                        paymentMethod === 'cash' 
                          ? 'border-primary-500 bg-primary-500' 
                          : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'cash' && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">پرداخت در محل</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          پرداخت نقدی یا با کارت هنگام تحویل
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                          <p className="text-xs text-amber-700 flex items-start gap-1">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            فقط برای سفارشات زیر 10 میلیون تومان در تهران
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
                
                {/* Final Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">خلاصه نهایی سفارش</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">تعداد محصولات:</span>
                      <span>{items.length} کالا</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">جمع کل کالاها:</span>
                      <span>{formatPrice(subtotal)} تومان</span>
                    </div>
                    
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>تخفیف:</span>
                        <span>-{formatPrice(totalDiscount)} تومان</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">هزینه ارسال:</span>
                      <span>
                        {shippingCost === 0 ? 'رایگان' : `${formatPrice(shippingCost)} تومان`}
                      </span>
                    </div>
                    
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>مبلغ قابل پرداخت:</span>
                        <span className="text-primary-500">{formatPrice(finalTotal)} تومان</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Navigation */}
                <div className="flex justify-between mt-6">
                  <Button
                    variant="ghost"
                    onClick={goToPreviousStep}
                  >
                    مرحله قبل
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handlePayment}
                    loading={paymentLoading}
                    icon={<CreditCard className="w-5 h-5" />}
                  >
                    پرداخت و ثبت سفارش
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">سفارش شما</h3>
              
              {/* Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{item.product.image}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium line-clamp-1">{item.product.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.quantity} عدد × {formatPrice(
                          item.product.discount 
                            ? item.product.price * (1 - item.product.discount / 100)
                            : item.product.price
                        )} تومان
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">جمع کل:</span>
                  <span>{formatPrice(subtotal)} تومان</span>
                </div>
                
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>تخفیف:</span>
                    <span>-{formatPrice(totalDiscount)} تومان</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ارسال:</span>
                  <span>
                    {shippingCost === 0 ? 'رایگان' : `${formatPrice(shippingCost)} تومان`}
                  </span>
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold">
                    <span>قابل پرداخت:</span>
                    <span className="text-primary-500">{formatPrice(finalTotal)} تومان</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;