import {ArrowRight, Check, CheckCircle2, Copy, Mail, PackageCheck, ShoppingBag, Truck} from 'lucide-react';
import {useEffect, useState} from 'react';
import {BOX_ITEMS, PRODUCT, PRODUCT_PATH} from '../data/catalog';
import {go} from '../hooks/useRoute';
import {format} from '../lib/format';
import {getOrderReceipt} from '../lib/orderReceipt';
import './ThankYou.css';

const CONTACT_EMAIL = 'workdndstores@gmail.com';

export function ThankYou() {
  const orderId = new URLSearchParams(window.location.search).get('order');
  const receipt = getOrderReceipt(orderId);
  const isPreview = receipt?.kind === 'preview';
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (receipt && orderId !== receipt.orderId) {
      history.replaceState(null, '', `/thank-you?order=${encodeURIComponent(receipt.orderId)}`);
    }
  }, [orderId, receipt?.orderId]);

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
        <span className="thank-you-eyebrow">{isPreview ? 'CHECKOUT DETAILS READY' : 'PAYMENT VERIFIED'}</span>
        <h1>Thank you, {receipt.customerName?.split(' ')[0] || 'collector'}.</h1>
        <p className="thank-you-lead">{isPreview ? 'Your checkout details are ready to review.' : 'Your pre-order is confirmed. We’re getting your Collector’s Box ready.'}</p>
        {isPreview && <p className="thank-you-no-payment">No payment was collected and no order was placed. This reference is saved only in this browser.</p>}
      </div>

      <div className="thank-you-grid">
        <section className="thank-you-card thank-you-details" aria-labelledby="thank-you-order-heading">
          <div className="thank-you-card-head"><div><span>YOUR CONFIRMATION</span><h2 id="thank-you-order-heading">Order details</h2></div><CheckCircle2 size={23} /></div>
          <div className="thank-you-order-id"><span>{isPreview ? 'Reference ID' : 'Order ID'}</span><div><strong>{receipt.orderId}</strong><button type="button" onClick={copyOrderId} aria-label={copied ? 'Reference copied' : 'Copy reference'} title={copied ? 'Copied' : 'Copy reference'}>{copied ? <Check size={17} /> : <Copy size={17} />}</button></div></div>
          <div className="thank-you-product"><img src={BOX_ITEMS[0].src} alt={PRODUCT.name} /><div><span>{PRODUCT.category}</span><h3>{PRODUCT.name}</h3><p>Quantity: {receipt.quantity}</p></div></div>
          <div className="thank-you-total"><span>{isPreview ? 'Order total' : 'Total paid'}</span><strong>{format(receipt.amount)}</strong></div>
          {!isPreview && <p className="thank-you-reference">Transaction reference <b>{receipt.transactionId}</b></p>}
        </section>

        <aside className="thank-you-next" aria-labelledby="thank-you-next-heading">
          <span className="thank-you-next-label">{isPreview ? 'YOUR SUMMARY' : 'WHAT HAPPENS NEXT'}</span><h2 id="thank-you-next-heading">{isPreview ? 'All details in one place.' : 'You’re all set.'}</h2>
          {isPreview ? <>
            <div className="thank-you-timeline"><span><CheckCircle2 size={19} /></span><div><h3>Details saved</h3><p>Your reference is available in this browser session.</p></div></div>
            <div className="thank-you-timeline"><span><Mail size={19} /></span><div><h3>Contact</h3><p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p></div></div>
            <div className="thank-you-timeline"><span><PackageCheck size={19} /></span><div><h3>Your box</h3><p>{receipt.quantity} Collector’s {receipt.quantity === 1 ? 'Box' : 'Boxes'} in your summary.</p></div></div>
          </> : <>
            <div className="thank-you-timeline"><span><Mail size={19} /></span><div><h3>Order confirmation</h3><p>We’ll send order updates to <b>{receipt.email}</b>.</p></div></div>
            <div className="thank-you-timeline"><span><PackageCheck size={19} /></span><div><h3>Preparing your box</h3><p>Our team will prepare your Collector’s Box.</p></div></div>
            <div className="thank-you-timeline"><span><Truck size={19} /></span><div><h3>Delivery updates</h3><p>Tracking details will follow after dispatch.</p></div></div>
          </>}
        </aside>
      </div>

      <div className="thank-you-actions"><button type="button" onClick={() => go('/')}>Back to the drop <ArrowRight size={18} /></button><a href="/contact">Need help with your order?</a></div>
    </div>
  </main>;
}
