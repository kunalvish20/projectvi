import {ArrowLeft, ArrowRight, ChevronDown, LockKeyhole, Loader2, MessageCircle, Minus, Plus, ShieldCheck, ShoppingBag, Truck} from 'lucide-react';
import {useEffect, useState} from 'react';
import {BOX_ITEMS, MAX_ORDER_QUANTITY, PRODUCT, PRODUCT_PATH, SITE} from '../data/catalog';
import {useStore} from '../context/StoreContext';
import {format} from '../lib/format';
import {go} from '../hooks/useRoute';
import {startPayUPayment,checkPayUStatus,getPendingPayU,clearPendingPayU} from '../lib/payuCheckout';
import {isPreviewCheckout, saveOrderReceipt} from '../lib/orderReceipt';
import {buildWhatsAppOrderUrl} from '../lib/whatsappOrder';
import {HANDLING_FEE, getOrderTotal} from '../data/handling';
import './Checkout.css';

const initialForm = {name: '', email: '', phone: '', pincode: '', address: '', city: '', state: ''};

export function Checkout() {
  const {cart, subtotal, setQty, clearCart} = useStore();
  const qty = cart[PRODUCT.id] || 0;
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [whatsappStatus, setWhatsappStatus] = useState('');
  const [pendingPayment, setPendingPayment] = useState(() => isPreviewCheckout ? null : getPendingPayU());
  const handlingFee = pendingPayment ? Number(pendingPayment.handlingFee ?? 0) : HANDLING_FEE;
  const total = pendingPayment?.amount ?? getOrderTotal(PRODUCT.price, qty);

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
      handlingFee: stored?.handlingFee,
      paymentVerified: true
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (isPreviewCheckout || !params.has('payment')) return;
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
    setWhatsappUrl('');
    setWhatsappStatus('');
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
      if (isPreviewCheckout) {
        const url = buildWhatsAppOrderUrl(SITE.orderWhatsApp, {customer, productName: PRODUCT.name, quantity: qty, amount: total});
        setWhatsappUrl(url);
        setWhatsappStatus('Your message is ready. Send it in WhatsApp to request your order.');
        const saveRequest = fetch('/api/checkout-preview', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({quantity: qty, customer}), signal: AbortSignal.timeout(10000)});
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        link.remove();
        try {
          const response = await saveRequest;
          if (!response.ok) throw new Error('Could not save checkout enquiry.');
        } catch {
          setError('WhatsApp is ready, but dashboard tracking could not be saved. Please send the prepared message so our team receives your details.');
        }
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
          <p>Add the Collector’s Box to start your order.</p>
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
          <p>{isPreviewCheckout ? 'Enter your details, then send your order request on WhatsApp. Our team will confirm payment and delivery.' : 'Enter your details, review your total, and pay securely.'}</p>
        </div>

        <div className="checkout-grid">
          <form className="checkout-form" data-clarity-mask="true" onSubmit={payNow}>
            <section className="checkout-section" aria-labelledby="checkout-contact-title">
              <div className="checkout-section-heading">
                <span className="checkout-section-number">01</span>
                <div><h2 id="checkout-contact-title">Contact details</h2><p>We’ll use these for your order and delivery updates.</p></div>
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
                <div><h2 id="checkout-delivery-title">Delivery address</h2><p>Where should we send your Collector’s Box?</p></div>
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
              <div className="checkout-delivery-note"><Truck size={20} aria-hidden="true" /><div><b>Standard delivery is free</b><span>{isPreviewCheckout ? 'We will confirm your address and dispatch details on WhatsApp.' : 'Dispatch and tracking updates will be sent to your contact details.'}</span></div></div>
            </section>

            <section className="checkout-payment" aria-labelledby="checkout-payment-title">
              <div className="checkout-section-heading">
                <span className="checkout-section-number">03</span>
                <div><h2 id="checkout-payment-title">{isPreviewCheckout ? 'Order on WhatsApp' : 'Secure payment'}</h2><p>{isPreviewCheckout ? 'Review your estimated total before sending the request.' : 'Review your order total before opening secure PayU checkout.'}</p></div>
              </div>
              {isPreviewCheckout && <div className="checkout-gateway-notice"><MessageCircle size={19} aria-hidden="true" /><span>Online payment is temporarily unavailable. Continue on WhatsApp and we will confirm your order and payment details there.</span></div>}
              <div className="checkout-pay-total"><span>{isPreviewCheckout ? 'Estimated total' : 'Total to pay'}</span><strong aria-live="polite">{format(total)}</strong></div>
              {error && <p className="checkout-error" role="alert">{error}</p>}
              {isPreviewCheckout && whatsappStatus && <p className="checkout-whatsapp-status" role="status">{whatsappStatus}</p>}
              {pendingPayment && <button className="checkout-retry-btn" type="button" onClick={retryConfirmation} disabled={loading}>
                {loading ? <><Loader2 className="spin" size={18} /> Checking payment…</> : <>Check payment status <ArrowRight size={18} /></>}
              </button>}
              {!pendingPayment && <button className={`pay-now-btn ${isPreviewCheckout ? 'checkout-whatsapp-btn' : ''}`} type="submit" disabled={loading}>
                {loading ? <><Loader2 className="spin" size={19} /> {isPreviewCheckout ? 'Saving details...' : 'Redirecting to PayU…'}</> : <>{isPreviewCheckout ? <MessageCircle size={19} /> : <LockKeyhole size={18} />} {isPreviewCheckout ? 'Continue on WhatsApp' : `Pay ${format(total)} securely`} <ArrowRight size={18} /></>}
              </button>}
              {isPreviewCheckout && whatsappUrl && <a className="checkout-whatsapp-fallback" href={whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp did not open? Open the message here <ArrowRight size={15} /></a>}
              <p className="checkout-payment-help"><ShieldCheck size={16} aria-hidden="true" /> {isPreviewCheckout ? 'Send the message in WhatsApp to request your order. No payment is collected on this page.' : 'Payments are handled by PayU. We don’t store your card or UPI details.'}</p>
              <p className="checkout-terms">{isPreviewCheckout ? 'By continuing' : 'By paying'}, you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.</p>
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
                <button type="button" aria-label="Decrease quantity" disabled={loading || Boolean(pendingPayment) || qty <= 1} onClick={() => {setQty(PRODUCT.id, qty - 1); setWhatsappUrl(''); setWhatsappStatus('');}}><Minus size={15} /></button>
                <span>{qty}</span>
                <button type="button" aria-label="Increase quantity" disabled={loading || Boolean(pendingPayment) || qty >= MAX_ORDER_QUANTITY} onClick={() => {setQty(PRODUCT.id, qty + 1); setWhatsappUrl(''); setWhatsappStatus('');}}><Plus size={15} /></button>
              </div>
            </div>
            <div className="checkout-costs">
              <div><span>Subtotal</span><strong>{format(subtotal)}</strong></div>
              <details className="checkout-price-details">
                <summary>View price breakdown <ChevronDown size={15} aria-hidden="true" /></summary>
                <div className="checkout-price-details-rows">
                  <div><span>Delivery</span><strong className="checkout-free">FREE</strong></div>
                  <div><span>Handling charge</span><strong className={handlingFee ? '' : 'checkout-free'}>{handlingFee ? format(handlingFee) : 'FREE'}</strong></div>
                </div>
              </details>
              <div className="checkout-cost-total"><span>Total</span><strong aria-live="polite">{format(total)}</strong></div>
            </div>
            <p className="checkout-order-note"><ShieldCheck size={17} aria-hidden="true" /> {isPreviewCheckout ? 'Includes handling. We will confirm payment on WhatsApp.' : 'No surprise fees at payment.'}</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
