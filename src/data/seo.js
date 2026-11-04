import {PRODUCT, PRODUCT_PATH, SITE} from './catalog.js';
import {FAQ_ITEMS} from './faq.js';
import {INFO_PAGES} from './infoPages.js';
import {format} from '../lib/format.js';

export const INDEXABLE_PATHS = ['/', PRODUCT_PATH, '/join-as-a-creator', ...Object.keys(INFO_PAGES).map(path => `/${path}`)];

export function getSeoPage(path) {
  const url = `${SITE.origin}${path}`;
  const image = `${SITE.origin}/assets/Gta-box.webp`;
  const imageAlt = `${PRODUCT.name} by ${SITE.name}`;
  const organization = {
    '@type': 'Organization',
    '@id': `${SITE.origin}/#organization`,
    name: SITE.name,
    url: SITE.origin
  };
  const website = {
    '@type': 'WebSite',
    '@id': `${SITE.origin}/#website`,
    name: SITE.name,
    url: `${SITE.origin}/`,
    publisher: {'@id': organization['@id']}
  };

  let title;
  let description;
  let heading;
  let robots = 'index,follow,max-image-preview:large';
  const graph = [organization, website];

  if (path === '/') {
    title = "GTA VI Collector's Box Pre-Order | Project VI";
    description = "Explore the 11-item GTA VI Collector's Box, preview featured collectibles, and pre-order with secure PayU checkout and free standard delivery.";
    heading = "GTA VI Collector's Edition";
  } else if (path === PRODUCT_PATH) {
    title = `${PRODUCT.name} | Pre-Order for ${format(PRODUCT.price)} | ${SITE.name}`;
    description = `Pre-order the 11-item ${PRODUCT.name} for ${format(PRODUCT.price)}. Explore the featured items, review delivery details, and check out securely with PayU.`;
    heading = PRODUCT.name;
    graph.push({
      '@type': 'Product',
      '@id': `${url}#product`,
      name: PRODUCT.name,
      description: PRODUCT.description,
      image: [image],
      sku: PRODUCT.id,
      brand: {'@type': 'Brand', name: SITE.name},
      category: PRODUCT.category,
      offers: {
        '@type': 'Offer',
        url,
        price: PRODUCT.price,
        priceCurrency: 'INR',
        itemCondition: 'https://schema.org/NewCondition',
        availability: 'https://schema.org/PreOrder',
        seller: {'@id': organization['@id']}
      }
    });
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        {'@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.origin}/`},
        {'@type': 'ListItem', position: 2, name: PRODUCT.name, item: url}
      ]
    });
    graph.push({
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map(([name, answer]) => ({
        '@type': 'Question',
        name,
        acceptedAnswer: {'@type': 'Answer', text: answer}
      }))
    });
  } else if (path.startsWith('/admin')) {
    title = `${SITE.name} | Admin Sign In`;
    description = 'Private administrative workspace for Project VI.';
    heading = 'Administrator sign-in';
    robots = 'noindex,nofollow';
  } else if (path === '/thank-you') {
    title = `Order confirmation | ${SITE.name}`;
    description = 'Your Project VI checkout confirmation.';
    heading = 'Order confirmation';
    robots = 'noindex,nofollow';
  } else if (path === '/join-as-a-creator') {
    title = `Join as a Creator | ${SITE.name}`;
    description = `Share your Instagram or YouTube channel to explore creator, promoter, or seller opportunities with ${SITE.name}.`;
    heading = 'Join as a Creator';
  } else if (INFO_PAGES[path.slice(1)]) {
    const page = INFO_PAGES[path.slice(1)];
    title = `${page.title} | ${SITE.name}`;
    description = page.copy;
    heading = page.title;
  } else {
    title = `${SITE.name} | Secure Checkout`;
    description = 'Review your order and complete your pre-order securely.';
    heading = path === '/cart' ? 'Your cart' : 'Checkout';
    robots = 'noindex,follow';
  }

  if (robots.startsWith('index')) {
    graph.push({
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: title,
      description,
      isPartOf: {'@id': website['@id']}
    });
  }

  return {path, url, image, imageAlt, title, description, heading, robots, graph};
}
