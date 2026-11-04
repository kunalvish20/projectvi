import {ArrowLeft, ArrowRight, LockKeyhole, Loader2, Minus, Plus, ShieldCheck, ShoppingBag, Truck} from 'lucide-react';
import {useEffect, useState} from 'react';
import {BOX_ITEMS, MAX_ORDER_QUANTITY, PRODUCT, PRODUCT_PATH} from '../data/catalog';
import {useStore} from '../context/StoreContext';
import {format} from '../lib/format';
import {go} from '../hooks/useRoute';
import {startPayUPayment,checkPayUStatus,getPendingPayU,clearPendingPayU} from '../lib/payuCheckout';
import {createDemoReceipt, isDemoPayment, saveOrderReceipt} from '../lib/orderReceipt';
import './Checkout.css';

const initialForm = {name: '', email: '', phone: '', pincode: '', address: '', city: '', state: ''};

export function Checkout() {
  const {cart, subtotal, setQty, clearCart} = useStore();
  const qty = cart[PRODUCT.id] || 0;
  const total = subtotal;
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingPayment, setPendingPayment] = useState(() => isDemoPayment ? null : getPendingPayU());

  const completePayment = (receipt) => {
    saveOrderReceipt(receipt);
    clearCart();
    go(`/thank-you?order=${encodeURIComponent(receipt.orderId)}`);
  };

  const completePayU = (result, stored) => {
    clearPendingPayU();
    setPendingPayment(null);
    window.clarity?.('event', 'purchase_verified');
    completePayment({
      orderId: result.orderNumber ? `PV-${result.orderNumber}` : result.txnid,
      transactionId: result.txnid,
      customerName: stored?.customerName,
      email: stored?.email,
      quantity: stored?.quantity,
      amount: stored?.amount,
      demo: false
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (isDemoPayment || !params.has('payment')) return;
    history.replaceState(null, '', '/checkout');
    const stored = getPendingPayU();
    if (!stored || params.get('payment') !== stored.txnid) {
      setError('Payment returned, but this browser has no matching verification session. Contact support with your transaction ID.');
      return;
    }
    setPendingPayment(stored);
    checkPayUStatus().then(result => {
      if (result.status === 'paid') {
        completePayU(result, stored);
      } else if (result.status === 'failed') {
        clearPendingPayU();setPendingPayment(null);
        setError('PayU reported a failed payment. You can try again with a new transaction.');
      } else {
        setError(`Payment confirmation is pending for ${stored.txnid}. Do not pay again. Use “Check payment status” below.`);
      }
    }).catch(e => setError(e.message));
  }, []);

  const update = event => {
    const {name, value} = event.target;
    const nextValue = name === 'phone' || name === 'pincode' ? value.replace(/\D/g, '') : value;
    setForm(current => ({...current, [name]: nextValue}));
    if (error && !pendingPayment) setError('');
  };

  const payNow = async event => {
    event.preventDefault();
    if (loading || pendingPayment) return;
    setError('');
    if (!qty) return;
    const customer = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));
    const invalidField = ['name', 'address', 'city', 'state'].find(key => customer[key].length < (key === 'address' ? 5 : 2));
    if (invalidField) {
      setError('Please enter a complete name and delivery address.');
      event.currentTarget.elements.namedItem(invalidField)?.focus();
      return;
    }
    setLoading(true);
    try {
      if (isDemoPayment) {
        completePayment(createDemoReceipt({customer, quantity: qty, amount: total}));
        return;
      }
      await startPayUPayment({quantity: qty, customer});
      setPendingPayment(getPendingPayU());
      // PayU Hosted Checkout navigates away. Never mark an order paid on redirect alone.
    } catch (paymentError) {
      const message = paymentError.message || '';
      setError(message.includes('configured') ? 'Online payment is temporarily unavailable. Please try again later.' : message || 'Payment could not be completed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const retryConfirmation = async () => {
    if (!pendingPayment || loading) return;
    setLoading(true);
    try {
      const verified = await checkPayUStatus();
      if (verified.status === 'paid') {
        completePayU(verified, pendingPayment);
      } else if (verified.status === 'failed') {
        clearPendingPayU();setPendingPayment(null);
        setError('The payment failed. You can place a new payment attempt.');
      } else setError(`Confirmation is still pending for ${verified.txnid}. Do not pay again.`);
    } catch (e) {setError(e.message || 'Unable to check payment status. Please retry.');}
    finally {setLoading(false);}
  };

  if (!qty) {
    return (
      <main className="page checkout-empty-page">
        <section className="checkout-empty-card">
          <ShoppingBag aria-hidden="true" />
          <h1>Your cart is empty.</h1>
          <p>Add the Collector’s Box to begin your pre-order.</p>
          <button type="button" onClick={() => go(PRODUCT_PATH)}>View Collector’s Box <ArrowRight size={18} /></button>
        </section>
      </main>
    );
  }

  return (
    <main className="page checkout-page">
      <div className="checkout-shell">
        <div className="checkout-heading">
          <button className="checkout-back" type="button" onClick={() => go('/cart')}><ArrowLeft size={16} /> Back to cart</button>
          <p className="checkout-step">ONE STEP CHECKOUT</p>
          <h1>Almost yours.</h1>
          <p>{isDemoPayment ? 'Enter your details to preview the checkout confirmation.' : 'Enter your details, review your total, and pay securely.'}</p>
        </div>

        <div className="checkout-grid">
          <form className="checkout-form" data-clarity-mask="true" onSubmit={payNow}>
            <section className="checkout-section" aria-labelledby="checkout-contact-title">
              <div className="checkout-section-heading">
                <span className="checkout-section-number">01</span>
                <div><h2 id="checkout-contact-title">Contact details</h2><p>{isDemoPayment ? 'These details appear in your browser-only preview.' : 'We’ll use these for your order and delivery updates.'}</p></div>
              </div>
              <div className="checkout-fields">
                <label className="checkout-field checkout-field-wide" htmlFor="checkout-name">Full name
                  <input id="checkout-name" name="name" value={form.name} onChange={update} required minLength="2" autoComplete="name" placeholder="As on your delivery address" />
                </label>
                <label className="checkout-field" htmlFor="checkout-email">Email address
                  <input id="checkout-email" name="email" value={form.email} onChange={update} required type="email" autoComplete="email" placeholder="you@example.com" />
                </label>
                <label className="checkout-field" htmlFor="checkout-phone">Mobile number
                  <input id="checkout-phone" name="phone" value={form.phone} onChange={update} required type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength="10" title="Enter a 10-digit mobile number" autoComplete="tel-national" placeholder="10-digit mobile number" />
                </label>
              </div>
            </section>

            <section className="checkout-section" aria-labelledby="checkout-delivery-title">
              <div className="checkout-section-heading">
                <span className="checkout-section-number">02</span>
                <div><h2 id="checkout-delivery-title">Delivery address</h2><p>{isDemoPayment ? 'Enter an address to preview the full checkout.' : 'Where should we send your Collector’s Box?'}</p></div>
              </div>
              <div className="checkout-fields">
                <label className="checkout-field checkout-field-wide" htmlFor="checkout-address">House number, street and area
                  <input id="checkout-address" name="address" value={form.address} onChange={update} required minLength="5" autoComplete="street-address" placeholder="Flat / house, street, area" />
                </label>
                <label className="checkout-field" htmlFor="checkout-city">City
                  <input id="checkout-city" name="city" value={form.city} onChange={update} required minLength="2" autoComplete="address-level2" placeholder="Your city" />
                </label>
                <label className="checkout-field" htmlFor="checkout-state">State
                  <input id="checkout-state" name="state" value={form.state} onChange={update} required minLength="2" autoComplete="address-level1" placeholder="Your state" />
                </label>
                <label className="checkout-field checkout-field-pin" htmlFor="checkout-pincode">PIN code
                  <input id="checkout-pincode" name="pincode" value={form.pincode} onChange={update} required inputMode="numeric" pattern="[0-9]{6}" maxLength="6" title="Enter a 6-digit PIN code" autoComplete="postal-code" placeholder="6-digit PIN code" />
                </label>
              </div>
              <div className="checkout-delivery-note"><Truck size={20} aria-hidden="true" /><div><b>Standard delivery is free</b><span>{isDemoPayment ? 'No shipment is created in preview mode.' : 'Dispatch and tracking updates will be sent to your contact details.'}</span></div></div>
            </section>

            <section className="checkout-payment" aria-labelledby="checkout-payment-title">
              <div className="checkout-section-heading">
                <span className="checkout-section-number">03</span>
                <div><h2 id="checkout-payment-title">{isDemoPayment ? 'Order preview' : 'Secure payment'}</h2><p>{isDemoPayment ? 'Review your order, then open the confirmation preview.' : 'Review your order total before opening secure PayU checkout.'}</p></div>
              </div>
              {isDemoPayment && <div className="checkout-preview-notice"><strong>Preview mode</strong><span>No payment will be collected. This creates a browser-only reference, not a placed order.</span></div>}
              <div className="checkout-pay-total"><span>{isDemoPayment ? 'Order total' : 'Total to pay'}</span><strong>{format(total)}</strong></div>
              {error && <p className="checkout-error" role="alert">{error}</p>}
              {pendingPayment && <button className="checkout-retry-btn" type="button" onClick={retryConfirmation} disabled={loading}>
                {loading ? <><Loader2 className="spin" size={18} /> Checking payment…</> : <>Check payment status <ArrowRight size={18} /></>}
              </button>}
              {!pendingPayment && <button className="pay-now-btn" type="submit" disabled={loading}>
                {loading ? <><Loader2 className="spin" size={19} /> {isDemoPayment ? 'Preparing confirmation…' : 'Redirecting to PayU…'}</> : <><LockKeyhole size={18} /> {isDemoPayment ? `Preview confirmation · ${format(total)}` : `Pay ${format(total)} securely`} <ArrowRight size={18} /></>}
              </button>}
              <p className="checkout-payment-help"><ShieldCheck size={16} aria-hidden="true" /> {isDemoPayment ? 'No card or UPI details are required for this preview.' : 'Payments are handled by PayU. We don’t store your card or UPI details.'}</p>
              <p className="checkout-terms">{isDemoPayment ? 'By continuing, you agree to our' : 'By paying, you agree to our'} <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.</p>
            </section>
          </form>

          <aside className="checkout-order" aria-label="Order summary">
            <div className="checkout-order-head"><h2>Your order</h2><span>{qty} {qty === 1 ? 'item' : 'items'}</span></div>
            <div className="checkout-order-product">
              <img src={BOX_ITEMS[0].src} alt={PRODUCT.name} />
              <div><p>{PRODUCT.category}</p><h3>{PRODUCT.name}</h3><strong>{format(PRODUCT.price)}</strong></div>
            </div>
            <div className="checkout-quantity-row">
              <span>Quantity</span>
              <div className="checkout-quantity" role="group" aria-label="Quantity">
                <button type="button" aria-label="Decrease quantity" disabled={loading || Boolean(pendingPayment) || qty <= 1} onClick={() => setQty(PRODUCT.id, qty - 1)}><Minus size={15} /></button>
                <span>{qty}</span>
                <button type="button" aria-label="Increase quantity" disabled={loading || Boolean(pendingPayment) || qty >= MAX_ORDER_QUANTITY} onClick={() => setQty(PRODUCT.id, qty + 1)}><Plus size={15} /></button>
              </div>
            </div>
            <div className="checkout-costs">
              <div><span>Subtotal</span><strong>{format(subtotal)}</strong></div>
              <div><span>Shipping</span><strong className="checkout-free">FREE</strong></div>
              <div className="checkout-cost-total"><span>Total</span><strong>{format(total)}</strong></div>
            </div>
            <p className="checkout-order-note"><ShieldCheck size={17} aria-hidden="true" /> No surprise fees at payment.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
