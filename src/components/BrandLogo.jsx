import {SITE} from '../data/catalog';
import {go} from '../hooks/useRoute';

export function BrandLogo() {
  return (
    <a className="brand" href="/" aria-label={`${SITE.name} home`} onClick={event => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      go('/');
    }}>
      <span className="brand-mark">{SITE.shortName}</span>
    </a>
  );
}
