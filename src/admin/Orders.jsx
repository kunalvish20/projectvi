import {useEffect, useMemo, useState} from 'react';
import {AlertTriangle, Archive, CheckCircle2, Download, RefreshCw, RotateCcw, Search, ShieldCheck, X} from 'lucide-react';
import {adminFunctionRequest, adminListAll, adminUpdate, toCurrency} from '../lib/supabase';
import {formatOrderId} from '../lib/orderId';

const paidOrder = row => row.payment_status === 'paid' || row.payment_status === 'refunded';
const label = value => String(value || '—').replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
const date = value => value ? new Date(value).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) : '—';
const orderStates = ['confirmed','processing','shipped','delivered','cancelled'];
const fulfillmentStates = ['unfulfilled','packed','shipped','delivered','returned'];
const paymentStates = ['pending','paid','failed','refunded'];
const fulfillmentForOrder = {confirmed:'unfulfilled',processing:'packed',shipped:'shipped',delivered:'delivered',cancelled:'unfulfilled'};
const orderForFulfillment = {unfulfilled:'confirmed',packed:'processing',shipped:'shipped',delivered:'delivered',returned:'processing'};

function Badge({value}) {
  const tone = /paid|delivered|confirmed/i.test(value) ? 'good' : /pending|processing|unfulfilled|packed|shipped/i.test(value) ? 'warn' : /failed|cancelled/i.test(value) ? 'bad' : 'neutral';
  return <span className={`pv-badge pv-${tone}`}><i/>{label(value)}</span>;
}

