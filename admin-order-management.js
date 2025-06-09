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
import LoadingSpinner from '@/components/common/LoadingSpinner';
import toast from 'react-hot-toast';

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

  // Mock data
  useEffect(() => {
    const mockOrders = [
      {
        id: 1001,
        orderNumber: 'ORD-1001',
        customer: {
          name: 'علی احمدی',
          phone: '09123456789',
          email: 'ali@example.com'
        },
        date: '1402/10/15',
        status: 'delivered',
        totalAmount: 4825000,
        itemsCount: 3,
        paymentMethod: 'online',
        paymentStatus: 'paid',
        shippingMethod: 'express',
        trackingCode: 'TRK123456789',
        items: [
          { id: 1, name: 'هدفون بی‌سیم سونی WH-1000XM4', price: 3825000, quantity: 1 },
          { id: 2, name: 'کاور محافظ', price: 150000, quantity: 1 },
          { id: 3, name: 'کابل شارژ USB-C', price: 85000, quantity: 2 }
        ],
        address: {
          receiver: 'علی احمدی',
          phone: '09123456789',
          province: 'تهران',
          city: 'تهران',
          address: 'خیابان ولیعصر، پلاک 123',
          postalCode: '1234567890'
        },
        deliveryDate: '1402/10/18'
      },
      {
        id: 1002,
        orderNumber: 'ORD-1002',
        customer: {
          name: 'سارا محمدی',
          phone: '09198765432',
          email: 'sara@example.com'
        },
        date: '1402/10/16',
        status: 'processing',
        totalAmount: 2300000,
        itemsCount: 1,
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        shippingMethod: 'normal',
        items: [
          { id: 1, name: 'کیف دستی چرم طبیعی', price: 2300000, quantity: 1 }
        ],
        address: {
          receiver: 'سارا محمدی',
          phone: '09198765432',
          province: 'تهران',
          city: 'تهران',
          address: 'خیابان شریعتی، پلاک 456',
          postalCode: '9876543210'
        }
      },
      {
        id: 1003,
        orderNumber: 'ORD-1003',
        customer: {
          name: 'محمد رضایی',
          phone: '09351234567',
          email: 'mohammad@example.com'
        },
        date: '1402/10/17',
        status: 'pending',
        totalAmount: 890000,
        itemsCount: 1,
        paymentMethod: 'online',
        paymentStatus: 'pending',
        shippingMethod: 'normal',
        items: [
          { id: 1, name: 'پاوربانک شیائومی 20000mAh', price: 890000, quantity: 1 }
        ],
        address: {
          receiver: 'محمد رضایی',
          phone: '09351234567',
          province: 'اصفهان',
          city: 'اصفهان',
          address: 'خیابان چهارباغ، پلاک 789',
          postalCode: '1357924680'
        }
      },
      {
        id: 1004,
        orderNumber: 'ORD-1004',
        customer: {
          name: 'زهرا کریمی',
          phone: '09217654321',
          email: 'zahra@example.com'
        },
        date: '1402/10/18',
        status: 'shipped',
        totalAmount: 5600000,
        itemsCount: 2,
        paymentMethod: 'online',
        paymentStatus: 'paid',
        shippingMethod: 'express',
        trackingCode: 'TRK987654321',
        items: [
          { id: 1, name: 'تبلت سامسونگ', price: 4500000, quantity: 1 },
          { id: 2, name: 'قاب محافظ تبلت', price: 1100000, quantity: 1 }
        ],
        address: {
          receiver: 'زهرا کریمی',
          phone: '09217654321',
          province: 'فارس',
          city: 'شیراز',
          address: 'بلوار چمران، پلاک 321',
          postalCode: '2468135790'
        }
      }
    ];
    
    setTimeout(() => {
      setOrders(mockOrders);
      setLoading(false);
    }, 1000);
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

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.phone.includes(searchQuery);
    
    const matchesStatus = !selectedStatus || order.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  // Handle status update
  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    toast.success('وضعیت سفارش بروزرسانی شد');
  };

  // View order details
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-primary-500" />
              <h1 className="text-2xl font-bold">مدیریت سفارشات</h1>
            </div>
            <Button
              variant="outline"
              icon={<Download className="w-5 h-5" />}
            >
              خروجی اکسل
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = orders.filter(o => o.status === status).length;
              return (
                <div key={status} className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className={`inline-flex p-2 rounded-lg mb-2 ${config.color}`}>
                    <config.icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-gray-600">{config.label}</div>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="جستجو شماره سفارش، نام یا تلفن..."
                className="input pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select
              className="input"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">همه وضعیت‌ها</option>
              {Object.entries(statusConfig).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>

            <select
              className="input"
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
            >
              <option value="all">همه زمان‌ها</option>
              <option value="today">امروز</option>
              <option value="week">هفته گذشته</option>
              <option value="month">ماه گذشته</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">شماره سفارش</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">مشتری</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاریخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">مبلغ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">پرداخت</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">وضعیت</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedOrders.map((order) => {
                  const statusInfo = statusConfig[order.status];
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">#{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">{order.itemsCount} محصول</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{order.customer.name}</div>
                            <div className="text-sm text-gray-500">{order.customer.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {order.date}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{formatPrice(order.totalAmount)} تومان</div>
                        <div className="text-sm text-gray-500">
                          {order.paymentMethod === 'online' ? 'آنلاین' : 'نقدی'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          order.paymentStatus === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.paymentStatus === 'paid' ? 'پرداخت شده' : 'در انتظار'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <statusInfo.icon className="w-4 h-4" />
                          <span className={`px-2 py-1 text-xs rounded-full ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(order)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <select
                            className="text-sm border rounded px-2 py-1"
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-3 py-1 border rounded-lg disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
                قبلی
              </button>
              
              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg ${
                      currentPage === i + 1 
                        ? 'bg-primary-500 text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-3 py-1 border rounded-lg disabled:opacity-50"
              >
                بعدی
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">جزئیات سفارش #{selectedOrder.orderNumber}</h2>
                <button
                  onClick={() => {
                    setShowOrderDetails(false);
                    setSelectedOrder(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary-500" />
                    اطلاعات مشتری
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">نام:</span> {selectedOrder.customer.name}</p>
                    <p><span className="font-medium">تلفن:</span> {selectedOrder.customer.phone}</p>
                    <p><span className="font-medium">ایمیل:</span> {selectedOrder.customer.email}</p>
                  </div>
                </div>
                
                {/* Shipping Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-500" />
                    آدرس ارسال
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">گیرنده:</span> {selectedOrder.address.receiver}</p>
                    <p><span className="font-medium">تلفن:</span> {selectedOrder.address.phone}</p>
                    <p><span className="font-medium">آدرس:</span> {selectedOrder.address.province}، {selectedOrder.address.city}، {selectedOrder.address.address}</p>
                    <p><span className="font-medium">کد پستی:</span> {selectedOrder.address.postalCode}</p>
                  </div>
                </div>
                
                {/* Order Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary-500" />
                    اطلاعات سفارش
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">تاریخ ثبت:</span> {selectedOrder.date}</p>
                    <p><span className="font-medium">روش ارسال:</span> {selectedOrder.shippingMethod === 'express' ? 'پیشتاز' : 'معمولی'}</p>
                    {selectedOrder.trackingCode && (
                      <p><span className="font-medium">کد رهگیری:</span> {selectedOrder.trackingCode}</p>
                    )}
                    {selectedOrder.deliveryDate && (
                      <p><span className="font-medium">تاریخ تحویل:</span> {selectedOrder.deliveryDate}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">محصولات سفارش</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-sm">محصول</th>
                        <th className="px-4 py-3 text-right text-sm">قیمت واحد</th>
                        <th className="px-4 py-3 text-right text-sm">تعداد</th>
                        <th className="px-4 py-3 text-right text-sm">مجموع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">{item.name}</td>
                          <td className="px-4 py-3">{formatPrice(item.price)} تومان</td>
                          <td className="px-4 py-3">{item.quantity}</td>
                          <td className="px-4 py-3 font-medium">
                            {formatPrice(item.price * item.quantity)} تومان
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-left font-semibold">
                          مجموع کل:
                        </td>
                        <td className="px-4 py-3 font-bold text-primary-500">
                          {formatPrice(selectedOrder.totalAmount)} تومان
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              
              {/* Status Timeline */}
              <div>
                <h3 className="font-semibold mb-3">وضعیت سفارش</h3>
                <div className="flex items-center gap-4">
                  {['pending', 'processing', 'shipped', 'delivered'].map((status, index) => {
                    const isActive = ['pending', 'processing', 'shipped', 'delivered'].indexOf(selectedOrder.status) >= index;
                    const StatusIcon = statusConfig[status].icon;
                    return (
                      <div key={status} className="flex-1">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isActive ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
                          }`}>
                            <StatusIcon className="w-5 h-5" />
                          </div>
                          {index < 3 && (
                            <div className={`flex-1 h-1 ${
                              isActive ? 'bg-primary-500' : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                        <p className="text-xs mt-2 text-center">
                          {statusConfig[status].label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline">
                  چاپ فاکتور
                </Button>
                <Button variant="primary">
                  ارسال پیام به مشتری
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;