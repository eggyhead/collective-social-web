#!/usr/bin/env node
/**
 * Bundle size budget checker.
 * Run after `npm run build` to verify no chunk exceeds the budget.
 *
 * Usage:
 *   node scripts/check-bundle-size.js
 *
 * Exits with code 1 if any budget is exceeded.
 */

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

const DIST_DIR = join(import.meta.dirname, '..', 'dist', 'assets');

// Budget thresholds (gzipped bytes)
const BUDGETS = {
  // No single JS chunk should exceed 150KB gzipped
  jsChunkMax: 150 * 1024,
  // Total JS budget: 500KB gzipped
  jsTotalMax: 500 * 1024,
  // No single CSS file should exceed 50KB gzipped
  cssChunkMax: 50 * 1024,
};

function getGzipSize(filePath) {
  const content = readFileSync(filePath);
  return gzipSync(content).length;
}

function checkBudgets() {
  let files;
  try {
    files = readdirSync(DIST_DIR);
  } catch {
    console.error('Error: dist/assets/ not found. Run `npm run build` first.');
    process.exit(1);
  }

  const jsFiles = files.filter(f => f.endsWith('.js'));
  const cssFiles = files.filter(f => f.endsWith('.css'));

  let totalJs = 0;
  let failures = [];

  console.log('\n📦 Bundle Size Report\n');
  console.log('JS Chunks:');
  console.log('─'.repeat(60));

  const jsEntries = jsFiles
    .map(f => {
      const path = join(DIST_DIR, f);
      const raw = statSync(path).size;
      const gzip = getGzipSize(path);
      return { name: f, raw, gzip };
    })
    .sort((a, b) => b.gzip - a.gzip);

  for (const { name, raw, gzip } of jsEntries) {
    totalJs += gzip;
    const status = gzip > BUDGETS.jsChunkMax ? '❌' : '✅';
    console.log(`  ${status} ${name}`);
    console.log(`     ${(raw / 1024).toFixed(1)}KB raw / ${(gzip / 1024).toFixed(1)}KB gzip`);
    if (gzip > BUDGETS.jsChunkMax) {
      failures.push(
        `${name}: ${(gzip / 1024).toFixed(1)}KB gzip exceeds ${BUDGETS.jsChunkMax / 1024}KB limit`
      );
    }
  }

  console.log('─'.repeat(60));
  const totalStatus = totalJs > BUDGETS.jsTotalMax ? '❌' : '✅';
  console.log(
    `  ${totalStatus} Total JS: ${(totalJs / 1024).toFixed(1)}KB gzip (budget: ${BUDGETS.jsTotalMax / 1024}KB)`
  );
  if (totalJs > BUDGETS.jsTotalMax) {
    failures.push(
      `Total JS: ${(totalJs / 1024).toFixed(1)}KB gzip exceeds ${BUDGETS.jsTotalMax / 1024}KB limit`
    );
  }

  if (cssFiles.length) {
    console.log('\nCSS Files:');
    console.log('─'.repeat(60));
    for (const f of cssFiles) {
      const path = join(DIST_DIR, f);
      const raw = statSync(path).size;
      const gzip = getGzipSize(path);
      const status = gzip > BUDGETS.cssChunkMax ? '❌' : '✅';
      console.log(
        `  ${status} ${f}: ${(raw / 1024).toFixed(1)}KB raw / ${(gzip / 1024).toFixed(1)}KB gzip`
      );
      if (gzip > BUDGETS.cssChunkMax) {
        failures.push(
          `${f}: ${(gzip / 1024).toFixed(1)}KB gzip exceeds ${BUDGETS.cssChunkMax / 1024}KB limit`
        );
      }
    }
  }

  console.log('');

  if (failures.length) {
    console.error('❌ Budget exceeded:\n');
    failures.forEach(f => console.error(`  • ${f}`));
    console.error('');
    process.exit(1);
  } else {
    console.log('✅ All bundles within budget.\n');
  }
}

checkBudgets();
