import {PRODUCT} from './catalog.js';
import {isPayUCheckout} from './checkoutMode.js';
import {format} from '../lib/format.js';

export const FAQ_ITEMS = [
  ['Is this a pre-order?', `Yes. ${PRODUCT.name} is presented as a limited pre-order drop priced at ${format(PRODUCT.price)}.`],
  ['What is included in the box?', "The box includes 11 Collector's Edition items. The gallery lists every piece, with the map design revealed inside the box."],
  ['How do I pay?', isPayUCheckout ? 'Checkout is handled by PayU, and payment verification happens through server APIs.' : 'Online payment is temporarily unavailable. Send your order request on WhatsApp; our team will confirm availability and payment instructions. No payment is collected on this page.'],
  ['When will pre-orders ship?', 'Dispatch and tracking updates are shared through the email and phone number entered at checkout after the preorder moves into fulfilment.'],
  ['How do I get support?', 'Support contact details will be published on the Contact page. Please keep your payment ID for faster order lookup.']
];
