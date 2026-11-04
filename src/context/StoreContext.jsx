import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {PRODUCTS} from '../data/catalog';
import {addCartItem, normalizeCart, setCartItemQuantity} from '../lib/cart';
import {readPublicProduct,isConfigured} from '../lib/supabase';

const StoreContext = createContext(null);
const CART_KEY = 'gta_store_cart';
const LEGACY_CART_KEY = 'dd_cart';
const LEGACY_PRODUCT_ID = 'dd-collector-box';

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const readCart = () => {
  const savedCart = readJson(CART_KEY, null);
  if (savedCart !== null) return normalizeCart(savedCart);

  const legacyCart = readJson(LEGACY_CART_KEY, {});
  if (legacyCart?.[LEGACY_PRODUCT_ID]) {
    return normalizeCart({[PRODUCTS[0].id]: legacyCart[LEGACY_PRODUCT_ID]});
  }

  return normalizeCart(legacyCart);
};

export function StoreProvider({children}) {
  const [cart, setCart] = useState(readCart);
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [isCartDrawerOpen, setCartDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isConfigured) return;
    let active = true;
    readPublicProduct(PRODUCTS[0].id).then(remote => {
      if (!active || !remote) return;
      // Keep the original storefront layout intact, while reflecting changes to the seeded listing.
      const p=PRODUCTS[0];
      p.name=remote.name||p.name;
      p.shortName=remote.short_name||p.shortName;
      p.description=remote.description||p.description;
      p.price=Number(remote.price);
      p.oldPrice=Number(remote.compare_at_price)||p.oldPrice;
      setCatalogRevision(i=>i+1);
      window.dispatchEvent(new Event('store:catalog-updated'));
    }).catch(()=>{});
    return ()=>{active=false};
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const value = useMemo(() => {
    const add = (id, qty = 1) => {
      setCart(current => addCartItem(current, id, qty));
    };

    const preorder = (id, qty = 1) => {
      add(id, qty);
      window.clarity?.('event', 'add_to_cart');
      setCartDrawerOpen(true);
    };

    const setQty = (id, qty) => {
      setCart(current => setCartItemQuantity(current, id, qty));
    };

    const clearCart = () => setCart({});
    const openCartDrawer = () => setCartDrawerOpen(true);
    const closeCartDrawer = () => setCartDrawerOpen(false);

    const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    const subtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
      const product = PRODUCTS.find(item => item.id === id);
      return sum + (product?.price || 0) * qty;
    }, 0);

    return {
      cart,
      catalogRevision,
      add,
      preorder,
      setQty,
      clearCart,
      count,
      subtotal,
      isCartDrawerOpen,
      openCartDrawer,
      closeCartDrawer
    };
  }, [cart, isCartDrawerOpen, catalogRevision]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
