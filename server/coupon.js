export function couponPrice(code, unitPrice, quantity) {
  const normalized = String(code ?? '').trim();
  if (!normalized) return {amount: Number(unitPrice) * quantity, coupon: null};
  const activeCode = process.env.PAYU_COUPON_CODE?.trim();
  if (process.env.ENABLE_PAYU_COUPON !== 'true' || !activeCode) throw new Error('Coupon codes are currently unavailable.');
  if (normalized.toLowerCase() !== activeCode.toLowerCase()) throw new Error('Invalid coupon code.');
  return {amount: 1, coupon: activeCode};
}
