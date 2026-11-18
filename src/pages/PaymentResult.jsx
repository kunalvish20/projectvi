import {ArrowRight, CircleAlert, Loader2, RotateCw, ShieldCheck} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {useStore} from '../context/StoreContext';
import {go} from '../hooks/useRoute';
import {checkPayUStatus,clearPendingPayU,getPendingPayU,saveRetryPayUCustomer} from '../lib/payuCheckout';
import {formatOrderId} from '../lib/orderId';
import {saveOrderReceipt} from '../lib/orderReceipt';
import './PaymentResult.css';

export function PaymentResult() {
  const {clearCart} = useStore();
  const [state,setState] = useState('checking');
  const [message,setMessage] = useState('');
  const [txnid,setTxnid] = useState('');
  const finished = useRef(false);

  const checkStatus = async () => {
    const stored = getPendingPayU();
    const returned = new URLSearchParams(window.location.search).get('payment');
    if (!stored?.txnid || (returned !== stored.txnid && returned !== 'unverified')) {
      setState('unknown');
      setMessage('We could not match this return to a payment in this browser. Contact support with your PayU transaction reference.');
      return;
    }
    setTxnid(stored.txnid);
    setState('checking');
    setMessage('');
    try {
      const result = await checkPayUStatus();
      if (result.status === 'paid') {
        if (finished.current) return;
        finished.current = true;
        const orderId = formatOrderId(result.orderNumber);
        saveOrderReceipt({orderId,transactionId:result.txnid,customerName:result.customerName,email:result.email,quantity:result.quantity,amount:result.amount,paymentVerified:true});
        clearPendingPayU();
        clearCart();
        window.clarity?.('event','purchase_verified');
        go(`/thank-you?order=${encodeURIComponent(orderId)}`);
        return;
      }
      if (result.status === 'failed') {
        if (stored.customer) saveRetryPayUCustomer(stored.customer);
        clearPendingPayU();
        setState('failed');
        setMessage('PayU reported that this payment failed. No order has been confirmed. You can try again.');
        return;
      }
      setState('pending');
      setMessage('PayU has not confirmed this payment yet. Please check the status before trying to pay again.');
    } catch {
      setState('pending');
      setMessage('We could not confirm the payment yet. Please check its status before trying to pay again.');
    }
  };

  useEffect(() => {checkStatus()}, []);

  return <main className="page payment-result-page" data-clarity-mask="true">
    <section className="payment-result-card" aria-live="polite">
      <div className={`payment-result-icon ${state === 'failed' ? 'is-failed' : ''}`}>{state === 'checking' ? <Loader2 className="spin" size={30} /> : state === 'failed' ? <CircleAlert size={30} /> : <ShieldCheck size={30} />}</div>
      <h1>{state === 'checking' ? 'Confirming your payment' : state === 'failed' ? 'Payment failed' : state === 'pending' ? 'Payment confirmation pending' : 'Payment status unavailable'}</h1>
      <p>{state === 'checking' ? 'We are checking your payment with PayU. Please wait a moment.' : message}</p>
      {txnid && <small>Transaction reference: {txnid}</small>}
      {state === 'pending' && <button type="button" onClick={checkStatus}><RotateCw size={18} /> Check payment status</button>}
      {state === 'failed' && <button type="button" onClick={() => go('/checkout')}>Try payment again <ArrowRight size={18} /></button>}
      {state === 'unknown' && <a href="/contact">Contact support <ArrowRight size={18} /></a>}
    </section>
  </main>;
}
