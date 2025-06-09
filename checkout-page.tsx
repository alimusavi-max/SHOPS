import React, { useState } from 'react';
import { 
  CreditCard, 
  Truck, 
  MapPin, 
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Edit,
  Plus,
  Home,
  Building
} from 'lucide-react';

const CheckoutPage = () => {
  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState(0);
  const [selectedShipping, setSelectedShipping] = useState('normal');
  const [selectedPayment, setSelectedPayment] = useState('online');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  // Form data
  const [addressForm, setAddressForm] = useState({
    title: '',
    receiver: '',
    phone: '',
    province: '',
    city: '',
    address: '',
    postalCode: ''
  });

  // Mock data
  const savedAddresses = [
    {
      id: 1,
      title: 'منزل',
      receiver: 'علی احمدی',
      phone: '09123456789',
      province: 'تهران',
      city: 'تهران',
      address: 'خیابان ولیعصر، پلاک 123، واحد 5',
      postalCode: '1234567890',
      isDefault: true
    },
    {
      id: 2,
      title: 'محل کار',
      receiver: 'علی احمدی',
      phone: '09123456789',
      province: 'تهران',
      city: 'تهران',
      address: 'خیابان شریعتی، ساختمان آرمان، طبقه 3',
      postalCode: '9876543210',
      isDefault: false
    }
  ];

  const cartItems = [
    {
      id: 1,
      name: 'هدفون بی‌سیم سونی WH-1000XM4',
      price: 3825000,
      quantity: 1,
      image: '🎧'
    },
    {
      id: 2,
      name: 'پاوربانک شیائومی 20000mAh',
      price: 890000,
      quantity: 2,
      image: '🔋'
    }
  ];

  const shippingMethods = [
    {
      id: 'normal',
      name: 'ارسال عادی',
      time: '5 تا 7 روز کاری',
      cost: 0,
      icon: '📦'
    },
    {
      id: 'express',
      name: 'ارسال پیشتاز',
      time: '1 تا 3 روز کاری',
      cost: 50000,
      icon: '🚀'
    },
    {
      id: 'scheduled',
      name: 'ارسال زماندار',
      time: 'انتخاب زمان دلخواه',
      cost: 75000,
      icon: '📅'
    }
  ];

  const paymentMethods = [
    {
      id: 'online',
      name: 'پرداخت آنلاین',
      description: 'پرداخت با کارت بانکی',
      icon: '💳'
    },
    {
      id: 'cash',
      name: 'پرداخت در محل',
      description: 'پرداخت نقدی هنگام تحویل',
      icon: '💵'
    },
    {
      id: 'card',
      name: 'کارت به کارت',
      description: 'واریز به شماره کارت',
      icon: '🏦'
    }
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getShippingCost = () => {
    const method = shippingMethods.find(m => m.id === selectedShipping);
    return method ? method.cost : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + getShippingCost();
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    // Add validation and save logic
    setShowAddressForm(false);
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmitOrder = () => {
    if (!agreeToTerms) {
      alert('لطفا قوانین و مقررات را بپذیرید');
      return;
    }
    // Submit order logic
    console.log('Order submitted');
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((num) => (
          <React.Fragment key={num}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
              step >= num 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              {step > num ? <CheckCircle className="w-6 h-6" /> : num}
            </div>
            {num < 3 && (
              <div className={`w-24 h-1 transition-all ${
                step > num ? 'bg-orange-500' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderAddressStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <MapPin className="w-6 h-6 text-orange-500" />
        آدرس تحویل سفارش
      </h2>

      {/* Saved Addresses */}
      <div className="space-y-4">
        {savedAddresses.map((address, index) => (
          <div
            key={address.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedAddress === index 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedAddress(index)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center ${
                  selectedAddress === index 
                    ? 'border-orange-500 bg-orange-500' 
                    : 'border-gray-300'
                }`}>
                  {selectedAddress === index && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{address.title}</h3>
                    {address.isDefault && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        پیش‌فرض
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {address.receiver} - {address.phone}
                  </p>
                  <p className="text-sm text-gray-700">
                    {address.province}، {address.city}، {address.address}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    کد پستی: {address.postalCode}
                  </p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-700 p-2">
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Address */}
      {!showAddressForm ? (
        <button
          onClick={() => setShowAddressForm(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          افزودن آدرس جدید
        </button>
      ) : (
        <form onSubmit={handleAddressSubmit} className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عنوان آدرس <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="مثال: منزل"
                value={addressForm.title}
                onChange={(e) => setAddressForm({...addressForm, title: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نام گیرنده <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={addressForm.receiver}
                onChange={(e) => setAddressForm({...addressForm, receiver: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                شماره موبایل <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="09123456789"
                value={addressForm.phone}
                onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                کد پستی <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="1234567890"
                value={addressForm.postalCode}
                onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                استان <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={addressForm.province}
                onChange={(e) => setAddressForm({...addressForm, province: e.target.value})}
                required
              >
                <option value="">انتخاب کنید</option>
                <option value="تهران">تهران</option>
                <option value="اصفهان">اصفهان</option>
                <option value="فارس">فارس</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                شهر <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={addressForm.city}
                onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                required
              >
                <option value="">انتخاب کنید</option>
                <option value="تهران">تهران</option>
                <option value="کرج">کرج</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              آدرس کامل <span className="text-red-500">*</span>
            </label>
            <textarea
              rows="3"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="خیابان، کوچه، پلاک..."
              value={addressForm.address}
              onChange={(e) => setAddressForm({...addressForm, address: e.target.value})}
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              ذخیره آدرس
            </button>
            <button
              type="button"
              onClick={() => setShowAddressForm(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              انصراف
            </button>
          </div>
        </form>
      )}
    </div>
  );

  const renderShippingStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Truck className="w-6 h-6 text-orange-500" />
        روش ارسال
      </h2>

      <div className="space-y-4">
        {shippingMethods.map((method) => (
          <div
            key={method.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedShipping === method.id 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedShipping(method.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedShipping === method.id 
                    ? 'border-orange-500 bg-orange-500' 
                    : 'border-gray-300'
                }`}>
                  {selectedShipping === method.id && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span className="text-3xl">{method.icon}</span>
                <div>
                  <h3 className="font-semibold">{method.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Clock className="w-4 h-4" />
                    {method.time}
                  </p>
                </div>
              </div>
              <p className="font-semibold text-orange-500">
                {method.cost === 0 ? 'رایگان' : `${formatPrice(method.cost)} تومان`}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Time */}
      {selectedShipping === 'scheduled' && (
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-3">
            زمان دلخواه خود را برای تحویل انتخاب کنید:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ</label>
              <input type="date" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ساعت</label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option>9 تا 12</option>
                <option>12 تا 15</option>
                <option>15 تا 18</option>
                <option>18 تا 21</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <CreditCard className="w-6 h-6 text-orange-500" />
        روش پرداخت
      </h2>

      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedPayment === method.id 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedPayment(method.id)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPayment === method.id 
                  ? 'border-orange-500 bg-orange-500' 
                  : 'border-gray-300'
              }`}>
                {selectedPayment === method.id && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <span className="text-3xl">{method.icon}</span>
              <div>
                <h3 className="font-semibold">{method.name}</h3>
                <p className="text-sm text-gray-600">{method.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Notes */}
      {selectedPayment === 'card' && (
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-sm text-yellow-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            پس از ثبت سفارش، شماره کارت برای واریز نمایش داده خواهد شد. لطفا پس از واریز، تصویر رسید را ارسال کنید.
          </p>
        </div>
      )}

      {/* Terms and Conditions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            className="mt-1 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          <span className="text-sm text-gray-700">
            <a href="#" className="text-blue-600 hover:underline">قوانین و مقررات</a> فروشگاه را مطالعه کرده و با آن موافقم.
          </span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">تکمیل سفارش</h1>

        {renderStepIndicator()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {step === 1 && renderAddressStep()}
              {step === 2 && renderShippingStep()}
              {step === 3 && renderPaymentStep()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                {step > 1 && (
                  <button
                    onClick={prevStep}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    مرحله قبل
                  </button>
                )}
                {step < 3 ? (
                  <button
                    onClick={nextStep}
                    className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors mr-auto"
                  >
                    مرحله بعد
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitOrder}
                    className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium mr-auto"
                  >
                    ثبت و پرداخت سفارش
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">خلاصه سفارش</h2>

              {/* Cart Items */}
              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{item.image}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium line-clamp-1">{item.name}</h4>
                      <p className="text-sm text-gray-600">
                        {item.quantity} عدد × {formatPrice(item.price)} تومان
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between text-gray-600">
                  <span>قیمت کالاها</span>
                  <span>{formatPrice(calculateSubtotal())} تومان</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>هزینه ارسال</span>
                  <span>
                    {getShippingCost() === 0 
                      ? <span className="text-green-500">رایگان</span>
                      : `${formatPrice(getShippingCost())} تومان`
                    }
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-3 border-t">
                  <span>مبلغ قابل پرداخت</span>
                  <span className="text-orange-500">{formatPrice(calculateTotal())} تومان</span>
                </div>
              </div>

              {/* Selected Info */}
              <div className="mt-6 space-y-3 text-sm">
                {step > 1 && selectedAddress !== null && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">آدرس تحویل:</p>
                      <p className="text-gray-600">
                        {savedAddresses[selectedAddress].address}
                      </p>
                    </div>
                  </div>
                )}
                {step > 2 && (
                  <div className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">روش ارسال:</p>
                      <p className="text-gray-600">
                        {shippingMethods.find(m => m.id === selectedShipping)?.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;