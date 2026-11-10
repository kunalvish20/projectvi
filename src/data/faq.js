import {PRODUCT} from './catalog.js';
import {isPayUCheckout} from './checkoutMode.js';
import {format} from '../lib/format.js';

export const FAQ_ITEMS = [
  ['Can I buy now?', `Yes. ${PRODUCT.name} is priced at ${format(PRODUCT.price)}. ${isPayUCheckout ? 'Continue through secure checkout to place your order.' : 'Continue through checkout to send your order request on WhatsApp.'}`],
  ['What is included in the box?', "The box includes 11 Collector's Edition items. The gallery lists every piece, with the map design revealed inside the box."],
  ['How do I pay?', isPayUCheckout ? 'Checkout is handled by PayU, and payment verification happens through server APIs.' : 'Online payment is temporarily unavailable. Send your order request on WhatsApp; our team will confirm availability and payment instructions. No payment is collected on this page.'],
  ['When will my order ship?', 'Our team will confirm availability and dispatch details after receiving your order request. Tracking updates are shared after dispatch.'],
  ['How do I get support?', 'Support contact details will be published on the Contact page. Please keep your payment ID for faster order lookup.']
];
