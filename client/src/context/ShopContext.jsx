import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const ShopContext = createContext(null);
const CART_KEY = 'pureaqua_guest_cart_v1';
const WISHLIST_KEY = 'pureaqua_guest_wishlist_v1';
const readLocal = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const saveLocal = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage may be disabled */ } };

export function ShopProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [cartItems, setCartItems] = useState(() => readLocal(CART_KEY, []));
  const [wishlistIds, setWishlistIds] = useState(() => readLocal(WISHLIST_KEY, []));
  const [syncing, setSyncing] = useState(false);
  const guestSyncFor = useRef(null);

  const refreshRemote = useCallback(async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const [cartResult, wishlistResult] = await Promise.all([api.get('/cart'), api.get('/wishlist')]);
      setCartItems(cartResult.data.items || []);
      setWishlistIds((wishlistResult.data.products || []).map((product) => Number(product.id)));
    } catch (error) {
      if (error.response?.status !== 401) toast(error.response?.data?.message || 'Your saved shopping data could not be loaded.', 'error');
    } finally { setSyncing(false); }
  }, [user, toast]);

  const syncGuestToAccount = useCallback(async () => {
    if (!user || guestSyncFor.current === Number(user.id)) return;
    guestSyncFor.current = Number(user.id);
    const guestCart = readLocal(CART_KEY, []);
    const guestWishlist = readLocal(WISHLIST_KEY, []);
    if (!guestCart.length && !guestWishlist.length) { await refreshRemote(); return; }
    setSyncing(true);
    try {
      const [remoteCart, remoteWishlist] = await Promise.all([api.get('/cart'), api.get('/wishlist')]);
      const knownCartProducts = new Set((remoteCart.data.items || []).map((item) => Number(item.product?.id)));
      const knownWishlistProducts = new Set((remoteWishlist.data.products || []).map((item) => Number(item.id)));
      for (const item of guestCart) {
        const product = item.product;
        if (product?.id && !knownCartProducts.has(Number(product.id))) {
          await api.post('/cart', { productId: product.id, quantity: Math.max(1, Number(item.quantity) || 1) });
          knownCartProducts.add(Number(product.id));
        }
      }
      for (const productId of guestWishlist) {
        if (!knownWishlistProducts.has(Number(productId))) {
          await api.post('/wishlist', { productId: Number(productId) });
          knownWishlistProducts.add(Number(productId));
        }
      }
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(WISHLIST_KEY);
      await refreshRemote();
    } catch (error) {
      toast(error.response?.data?.message || 'Some saved guest items could not be synced. Your local list is still saved.', 'error');
    } finally { setSyncing(false); }
  }, [user, refreshRemote, toast]);

  useEffect(() => {
    if (user) syncGuestToAccount();
    else {
      guestSyncFor.current = null;
      setCartItems(readLocal(CART_KEY, []));
      setWishlistIds(readLocal(WISHLIST_KEY, []));
    }
  }, [user?.id, syncGuestToAccount]);

  useEffect(() => { if (!user) saveLocal(CART_KEY, cartItems); }, [cartItems, user]);
  useEffect(() => { if (!user) saveLocal(WISHLIST_KEY, wishlistIds); }, [wishlistIds, user]);

  const addToCart = useCallback(async (product, quantity = 1) => {
    if (!product) return;
    if (user) {
      await api.post('/cart', { productId: product.id, quantity });
      await refreshRemote();
    } else {
      setCartItems((current) => {
        const existing = current.find((item) => Number(item.product?.id || item.productId) === Number(product.id));
        if (existing) return current.map((item) => Number(item.product?.id || item.productId) === Number(product.id) ? { ...item, quantity: Math.min(product.stock || 99, item.quantity + quantity) } : item);
        return [...current, { id: `guest-${product.id}`, quantity, product }];
      });
    }
    toast(`${product.name} added to your cart.`);
  }, [user, refreshRemote, toast]);

  const setQuantity = useCallback(async (itemId, quantity) => {
    if (quantity < 1) return;
    if (user) {
      const { data } = await api.put(`/cart/${itemId}`, { quantity });
      setCartItems(data.items || []);
    } else {
      setCartItems((current) => current.map((item) => item.id === itemId ? { ...item, quantity: Math.min(Number(item.product?.stock || 99), quantity) } : item));
    }
  }, [user]);

  const removeFromCart = useCallback(async (item) => {
    if (user) {
      const { data } = await api.delete(`/cart/${item.id}`);
      setCartItems(data.items || []);
    } else setCartItems((current) => current.filter((row) => row.id !== item.id));
  }, [user]);
  const clearCart = useCallback(async () => {
    if (user) { await api.delete('/cart'); setCartItems([]); }
    else setCartItems([]);
  }, [user]);

  const toggleWishlist = useCallback(async (product) => {
    if (user) {
      if (wishlistIds.includes(Number(product.id))) {
        const { data } = await api.delete(`/wishlist/${product.id}`);
        setWishlistIds((data.products || []).map((item) => Number(item.id)));
        toast('Removed from your wishlist.', 'info');
      } else {
        const { data } = await api.post('/wishlist', { productId: product.id });
        setWishlistIds((data.products || []).map((item) => Number(item.id)));
        toast('Saved to your wishlist.');
      }
      return;
    }
    setWishlistIds((current) => {
      const exists = current.includes(Number(product.id));
      toast(exists ? 'Removed from your wishlist.' : 'Saved to your wishlist.', exists ? 'info' : 'success');
      return exists ? current.filter((id) => id !== Number(product.id)) : [...current, Number(product.id)];
    });
  }, [user, wishlistIds, toast]);

  const moveToCart = useCallback(async (product) => {
    await addToCart(product, 1);
    await toggleWishlist(product);
  }, [addToCart, toggleWishlist]);

  const value = useMemo(() => ({ cartItems, wishlistIds, syncing, cartCount: cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0), addToCart, setQuantity, removeFromCart, clearCart, toggleWishlist, moveToCart, refreshRemote }), [cartItems, wishlistIds, syncing, addToCart, setQuantity, removeFromCart, clearCart, toggleWishlist, moveToCart, refreshRemote]);
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}
export function useShop() {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used inside ShopProvider');
  return context;
}
