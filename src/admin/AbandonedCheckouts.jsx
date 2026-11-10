import {useEffect, useMemo, useState} from 'react';
import {AlertTriangle, RefreshCw, Search, X} from 'lucide-react';
import {adminListAll, toCurrency} from '../lib/supabase';

const dateTime = value => value ? new Date(value).toLocaleString('en-IN', {dateStyle: 'medium', timeStyle: 'short'}) : '—';
const stateOf = row => row.status === 'whatsapp_opened' ? 'WhatsApp opened' : Date.now() - new Date(row.updated_at).getTime() >= 5 * 60 * 1000 ? 'Abandoned checkout' : 'In progress';

export function AbandonedCheckouts() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const load = async () => {
    setLoading(true); setError('');
    try { setRows(await adminListAll('checkout_drafts')); }
    catch { setError('Checkout drafts are unavailable. Run supabase/checkout-drafts.sql in the connected Supabase project.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const shown = useMemo(() => rows.filter(row => {
    const status = stateOf(row);
    return (filter === 'all' || filter === status)
      && [row.customer_name, row.customer_email, row.customer_phone, row.city, row.id]
        .some(value => String(value || '').toLowerCase().includes(search.toLowerCase()));
  }), [rows, search, filter]);

  return <>
    <div className="pv-page-intro"><div><span className="pv-eyebrow">CHECKOUT FOLLOW-UP</span><h1>Abandoned checkouts</h1><p>See customer details entered before the WhatsApp step.</p></div></div>
    <div className="pv-help">“Abandoned checkout” means no WhatsApp click was recorded for at least 5 minutes. “WhatsApp opened” means the button was clicked; the message may still be unsent. No payment is confirmed here.</div>
    {error && <div className="pv-alert pv-error" role="alert"><AlertTriangle size={16}/>{error}</div>}
    <section className="pv-panel pv-data-panel">
      <div className="pv-table-toolbar"><div className="pv-search"><Search size={16}/><input aria-label="Search checkouts" placeholder="Search name, email, phone..." value={search} onChange={event => setSearch(event.target.value)}/></div><span>{shown.length} records</span><button className="pv-btn pv-btn-outline pv-small-btn" onClick={load}><RefreshCw size={15}/> Refresh</button></div>
      <div className="pv-record-filter"><label>Status <select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All</option><option value="Abandoned checkout">Abandoned checkout</option><option value="In progress">In progress</option><option value="WhatsApp opened">WhatsApp opened</option></select></label></div>
      {loading ? <div className="pv-loading">Loading checkout details...</div> : shown.length ? <div className="pv-table-wrap"><table><thead><tr><th>Last activity</th><th>Customer</th><th>Phone</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>{shown.map(row => <tr key={row.id}><td>{dateTime(row.updated_at)}</td><td><strong>{row.customer_name || 'Name not entered'}</strong><small className="pv-secondary-cell">{row.customer_email || 'Email not entered'}</small></td><td>{row.customer_phone || '—'}</td><td>{toCurrency(row.amount)}</td><td>{stateOf(row)}</td><td><button className="pv-btn pv-btn-outline pv-small-btn" onClick={() => setSelected(row)}>View</button></td></tr>)}</tbody></table></div> : <div className="pv-loading">{search || filter !== 'all' ? 'No matching checkouts.' : 'No checkout details yet.'}</div>}
    </section>
    {selected && <div className="pv-modal-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}><section className="pv-modal" role="dialog" aria-modal="true" aria-label="Checkout details"><div className="pv-modal-head"><h2>Checkout details</h2><button className="pv-icon-button" aria-label="Close" onClick={() => setSelected(null)}><X size={18}/></button></div><div className="pv-modal-body"><div className="pv-detail-grid"><div><small>Status</small><strong>{stateOf(selected)}</strong><p>Last activity: {dateTime(selected.updated_at)}</p></div><div><small>Customer</small><strong>{selected.customer_name || 'Not entered'}</strong><p>{selected.customer_email ? <a href={`mailto:${selected.customer_email}`}>{selected.customer_email}</a> : 'Email not entered'}<br/>{selected.customer_phone ? <a href={`tel:${selected.customer_phone}`}>{selected.customer_phone}</a> : 'Phone not entered'}</p></div><div><small>Delivery address</small><strong>{selected.address || 'Not entered'}</strong><p>{[selected.city, selected.state, selected.pincode].filter(Boolean).join(', ') || 'Not entered'}</p></div><div><small>Product</small><strong>{selected.product_name}</strong><p>Quantity: {selected.quantity} · Estimated total: {toCurrency(selected.amount)}</p></div></div></div><div className="pv-modal-footer"><button className="pv-btn pv-btn-outline" onClick={() => setSelected(null)}>Close</button></div></section></div>}
  </>;
}
