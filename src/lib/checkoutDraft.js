const KEY = 'projectvi_checkout_draft_id';

export function getCheckoutDraftId() {
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

export function releaseCheckoutDraftId() {
  sessionStorage.removeItem(KEY);
}

export function hasCheckoutDetails(customer) {
  return Object.values(customer).some(value => String(value || '').trim());
}

export function saveCheckoutDraft({id, quantity, customer, status = 'editing', keepalive = false}) {
  return fetch('/api/checkout-draft', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id, quantity, customer, status}), keepalive
  });
}
