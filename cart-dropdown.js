import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Transition } from '@headlessui/react';
import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import useCartStore from '@/store/cartStore';

const CartDropdown = () => {
  const { 
    items, 
    isOpen, 
    closeCart, 
    removeItem, 
    updateQuantity,
    getTotalPrice,
    getItemsCount 
  } = useCartStore();
  
  const totalPrice = getTotalPrice();
  const itemsCount = getItemsCount();
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };
  
  return (
    <Transition show={isOpen} as={Fragment}>
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeCart} />
        </Transition.Child>
        
        {/* Cart Panel */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="ease-in duration-200"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <div className="fixed left-0 top-0 h-full w-full sm:w-96 bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  سبد خرید ({itemsCount} کالا)
                </h2>
                <button
                  onClick={closeCart}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4">
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">سبد خرید شما خالی است</p>
                    <Link
                      to="/products"
                      onClick={closeCart}
                      className="btn btn-primary"
                    >
                      شروع خرید
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.product.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex gap-3">
                          {/* Product Image */}
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-3xl">{item.product.image}</span>
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1">
                            <h3 className="font-medium text-sm mb-1 line-clamp-2">
                              {item.product.name}
                            </h3>
                            
                            {/* Price */}
                            <div className="mb-2">
                              {item.product.discount ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-primary-500 font-semibold">
                                    {formatPrice(
                                      item.product.price * (1 - item.product.discount / 100)
                                    )} تومان
                                  </span>
                                  <span className="text-xs text-gray-400 line-through">
                                    {formatPrice(item.product.price)}
                                  </span>
                                  <span className="badge badge-danger text-xs">
                                    {item.product.discount}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-800 font-semibold">
                                  {formatPrice(item.product.price)} تومان
                                </span>
                              )}
                            </div>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                              
                              <button
                                onClick={() => removeItem(item.product.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t p-4 space-y-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>جمع کل:</span>
                    <span className="text-primary-500">{formatPrice(totalPrice)} تومان</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/cart"
                      onClick={closeCart}
                      className="btn btn-secondary text-center"
                    >
                      مشاهده سبد خرید
                    </Link>
                    <Link
                      to="/checkout"
                      onClick={closeCart}
                      className="btn btn-primary text-center"
                    >
                      تسویه حساب
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Transition.Child>
      </div>
    </Transition>
  );
};

export default CartDropdown;