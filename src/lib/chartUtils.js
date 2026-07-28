/* src/lib/chartUtils.js */

/**
 * En central funktion för att mappa status-strängar till färgkoder.
 * Detta gör att alla grafer på sidan ser konsekventa ut.
 *
 * Du kan enkelt byta ut färgerna mot de centrala CSS-variablerna
 * för att framtidssäkra designen.
 */
/**
 * Map a status string to a CSS variable name (without var()).
 * Then resolve that variable to a concrete color at runtime (browser).
 * If running server-side, return the `var(...)` expression so CSS can handle it.
 */
const statusToVar = (status) => {
  const s = (status || '').toLowerCase();

  if (s.includes('avail') || s.includes('ledig') || s.includes('tillgänglig')) {
    return '--color-status-available';
  }

  if (s.includes('charg') || s.includes('ladd')) {
    return '--color-status-occupied';
  }


  // Reserved (English / Swedish)
  if (s.includes('reserv') || s.includes('reserver') || s.includes('reserverad') || s.includes('reserved')) {
    return '--color-status-reserved';
  }

  // Blocked / Blockerad
  if (s.includes('block') || s.includes('blocker') || s.includes('blockerad') || s.includes('blocked')) {
    return '--color-status-blocked';
  }

  // Unknown / Okänd
  if (s.includes('unknown') || s.includes('okänd') || s.includes('okand') || s.includes('okann')) {
    return '--color-status-unknown';
  }

  // Support English and Swedish variants for "out of order"
  if (
    s.includes('order') || s.includes('fel') || s.includes('trasig') || s.includes('out') ||
    s.includes('ur') || s.includes('funktion') || s.includes('urfunktion')
  ) {
    return '--color-rosy-brown';
  }

  return '--color-beige';
};

export const getChartColor = (status) => {
  const varName = statusToVar(status);

  // In the browser, resolve the CSS variable to its computed value (hex, rgb, etc.)
  if (typeof window !== 'undefined' && typeof getComputedStyle === 'function') {
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName);
    if (value && value.trim()) return value.trim();
  }

  // Server-side fallback: return CSS var() expression
  return `var(${varName})`;
};

// Return the CSS var(...) expression for a status so server and client
// render the exact same inline value and avoid hydration mismatches.
export const getStatusCssVar = (status) => `var(${statusToVar(status)})`;