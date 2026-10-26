/* The "Install app" button. Only Chrome and Edge offer an install prompt the page can open, and only once
   they decide the page qualifies; everywhere else (iPhone, iPad, Firefox, Safari on Mac) the button shows
   the steps for that browser instead. Hidden when the app is already running installed. */
(function () {
  'use strict';
  const button = document.getElementById('install');
  if (!button) return;

  const installed = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (installed()) return;
  button.hidden = false;

  let promptEvent = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); promptEvent = e; });
  window.addEventListener('appinstalled', () => { button.hidden = true; closeSheet(); });

  const ua = navigator.userAgent;
  const iOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const firefox = /Firefox|FxiOS/.test(ua);
  const samsung = /SamsungBrowser/.test(ua);
  const edge = /Edg\//.test(ua);
  const chrome = /Chrome|CriOS/.test(ua) && !edge && !samsung;
  const macSafari = !iOS && /Macintosh/.test(ua) && /Safari/.test(ua) && !chrome && !edge && !firefox;

  /* Each step is [lead, rest]: the lead is what to tap, shown in bold. */
  function steps() {
    if (iOS) return {
      title: 'Install on iPhone or iPad',
      list: [['Tap Share', ' (the square with an arrow) in the browser toolbar.'],
             ['Scroll and tap Add to Home Screen.', ''],
             ['Tap Add.', ' The app opens from your Home Screen and works offline.']],
      note: firefox ? 'In Firefox, Share is in the menu (☰).' : 'Works in Safari, and in Chrome and Edge on iOS 16.4 or later.'
    };
    if (android && firefox) return {
      title: 'Install on Android',
      list: [['Tap the menu', ' (⋮).'], ['Tap Install', ' or Add to Home screen.']]
    };
    if (android) return {
      title: 'Install on Android',
      list: [['Tap the menu', samsung ? ' (☰) at the bottom.' : ' (⋮) at the top right.'],
             [samsung ? 'Tap Add page to, then Home screen.' : 'Tap Install app', samsung ? '' : ' or Add to Home screen.'],
             ['Confirm with Install.', ' The app opens from your home screen and works offline.']]
    };
    if (macSafari) return {
      title: 'Install on a Mac',
      list: [['In the menu bar, choose File', ' › Add to Dock (Safari 17 or later).'], ['Click Add.', '']]
    };
    if (firefox) return {
      title: 'Install this app',
      list: [['Firefox on a computer can’t install web apps.', ' Open this page in Chrome or Edge to install it.']]
    };
    return {
      title: 'Install on this computer',
      list: [['Click the install icon', ' at the right end of the address bar (a screen with a down arrow).'],
             ['Or open the menu', edge ? ' (…) › Apps › Install this site as an app.' : ' (⋮) › Cast, save and share › Install page as app.'],
             ['Click Install.', ' The app gets its own window and works offline.']]
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
    const done = document.createElement('button'); done.type = 'button'; done.className = 'sheet-close'; done.textContent = 'Got it';
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
      if (choice.outcome === 'accepted') button.hidden = true;
      return;
    }
    openSheet();
  });
})();
