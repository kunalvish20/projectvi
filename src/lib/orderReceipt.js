const RECEIPT_KEY = 'projectvi_last_order_receipt';

export function saveOrderReceipt(receipt) {
  sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(receipt));
}

export function getOrderReceipt(orderId) {
  try {
    const receipt = JSON.parse(sessionStorage.getItem(RECEIPT_KEY) || 'null');
    if (!receipt || !orderId) return null;
    return receipt.demo !== true && receipt.orderId === orderId && receipt.transactionId ? receipt : null;
  } catch {
    return null;
  }
}
