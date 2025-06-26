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
// import LoadingSpinner from '@/components/common/LoadingSpinner'; // Will use Loader2
import { Loader2 } from 'lucide-react'; // Added Loader2
import toast from 'react-hot-toast';

// --- Start of API Simulation for admin-product-management.js ---
let mockAllProductsData = [ // Renamed to avoid conflict with 'products' state
    { _id: '1', id: '1', name: 'هدفون بی‌سیم سونی WH-1000XM4 (Sim)', price: 4500000, category: 'electronics', brand: 'Sony', stock: 12, discount: 15, status: 'active', createdAt: '2023-03-15T10:00:00Z', description: 'کیفیت صدای عالی', image: '🎧' },
    { _id: '2', id: '2', name: 'پاوربانک شیائومی 20000mAh (Sim)', price: 890000, category: 'electronics', brand: 'Xiaomi', stock: 45, discount: 0, status: 'active', createdAt: '2023-03-10T10:00:00Z', description: 'ظرفیت بالا', image: '🔋' },
    { _id: '3', id: '3', name: 'کیف دستی چرم طبیعی (Sim)', price: 2300000, category: 'personal', brand: 'No Brand', stock: 8, discount: 25, status: 'active', createdAt: '2023-03-01T10:00:00Z', description: 'چرم اصل', image: '👜' },
    { _id: '4', id: '4', name: 'ساعت هوشمند اپل واچ سری 8 (Sim)', price: 12000000, category: 'electronics', brand: 'Apple', stock: 0, discount: 10, status: 'inactive', createdAt: '2023-02-20T10:00:00Z', description: 'جدیدترین مدل', image: '⌚' },
];

const findProductInMockListLocal = (productId) =>
  mockAllProductsData.findIndex(p => p.id === productId || p._id === productId);

const localEndpoints = {
  getAllProducts: '/api/products',
  createProduct: '/api/products',
  updateProduct: (productId) => `/api/products/${productId}`,
  deleteProduct: (productId) => `/api/products/${productId}`,
};

const localApi = {
  get: async (url) => {
    console.log(`ADMIN SIMULATED API GET: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    if (url === localEndpoints.getAllProducts) {
      return { data: JSON.parse(JSON.stringify(mockAllProductsData)) }; // Return a deep copy
    }
    throw new Error(`Unhandled GET ${url} in admin simulation`);
  },
  post: async (url, data) => {
    console.log(`ADMIN SIMULATED API POST: ${url}`, data);
    await new Promise(resolve => setTimeout(resolve, 300));
    if (url === localEndpoints.createProduct) {
      const newProduct = {
        _id: `prod_${Date.now()}`,
        id: `prod_${Date.now()}`,
        ...data,
        price: parseFloat(data.price) || 0,
        stock: parseInt(data.stock) || 0,
        discount: parseFloat(data.discount) || 0,
        status: (parseInt(data.stock) || 0) > 0 ? 'active' : 'inactive',
        createdAt: new Date().toISOString(),
        image: data.image instanceof File ? URL.createObjectURL(data.image) : (data.image || '🆕'), // Simulate URL for preview
      };
      mockAllProductsData.push(newProduct);
      return { data: JSON.parse(JSON.stringify(newProduct)), message: 'محصول با موفقیت ایجاد شد' };
    }
    throw new Error(`Unhandled POST ${url} in admin simulation`);
  },
  patch: async (url, data) => {
    console.log(`ADMIN SIMULATED API PATCH: ${url}`, data);
    await new Promise(resolve => setTimeout(resolve, 300));
    const productId = url.split('/api/products/')[1];
    if (url.startsWith(localEndpoints.getAllProducts + '/')) { // Check if it's an update product URL
        const productIndex = findProductInMockListLocal(productId);
        if (productIndex > -1) {
            const updatedProduct = {
                ...mockAllProductsData[productIndex],
                ...data,
                price: parseFloat(data.price) || mockAllProductsData[productIndex].price,
                stock: parseInt(data.stock) === undefined ? mockAllProductsData[productIndex].stock : parseInt(data.stock),
                discount: parseFloat(data.discount) === undefined ? mockAllProductsData[productIndex].discount : parseFloat(data.discount),
            };
            if (data.image instanceof File) {
                updatedProduct.image = URL.createObjectURL(data.image); // Update image preview URL
            } // else keep existing image if data.image is not a new file

            mockAllProductsData[productIndex] = updatedProduct;
            return { data: JSON.parse(JSON.stringify(updatedProduct)), message: 'محصول با موفقیت بروزرسانی شد' };
        } else {
            const error = new Error('Simulated API Error');
            error.response = { data: { message: 'محصول برای بروزرسانی یافت نشد' }, status: 404 };
            throw error;
        }
    }
    throw new Error(`Unhandled PATCH ${url} in admin simulation`);
  },
  delete: async (url) => {
    console.log(`ADMIN SIMULATED API DELETE: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    if (url.startsWith(localEndpoints.getAllProducts + '/')) { // Check if it's a delete product URL
        const productId = url.split('/api/products/')[1];
        const productIndex = findProductInMockListLocal(productId);
        if (productIndex > -1) {
            const deletedProduct = mockAllProductsData.splice(productIndex, 1);
            return { data: JSON.parse(JSON.stringify(deletedProduct[0])), message: 'محصول با موفقیت حذف شد' };
        } else {
            const error = new Error('Simulated API Error');
            error.response = { data: { message: 'محصول برای حذف یافت نشد' }, status: 404 };
            throw error;
        }
    }
    throw new Error(`Unhandled DELETE ${url} in admin simulation`);
  }
};
// --- End of API Simulation ---


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
      const response = await localApi.get(localEndpoints.getAllProducts);
      setProducts(response.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("خطا در دریافت لیست محصولات");
      setProducts([]); // Set to empty array on error
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
        // Update product
        await localApi.patch(localEndpoints.updateProduct(selectedProduct.id || selectedProduct._id), productData);
        toast.success('محصول با موفقیت ویرایش شد');
      } else {
        // Add new product
        await localApi.post(localEndpoints.createProduct, productData);
        toast.success('محصول با موفقیت اضافه شد');
      }
      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      fetchProducts(); // Refetch products to update the list
    } catch (error) {
      console.error("Error submitting product:", error);
      toast.error(error.response?.data?.message || "خطا در ثبت محصول");
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
      setIsSubmitting(true); // Can use a general loading or specific delete loading state
      try {
        await localApi.delete(localEndpoints.deleteProduct(id));
        toast.success('محصول با موفقیت حذف شد');
        fetchProducts(); // Refetch products
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error(error.response?.data?.message || "خطا در حذف محصول");
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