export const ORDER_CONFIRMATION_SUBJECT = 'Your Project VI order is confirmed';

export function orderConfirmationInput(input = {}) {
  const to = String(input.to ?? '').trim().toLowerCase();
  const name = String(input.name ?? '').trim();
  const reference = String(input.reference ?? '').trim();
  if (to.length > 180 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error('Enter a valid customer email address.');
  if (name.length > 80 || /[\r\n]/.test(name)) throw new Error('Customer name is too long.');
  if (reference.length > 60 || /[\r\n]/.test(reference)) throw new Error('Order reference is too long.');
  if (input.paymentConfirmed !== true) throw new Error('Confirm that payment was received before sending.');
  return {to, name, reference};
}

export function orderConfirmationMessage({name = '', reference = ''} = {}) {
  const greeting = name ? `Hi ${name},` : 'Hello,';
  const order = reference ? `Your Project VI order (${reference}) is confirmed.` : 'Your Project VI order is confirmed.';
  return `${greeting}\n\n${order} We have received your payment. We will share dispatch and tracking details when your order ships.\n\nIf you have any questions, reply to this email.\n\nThank you,\nProject VI`;
}
