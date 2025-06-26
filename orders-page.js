import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { 
  Package, Clock, CheckCircle, XCircle, Truck, Eye, ChevronDown, ChevronUp, Calendar, Filter, Search, AlertTriangle, Loader2, ShoppingBag
} from 'lucide-react'; // Added AlertTriangle, ShoppingBag
import Button from '@/components/ui/Button'; // Assuming this path is correct via jsconfig/tsconfig
import Input from '@/components/ui/Input';   // Assuming this path is correct
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore'; // Corrected path based on app-router.js

const Orders = () => {
  const { user: currentUser, isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();

  const [localOrders, setLocalOrders] = useState([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true); // Page specific loading
  const [filter, setFilter] = useState('all'); // 'all', 'processing', 'shipped', 'delivered', 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null); // Stores ID of expanded order (_id or id)

  useEffect(() => {
    if (!authLoading) {
      if (currentUser && currentUser.orders) {
        setLocalOrders(currentUser.orders);
      } else if (!currentUser) {
        // This case should ideally be handled by ProtectedRoute redirecting to login.
        toast.error("برای مشاهده سفارشات لطفا ابتدا وارد شوید.");
        navigate('/login?redirect=/orders');
      }
      setIsLoadingPage(false);
    }
  }, [currentUser, authLoading, navigate]);

  // Effect to update localOrders if currentUser.orders changes from the store
  useEffect(() => {
    if (currentUser?.orders) { // Ensure currentUser and currentUser.orders exist
      setLocalOrders(currentUser.orders);
    } else if (!authLoading && !currentUser) { // If user logs out while on page
        setLocalOrders([]); // Clear local orders
    }
  }, [currentUser, authLoading]); // Depend on currentUser as a whole, or currentUser?.orders

  const statusConfig = {
    pending: { label: 'در انتظار پرداخت', color: 'text-orange-600 bg-orange-100', icon: Clock },
    processing: { label: 'در حال پردازش', color: 'text-blue-600 bg-blue-100', icon: Package },
    shipped: { label: 'ارسال شده', color: 'text-purple-600 bg-purple-100', icon: Truck },
    delivered: { label: 'تحویل شده', color: 'text-green-600 bg-green-100', icon: CheckCircle },
    cancelled: { label: 'لغو شده', color: 'text-red-600 bg-red-100', icon: XCircle }
  };
  
  const formatPrice = (price) => price ? new Intl.NumberFormat('fa-IR').format(price) : '0';
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'تاریخ نامشخص';

  const filteredOrders = useMemo(() => {
    return localOrders
      .filter(order => {
        if (filter !== 'all' && order.status !== filter) return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const orderNumberMatch = order.orderNumber?.toLowerCase().includes(query);
          // Ensure item.product and item.product.name exist before calling toLowerCase()
          const itemMatch = order.items?.some(item =>
            item.product && item.product.name && item.product.name.toLowerCase().includes(query)
          );
          return orderNumberMatch || itemMatch;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort newest first
  }, [localOrders, filter, searchQuery]);
  
  const handleCancelOrder = (orderId) => {
    // This is a client-side simulation. Real cancellation needs an API call.
    if (window.confirm('آیا از لغو این سفارش اطمینان دارید؟ (این عمل شبیه‌سازی شده است)')) {
      setLocalOrders(prevOrders =>
        prevOrders.map(order =>
          (order._id === orderId || order.id === orderId) ? { ...order, status: 'cancelled' } : order
        )
      );
      toast.success('سفارش (به صورت نمایشی) لغو شد.');
      // TODO: API call to cancel order: await cancelOrderAPI(orderId);
      // Then potentially refetch orders or update based on API response.
    }
  };

  const toggleExpandOrder = (orderId) => {
    setExpandedOrder(currentExpandedId => (currentExpandedId === orderId ? null : orderId));
  };

  if (isLoadingPage || authLoading) {
    return <div className="flex items-center justify-center min-h-[70vh]"><Loader2 className="w-12 h-12 animate-spin text-primary-500" /></div>;
  }

  if (!currentUser) {
    // This case should ideally be handled by ProtectedRoute redirecting to login.
    return <div className="text-center py-10">لطفا برای دسترسی به این صفحه وارد شوید. <Link to="/login" className="text-primary-500 hover:underline">ورود</Link></div>;
  }
  
  if (localOrders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">هنوز سفارشی ثبت نکرده‌اید.</h2>
          <p className="text-gray-600 mb-8">پس از ثبت اولین سفارش، می‌توانید آن را اینجا پیگیری کنید.</p>
          <Link to="/products" className="btn btn-primary">شروع خرید</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">سفارشات من</h1>

        {/* Filters and Search */}
        <div className="mb-6 p-4 bg-white rounded-xl shadow-sm flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full sm:w-auto">
            <Input
              type="text"
              placeholder="جستجو (شماره سفارش، نام محصول)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5 text-gray-400"/>}
              classNameContainer="w-full" // Assuming Input accepts classNameContainer
            />
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input w-full" // Assuming 'input' class is styled globally or via Tailwind plugin
              aria-label="فیلتر وضعیت سفارش"
            >
              <option value="all">همه وضعیت‌ها</option>
              {Object.entries(statusConfig).map(([key, conf]) => (
                <option key={key} value={key}>{conf.label}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm">
            <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">هیچ سفارشی با این مشخصات یافت نشد.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const orderId = order._id || order.id;
              const currentStatus = statusConfig[order.status] || { label: order.status || 'نامشخص', color: 'text-gray-600 bg-gray-100', icon: Clock };
              const IconComponent = currentStatus.icon;
              const itemsCount = order.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;

              return (
                <div key={orderId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-6 border-b cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleExpandOrder(orderId)}>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base">شماره سفارش: {order.orderNumber}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" /> {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className={`text-xs font-medium px-2 py-1 rounded-full inline-flex items-center gap-1.5 ${currentStatus.color}`}>
                        <IconComponent className="w-3.5 h-3.5" /> {currentStatus.label}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-3 text-sm">
                      <p className="text-gray-600 mb-2 sm:mb-0">تعداد کالا: {itemsCount} عدد</p>
                      <p className="font-semibold text-primary-500">مبلغ کل: {formatPrice(order.totalAmount)} تومان</p>
                      <div className="mt-2 sm:mt-0">
                        <button className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          {expandedOrder === orderId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {expandedOrder === orderId ? 'بستن جزئیات' : 'مشاهده جزئیات'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedOrder === orderId && (
                    <div className="p-4 sm:p-6 bg-gray-50/50">
                      <h4 className="font-semibold mb-3 text-sm text-gray-700">محصولات سفارش:</h4>
                      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                        {order.items?.map((item, idx) => (
                          <div key={item.product?._id || item.product?.id || idx} className="flex items-center gap-3 text-xs p-2 bg-white rounded-md border">
                            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-xl flex-shrink-0">{item.product?.image || '🛍️'}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 truncate">{item.product?.name || 'نام محصول نامشخص'}</p>
                              <p className="text-gray-500">{item.quantity || 0} عدد × {formatPrice(item.price)} تومان</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* TODO: Add more details like shipping address if available in order object and needed */}
                      {(order.status === 'pending' || order.status === 'processing') && (
                        <Button variant="danger" size="sm" onClick={() => handleCancelOrder(orderId)}>لغو سفارش (نمایشی)</Button>
                      )}
                       <Link to={`/orders/${orderId}`} className="btn btn-outline btn-sm ml-2">مشاهده فاکتور</Link> {/* Placeholder for invoice page */}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {/* TODO: Pagination for orders */}
      </div>
    </div>
  );
};

export default Orders;