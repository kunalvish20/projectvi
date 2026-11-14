import {ArrowRight, CheckCircle, Mail, ShieldCheck} from 'lucide-react';
import {PRODUCT_PATH, SITE} from '../data/catalog';
import {INFO_PAGES} from '../data/infoPages';
import {useState} from 'react';

export function InfoPage({type = 'contact'}) {
  const page = INFO_PAGES[type] || INFO_PAGES.contact;
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const submitContactEmail = async event => {
    event.preventDefault();
    if (submitting) return;
    setStatus(''); setError(''); setSubmitting(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch('/api/contact-email', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: data.get('email'), website: data.get('website')})
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not save your email.');
      form.reset();
      setStatus('Thanks! Your email has been received.');
    } catch (submitError) {
      setError(submitError.message || 'Could not save your email. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <main className="page">
      <section className="page-hero">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{page.title}.</h1>
      </section>
      <section className="info-static">
        <div className="info-card">
          <ShieldCheck />
          <p className="eyebrow">{SITE.name}</p>
          <h2>{page.title}</h2>
          <p>{page.copy}</p>
          <ul>
            {page.bullets.map(item => (
              <li key={item}><CheckCircle size={17} /> {item}</li>
            ))}
          </ul>
          {type === 'contact' && <form className="contact-email-form" data-clarity-mask="true" onSubmit={submitContactEmail}>
            <h3>Leave your email</h3>
            <p>Enter your email address so our team can contact you.</p>
            <label className="contact-email-honeypot" aria-hidden="true">Website<input name="website" tabIndex="-1" autoComplete="off" /></label>
            <label htmlFor="contact-email">Your email address</label>
            <div className="contact-email-controls">
              <input id="contact-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={180} required disabled={submitting} />
              <button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit email'} <ArrowRight size={17} /></button>
            </div>
            {status && <p className="contact-email-success" role="status">{status}</p>}
            {error && <p className="contact-email-error" role="alert">{error}</p>}
          </form>}
          {page.sections?.map(section => (
            <section key={section.heading}>
              <h3>{section.heading}</h3>
              <p>{section.copy}</p>
            </section>
          ))}
          <div className="info-actions">
            <a href={PRODUCT_PATH}>Back to product <ArrowRight size={18} /></a>
            {SITE.supportEmail && <a href={`mailto:${SITE.supportEmail}`}><Mail size={18} /> Email support</a>}
          </div>
        </div>
      </section>
    </main>
  );
}
