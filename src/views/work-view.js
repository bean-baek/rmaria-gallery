import { works, seriesMeta } from '../works.js';

export function render(container, { slug }) {
  const work = works.find(w => w.slug === slug);
  if (!work) {
    location.hash = '#/';
    return;
  }

  // Compute prev/next within the same series (wraparound)
  const sameSeries = works.filter(w => w.series === work.series);
  const idxInSeries = sameSeries.findIndex(w => w.slug === work.slug);
  const prev = sameSeries[(idxInSeries - 1 + sameSeries.length) % sameSeries.length];
  const next = sameSeries[(idxInSeries + 1) % sameSeries.length];
  const seriesEnTitle = seriesMeta[work.series].titleEn.toUpperCase();

  // Build lightbox DOM
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', `${work.title} ${work.titleEn}`);

  const counterText = `${String(idxInSeries + 1).padStart(2, '0')} / ${String(sameSeries.length).padStart(2, '0')} · ${seriesEnTitle}`;
  const metaParts = [];
  if (work.location) metaParts.push(work.location.toUpperCase());
  metaParts.push(seriesEnTitle);
  const metaText = metaParts.join(' · ');

  lightbox.innerHTML = `
    <header class="lightbox__top">
      <a href="#/" class="lightbox__close" aria-label="Close">✕</a>
      <span class="lightbox__counter mono">${counterText}</span>
    </header>
    <div class="lightbox__stage">
      <a href="#/work/${prev.slug}" class="lightbox__arrow lightbox__arrow--prev" aria-label="Previous">←</a>
      <figure class="lightbox__figure">
        <img src="/works/full/${work.image}.jpg" alt="${escapeHtml(work.title)}" />
      </figure>
      <a href="#/work/${next.slug}" class="lightbox__arrow lightbox__arrow--next" aria-label="Next">→</a>
    </div>
    <footer class="lightbox__caption">
      <h2 class="lightbox__title">${escapeHtml(work.title)}</h2>
      <p class="lightbox__title-en">${escapeHtml(work.titleEn)}</p>
      <p class="lightbox__meta mono">${escapeHtml(metaText)}</p>
      <a class="lightbox__inquire" href="#/inquire?work=${work.slug}">INQUIRE ABOUT THIS WORK</a>
    </footer>
  `;

  container.replaceChildren(lightbox);

  // Lock body scroll while lightbox is open
  const prevBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  // Prefetch neighbor full images
  const prefetchLinks = [prev, next].map(w => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = `/works/full/${w.image}.jpg`;
    document.head.appendChild(link);
    return link;
  });

  // Backdrop click closes (only if click target IS the lightbox container itself)
  function onBackdropClick(e) {
    if (e.target === lightbox) {
      location.hash = '#/';
    }
  }
  lightbox.addEventListener('click', onBackdropClick);

  // Keyboard navigation
  function onKeydown(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.key === 'ArrowLeft' || e.key === 'h') {
      location.hash = `#/work/${prev.slug}`;
    } else if (e.key === 'ArrowRight' || e.key === 'l') {
      location.hash = `#/work/${next.slug}`;
    } else if (e.key === 'Escape' || e.key === 'Backspace') {
      e.preventDefault();
      location.hash = '#/';
    }
  }
  document.addEventListener('keydown', onKeydown);

  // Dispose
  return function dispose() {
    lightbox.removeEventListener('click', onBackdropClick);
    document.removeEventListener('keydown', onKeydown);
    prefetchLinks.forEach(link => link.parentNode?.removeChild(link));
    document.body.style.overflow = prevBodyOverflow;
  };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
