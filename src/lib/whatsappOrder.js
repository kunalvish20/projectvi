import {format} from './format.js';

export function buildWhatsAppOrderMessage({customer, productName, quantity, amount, reference}) {
  return [
    `Hi Project VI, I'd like to order ${productName}.`,
    `Qty: ${quantity} | Estimated total: ${format(amount)} (including handling)`,
    `Name: ${customer.name}`,
    `Phone: ${customer.phone}`,
    `Email: ${customer.email}`,
    `Delivery: ${customer.address}, ${customer.city}, ${customer.state} - ${customer.pincode}`,
    ...(reference ? [`Ref: ${reference}`] : []),
    'Please confirm availability and payment details.'
  ].join('\n');
}

export function buildWhatsAppOrderUrl(number, order) {
  const digits = String(number || '').replace(/\D/g, '');
  const destination = digits.length === 10 ? `91${digits}` : digits;
  if (!/^\d{11,15}$/.test(destination)) throw new Error('WhatsApp ordering is temporarily unavailable.');
  return `https://wa.me/${destination}?text=${encodeURIComponent(buildWhatsAppOrderMessage(order))}`;
}
