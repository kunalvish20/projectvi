import {SITE} from './catalog.js';
import {isPayUCheckout} from './checkoutMode.js';

export const INFO_PAGES = {
  shipping: {
    eyebrow: 'Delivery',
    title: 'Shipping & Delivery',
    copy: isPayUCheckout
      ? "Buy the GTA VI Collector's Box through checkout. Keep your contact and shipping information accurate for dispatch and tracking updates."
      : "Buy the GTA VI Collector's Box by sending an order request through checkout. Keep your contact and shipping information accurate. Our team will confirm availability and dispatch details before payment.",
    bullets: ["Standard delivery is free; a ₹299 handling charge is included in the order total", 'Review your delivery address before making payment', 'Contact support with your payment ID if an order is delayed or unfulfilled']
  },
  privacy: {
    eyebrow: 'Policy',
    title: 'Privacy Policy',
    copy: `${SITE.name} saves submitted creator applications and checkout contact and delivery details for review in a private admin dashboard. WhatsApp order requests share the prepared customer message with WhatsApp only when the customer sends it; our team confirms payment and fulfilment separately. Real PayU orders, when enabled, are used to verify payments and arrange delivery. We also use Microsoft Clarity to understand how visitors use this website.`,
    bullets: ['Cart data stays in your browser until you submit checkout', 'Submitted creator applications and checkout details are stored for admin review when the database is configured', 'WhatsApp order requests do not collect payment on this site', 'Microsoft Clarity collects usage data such as page visits, clicks, scrolling, and session recordings; checkout and creator form content is masked'],
    sections: [{
      heading: 'Website analytics',
      copy: 'Microsoft Clarity may use cookies and similar technologies to measure website use. Clarity recordings help us improve the site. Form entries and payment IDs are masked from recordings. Microsoft processes the analytics data under its own privacy terms.'
    }]
  },
  contact: {
    eyebrow: 'Help',
    title: 'Contact Us',
    copy: SITE.supportEmail || SITE.supportPhone
      ? `Reach ${SITE.name} support for order help, delivery questions, payment confirmation, or product-care requests.`
      : `Support contact details for ${SITE.name} will be published here soon. Keep your payment ID for any order enquiry.`,
    bullets: [SITE.supportEmail, SITE.supportPhone, SITE.supportEmail || SITE.supportPhone ? SITE.supportHours : 'Support contact details will be published here soon.'].filter(Boolean)
  },
  terms: {
    eyebrow: 'Policy',
    title: 'Terms of Service',
    copy: "Review the Collector's Box details, INR price, quantity, and delivery information before requesting an order. Paid orders are final sale for a change of mind. Applicable consumer rights remain in place.",
    bullets: ['Prices and order totals are shown in INR before payment', 'Change-of-mind returns and cancellations are not offered after payment', 'For a defective, incorrect, delayed, or unfulfilled order, contact support with your payment ID and photos where relevant']
  },
  payment: {
    eyebrow: 'Security',
    title: 'Payment Security',
    copy: isPayUCheckout ? 'Checkout is powered by PayU. Payment verification happens through server APIs.' : 'Online payment is temporarily unavailable. Send an order request on WhatsApp; our team will confirm availability, total and payment instructions in chat. No payment is collected on this site.',
    bullets: isPayUCheckout ? ['No card details are stored by the React storefront', 'Payment signature is verified after checkout', 'Order totals are shown before payment opens'] : ['The checkout shows an estimated total before WhatsApp opens', 'Sending the WhatsApp message requests an order; it is not a payment confirmation', 'Do not send card or UPI credentials in chat']
  },
  'order-status': {
    eyebrow: 'Orders',
    title: 'Track Order',
    copy: 'Use your payment reference, email, or phone number when contacting support. Tracking details are sent after your order is confirmed and dispatched.',
    bullets: ['Payment ID helps verify order status faster', 'Dispatch updates are shared on email and SMS', 'Support can confirm payment and delivery details']
  },
  warranty: {
    eyebrow: 'Care',
    title: 'Product Care',
    copy: "Store Collector's Edition items away from direct sunlight, heat, moisture, and rough handling. These care tips do not affect rights available under applicable consumer law.",
    bullets: ['Keep packaging and order details if you need to report an issue', 'Avoid bending printed inserts and poster material', 'Use a dry microfiber cloth for display items']
  }
};
