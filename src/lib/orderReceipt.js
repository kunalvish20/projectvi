const RECEIPT_KEY = 'projectvi_last_order_receipt';

export const isDemoPayment = import.meta.env.VITE_PAYMENT_MODE === 'demo';

export function saveOrderReceipt(receipt) {
  sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(receipt));
}

export function getOrderReceipt(orderId) {
  try {
    const receipt = JSON.parse(sessionStorage.getItem(RECEIPT_KEY) || 'null');
    return receipt?.orderId === orderId ? receipt : null;
  } catch {
    return null;
  }
}

export function createDemoReceipt({customer, quantity, amount}) {
  const suffix = Array.from(crypto.getRandomValues(new Uint8Array(5)), byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  return {
    orderId: `DEMO-PV-${suffix}`,
    transactionId: `DEMO-TXN-${suffix}`,
    customerName: customer.name,
    email: customer.email,
    quantity,
    amount,
    demo: true
  };
}
