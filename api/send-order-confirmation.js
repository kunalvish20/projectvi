import {json, readBody} from '../server/http.js';
import {verifyAdminRequest} from '../server/adminAuth.js';
import {ORDER_CONFIRMATION_SUBJECT, orderConfirmationInput, orderConfirmationMessage} from '../src/lib/orderConfirmationEmail.js';

const senderConfig = () => {
  const from = (process.env.ORDER_EMAIL_FROM || '').trim();
  const password = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '');
  return from && password && /^[^\s@]+@gmail\.com$/i.test(from) && !/paste_|placeholder/i.test(password)
    ? {from, password} : null;
};

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return json(res, 405, {error:'Method not allowed.'});
  try {
    if (!(await verifyAdminRequest(req))) return json(res, 403, {error:'Admin access required. Please sign in again.'});
    if (req.method === 'GET') return json(res, 200, {configured:Boolean(senderConfig())});
    let input;
    try { input = orderConfirmationInput(await readBody(req)); }
    catch (error) { return json(res, 400, {error:error.message}); }
    const sender = senderConfig();
    if (!sender) return json(res, 503, {error:'Email sending is not configured. Set ORDER_EMAIL_FROM and GMAIL_APP_PASSWORD on the server.'});
    const {default: nodemailer} = await import('nodemailer');
    const transport = nodemailer.createTransport({service:'gmail', auth:{user:sender.from, pass:sender.password}});
    const result = await transport.sendMail({
      from: `Project VI <${sender.from}>`, to:input.to, replyTo:sender.from,
      subject:ORDER_CONFIRMATION_SUBJECT, text:orderConfirmationMessage(input)
    });
    if (!result.accepted?.some(address => address.toLowerCase() === input.to)) {
      return json(res, 502, {error:'Email provider did not accept this recipient. Please try again.'});
    }
    return json(res, 200, {ok:true});
  } catch (error) {
    console.error('send-order-confirmation', error.code || error.message);
    return json(res, 503, {error:'Could not send the email. Check the server email configuration and try again.'});
  }
}
