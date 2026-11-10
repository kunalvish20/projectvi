import {SITE} from './catalog.js';

export const INFO_PAGES = {
  shipping: {
    eyebrow: 'Delivery',
    title: 'Shipping & Delivery',
    copy: "The GTA VI Collector's Box is a pre-order. Check the delivery details shown during checkout and keep your contact and shipping information accurate. Contact support with your payment ID if you have a question about dispatch or delivery.",
    bullets: ["Standard delivery is free; a ₹299 handling charge is included in the order total", 'Review your delivery address before making payment', 'Contact support with your payment ID if an order is delayed or unfulfilled']
  },
  privacy: {
    eyebrow: 'Policy',
    title: 'Privacy Policy',
    copy: `${SITE.name} saves submitted creator applications and checkout contact and delivery details for review in a private admin dashboard. Real PayU orders are used to verify payments, arrange delivery, provide support, and communicate with customers. Preview checkout submissions do not collect payment or create an order. We also use Microsoft Clarity to understand how visitors use this website.`,
    bullets: ['Cart data stays in your browser until you submit checkout', 'Submitted creator applications and checkout details are stored for admin review', 'Payment is handled through PayU when live checkout is enabled', 'Microsoft Clarity collects usage data such as page visits, clicks, scrolling, and session recordings; checkout and creator form content is masked'],
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
    copy: "Review the Collector's Box details, INR price, quantity, and delivery information before placing a pre-order. Paid orders are final sale for a change of mind. Applicable consumer rights remain in place.",
    bullets: ['Prices and order totals are shown in INR before payment', 'Change-of-mind returns and cancellations are not offered after payment', 'For a defective, incorrect, delayed, or unfulfilled order, contact support with your payment ID and photos where relevant']
  },
  payment: {
    eyebrow: 'Security',
    title: 'Payment Security',
    copy: 'Checkout is powered by PayU. The browser receives a short-lived order ID and public key, while payment verification happens through server APIs.',
    bullets: ['No card details are stored by the React storefront', 'Payment signature is verified after checkout', 'Order totals are shown before payment opens']
  },
  'order-status': {
    eyebrow: 'Orders',
    title: 'Track Order',
    copy: 'Use your payment ID, email, or phone number when contacting support. Tracking details are sent after the preorder moves to dispatch.',
    bullets: ['Payment ID helps verify order status faster', 'Dispatch updates are shared on email and SMS', 'Support can confirm payment and delivery details']
  },
  warranty: {
    eyebrow: 'Care',
    title: 'Product Care',
    copy: "Store Collector's Edition items away from direct sunlight, heat, moisture, and rough handling. These care tips do not affect rights available under applicable consumer law.",
    bullets: ['Keep packaging and order details if you need to report an issue', 'Avoid bending printed inserts and poster material', 'Use a dry microfiber cloth for display items']
  }
};
