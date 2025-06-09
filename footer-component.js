import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Instagram, 
  Send,
  Truck,
  Shield,
  CreditCard,
  HeadphonesIcon
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Features Section */}
      <div className="bg-gray-800">
        <div className="container-custom py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center">
              <Truck className="w-10 h-10 text-primary-400 mb-3" />
              <h4 className="font-semibold text-white mb-1">ارسال رایگان</h4>
              <p className="text-sm">سفارش بالای 500 هزار تومان</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <Shield className="w-10 h-10 text-primary-400 mb-3" />
              <h4 className="font-semibold text-white mb-1">ضمانت اصالت</h4>
              <p className="text-sm">تضمین اصل بودن کالا</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <CreditCard className="w-10 h-10 text-primary-400 mb-3" />
              <h4 className="font-semibold text-white mb-1">پرداخت امن</h4>
              <p className="text-sm">درگاه پرداخت معتبر</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <HeadphonesIcon className="w-10 h-10 text-primary-400 mb-3" />
              <h4 className="font-semibold text-white mb-1">پشتیبانی 24/7</h4>
              <p className="text-sm">پاسخگویی در تمام ساعات</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Footer */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">ف</span>
              </div>
              <h3 className="text-xl font-bold text-white">فروشگاه آنلاین</h3>
            </div>
            <p className="text-sm mb-4 leading-relaxed">
              ما در فروشگاه آنلاین با هدف ارائه بهترین محصولات با کیفیت عالی و قیمت مناسب، 
              در خدمت شما عزیزان هستیم. رضایت شما افتخار ماست.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-primary-500 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-primary-500 transition-colors">
                <Send className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">دسترسی سریع</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="hover:text-primary-400 transition-colors">
                  درباره ما
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary-400 transition-colors">
                  تماس با ما
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-primary-400 transition-colors">
                  سوالات متداول
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary-400 transition-colors">
                  قوانین و مقررات
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary-400 transition-colors">
                  حریم خصوصی
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">خدمات مشتریان</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/shipping" className="hover:text-primary-400 transition-colors">
                  راهنمای خرید
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-primary-400 transition-colors">
                  شرایط بازگشت کالا
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="hover:text-primary-400 transition-colors">
                  پیگیری سفارش
                </Link>
              </li>
              <li>
                <Link to="/warranty" className="hover:text-primary-400 transition-colors">
                  گارانتی محصولات
                </Link>
              </li>
              <li>
                <Link to="/complaints" className="hover:text-primary-400 transition-colors">
                  ثبت شکایات
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">اطلاعات تماس</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  تهران، خیابان ولیعصر، پلاک 123
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <a href="tel:02112345678" className="hover:text-primary-400 transition-colors">
                  021-12345678
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <a href="mailto:info@shop.com" className="hover:text-primary-400 transition-colors">
                  info@shop.com
                </a>
              </li>
            </ul>
            
            {/* Newsletter */}
            <div className="mt-6">
              <h5 className="font-semibold text-white mb-2">عضویت در خبرنامه</h5>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="ایمیل شما"
                  className="flex-1 px-3 py-2 bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  عضویت
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-center">
              © {currentYear} فروشگاه آنلاین. تمامی حقوق محفوظ است.
            </p>
            <div className="flex items-center gap-4">
              <img src="/images/zarinpal.png" alt="زرین پال" className="h-8 opacity-50 hover:opacity-100 transition-opacity" />
              <img src="/images/enamad.png" alt="اینماد" className="h-8 opacity-50 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;