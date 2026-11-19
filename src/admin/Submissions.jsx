import {useEffect, useMemo, useState} from 'react';
import {AlertTriangle, Download, RefreshCw, Search, X} from 'lucide-react';
import {adminListAll, adminUpdate, toCurrency} from '../lib/supabase';

const dateTime = value => value ? new Date(value).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'short'}) : '—';
const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
function exportRows(filename, columns, rows) {
  const csv = [columns.map(([title]) => csvCell(title)).join(','), ...rows.map(row => columns.map(([, key]) => csvCell(row[key])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Detail({title, onClose, children}) {
  useEffect(() => { const close = event => {if (event.key === 'Escape') onClose();}; document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close); }, [onClose]);
  return <div className="pv-modal-overlay" role="presentation" onMouseDown={event => {if (event.target === event.currentTarget) onClose();}}><section className="pv-modal" role="dialog" aria-modal="true" aria-label={title}><div className="pv-modal-head"><h2>{title}</h2><button className="pv-icon-button" type="button" aria-label="Close" onClick={onClose}><X size={18}/></button></div>{children}</section></div>;
}
function Toolbar({search, setSearch, count, refresh, exportCsv, exportDisabled}) {
  return <div className="pv-table-toolbar"><div className="pv-search"><Search size={16}/><input aria-label="Search records" placeholder="Search name, email, reference..." value={search} onChange={event => setSearch(event.target.value)}/></div><span>{count} records</span><button className="pv-btn pv-btn-outline pv-small-btn" type="button" onClick={refresh}><RefreshCw size={15}/> Refresh</button><button className="pv-btn pv-btn-outline pv-small-btn" type="button" onClick={exportCsv} disabled={exportDisabled}><Download size={15}/> Export CSV</button></div>;
}
function ErrorMessage({error}) {return error && <div className="pv-alert pv-error" role="alert"><AlertTriangle size={16}/>{error}</div>;}

export function CreatorApplications() {
  const [rows, setRows] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(''), [search, setSearch] = useState(''), [selected, setSelected] = useState(null), [draft, setDraft] = useState({}), [saving, setSaving] = useState(false);
  const load = async () => {setLoading(true); setError(''); try {setRows(await adminListAll('creator_applications'));} catch (err) {setError(err.message);} finally {setLoading(false);}};
  useEffect(() => {load();}, []);
  const shown = useMemo(() => rows.filter(row => [row.name,row.email,row.interest,row.social_link,row.second_link,row.message,row.status].some(value => String(value || '').toLowerCase().includes(search.toLowerCase()))), [rows,search]);
  const open = row => {setSelected(row); setDraft({status:row.status, notes:row.notes || ''});};
  const save = async () => {setSaving(true); setError(''); try {const updated = (await adminUpdate('creator_applications', selected.id, {...draft, updated_at:new Date().toISOString()}))[0]; setRows(current => current.map(row => row.id === selected.id ? updated : row)); setSelected(null);} catch (err) {setError(err.message);} finally {setSaving(false);}};
  const columns = [['Received','created_at'],['Name','name'],['Email','email'],['Interest','interest'],['Primary link','social_link'],['Second link','second_link'],['Pitch','message'],['Status','status'],['Notes','notes']];
  return <><div className="pv-page-intro"><div><span className="pv-eyebrow">PARTNERSHIPS</span><h1>Creator applications</h1><p>Every submitted creator, promoter, and seller application is saved here.</p></div></div><ErrorMessage error={error}/><section className="pv-panel pv-data-panel"><Toolbar search={search} setSearch={setSearch} count={shown.length} refresh={load} exportCsv={() => exportRows('projectvi-creator-applications.csv', columns, shown)} exportDisabled={!shown.length}/>{loading?<div className="pv-loading"><RefreshCw className="pv-spin" size={18}/> Loading applications...</div>:shown.length?<div className="pv-table-wrap"><table><thead><tr><th>Received</th><th>Applicant</th><th>Interest</th><th>Social link</th><th>Status</th><th></th></tr></thead><tbody>{shown.map(row => <tr key={row.id}><td>{dateTime(row.created_at)}</td><td><strong>{row.name}</strong><small className="pv-secondary-cell">{row.email}</small></td><td>{row.interest}</td><td><a href={row.social_link} target="_blank" rel="noreferrer" className="pv-record-link">Open profile</a></td><td><span className="pv-badge pv-neutral">{row.status}</span></td><td><button className="pv-btn pv-btn-outline pv-small-btn" onClick={() => open(row)}>View</button></td></tr>)}</tbody></table></div>:<div className="pv-loading">{search ? 'No matching applications.' : 'No applications yet.'}</div>}</section>{selected&&<Detail title={`Application from ${selected.name}`} onClose={() => setSelected(null)}><div className="pv-modal-body"><div className="pv-detail-grid"><div><small>Received</small><strong>{dateTime(selected.created_at)}</strong></div><div><small>Interest</small><strong>{selected.interest}</strong></div><div><small>Email</small><strong><a href={`mailto:${selected.email}`}>{selected.email}</a></strong></div><div><small>Social profiles</small><p><a href={selected.social_link} target="_blank" rel="noreferrer">Primary profile</a>{selected.second_link&&<><br/><a href={selected.second_link} target="_blank" rel="noreferrer">Second profile</a></>}</p></div></div><div className="pv-record-message"><small>Applicant's idea</small><p>{selected.message || 'No pitch provided.'}</p></div><div className="pv-field-grid pv-detail-controls"><label className="pv-field"><span>Status</span><select value={draft.status} onChange={event => setDraft({...draft, status:event.target.value})}>{['new','contacted','approved','declined'].map(status => <option key={status} value={status}>{status}</option>)}</select></label><label className="pv-field pv-span-2"><span>Private notes</span><textarea rows={3} value={draft.notes} onChange={event => setDraft({...draft, notes:event.target.value})}/></label></div></div><div className="pv-modal-footer"><button className="pv-btn pv-btn-outline" onClick={() => setSelected(null)}>Close</button><button className="pv-btn pv-btn-dark" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save review'}</button></div></Detail>}</>;
}

function checkoutRow(row, source) {
  if (source !== 'PayU order') {
    const isWhatsApp = row.reference?.startsWith('PV-WA-');
    return {...row, source:isWhatsApp ? 'WhatsApp enquiry' : 'Preview checkout', payment_status:'No payment', order_status:isWhatsApp ? 'Awaiting WhatsApp confirmation' : 'Preview only'};
  }
  return {id:row.id, source, reference:row.order_number ? `PV-${row.order_number}` : row.txnid, txnid:row.txnid, customer_name:row.customer_name, customer_email:row.customer_email, customer_phone:row.customer_phone, address:row.address, city:row.city, state:row.state, pincode:row.pincode, product_name:row.product_name, quantity:row.quantity, amount:row.amount, payment_status:row.payment_status, order_status:row.order_status, created_at:row.created_at};
}
export function CheckoutDetails() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [source, setSource] = useState('all');
  const [payment, setPayment] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const load = async () => {
    setLoading(true); setError('');
    try {
      const [previewResult, ordersResult] = await Promise.allSettled([adminListAll('checkout_submissions'), adminListAll('orders')]);
      if (ordersResult.status === 'rejected') throw ordersResult.reason;
      const preview = previewResult.status === 'fulfilled' ? previewResult.value : [];
      setRows([...preview.map(row => checkoutRow(row, 'Preview checkout')), ...ordersResult.value.map(row => checkoutRow(row, 'PayU order'))]);
      if (previewResult.status === 'rejected') setError('Preview submissions are unavailable. Run supabase/track-submissions.sql in Supabase SQL Editor.');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search, source, payment, sort]);
  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter(row =>
      (source === 'all' || row.source === source) &&
      (payment === 'all' || row.payment_status === payment) &&
      (!needle || [row.reference, row.txnid, row.customer_name, row.customer_email, row.customer_phone, row.city, row.payment_status, row.product_name]
        .some(value => String(value ?? '').toLowerCase().includes(needle)))
    ).sort((a, b) => sort === 'oldest' ? new Date(a.created_at) - new Date(b.created_at)
      : sort === 'amount_high' ? Number(b.amount) - Number(a.amount)
      : new Date(b.created_at) - new Date(a.created_at));
  }, [rows, search, source, payment, sort]);
  const pageCount = Math.max(1, Math.ceil(shown.length / 20));
  const currentPage = Math.min(page, pageCount);
  const pageRows = shown.slice((currentPage - 1) * 20, currentPage * 20);
  const columns = [['Received','created_at'],['Source','source'],['Reference','reference'],['Transaction','txnid'],['Customer','customer_name'],['Email','customer_email'],['Phone','customer_phone'],['Address','address'],['City','city'],['State','state'],['PIN','pincode'],['Product','product_name'],['Quantity','quantity'],['Amount','amount'],['Payment','payment_status'],['Order status','order_status']];
  const sourceTabs = [['all','All'],['PayU order','PayU'],['WhatsApp enquiry','WhatsApp'],['Preview checkout','Older previews']];
  const paymentTone = value => value === 'paid' ? 'good' : value === 'pending' ? 'warn' : value === 'failed' ? 'bad' : 'neutral';

  return <>
    <div className="pv-page-intro"><div><span className="pv-eyebrow">CUSTOMER DETAILS</span><h1>Checkout details</h1><p>WhatsApp enquiries and PayU payment attempts in one view.</p></div></div>
    <div className="pv-help">WhatsApp enquiries do not confirm payment. Only PayU-verified paid attempts appear as orders.</div>
    <ErrorMessage error={error}/>
    <div className="pv-order-stat-row">
      <div><span>All checkouts</span><strong>{loading ? '—' : rows.length}</strong></div>
      <div><span>PayU paid</span><strong>{loading ? '—' : rows.filter(row => row.source === 'PayU order' && row.payment_status === 'paid').length}</strong></div>
      <div><span>PayU pending</span><strong>{loading ? '—' : rows.filter(row => row.source === 'PayU order' && row.payment_status === 'pending').length}</strong></div>
    </div>
    <section className="pv-panel pv-data-panel">
      <div className="pv-table-toolbar pv-orders-toolbar">
        <div className="pv-search"><Search size={16}/><input aria-label="Search checkout details" placeholder="Reference, customer, phone..." value={search} onChange={event => setSearch(event.target.value)}/></div>
        <div className="pv-orders-tools">
          <label>Payment <select aria-label="Filter payment status" value={payment} onChange={event => setPayment(event.target.value)}><option value="all">All payments</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="refunded">Refunded</option><option value="No payment">No payment</option></select></label>
          <label>Sort <select aria-label="Sort checkout details" value={sort} onChange={event => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="amount_high">Highest total</option></select></label>
          <button className="pv-btn pv-btn-outline pv-small-btn" type="button" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'pv-spin' : ''}/> Refresh</button>
          <button className="pv-btn pv-btn-outline pv-small-btn" type="button" onClick={() => exportRows('projectvi-checkout-details.csv', columns, shown)} disabled={!shown.length}><Download size={15}/> Export CSV</button>
        </div>
      </div>
      <div className="pv-view-tabs" role="group" aria-label="Checkout source">{sourceTabs.map(([key, name]) => <button type="button" key={key} className={source === key ? 'is-active' : ''} onClick={() => setSource(key)}>{name}</button>)}<span>{shown.length} of {rows.length} records</span></div>
      {loading ? <div className="pv-loading"><RefreshCw className="pv-spin" size={18}/> Loading checkout details...</div> : shown.length ? <div className="pv-workflow-list">
        <div className="pv-workflow-head pv-checkout-detail-columns"><span>Reference & customer</span><span>Received / source</span><span>Total / payment</span><span>Details</span></div>
        {pageRows.map(row => <article className="pv-workflow-row pv-checkout-detail-columns" key={`${row.source}-${row.id}`}>
          <div className="pv-workflow-primary"><button className="pv-cell-link" type="button" onClick={() => setSelected(row)}>{row.reference || row.txnid || 'No reference'}</button><strong>{row.customer_name || 'Name not entered'}</strong><small>{row.customer_email || 'Email not entered'}</small></div>
          <div><b>{dateTime(row.created_at)}</b><small>{row.source}</small></div>
          <div><b>{toCurrency(row.amount)}</b><small><span className={`pv-badge pv-${paymentTone(row.payment_status)}`}><i/>{row.payment_status}</span></small></div>
          <div className="pv-workflow-actions"><button className="pv-btn pv-btn-outline pv-small-btn" type="button" onClick={() => setSelected(row)}>View details</button></div>
        </article>)}
        {pageCount > 1 && <div className="pv-pagination"><span>Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, shown.length)} of {shown.length}</span><div><button type="button" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={currentPage === 1}>Previous</button><span>Page {currentPage} of {pageCount}</span><button type="button" onClick={() => setPage(value => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount}>Next</button></div></div>}
      </div> : <div className="pv-empty"><h3>No matching checkouts</h3><p>{search || source !== 'all' || payment !== 'all' ? 'Try another search or filter.' : 'Checkout details will appear here when customers start.'}</p></div>}
    </section>
    {selected && <Detail title={`Checkout ${selected.reference || selected.txnid || ''}`} onClose={() => setSelected(null)}><div className="pv-modal-body"><div className="pv-detail-grid"><div><small>Received</small><strong>{dateTime(selected.created_at)}</strong><p>{selected.source}</p></div><div><small>Payment / order status</small><strong>{selected.payment_status}</strong><p>{selected.order_status}</p></div><div><small>Customer</small><strong>{selected.customer_name || 'Name not entered'}</strong><p>{selected.customer_email ? <a href={`mailto:${selected.customer_email}`}>{selected.customer_email}</a> : 'Email not entered'}<br/>{selected.customer_phone ? <a href={`tel:${selected.customer_phone}`}>{selected.customer_phone}</a> : 'Phone not entered'}</p></div><div><small>Delivery address</small><strong>{selected.address || 'Not entered'}</strong><p>{[selected.city, selected.state, selected.pincode].filter(Boolean).join(', ') || 'Not entered'}</p></div><div><small>Product</small><strong>{selected.product_name || 'Not entered'}</strong><p>Quantity: {selected.quantity ?? '—'}</p></div><div><small>Amount</small><strong>{toCurrency(selected.amount)}</strong>{selected.txnid && <p>PayU transaction: {selected.txnid}</p>}</div></div></div><div className="pv-modal-footer"><button className="pv-btn pv-btn-outline" onClick={() => setSelected(null)}>Close</button></div></Detail>}
  </>;
}
