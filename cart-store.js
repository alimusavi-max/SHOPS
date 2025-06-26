import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// import api, { endpoints } from '@/services/api'; // Original import, replaced with simulation
import toast from 'react-hot-toast';

// --- Start of API Simulation for cart-store.js ---
let simulatedServerCart = {
  // Structure that might be returned by GET /api/cart
  // Example: { id: 'cart123', userId: 'user123', items: [], totalPrice: 0, totalItems: 0, ... }
  // For simplicity, our simulated GET /api/cart will just return items array.
  // And other operations will return the modified items array.
  items: [],
};

const findProductInCart = (productId) =>
  simulatedServerCart.items.findIndex(item => item.product.id === productId || item.product._id === productId);

const calculateCartTotals = (cartItems) => {
  let totalItems = 0;
  let totalPrice = 0;
  cartItems.forEach(item => {
    totalItems += item.quantity;
    const price = item.product.discount
      ? item.product.price * (1 - item.product.discount / 100)
      : item.product.price;
    totalPrice += price * item.quantity;
  });
  return { totalItems, totalPrice, items: cartItems }; // Return structure similar to a full cart object
};

const endpoints = {
  cart: '/api/cart',
  addToCart: '/api/cart/add',
  updateCartItem: (productId) => `/api/cart/item/${productId}`,
  removeFromCart: (productId) => `/api/cart/item/${productId}`,
  clearCart: '/api/cart/clear',
  createOrder: '/api/orders', // Added for order creation
  // syncCart: '/api/cart/sync',
};

