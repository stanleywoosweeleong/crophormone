/* Settings, behind the cog in the top bar: language, appearance (auto, light, dark), sharing, and where the data
   comes from. The saved appearance is applied by a small script in each page's head, before the page draws. */
(function () {
  'use strict';
  const button = document.getElementById('settings-btn');
  if (!button) return;
  const I = window.I18N;
  const t = (k, v) => (I ? I.t(k, v) : k);

  /* ---------- appearance ---------- */
  const THEME_KEY = 'crophormone.theme';
  const THEMES = ['auto', 'light', 'dark'];
  const savedTheme = () => { try { const v = localStorage.getItem(THEME_KEY); return THEMES.includes(v) ? v : 'auto'; } catch (e) { return 'auto'; } };
  /* The browser bar colour follows the forced theme, or the phone's setting on auto. */
  const BAR = {light: '#ffffff', dark: '#19201c'};
  function applyTheme(v) {
    const root = document.documentElement;
    if (v === 'auto') delete root.dataset.theme; else root.dataset.theme = v;
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
      if (!m.dataset.auto) m.dataset.auto = m.content;
      m.content = v === 'auto' ? m.dataset.auto : BAR[v];
    });
  }
  function setTheme(v) {
    try { if (v === 'auto') localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, v); } catch (e) { /* not remembered */ }
    applyTheme(v);
    /* Charts read colours when drawn; redraw them in the new palette. */
    window.dispatchEvent(new CustomEvent('themechange', {detail: v}));
  }
  applyTheme(savedTheme());

  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'text') n.textContent = v; else if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v);
    });
    kids.forEach(k => k != null && n.append(k));
    return n;
  }
  /* A row of buttons where one is chosen, read by screen readers as a group of toggle buttons. */
  function segmented(label, options, current, onPick) {
    return el('div', {class: 'seg', role: 'group', 'aria-label': label},
      ...options.map(o => el('button', Object.assign({type: 'button', class: 'seg-opt', 'aria-pressed': String(o.value === current), onclick: () => onPick(o.value)},
        o.lang ? {lang: o.lang} : {}), o.label)));
  }

  let sheet = null;
  function render() {
    const langs = I ? Object.entries(I.LANGS).map(([value, l]) => ({value, label: value === 'ms' ? 'Melayu' : value === 'zh' ? '中文' : 'English', lang: l.html})) : [];
    const theme = savedTheme();
    const shareRow = el('button', {type: 'button', class: 'set-row', onclick: () => { sheet.close(); if (window.Share) window.Share.open(); }},
      el('span', {class: 'set-row-text'}, el('strong', {text: t('share.title')}), el('span', {text: t('settings.shareHint')})),
      el('span', {class: 'set-row-go', 'aria-hidden': 'true', text: '›'}));
    const about = el('div', {class: 'set-about'});
    /* Our own fixed markup from i18n.js (links to the data files and the report). */
    ['foot.data_html', 'foot.report_html'].forEach(k => { const p = el('p'); p.innerHTML = t(k); about.append(p); });
    if (I && I.lang !== 'en') about.append(el('p', {text: t('lang.dataNote')}));
    sheet.replaceChildren(
      el('h2', {id: 'settings-title', text: t('settings.title')}),
      el('section', {class: 'set-sec'}, el('h3', {text: t('settings.language')}),
        segmented(t('settings.language'), langs, I && I.lang, v => { I.set(v); render(); sheet.querySelector('.seg-opt[aria-pressed="true"]').focus(); })),
      el('section', {class: 'set-sec'}, el('h3', {text: t('settings.theme')}),
        segmented(t('settings.theme'), THEMES.map(v => ({value: v, label: t('theme.' + v)})), theme, v => { setTheme(v); render(); sheet.querySelectorAll('.seg')[1].querySelector('[aria-pressed="true"]').focus(); }),
        el('p', {class: 'set-hint', text: t('theme.hint')})),
      el('section', {class: 'set-sec'}, el('h3', {text: t('settings.share')}), shareRow),
      el('section', {class: 'set-sec'}, el('h3', {text: t('settings.about')}), about),
      el('button', {type: 'button', class: 'sheet-close', text: t('share.done'), onclick: () => sheet.close()}));
  }
  function open() {
    if (!sheet) {
      sheet = el('dialog', {class: 'sheet settings-sheet', 'aria-labelledby': 'settings-title'});
      sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });
      document.body.append(sheet);
    }
    render();
    sheet.showModal();
    sheet.querySelector('.seg-opt[aria-pressed="true"]')?.focus();
  }

  button.hidden = false;
  button.addEventListener('click', open);
})();
