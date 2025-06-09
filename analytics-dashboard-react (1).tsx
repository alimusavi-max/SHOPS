import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Eye,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import _ from 'lodash';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [analytics, setAnalytics] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - در واقعیت از API می‌آید
  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAnalytics({
        totals: {
          revenue: 125000000,
          orders: 342,
          customers: 1256,
          products: 2145
        },
        growth: {
          revenue: 12.5,
          orders: 8.3,
          customers: 15.2,
          products: -2.4
        },
        chart: {
          labels: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'],
          revenue: [15000000, 18000000, 16000000, 22000000, 19000000, 21000000, 14000000],
          orders: [45, 52, 48, 61, 55, 58, 41]
        },
        topProducts: [
          { product: { name: 'هدفون سونی', price: 4500000 }, quantity: 45, revenue: 202500000 },
          { product: { name: 'پاوربانک شیائومی', price: 890000 }, quantity: 123, revenue: 109470000 },
          { product: { name: 'کیف چرم', price: 2300000 }, quantity: 34, revenue: 78200000 },
          { product: { name: 'ساعت هوشمند', price: 12000000 }, quantity: 12, revenue: 144000000 },
          { product: { name: 'عینک آفتابی', price: 3200000 }, quantity: 28, revenue: 89600000 }
        ],
        realTimeStats: {
          activeUsers: 234,
          todayOrders: 45,
          todayRevenue: 18500000
        },
        categoryDistribution: [
          { name: 'لوازم برقی', value: 45, color: '#f97316' },
          { name: 'وسایل شخصی', value: 28, color: '#3b82f6' },
          { name: 'لوازم منزل', value: 15, color: '#10b981' },
          { name: 'ورزش و سفر', value: 12, color: '#8b5cf6' }
        ],
        hourlyActivity: [
          { hour: '00', orders: 2, views: 45 },
          { hour: '02', orders: 1, views: 23 },
          { hour: '04', orders: 0, views: 12 },
          { hour: '06', orders: 3, views: 67 },
          { hour: '08', orders: 8, views: 234 },
          { hour: '10', orders: 15, views: 456 },
          { hour: '12', orders: 22, views: 678 },
          { hour: '14', orders: 18, views: 543 },
          { hour: '16', orders: 25, views: 789 },
          { hour: '18', orders: 28, views: 912 },
          { hour: '20', orders: 19, views: 654 },
          { hour: '22', orders: 12, views: 432 }
        ],
        conversionFunnel: [
          { stage: 'بازدید', value: 10000, fill: '#f59e0b' },
          { stage: 'مشاهده محصول', value: 6500, fill: '#f97316' },
          { stage: 'افزودن به سبد', value: 2800, fill: '#ef4444' },
          { stage: 'تکمیل خرید', value: 850, fill: '#dc2626' }
        ]
      });
      setLoading(false);
    }, 1000);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics().then(() => {
      setRefreshing(false);
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const exportData = () => {
    // Export analytics data
    console.log('Exporting analytics data...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, growth, color, prefix = '', suffix = '' }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Icon className="w-5 h-5" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {prefix}{formatPrice(value)}{suffix}
          </div>
          {growth !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {growth >= 0 ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span className="font-medium">{Math.abs(growth)}%</span>
              <span className="text-gray-500">نسبت به دوره قبل</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">داشبورد آ