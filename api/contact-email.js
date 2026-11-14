import {db} from '../server/db.js';
import {json, readBody} from '../server/http.js';
import {contactEmailInput} from '../server/contactEmail.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, {error: 'Method not allowed.'});
  try {
    const body = await readBody(req);
    if (body.website) return json(res, 201, {ok: true});
    let submission;
    try { submission = contactEmailInput(body); }
    catch (error) { return json(res, 400, {error: error.message}); }
    await db('contact_emails', {method: 'POST', body: submission, prefer: 'return=minimal'});
    return json(res, 201, {ok: true});
  } catch (error) {
    console.error('contact-email', error.message);
    return json(res, 503, {error: 'Could not save your email. Please try again.'});
  }
}