function downloadCsv(rows) {
  const fields = ['order_number','txnid','customer_name','customer_email','customer_phone','amount','payment_status','order_status','fulfillment_status','archived_at','created_at'];
  const escape = value => `"${String(value ?? '').replaceAll('"','""')}"`;
  const csv = [fields.join(','), ...rows.map(row => fields.map(field => escape(row[field])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
  const link = document.createElement('a'); link.href = url; link.download = 'projectvi-orders.csv'; link.click();
  URL.revokeObjectURL(url);
}

export function Orders({mode='orders'}) {
  const [rows,setRows] = useState([]);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [search,setSearch] = useState('');
  const [status,setStatus] = useState('all');
  const [view,setView] = useState('active');
  const [sort,setSort] = useState('newest');
  const [selected,setSelected] = useState(null);
  const [draft,setDraft] = useState(null);
  const [page,setPage] = useState(1);
  const [busyId,setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setRows(await adminListAll('orders')); setError(''); }
    catch (cause) { setError(cause.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); setSelected(null); setStatus('all'); setView('active'); }, [mode]);
  useEffect(() => {
    if (!selected) return;
    const onKeyDown = event => { if (event.key === 'Escape' && !saving) setSelected(null); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selected,saving]);

  const all = useMemo(() => mode === 'payments' ? rows : rows.filter(paidOrder), [rows,mode]);
  const archiveReady = !all.length || Object.hasOwn(all[0], 'archived_at');
  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return all.filter(row => {
      if (mode !== 'payments' && archiveReady && view !== 'all' && Boolean(row.archived_at) !== (view === 'archived')) return false;
      const field = mode === 'payments' ? row.payment_status : mode === 'shipping' ? row.fulfillment_status : row.order_status;
      if (status !== 'all' && (status === 'pending_fulfillment' ? row.fulfillment_status !== 'unfulfilled' : field !== status)) return false;
      return !needle || [formatOrderId(row.order_number),row.txnid,row.customer_name,row.customer_email,row.customer_phone,row.product_name]
        .some(value => String(value ?? '').toLowerCase().includes(needle));
    }).sort((a,b) => sort === 'oldest' ? new Date(a.created_at)-new Date(b.created_at)
      : sort === 'amount_high' ? Number(b.amount)-Number(a.amount)
      : new Date(b.created_at)-new Date(a.created_at));
  }, [all,archiveReady,mode,search,status,view,sort]);

  useEffect(() => { setPage(1); }, [search,status,view,sort,mode]);
  const pageCount = Math.max(1,Math.ceil(shown.length / 20));
  useEffect(() => { setPage(current => Math.min(current,pageCount)); }, [pageCount]);
  const pageRows = shown.slice((Math.min(page,pageCount)-1)*20,Math.min(page,pageCount)*20);
  const updateInline = async (row,next) => {
    if (!paidOrder(row) || mode === 'payments') return;
    const patch = mode === 'shipping'
      ? {fulfillment_status:next,order_status:orderForFulfillment[next]}
      : {order_status:next,fulfillment_status:fulfillmentForOrder[next]};
    setBusyId(row.id); setError(''); setNotice('');
    try {
      const updated = await adminUpdate('orders',row.id,{...patch,updated_at:new Date().toISOString()});
      if (!updated?.[0]) throw new Error('Status could not be saved.');
      setRows(current => current.map(item => item.id === row.id ? updated[0] : item));
      setNotice(`Status saved for ${formatOrderId(row.order_number)}. Payment status is unchanged.`);
    } catch (cause) { setError(cause.message); }
    finally { setBusyId(null); }
  };
  const open = row => { setSelected(row); setDraft({order_status:row.order_status,fulfillment_status:row.fulfillment_status,carrier:row.carrier || '',tracking_number:row.tracking_number || '',notes:row.notes || ''}); setNotice(''); };
  const save = async event => {
    event.preventDefault(); if (!selected || !paidOrder(selected)) return;
    setSaving(true); setError('');
    try {
      const patch = {order_status:draft.order_status,fulfillment_status:draft.fulfillment_status,carrier:draft.carrier.trim(),tracking_number:draft.tracking_number.trim(),notes:draft.notes.trim(),updated_at:new Date().toISOString()};
      const updated = await adminUpdate('orders',selected.id,patch);
      if (!updated?.[0]) throw new Error('Order could not be updated. Refresh and try again.');
      setSelected(updated[0]); setDraft({...draft,...patch}); setNotice('Order changes saved.'); await load();
    } catch (cause) { setError(cause.message); }
    finally { setSaving(false); }
  };
  const setArchive = async archived => {
    if (!selected || !archiveReady || !paidOrder(selected)) return;
    setSaving(true); setError('');
    try {
      const updated = await adminUpdate('orders',selected.id,{archived_at:archived ? new Date().toISOString() : null});
      if (!updated?.[0]) throw new Error('Archive action could not be saved.');
      setSelected(updated[0]); setNotice(archived ? 'Order archived. Payment and revenue remain recorded.' : 'Order restored to the active list.'); await load();
    } catch (cause) { setError(cause.message); }
    finally { setSaving(false); }
  };
  const reconcile = async () => {
    if (!selected) return;
    setSaving(true); setError('');
    try {
      const result = await adminFunctionRequest('payu-reconcile',{txnid:selected.txnid});
      setNotice(result.status === 'paid' ? 'PayU verified this payment. It now appears in Orders.' : `PayU status: ${label(result.status)}. No paid order was created manually.`);
      const fresh = await adminListAll('orders'); const current = fresh.find(row => row.id === selected.id) || selected;
      setRows(fresh); setSelected(current); setDraft({order_status:current.order_status,fulfillment_status:current.fulfillment_status,carrier:current.carrier || '',tracking_number:current.tracking_number || '',notes:current.notes || ''});
    } catch (cause) { setError(cause.message); }
    finally { setSaving(false); }
  };
  const changeOrder = next => setDraft(current => ({...current,order_status:next,fulfillment_status:fulfillmentForOrder[next] || current.fulfillment_status}));
  const changeFulfillment = next => setDraft(current => ({...current,fulfillment_status:next,order_status:orderForFulfillment[next] || current.order_status}));
  const statuses = mode === 'payments' ? paymentStates : mode === 'shipping' ? fulfillmentStates : ['pending_fulfillment',...orderStates];
  const titles = {orders:['Orders','Review paid purchases and keep fulfillment moving.'],payments:['Payments','Review gateway attempts and verify pending transactions with PayU.'],shipping:['Shipping & delivery','Track the fulfillment stage of paid orders.']};
  const counts = mode === 'payments' ? [['Paid',all.filter(row => row.payment_status === 'paid').length],['Pending',all.filter(row => row.payment_status === 'pending').length],['Failed',all.filter(row => row.payment_status === 'failed').length]]
    : [['Active',all.filter(row => !row.archived_at).length],['Pending fulfillment',all.filter(row => !row.archived_at && row.fulfillment_status === 'unfulfilled').length],['Archived',all.filter(row => Boolean(row.archived_at)).length]];

  return <>
    <div className="pv-page-intro"><div><span className="pv-eyebrow">OPERATIONS</span><h1>{titles[mode][0]}</h1><p>{titles[mode][1]}</p></div><button className="pv-btn pv-btn-outline" onClick={load} disabled={loading}><RefreshCw size={16} className={loading?'pv-spin':''}/> Refresh</button></div>
    <div className="pv-help"><ShieldCheck size={16}/>{mode === 'payments' ? 'Pending and failed entries are payment attempts. Only PayU verification can mark a payment paid.' : 'Only PayU verified payments appear here. Archiving keeps their payment record and revenue intact.'}</div>
    {!archiveReady && mode !== 'payments' && <div className="pv-alert"><AlertTriangle size={16}/> Run supabase/admin-workflow.sql to enable order archiving.</div>}
    {error && <div className="pv-alert pv-error" role="alert"><AlertTriangle size={16}/>{error}</div>}
    {notice && !selected && <div className="pv-success" role="status"><CheckCircle2 size={16}/>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={14}/></button></div>}
    <div className="pv-order-stat-row">{counts.map(([name,count]) => <div key={name}><span>{name}</span><strong>{loading?'—':count}</strong></div>)}</div>
    <section className="pv-panel pv-data-panel">
      <div className="pv-table-toolbar pv-orders-toolbar"><div className="pv-search"><Search size={16}/><input aria-label="Search orders" placeholder="Order ID, customer, transaction…" value={search} onChange={event => setSearch(event.target.value)}/></div><div className="pv-orders-tools"><label>Status <select aria-label="Filter by status" value={status} onChange={event => setStatus(event.target.value)}><option value="all">All statuses</option>{statuses.map(item => <option key={item} value={item}>{label(item)}</option>)}</select></label><label>Sort <select aria-label="Sort orders" value={sort} onChange={event => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="amount_high">Highest total</option></select></label><button className="pv-btn pv-btn-outline pv-small-btn" onClick={() => downloadCsv(shown)} disabled={!shown.length}><Download size={15}/> Export</button></div></div>
      {mode !== 'payments' && <div className="pv-view-tabs" role="group" aria-label="Order view">{[['active','Active'],['archived','Archived'],['all','All']].map(([key,name]) => <button key={key} className={view===key?'is-active':''} onClick={() => setView(key)} disabled={!archiveReady && key==='archived'}>{name}</button>)}<span>{shown.length} of {all.length} orders</span></div>}
      {mode === 'payments' && <div className="pv-results-count">{shown.length} of {all.length} payment attempts</div>}
      {loading ? <div className="pv-loading"><RefreshCw className="pv-spin" size={19}/> Loading records...</div> : shown.length ? <div className="pv-workflow-list">
        <div className="pv-workflow-head pv-order-columns"><span>Order & customer</span><span>Placed / total</span><span>Payment</span><span>{mode==='payments'?'Attempt':'Status & actions'}</span></div>
        {pageRows.map(row => <article className="pv-workflow-row pv-order-columns" key={row.id}>
          <div className="pv-workflow-primary"><button className="pv-cell-link" onClick={() => open(row)}>{formatOrderId(row.order_number)}</button><strong>{row.customer_name}</strong><small>{row.customer_email}</small><small>{row.txnid}</small></div>
          <div><b>{toCurrency(row.amount)}</b><small>{date(row.created_at)}</small></div>
          <div><Badge value={row.payment_status}/>{row.archived_at && <small>Archived</small>}</div>
          <div className="pv-workflow-actions">{mode==='payments' ? <Badge value={row.order_status}/> : <select aria-label={`${mode==='shipping'?'Fulfillment':'Order status'} for ${formatOrderId(row.order_number)}`} value={mode==='shipping'?row.fulfillment_status:row.order_status} onChange={event => updateInline(row,event.target.value)} disabled={busyId===row.id}>{(mode==='shipping'?fulfillmentStates:orderStates).map(item => <option key={item} value={item}>{label(item)}</option>)}</select>}<button className="pv-btn pv-btn-outline pv-small-btn" onClick={() => open(row)}>View</button></div>
        </article>)}
        {pageCount > 1 && <div className="pv-pagination"><span>Showing {(page-1)*20+1} to {Math.min(page*20,shown.length)} of {shown.length}</span><div><button onClick={() => setPage(value => Math.max(1,value-1))} disabled={page===1}>Previous</button><span>Page {page} of {pageCount}</span><button onClick={() => setPage(value => Math.min(pageCount,value+1))} disabled={page===pageCount}>Next</button></div></div>}
      </div> : <div className="pv-empty"><h3>No matching records</h3><p>{search || status!=='all' || view==='archived' ? 'Try another search or filter.' : mode==='payments' ? 'Payment attempts will appear after checkout starts.' : 'Paid orders will appear after PayU confirms payment.'}</p></div>}
    </section>
    {selected && <div className="pv-modal-overlay" role="presentation" onMouseDown={event => {if (event.target===event.currentTarget && !saving) setSelected(null)}}><section className="pv-modal" role="dialog" aria-modal="true" aria-label={`Order ${formatOrderId(selected.order_number)}`}><div className="pv-modal-head"><div><h2>{mode==='payments'?'Payment attempt':'Order'} {formatOrderId(selected.order_number)}</h2><p>{selected.txnid} · {date(selected.created_at)}</p></div><button className="pv-icon-button" aria-label="Close" onClick={() => setSelected(null)} disabled={saving}><X size={18}/></button></div><div className="pv-modal-body"><div className="pv-detail-grid"><div><small>Customer</small><strong>{selected.customer_name}</strong><p><a href={`mailto:${selected.customer_email}`}>{selected.customer_email}</a><br/><a href={`tel:${selected.customer_phone}`}>{selected.customer_phone}</a></p></div><div><small>Delivery address</small><strong>{selected.address}</strong><p>{selected.city}, {selected.state} — {selected.pincode}</p></div><div><small>Product</small><strong>{selected.product_name}</strong><p>Quantity: {selected.quantity}</p></div><div><small>Payment</small><strong>{toCurrency(selected.amount)}</strong><p><Badge value={selected.payment_status}/></p></div></div>{error && <div className="pv-alert pv-error" role="alert"><AlertTriangle size={16}/>{error}</div>}{notice && <div className="pv-help" role="status">{notice}</div>}{paidOrder(selected) ? <form id="pv-order-edit" onSubmit={save}><div className="pv-field-grid pv-detail-controls"><label className="pv-field"><span>Order status</span><select value={draft.order_status} onChange={event => changeOrder(event.target.value)} disabled={saving}>{orderStates.map(item => <option key={item} value={item}>{label(item)}</option>)}</select></label><label className="pv-field"><span>Fulfillment</span><select value={draft.fulfillment_status} onChange={event => changeFulfillment(event.target.value)} disabled={saving}>{fulfillmentStates.map(item => <option key={item} value={item}>{label(item)}</option>)}</select></label><label className="pv-field"><span>Courier</span><input value={draft.carrier} onChange={event => setDraft(current => ({...current,carrier:event.target.value}))} disabled={saving}/></label><label className="pv-field"><span>Tracking number</span><input value={draft.tracking_number} onChange={event => setDraft(current => ({...current,tracking_number:event.target.value}))} disabled={saving}/></label><label className="pv-field pv-span-2"><span>Internal notes</span><textarea rows={3} value={draft.notes} onChange={event => setDraft(current => ({...current,notes:event.target.value}))} disabled={saving}/></label></div></form> : <div className="pv-help">Payment is {label(selected.payment_status).toLowerCase()}. Verify with PayU before processing this as an order.</div>}</div><div className="pv-modal-footer pv-order-modal-actions"><button className="pv-btn pv-btn-outline" onClick={reconcile} disabled={saving}><RefreshCw size={16}/> Verify with PayU</button>{paidOrder(selected) && mode !== 'payments' && archiveReady && <button className="pv-btn pv-btn-outline" onClick={() => setArchive(!selected.archived_at)} disabled={saving}>{selected.archived_at ? <RotateCcw size={16}/> : <Archive size={16}/>} {selected.archived_at?'Restore':'Archive'}</button>}{paidOrder(selected) && <button className="pv-btn pv-btn-dark" type="submit" form="pv-order-edit" disabled={saving}>{saving?'Saving…':'Save changes'}</button>}</div></section></div>}
  </>;
}
