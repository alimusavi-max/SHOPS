import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Eye } from 'lucide-react';
import useCartStore from '@/store/cartStore';
import toast from 'react-hot-toast';

const ProductCard = ({ product, isNew = false }) => {
  const addItem = useCartStore(state => state.addItem);
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };
  
  const calculateDiscountedPrice = (price, discount) => {
    return price - (price * discount / 100);
  };
  
  const handleAddToCart = (e) => {
    e.preventDefault();
    addItem(product);
  };
  
  const handleAddToWishlist = (e) => {
    e.preventDefault();
    toast.success('به لیست علاقه‌مندی‌ها اضافه شد');
  };
  
  return (
    <div className="card group relative h-full flex flex-col">
      {/* Badges */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        {product.discount > 0 && (
          <span className="badge badge-danger">
            {product.discount}% تخفیف
          </span>
        )}
        {isNew && (
          <span className="badge badge-primary">
            جدید
          </span>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleAddToWishlist}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors"
        >
          <Heart className="w-4 h-4 text-gray-600" />
        </button>
        <Link
          to={`/products/${product.id}`}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors"
        >
          <Eye className="w-4 h-4 text-gray-600" />
        </Link>
      </div>
      
      {/* Product Image */}
      <Link to={`/products/${product.id}`} className="block relative overflow-hidden aspect-product bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <span className="text-6xl group-hover:scale-110 transition-transform duration-300">
            {product.image}
          </span>
        </div>
      </Link>
      
      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Category */}
        <span className="text-xs text-gray-500 mb-1">
          {product.category === 'electronics' ? 'لوازم برقی' : 'وسایل شخصی'}
        </span>
        
        {/* Title */}
        <Link to={`/products/${product.id}`}>
          <h3 className="font-medium text-gray-800 mb-2 line-clamp-2 hover:text-primary-500 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`} 
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">({product.rating})</span>
        </div>
        
        {/* Price */}
        <div className="mt-auto">
          {product.discount > 0 ? (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-bold text-primary-500">
                {formatPrice(calculateDiscountedPrice(product.price, product.discount))} تومان
              </span>
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
            </div>
          ) : (
            <p className="text-lg font-bold text-gray-800 mb-3">
              {formatPrice(product.price)} تومان
            </p>
          )}
          
          {/* Add to Cart Button */}
          <button 
            onClick={handleAddToCart}
            className="w-full btn btn-primary btn-sm group"
          >
            <ShoppingCart className="w-4 h-4 ml-2 group-hover:animate-bounce" />
            افزودن به سبد
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;