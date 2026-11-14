import {useState} from 'react';
import {AlertTriangle, CheckCircle2, Mail, Send} from 'lucide-react';
import {adminFunctionRequest} from '../lib/supabase';
import {ORDER_CONFIRMATION_SUBJECT, orderConfirmationMessage} from '../lib/orderConfirmationEmail';

export function SendOrderEmail() {
  const [to, setTo] = useState('');
  const [name, setName] = useState('');
  const [reference, setReference] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setSuccess('');
    try {
      await adminFunctionRequest('send-order-confirmation', {to, name, reference, paymentConfirmed});
      setSuccess(`Email accepted for ${to.trim()}. Confirm delivery in your sender account if needed.`);
      setPaymentConfirmed(false);
    } catch (sendError) {
      setError(sendError.message || 'Could not send the email.');
    } finally { setBusy(false); }
  };

  return <>
    <div className="pv-page-intro"><div><span className="pv-eyebrow">CUSTOMER COMMUNICATION</span><h1>Send order email</h1><p>Send a confirmation after you have received and verified the customer's payment.</p></div></div>
    <div className="pv-help"><Mail size={17}/> Sender Gmail address and App Password must be configured on the server. This email does not change the order or payment status in Supabase.</div>
    {error && <div className="pv-alert pv-error" role="alert"><AlertTriangle size={16}/>{error}</div>}
    {success && <div className="pv-success" role="status"><CheckCircle2 size={16}/>{success}</div>}
    <div className="pv-order-email-layout">
      <section className="pv-panel pv-order-email-panel">
        <div className="pv-panel-heading"><div><h2>Customer details</h2><p>Enter the recipient exactly as provided by the customer.</p></div></div>
        <form onSubmit={submit}>
          <div className="pv-order-email-fields">
            <label className="pv-field"><span>Customer email *</span><input type="email" autoComplete="off" maxLength={180} required value={to} onChange={event => setTo(event.target.value)} placeholder="customer@example.com" /></label>
            <label className="pv-field"><span>Customer name (optional)</span><input maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="Customer name" /></label>
            <label className="pv-field"><span>Order or WhatsApp reference (optional)</span><input maxLength={60} value={reference} onChange={event => setReference(event.target.value)} placeholder="PV-..." /></label>
            <label className="pv-order-email-check"><input type="checkbox" required checked={paymentConfirmed} onChange={event => setPaymentConfirmed(event.target.checked)} /><span>I have received and verified this customer's payment.</span></label>
          </div>
          <div className="pv-order-email-actions"><button className="pv-btn pv-btn-dark" type="submit" disabled={busy || !paymentConfirmed}><Send size={16}/>{busy ? 'Sending...' : 'Send confirmation email'}</button></div>
        </form>
      </section>
      <section className="pv-panel pv-order-email-panel">
        <div className="pv-panel-heading"><div><h2>Email preview</h2><p>The subject and message are fixed for order confirmation.</p></div></div>
        <div className="pv-order-email-preview"><small>SUBJECT</small><strong>{ORDER_CONFIRMATION_SUBJECT}</strong><small>MESSAGE</small><p>{orderConfirmationMessage({name:name.trim(), reference:reference.trim()})}</p></div>
      </section>
    </div>
  </>;
}
