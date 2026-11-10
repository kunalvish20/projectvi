const RECEIPT_KEY = 'projectvi_last_order_receipt';

// The video flow is the default until PayU is explicitly enabled at build time.
export const isPreviewCheckout = import.meta.env?.VITE_PAYMENT_MODE !== 'payu';

export function createPreviewReceipt({customer, quantity, amount, handlingFee, orderId}) {
  const suffix = Array.from(crypto.getRandomValues(new Uint8Array(5)), byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  return {
    kind: 'preview',
    orderId: orderId || `PV-${suffix}`,
    customerName: customer.name,
    email: customer.email,
    quantity,
    amount,
    handlingFee
  };
}

export function saveOrderReceipt(receipt) {
  sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(receipt));
}

export function getOrderReceipt(orderId) {
  try {
    const receipt = JSON.parse(sessionStorage.getItem(RECEIPT_KEY) || 'null');
    if (!receipt || !orderId) return null;
    if (receipt.demo === true || receipt.orderId !== orderId) return null;
    return receipt.kind === 'preview' || receipt.transactionId ? receipt : null;
  } catch {
    return null;
  }
}
