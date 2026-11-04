import {useEffect, useState} from 'react';
import {PRODUCT_PATH, SITE} from '../data/catalog';
import {getSeoPage} from '../data/seo';
import {useRoute} from '../hooks/useRoute';

function setMeta(attribute, name, content) {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function SeoHead() {
  const route = useRoute();
  const [catalogRevision, setCatalogRevision] = useState(0);

  useEffect(() => {
    const update = () => setCatalogRevision(value => value + 1);
    window.addEventListener('store:catalog-updated', update);
    return () => window.removeEventListener('store:catalog-updated', update);
  }, []);

  useEffect(() => {
    const page = getSeoPage(route);
    document.title = page.title;
    setMeta('name', 'description', page.description);
    setMeta('name', 'robots', page.robots);
    setMeta('property', 'og:site_name', SITE.name);
    setMeta('property', 'og:locale', 'en_IN');
    setMeta('property', 'og:title', page.title);
    setMeta('property', 'og:description', page.description);
    setMeta('property', 'og:type', route === PRODUCT_PATH ? 'product' : 'website');
    setMeta('property', 'og:url', page.url);
    setMeta('property', 'og:image', page.image);
    setMeta('property', 'og:image:alt', page.imageAlt);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', page.title);
    setMeta('name', 'twitter:description', page.description);
    setMeta('name', 'twitter:image', page.image);
    setMeta('name', 'twitter:image:alt', page.imageAlt);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = page.url;

    let structuredData = document.getElementById('seo-json-ld');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.id = 'seo-json-ld';
      structuredData.type = 'application/ld+json';
      document.head.appendChild(structuredData);
    }
    if (page.robots.startsWith('index')) structuredData.textContent = JSON.stringify({'@context': 'https://schema.org', '@graph': page.graph});
    else structuredData.remove();
  }, [route, catalogRevision]);

  return null;
}
