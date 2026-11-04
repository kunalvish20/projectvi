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
        <img src="/assets/project-vi-neon-logo.png" alt={SITE.name} width="1724" height="912" decoding="async" />
      </span>
    </a>
  );
}
