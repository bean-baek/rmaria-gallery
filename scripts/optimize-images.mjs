import sharp from 'sharp';
import { createRequire } from 'module';
import { existsSync, mkdirSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Dynamic import of works.js (ESM)
const { works } = await import('../src/works.js');

// Output directories
const thumbDir = resolve(root, 'public/works/thumb');
const fullDir  = resolve(root, 'public/works/full');
mkdirSync(thumbDir, { recursive: true });
mkdirSync(fullDir,  { recursive: true });

// Validate slug uniqueness
const slugs = works.map(w => w.slug);
const duplicates = slugs.filter((s, i) => slugs.indexOf(s) !== i);
if (duplicates.length > 0) {
  console.error('FATAL: Duplicate slugs:', duplicates);
  process.exit(1);
}

let processed = 0;
let skipped   = 0;

for (const w of works) {
  const src   = resolve(root, 'r.maria/src', w.source);
  const thumb = resolve(thumbDir, `${w.image}.jpg`);
  const full  = resolve(fullDir,  `${w.image}.jpg`);

  if (!existsSync(src)) {
    console.error(`MISSING source: ${w.source} (slug: ${w.slug})`);
    process.exit(1);
  }

  const srcMtime = statSync(src).mtimeMs;
  const thumbExists = existsSync(thumb) && statSync(thumb).mtimeMs > srcMtime;
  const fullExists  = existsSync(full)  && statSync(full).mtimeMs  > srcMtime;

  if (thumbExists && fullExists) {
    console.log(`  skip  ${w.slug}`);
    skipped++;
    continue;
  }

  process.stdout.write(`  proc  ${w.slug} ... `);

  await sharp(src)
    .rotate()
    .resize({ width: 800, withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(thumb);

  await sharp(src)
    .rotate()
    .resize({ width: 2000, withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(full);

  console.log('done');
  processed++;
}

// Summary
const { readdirSync } = await import('fs');
const thumbFiles = readdirSync(thumbDir).length;
const fullFiles  = readdirSync(fullDir).length;

console.log(`\n✓ Processed: ${processed}  Skipped: ${skipped}`);
console.log(`  thumb/ → ${thumbFiles} files`);
console.log(`  full/  → ${fullFiles} files`);
