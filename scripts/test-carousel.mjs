import { chromium } from 'playwright';

const URL = process.env.URL || 'http://localhost:4173/';
const VW = parseInt(process.env.VW || '1280', 10);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VW, height: 800 } });
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

await page.goto(URL, { waitUntil: 'networkidle' });

const results = await page.evaluate(() => {
  const carousels = Array.from(document.querySelectorAll('.series-carousel'));
  return carousels.map(c => {
    const items = Array.from(c.querySelectorAll('.series-carousel__item'));
    const cs = window.getComputedStyle(c);
    return {
      seriesId: c.closest('.series-section')?.id || '',
      itemCount: items.length,
      scrollWidth:  c.scrollWidth,
      clientWidth:  c.clientWidth,
      overflowsHorizontally: c.scrollWidth > c.clientWidth,
      overflowX: cs.overflowX,
      firstItemWidth:  items[0]?.style.width  || '',
      firstItemHeight: items[0]?.style.height || '',
    };
  });
});

// Try programmatically scrolling each carousel that overflows
const scrollTests = await page.evaluate(async () => {
  const cs = Array.from(document.querySelectorAll('.series-carousel'));
  const out = [];
  for (const c of cs) {
    if (c.scrollWidth <= c.clientWidth) {
      out.push({ id: c.closest('.series-section')?.id, applicable: false });
      continue;
    }
    const before = c.scrollLeft;
    // Use scrollTo with instant to bypass smooth-scroll animation
    c.scrollTo({ left: 200, behavior: 'instant' });
    await new Promise(r => setTimeout(r, 500));
    const after = c.scrollLeft;
    out.push({
      id: c.closest('.series-section')?.id,
      applicable: true,
      before, after, moved: after - before,
    });
  }
  return out;
});

await browser.close();

console.log('\n=== CAROUSEL HORIZONTAL SCROLL TEST ===\n');
console.log(`Viewport: ${VW}×800`);
console.log(`URL: ${URL}`);
console.log(`Page errors: ${errors.length === 0 ? 'none' : errors.join(' | ')}`);
console.log('');

// Each carousel has one of three states:
//   A. overflow + scroll works   (PASS — visible scroll)
//   B. items fit within viewport (FIT  — no scroll needed, correct UX)
//   C. inline width not set OR overflow-x not auto OR scroll didn't move (FAIL)
const cssOk = (r) => r.overflowX === 'auto';
const widthsApplied = (r) => /\dpx/.test(r.firstItemWidth) && /\dpx/.test(r.firstItemHeight);

let anyFail = errors.length > 0;
let overflowSeries = 0;
let overflowSeriesWithWorkingScroll = 0;

for (const r of results) {
  const scrollTest = scrollTests.find(s => s.id === r.seriesId);
  let verdict;
  if (!cssOk(r))                 verdict = 'FAIL (overflow-x not auto)';
  else if (!widthsApplied(r))    verdict = 'FAIL (inline width/height missing)';
  else if (r.overflowsHorizontally) {
    overflowSeries++;
    if (scrollTest?.moved > 0) {
      overflowSeriesWithWorkingScroll++;
      verdict = 'PASS (scroll works)';
    } else {
      verdict = 'FAIL (scroll did not move)';
    }
  } else {
    verdict = 'FIT  (content fits, no scroll needed — correct UX)';
  }
  if (verdict.startsWith('FAIL')) anyFail = true;
  console.log(`${verdict.padEnd(50)}  ${r.seriesId}`);
  console.log(`   items=${r.itemCount}  scrollW=${r.scrollWidth}  clientW=${r.clientWidth}  firstItem=${r.firstItemWidth}×${r.firstItemHeight}`);
  if (scrollTest?.applicable) {
    console.log(`   scrollTo(200): before=${scrollTest.before}  after=${scrollTest.after}  moved=${scrollTest.moved}`);
  }
}

console.log('');
console.log(`Series with overflow:                   ${overflowSeries}`);
console.log(`Series where scrollLeft actually moves: ${overflowSeriesWithWorkingScroll}`);
console.log('');

const overall = !anyFail && overflowSeries > 0 && overflowSeries === overflowSeriesWithWorkingScroll;
console.log(`OVERALL: ${overall ? '✓ HORIZONTAL SCROLL VERIFIED' : '✗ FAILED'}`);

process.exit(overall ? 0 : 1);
