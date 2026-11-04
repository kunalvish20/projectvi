import {useEffect, useState} from 'react';

const getRoute = () => {
  // Keep links from the older hash-based storefront working.
  if (location.hash.startsWith('#/')) {
    const legacyPath = location.hash.slice(1).split('?')[0];
    history.replaceState(null, '', legacyPath || '/');
  }

  return location.pathname.replace(/\/+$/, '') || '/';
};

export function go(path) {
  if (path === `${getRoute()}${location.search}`) return;
  if (path.split('?')[0] === '/checkout') window.clarity?.('event', 'checkout_started');
  history.pushState(null, '', path);
  dispatchEvent(new Event('store:navigate'));
}

export function useRoute() {
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const handleRoute = () => {
      setRoute(getRoute());
      scrollTo({top: 0, behavior: 'smooth'});
    };

    addEventListener('popstate', handleRoute);
    addEventListener('store:navigate', handleRoute);
    return () => {
      removeEventListener('popstate', handleRoute);
      removeEventListener('store:navigate', handleRoute);
    };
  }, []);

  return route;
}
