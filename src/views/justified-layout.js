// Shared justified-rows layout helper for index-view and work-view.
// Implements the Flickr-style packer per .claude/policy/layout-policy.md.

export const JUSTIFIED_GAP = 16; // --space-3

export function getTargetHeight() {
  const w = window.innerWidth;
  if (w >= 1024) return 320;
  if (w >= 640)  return 240;
  return null; // mobile: no justified layout
}

export function getMaxHeight() {
  const w = window.innerWidth;
  if (w >= 1024) return 540;
  if (w >= 640)  return 420;
  return Infinity;
}

function getToleranceBand() {
  const w = window.innerWidth;
  if (w >= 1024) return { min: 260, max: 400 };
  if (w >= 640)  return { min: 200, max: 300 };
  return { min: 0, max: Infinity };
}

/**
 * Greedy row packer.
 * @param {Array<{width:number,height:number}>} items - source items with width/height fields
 *   (additional fields are preserved on the returned `work` reference)
 * @param {number} containerWidth - pixel width available for rows
 * @param {number} targetHeight - target row height (e.g. 320 desktop)
 * @param {number} gap - horizontal gap between cells
 * @param {number} maxHeight - cap on actual row height
 * @returns {Array<{items: Array<{work:any,width:number,height:number}>, isLast:boolean}>}
 */
export function buildRows(items, containerWidth, targetHeight, gap, maxHeight) {
  const rows = [];
  const band = getToleranceBand();
  let current = []; // { work, aspect }
  let aspectSum = 0;

  function actualHeight(rowAspectSum, count) {
    const totalGap = (count - 1) * gap;
    if (rowAspectSum <= 0) return Infinity;
    return (containerWidth - totalGap) / rowAspectSum;
  }

  for (const item of items) {
    const aspect = item.width / item.height;
    const projAspectSum = aspectSum + aspect;
    const projCount = current.length + 1;
    const hWith = actualHeight(projAspectSum, projCount);

    if (current.length === 0) {
      // Always seed a row with at least one item
      current.push({ work: item, aspect });
      aspectSum = aspect;
      continue;
    }

    if (hWith >= band.min && hWith <= band.max) {
      // Adding the item lands inside tolerance — commit row with item
      current.push({ work: item, aspect });
      rows.push(finalize(current, containerWidth, gap, maxHeight, targetHeight, false));
      current = [];
      aspectSum = 0;
    } else if (hWith > band.max) {
      // Row would still be too tall (too sparse) — extend with new item, keep packing
      current.push({ work: item, aspect });
      aspectSum = projAspectSum;
    } else {
      // hWith < band.min → adding the item crushes the row.
      // Commit current row without it; new item seeds the next row.
      rows.push(finalize(current, containerWidth, gap, maxHeight, targetHeight, false));
      current = [{ work: item, aspect }];
      aspectSum = aspect;
    }
  }

  // Last row: natural target height, no stretch
  if (current.length > 0) {
    rows.push(finalizeNatural(current, targetHeight, true));
  }
  return rows;
}

function finalize(row, containerWidth, gap, maxHeight, targetHeight, isLast) {
  const aspectSum = row.reduce((s, r) => s + r.aspect, 0);
  const totalGap = (row.length - 1) * gap;
  let height = (containerWidth - totalGap) / aspectSum;

  // Max cap
  if (height > maxHeight) height = maxHeight;

  // Single-image-in-row protection: never blow up beyond target
  if (row.length === 1 && height > targetHeight) {
    height = targetHeight;
  }

  return {
    items: row.map(r => ({ work: r.work, width: r.aspect * height, height })),
    isLast,
  };
}

function finalizeNatural(row, targetHeight, isLast) {
  return {
    items: row.map(r => ({ work: r.work, width: r.aspect * targetHeight, height: targetHeight })),
    isLast,
  };
}

/**
 * High-level helper: renders justified rows of works into `container`.
 * - On mobile (target === null), renders a single-column list using existing CSS class.
 * - Calls `renderItem({ work, width, height })` for each cell to build inner HTML/DOM.
 *
 * @param {HTMLElement} container - the `.justified-rows` element
 * @param {Array} items - works to render (must have width/height fields)
 * @param {Object} options
 * @param {Function} options.renderItem - ({ work, width, height }) => HTMLElement
 *   Returns the inner content for the figure (image + figcaption). The wrapping
 *   `.justified-row__item` and `<figure>` are created by this helper.
 * @returns {{ imgs: HTMLImageElement[] }} - collected image elements for load-listener wiring
 */
export function renderJustifiedRows(container, items, { renderItem }) {
  container.replaceChildren();
  const imgs = [];

  if (items.length === 0) return { imgs };

  const target = getTargetHeight();
  const maxH = getMaxHeight();
  const width = container.clientWidth || container.parentElement?.clientWidth || window.innerWidth;

  // Mobile fallback: a single "row" with column flex (driven by CSS @media rule)
  if (target === null) {
    const row = document.createElement('div');
    row.className = 'justified-row justified-row--mobile';
    for (const work of items) {
      const cell = buildCell(work, null, null, renderItem, imgs);
      row.appendChild(cell);
    }
    container.appendChild(row);
    return { imgs };
  }

  const rows = buildRows(items, width, target, JUSTIFIED_GAP, maxH);

  for (const row of rows) {
    const rowEl = document.createElement('div');
    rowEl.className = 'justified-row' + (row.isLast ? ' justified-row--last' : '');
    for (const entry of row.items) {
      const cell = buildCell(entry.work, entry.width, entry.height, renderItem, imgs);
      rowEl.appendChild(cell);
    }
    container.appendChild(rowEl);
  }

  return { imgs };
}

function buildCell(work, width, height, renderItem, imgs) {
  const cell = document.createElement('div');
  cell.className = 'justified-row__item';
  if (width != null) cell.style.width = `${width}px`;

  const inner = renderItem({ work, width, height });
  // The caller returns an <a> (linkable) or similar element containing a <figure>.
  // We set the figure height inline here.
  if (height != null) {
    const figure = inner.querySelector('figure');
    if (figure) figure.style.height = `${height}px`;
  }
  cell.appendChild(inner);

  cell.querySelectorAll('img').forEach(img => imgs.push(img));
  return cell;
}

export function debounce(fn, delay) {
  let id = null;
  return (...args) => {
    if (id !== null) clearTimeout(id);
    id = setTimeout(() => {
      id = null;
      fn(...args);
    }, delay);
  };
}
