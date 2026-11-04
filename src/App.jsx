import {lazy, Suspense, useEffect, useState} from 'react';
import {CartDrawer} from './components/CartDrawer';
import {Footer} from './components/Footer';
import {Header} from './components/Header';
import {IntroLoader} from './components/IntroLoader';
import {SeoHead} from './components/SeoHead';
import {StoreProvider} from './context/StoreContext';
import {PRODUCT_PATH} from './data/catalog';
import {useRoute} from './hooks/useRoute';
import {Cart} from './pages/Cart';
import {Checkout} from './pages/Checkout';
import {CreatorPage} from './pages/CreatorPage';
import {Home} from './pages/Home';
import {HomeSecondary} from './pages/HomeSecondary';
import {InfoPage} from './pages/InfoPage';
import {ProductPage} from './pages/ProductPage';
const AdminApp = lazy(() => import('./admin/Admin').then(module => ({default: module.AdminApp})));

function RouteView() {
  const route = useRoute();

  if (route === '/' || route === '/home' || route === '/homepage-secondary' || route === '/home-secondary') return <HomeSecondary />;
  if (route === '/old-homepage' || route === '/old-home') return <Home />;
  if (route === PRODUCT_PATH || route.startsWith('/product/')) return <ProductPage />;
  if (route === '/cart') return <Cart />;
  if (route === '/checkout') return <Checkout />;
  if (route === '/join-as-a-creator') return <CreatorPage />;
  if (route === '/returns' || route === '/cancellation') return <InfoPage type="terms" />;
  if (['/shipping', '/privacy', '/contact', '/terms', '/payment', '/order-status', '/warranty'].includes(route)) return <InfoPage type={route.slice(1)} />;

  return <ProductPage />;
}

export function App() {
  const [showContent, setShowContent] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(() => window.location.pathname.startsWith('/admin'));

  useEffect(() => {
    const update = () => setIsAdminRoute(window.location.pathname.startsWith('/admin'));
    window.addEventListener('store:navigate', update);
    window.addEventListener('popstate', update);
    return () => {window.removeEventListener('store:navigate', update); window.removeEventListener('popstate', update);};
  }, []);

  if (isAdminRoute) return <Suspense fallback={<div style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f8f9fb',color:'#23242b',fontFamily:'Outfit, sans-serif'}}>Opening Project VI Admin…</div>}><AdminApp /></Suspense>;

  return (
    <>
      <SeoHead />
      <IntroLoader onComplete={() => setShowContent(true)} />
      {showContent && (
        <StoreProvider>
          <Header />
          <RouteView />
          <Footer />
          <CartDrawer />
        </StoreProvider>
      )}
    </>
  );
}
