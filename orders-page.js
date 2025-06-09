import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  Truck,
  CreditCard,
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  
  // Mock data
  useEffect(() => {
    const mockOrders = [
      {
        id: 1001,
        orderNumber: 'ORD-1001',
        date: '1402/10/15',
        status: 'delivered',
        totalAmount: 4825000,
        itemsCount: 3,
        paymentMethod: 'online',
        shippingMethod: 'express',
        trackingCode: 'TRK123456789',
        items: [
          { id: 1, name: 'هدفون بی‌سیم سونی WH-1000XM4', price: 3825000, quantity: 1, image: '🎧' },
          { id: 2, name: 'کاور محافظ', price: 150000, quantity: 1, image: '📱' },
          { id: 3, name: 'کابل شارژ USB-C', price: 85000, quantity: 2, image: '🔌' }
        ],
        address: 'تهران، خیابان ولیعصر، پلاک 123',
        deliveryDate: '1402/10/18'
      },
      {
        id: 1002,
        orderNumber: 'ORD-1002',
        date: '1402/10/20',
        status: 'processing',
        totalAmount: 2300000,
        itemsCount: 1,
        paymentMethod: 'cash',
        shippingMethod: 'normal',
        items: [
          { id: 1, name: 'کیف دستی چرم طبیعی', price: 2300000, quantity: 1, image: '👜' }
        ],
        address: 'تهران، خیابان شریعتی، پلاک 456'
      },
      {
        id: 1003,
        orderNumber: 'ORD-1003',
        date: '1402/10/25',
        status: 'pending',
        totalAmount: 890000,
        itemsCount: 2,
        paymentMethod: 'online',
        shippingMethod: 'normal',
        items: [
          { id: 1, name: 'پاوربانک شیائومی 20000mAh', price: 890000, quantity: 1, image: '🔋' }
        ],
        address: 'اصفهان، خیابان چهارباغ، پلاک 789'
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
    // Apply status filter
    if (filter !== 'all' && order.status !== filter) return false;
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.items.some(item => item.name.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  const handleCancelOrder = (orderId) => {
    if (window.confirm('آیا از لغو این سفارش اطمینان دارید؟')) {
      // API call to cancel order
      toast.success('سفارش با موفقیت لغو شد');
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: 'cancelled' } : order
      ));
    }
  };
  
  const handleDownloadInvoice = (