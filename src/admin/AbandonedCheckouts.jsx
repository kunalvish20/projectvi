import {useEffect, useMemo, useState} from 'react';
import {AlertTriangle, Archive, CheckCircle2, RefreshCw, RotateCcw, Search, X} from 'lucide-react';
import {adminListAll, adminUpdate, toCurrency} from '../lib/supabase';

const dateTime = value => value ? new Date(value).toLocaleString('en-IN', {dateStyle:'medium',timeStyle:'short'}) : '—';
const activityOf = row => row.status === 'whatsapp_opened' ? 'WhatsApp opened' : Date.now() - new Date(row.updated_at).getTime() >= 300000 ? 'Abandoned checkout' : 'In progress';
const reviewOf = row => row.review_status || 'pending';
const reviewStates = [['pending','Pending follow-up'],['confirmed','Enquiry confirmed'],['archived','Archived']];

function ReviewBadge({value}) {
  const tone = value === 'confirmed' ? 'good' : value === 'archived' ? 'neutral' : 'warn';
  return <span className={`pv-badge pv-${tone}`}><i/>{reviewStates.find(([key]) => key === value)?.[1] || 'Pending follow-up'}</span>;
}

export function AbandonedCheckouts() {
  const [rows,setRows] = useState([]);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [search,setSearch] = useState('');
  const [view,setView] = useState('active');
  const [activity,setActivity] = useState('all');
  const [sort,setSort] = useState('newest');
  const [selected,setSelected] = useState(null);
  const [page,setPage] = useState(1);
  const [busyId,setBusyId] = useState(null);
  const [draft,setDraft] = useState({review_status:'pending',review_note:''});

  const load = async () => {
    setLoading(true);
    try { setRows(await adminListAll('checkout_drafts')); setError(''); }
    catch (cause) { setError(cause.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!selected) return;
    const onKeyDown = event => {if (event.key === 'Escape' && !saving) setSelected(null)};
    document.addEventListener('keydown',onKeyDown);
    return () => document.removeEventListener('keydown',onKeyDown);
  }, [selected,saving]);
  const reviewReady = !rows.length || Object.hasOwn(rows[0], 'review_status');
  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter(row => {
      if (view !== 'all' && reviewOf(row) !== view && !(view === 'active' && reviewOf(row) !== 'archived')) return false;
      if (activity !== 'all' && activityOf(row) !== activity) return false;
      return !needle || [row.customer_name,row.customer_email,row.customer_phone,row.city,row.id,row.product_name]
        .some(value => String(value || '').toLowerCase().includes(needle));
    }).sort((a,b) => sort === 'oldest' ? new Date(a.updated_at)-new Date(b.updated_at) : new Date(b.updated_at)-new Date(a.updated_at));
  }, [rows,search,view,activity,sort]);
  useEffect(() => { setPage(1); }, [search,view,activity,sort]);
  const pageCount = Math.max(1,Math.ceil(shown.length / 20));
  useEffect(() => { setPage(current => Math.min(current,pageCount)); }, [pageCount]);
  const pageRows = shown.slice((Math.min(page,pageCount)-1)*20,Math.min(page,pageCount)*20);
  const updateInline = async (row,nextStatus) => {
    if (!reviewReady || nextStatus === reviewOf(row)) return;
    setBusyId(row.id); setError(''); setNotice('');
    try {
      const updated = await adminUpdate('checkout_drafts',row.id,{review_status:nextStatus});
      if (!updated?.[0]) throw new Error('Follow-up status could not be saved.');
      setRows(current => current.map(item => item.id === row.id ? updated[0] : item));
      setNotice('Follow-up saved. Payment status is unchanged.');
    } catch (cause) { setError(cause.message); }
    finally { setBusyId(null); }
  };
  const open = row => { setSelected(row); setDraft({review_status:reviewOf(row),review_note:row.review_note || ''}); setNotice(''); };
  const save = async (nextStatus=draft.review_status) => {
    if (!selected) return;
    setSaving(true); setError('');
    try {
      const updated = await adminUpdate('checkout_drafts',selected.id,{review_status:nextStatus,review_note:draft.review_note.trim()});
      if (!updated?.[0]) throw new Error('Review status could not be saved.');
      setSelected(updated[0]); setDraft({review_status:reviewOf(updated[0]),review_note:updated[0].review_note || ''});
      setNotice(nextStatus === 'archived' ? 'Checkout archived. No payment status changed.' : 'Follow-up status saved. This does not confirm a payment.');
      await load();
    } catch (cause) { setError(cause.message.includes('review_status') ? 'Run supabase/admin-workflow.sql in Supabase before using follow-up actions.' : cause.message); }
    finally { setSaving(false); }
  };
  const counts = [['Active',rows.filter(row => reviewOf(row)!=='archived').length],['Pending',rows.filter(row => reviewOf(row)==='pending').length],['Enquiry confirmed',rows.filter(row => reviewOf(row)==='confirmed').length]];

  return <>
    <div className="pv-page-intro"><div><span className="pv-eyebrow">CHECKOUT FOLLOW-UP</span><h1>Abandoned checkouts</h1><p>Review saved checkout details and track follow-up without changing payment records.</p></div><button className="pv-btn pv-btn-outline" onClick={load} disabled={loading}><RefreshCw size={16} className={loading?'pv-spin':''}/> Refresh</button></div>
    <div className="pv-help">“Abandoned” means no WhatsApp click was recorded for 5 minutes. “Enquiry confirmed” is your follow-up decision; it never means the customer paid or placed a PayU order.</div>
    {!reviewReady && <div className="pv-alert"><AlertTriangle size={16}/> Run supabase/admin-workflow.sql to enable follow-up and archive actions.</div>}
    {error && <div className="pv-alert pv-error" role="alert"><AlertTriangle size={16}/>{error}</div>}
    {notice && !selected && <div className="pv-success" role="status"><CheckCircle2 size={16}/>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={14}/></button></div>}
    <div className="pv-order-stat-row">{counts.map(([name,count]) => <div key={name}><span>{name}</span><strong>{loading?'—':count}</strong></div>)}</div>
    <section className="pv-panel pv-data-panel">
      <div className="pv-table-toolbar pv-orders-toolbar"><div className="pv-search"><Search size={16}/><input aria-label="Search checkouts" placeholder="Name, email, phone, product…" value={search} onChange={event => setSearch(event.target.value)}/></div><div className="pv-orders-tools"><label>Activity <select aria-label="Filter checkout activity" value={activity} onChange={event => setActivity(event.target.value)}><option value="all">All activity</option><option value="Abandoned checkout">Abandoned</option><option value="In progress">In progress</option><option value="WhatsApp opened">WhatsApp opened</option></select></label><label>Sort <select aria-label="Sort checkouts" value={sort} onChange={event => setSort(event.target.value)}><option value="newest">Recent activity</option><option value="oldest">Oldest activity</option></select></label></div></div>
      <div className="pv-view-tabs" role="group" aria-label="Checkout view">{[['active','Active'],['pending','Pending'],['confirmed','Confirmed enquiries'],['archived','Archived'],['all','All']].map(([key,name]) => <button key={key} className={view===key?'is-active':''} onClick={() => setView(key)} disabled={!reviewReady && ['confirmed','archived'].includes(key)}>{name}</button>)}<span>{shown.length} of {rows.length} checkouts</span></div>
      {loading ? <div className="pv-loading"><RefreshCw className="pv-spin" size={18}/> Loading checkout details...</div> : shown.length ? <div className="pv-workflow-list">
        <div className="pv-workflow-head pv-checkout-columns"><span>Customer</span><span>Activity</span><span>Amount</span><span>Follow-up</span></div>
        {pageRows.map(row => <article className="pv-workflow-row pv-checkout-columns" key={row.id}>
          <div className="pv-workflow-primary"><strong>{row.customer_name || 'Name not entered'}</strong><small>{row.customer_email || 'Email not entered'}</small><small>{row.customer_phone || 'Phone not entered'}</small></div>
          <div><b>{activityOf(row)}</b><small>{dateTime(row.updated_at)}</small></div>
          <div className="pv-workflow-amount">{toCurrency(row.amount)}</div>
          <div className="pv-workflow-actions"><select aria-label={`Follow-up for ${row.customer_name || row.id}`} value={reviewOf(row)} onChange={event => updateInline(row,event.target.value)} disabled={!reviewReady || busyId===row.id}>{reviewStates.map(([key,name]) => <option key={key} value={key}>{name}</option>)}</select><button className="pv-btn pv-btn-outline pv-small-btn" onClick={() => open(row)}>View</button></div>
        </article>)}
        {pageCount > 1 && <div className="pv-pagination"><span>Showing {(page-1)*20+1} to {Math.min(page*20,shown.length)} of {shown.length}</span><div><button onClick={() => setPage(value => Math.max(1,value-1))} disabled={page===1}>Previous</button><span>Page {page} of {pageCount}</span><button onClick={() => setPage(value => Math.min(pageCount,value+1))} disabled={page===pageCount}>Next</button></div></div>}
      </div> : <div className="pv-empty"><h3>No matching checkouts</h3><p>Try another search or filter.</p></div>}
    </section>
    {selected && <div className="pv-modal-overlay" role="presentation" onMouseDown={event => {if (event.target===event.currentTarget && !saving) setSelected(null)}}><section className="pv-modal" role="dialog" aria-modal="true" aria-label="Checkout details"><div className="pv-modal-head"><div><h2>Checkout details</h2><p>Last activity {dateTime(selected.updated_at)}</p></div><button className="pv-icon-button" aria-label="Close" onClick={() => setSelected(null)} disabled={saving}><X size={18}/></button></div><div className="pv-modal-body"><div className="pv-detail-grid"><div><small>Activity</small><strong>{activityOf(selected)}</strong><p>Started {dateTime(selected.created_at)}</p></div><div><small>Follow-up</small><ReviewBadge value={reviewOf(selected)}/><p>No payment is confirmed here.</p></div><div><small>Customer</small><strong>{selected.customer_name || 'Not entered'}</strong><p>{selected.customer_email ? <a href={`mailto:${selected.customer_email}`}>{selected.customer_email}</a> : 'Email not entered'}<br/>{selected.customer_phone ? <a href={`tel:${selected.customer_phone}`}>{selected.customer_phone}</a> : 'Phone not entered'}</p></div><div><small>Delivery address</small><strong>{selected.address || 'Not entered'}</strong><p>{[selected.city,selected.state,selected.pincode].filter(Boolean).join(', ') || 'Not entered'}</p></div><div><small>Product</small><strong>{selected.product_name}</strong><p>Quantity: {selected.quantity}</p></div><div><small>Estimated total</small><strong>{toCurrency(selected.amount)}</strong></div></div>{error && <div className="pv-alert pv-error" role="alert"><AlertTriangle size={16}/>{error}</div>}{notice && <div className="pv-help" role="status">{notice}</div>}<div className="pv-field-grid pv-detail-controls"><label className="pv-field"><span>Follow-up status</span><select value={draft.review_status} onChange={event => setDraft(current => ({...current,review_status:event.target.value}))} disabled={saving || !reviewReady}>{reviewStates.map(([key,name]) => <option key={key} value={key}>{name}</option>)}</select></label><label className="pv-field pv-span-2"><span>Private follow-up note</span><textarea rows={3} maxLength={1000} value={draft.review_note} onChange={event => setDraft(current => ({...current,review_note:event.target.value}))} disabled={saving || !reviewReady} placeholder="Call outcome, next step, or reason for archiving"/></label></div></div><div className="pv-modal-footer pv-order-modal-actions"><button className="pv-btn pv-btn-outline" onClick={() => save(selected.review_status === 'archived' ? 'pending' : 'archived')} disabled={saving || !reviewReady}>{selected.review_status === 'archived' ? <RotateCcw size={16}/> : <Archive size={16}/>} {selected.review_status === 'archived' ? 'Restore' : 'Archive'}</button><button className="pv-btn pv-btn-dark" onClick={() => save()} disabled={saving || !reviewReady}>{saving?'Saving…':'Save follow-up'}</button></div></section></div>}
  </>;
}
