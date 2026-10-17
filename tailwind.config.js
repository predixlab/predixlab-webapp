/**
 * Tailwind v4 reads its configuration from CSS (`@theme` in src/index.css).
 * This file only remains so tooling that expects a config entry point can
 * resolve the content globs.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
}
