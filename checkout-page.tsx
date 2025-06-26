import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Truck, MapPin, Clock, User, Phone, Mail, CheckCircle, AlertCircle, Edit, Plus, Home, Building, Loader2
} from 'lucide-react';
import useCartStore from '@/store/cartStore';
import useAuthStore from '@/store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const {
    items: cartItems,
    isLoading: isCartLoading,
    fetchCart,
    clearCart: clearCartAction, // Renamed to avoid conflict if a local clearCart is ever needed
    getTotalPrice,
    createOrder // New action from cart store
  } = useCartStore();
  const { user: currentUser, isAuthenticated } = useAuthStore();

  const [step, setStep] = useState(1);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [selectedShipping, setSelectedShipping] = useState('normal');
  const [selectedPayment, setSelectedPayment] = useState('online');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  const [addressForm, setAddressForm] = useState({
    title: '', receiver: '', phone: '', province: '', city: '', address: '', postalCode: ''
  });
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else if (!isAuthenticated && !isCartLoading) { // Check isCartLoading to prevent redirect during initial auth check
        toast.error("لطفا برای ادامه ابتدا وارد شوید.");
        navigate('/login?redirect=/checkout');
    }
  }, [fetchCart, isAuthenticated, navigate, isCartLoading]);

  // Using mock addresses for now. In a real app, these would come from user profile (API)
  const savedAddresses = [
    { id: 1, title: 'منزل', receiver: currentUser?.name || 'کاربر مهمان', phone: currentUser?.phone || '09120000000', province: 'تهران', city: 'تهران', address: 'خیابان آزادی، پلاک ۱۲۳', postalCode: '1234512345', isDefault: true },
    { id: 2, title: 'محل کار', receiver: currentUser?.name || 'کاربر مهمان', phone: currentUser?.phone || '09120000000', province: 'تهران', city: 'تهران', address: 'میدان انقلاب، ساختمان نمونه', postalCode: '5432154321', isDefault: false },
  ];

  const shippingMethods = [
    { id: 'normal', name: 'ارسال عادی', time: '5 تا 7 روز کاری', cost: 0, icon: '📦' },
    { id: 'express', name: 'ارسال پیشتاز', time: '1 تا 3 روز کاری', cost: 50000, icon: '🚀' },
  ];

  const paymentMethods = [
    { id: 'online', name: 'پرداخت آنلاین', description: 'پرداخت با کارت بانکی', icon: '💳' },
    { id: 'cash', name: 'پرداخت در محل', description: 'پرداخت نقدی هنگام تحویل', icon: '💵' },
  ];

  const formatPrice = (price) => new Intl.NumberFormat('fa-IR').format(price);

  const cartSubtotal = getTotalPrice(); // This is the total price of items from the store

  const getShippingCost = () => {
    const method = shippingMethods.find(m => m.id === selectedShipping);
    return method ? method.cost : 0;
  };

  const calculateGrandTotal = () => cartSubtotal + getShippingCost();

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    // TODO: Add validation & API call to save new address to user profile
    // For now, just add to local mock list for UI demo
    const newAddress = { ...addressForm, id: Date.now(), isDefault: savedAddresses.length === 0 };
    // In a real app: await saveUserAddress(newAddress);
    // For mock:
    // setSavedAddresses(prev => [newAddress, ...prev]);
    toast.success("آدرس (بصورت نمایشی) اضافه شد.");
    setSelectedAddressIndex(0); // Select the new address (assuming it's added to the start)
    setShowAddressForm(false);
    setAddressForm({ title: '', receiver: '', phone: '', province: '', city: '', address: '', postalCode: '' });
  };

  const nextStep = () => {
    if (step === 1 && savedAddresses.length === 0 && !showAddressForm) {
        toast.error("لطفا یک آدرس انتخاب یا اضافه کنید.");
        return;
    }
    if (step < 3) setStep(step + 1);
  };
  const prevStep = () => { if (step > 1) setStep(step - 1); };

  const handleSubmitOrder = async () => {
    if (!agreeToTerms) {
      toast.error('لطفا قوانین و مقررات را بپذیرید');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('سبد خرید شما خالی است!');
      navigate('/products');
      return;
    }

    setIsProcessingOrder(true);
    const currentAddress = savedAddresses[selectedAddressIndex];
    const currentShipping = shippingMethods.find(s => s.id === selectedShipping);

    const orderDetails = {
      userId: currentUser?._id || 'guest', // Handle guest checkout if supported, or ensure user exists
      items: cartItems.map(item => ({
        productId: item.product.id || item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.discount ? item.product.price * (1 - item.product.discount / 100) : item.product.price,
        image: item.product.image // Optional: for order summary
      })),
      shippingAddress: { ...currentAddress },
      shippingMethod: { name: currentShipping?.name, cost: currentShipping?.cost },
      paymentMethod: selectedPayment,
      subtotal: cartSubtotal,
      shippingCost: currentShipping?.cost || 0,
      totalAmount: calculateGrandTotal(),
      // coupon: appliedCoupon, // If coupon logic is integrated with backend
    };

    const result = await createOrder(orderDetails); // Call action from cartStore
    setIsProcessingOrder(false);

    if (result.success && result.order) {
      toast.success(`سفارش شما با شماره ${result.order.id || result.order.orderNumber} با موفقیت ثبت شد!`);
      // clearCartAction(); // createOrder action in store now calls clearCart
      navigate(`/order-confirmation/${result.order.id || result.order.orderNumber}`); // Navigate to a confirmation page
    } else {
      toast.error(result.error || 'خطا در ثبت سفارش. لطفا دوباره تلاش کنید.');
    }
  };

  const renderStepIndicator = () => ( /* ... same as before ... */ <div className="flex items-center justify-center mb-8"><div className="flex items-center gap-4">{[1, 2, 3].map((num) => (<React.Fragment key={num}><div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${step >= num ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{step > num ? <CheckCircle className="w-6 h-6" /> : num}</div>{num < 3 && (<div className={`w-24 h-1 transition-all ${step > num ? 'bg-orange-500' : 'bg-gray-200'}`} />)}</React.Fragment>))}</div></div>);

  // renderAddressStep, renderShippingStep, renderPaymentStep need minor updates for data binding if any
  // For brevity, I'll assume their internal structure remains similar but will use correct state/props.
  // Key changes:
  // - Use `selectedAddressIndex`
  // - `cartItems` from store used in summary.

  if (isCartLoading && cartItems.length === 0) { // Show full page loader only if cart is initially empty and loading
    return <div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-500" /></div>;
  }

  if (!isCartLoading && cartItems.length === 0 && step === 1) { // Only show empty cart message if truly empty and on first step
    return (
      <div className="min-h-screen bg-gray-50 py-12 text-center">
        <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">سبد خرید شما برای تسویه حساب خالی است!</h2>
        <Link to="/products" className="btn btn-primary">بازگشت به فروشگاه</Link>
      </div>
    );
  }

  // renderAddressStep, renderShippingStep, renderPaymentStep JSX (simplified for brevity, assume correct data binding)
  const renderAddressStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2"><MapPin className="w-6 h-6 text-orange-500" />آدرس تحویل سفارش</h2>
      <div className="space-y-4">
        {savedAddresses.map((address, index) => (
          <div key={address.id} className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedAddressIndex === index ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setSelectedAddressIndex(index)}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3"><div className={`w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center ${selectedAddressIndex === index ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>{selectedAddressIndex === index && (<div className="w-2 h-2 bg-white rounded-full" />)}</div>
                <div className="flex-1"><div className="flex items-center gap-2 mb-1"><h3 className="font-semibold">{address.title}</h3>{address.isDefault && (<span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">پیش‌فرض</span>)}</div><p className="text-sm text-gray-600 mb-1">{address.receiver} - {address.phone}</p><p className="text-sm text-gray-700">{address.province}، {address.city}، {address.address}</p><p className="text-sm text-gray-600 mt-1">کد پستی: {address.postalCode}</p></div>
              </div><button className="text-blue-600 hover:text-blue-700 p-2"><Edit className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
      {!showAddressForm ? (<button onClick={() => setShowAddressForm(true)} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"><Plus className="w-5 h-5" />افزودن آدرس جدید</button>) : (
        <form onSubmit={handleAddressSubmit} className="bg-gray-50 rounded-lg p-6 space-y-4"> {/* Address form fields... */} <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">عنوان آدرس <span className="text-red-500">*</span></label><input type="text" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="مثال: منزل" value={addressForm.title} onChange={(e) => setAddressForm({...addressForm, title: e.target.value})} required/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">نام گیرنده <span className="text-red-500">*</span></label><input type="text" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" value={addressForm.receiver} onChange={(e) => setAddressForm({...addressForm, receiver: e.target.value})} required/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">شماره موبایل <span className="text-red-500">*</span></label><input type="tel" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="09123456789" value={addressForm.phone} onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})} required/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">کد پستی <span className="text-red-500">*</span></label><input type="text" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="1234567890" value={addressForm.postalCode} onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})} required/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">استان <span className="text-red-500">*</span></label><select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" value={addressForm.province} onChange={(e) => setAddressForm({...addressForm, province: e.target.value})} required><option value="">انتخاب کنید</option><option value="تهران">تهران</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">شهر <span className="text-red-500">*</span></label><select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" value={addressForm.city} onChange={(e) => setAddressForm({...addressForm, city: e.target.value})} required><option value="">انتخاب کنید</option><option value="تهران">تهران</option></select></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">آدرس کامل <span className="text-red-500">*</span></label><textarea rows="3" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="خیابان، کوچه، پلاک..." value={addressForm.address} onChange={(e) => setAddressForm({...addressForm, address: e.target.value})} required/></div><div className="flex gap-3"><button type="submit" className="btn btn-primary">ذخیره آدرس</button><button type="button" onClick={() => setShowAddressForm(false)} className="btn btn-outline">انصراف</button></div></form>)}
    </div>
  );
  const renderShippingStep = () => ( /* ... similar structure, using selectedShipping state ... */ <div className="space-y-6"><h2 className="text-xl font-semibold flex items-center gap-2"><Truck className="w-6 h-6 text-orange-500" />روش ارسال</h2><div className="space-y-4">{shippingMethods.map((method) => (<div key={method.id} className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedShipping === method.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setSelectedShipping(method.id)}><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedShipping === method.id ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>{selectedShipping === method.id && (<div className="w-2 h-2 bg-white rounded-full" />)}</div><span className="text-3xl">{method.icon}</span><div><h3 className="font-semibold">{method.name}</h3><p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><Clock className="w-4 h-4" />{method.time}</p></div></div><p className="font-semibold text-orange-500">{method.cost === 0 ? 'رایگان' : `${formatPrice(method.cost)} تومان`}</p></div></div>))}</div></div>);
  const renderPaymentStep = () => ( /* ... similar structure, using selectedPayment state ... */ <div className="space-y-6"><h2 className="text-xl font-semibold flex items-center gap-2"><CreditCard className="w-6 h-6 text-orange-500" />روش پرداخت</h2><div className="space-y-4">{paymentMethods.map((method) => (<div key={method.id} className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedPayment === method.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setSelectedPayment(method.id)}><div className="flex items-center gap-3"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPayment === method.id ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>{selectedPayment === method.id && (<div className="w-2 h-2 bg-white rounded-full" />)}</div><span className="text-3xl">{method.icon}</span><div><h3 className="font-semibold">{method.name}</h3><p className="text-sm text-gray-600">{method.description}</p></div></div></div>))}</div><div className="bg-gray-50 rounded-lg p-4"><label className="flex items-start gap-3"><input type="checkbox" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} className="mt-1 rounded border-gray-300 text-orange-500 focus:ring-orange-500"/><span className="text-sm text-gray-700"><Link to="/terms" className="text-blue-600 hover:underline">قوانین و مقررات</Link> فروشگاه را مطالعه کرده و با آن موافقم.</span></label></div></div>);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 text-center">تکمیل سفارش</h1>
        {renderStepIndicator()}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              {step === 1 && renderAddressStep()}
              {step === 2 && renderShippingStep()}
              {step === 3 && renderPaymentStep()}
              <div className="flex justify-between mt-8">
                {step > 1 && (<button onClick={prevStep} className="btn btn-outline">مرحله قبل</button>)}
                {step < 3 ? (<button onClick={nextStep} className="btn btn-primary mr-auto">مرحله بعد</button>) :
                  (<button onClick={handleSubmitOrder} className="btn btn-success mr-auto" disabled={isProcessingOrder || !agreeToTerms}>
                    {isProcessingOrder ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    {isProcessingOrder ? 'در حال ثبت...' : 'ثبت و پرداخت سفارش'}
                   </button>)}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 sticky top-24">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">خلاصه سفارش</h2>
              {isCartLoading && cartItems.length === 0 ? <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-primary-500"/></div> :
                <div className="space-y-2 sm:space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.product.id || item.product._id} className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 text-xl sm:text-2xl">{item.product.image || '🛍️'}</div>
                      <div className="flex-1 min-w-0"><h4 className="text-xs sm:text-sm font-medium line-clamp-1 truncate">{item.product.name}</h4><p className="text-xs sm:text-sm text-gray-600">{item.quantity} عدد × {formatPrice(item.product.discount ? item.product.price * (1 - item.product.discount/100) : item.product.price)}</p></div>
                      <div className="text-xs sm:text-sm font-semibold whitespace-nowrap">{formatPrice((item.product.discount ? item.product.price * (1 - item.product.discount/100) : item.product.price) * item.quantity)} ت</div>
                    </div>
                  ))}
                </div>
              }
              <div className="space-y-2 sm:space-y-3 pt-3 border-t text-sm sm:text-base">
                <div className="flex justify-between text-gray-600"><span>قیمت کالاها</span><span>{formatPrice(cartSubtotal)} تومان</span></div>
                <div className="flex justify-between text-gray-600"><span>هزینه ارسال</span><span>{getShippingCost() === 0 ? <span className="text-green-500">رایگان</span> : `${formatPrice(getShippingCost())} تومان`}</span></div>
                <div className="flex justify-between text-md sm:text-lg font-semibold pt-2 border-t"><span>مبلغ قابل پرداخت</span><span className="text-orange-500">{formatPrice(calculateGrandTotal())} تومان</span></div>
              </div>
              {step > 1 && savedAddresses[selectedAddressIndex] && (<div className="mt-4 pt-3 border-t space-y-1 text-xs text-gray-500"><div><span className="font-medium">آدرس:</span> {savedAddresses[selectedAddressIndex].address}, {savedAddresses[selectedAddressIndex].city}</div>{step > 2 && shippingMethods.find(m => m.id === selectedShipping) && (<div><span className="font-medium">ارسال:</span> {shippingMethods.find(m => m.id === selectedShipping)?.name}</div>)}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;