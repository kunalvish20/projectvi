const checkoutFields = [
  ['name', value => value.length >= 2],
  ['email', value => /^\S+@\S+\.\S+$/.test(value)],
  ['phone', value => /^\d{10}$/.test(value)],
  ['address', value => value.length >= 5],
  ['city', value => value.length >= 2],
  ['state', value => value.length >= 2],
  ['pincode', value => /^\d{6}$/.test(value)]
];

export function firstInvalidCheckoutField(form = {}) {
  return checkoutFields.find(([field, isValid]) => !isValid(String(form[field] ?? '').trim()))?.[0] ?? null;
}

export function isCheckoutFormComplete(form) {
  return firstInvalidCheckoutField(form) === null;
}
