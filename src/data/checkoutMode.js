// WhatsApp is the active checkout route until PayU is explicitly enabled.
export const isPayUCheckout = import.meta.env?.VITE_CHECKOUT_MODE === 'payu';
