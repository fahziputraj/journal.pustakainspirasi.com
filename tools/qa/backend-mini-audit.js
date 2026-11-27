/*
 * Compact in-page layout check for signed-in OJS backend pages (read-only).
 * Paste into the browser console (or a browser tool's JavaScript runner) on a backend page;
 * it returns horizontal overflow, clipped text, small targets, unnamed controls and low contrast.
 * Screen-reader-only elements are ignored. For full audits use the ui-ux-layout-standards runner.
 */
(() => {
  const de = document.documentElement;
  const vw = de.clientWidth;
  const res = { overflow: [], clipped: [], smallTargets: [], noName: [], lowContrast: [] };
  const cs = (el) => getComputedStyle(el);
  const vis = (el) => {
    const s = cs(el);
    if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const sel = (el) => {
    const parts = [];
    for (let e = el, i = 0; i < 4 && e && e.nodeType === 1; i++, e = e.parentElement) {
      let s = e.tagName.toLowerCase();
      if (e.id) { parts.unshift(s + '#' + e.id); break; }
      if (e.classList.length) s += '.' + [...e.classList].slice(0, 2).join('.');
      parts.unshift(s);
    }
    return parts.join('>');
  };
  const contained = (el) => {
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const ox = cs(a).overflowX;
      if (['auto', 'scroll', 'hidden', 'clip'].includes(ox) && a.getBoundingClientRect().right <= vw + 1) return true;
    }
    return false;
  };
  const channels = (c) => (c.match(/[\d.]+/g) || []).map(Number);
  const lum = (c) => {
    const m = channels(c);
    if (m.length < 3) return null;
    const [r, g, b] = m.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const alpha = (c) => { const m = channels(c); return m.length > 3 ? m[3] : 1; };
  const bgOf = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const b = cs(e).backgroundColor;
      if (b && alpha(b) > 0.5) return b;
      if (cs(e).backgroundImage !== 'none') return null;
    }
    return 'rgb(255,255,255)';
  };
  const push = (arr, value, key) => { if (!arr.some((x) => x[0] === key)) arr.push(value); };

  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 2 || r.height <= 2 || el.closest('.sr-only,.-screenReader,#announcer')) continue;
    const s = cs(el);
    if (r.right > vw + 1 && s.position !== 'fixed' && !contained(el)) push(res.overflow, [sel(el), Math.round(r.right - vw)], sel(el));
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (ownText && el.scrollWidth > el.clientWidth + 2 && ['hidden', 'clip'].includes(s.overflowX) && s.textOverflow !== 'ellipsis') {
      push(res.clipped, [sel(el), el.textContent.trim().slice(0, 40)], sel(el));
    }
    if (ownText) {
      const bg = bgOf(el);
      const l1 = lum(s.color);
      const l2 = bg && lum(bg);
      if (l1 != null && l2 != null) {
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const size = parseFloat(s.fontSize);
        const need = size >= 24 || (+s.fontWeight >= 700 && size >= 18.66) ? 3 : 4.5;
        if (ratio < need) push(res.lowContrast, [sel(el), ratio.toFixed(2), s.color, bg, el.textContent.trim().slice(0, 30)], sel(el) + s.color);
      }
    }
    if (el.matches('a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=tab],[role=link]')) {
      const block = el.closest('p,li,td');
      const inline = el.tagName === 'A' && block && r.height < 24 && block.textContent.trim().length > el.textContent.trim().length + 10;
      if (!inline && (r.width < 24 || r.height < 24)) push(res.smallTargets, [sel(el), Math.round(r.width) + 'x' + Math.round(r.height)], sel(el));
      const label = el.id && document.querySelector('label[for="' + el.id + '"]');
      const name = (el.getAttribute('aria-label') || '').trim() || (el.getAttribute('title') || '').trim() || el.textContent.trim()
        || (el.querySelector('img[alt]') || {}).alt || (label ? 'label' : '') || (el.getAttribute('aria-labelledby') ? 'labelledby' : '') || el.placeholder || '';
      if (!name) push(res.noName, [sel(el), el.tagName.toLowerCase()], sel(el));
    }
  }
  const cap = (a) => ({ count: a.length, top: a.slice(0, 8) });
  return {
    page: location.pathname + location.search,
    vw,
    hOverflowPx: Math.max(0, de.scrollWidth - vw),
    overflow: cap(res.overflow),
    clipped: cap(res.clipped),
    smallTargets: cap(res.smallTargets),
    noName: cap(res.noName),
    lowContrast: cap(res.lowContrast),
  };
})();
