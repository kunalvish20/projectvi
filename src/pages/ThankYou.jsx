import {ArrowRight, Check, CheckCircle2, Copy, Mail, PackageCheck, ShoppingBag, Truck} from 'lucide-react';
import {useState} from 'react';
import {BOX_ITEMS, PRODUCT, PRODUCT_PATH} from '../data/catalog';
import {go} from '../hooks/useRoute';
import {format} from '../lib/format';
import {getOrderReceipt} from '../lib/orderReceipt';
import './ThankYou.css';

export function ThankYou() {
  const orderId = new URLSearchParams(window.location.search).get('order');
  const receipt = getOrderReceipt(orderId);
  const [copied, setCopied] = useState(false);

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(receipt.orderId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch { /* The order number remains selectable when clipboard access is unavailable. */ }
  };

  if (!receipt) return <main className="page thank-you-page"><section className="thank-you-missing"><ShoppingBag size={38} /><h1>Order details unavailable</h1><p>Open the confirmation in the same browser session where you completed checkout. If you paid through PayU, keep your transaction reference and contact support.</p><button type="button" onClick={() => go(PRODUCT_PATH)}>Back to the product <ArrowRight size={18} /></button></section></main>;

  return <main className="page thank-you-page" data-clarity-mask="true">
    <div className="thank-you-glow" aria-hidden="true" />
    <div className="thank-you-shell">
      <div className="thank-you-confirmation">
        <div className="thank-you-icon"><Check size={34} strokeWidth={3} /></div>
        <span className="thank-you-eyebrow">{receipt.demo ? 'DEMO CHECKOUT COMPLETE' : 'PAYMENT VERIFIED'}</span>
        <h1>Thank you, {receipt.customerName?.split(' ')[0] || 'collector'}.</h1>
        <p className="thank-you-lead">{receipt.demo ? 'Your test checkout worked from cart to confirmation.' : 'Your pre-order is confirmed. We’re getting your Collector’s Box ready.'}</p>
        {receipt.demo && <div className="thank-you-demo-note"><strong>Test payment only</strong><span>No money was charged and no real order was placed. This confirmation is saved in this browser session.</span></div>}
      </div>

      <div className="thank-you-grid">
        <section className="thank-you-card thank-you-details" aria-labelledby="thank-you-order-heading">
          <div className="thank-you-card-head"><div><span>YOUR CONFIRMATION</span><h2 id="thank-you-order-heading">Order details</h2></div><CheckCircle2 size={23} /></div>
          <div className="thank-you-order-id"><span>Order ID</span><div><strong>{receipt.orderId}</strong><button type="button" onClick={copyOrderId} aria-label={copied ? 'Order ID copied' : 'Copy order ID'} title={copied ? 'Copied' : 'Copy order ID'}>{copied ? <Check size={17} /> : <Copy size={17} />}</button></div></div>
          <div className="thank-you-product"><img src={BOX_ITEMS[0].src} alt={PRODUCT.name} /><div><span>{PRODUCT.category}</span><h3>{PRODUCT.name}</h3><p>Quantity: {receipt.quantity}</p></div></div>
          <div className="thank-you-total"><span>Total {receipt.demo ? 'simulated' : 'paid'}</span><strong>{format(receipt.amount)}</strong></div>
          <p className="thank-you-reference">Transaction reference <b>{receipt.transactionId}</b></p>
        </section>

        <aside className="thank-you-next" aria-labelledby="thank-you-next-heading">
          <span className="thank-you-next-label">WHAT HAPPENS NEXT</span><h2 id="thank-you-next-heading">You’re all set.</h2>
          <div className="thank-you-timeline"><span><Mail size={19} /></span><div><h3>{receipt.demo ? 'Demo confirmation' : 'Order confirmation'}</h3><p>{receipt.demo ? 'This preview shows how the confirmation experience looks.' : <>We’ll send order updates to <b>{receipt.email}</b>.</>}</p></div></div>
          <div className="thank-you-timeline"><span><PackageCheck size={19} /></span><div><h3>Preparing your box</h3><p>{receipt.demo ? 'No box will be prepared for a test order.' : 'Our team will prepare your Collector’s Box.'}</p></div></div>
          <div className="thank-you-timeline"><span><Truck size={19} /></span><div><h3>Delivery updates</h3><p>{receipt.demo ? 'Shipping is not started in demo mode.' : 'Tracking details will follow after dispatch.'}</p></div></div>
        </aside>
      </div>

      <div className="thank-you-actions"><button type="button" onClick={() => go('/')}>Back to the drop <ArrowRight size={18} /></button><a href="/contact">Need help with your order?</a></div>
    </div>
  </main>;
}
