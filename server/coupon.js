const COUPON_CODE = 'Dax1';

export function couponPrice(code, unitPrice, quantity) {
  const normalized = String(code ?? '').trim();
  if (!normalized) return {amount: Number(unitPrice) * quantity, coupon: null};
  if (process.env.ENABLE_DAX1_COUPON !== 'true') throw new Error('Coupon codes are currently unavailable.');
  if (normalized.toLowerCase() !== COUPON_CODE.toLowerCase()) throw new Error('Invalid coupon code.');
  return {amount: 1, coupon: COUPON_CODE};
}
