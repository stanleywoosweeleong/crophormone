/* The "Install app" button. Browsers with an install prompt the page can open (Chrome, Edge, Samsung Internet)
   show the button only once they offer it, so it stays hidden when the app is already installed; everywhere else
   (iPhone, iPad, Firefox, Safari on Mac) the button shows the steps for that browser instead. */
(function () {
  'use strict';
  const button = document.getElementById('install');
  if (!button) return;

  const installed = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (installed()) return;
  const hasPrompt = 'BeforeInstallPromptEvent' in window;
  button.hidden = hasPrompt;

  /* No preventDefault: the browser may still show its own install banner, and Chrome logs no "Banner not shown"
     message. The saved event opens the same prompt from the button. */
  let promptEvent = null;
  window.addEventListener('beforeinstallprompt', e => { promptEvent = e; button.hidden = false; });
  window.addEventListener('appinstalled', () => { button.hidden = true; closeSheet(); });

  /* Browser detection is only needed for the steps sheet, so it runs when the sheet opens. */
  function steps() {
    const ua = navigator.userAgent;
    const iOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const android = /Android/.test(ua);
    const firefox = /Firefox|FxiOS/.test(ua);
    const samsung = /SamsungBrowser/.test(ua);
    const edge = /Edg\//.test(ua);
    const chrome = /Chrome|CriOS/.test(ua) && !edge && !samsung;
    const macSafari = !iOS && /Macintosh/.test(ua) && /Safari/.test(ua) && !chrome && !edge && !firefox;

    /* Each step is [lead, rest]: the lead is what to tap, shown in bold. Menu names follow the browser's own
       wording in the chosen language. */
    const t = k => (window.I18N ? window.I18N.t(k) : k);
    if (iOS) return {
      title: t('inst.ios.title'),
      list: [[t('inst.ios.1a'), t('inst.ios.1b')], [t('inst.ios.2a'), ''], [t('inst.ios.3a'), t('inst.ios.3b')]],
      note: t(firefox ? 'inst.ios.ff' : 'inst.ios.note')
    };
    if (android && firefox) return {
      title: t('inst.and.title'),
      list: [[t('inst.and.menu'), t('inst.and.menuFf')], [t('inst.and.ffInstall'), t('inst.and.orHome')]]
    };
    if (android) return {
      title: t('inst.and.title'),
      list: [[t('inst.and.menu'), t(samsung ? 'inst.and.menuSam' : 'inst.and.menuTop')],
             [samsung ? t('inst.and.sam') : t('inst.and.install'), samsung ? '' : t('inst.and.orHome')],
             [t('inst.and.confirm'), t('inst.and.after')]]
    };
    if (macSafari) return {
      title: t('inst.mac.title'),
      list: [[t('inst.mac.1a'), t('inst.mac.1b')], [t('inst.mac.2a'), '']]
    };
    if (firefox) return {
      title: t('inst.ff.title'),
      list: [[t('inst.ff.1a'), t('inst.ff.1b')]]
    };
    return {
      title: t('inst.pc.title'),
      list: [[t('inst.pc.1a'), t('inst.pc.1b')],
             [t('inst.pc.2a'), t(edge ? 'inst.pc.2edge' : 'inst.pc.2chrome')],
             [t('inst.pc.3a'), t('inst.pc.3b')]]
    };
  }

  let sheet = null;
  function closeSheet() { if (sheet && sheet.open) sheet.close(); }
  function openSheet() {
    const s = steps();
    if (!sheet) {
      sheet = document.createElement('dialog');
      sheet.className = 'sheet';
      sheet.setAttribute('aria-labelledby', 'install-title');
      sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });
      document.body.append(sheet);
    }
    const h = document.createElement('h2'); h.id = 'install-title'; h.textContent = s.title;
    const ol = document.createElement('ol');
    s.list.forEach(([lead, rest]) => {
      const li = document.createElement('li'); const b = document.createElement('strong');
      b.textContent = lead; li.append(b, rest); ol.append(li);
    });
    const parts = [h, ol];
    if (s.note) { const p = document.createElement('p'); p.className = 'note'; p.textContent = s.note; parts.push(p); }
    const done = document.createElement('button'); done.type = 'button'; done.className = 'sheet-close'; done.textContent = window.I18N ? window.I18N.t('inst.done') : 'Got it';
    done.addEventListener('click', closeSheet);
    parts.push(done);
    sheet.replaceChildren(...parts);
    sheet.showModal();
    done.focus();
  }

  button.addEventListener('click', async () => {
    if (promptEvent) {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      promptEvent = null;
      button.hidden = choice.outcome === 'accepted' || hasPrompt;
      return;
    }
    openSheet();
  });
})();
