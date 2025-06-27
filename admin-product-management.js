import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  UploadCloud,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
// import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiGlobal, { endpoints as globalEndpoints } from '@/services/api'; // Use global api instance

// --- Removed local API Simulation (mockAllProductsData, localEndpoints, localApi) ---

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true); // For table data loading
  const [isSubmitting, setIsSubmitting] = useState(false); // For modal form submission
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const itemsPerPage = 10;

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: '', price: '', discount: '', category: '', description: '', stock: '', brand: '', image: null
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Use globalEndpoints.products for GET all
      const response = await apiGlobal.get(globalEndpoints.products);
      // Backend response for GET /api/products is { status, results, totalPages, currentPage, data: { products: [] } }
      setProducts(response.data?.products || response.data || []); // Adjust based on actual structure from interceptor
    } catch (error) {
      console.error("Failed to fetch products:", error);
      // Toast is handled by global interceptor
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []); // Runs once on mount

  const categories = [
    { value: '', label: 'همه دسته‌ها' },
    { value: 'electronics', label: 'لوازم برقی' },
    { value: 'personal', label: 'وسایل شخصی' },
    { value: 'home', label: 'لوازم منزل' },
    { value: 'sports', label: 'ورزش و سفر' }
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Basic client-side validation (can be enhanced)
    if (!formData.name || !formData.price || !formData.category || !formData.stock || !formData.brand) {
        toast.error("لطفا تمامی فیلدهای ستاره‌دار را پر کنید.");
        setIsSubmitting(false);
        return;
    }

    const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        discount: parseFloat(formData.discount) || 0,
        // image: formData.image // File object is already in formData.image
    };

    try {
      if (showEditModal && selectedProduct) {
        // Update product - use globalEndpoints.productById for PATCH URL
        await apiGlobal.patch(globalEndpoints.productById(selectedProduct.id || selectedProduct._id), productData);
        toast.success('محصول با موفقیت ویرایش شد');
      } else {
        // Add new product - use globalEndpoints.products for POST URL
        await apiGlobal.post(globalEndpoints.products, productData);
        toast.success('محصول با موفقیت اضافه شد');
      }
      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      fetchProducts(); // Refetch products to update the list
    } catch (error) {
      console.error("Error submitting product:", error);
      // Toast likely handled by interceptor, but can add specific one if needed
      // toast.error(error.response?.data?.message || "خطا در ثبت محصول");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      discount: '',
      category: '',
      description: '',
      stock: '',
      brand: '',
      image: null
    });
    setImagePreview(null);
    setSelectedProduct(null);
  };

  // Handle edit
  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      discount: product.discount.toString(),
      category: product.category,
      description: product.description || '',
      stock: product.stock.toString(),
      brand: product.brand,
      image: null
    });
    setShowEditModal(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('آیا از حذف این محصول اطمینان دارید؟')) {
      setIsSubmitting(true);
      try {
        await apiGlobal.delete(globalEndpoints.productById(id));
        toast.success('محصول با موفقیت حذف شد');
        fetchProducts(); // Refetch products
      } catch (error) {
        console.error("Error deleting product:", error);
        // Toast likely handled by interceptor
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setFormData({ ...formData, image: file });
    }
  };

  if (loading) { // This is for the initial table data loading
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
        <p className="ml-2">در حال بارگذاری محصولات...</p>
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
              <Package className="w-8 h-8 text-primary-500" />
              <h1 className="text-2xl font-bold">مدیریت محصولات</h1>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
              icon={<Plus className="w-5 h-5" />}
            >
              افزودن محصول جدید
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="جستجو در محصولات..."
                className="input pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select
              className="input"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                تعداد: {filteredProducts.length} محصول
              </span>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تصویر</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نام محصول</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">دسته‌بندی</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">قیمت</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تخفیف</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">موجودی</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">وضعیت</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.brand}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {categories.find(c => c.value === product.category)?.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatPrice(product.price)} تومان
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.discount > 0 ? (
                        <span className="badge badge-danger">{product.discount}%</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status === 'active' ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/products/${product.id}`}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">
                {showEditModal ? 'ویرایش محصول' : 'افزودن محصول جدید'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="نام محصول"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
                
                <Input
                  label="برند"
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  required
                />
                
                <Input
                  label="قیمت (تومان)"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                />
                
                <Input
                  label="تخفیف (%)"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={(e) => setFormData({...formData, discount: e.target.value})}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    دسته‌بندی <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="">انتخاب کنید</option>
                    {categories.slice(1).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
                <Input
                  label="موجودی"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  required
                />
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    توضیحات
                  </label>
                  <textarea
                    rows="3"
                    className="input"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تصویر محصول
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="max-w-xs max-h-48 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData({...formData, image: null});
                          }}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          تصویر محصول را انتخاب کنید
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="btn btn-outline btn-sm cursor-pointer"
                        >
                          انتخاب تصویر
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    showAddModal ? setShowAddModal(false) : setShowEditModal(false);
                    resetForm();
                  }}
                >
                  انصراف
                </Button>
                <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
                  {isSubmitting ? (showEditModal ? 'در حال ذخیره...' : 'در حال افزودن...') : (showEditModal ? 'ذخیره تغییرات' : 'افزودن محصول')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;