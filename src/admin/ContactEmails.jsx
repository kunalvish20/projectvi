import {useEffect, useMemo, useState} from 'react';
import {AlertTriangle, RefreshCw, Search} from 'lucide-react';
import {adminListAll} from '../lib/supabase';

const dateTime = value => value ? new Date(value).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'short'}) : '—';

export function ContactEmails() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try { setRows(await adminListAll('contact_emails')); }
    catch { setError('Contact emails are unavailable. Run supabase/contact-emails.sql in the connected Supabase project.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const shown = useMemo(() => rows.filter(row => row.email.toLowerCase().includes(search.toLowerCase())), [rows, search]);

  return <>
    <div className="pv-page-intro"><div><span className="pv-eyebrow">CONTACT PAGE</span><h1>Contact emails</h1><p>Email addresses submitted on the Contact Us page.</p></div></div>
    {error && <div className="pv-alert pv-error" role="alert"><AlertTriangle size={16}/>{error}</div>}
    <section className="pv-panel pv-data-panel">
      <div className="pv-table-toolbar"><div className="pv-search"><Search size={16}/><input aria-label="Search contact emails" placeholder="Search email..." value={search} onChange={event => setSearch(event.target.value)}/></div><span>{shown.length} emails</span><button className="pv-btn pv-btn-outline pv-small-btn" type="button" onClick={load}><RefreshCw size={15}/> Refresh</button></div>
      {loading ? <div className="pv-loading">Loading contact emails...</div> : shown.length ? <div className="pv-table-wrap"><table><thead><tr><th>Received</th><th>Email</th></tr></thead><tbody>{shown.map(row => <tr key={row.id}><td>{dateTime(row.created_at)}</td><td><a href={`mailto:${row.email}`} className="pv-record-link">{row.email}</a></td></tr>)}</tbody></table></div> : <div className="pv-loading">{search ? 'No matching emails.' : 'No contact emails yet.'}</div>}
    </section>
  </>;
}
