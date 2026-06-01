/**
 * Lighthouse CI configuration.
 *
 * Run locally:
 *   npx @lhci/cli autorun
 *
 * Requires the app to be running (or use startServerCommand).
 */
module.exports = {
  ci: {
    collect: {
      // Start the dev server for local runs
      startServerCommand: 'npm run preview -- --port 4173',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 10000,
      url: ['http://localhost:4173/', 'http://localhost:4173/groups'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        // Skip audits that require auth
        skipAudits: ['redirects'],
      },
    },
    assert: {
      assertions: {
        // Performance budgets
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['error', { minScore: 0.85 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],

        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 3500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 5000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],

        // Bundle size
        'unused-javascript': ['warn', { maxNumericValue: 1000 }],
      },
    },
    upload: {
      // For local runs, use temporary public storage
      target: 'temporary-public-storage',
    },
  },
};
