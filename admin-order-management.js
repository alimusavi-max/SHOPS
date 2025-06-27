import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  Calendar,
  User,
  MapPin,
  Phone,
  CreditCard,
  Download
} from 'lucide-react';
import Button from '@/components/ui/Button';
// import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiGlobal, { endpoints as globalEndpoints } from '@/services/api'; // Use global api instance

// --- Removed local API Simulation ---

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const itemsPerPage = 10;
  const [totalOrders, setTotalOrders] = useState(0); // For pagination

  const fetchAdminOrders = async () => {
    setLoading(true);
    try {
      // Build query params for backend API
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: selectedStatus === 'all' ? '' : selectedStatus, // only send if not 'all'
        search: searchQuery
        // Add date range params if implemented
      };
      Object.keys(params).forEach(key => !params[key] && delete params[key]); // Remove empty params

      const response = await apiGlobal.get(globalEndpoints.adminOrders, { params });
      // Backend response: { status, results, totalOrders, totalPages, currentPage, data: { orders: [] } }
      // Interceptor returns response.data
      setOrders(response.data?.orders || response.data || []);
      setTotalOrders(response.totalOrders || 0);
      // setCurrentPage(response.currentPage || 1); // API should dictate current page if backend pagination is strict
    } catch (error) {
      console.error("Failed to fetch admin orders:", error);
      // Toast handled by global interceptor
      setOrders([]);
      setTotalOrders(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminOrders();
  }, []);

  const statusConfig = {
    pending: {
      label: 'در انتظار پرداخت',
      color: 'text-orange-600 bg-orange-100',
      icon: Clock
    },
    processing: {
      label: 'در حال پردازش',
      color: 'text-blue-600 bg-blue-100',
      icon: Package
    },
    shipped: {
      label: 'ارسال شده',
      color: 'text-purple-600 bg-purple-100',
      icon: Truck
    },
    delivered: {
      label: 'تحویل شده',
      color: 'text-green-600 bg-green-100',
      icon: CheckCircle
    },
    cancelled: {
      label: 'لغو شده',
      color: 'text-red-600 bg-red-100',
      icon: XCircle
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'تاریخ نامشخص';


  // Filter orders
  const filteredOrders = React.useMemo(() => {
    return orders
      .filter(order => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = !query ||
          order.orderNumber?.toLowerCase().includes(query) ||
          order.customer?.name?.toLowerCase().includes(query) ||
          order.customer?.phone?.includes(query);

        const matchesStatus = !selectedStatus || order.status === selectedStatus;
        // Add date range filtering if selectedDateRange is implemented
        return matchesSearch && matchesStatus;
      })
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort newest first
  }, [orders, searchQuery, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(totalOrders / itemsPerPage); // Use totalOrders from API
  const startIndex = (currentPage - 1) * itemsPerPage;
  // Paginated orders are now directly the 'orders' state if API handles pagination
  // If API doesn't handle pagination, client-side slicing of filteredOrders is needed.
  // Assuming API handles pagination based on 'page' and 'limit' params sent in fetchAdminOrders.
  // So, `paginatedOrders` will just be `filteredOrders` (which is `orders` from API for current page).
  const paginatedOrders = filteredOrders; // If API does pagination, this is already the current page's data

  // Handle status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    const originalOrders = [...orders]; // Use 'orders' state which is from API
    // Optimistic UI update
    setOrders(prevOrders => prevOrders.map(order =>
      (order.id === orderId || order._id === orderId) ? { ...order, status: newStatus } : order
    ));

    try {
      // Use globalEndpoints.adminUpdateOrderStatus(orderId)
      await apiGlobal.patch(globalEndpoints.adminUpdateOrderStatus(orderId), { status: newStatus });
      toast.success('وضعیت سفارش با موفقیت بروزرسانی شد');
      // Optionally refetch or update based on response if backend returns updated order
      // fetchAdminOrders(); // To get the absolute latest state including any server-side changes
    } catch (error) {
      toast.error('خطا در بروزرسانی وضعیت سفارش'); // Global interceptor might also show a toast
      setOrders(originalOrders); // Rollback optimistic update
      console.error("Error updating order status:", error);
    }
  };

  // View order details
  const handleViewDetails = async (order) => {
    // For now, using the order data from the list.
    // If more detailed data is needed, an API call to globalEndpoints.adminGetOrderById(order._id) would go here.
    // Example:
    // try {
    //   setShowOrderDetails(true); // Show modal quickly
    //   const response = await apiGlobal.get(globalEndpoints.adminGetOrderById(order._id || order.id));
    //   setSelectedOrder(response.data.order || response.data);
    // } catch(err) { toast.error("خطا در دریافت جزئیات کامل سفارش"); }
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-gray-100">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
        <p className="ml-2">در حال بارگذاری سفارشات...</p>
      </div>
    );
  }
  // Note: No !currentUser check here as ProtectedRoute in app-router.js should handle this.
  // If it were a public page, we'd check.

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3 mb-3 sm:mb-0">
              <ShoppingCart className="w-7 h-7 sm:w-8 sm:h-8 text-primary-500" />
              <h1 className="text-xl sm:text-2xl font-bold">مدیریت سفارشات</h1>
            </div>
            {/* <Button variant="outline" icon={<Download className="w-5 h-5" />}>خروجی اکسل</Button> */}
          </div>

          {/* Stats - Can be re-added if counts are available from API or calculated */}
          {/* ... stats div ... */}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="جستجو شماره سفارش، نام یا تلفن..."
                className="input-sm sm:input-md pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                classNameContainer="w-full"
              />
            </div>
            
            <select
              className="input input-sm sm:input-md"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="فیلتر وضعیت"
            >
              <option value="">همه وضعیت‌ها</option>
              {Object.entries(statusConfig).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>

            {/* Date Range Filter (Simplified - can be expanded with date pickers) */}
            {/* <select className="input input-sm sm:input-md" value={selectedDateRange} onChange={(e) => setSelectedDateRange(e.target.value)}>
              <option value="all">همه زمان‌ها</option>
            </select> */}
          </div>
        </div>

        {/* Orders Table */}
        {loading && paginatedOrders.length === 0 ? (
             <div className="flex items-center justify-center p-10 bg-white rounded-xl shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
             </div>
        ) : !loading && filteredOrders.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm">
            <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">هیچ سفارشی با این مشخصات یافت نشد.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">شماره سفارش</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">مشتری</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاریخ</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">مبلغ کل</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">وضعیت پرداخت</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">وضعیت سفارش</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedOrders.map((order) => {
                    const orderId = order._id || order.id;
                    const statusInfo = statusConfig[order.status] || {label: order.status, color: 'text-gray-500 bg-gray-100', icon: Clock};
                    const IconComp = statusInfo.icon;
                    return (
                      <tr key={orderId} className="hover:bg-gray-50 text-sm">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-gray-900 hover:text-primary-500 cursor-pointer" onClick={() => handleViewDetails(order)}>#{order.orderNumber}</div>
                          <div className="text-xs text-gray-500">{order.items?.length || 0} محصول</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{order.customer?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{order.customer?.phone || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                           {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium">{formatPrice(order.totalAmount)} تومان</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.paymentStatus === 'paid' ? 'پرداخت شده' : 'در انتظار'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-xs rounded-full inline-flex items-center gap-1 ${statusInfo.color}`}>
                            <IconComp className="w-3 h-3" />{statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleViewDetails(order)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md" title="مشاهده جزئیات"><Eye className="w-4 h-4" /></button>
                            <select
                              className="text-xs border rounded px-1.5 py-0.5 bg-white hover:border-gray-400 focus:ring-primary-500 focus:border-primary-500"
                              value={order.status}
                              onChange={(e) => handleStatusUpdate(orderId, e.target.value)}
                              aria-label="تغییر وضعیت سفارش"
                            >
                              {Object.entries(statusConfig).map(([value, config]) => (
                                <option key={value} value={value}>{config.label}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 sm:p-4 border-t">
                <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} size="sm" variant="outline" icon={<ChevronRight className="w-4 h-4"/>}>قبلی</Button>
                <div className="flex items-center gap-1 text-xs">
                  {[...Array(totalPages)].slice(0,5).map((_, i) => ( // Show limited page numbers
                    <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-7 h-7 rounded-md ${currentPage === i + 1 ? 'bg-primary-500 text-white' : 'hover:bg-gray-100'}`}>{i + 1}</button>
                  ))}
                  {totalPages > 5 && <span className="px-1">...</span>}
                </div>
                <Button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} size="sm" variant="outline" icon={<ChevronLeft className="w-4 h-4"/>} iconPosition="right">بعدی</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold">جزئیات سفارش #{selectedOrder.orderNumber}</h2>
                <button onClick={() => { setShowOrderDetails(false); setSelectedOrder(null);}} className="p-2 hover:bg-gray-100 rounded-lg"><XCircle className="w-5 h-5 text-gray-500" /></button>
              </div>
            </div>
            <div className="p-4 sm:p-6 flex-grow overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 text-sm">
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4"><h3 className="font-semibold mb-2 text-xs text-gray-500 uppercase">اطلاعات مشتری</h3><div className="space-y-1"><p><span className="font-medium">نام:</span> {selectedOrder.customer?.name}</p><p><span className="font-medium">تلفن:</span> {selectedOrder.customer?.phone}</p><p><span className="font-medium">ایمیل:</span> {selectedOrder.customer?.email}</p></div></div>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4"><h3 className="font-semibold mb-2 text-xs text-gray-500 uppercase">آدرس ارسال</h3><div className="space-y-1"><p><span className="font-medium">گیرنده:</span> {selectedOrder.address?.receiver}</p><p><span className="font-medium">آدرس:</span> {selectedOrder.address?.province}، {selectedOrder.address?.city}، {selectedOrder.address?.address}</p><p><span className="font-medium">کد پستی:</span> {selectedOrder.address?.postalCode}</p></div></div>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4"><h3 className="font-semibold mb-2 text-xs text-gray-500 uppercase">اطلاعات سفارش</h3><div className="space-y-1"><p><span className="font-medium">تاریخ ثبت:</span> {formatDate(selectedOrder.createdAt)}</p><p><span className="font-medium">روش ارسال:</span> {selectedOrder.shippingMethod}</p>{selectedOrder.trackingCode && (<p><span className="font-medium">کد رهگیری:</span> {selectedOrder.trackingCode}</p>)}</div></div>
              </div>
              <div className="mb-6"><h3 className="font-semibold mb-3 text-sm text-gray-700">محصولات سفارش</h3>
                <div className="border rounded-lg overflow-hidden"><table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr className="text-xs"><th className="px-3 py-2 text-right">محصول</th><th className="px-3 py-2 text-right">قیمت واحد</th><th className="px-3 py-2 text-center">تعداد</th><th className="px-3 py-2 text-left">مجموع</th></tr></thead>
                    <tbody className="divide-y">
                      {selectedOrder.items?.map((item, idx) => (<tr key={idx}><td className="px-3 py-2">{item.product?.name}</td><td className="px-3 py-2">{formatPrice(item.price)} ت</td><td className="px-3 py-2 text-center">{item.quantity}</td><td className="px-3 py-2 font-medium text-left">{formatPrice(item.price * item.quantity)} ت</td></tr>))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold"><tr className="text-sm"><td colSpan="3" className="px-3 py-2 text-left">مجموع کل:</td><td className="px-3 py-2 text-left text-primary-500">{formatPrice(selectedOrder.totalAmount)} ت</td></tr></tfoot>
                </table></div>
              </div>
              {/* Status Timeline could be added here if needed */}
            </div>
            <div className="p-4 sm:p-6 border-t flex justify-end gap-3">
                <Button variant="outline" onClick={() => {setShowOrderDetails(false); setSelectedOrder(null);}}>بستن</Button>
                {/* <Button variant="primary">ارسال پیام به مشتری</Button> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;