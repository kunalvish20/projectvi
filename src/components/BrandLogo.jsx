import {SITE} from '../data/catalog';
import {go} from '../hooks/useRoute';

export function BrandLogo() {
  return (
    <a className="brand" href="/" aria-label={`${SITE.name} home`} onClick={event => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      go('/');
    }}>
      <span className="brand-logo-frame">
        <img src="/assets/mainlogo.png" alt={SITE.name} width="1774" height="887" decoding="async" />
      </span>
    </a>
  );
}
