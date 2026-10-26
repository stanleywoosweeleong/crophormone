/* Registers the service worker and tells the reader when the app has changed.
   - On opening: if files changed since the last visit, this page already shows the new version, so say so.
   - While open: checks again when the app comes back to the foreground and every 30 minutes; if files
     changed, offer a reload. */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  /* Messages in the chosen language when i18n.js is loaded, English otherwise. */
  const EN = {'toast.updated': 'App updated to the latest version.', 'toast.new': 'A new version is available.', 'toast.reload': 'Reload', 'toast.ok': 'OK'};
  const t = k => (window.I18N ? window.I18N.t(k) : EN[k]);

  function toast(message, action) {
    let box = document.getElementById('update-toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'update-toast';
      box.className = 'toast';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.append(box);
    }
    const text = document.createElement('span');
    text.textContent = message;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = action ? action.label : t('toast.ok');
    button.addEventListener('click', () => { box.hidden = true; if (action) action.run(); });
    box.replaceChildren(text, button);
    box.hidden = false;
    clearTimeout(box.timer);
    if (!action) box.timer = setTimeout(() => { box.hidden = true; }, 6000);
  }

  navigator.serviceWorker.addEventListener('message', event => {
    const msg = event.data;
    if (!msg || msg.type !== 'UPDATE_CHECKED' || !msg.changed) return;
    if (msg.reason === 'open') toast(t('toast.updated'));
    else toast(t('toast.new'), {label: t('toast.reload'), run: () => location.reload()});
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(reg => {
      const ask = reason => navigator.serviceWorker.ready
        .then(r => r.active && r.active.postMessage({type: 'CHECK_FOR_UPDATE', reason}));
      ask('open');
      /* A newly installed worker takes over while this page still runs the old scripts, so offer a reload. */
      navigator.serviceWorker.addEventListener('controllerchange', () => ask('resume'));
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        reg.update().catch(() => {});
        ask('resume');
      });
      setInterval(() => { if (document.visibilityState === 'visible') ask('resume'); }, 30 * 60 * 1000);
    }).catch(() => {});
  });
})();
