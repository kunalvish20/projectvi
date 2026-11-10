import {db, getProduct} from '../server/db.js';
import {clean, json, readBody} from '../server/http.js';
import {getOrderTotal} from '../src/data/handling.js';

export function checkoutDraftInput(input = {}) {
  const id = clean(input.id, 36);
  const quantity = Number(input.quantity);
  const customer = input.customer || {};
  const details = {
    customer_name: clean(customer.name, 100),
    customer_email: clean(customer.email, 180).toLowerCase(),
    customer_phone: clean(customer.phone, 15),
    address: clean(customer.address, 300),
    city: clean(customer.city, 80),
    state: clean(customer.state, 80),
    pincode: clean(customer.pincode, 6)
  };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    || !Number.isInteger(quantity) || quantity < 1 || quantity > 10
    || !Object.values(details).some(Boolean)
    || !/^[0-9]*$/.test(details.customer_phone)
    || !/^[0-9]*$/.test(details.pincode)) {
    throw new Error('Invalid checkout details.');
  }
  return {id, quantity, ...details, status: input.status === 'whatsapp_opened' ? 'whatsapp_opened' : 'editing'};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, {error: 'Method not allowed.'});
  try {
    const draft = checkoutDraftInput(await readBody(req));
    const product = await getProduct('gta-collector-box');
    if (!product?.active || Number(product.price) <= 0) return json(res, 409, {error: 'Product unavailable.'});
    await db('checkout_drafts', {method: 'POST', query: '?on_conflict=id', body: {
      ...draft, product_id: product.id, product_name: product.name,
      amount: getOrderTotal(Number(product.price), draft.quantity),
      ...(draft.status === 'whatsapp_opened' ? {whatsapp_opened_at: new Date().toISOString()} : {})
    }, prefer: 'resolution=merge-duplicates,return=minimal'});
    return json(res, 200, {saved: true});
  } catch (error) {
    console.error('checkout-draft', error.message);
    return json(res, 503, {error: 'Checkout details could not be saved.'});
  }
}
