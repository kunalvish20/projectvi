export const HANDLING_FEE = 299;

export function getOrderTotal(unitPrice, quantity) {
  return Number(unitPrice) * quantity + HANDLING_FEE;
}
