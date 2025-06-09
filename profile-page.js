import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Edit2,
  Save,
  X,
  Lock,
  MapPin,
  Package,
  Heart,
  LogOut,
  Shield,
  Bell,
  CreditCard
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile, changePassword, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    birthDate: user?.birthDate || '',
    nationalCode: user?.nationalCode || ''
  });
  
  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  
  // Handle profile update
  const handleUpdateProfile = async () => {
    const newErrors = {};
    
    if (!profileForm.name.trim()) {
      newErrors.name = 'نام و نام خانوادگی الزامی است';
    }
    
    if (!profileForm.email) {
      newErrors.email = 'ایمیل الزامی است';
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      newErrors.email = 'ایمیل معتبر نیست';
    }
    
    if (!profileForm.phone) {
      newErrors.phone = 'شماره موبایل الزامی است';
    } else if (!/^09\d{9}$/.test(profileForm.phone)) {
      newErrors.phone = 'شماره موبایل معتبر نیست';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const result = await updateProfile(profileForm);
    
    if (result.success) {
      setIsEditing(false);
      toast.success('پروفایل با موفقیت بروزرسانی شد');
    } else {
      toast.error(result.error || 'خطا در بروزرسانی پروفایل');
    }
  };
  
  // Handle password change
  const handleChangePassword = async () => {
    const newErrors = {};
    
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'رمز عبور فعلی الزامی است';
    }
    
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'رمز عبور جدید الزامی است';
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = 'رمز عبور باید حداقل 8 کاراکتر باشد';
    }
    
    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'تکرار رمز عبور الزامی است';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'رمز عبور و تکرار آن یکسان نیستند';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const result = await changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
    
    if (result.success) {
      setIsChangingPassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast.success('رمز عبور با موفقیت تغییر یافت');
    } else {
      toast.error(result.error || 'خطا در تغییر رمز عبور');
    }
  };
  
  const handleLogout = async () => {
    if (window.confirm('آیا از خروج اطمینان دارید؟')) {
      await logout();
    }
  };
  
  const tabs = [
    { id: 'personal', label: 'اطلاعات شخصی', icon: User },
    { id: 'addresses', label: 'آدرس‌ها', icon: MapPin },
    { id: 'orders', label: 'سفارشات', icon: Package },
    { id: 'wishlist', label: 'علاقه‌مندی‌ها', icon: Heart },
    { id: 'security', label: 'امنیت', icon: Shield },
    { id: 'notifications', label: 'اعلان‌ها', icon: Bell }
  ];
  
  const stats = [
    { label: 'سفارشات', value: '12', icon: Package, color: 'text-blue-600 bg-blue-100' },
    { label: 'در انتظار', value: '2', icon: CreditCard, color: 'text-orange-600 bg-orange-100' },
    { label: 'علاقه‌مندی', value: '24', icon: Heart, color: 'text-red-600 bg-red-100' },
    { label: 'امتیاز', value: '850', icon: Shield, color: 'text-green-600 bg-green-100' }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-primary-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{user?.name || 'کاربر'}</h1>
                <p className="text-gray-600">{user?.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  عضویت از: {new Date(user?.createdAt || Date.now()).toLocaleDateString('fa-IR')}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              onClick={handleLogout}
              icon={<LogOut className="w-5 h-5" />}
              className="text-red-600 hover:bg-red-50"
            >
              خروج
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Personal Information Tab */}
              {activeTab === 'personal' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">اطلاعات شخصی</h2>
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        icon={<Edit2 className="w-4 h-4" />}
                      >
                        ویرایش
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditing(false);
                            setErrors({});
                            setProfileForm({
                              name: user?.name || '',
                              email: user?.email || '',
                              phone: user?.phone || '',
                              birthDate: user?.birthDate || '',
                              nationalCode: user?.nationalCode || ''
                            });
                          }}
                          icon={<X className="w-4 h-4" />}
                        >
                          انصراف
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleUpdateProfile}
                          icon={<Save className="w-4 h-4" />}
                        >
                          ذخیره
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="نام و نام خانوادگی"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                      error={errors.name}
                      disabled={!isEditing}
                      icon={<User className="w-5 h-5" />}
                    />
                    
                    <Input
                      label="ایمیل"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                      error={errors.email}
                      disabled={!isEditing}
                      icon={<Mail className="w-5 h-5" />}
                    />
                    
                    <Input
                      label="شماره موبایل"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      error={errors.phone}
                      disabled={!isEditing}
                      icon={<Phone className="w-5 h-5" />}
                    />
                    
                    <Input
                      label="تاریخ تولد"
                      type="date"
                      value={profileForm.birthDate}
                      onChange={(e) => setProfileForm({...profileForm, birthDate: e.target.value})}
                      disabled={!isEditing}
                      icon={<Calendar className="w-5 h-5" />}
                    />
                    
                    <Input
                      label="کد ملی"
                      value={profileForm.nationalCode}
                      onChange={(e) => setProfileForm({...profileForm, nationalCode: e.target.value})}
                      disabled={!isEditing}
                      maxLength="10"
                    />
                  </div>
                </div>
              )}
              
              {/* Addresses Tab */}
              {activeTab === 'addresses' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">آدرس‌های من</h2>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<MapPin className="w-4 h-4" />}
                    >
                      افزودن آدرس جدید
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">منزل</h3>
                            <span className="badge badge-primary text-xs">پیش‌فرض</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            تهران، خیابان ولیعصر، پلاک 123، واحد 5
                          </p>
                          <p className="text-sm text-gray-500">
                            کد پستی: 1234567890 | تلفن: 09123456789
                          </p>
                        </div>
                        <button className="text-primary-500 hover:text-primary-600">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-xl font-bold mb-6">سفارشات من</h2>
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">هنوز سفارشی ثبت نکرده‌اید</p>
                    <Link to="/products">
                      <Button variant="primary">
                        شروع خرید
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
              
              {/* Wishlist Tab */}
              {activeTab === 'wishlist' && (
                <div>
                  <h2 className="text-xl font-bold mb-6">لیست علاقه‌مندی‌ها</h2>
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">لیست علاقه‌مندی‌های شما خالی است</p>
                    <Link to="/products">
                      <Button variant="primary">
                        مشاهده محصولات
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
              
              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-bold mb-6">تنظیمات امنیتی</h2>
                  
                  {!isChangingPassword ? (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-semibold mb-2">رمز عبور</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        برای حفظ امنیت حساب کاربری، رمز عبور خود را به صورت دوره‌ای تغییر دهید
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setIsChangingPassword(true)}
                        icon={<Lock className="w-4 h-4" />}
                      >
                        تغییر رمز عبور
                      </Button>
                    </div>
                  ) : (
                    <div className="max-w-md">
                      <h3 className="font-semibold mb-4">تغییر رمز عبور</h3>
                      <div className="space-y-4">
                        <Input
                          label="رمز عبور فعلی"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                          error={errors.currentPassword}
                          icon={<Lock className="w-5 h-5" />}
                        />
                        
                        <Input
                          label="رمز عبور جدید"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                          error={errors.newPassword}
                          icon={<Lock className="w-5 h-5" />}
                        />
                        
                        <Input
                          label="تکرار رمز عبور جدید"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                          error={errors.confirmPassword}
                          icon={<Lock className="w-5 h-5" />}
                        />
                        
                        <div className="flex gap-3">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setIsChangingPassword(false);
                              setPasswordForm({
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: ''
                              });
                              setErrors({});
                            }}
                          >
                            انصراف
                          </Button>
                          <Button
                            variant="primary"
                            onClick={handleChangePassword}
                          >
                            تغییر رمز عبور
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-8">
                    <h3 className="font-semibold mb-4">احراز هویت دو مرحله‌ای</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 mb-3">
                        برای افزایش امنیت حساب کاربری خود، احراز هویت دو مرحله‌ای را فعال کنید
                      </p>
                      <Button variant="outline" size="sm">
                        فعال‌سازی
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-bold mb-6">تنظیمات اعلان‌ها</h2>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                      <div>
                        <h3 className="font-semibold mb-1">اعلان‌های ایمیلی</h3>
                        <p className="text-sm text-gray-600">
                          دریافت ایمیل برای سفارشات، پیشنهادات ویژه و اخبار
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="toggle"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                      <div>
                        <h3 className="font-semibold mb-1">پیامک‌های تبلیغاتی</h3>
                        <p className="text-sm text-gray-600">
                          دریافت پیامک برای تخفیف‌ها و پیشنهادات ویژه
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                      <div>
                        <h3 className="font-semibold mb-1">اعلان‌های مرورگر</h3>
                        <p className="text-sm text-gray-600">
                          نمایش اعلان‌ها در مرورگر شما
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;