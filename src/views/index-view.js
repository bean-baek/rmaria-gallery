import { works, seriesMeta } from '../works.js';
import { saveIndexScroll } from '../router.js';
import { renderJustifiedRows, debounce } from './justified-layout.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Group works by series in seriesMeta order
function groupBySeries() {
  const seriesKeys = Object.keys(seriesMeta).sort(
    (a, b) => seriesMeta[a].order - seriesMeta[b].order
  );
  return seriesKeys.map(key => ({
    key,
    meta: seriesMeta[key],
    items: works.filter(w => w.series === key),
  }));
}

function buildWorkCell({ work }, { seriesCount, idx }) {
  const locationText = work.location ? `${escapeHtml(work.location)} · ` : '';
  const counter = `${String(idx + 1).padStart(2, '0')} / ${String(seriesCount).padStart(2, '0')}`;
  const link = document.createElement('a');
  link.href = `#/work/${work.slug}`;
  link.innerHTML = `
    <figure>
      <img
        src="/works/thumb/${work.image}.jpg"
        alt="${escapeHtml(work.title)}"
        loading="lazy"
      />
    </figure>
    <figcaption>
      <span class="cap__title">${escapeHtml(work.title)}</span>
      <span class="cap__title-en">${escapeHtml(work.titleEn)}</span>
      <span class="cap__meta mono">${locationText}${counter}</span>
    </figcaption>
  `;
  return link;
}

function getCarouselHeight() {
  const w = window.innerWidth;
  if (w >= 1024) return 360;
  if (w >= 640)  return 260;
  return 220;
}

function applyCarouselSizes(ul) {
  const height = getCarouselHeight();
  const items = ul.querySelectorAll('.series-carousel__item');
  items.forEach(li => {
    const aspect = parseFloat(li.dataset.aspect);
    const width = Math.round(height * aspect);
    li.style.width  = `${width}px`;
    li.style.height = `${height}px`;
  });
}

function onCarouselWheel(e) {
  // Translate vertical wheel to horizontal scroll on the carousel.
  // Skip if user already gave a horizontal delta (trackpad / shift+wheel).
  if (e.deltaY === 0) return;
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
  const ul = e.currentTarget;
  // Only intercept if scrollable horizontally; otherwise let page scroll.
  if (ul.scrollWidth <= ul.clientWidth) return;
  e.preventDefault();
  ul.scrollLeft += e.deltaY;
}

function renderCarousel(container, items) {
  const ul = document.createElement('ul');
  ul.className = 'series-carousel';
  ul.setAttribute('tabindex', '0');
  ul.addEventListener('wheel', onCarouselWheel, { passive: false });

  const imgs = [];
  for (const work of items) {
    const li = document.createElement('li');
    li.className = 'series-carousel__item';
    li.dataset.aspect = (work.width / work.height).toString();
    li.innerHTML = `
      <a href="#/work/${work.slug}" aria-label="${escapeHtml(work.title)}">
        <img src="/works/thumb/${work.image}.jpg" alt="${escapeHtml(work.title)}" loading="lazy" />
      </a>
    `;
    ul.appendChild(li);
    const img = li.querySelector('img');
    imgs.push(img);
  }

  container.replaceChildren(ul);
  applyCarouselSizes(ul);

  // Attach load listeners
  const loadHandlers = [];
  imgs.forEach(img => {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('is-loaded');
    } else {
      const handler = () => img.classList.add('is-loaded');
      img.addEventListener('load', handler);
      loadHandlers.push([img, handler]);
    }
  });

  return loadHandlers;
}

function renderExpanded(container, items) {
  const seriesCount = items.length;
  const { imgs } = renderJustifiedRows(container, items, {
    renderItem: ({ work }) => {
      const idx = items.indexOf(work);
      return buildWorkCell({ work }, { seriesCount, idx });
    },
  });

  const loadHandlers = [];
  imgs.forEach(img => {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('is-loaded');
    } else {
      const handler = () => img.classList.add('is-loaded');
      img.addEventListener('load', handler);
      loadHandlers.push([img, handler]);
    }
  });

  return loadHandlers;
}

