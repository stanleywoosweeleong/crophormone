/* The share sheet: a QR code, WhatsApp, copy link, and the phone's own share menu where there is one.
   The link opens the same tab and crop the sharer is looking at; the WhatsApp preview card comes from the
   Open Graph tags in index.html. */
(function () {
  'use strict';
  const button = document.getElementById('share-btn');
  if (!button) return;
  const t = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  /* QR library, loaded only when the sheet first opens; the service worker keeps a copy for offline use. */
  const QR_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
  const QR_SRI = 'sha512-ZDSPMa/JM1D+7kdg2x3BsruQ6T/JpJo3jWDWkCZsP+5yVyp1KfESqLI+7RqB5k24F7p2cV7i2YHh/890y6P6Sw==';
  let qrLoading = null;
  function loadQr() {
    if (typeof window.qrcode === 'function') return Promise.resolve();
    if (!qrLoading) qrLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = QR_SRC; s.integrity = QR_SRI; s.crossOrigin = 'anonymous'; s.referrerPolicy = 'no-referrer';
      s.onload = resolve;
      s.onerror = () => { qrLoading = null; reject(new Error('qr')); };
      document.head.append(s);
    });
    return qrLoading;
  }

  const report = /report\.html$/.test(location.pathname);
  const VIEWS = ['overview', 'regulators', 'flowering', 'fruitset', 'ripening'];
  function savedCrop() { try { return localStorage.getItem('crophormone.crop'); } catch (e) { return null; } }
  /* The app's own address with ?crop= and the tab, so the person opening it sees the same view. */
  function link() {
    const base = location.origin + location.pathname.replace(/index\.html$/, '');
    if (report) return base;
    const view = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'overview';
    const crop = savedCrop();
    return base + (crop ? '?crop=' + encodeURIComponent(crop) : '') + '#' + view;
  }

  /* Dark modules on a white square with a 4-module quiet zone, so it scans in dark mode too. */
  function qrSvg(text) {
    const qr = window.qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount(), q = 4;
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q},${r + q}h1v1h-1z`;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${n + 2 * q} ${n + 2 * q}`);
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', t('share.qrAria'));
    const bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('width', '100%'); bg.setAttribute('height', '100%'); bg.setAttribute('fill', '#fff');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', d); path.setAttribute('fill', '#111');
    svg.append(bg, path);
    return svg;
  }

  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'text') n.textContent = v; else if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v);
    });
    kids.forEach(k => k != null && n.append(k));
    return n;
  }

  async function copy(text, input, btn) {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      /* Older browsers and some in-app browsers: select the field and use the legacy copy command. */
      input.focus(); input.select();
      try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
    }
    const label = btn.querySelector('span');
    label.textContent = ok ? t('share.copied') : t('share.copyFail');
    clearTimeout(btn.timer);
    btn.timer = setTimeout(() => { label.textContent = t('share.copy'); }, 2500);
  }

  const ICON = {
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
    more: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>'
  };
  /* Icons are our own fixed markup; labels are set as text. */
  const iconBtn = (cls, icon, label, attrs) => {
    const b = el(attrs && attrs.href ? 'a' : 'button', Object.assign({class: 'share-act ' + cls}, attrs && attrs.href ? {} : {type: 'button'}, attrs || {}));
    b.innerHTML = ICON[icon];
    b.append(el('span', {text: label}));
    return b;
  };

  let sheet = null;
  function open() {
    const url = link();
    if (!sheet) {
      sheet = el('dialog', {class: 'sheet share-sheet', 'aria-labelledby': 'share-title'});
      sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });
      document.body.append(sheet);
    }
    const view = report ? null : (VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'overview');
    const crop = savedCrop();
    const what = report ? t('share.whatReport')
      : t('share.what', {tab: t('tab.' + view), crop: crop && window.I18N ? window.I18N.crop(crop) : (crop || '')});
    const qrBox = el('div', {class: 'share-qr'}, el('div', {class: 'loading'}));
    const input = el('input', {class: 'share-url', type: 'text', readonly: '', value: url, 'aria-label': t('share.link')});
    input.addEventListener('focus', () => input.select());
    const message = t('share.message');
    const acts = el('div', {class: 'share-acts'},
      iconBtn('wa', 'wa', 'WhatsApp', {href: 'https://wa.me/?text=' + encodeURIComponent(message + '\n' + url), target: '_blank', rel: 'noopener'}));
    const copyBtn = iconBtn('copy', 'copy', t('share.copy'));
    copyBtn.addEventListener('click', () => copy(url, input, copyBtn));
    acts.append(copyBtn);
    if (navigator.share) {
      const more = iconBtn('more', 'more', t('share.more'));
      more.addEventListener('click', () => navigator.share({title: t('app.title'), text: message, url}).catch(() => {}));
      acts.append(more);
    }
    const done = el('button', {type: 'button', class: 'sheet-close', text: t('share.done'), onclick: () => sheet.close()});
    sheet.replaceChildren(
      el('h2', {id: 'share-title', text: t('share.title')}),
      el('p', {class: 'note', text: what}),
      el('figure', {class: 'share-fig'}, qrBox, el('figcaption', {text: t('share.scan')})),
      input, acts, done);
    sheet.showModal();
    done.focus();
    loadQr().then(() => qrBox.replaceChildren(qrSvg(url)))
      .catch(() => qrBox.replaceChildren(el('p', {class: 'note', text: t('share.qrFail')})));
  }

  button.hidden = false;
  button.addEventListener('click', open);
})();
