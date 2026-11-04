const RECEIPT_KEY = 'projectvi_last_order_receipt';

// A live PayU charge must be an explicit deployment choice. Fresh installs use
// the browser-only demo checkout until the gateway and database are ready.
export const isDemoPayment = import.meta.env.VITE_PAYMENT_MODE?.trim().toLowerCase() !== 'payu';

export function saveOrderReceipt(receipt) {
  sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(receipt));
}

export function getOrderReceipt(orderId) {
  try {
    const receipt = JSON.parse(sessionStorage.getItem(RECEIPT_KEY) || 'null');
    if (!receipt || !orderId) return null;
    const normalizedId = value => value?.replace(/^DEMO-(?=PV-)/, '');
    const matches = receipt.demo ? normalizedId(receipt.orderId) === normalizedId(orderId) : receipt.orderId === orderId;
    if (!matches) return null;
    if (receipt.demo && receipt.orderId !== normalizedId(receipt.orderId)) {
      receipt.orderId = normalizedId(receipt.orderId);
      delete receipt.transactionId;
      saveOrderReceipt(receipt);
    }
    return receipt;
  } catch {
    return null;
  }
}

export function createDemoReceipt({customer, quantity, amount}) {
  const suffix = Array.from(crypto.getRandomValues(new Uint8Array(5)), byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  return {
    orderId: `PV-${suffix}`,
    customerName: customer.name,
    email: customer.email,
    quantity,
    amount,
    demo: true
  };
}