export function render(container) {
  const groups = groupBySeries();
  const totalSeries = groups.length;

  // --- Masthead ---
  const masthead = document.createElement('header');
  masthead.className = 'masthead';

  const navLinks = groups
    .map((g, i) => {
      const idx = String(i + 1).padStart(2, '0');
      return `<a href="#series-${g.key}" class="masthead__nav-item mono" data-series="${g.key}">${idx} · ${escapeHtml(g.meta.title)}</a>`;
    })
    .join('');

  masthead.innerHTML = `
    <div class="masthead__name mono">r.maria</div>
    <h1 class="masthead__title">Works</h1>
    <div class="masthead__meta mono">${works.length} works &middot; B&amp;W</div>
    <nav class="masthead__nav" aria-label="Series navigation">${navLinks}</nav>
  `;

  // --- Sections ---
  const main = document.createElement('main');
  const fragment = document.createDocumentFragment();

  // Per-series state
  const seriesMode = new Map(); // tag → 'carousel' | 'expanded'
  const sectionStates = new Map(); // tag → { container, loadHandlers }

  groups.forEach((group, gIdx) => {
    const sectionIdx = String(gIdx + 1).padStart(2, '0');
    const totalIdx = String(totalSeries).padStart(2, '0');
    const seriesCount = group.items.length;

    const section = document.createElement('section');
    section.className = 'series-section';
    section.id = `series-${group.key}`;
    section.dataset.series = group.key;

    // Series header
    const header = document.createElement('header');
    header.className = 'series-header';
    header.innerHTML = `
      <span class="series-header__index mono">${sectionIdx} / ${totalIdx}</span>
      <h2 class="series-header__title">${escapeHtml(group.meta.title)}</h2>
      <p class="series-header__title-en">${escapeHtml(group.meta.titleEn)}</p>
      <div class="series-header__bar">
        <span class="series-header__count mono">${seriesCount} works</span>
        <button type="button" class="series-header__toggle mono" data-series="${group.key}" aria-pressed="false">EXPAND</button>
      </div>
      <hr class="series-header__rule" />
    `;

    const content = document.createElement('div');
    content.className = 'series-content';
    content.dataset.seriesContent = '';
    content.dataset.series = group.key;

    section.appendChild(header);
    section.appendChild(content);
    fragment.appendChild(section);

    seriesMode.set(group.key, 'carousel');
    sectionStates.set(group.key, { container: content, loadHandlers: [] });
  });

  main.appendChild(fragment);

  // --- Mount ---
  container.replaceChildren(masthead, main);

  // --- Default render: each series in carousel mode ---
  for (const group of groups) {
    const state = sectionStates.get(group.key);
    const handlers = renderCarousel(state.container, group.items);
    sectionStates.set(group.key, { container: state.container, loadHandlers: handlers });
  }

  // --- Toggle click handler ---
  function onToggleClick(e) {
    const tag = e.currentTarget.dataset.series;
    const current = seriesMode.get(tag) ?? 'carousel';
    const next = current === 'carousel' ? 'expanded' : 'carousel';
    seriesMode.set(tag, next);
    e.currentTarget.setAttribute('aria-pressed', next === 'expanded' ? 'true' : 'false');
    e.currentTarget.textContent = next === 'expanded' ? 'COLLAPSE' : 'EXPAND';

    const state = sectionStates.get(tag);
    if (state?.loadHandlers) {
      state.loadHandlers.forEach(([img, h]) => img.removeEventListener('load', h));
    }

    const items = works.filter(w => w.series === tag);
    const handlers = next === 'carousel'
      ? renderCarousel(state.container, items)
      : renderExpanded(state.container, items);
    sectionStates.set(tag, { container: state.container, loadHandlers: handlers });
  }

  const toggleButtons = Array.from(main.querySelectorAll('.series-header__toggle'));
  toggleButtons.forEach(btn => btn.addEventListener('click', onToggleClick));

  // --- Series section reveal on scroll (IntersectionObserver) ---
  const sections = Array.from(main.querySelectorAll('.series-section'));
  let observer = null;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );
    sections.forEach(s => observer.observe(s));
  } else {
    sections.forEach(s => s.classList.add('is-revealed'));
  }

  // --- Masthead anchor smooth scroll ---
  const navItems = Array.from(masthead.querySelectorAll('.masthead__nav-item'));
  function onNavClick(e) {
    e.preventDefault();
    const seriesKey = e.currentTarget.dataset.series;
    const target = document.getElementById(`series-${seriesKey}`);
    if (target) {
      target.classList.add('is-revealed');
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  navItems.forEach(item => item.addEventListener('click', onNavClick));

  // --- Resize: re-layout expanded series + recompute carousel sizes ---
  const onResize = debounce(() => {
    for (const [tag, mode] of seriesMode.entries()) {
      const state = sectionStates.get(tag);
      if (!state) continue;
      if (mode === 'expanded') {
        state.loadHandlers?.forEach(([img, h]) => img.removeEventListener('load', h));
        const items = works.filter(w => w.series === tag);
        const handlers = renderExpanded(state.container, items);
        sectionStates.set(tag, { container: state.container, loadHandlers: handlers });
      } else {
        const ul = state.container.querySelector('.series-carousel');
        if (ul) applyCarouselSizes(ul);
      }
    }
  }, 200);
  window.addEventListener('resize', onResize);

  // --- Dispose ---
  return function dispose() {
    saveIndexScroll();
    window.removeEventListener('resize', onResize);
    if (observer) observer.disconnect();
    navItems.forEach(el => el.removeEventListener('click', onNavClick));
    toggleButtons.forEach(btn => btn.removeEventListener('click', onToggleClick));
    main.querySelectorAll('.series-carousel').forEach(ul => {
      ul.removeEventListener('wheel', onCarouselWheel);
    });
    for (const state of sectionStates.values()) {
      state.loadHandlers?.forEach(([img, h]) => img.removeEventListener('load', h));
    }
    seriesMode.clear();
    sectionStates.clear();
  };
}
