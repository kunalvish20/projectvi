import crypto from 'node:crypto';
import {db, getProduct} from '../server/db.js';
import {json, readBody} from '../server/http.js';
import {checkoutDetails} from '../server/submissions.js';
import {HANDLING_FEE, getOrderTotal} from '../src/data/handling.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, {error: 'Method not allowed.'});
  if (process.env.VITE_PAYMENT_MODE === 'payu') return json(res, 409, {error: 'Preview checkout is unavailable.'});
  try {
    const body = await readBody(req);
    let details;
    try { details = checkoutDetails(body); }
    catch (error) { return json(res, 400, {error: error.message}); }
    const product = await getProduct('gta-collector-box');
    if (!product?.active || !Number.isFinite(Number(product.price)) || Number(product.price) <= 0 || Number(product.inventory) < details.quantity) return json(res, 409, {error: 'This product is currently unavailable.'});
    const amount = getOrderTotal(Number(product.price), details.quantity);
    const reference = `PV-PREV-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    await db('checkout_submissions', {method: 'POST', body: {
      reference, product_id: product.id, product_name: product.name,
      quantity: details.quantity, amount, handling_fee: HANDLING_FEE,
      customer_name: details.name, customer_email: details.email,
      customer_phone: details.phone, address: details.address,
      city: details.city, state: details.state, pincode: details.pincode
    }, prefer: 'return=minimal'});
    return json(res, 201, {reference, amount, handlingFee: HANDLING_FEE});
  } catch (error) {
    console.error('checkout-preview', error.message);
    return json(res, 503, {error: 'Could not save your checkout details. Please try again.'});
  }
}
