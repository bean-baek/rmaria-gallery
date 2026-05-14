let lastIndexScroll = 0;

function parseHash(hash) {
  const clean = hash.replace(/^#\/?/, '');
  if (!clean || clean.startsWith('?')) return { name: 'index', params: {} };

  // Strip trailing query string for matching
  const qIdx = clean.indexOf('?');
  const path = qIdx === -1 ? clean : clean.slice(0, qIdx);
  const queryStr = qIdx === -1 ? '' : clean.slice(qIdx + 1);
  const query = Object.fromEntries(new URLSearchParams(queryStr));

  const workMatch = path.match(/^work\/(.+)$/);
  if (workMatch) return { name: 'work', params: { slug: decodeURIComponent(workMatch[1]) } };

  if (path === 'inquire') return { name: 'inquire', params: { workSlug: query.work || '' } };

  return { name: 'index', params: {} };
}

export function getLastIndexScroll() { return lastIndexScroll; }
export function saveIndexScroll() { lastIndexScroll = window.scrollY; }

export function startRouter({ container, views }) {
  let currentDispose = null;

  function onChange() {
    if (currentDispose) {
      currentDispose();
      currentDispose = null;
    }

    const route = parseHash(location.hash);
    const view = views[route.name] ?? views.index;
    const scrollTarget = route.name === 'index' ? lastIndexScroll : 0;

    const maybeDispose = view.render(container, route.params);
    if (typeof maybeDispose === 'function') currentDispose = maybeDispose;

    requestAnimationFrame(() => window.scrollTo(0, scrollTarget));
  }

  history.scrollRestoration = 'manual';
  window.addEventListener('hashchange', onChange);
  onChange();

  return () => window.removeEventListener('hashchange', onChange);
}