const api = {
  get: async (url) => {
    console.log(`SIMULATED API GET: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    if (url === endpoints.cart) {
      return { data: calculateCartTotals(simulatedServerCart.items) }; // Return items and totals
    }
    throw new Error(`Unhandled GET ${url}`);
  },
  post: async (url, data) => {
    console.log(`SIMULATED API POST: ${url}`, data);
    await new Promise(resolve => setTimeout(resolve, 300));
    if (url === endpoints.addToCart) {
      const { productId, quantity, product } = data; // Assuming product object is passed for simulation ease
      const existingItemIndex = findProductInCart(productId);
      if (existingItemIndex > -1) {
        simulatedServerCart.items[existingItemIndex].quantity += quantity;
      } else {
        // If product details aren't passed with productId/quantity, we'd need a mock product lookup here
        simulatedServerCart.items.push({ product: product || {id: productId, name: 'Mocked Product', price: 100, discount: 0}, quantity });
      }
      return { data: calculateCartTotals(simulatedServerCart.items) };
    }
    if (url === endpoints.createOrder) {
      // Simulate order creation
      const { items, shippingAddress, totalAmount } = data; // Assuming this payload
      console.log('Simulating order creation with:', data);
      const mockOrderId = `mockOrder_${Date.now()}`;
      // In a real scenario, items in simulatedServerCart might be cleared or marked as ordered.
      // For now, just return a success response.
      return {
        data: {
          success: true,
          message: 'سفارش شما با موفقیت ثبت شد.',
          order: {
            id: mockOrderId,
            orderNumber: mockOrderId,
            items,
            shippingAddress,
            totalAmount,
            status: 'processing'
          }
        }
      };
    }
    throw new Error(`Unhandled POST ${url}`);
  },
  put: async (url, data) => {
    console.log(`SIMULATED API PUT: ${url}`, data);
    await new Promise(resolve => setTimeout(resolve, 300));
    const productId = url.split('/item/')[1]; // Extract productId from URL
    if (url.startsWith('/api/cart/item/')) {
      const { quantity } = data;
      const itemIndex = findProductInCart(productId);
      if (itemIndex > -1) {
        if (quantity <= 0) { // Remove if quantity is 0 or less
          simulatedServerCart.items.splice(itemIndex, 1);
        } else {
          simulatedServerCart.items[itemIndex].quantity = quantity;
        }
      } else {
         throw new Error('Product not found in simulated cart for PUT');
      }
      return { data: calculateCartTotals(simulatedServerCart.items) };
    }
    throw new Error(`Unhandled PUT ${url}`);
  },
  delete: async (url) => {
    console.log(`SIMULATED API DELETE: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    if (url.startsWith('/api/cart/item/')) {
      const productId = url.split('/item/')[1];
      const itemIndex = findProductInCart(productId);
      if (itemIndex > -1) {
        simulatedServerCart.items.splice(itemIndex, 1);
      }
      return { data: calculateCartTotals(simulatedServerCart.items) };
    }
    if (url === endpoints.clearCart) {
      simulatedServerCart.items = [];
      return { data: calculateCartTotals(simulatedServerCart.items) };
    }
    throw new Error(`Unhandled DELETE ${url}`);
  }
};
// --- End of API Simulation ---

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
          const response = await api.get(endpoints.cart);
          // Assuming response.data is { items: [], totalItems: X, totalPrice: Y }
          set({
            items: response.data.items || [],
            // totalItems: response.data.totalItems || 0,
            // totalPrice: response.data.totalPrice || 0,
            isLoading: false
          });
        } catch (error) {
          console.error('Failed to fetch cart:', error);
          toast.error('خطا در دریافت اطلاعات سبد خرید');
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
          const response = await api.post(endpoints.addToCart, {
            productId: product.id || product._id, // Use _id if id is not present
            quantity,
            product // Sending full product for simulation ease, backend might only need ID
          });
          // Assuming API returns the updated cart items (and totals)
          set({ items: response.data.items || [], isLoading: false });
          toast.success('محصول به سبد خرید اضافه شد');
        } catch (error) {
          console.error('Error adding item to cart:', error);
          toast.error(error.response?.data?.message || 'خطا در افزودن محصول به سبد');
          set({ items: originalItems, isLoading: false }); // Rollback on error
        }
      },
      
      // Remove item from cart
      removeItem: async (productId) => {
        set({ isLoading: true });
        const originalItems = get().items;
        try {
          const response = await api.delete(endpoints.removeFromCart(productId));
          set({ items: response.data.items || [], isLoading: false });
          toast.success('محصول از سبد خرید حذف شد');
        } catch (error) {
          console.error('Error removing item from cart:', error);
          toast.error(error.response?.data?.message || 'خطا در حذف محصول از سبد');
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
          const response = await api.put(endpoints.updateCartItem(productId), { quantity });
          set({ items: response.data.items || [], isLoading: false });
          // toast.success('تعداد محصول بروزرسانی شد'); // Optional: can be too noisy
        } catch (error) {
          console.error('Error updating cart item quantity:', error);
          toast.error(error.response?.data?.message || 'خطا در بروزرسانی تعداد محصول');
          set({ items: originalItems, isLoading: false });
        }
      },
      
      // Clear cart
      clearCart: async () => {
        set({ isLoading: true });
        const originalItems = get().items;
        try {
          const response = await api.delete(endpoints.clearCart);
          set({ items: response.data.items || [], isLoading: false }); // Expects API to return empty cart structure
          toast.success('سبد خرید خالی شد');
        } catch (error) {
          console.error('Error clearing cart:', error);
          toast.error(error.response?.data?.message || 'خطا در خالی کردن سبد خرید');
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
      
      // Removed old syncCart method, fetchCart is now primary for getting server state.
      // A true "sync" that merges local and server carts would be more complex.
      
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
        // orderDetails should contain: { items, shippingAddress, paymentMethod, totalAmount, etc. }
        // For simulation, we primarily care that it's called.
        set({ isLoading: true }); // Can use a specific orderProcessing state if needed
        try {
          const response = await api.post(endpoints.createOrder, orderDetails);
          // After successful order, the cart should be cleared.
          // The clearCart action already handles API call and state update.
          get().clearCart(); // This will set isLoading false after its own API call.
          // Or set isLoading false here if clearCart doesn't.
          // set({ isLoading: false });
          toast.success(response.data.message || 'سفارش با موفقیت ثبت شد!');
          return { success: true, order: response.data.order };
        } catch (error) {
          console.error('Error creating order:', error);
          toast.error(error.response?.data?.message || 'خطا در ثبت سفارش');
          set({ isLoading: false });
          return { success: false, error: error.response?.data?.message };
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