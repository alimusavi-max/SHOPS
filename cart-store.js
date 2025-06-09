import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api, { endpoints } from '@/services/api';
import toast from 'react-hot-toast';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isOpen: false,
      
      // Get cart items count
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
        const items = get().items;
        const existingItem = items.find(item => item.product.id === product.id);
        
        if (existingItem) {
          // Update quantity if item exists
          set({
            items: items.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
          toast.success('تعداد محصول در سبد خرید بروزرسانی شد');
        } else {
          // Add new item
          set({
            items: [...items, { product, quantity }],
          });
          toast.success('محصول به سبد خرید اضافه شد');
        }
        
        // Sync with backend if user is authenticated
        const authToken = localStorage.getItem('auth_token');
        if (authToken) {
          try {
            await api.post(endpoints.addToCart, { productId: product.id, quantity });
          } catch (error) {
            console.error('Error syncing cart with server:', error);
          }
        }
      },
      
      // Remove item from cart
      removeItem: async (productId) => {
        const items = get().items;
        set({
          items: items.filter(item => item.product.id !== productId),
        });
        
        toast.success('محصول از سبد خرید حذف شد');
        
        // Sync with backend if user is authenticated
        const authToken = localStorage.getItem('auth_token');
        if (authToken) {
          try {
            await api.delete(endpoints.removeFromCart(productId));
          } catch (error) {
            console.error('Error removing item from server cart:', error);
          }
        }
      },
      
      // Update item quantity
      updateQuantity: async (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        
        const items = get().items;
        set({
          items: items.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          ),
        });
        
        // Sync with backend if user is authenticated
        const authToken = localStorage.getItem('auth_token');
        if (authToken) {
          try {
            await api.put(endpoints.updateCartItem(productId), { quantity });
          } catch (error) {
            console.error('Error updating cart item:', error);
          }
        }
      },
      
      // Clear cart
      clearCart: async () => {
        set({ items: [] });
        toast.success('سبد خرید خالی شد');
        
        // Sync with backend if user is authenticated
        const authToken = localStorage.getItem('auth_token');
        if (authToken) {
          try {
            await api.delete(endpoints.clearCart);
          } catch (error) {
            console.error('Error clearing server cart:', error);
          }
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
      
      // Sync cart with server
      syncCart: async () => {
        const authToken = localStorage.getItem('auth_token');
        if (!authToken) return;
        
        set({ isLoading: true });
        try {
          const response = await api.get(endpoints.cart);
          const serverItems = response.data.items;
          
          // Merge local and server cart
          const localItems = get().items;
          const mergedItems = [...serverItems];
          
          // Add local items that don't exist on server
          localItems.forEach(localItem => {
            const exists = serverItems.find(
              serverItem => serverItem.product.id === localItem.product.id
            );
            if (!exists) {
              mergedItems.push(localItem);
            }
          });
          
          set({ items: mergedItems, isLoading: false });
        } catch (error) {
          console.error('Error syncing cart:', error);
          set({ isLoading: false });
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
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useCartStore;