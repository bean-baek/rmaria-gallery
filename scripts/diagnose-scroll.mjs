import { chromium } from 'playwright';

const URL = process.env.URL || 'http://localhost:4173/';
const VW = parseInt(process.env.VW || '1280', 10);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VW, height: 800 } });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'networkidle' });

// 1. Check page-level horizontal overflow
const pageDiag = await page.evaluate(() => {
  return {
    docScrollWidth: document.documentElement.scrollWidth,
    docClientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    bodyClientWidth: document.body.clientWidth,
    bodyOverflowX: window.getComputedStyle(document.body).overflowX,
    htmlOverflowX: window.getComputedStyle(document.documentElement).overflowX,
  };
});

console.log('\n=== PAGE LEVEL ===');
console.log('html  scrollW:', pageDiag.docScrollWidth, ' clientW:', pageDiag.docClientWidth, ' overflowX:', pageDiag.htmlOverflowX);
console.log('body  scrollW:', pageDiag.bodyScrollWidth, ' clientW:', pageDiag.bodyClientWidth, ' overflowX:', pageDiag.bodyOverflowX);
const pageOverflows = pageDiag.docScrollWidth > pageDiag.docClientWidth;
console.log('Page itself has horizontal overflow:', pageOverflows ? 'YES (problem!)' : 'NO');

// 2. Check first carousel position and try a real wheel event
console.log('\n=== CAROUSEL INPUT METHODS ===');
const firstCarouselBox = await page.evaluate(() => {
  const c = document.querySelector('.series-carousel');
  if (!c) return null;
  c.scrollLeft = 0; // reset
  const r = c.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height, scrollLeft: c.scrollLeft, scrollWidth: c.scrollWidth, clientWidth: c.clientWidth };
});

if (!firstCarouselBox) {
  console.log('No carousel found!');
  process.exit(2);
}

// Need to scroll page to bring first section into view (it's below the masthead)
await page.evaluate(() => {
  document.querySelector('.series-carousel')?.scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(300);

const updated = await page.evaluate(() => {
  const c = document.querySelector('.series-carousel');
  const r = c.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height, scrollLeft: c.scrollLeft };
});
console.log('First carousel rect:', updated);

// Hover middle of carousel
const cx = updated.x + updated.w / 2;
const cy = updated.y + updated.h / 2;
await page.mouse.move(cx, cy);

// Try vertical wheel (typical mouse wheel) — see if it does anything
const beforeWheel = await page.evaluate(() => {
  const c = document.querySelector('.series-carousel');
  return c.scrollLeft;
});
await page.mouse.wheel(0, 300);
await page.waitForTimeout(200);
const afterVerticalWheel = await page.evaluate(() => {
  const c = document.querySelector('.series-carousel');
  return c.scrollLeft;
});
console.log(`Vertical wheel(0, 300):   scrollLeft ${beforeWheel} → ${afterVerticalWheel}  (vertical-to-horizontal: ${afterVerticalWheel > beforeWheel ? 'YES' : 'NO'})`);

// Try horizontal wheel (Shift+wheel or trackpad horizontal)
await page.evaluate(() => { document.querySelector('.series-carousel').scrollLeft = 0; });
await page.waitForTimeout(50);
await page.mouse.wheel(300, 0);
await page.waitForTimeout(200);
const afterHorizontalWheel = await page.evaluate(() => {
  const c = document.querySelector('.series-carousel');
  return c.scrollLeft;
});
console.log(`Horizontal wheel(300, 0): scrollLeft 0 → ${afterHorizontalWheel}  (works: ${afterHorizontalWheel > 0 ? 'YES' : 'NO'})`);

// Check scrollbar visibility
const scrollbarVisible = await page.evaluate(() => {
  const c = document.querySelector('.series-carousel');
  if (!c) return null;
  // Compare offsetHeight vs clientHeight — if scrollbar takes space, they differ
  const r = c.getBoundingClientRect();
  return {
    offsetHeight: c.offsetHeight,
    clientHeight: c.clientHeight,
    rectHeight: r.height,
    scrollbarSpace: c.offsetHeight - c.clientHeight,
  };
});
console.log('\nScrollbar diagnostic:', scrollbarVisible);

// Take a screenshot for visual debugging
await page.screenshot({ path: 'scripts/carousel-screenshot.png', fullPage: false });
console.log('Screenshot saved to scripts/carousel-screenshot.png');

await browser.close();
