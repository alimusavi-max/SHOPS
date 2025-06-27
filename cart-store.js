import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiGlobal, { endpoints as globalEndpoints } from '@/services/api'; // Use global api instance
import toast from 'react-hot-toast';

// Removed local API simulation and local endpoints object.
// The mockAllProducts data, if needed for frontend display before API connection,
// would typically be handled by individual page components' local simulations or fallbacks.
// For cart, we will always assume backend is the source of truth once connected.

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isOpen: false,
      // Derived state, not directly stored if API is source of truth for items
      // totalItems: 0,
      // totalPrice: 0,
      
      // Action to fetch the cart from the server
      fetchCart: async () => {
        set({ isLoading: true });
        try {
          const response = await apiGlobal.get(globalEndpoints.cart);
          // Backend response: { success: true, data: { cart: { items, totalItems, totalPrice, ... } } }
          // Interceptor returns response.data, so response here is { cart: { ... } }
          const cartData = response.cart;
          if (cartData) {
            set({
              items: cartData.items || [],
              // Stored totals are part of cartData if backend sends them,
              // otherwise selectors will calculate from items.
              // Let's assume backend sends cart object matching our model,
              // which includes totalItems and totalPrice.
              isLoading: false
            });
          } else {
             // Handle cases where cart might be null (e.g., for a new user before any cart interaction)
            set({ items: [], isLoading: false });
          }
        } catch (error) {
          console.error('Failed to fetch cart:', error);
          // Toast for error is likely handled by global interceptor
          set({ isLoading: false, items: [] }); // Reset cart on error
        }
      },

      // Get cart items count - calculated from state.items
      getItemsCount: () => {
        const items = get().items;
        return items.reduce((total, item) => total + item.quantity, 0);
      },
      
      // Get cart total price
      getTotalPrice: () => {
        const items = get().items;
        return items.reduce((total, item) => {
          const price = item.product.discount 
            ? item.product.price * (1 - item.product.discount / 100)
            : item.product.price;
          return total + (price * item.quantity);
        }, 0);
      },
      
      // Get cart subtotal (without discount)
      getSubtotal: () => {
        const items = get().items;
        return items.reduce((total, item) => {
          return total + (item.product.price * item.quantity);
        }, 0);
      },
      
      // Get total discount amount
      getTotalDiscount: () => {
        const items = get().items;
        return items.reduce((total, item) => {
          if (item.product.discount) {
            const discountAmount = item.product.price * (item.product.discount / 100);
            return total + (discountAmount * item.quantity);
          }
          return total;
        }, 0);
      },
      
      // Add item to cart
      addItem: async (product, quantity = 1) => {
        set({ isLoading: true });
        const originalItems = get().items; // For potential rollback on error
        
        // Optimistic update (optional, but can make UI feel faster)
        // For simplicity with simulated API, we can also choose to wait for API response first.
        // Here, we'll try updating based on API response directly.

        try {
          // Backend expects { productId, quantity }
          // Product details for denormalization are handled by backend controller
          const response = await apiGlobal.post(globalEndpoints.addToCart, {
            productId: product.id || product._id,
            quantity,
            // No need to send full product object to actual backend for this endpoint
          });
          // Backend response.data.cart should contain the updated cart
          const cartData = response.cart;
          if (cartData) {
            set({ items: cartData.items || [], isLoading: false });
          } else {
            // Fallback or error if cart data is not as expected
            set({ isLoading: false }); // Keep original items if response is malformed
            throw new Error("پاسخ نامعتبر از سرور پس از افزودن به سبد");
          }
          toast.success('محصول به سبد خرید اضافه شد');
        } catch (error) {
          console.error('Error adding item to cart:', error);
          // Global interceptor will show toast. We just roll back state.
          set({ items: originalItems, isLoading: false }); // Rollback on error
        }
      },
      
      // Remove item from cart
      removeItem: async (productId) => {
        set({ isLoading: true });
        const originalItems = get().items;
        try {
          const response = await apiGlobal.delete(globalEndpoints.removeFromCart(productId));
          // Backend response.data.cart should contain the updated cart
          const cartData = response.cart;
           if (cartData) {
            set({ items: cartData.items || [], isLoading: false });
          } else {
            set({ isLoading: false });
            throw new Error("پاسخ نامعتبر از سرور پس از حذف از سبد");
          }
          toast.success('محصول از سبد خرید حذف شد');
        } catch (error) {
          console.error('Error removing item from cart:', error);
          set({ items: originalItems, isLoading: false });
        }
      },
      
      // Update item quantity
      updateQuantity: async (productId, quantity) => {
        if (quantity <= 0) {
          // If quantity is 0 or less, treat as remove
          return get().removeItem(productId);
        }
        set({ isLoading: true });
        const originalItems = get().items;
        try {
          const response = await apiGlobal.put(globalEndpoints.updateCartItem(productId), { quantity });
          // Backend response.data.cart should contain the updated cart
          const cartData = response.cart;
          if (cartData) {
            set({ items: cartData.items || [], isLoading: false });
          } else {
            set({ isLoading: false });
            throw new Error("پاسخ نامعتبر از سرور پس از بروزرسانی تعداد");
          }
          // toast.success('تعداد محصول بروزرسانی شد'); // Optional: can be too noisy
        } catch (error) {
          console.error('Error updating cart item quantity:', error);
          set({ items: originalItems, isLoading: false });
        }
      },
      
      // Clear cart
      clearCart: async () => {
        set({ isLoading: true });
        const originalItems = get().items;
        try {
          const response = await apiGlobal.delete(globalEndpoints.clearCart);
          // Backend response.data.cart should be an empty or null cart
          const cartData = response.cart;
          if (cartData) { // Even if items is empty, cart object itself might be returned
            set({ items: cartData.items || [], isLoading: false });
          } else {
             set({ items: [], isLoading: false }); // Default to empty if no cart data
          }
          toast.success('سبد خرید خالی شد');
        } catch (error) {
          console.error('Error clearing cart:', error);
          set({ items: originalItems, isLoading: false });
        }
      },
      
      // Toggle cart dropdown
      toggleCart: () => {
        set(state => ({ isOpen: !state.isOpen }));
      },
      
      // Open cart
      openCart: () => {
        set({ isOpen: true });
      },
      
      // Close cart
      closeCart: () => {
        set({ isOpen: false });
      },
      
      // Sync cart with server (client items take precedence for simplicity)
      syncCart: async (itemsToSync) => {
        // itemsToSync should be an array of { productId, quantity }
        if (!Array.isArray(itemsToSync)) {
          console.error('syncCart: itemsToSync must be an array');
          return { success: false, error: 'Invalid items format for sync.' };
        }
        set({ isLoading: true });
        try {
          const response = await apiGlobal.post(globalEndpoints.syncCart, { items: itemsToSync });
          const cartData = response.cart;
          if (cartData) {
            set({ items: cartData.items || [], isLoading: false });
          } else {
            set({ isLoading: false });
            throw new Error("پاسخ نامعتبر از سرور پس از همگام‌سازی سبد");
          }
          toast.success('سبد خرید با سرور همگام‌سازی شد.');
          return { success: true, cart: cartData };
        } catch (error) {
          console.error('Error syncing cart:', error);
          set({ isLoading: false }); // Ensure loading is false on error
          // Toast is likely handled by global interceptor
          return { success: false, error: error.response?.data?.message || 'خطا در همگام‌سازی سبد خرید' };
        }
      },
      
      // Check if product is in cart
      isInCart: (productId) => {
        const items = get().items;
        return items.some(item => item.product.id === productId);
      },
      
      // Get item quantity in cart
      getItemQuantity: (productId) => {
        const items = get().items;
        const item = items.find(item => item.product.id === productId);
        return item ? item.quantity : 0;
      },

      // Create Order action
      createOrder: async (orderDetails) => {
        set({ isLoading: true }); // Or a more specific isOrderProcessing state
        try {
          const response = await apiGlobal.post(globalEndpoints.createOrder, orderDetails);
          // Backend response: { success: true, message: '...', data: { order: { ... } } }
          // Interceptor returns response.data, so response here is { order: { ... } }

          // After successful order, the cart should be cleared on the server and client.
          // Calling clearCart action which itself makes an API call.
          await get().clearCart();
          // Note: clearCart sets its own isLoading. If createOrder's isLoading should persist
          // until clearCart is also done, this needs careful state management.
          // For now, we assume clearCart's loading is separate or quick.

          toast.success(response.message || 'سفارش شما با موفقیت ثبت شد!');
          set({ isLoading: false }); // Explicitly set isLoading for createOrder to false
          return { success: true, order: response.order };
        } catch (error) {
          console.error('Error creating order:', error);
          // Global interceptor handles toast for most API errors.
          set({ isLoading: false });
          return { success: false, error: error.response?.data?.message || 'خطا در ثبت سفارش' };
        }
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useCartStore;