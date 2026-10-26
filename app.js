/* Tropical fruit hormone charts: loads the CSVs in data/, routes between views by hash, draws each chart. */
(function () {
  'use strict';

  const FILES = {
    evidence: 'data/hormone_evidence.csv',
    regulators: 'data/regulators.csv',
    soil: 'data/soil_persistence.csv',
    mrls: 'data/fruit_mrls.csv',
    ripening: 'data/ripening_ethylene.csv',
    mangoLeaf: 'data/flowering_mango_leaf.csv',
    longan: 'data/flowering_longan.csv',
    pbz: 'data/flowering_pct_change.csv',
    fruitset: 'data/fruitset_fold.csv'
  };
  const VIEWS = ['overview', 'regulators', 'ripening', 'flowering', 'fruitset'];
  const STAGES = ['Flowering', 'Fruit set', 'Ripening'];
  /* Every hormone class the app covers; "group" splits the five classic hormones from the others. */
  const HORMONES = [
    {key: 'GA', name: 'Gibberellin (GA)', group: 'Classic hormones'},
    {key: 'Cytokinin', name: 'Cytokinin', group: 'Classic hormones'},
    {key: 'ABA', name: 'Abscisic acid (ABA)', group: 'Classic hormones'},
    {key: 'IAA', name: 'Auxin (IAA)', group: 'Classic hormones'},
    {key: 'Ethylene', name: 'Ethylene', group: 'Classic hormones'},
    {key: 'JA', name: 'Jasmonates (JA)', group: 'Other hormones'},
    {key: 'SA', name: 'Salicylic acid (SA)', group: 'Other hormones'},
    {key: 'BR', name: 'Brassinosteroids (BR)', group: 'Other hormones'},
    {key: 'Polyamines', name: 'Polyamines', group: 'Other hormones'},
    {key: 'Strigolactones', name: 'Strigolactones', group: 'Other hormones'}
  ];
  const HORMONE_KEYS = new Set(HORMONES.map(h => h.key));
  /* Display text in the chosen language (i18n.js). Data keys such as crop and stage names stay in English. */
  const L = window.I18N;
  const t = (k, v) => L.t(k, v);
  const cropN = c => L.crop(c);
  const hName = k => L.hormone(k);
  const list = items => items.join(t('sep'));
  const DIRECTION = {
    'Up': {glyph: '▲', cls: 'up', key: 'up'},
    'Up in drop': {glyph: '▲', cls: 'drop', key: 'drop'},
    'Down': {glyph: '▼', cls: 'down', key: 'down'},
    'Peak': {glyph: '▲', cls: 'peak', key: 'peak'},
    'Low': {glyph: '▽', cls: 'low', key: 'low'},
    'Mixed': {glyph: '◆', cls: 'mix', key: 'mix'},
    'Conflicting': {glyph: '◆', cls: 'mix', key: 'conflict'},
    'Not a driver': {glyph: '○', cls: 'nod', key: 'nod'},
    'Applied': {glyph: '◇', cls: 'trt', key: 'trt'},
    'No data': {glyph: '·', cls: 'nd', key: 'nd'}
  };
  /* The full word for a mark ("Stays low") and the short one used inside table cells ("Low"). */
  const word = d => t('dir.' + d.key);
  const shortWord = d => (d.key === 'nd' ? '—' : t('short.' + d.key));
  const VERIFY = {
    FT: {color: 'var(--v-ft)'},
    ABS: {color: 'var(--v-abs)'},
    SEC: {color: 'var(--v-sec)'},
    SNIP: {color: 'var(--v-snip)'}
  };
  const fmt = v => d3.format('~g')(v);
  const dir = v => DIRECTION[v] || DIRECTION['Mixed'];
  const narrow = () => window.matchMedia('(max-width: 899px)').matches;

  const data = {};
  const DEFAULT_CROP = 'Durian';
  const state = {crop: DEFAULT_CROP, stage: 'Flowering', view: 'overview', regAll: false, regStage: '', regMeasured: false, listOpen: false};
  /* The chosen crop is remembered on this device; storage can be blocked (private mode), so failures are ignored. */
  const CROP_KEY = 'crophormone.crop';
  const savedCrop = () => { try { return localStorage.getItem(CROP_KEY); } catch (e) { return null; } };
  const saveCrop = crop => { try { localStorage.setItem(CROP_KEY, crop); } catch (e) { /* not remembered */ } };

  /* The default crop first, then the rest alphabetically. */
  const cropOrder = rows => [...new Set(rows.map(r => r.crop))]
    .sort((a, b) => (b === DEFAULT_CROP) - (a === DEFAULT_CROP) || cropN(a).localeCompare(cropN(b), document.documentElement.lang));

  /* ---------- small DOM helpers ---------- */
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    kids.forEach(k => k != null && n.append(k));
    return n;
  }
  function safeLink(text, url) {
    if (url && /^https:\/\//.test(url)) return el('a', {href: url, target: '_blank', rel: 'noopener', text});
    return document.createTextNode(text);
  }
  /* Source link plus its DOI, shown only for DOIs confirmed at doi.org when the data was built. */
  function cite(text, url, doi) {
    const link = safeLink(text, url);
    if (!doi || !/^10\.\d{4,9}\/\S+$/.test(doi)) return link;
    return el('span', {}, link, ' · ', el('a', {class: 'doi', href: 'https://doi.org/' + doi, target: '_blank', rel: 'noopener', text: 'DOI ' + doi}));
  }
  function readout(id, title, lines, source) {
    const box = document.getElementById(id);
    box.replaceChildren(el('span', {class: 't', text: title}));
    lines.forEach(l => box.append(el('span', {text: l})));
    if (source) box.append(el('span', {class: 'm'}, `${source.level} · `, cite(source.name, source.url, source.doi)));
  }
  function readoutList(id, title, items) {
    const box = document.getElementById(id);
    box.replaceChildren(el('span', {class: 't', text: title}));
    items.forEach(it => box.append(el('span', {class: 'ro-item'}, it.text,
      it.source ? el('span', {class: 'm'}, ` · ${it.source.level} · `, cite(it.source.name, it.source.url, it.source.doi)) : null)));
  }
  function failed(id) {
    document.getElementById(id).replaceChildren(el('div', {class: 'fail', text: t('fail')}));
  }

  /* ---------- routing ---------- */
  function route() {
    const v = location.hash.slice(1);
    state.view = VIEWS.includes(v) ? v : 'overview';
    VIEWS.forEach(id => { document.getElementById('view-' + id).hidden = id !== state.view; });
    document.querySelectorAll('.tabs a, .bottom-nav a').forEach(a => {
      if (a.getAttribute('href') === '#' + state.view) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    drawView();
  }

  /* ---------- evidence lookups ---------- */
  /* What a cell shows: the direction, or "Applied" when the hormone was only tested as a spray or dip. */
  const shown = r => !r ? 'No data' : r.basis === 'Treatment only' ? 'Applied' : (DIRECTION[r.direction] ? r.direction : 'No data');
  const isMeasured = r => !!r && /measured/i.test(r.basis) && r.basis !== 'Treatment only';
  let evIndex = null;
  function evidence() {
    if (!data.evidence) return null;
    if (!evIndex) {
      evIndex = new Map();
      data.evidence.forEach(r => { const k = r.crop + '|' + r.stage + '|' + r.hormone; if (!evIndex.has(k)) evIndex.set(k, r); });
    }
    return evIndex;
  }
  const cell = (crop, stage, key) => evidence().get(crop + '|' + stage + '|' + key);
  const signals = (crop, stage) => data.evidence.filter(r => r.crop === crop && r.stage === stage && !HORMONE_KEYS.has(r.hormone) && r.basis !== 'No data');
  const measuredStages = crop => STAGES.filter(s => HORMONES.some(h => isMeasured(cell(crop, s, h.key)))).length;
  function coverage(crop) {
    const c = {measured: 0, inferred: 0, applied: 0, none: 0};
    STAGES.forEach(s => HORMONES.forEach(h => {
      const r = cell(crop, s, h.key);
      if (isMeasured(r)) c.measured++;
      else if (r && r.basis === 'Inferred' && r.direction !== 'No data') c.inferred++;
      else if (r && r.basis === 'Treatment only') c.applied++;
      else c.none++;
    }));
    return c;
  }
  const dots = n => el('span', {class: 'dots', 'aria-hidden': 'true'}, ...STAGES.map((s, i) => el('i', {class: i < n ? 'on' : ''})));
  /* How a value was checked (Full text, Abstract…), in the chosen language; unknown codes are shown as they are. */
  const verName = v => (v ? (t('v.' + v) === 'v.' + v ? v : t('v.' + v)) : '');

  /* ---------- overview: one crop at a time, chosen from a picker ---------- */
  function badge(r) {
    const v = shown(r), d = DIRECTION[v];
    const inferred = !!r && r.basis === 'Inferred' && d.cls !== 'nd';
    return el('span', {class: `c ${d.cls}${inferred ? ' inferred' : ''}`, title: word(d) + (inferred ? t('inferred') : '')},
      d.cls === 'nd' ? null : el('span', {'aria-hidden': 'true', text: d.glyph}), shortWord(d));
  }

  function evidenceLine(name, r) {
    const tag = [r.basis ? t('basis.' + r.basis) : '', verName(r.verification)].filter(Boolean).join(' · ');
    const value = r.value ? ` (${r.value}${r.units ? ' ' + r.units : ''}${r.tissue ? ', ' + r.tissue : ''})` : '';
    return el('p', {}, el('strong', {text: name + t('colon')}), (r.note || '') + value, ' ',
      el('span', {class: 'src'}, `${tag}${r.source ? ' · ' : ''}`, r.source ? cite(r.source, r.source_url, r.doi) : null));
  }

  /* The evidence behind one stage: the shared note for the classic hormones, then each other hormone and signal. */
  function stageEvidence(crop, stage) {
    const parts = [el('h3', {text: L.stage(stage)})];
    const byNote = new Map();
    HORMONES.filter(h => h.group === 'Classic hormones').forEach(h => {
      const r = cell(crop, stage, h.key);
      if (!r || !r.note) return;
      const entry = byNote.get(r.note) || {names: [], r};
      entry.names.push(h.key);
      byNote.set(r.note, entry);
    });
    byNote.forEach(({names, r}) => parts.push(byNote.size === 1 ? el('p', {}, el('strong', {text: t('group.Classic hormones') + t('colon')}), r.note)
      : evidenceLine(list(names.map(hName)), r)));
    const none = [];
    HORMONES.filter(h => h.group === 'Other hormones').forEach(h => {
      const r = cell(crop, stage, h.key);
      if (!r || r.basis === 'No data') { none.push(h.key); return; }
      parts.push(evidenceLine(hName(h.key), r));
    });
    signals(crop, stage).forEach(r => parts.push(evidenceLine(r.hormone, r)));
    if (none.length) parts.push(el('p', {class: 'none', text: t('ev.none', {list: list(none.map(hName))})}));
    return el('section', {class: 'ev-stage'}, ...parts);
  }

  /* The chosen crop: one compact table (hormones down, stages across), evidence folded away below it. */
  function cropPanel(crop) {
    const table = el('div', {class: 'ct', role: 'table', 'aria-label': t('table.aria', {crop: cropN(crop)})});
    const row = (...cells) => el('div', {class: 'ct-row', role: 'row'}, ...cells);
    table.append(row(el('div', {role: 'columnheader'}), ...STAGES.map(s => el('div', {class: 'ct-stage', role: 'columnheader', text: L.stage(s)}))));
    let group = null;
    /* Hormones with no study at any stage are listed in one line under the table instead of three dashes each. */
    const empty = HORMONES.filter(h => STAGES.every(s => shown(cell(crop, s, h.key)) === 'No data'));
    HORMONES.filter(h => !empty.includes(h)).forEach(h => {
      if (h.group !== group) { group = h.group; table.append(row(el('div', {class: 'ct-group', role: 'rowheader', text: t('group.' + group)}))); }
      table.append(row(el('div', {class: 'ct-h', role: 'rowheader', text: hName(h.key)}), ...STAGES.map(s => {
        const r = cell(crop, s, h.key);
        return el('div', {role: 'cell', 'aria-label': `${hName(h.key)}, ${L.stage(s)}: ${word(DIRECTION[shown(r)])}`}, badge(r));
      })));
    });
    const c = coverage(crop);
    const summary = el('p', {class: 'cov'},
      el('strong', {text: t('cov.count', {m: c.measured})}), t('cov.rest', {i: c.inferred, a: c.applied, n: c.none}));
    const ev = el('details', {class: 'ev'}, el('summary', {text: t('ev.summary')}), ...STAGES.map(s => stageEvidence(crop, s)));
    const marks = STAGES.flatMap(s => HORMONES.map(h => cell(crop, s, h.key)))
      .filter(r => r && r.direction_note && ['Mixed', 'Up in drop'].includes(shown(r)));
    /* One line for all At-drop cells (they share a reason), one per Mixed cell. */
    const drops = marks.filter(r => r.direction === 'Up in drop');
    const why = el('div', {class: 'mark-why'},
      drops.length ? el('p', {}, el('span', {class: 'c drop'}, el('span', {'aria-hidden': 'true', text: '▲'}), t('short.drop')), ' ',
        el('strong', {text: t('why.head', {hormones: drops.map(r => hName(r.hormone)).join(t('and')), stage: L.stageL(drops[0].stage)})}),
        /* Inferred cells borrow the pattern from other fruit, so say that before stating it. */
        drops.every(r => r.basis === 'Inferred') ? el('em', {text: t('why.inferred', {crop: cropN(crop)})}) : null,
        t(drops.every(r => r.basis === 'Inferred') ? 'why.dropInferred' : drops.length > 1 ? 'why.drop2' : 'why.drop1')) : null,
      ...marks.filter(r => r.direction === 'Mixed').map(r => el('p', {},
        el('span', {class: 'c mix'}, el('span', {'aria-hidden': 'true', text: '◆'}), t('short.mix')), ' ',
        el('strong', {text: t('why.head', {hormones: hName(r.hormone), stage: L.stageL(r.stage)})}), L.field(r, 'direction_note'))));
    const gaps = empty.length ? el('p', {class: 'gaps'}, el('strong', {text: t('gaps.label')}), list(empty.map(h => hName(h.key))),
      t('gaps.rest')) : null;
    return el('div', {class: 'crop-panel', role: 'region', 'aria-label': crop}, summary, table, marks.length ? why : null, gaps, ev);
  }


  /* The chosen crop lives in the top bar on every tab; its tile list opens in a panel under the bar. */
  function drawCropChip() {
    const chip = document.getElementById('crop-chip');
    const panel = document.getElementById('crop-panel');
    if (!evidence()) return;
    const crops = cropOrder(data.evidence);
    if (!crops.includes(state.crop)) state.crop = crops[0];
    chip.hidden = false;
    chip.setAttribute('aria-expanded', String(!!state.listOpen));
    chip.setAttribute('aria-label', t('chip.aria', {crop: cropN(state.crop), action: t(state.listOpen ? 'chip.hide' : 'chip.show'), n: crops.length}));
    chip.replaceChildren(el('span', {class: 'chip-label', text: t('chip.label')}), el('span', {class: 'chip-name', text: cropN(state.crop)}),
      el('span', {class: 'caret', 'aria-hidden': 'true', text: '▾'}));
    panel.hidden = !state.listOpen;
    panel.replaceChildren(...(state.listOpen ? [el('div', {class: 'crop-menu', role: 'group', 'aria-label': t('menu.aria')},
      ...crops.map(crop => {
        const n = measuredStages(crop);
        return el('button', {type: 'button', class: 'crop-opt', 'aria-pressed': String(crop === state.crop), 'aria-label': t('opt.aria', {crop: cropN(crop), n}),
          onclick: () => selectCrop(crop)}, el('span', {text: cropN(crop)}), dots(n));
      }),
      el('p', {class: 'crop-menu-note', text: t('menu.note')}))] : []));
  }
  /* The crop menu floats over the page; it closes on a pick, a tap outside it, or Esc. */
  function closeCropMenu() {
    if (!state.listOpen) return;
    state.listOpen = false;
    drawCropChip();
  }


  function drawCropCard() {
    if (data.evidence === null) return failed('crop-detail');
    if (!evidence()) return;
    const crops = cropOrder(data.evidence);
    if (!crops.includes(state.crop)) state.crop = crops[0];
    document.getElementById('crop-title').textContent = t('overview.cropTitle', {crop: cropN(state.crop)});
    document.getElementById('crop-detail').replaceChildren(cropPanel(state.crop));
  }

  /* Note above a cross-crop chart: whether the chosen crop is in it. */
  function cropNote(id, inChart, what) {
    const n = document.getElementById(id);
    n.hidden = false;
    n.textContent = inChart ? t('note.highlighted', {crop: cropN(state.crop)}) : t('note.missing', {what: t(what), crop: cropN(state.crop)});
    n.classList.toggle('missing', !inChart);
  }

  function selectCrop(crop, scroll) {
    state.crop = crop;
    saveCrop(crop);
    Object.keys(tapped).forEach(k => delete tapped[k]);
    state.listOpen = false;
    state.regShown = 0;
    drawView();
    if (scroll && state.view === 'overview') document.getElementById('crop-card').scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  /* ---------- overview: compare all crops at one stage ---------- */
  function drawCompare(stage) {
    const box = document.getElementById('cmp-' + state.view);
    if (!box) return;
    if (data.evidence === null) return failed(box.id);
    if (!evidence()) return;
    state.stage = stage;
    const crops = cropOrder(data.evidence);
    const head = document.getElementById('cmp-head-' + state.view);
    if (head) head.replaceChildren(t('cmp.head', {stage: L.stageL(stage), crop: cropN(state.crop)}),
      el('a', {href: '#overview', text: t('cmp.link', {crop: cropN(state.crop)})}), L.lang === 'zh' ? '。' : '.');
    /* One card per hormone; inside, crops grouped by direction, in this order. */
    const ORDER = ['Up', 'Up in drop', 'Peak', 'Down', 'Low', 'Mixed', 'Conflicting', 'Not a driver', 'Applied', 'No data'];
    let group = null;
    const cards = [];
    /* Hormones no crop has any data for at this stage get one summary line per group, not a card each. */
    const blank = h => crops.every(crop => shown(cell(crop, state.stage, h.key)) === 'No data');
    HORMONES.forEach(h => {
      if (h.group !== group) {
        group = h.group;
        cards.push(el('h3', {class: 'cmp-group', text: t('group.' + group)}));
        const none = HORMONES.filter(x => x.group === group && blank(x));
        if (none.length) cards.push(el('p', {class: 'gaps cmp-gaps'}, el('strong', {text: t('cmp.none', {stage: L.stageL(state.stage)})}),
          list(none.map(x => hName(x.key))) + (L.lang === 'zh' ? '。' : '.')));
      }
      if (blank(h)) return;
      const groups = new Map(ORDER.map(k => [k, []]));
      crops.forEach(crop => {
        const r = cell(crop, state.stage, h.key);
        groups.get(shown(r)).push({crop, inferred: !!r && r.basis === 'Inferred'});
      });
      const measured = crops.filter(crop => isMeasured(cell(crop, state.stage, h.key))).length;
      const lines = ORDER.filter(k => groups.get(k).length).map(k => {
        const d = DIRECTION[k];
        if (k === 'No data') {
          /* Crops without a study fold away behind a count. */
          const names = groups.get(k);
          return el('details', {class: 'grp nd'},
            el('summary', {text: names.length === 1 ? t('cmp.noStudy1') : t('cmp.noStudy', {n: names.length})}),
            el('span', {class: 'names'}, ...names.map(g => el('button', {type: 'button', class: 'name', text: cropN(g.crop), onclick: () => selectCrop(g.crop)}))));
        }
        return el('div', {class: 'grp'},
          el('span', {class: `c ${d.cls}`}, el('span', {'aria-hidden': 'true', text: d.glyph}), word(d)),
          k === 'Conflicting' ? el('span', {class: 'why', text: t('why.conflict')}) : null,
          k === 'Up in drop' ? el('span', {class: 'why', text: t('why.dropStage') + (groups.get(k).some(g => g.inferred) ? t('why.dashed') : '')}) : null,
          k === 'Mixed' ? el('span', {class: 'why', text: t('why.mixed')}) : null,
          k === 'Mixed' ? el('ul', {class: 'mix-list'}, ...groups.get(k).map(g => el('li', {},
            el('button', {type: 'button', class: 'name' + (g.crop === state.crop ? ' on' : ''), text: cropN(g.crop), onclick: () => selectCrop(g.crop)}),
            ' ' + L.field(cell(g.crop, state.stage, h.key), 'direction_note')))) : null,
          k === 'Applied' ? el('span', {class: 'why', text: t('why.applied')}) : null,
          k === 'Not a driver' ? el('span', {class: 'why', text: t('why.nod')}) : null,
          k === 'Mixed' ? null : el('span', {class: 'names'}, ...groups.get(k).map(g => el('button', {
            type: 'button', class: 'name' + (g.inferred && k !== 'No data' ? ' inferred' : '') + (g.crop === state.crop ? ' on' : ''),
            'aria-label': t('cmp.open', {crop: cropN(g.crop), dir: word(d), inf: g.inferred ? t('inferredShort') : ''}),
            text: cropN(g.crop), onclick: () => selectCrop(g.crop)
          }))));
      });
      /* One summary line per hormone: the chosen crop's direction and how many crops go each way; tap for names. */
      const mine = cell(state.crop, state.stage, h.key);
      const counts = ORDER.filter(k => k !== 'No data' && groups.get(k).length).map(k =>
        el('span', {class: `cnt-chip c ${DIRECTION[k].cls}`, title: word(DIRECTION[k])}, el('span', {'aria-hidden': 'true', text: DIRECTION[k].glyph}), String(groups.get(k).length)));
      const noData = groups.get('No data').length;
      cards.push(el('details', {class: 'cmp-card', name: 'cmp-line'},
        el('summary', {},
          el('span', {class: 'cmp-name', text: hName(h.key)}),
          el('span', {class: 'cmp-mine'}, cropN(state.crop) + t('colon'), badge(mine)),
          el('span', {class: 'cmp-counts', role: 'img', 'aria-label': t('cmp.measured', {m: measured, n: crops.length})}, ...counts,
            noData ? el('span', {class: 'cnt', text: t('cmp.noData', {n: noData})}) : null)),
        ...lines));
    });
    box.replaceChildren(...cards);
  }

  /* ---------- residues: soil persistence and fruit limits ---------- */
  const RESIDUE_KEYS = [[/paclobutrazol/, 'paclobutrazol'], [/uniconazole/, 'uniconazole'], [/prohexadione/, 'prohexadione'],
    [/gibberell|\bga3\b|ga₃/, 'ga3'], [/ethephon|chloroethylphosphonic/, 'ethephon'], [/1-mcp|methylcyclopropene/, '1mcp'],
    [/aminoethoxyvinylglycine|\bavg\b/, 'avg'], [/naphthaleneacetic|\bnaa\b/, 'naa'], [/2,4-d(?!p)/, '24d'], [/4-cpa|chlorophenoxyacetic/, '4cpa'],
    [/triclopyr|3,5,6-tpa/, 'triclopyr'], [/dichlorprop|2,4-dp/, 'dichlorprop'], [/forchlorfenuron|cppu/, 'cppu'],
    [/benzyladenine|6-ba\b/, 'ba'], [/potassium nitrate|kno3|kno₃/, 'kno3'], [/chlorate|kclo3|kclo₃/, 'chlorate'], [/thiourea/, 'thiourea'],
    [/cyanamide/, 'cyanamide'], [/calcium carbide/, 'carbide'], [/abscisic|s-aba/, 'sabA'], [/methyl jasmonate|meja/, 'meja'],
    [/salicyl/, 'sa'], [/brassinolide/, 'br'], [/putrescine|spermidine|spermine/, 'polyamines'], [/melatonin/, 'melatonin'], [/permanganate/, 'kmno4']];
  const residueKeys = r => {
    const text = `${r.regulator} ${r.active_ingredient}`.toLowerCase();
    return RESIDUE_KEYS.filter(([re]) => re.test(text)).map(([, k]) => k);
  };
  const MRL_CROPS = {Citrus: ['citrus', 'orange', 'mandarin', 'lemon', 'lime'], Litchi: ['litchi', 'lychee']};
  const mrlCropMatch = (crop, mrlCrop) => {
    const m = mrlCrop.toLowerCase();
    return /^all|all tropical/.test(m) || (MRL_CROPS[crop] || [crop.toLowerCase()]).some(c => m.includes(c));
  };
  const firstUrl = u => (u || '').split(/;\s*/)[0];
  /* Persistence band from the class text; "very persistent" or leading "Persistent" is high, any "moderate" is mid. */
  const persistClass = t => /very persistent/i.test(t) || /^\s*persistent/i.test(t) ? 'high' : /moderate/i.test(t) ? 'mid' : /non-persistent/i.test(t) ? 'low' : 'unknown';

  /* A close button at the end of a long section, so readers need not scroll back up to its heading. */
  function closer() {
    return el('button', {type: 'button', class: 'closer', text: t('closer'), onclick: e => {
      const d = e.currentTarget.closest('details');
      d.open = false;
      const s = d.querySelector('summary');
      const bar = document.querySelector('header')?.getBoundingClientRect().bottom || 0;
      const top = s.getBoundingClientRect().top;
      if (top < bar || top > innerHeight) s.scrollIntoView({block: 'center'});
    }});
  }
  function residueSection(r) {
    const keys = residueKeys(r);
    if (!keys.length || !data.soil) return null;
    const parts = [];
    keys.forEach(k => {
      const soil = data.soil.find(x => x.key === k);
      const limits = (data.mrls || []).filter(x => x.key === k && mrlCropMatch(r.crop, x.crop));
      const name = soil ? L.field(soil, 'active_ingredient') : k;
      parts.push(el('h4', {text: name}));
      if (soil && soil.function) parts.push(el('p', {}, el('strong', {text: t('res.does')}), L.field(soil, 'function')));
      if (soil && soil.concern) parts.push(el('p', {}, el('strong', {text: t('res.concern')}), L.field(soil, 'concern')));
      if (soil) {
        parts.push(el('p', {}, soilBadge(soil),
          ' ', el('strong', {text: t('res.time97')}), L.field(soil, 'time_summary') || t('res.notFound'),
          soil.approx_time_to_97pct_gone ? el('span', {class: 'src', text: ` (${soil.approx_time_to_97pct_gone})`}) : null));
        if (soil.orchard_field_residues && !/^not found/i.test(soil.orchard_field_residues)) parts.push(el('p', {}, el('strong', {text: t('res.orchard')}), soil.orchard_field_residues));
        if (soil.accumulation_note && !/^no data/i.test(soil.accumulation_note)) parts.push(el('p', {}, el('strong', {text: t('res.repeat')}), soil.accumulation_note));
        if (soil.effects_on_trees_and_following_crops && !/^no .*found/i.test(soil.effects_on_trees_and_following_crops)) parts.push(el('p', {}, el('strong', {text: t('res.effects')}), soil.effects_on_trees_and_following_crops));
        if (soil.leaching_water_note) parts.push(el('p', {}, el('strong', {text: t('res.water')}), soil.leaching_water_note));
        if (soil.restrictions && !/^not found/i.test(soil.restrictions)) parts.push(el('p', {}, el('strong', {text: t('res.restrict')}), soil.restrictions));
        parts.push(el('p', {class: 'src'}, `${verName(soil.verification) || soil.verification} · `, cite(soil.source, firstUrl(soil.source_url), soil.doi)));
      }
      if (limits.length) {
        parts.push(el('p', {}, el('strong', {text: t('res.limits', {crop: cropN(r.crop)})})));
        parts.push(el('ul', {class: 'mrl'}, ...limits.map(m => el('li', {},
          m.market + t('colon'), el('strong', {text: m.mrl_mg_per_kg ? `${m.mrl_mg_per_kg} mg/kg` : m.note ? t('res.seeNote') : t('res.noValue')}),
          `${m.crop && !/^all/i.test(m.crop) ? ` (${m.crop})` : ''}${m.limit_type ? ' · ' + m.limit_type : ''}${m.measured_fruit_residues ? t('res.measured') + m.measured_fruit_residues : ''}`,
          /* The note carries caveats such as a superseded or unchecked limit, so it is shown with every value. */
          m.note ? el('span', {class: 'mrl-note', text: m.note}) : null,
          el('span', {class: 'src mrl-src'}, `${verName(m.verification) || m.verification}${m.verification ? ' · ' : ''}`, cite(m.source || t('source'), firstUrl(m.source_url), m.doi))))));
      } else {
        parts.push(el('p', {class: 'none', text: t('res.noLimit', {crop: cropN(r.crop)})}));
      }
    });
    return el('details', {class: 'res'}, el('summary', {text: t('res.summary')}), ...parts, closer());
  }

  /* How long each regulator lasts in soil, longest first. */
  const PERSIST_ORDER = {high: 0, mid: 1, low: 2, unknown: 3};
  const days = v => {
    if (!v || /not found/i.test(v)) return t('res.notFound');
    if (/\b(days?|weeks?|months?|years?|yr)\b|\d\s*d\b/i.test(v)) return v;
    return v.replace(/^([~<>≈]?\s*\d[\d.,\-–\s]*)/, m => m.trim() + ' days ');
  };
  /* Short, consistent badge text; the full class wording is shown when a row is opened. */
  const soilBadge = r => r.badge ? el('span', {class: 'persist role', text: L.field(r, 'badge')})
    : el('span', {class: `persist ${persistClass(r.persistence_class)}`, text: t('persist.' + persistClass(r.persistence_class))});
  function drawSoilTable() {
    const box = document.getElementById('soil-table');
    if (data.soil === null) return failed('soil-table');
    if (!box || !data.soil || box.dataset.drawn === L.lang) return;
    box.dataset.drawn = L.lang;
    /* Only products that appear in a regulator entry; others stay in the data file but are not listed. */
    const used = new Set((data.regulators || []).flatMap(residueKeys));
    /* Fertiliser and bud-break entries add no residue warning, so they stay in their regulator cards only. */
    const NOT_LISTED = new Set(['kno3', 'thiourea']);
    const rows = data.soil.filter(r => used.has(r.key) && !NOT_LISTED.has(r.key))
      .sort((a, b) => PERSIST_ORDER[persistClass(a.persistence_class)] - PERSIST_ORDER[persistClass(b.persistence_class)]);
    const soilRow = r => el('details', {class: 'soil-row', name: 'soil-row'},
      el('summary', {},
        el('span', {class: 'soil-name', text: L.field(r, 'active_ingredient')}),
        soilBadge(r),
        r.function ? el('span', {class: 'soil-fn'}, el('strong', {text: t('res.does')}), L.field(r, 'function')) : null,
        r.concern ? el('span', {class: 'soil-fn soil-concern'}, el('strong', {text: t('res.concern')}), L.field(r, 'concern')) : null,
        el('span', {class: 'soil-time'}, el('strong', {text: t('soil.lasts')}), L.field(r, 'time_summary') || t('soil.notFound'))),
      el('p', {}, el('strong', {text: t('soil.class')}), r.persistence_class || t('persist.unknown')),
      el('p', {}, el('strong', {text: t('soil.dt50')}), t('soil.dt50val', {lab: days(r.soil_dt50_lab_days).trim(), field: days(r.soil_dt50_field_days).trim()})),
      r.approx_time_to_97pct_gone ? el('p', {}, el('strong', {text: t('soil.97')}), r.approx_time_to_97pct_gone) : null,
      r.orchard_field_residues && !/^not found/i.test(r.orchard_field_residues) ? el('p', {}, el('strong', {text: t('res.orchard')}), r.orchard_field_residues) : null,
      r.accumulation_note ? el('p', {}, el('strong', {text: t('res.repeat')}), r.accumulation_note) : null,
      r.effects_on_trees_and_following_crops ? el('p', {}, el('strong', {text: t('res.effects')}), r.effects_on_trees_and_following_crops) : null,
      r.leaching_water_note ? el('p', {}, el('strong', {text: t('res.water')}), r.leaching_water_note) : null,
      r.restrictions && !/^not found/i.test(r.restrictions) ? el('p', {}, el('strong', {text: t('res.restrict')}), r.restrictions) : null,
      el('p', {class: 'src'}, `${verName(r.verification) || r.verification} · `, cite(r.source, firstUrl(r.source_url), r.doi)), closer());
    /* Three groups so fertilisers and natural compounds are not read as harmful residues; synthetic regulators open first. */
    const GROUPS = [
      {key: 'synthetic', open: true}, {key: 'natural'}, {key: 'other'}
    ];
    box.replaceChildren(...GROUPS.map(g => {
      const items = rows.filter(r => r.category === g.key);
      return el('details', Object.assign({class: 'soil-group'}, g.open ? {open: ''} : {}),
        el('summary', {}, el('span', {class: 'soil-group-title', text: `${t('soil.g.' + g.key)} (${items.length})`}), el('span', {class: 'note', text: t('soil.n.' + g.key)})),
        el('div', {class: 'soil-group-rows'}, ...items.map(soilRow)));
    }));
  }

  /* ---------- regulators: cause and effect ---------- */
  const EVIDENCE_ORDER = {'Hormones measured': 0, 'Effect only': 1, 'Practice': 2};
  const missingText = t => !t || /^\s*(n\/a|none|unknown)?\s*$/i.test(t) || /^\s*not (retrieved|given|reported|stated|found|available)/i.test(t);
  function chainStep(label, text, empty) {
    const missing = missingText(text);
    return el('li', {class: missing ? 'missing' : ''}, el('strong', {text: label}), el('span', {text: missing ? empty : text}));
  }
  function regulatorCard(r) {
    const evCls = r.evidence === 'Hormones measured' ? 'measured' : r.evidence === 'Practice' ? 'practice' : 'effect';
    const applied = [r.active_ingredient, r.timing, r.rate].filter(t => !missingText(t)).join(' · ');
    return el('article', {class: 'reg'},
      el('header', {},
        el('h3', {text: r.regulator}),
        el('span', {class: `act ${(r.action || '').toLowerCase()}`,
          text: [r.action ? t('act.' + r.action) : '', r.target_hormone ? L.hs(r.target_hormone) : ''].filter(Boolean).join(' ')})),
      el('p', {class: 'reg-meta'}, `${cropN(r.crop)} · ${L.stage(r.stage)} `, el('span', {class: `ev-badge ${evCls}`, text: t('ev.' + r.evidence)})),
      el('ol', {class: 'chain'},
        chainStep(t('reg.hc'), r.hormone_changes, t('reg.hcEmpty')),
        chainStep(t('reg.see'), r.visible_effect, t('reg.seeEmpty'))),
      el('details', {class: 'reg-more'}, el('summary', {text: t('reg.more')}),
        el('ol', {class: 'chain'},
          chainStep(t('reg.used'), applied, t('reg.usedEmpty')),
          chainStep(t('reg.aim'), r.purpose, t('reg.notStated')),
          missingText(r.side_effects) ? null : chainStep(t('reg.watch'), r.side_effects, '')),
        r.note ? el('p', {text: r.note}) : null,
        el('p', {class: 'src'}, `${verName(r.verification) || r.verification}${r.source ? ' · ' : ''}`, r.source ? cite(r.source, r.source_url, r.doi) : null), closer()),
      residueSection(r));
  }
  function drawRegulators() {
    const listBox = document.getElementById('reg-list');
    if (data.regulators === null) return failed('reg-list');
    if (!data.regulators) return;
    document.getElementById('reg-stage-sel').value = state.regStage;
    drawSoilTable();
    const rows = data.regulators
      .filter(r => (state.regAll || r.crop === state.crop) && (!state.regStage || r.stage === state.regStage) && (!state.regMeasured || r.evidence === 'Hormones measured'))
      .sort((a, b) => (EVIDENCE_ORDER[a.evidence] ?? 3) - (EVIDENCE_ORDER[b.evidence] ?? 3) || a.regulator.localeCompare(b.regulator));
    document.getElementById('reg-count').textContent =
      (rows.length === 1 ? t('reg.entry1') : t('reg.entries', {n: rows.length})) + (state.regAll ? t('reg.forAll') : t('reg.forCrop', {crop: cropN(state.crop)})) + t('reg.order');
    const allBtn = el('button', {type: 'button', class: 'soil-toggle', text: state.regAll ? t('reg.onlyCrop', {crop: cropN(state.crop)}) : t('reg.all'),
      onclick: () => { state.regAll = !state.regAll; state.regShown = 0; drawRegulators(); }});
    if (!rows.length) {
      listBox.replaceChildren(el('p', {class: 'none', text: t('reg.none', {crop: cropN(state.crop)})}), allBtn);
      return;
    }
    /* Six cards at a time keeps long lists short on phones. */
    const PAGE = 6;
    const shownCount = Math.min(rows.length, state.regShown || PAGE);
    const more = rows.length - shownCount;
    /* replaceChildren prints null as text, so drop the missing "Show more" button before passing the list. */
    listBox.replaceChildren(...[...rows.slice(0, shownCount).map(regulatorCard),
      more > 0 ? el('button', {type: 'button', class: 'soil-toggle reg-more-btn', text: t('reg.moreBtn', {k: Math.min(PAGE, more), n: more}),
        onclick: () => { state.regShown = shownCount + PAGE; drawRegulators(); }}) : null, allBtn].filter(Boolean));
  }

  /* ---------- charts ---------- */
  /* The row last tapped in each chart, so a redraw for a new screen width shows the same one; cleared on crop change. */
  const tapped = {};
  function svgFor(id, W, H) {
    const box = document.getElementById(id);
    box.replaceChildren();
    const ro = document.getElementById(id.replace('-chart', '-readout'));
    if (ro) {
      ro.replaceChildren(el('span', {class: 'hint', text: t(ro.dataset.hint || 'hint.row')}));
    }
    return d3.select(box).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', W).attr('height', H).attr('role', 'group');
  }
  function muted(sel) { return sel.style('fill', 'var(--muted)'); }

  /* Rows with a wrapped label above a track; tapping a row fills the readout below the chart. */
  function rowChart(id, rows, o) {
    const box = document.getElementById(id);
    const W = Math.max(280, box.clientWidth), m = {t: 4, r: 20, b: 28, l: 2}, lineH = 17;
    const probeSvg = d3.select(box).append('svg').attr('width', W).attr('height', 0).style('position', 'absolute');
    const probe = probeSvg.append('text');
    const maxW = W - m.l - m.r;
    const lines = rows.map(d => {
      const out = []; let cur = '';
      o.label(d).split(' ').forEach(w => {
        const next = cur ? cur + ' ' + w : w;
        probe.text(next);
        if (cur && probe.node().getComputedTextLength() > maxW) { out.push(cur); cur = w; } else cur = next;
      });
      out.push(cur); return out;
    });
    probeSvg.remove();
    const tops = []; let acc = m.t;
    lines.forEach(ls => { tops.push(acc); acc += 32 + lineH * ls.length; });
    const H = acc + m.b;
    const svg = svgFor(id, W, H).attr('aria-label', o.title);
    const x = o.scale([m.l + 20, W - m.r - (o.padR || 0)]);
    o.axis(svg, x, m.t, H - m.b);
    const groups = [], picks = [];
    rows.forEach((d, i) => {
      const y = tops[i], rowH = 32 + lineH * lines[i].length;
      const g = svg.append('g').attr('class', 'row').attr('tabindex', 0).attr('role', 'button').attr('aria-label', lines[i].join(' '));
      const bg = g.append('rect').attr('x', 0).attr('y', y).attr('width', W).attr('height', rowH - 2).attr('rx', 6).style('fill', 'transparent');
      const lab = g.append('text').attr('class', 'lbl').style('fill', 'var(--fg)');
      lines[i].forEach((l, j) => lab.append('tspan').attr('x', m.l + 4).attr('y', y + 15 + j * lineH).text(l));
      o.mark(g, d, x, y + 15 + lineH * (lines[i].length - 1) + 16);
      const pick = () => {
        groups.forEach(gg => gg.style('fill', 'transparent'));
        bg.style('fill', 'var(--sel)');
        o.select(d);
      };
      g.on('click', () => { tapped[id] = o.label(d); pick(); }).on('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); tapped[id] = o.label(d); pick(); } });
      groups.push(bg);
      picks.push(pick);
    });
    const again = rows.findIndex(d => o.label(d) === tapped[id]);
    const chosen = again >= 0 ? again : o.isSelected ? rows.findIndex(o.isSelected) : -1;
    if (chosen >= 0) picks[chosen]();
    return chosen >= 0;
  }

  function gridX(svg, x, ticks, y0, y1, label, ref) {
    ticks.forEach(t => {
      svg.append('line').attr('x1', x(t)).attr('x2', x(t)).attr('y1', y0).attr('y2', y1).style('stroke', t === ref ? 'var(--ref)' : 'var(--grid)');
      muted(svg.append('text').attr('x', x(t)).attr('y', y1 + 18).attr('text-anchor', 'middle').text(label(t)));
    });
  }

  function placeValue(g, text, xEnd, xStart, y, limit) {
    const t = muted(g.append('text').attr('y', y + 4).text(text));
    const w = t.node().getComputedTextLength();
    if (xEnd + 8 + w <= limit) t.attr('x', xEnd + 8);
    else t.attr('x', xStart - 8).attr('text-anchor', 'end');
  }

  function source(d) {
    const v = VERIFY[d.verification];
    return {level: v ? verName(d.verification) : d.verification, name: d.source, url: d.source_url, doi: d.doi};
  }

  /* One row per crop: a hollow dot at harvest, filled marks at the ripening peak (one per source, coloured by how
     it was checked), an arrow between them when both are known. Treatments and other tissues stay in the readout. */
  function drawRipening() {
    const rows = data.ripening;
    if (rows === null) return failed('ripe-chart');
    if (!rows) return;
    const all = rows.map(r => ({...r, lo: +r.low, hi: +r.high}));
    const value = d => d.bound === 'below' ? `< ${fmt(d.hi)}` : d.hi > d.lo ? `${fmt(d.lo)}–${fmt(d.hi)}` : fmt(d.hi);
    const crops = [...d3.group(all, d => d.crop_group)].map(([crop, items]) => {
      const peaks = items.filter(d => d.role === 'peak');
      const harvest = items.find(d => d.role === 'harvest');
      const top = peaks.length ? d3.max(peaks, d => d.hi) : null;
      return {crop, items, peaks, harvest, top, others: items.filter(d => d.role === 'other')};
    }).sort((a, b) => (b.top ?? 0) - (a.top ?? 0));
    const summary = c => {
      if (!c.peaks.length) return t('ripe.harvestOnly', {v: value(c.harvest)});
      const lo = d3.min(c.peaks, d => d.lo), hi = c.top;
      const from = c.harvest ? t('ripe.from', {v: value(c.harvest)}) : '';
      /* Sources more than 10 times apart are shown separately, not merged into one range. */
      if (new Set(c.peaks.map(d => d.source)).size > 1 && hi / Math.max(lo, 1e-6) > 10)
        return t('ripe.disagree', {v: c.peaks.map(value).join(t('or')), from});
      return t('ripe.peak', {v: lo === hi ? fmt(hi) : fmt(lo) + '–' + fmt(hi), from});
    };
    const ripeHas = crops.some(c => c.crop === state.crop);
    cropNote('ripe-crop-note', ripeHas, 'what.ripe');
    rowChart('ripe-chart', crops, {
      isSelected: c => c.crop === state.crop,
      title: t('ripe.aria'),
      scale: r => d3.scaleLog([0.01, 1000], r),
      axis(svg, x, y0, y1) {
        /* Shade the low range where non-climacteric fruit stay. */
        svg.append('rect').attr('x', x(0.01)).attr('y', y0).attr('width', x(1) - x(0.01)).attr('height', y1 - y0).style('fill', 'var(--grid)').style('opacity', 0.6);
        muted(svg.append('text').attr('x', x(0.01) + 4).attr('y', y1 - 4).style('font-size', '12px').text(t('ripe.low')));
        gridX(svg, x, [0.01, 0.1, 1, 10, 100, 1000], y0, y1, fmt);
      },
      label: c => `${cropN(c.crop)} — ${summary(c)}${c.others.length ? t('ripe.more', {n: c.others.length}) : ''}`,
      mark(g, c, x, y) {
        const h = c.harvest;
        if (h && c.top) {
          g.append('line').attr('x1', x(h.hi) + 7).attr('x2', x(d3.min(c.peaks, d => d.lo)) - 9).attr('y1', y).attr('y2', y)
            .style('stroke', 'var(--axis)').style('stroke-width', 2).style('stroke-dasharray', '4 3');
          g.append('path').attr('d', `M${x(d3.min(c.peaks, d => d.lo)) - 9},${y} l-7,-4 l0,8 z`).style('fill', 'var(--axis)');
        }
        if (h) g.append('circle').attr('cx', x(h.hi)).attr('cy', y).attr('r', 5.5).style('fill', 'var(--panel)').style('stroke', 'var(--muted)').style('stroke-width', 2);
        c.peaks.forEach(d => {
          const col = (VERIFY[d.verification] || VERIFY.SNIP).color;
          if (d.hi > d.lo) g.append('line').attr('x1', x(d.lo)).attr('x2', x(d.hi)).attr('y1', y).attr('y2', y).style('stroke', col).style('stroke-width', 10).style('stroke-linecap', 'round');
          else g.append('circle').attr('cx', x(d.hi)).attr('cy', y).attr('r', 6).style('fill', col);
        });
      },
      select(c) {
        const lines = c.items.map(d => ({
          text: `${t('role.' + (d.role === 'harvest' || d.role === 'peak' ? d.role : 'other'))}${t('colon')}${value(d)} µL/kg/h — ${d.crop !== c.crop ? cropN(d.crop) + ', ' : ''}${d.condition}${d.cultivar && !/^(not stated|general)$/i.test(d.cultivar) ? ` (${d.cultivar})` : ''}`,
          source: source(d)
        }));
        readoutList('ripe-readout', cropN(c.crop), lines);
      }
    });
  }

  function drawLeaf() {
    const rows = data.mangoLeaf;
    if (rows === null) return failed('leaf-chart');
    if (!rows) return;
    const list = rows.map(r => ({...r, c: +r.control, lo: +r.girdled_low, hi: +r.girdled_high}));
    rowChart('leaf-chart', list, {
      title: t('leaf.aria'),
      scale: r => d3.scaleLog([0.05, 500], r),
      axis: (svg, x, y0, y1) => gridX(svg, x, [0.1, 1, 10, 100], y0, y1, fmt),
      label: d => d.hormone,
      mark(g, d, x, y) {
        g.append('line').attr('x1', x(d.lo)).attr('x2', x(d.hi)).attr('y1', y).attr('y2', y).style('stroke', 'var(--down)').style('stroke-width', 10).style('stroke-linecap', 'round');
        g.append('circle').attr('cx', x(d.c)).attr('cy', y).attr('r', 6).style('fill', 'var(--up)').style('stroke', 'var(--panel)').style('stroke-width', 2);
      },
      select: d => readout('leaf-readout', d.hormone, [t('leaf.control', {v: fmt(d.c)}), t('leaf.girdled', {v: `${fmt(d.lo)}–${fmt(d.hi)}`})], source(d))
    });
  }

  function drawLongan() {
    const rows = data.longan;
    if (rows === null) return failed('longan-chart');
    if (!rows) return;
    const list = rows.map(r => ({...r, v: +r.value}));
    const box = document.getElementById('longan-chart');
    const W = Math.max(280, box.clientWidth), H = 240, m = {t: 22, r: 4, b: 30, l: 30};
    const svg = svgFor('longan-chart', W, H).attr('aria-label', t('longan.aria'));
    const x = d3.scaleBand(list.map(d => d.hormone), [m.l, W - m.r]).padding(0.25);
    const y = d3.scaleLinear([0, 70], [H - m.b, m.t]);
    [0, 20, 40, 60].forEach(t => {
      svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(t)).attr('y2', y(t)).style('stroke', t ? 'var(--grid)' : 'var(--axis)');
      muted(svg.append('text').attr('x', m.l - 6).attr('y', y(t) + 4).attr('text-anchor', 'end').text(t));
    });
    const bars = [];
    let again = null;
    list.forEach(d => {
      const isGA = d.hormone.startsWith('GA');
      const cx = x(d.hormone) + x.bandwidth() / 2, bw = Math.min(36, x.bandwidth());
      const g = svg.append('g').attr('class', 'row').attr('tabindex', 0).attr('role', 'button').attr('aria-label', t('longan.bar', {h: d.hormone, v: fmt(d.v)}));
      g.append('rect').attr('x', x(d.hormone)).attr('y', m.t).attr('width', x.bandwidth()).attr('height', H - m.b - m.t).style('fill', 'transparent');
      const bar = g.append('rect').attr('x', cx - bw / 2).attr('y', y(d.v)).attr('width', bw).attr('height', y(0) - y(d.v)).attr('rx', 5).style('fill', isGA ? 'var(--up)' : 'var(--brand)');
      muted(g.append('text').attr('x', cx).attr('y', y(d.v) - 6).attr('text-anchor', 'middle').text('~' + fmt(d.v)));
      g.append('text').attr('x', cx).attr('y', H - m.b + 18).attr('text-anchor', 'middle').style('fill', 'var(--fg)').text(d.hormone);
      const pick = () => {
        bars.forEach(b => b.style('opacity', 0.45)); bar.style('opacity', 1);
        readout('longan-readout', d.hormone, [d.group, t('longan.about', {v: fmt(d.v)})], source(d));
      };
      g.on('click', () => { tapped['longan-chart'] = d.hormone; pick(); })
        .on('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); tapped['longan-chart'] = d.hormone; pick(); } });
      bars.push(bar);
      if (tapped['longan-chart'] === d.hormone) again = pick;
    });
    if (again) again();
  }

  /* "PBZ vs control" reads as jargon; say what the control trees were. */
  const plainControl = t => t.replace(/vs control/g, 'vs untreated trees');

  function drawPbz() {
    const rows = data.pbz;
    if (rows === null) return failed('pbz-chart');
    if (!rows) return;
    const list = rows.map(r => ({...r, p: +r.pct}));
    const sign = v => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v)) + '%';
    const value = d => (d.qualifier ? d.qualifier + ' ' : '') + sign(d.p);
    rowChart('pbz-chart', list, {
      title: t('pbz.aria'),
      scale: r => d3.scaleLinear([-100, 260], r),
      axis: (svg, x, y0, y1) => gridX(svg, x, narrow() ? [-100, 0, 100, 200] : [-100, -50, 0, 50, 100, 150, 200, 250], y0, y1, t => t > 0 ? '+' + t : String(t), 0),
      padR: 40,
      label: d => `${d.hormone} · ${d.tissue} · ${plainControl(d.comparison)}`,
      mark(g, d, x, y) {
        const a = Math.min(x(0), x(d.p)), w = Math.max(2, Math.abs(x(d.p) - x(0)));
        g.append('rect').attr('x', a).attr('y', y - 7).attr('width', w).attr('height', 14).attr('rx', 5)
          .style('fill', d.p >= 0 ? 'var(--up)' : 'var(--down)').style('opacity', d.verification === 'SEC' ? 0.6 : 1);
        const t = muted(g.append('text').attr('y', y + 4).text(value(d)));
        const tw = t.node().getComputedTextLength();
        if (d.p >= 0) t.attr('x', x(d.p) + 8);
        else if (x(d.p) - 8 - tw >= 0) t.attr('x', x(d.p) - 8).attr('text-anchor', 'end');
        else t.attr('x', x(0) + 8);
      },
      select: d => readout('pbz-readout', `${d.hormone} · ${d.tissue}`, [plainControl(d.comparison), value(d)], source(d))
    });
  }

  /* "Mango" must not match "Mangosteen". */
  const sameCrop = name => name === state.crop || name.startsWith(state.crop + ' ');
  function drawFold() {
    const rows = data.fruitset;
    if (rows === null) return failed('fold-chart');
    if (!rows) return;
    const list = rows.map(r => ({...r, f: +r.fold})).sort((a, b) => b.f - a.f);
    const value = d => (d.qualifier ? d.qualifier + ' ' : '') + fmt(d.f) + '×';
    const foldHas = list.some(d => sameCrop(d.crop));
    cropNote('fold-crop-note', foldHas, 'what.fold');
    rowChart('fold-chart', list, {
      isSelected: d => sameCrop(d.crop),
      title: t('fold.aria'),
      scale: r => d3.scaleLog([1, 30], r),
      axis: (svg, x, y0, y1) => gridX(svg, x, [1, 2, 5, 10, 20], y0, y1, t => t + '×', 1),
      padR: 64,
      label: d => `${cropN(d.crop)} · ${d.hormone} · ${d.comparison}`,
      mark(g, d, x, y) {
        g.append('rect').attr('x', x(1)).attr('y', y - 7).attr('width', Math.max(2, x(d.f) - x(1))).attr('height', 14).attr('rx', 5)
          .style('fill', (VERIFY[d.verification] || VERIFY.SNIP).color);
        muted(g.append('text').attr('x', x(d.f) + 8).attr('y', y + 4).text(value(d)));
      },
      select: d => readout('fold-readout', `${cropN(d.crop)} · ${d.cultivar}`, [`${d.hormone}: ${d.comparison}`, value(d)], source(d))
    });
  }

  /* ---------- draw only the visible view, so hidden charts never measure a zero width ---------- */
  /* Which flowering charts belong to which crop. */
  const FLOWER_CHARTS = {Mango: [drawLeaf, drawPbz], Longan: [drawLongan]};
  function drawFlowering() {
    drawCompare('Flowering');
    document.querySelectorAll('#view-flowering [data-crop]').forEach(c => {
      const mine = c.dataset.crop === state.crop;
      c.classList.toggle('mine', mine);
      c.style.order = mine ? -1 : 0;
    });
    const note = document.getElementById('flower-crop-note');
    note.hidden = false;
    note.textContent = t(FLOWER_CHARTS[state.crop] ? 'flower.mine' : 'flower.none', {crop: cropN(state.crop)});
    note.classList.toggle('missing', !FLOWER_CHARTS[state.crop]);
    Object.values(FLOWER_CHARTS).flat().forEach(f => f());
  }

  /* A width change (phone rotation) redraws only the charts, which are sized to the screen; lists and their open
     sections are left as they are. */
  function drawCharts() {
    if (typeof d3 === 'undefined') return;
    if (state.view === 'flowering') Object.values(FLOWER_CHARTS).flat().forEach(f => f());
    if (state.view === 'fruitset') drawFold();
    if (state.view === 'ripening') drawRipening();
  }
  function drawView() {
    if (typeof d3 === 'undefined') return;
    drawCropChip();
    if (state.view === 'overview') drawCropCard();
    if (state.view === 'regulators') drawRegulators();
    if (state.view === 'flowering') drawFlowering();
    if (state.view === 'fruitset') { drawCompare('Fruit set'); drawFold(); }
    if (state.view === 'ripening') { drawCompare('Ripening'); drawRipening(); }
  }

  function load() {
    return Promise.all(Object.entries(FILES).map(([k, url]) =>
      fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then(t => { data[k] = d3.csvParse(t); })
        .catch(() => { data[k] = null; })
    ));
  }

  function init() {
    const verKey = document.getElementById('ver-key');
    const drawVerKey = () => verKey.replaceChildren(...Object.entries(VERIFY).map(([code, v]) => {
      const sw = el('i', {class: 'sw'}); sw.style.background = v.color;
      return el('span', {}, sw, verName(code));
    }));
    drawVerKey();
    /* A new language redraws everything the app built; i18n.js has already swapped the static text. */
    window.addEventListener('langchange', () => { drawVerKey(); drawView(); });
    document.getElementById('reg-stage-sel').addEventListener('change', e => { state.regStage = e.target.value; state.regShown = 0; drawRegulators(); });
    document.getElementById('crop-chip').addEventListener('click', e => {
      e.stopPropagation();
      state.listOpen = !state.listOpen;
      drawCropChip();
      if (state.listOpen) { const t = document.querySelector('#crop-panel [aria-pressed="true"]'); if (t) t.focus(); }
    });
    document.addEventListener('click', e => { if (!e.target.closest('#crop-panel, #crop-chip')) closeCropMenu(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.listOpen) { closeCropMenu(); document.getElementById('crop-chip').focus(); } });
    document.getElementById('reg-measured').addEventListener('change', e => { state.regMeasured = e.target.checked; state.regShown = 0; drawRegulators(); });
    window.addEventListener('hashchange', () => { closeCropMenu(); route(); window.scrollTo(0, 0); });
    let w = window.innerWidth, timer;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => { if (window.innerWidth !== w) { w = window.innerWidth; drawCharts(); } }, 120);
    });
    state.crop = savedCrop() || DEFAULT_CROP;
    route();
    if (typeof d3 === 'undefined') {
      /* The chart library comes from a CDN; the service worker keeps a copy after the first online visit. */
      document.querySelectorAll('.loading').forEach(n => n.replaceWith(el('div', {class: 'fail', text: t('offline')})));
      return;
    }
    load().then(() => {
      /* Keep the remembered crop only if it is still in the data. */
      if (data.evidence && !data.evidence.some(r => r.crop === state.crop)) state.crop = DEFAULT_CROP;
      drawView();
    });
  }

  init();
})();
