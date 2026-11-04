import {ArrowRight, Minus, Plus, ShoppingBag} from 'lucide-react';
import {BOX_ITEMS, PRODUCT, PRODUCT_PATH} from '../data/catalog';
import {useStore} from '../context/StoreContext';
import {format} from '../lib/format';
import {go} from '../hooks/useRoute';
import {ProductArt} from '../components/ProductArt';
import {HANDLING_FEE} from '../data/handling';

export function Cart() {
  const {cart, setQty, subtotal} = useStore();
  const qty = cart[PRODUCT.id] || 0;
  const handlingFee = qty ? HANDLING_FEE : 0;

  if (!qty) {
    return (
      <main className="page">
        <EmptyCart />
      </main>
    );
  }

  return (
    <main className="page cart-page">
      <section className="page-hero">
        <p className="eyebrow">Cart</p>
        <h1>Your box is ready.</h1>
      </section>
      <section className="cart-layout">
        <article className="cart-line">
          <ProductArt item={BOX_ITEMS[0]} />
          <div className="cart-line-details">
            <small>{PRODUCT.category}</small>
            <h2>{PRODUCT.name}</h2>
            <b>{format(PRODUCT.price)}</b>
            <div className="cart-line-actions">
              <div className="qty mini" role="group" aria-label="Quantity">
                <button type="button" aria-label="Decrease quantity" onClick={() => setQty(PRODUCT.id, qty - 1)}><Minus /></button>
                <span>{qty}</span>
                <button type="button" aria-label="Increase quantity" onClick={() => setQty(PRODUCT.id, qty + 1)}><Plus /></button>
              </div>
              <button className="remove-btn" type="button" onClick={() => setQty(PRODUCT.id, 0)}>Remove</button>
            </div>
          </div>
        </article>
        <OrderSummary subtotal={subtotal} handlingFee={handlingFee} />
      </section>
    </main>
  );
}

function EmptyCart() {
  return (
    <section className="empty">
      <ShoppingBag />
      <h1>Your cart is empty.</h1>
      <p>Add the GTA VI Collector's Box to start checkout.</p>
      <button className="primary-btn" onClick={() => go(PRODUCT_PATH)}>View Product</button>
    </section>
  );
}

function OrderSummary({subtotal, handlingFee}) {
  return (
    <aside className="summary-card">
      <p className="eyebrow">Order summary</p>
      <div><span>Subtotal</span><b>{format(subtotal)}</b></div>
      <div><span>Delivery</span><b>FREE</b></div>
      <div><span>Handling charge</span><b>{format(handlingFee)}</b></div>
      <div className="total"><span>Total</span><b>{format(subtotal + handlingFee)}</b></div>
      <button onClick={() => go('/checkout')}>Continue to Checkout <ArrowRight size={18} /></button>
      <a href={PRODUCT_PATH}>Back to product</a>
    </aside>
  );
}
