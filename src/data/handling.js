export const HANDLING_OPTIONS = Object.freeze({
  standard: Object.freeze({
    id: 'standard',
    label: 'Standard handling',
    fee: 0,
    description: 'Carefully packed for dispatch.'
  }),
  premium: Object.freeze({
    id: 'premium',
    label: 'Premium handling',
    fee: 500,
    description: 'Extra protective packing for your box.'
  })
});

export const getHandlingOption = id => Object.hasOwn(HANDLING_OPTIONS, id) ? HANDLING_OPTIONS[id] : null;

export function getOrderTotal(unitPrice, quantity, handlingId) {
  const handling = getHandlingOption(handlingId);
  if (!handling) throw new Error('Invalid handling option.');
  return Number(unitPrice) * quantity + handling.fee;
}
