import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Phone,
  Check,
  AlertCircle
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    terms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Password strength indicator
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    return strength;
  };
  
  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ['ضعیف', 'متوسط', 'خوب', 'قوی'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'نام و نام خانوادگی الزامی است';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'نام باید حداقل 3 کاراکتر باشد';
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'ایمیل الزامی است';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'ایمیل معتبر نیست';
    }
    
    // Phone validation
    if (!formData.phone) {
      newErrors.phone = 'شماره موبایل الزامی است';
    } else if (!/^09\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'شماره موبایل باید با 09 شروع شود و 11 رقم باشد';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'رمز عبور الزامی است';
    } else if (formData.password.length < 8) {
      newErrors.password = 'رمز عبور باید حداقل 8 کاراکتر باشد';
    } else if (passwordStrength < 2) {
      newErrors.password = 'رمز عبور باید قوی‌تر باشد';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تکرار رمز عبور الزامی است';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'رمز عبور و تکرار آن یکسان نیستند';
    }
    
    // Terms validation
    if (!formData.terms) {
      newErrors.terms = 'پذیرش قوانین و مقررات الزامی است';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const result = await register({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password
    });
    
    if (result.success) {
      navigate('/');
    } else {
      toast.error(result.error || 'خطا در ثبت نام');
    }
  };
  
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-3xl font-bold">ف</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">ثبت نام در فروشگاه</h1>
            <p className="text-gray-600">لطفا اطلاعات خود را وارد کنید</p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <Input
              label="نام و نام خانوادگی"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              icon={<User className="w-5 h-5" />}
              placeholder="مثال: علی احمدی"
              required
            />
            
            {/* Email */}
            <Input
              label="ایمیل"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={<Mail className="w-5 h-5" />}
              placeholder="example@email.com"
              required
            />
            
            {/* Phone */}
            <Input
              label="شماره موبایل"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              icon={<Phone className="w-5 h-5" />}
              placeholder="09123456789"
              required
              maxLength="11"
            />
            
            {/* Password */}
            <div>
              <div className="relative">
                <Input
                  label="رمز عبور"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  icon={<Lock className="w-5 h-5" />}
                  placeholder="حداقل 8 کاراکتر"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-[38px] text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    قدرت رمز عبور: {strengthLabels[passwordStrength - 1] || 'خیلی ضعیف'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Confirm Password */}
            <div className="relative">
              <Input
                label="تکرار رمز عبور"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                icon={<Lock className="w-5 h-5" />}
                placeholder="رمز عبور را مجدد وارد کنید"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-[38px] text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Password Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                رمز عبور باید شامل موارد زیر باشد:
              </p>
              <ul className="text-xs text-blue-700 space-y-1 mr-6">
                <li className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-green-700' : ''}`}>
                  <Check className={`w-3 h-3 ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`} />
                  حداقل 8 کاراکتر
                </li>
                <li className={`flex items-center gap-2 ${/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? 'text-green-700' : ''}`}>
                  <Check className={`w-3 h-3 ${/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`} />
                  حروف کوچک و بزرگ انگلیسی
                </li>
                <li className={`flex items-center gap-2 ${/\d/.test(formData.password) ? 'text-green-700' : ''}`}>
                  <Check className={`w-3 h-3 ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`} />
                  حداقل یک عدد
                </li>
                <li className={`flex items-center gap-2 ${/[!@#$%^&*]/.test(formData.password) ? 'text-green-700' : ''}`}>
                  <Check className={`w-3 h-3 ${/[!@#$%^&*]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`} />
                  حداقل یک کاراکتر خاص (!@#$%^&*)
                </li>
              </ul>
            </div>
            
            {/* Terms */}
            <div>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                  className="mt-0.5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">
                  <Link to="/terms" className="text-primary-500 hover:text-primary-600">
                    قوانین و مقررات
                  </Link>
                  {' '}و{' '}
                  <Link to="/privacy" className="text-primary-500 hover:text-primary-600">
                    حریم خصوصی
                  </Link>
                  {' '}را مطالعه کرده و می‌پذیرم
                </span>
              </label>
              {errors.terms && (
                <p className="mt-1 text-sm text-red-500">{errors.terms}</p>
              )}
            </div>
            
            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isLoading}
              size="lg"
            >
              ثبت نام
            </Button>
          </form>
          
          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">یا</span>
            </div>
          </div>
          
          {/* Social Register */}
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              <span>ثبت نام با گوگل</span>
            </button>
          </div>
          
          {/* Footer */}
          <p className="text-center mt-6 text-gray-600">
            قبلا ثبت نام کرده‌اید؟{' '}
            <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold">
              وارد شوید
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;