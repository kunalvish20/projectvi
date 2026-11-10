import {db} from '../server/db.js';
import {json, readBody} from '../server/http.js';
import {creatorApplication} from '../server/submissions.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, {error: 'Method not allowed.'});
  try {
    const body = await readBody(req);
    if (body.website) return json(res, 201, {ok: true});
    let application;
    try { application = creatorApplication(body); }
    catch (error) { return json(res, 400, {error: error.message}); }
    await db('creator_applications', {method: 'POST', body: application, prefer: 'return=minimal'});
    return json(res, 201, {ok: true});
  } catch (error) {
    console.error('creator-apply', error.message);
    return json(res, 503, {error: 'Could not save your application. Please try again.'});
  }
}
