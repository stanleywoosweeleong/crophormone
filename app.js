/* Tropical fruit hormone charts: loads the CSVs in data/, routes between views by hash, draws each chart. */
(function () {
  'use strict';

  const FILES = {
    evidence: 'data/hormone_evidence.csv',
    regulators: 'data/regulators.csv',
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
  const DIRECTION = {
    'Up': {glyph: '▲', cls: 'up', word: 'Rises'},
    'Down': {glyph: '▼', cls: 'down', word: 'Falls'},
    'Peak': {glyph: '▲', cls: 'peak', word: 'Peaks'},
    'Low': {glyph: '▽', cls: 'low', word: 'Stays low'},
    'Mixed': {glyph: '◆', cls: 'mix', word: 'Mixed'},
    'Conflicting': {glyph: '◆', cls: 'mix', word: 'Conflicting'},
    'Not a driver': {glyph: '○', cls: 'nod', word: 'Not a driver'},
    'Applied': {glyph: '◇', cls: 'trt', word: 'Applied only'},
    'No data': {glyph: '·', cls: 'nd', word: 'No data'}
  };
  const VERIFY = {
    FT: {name: 'Full text', color: 'var(--v-ft)'},
    ABS: {name: 'Abstract', color: 'var(--v-abs)'},
    SEC: {name: 'Review or guide', color: 'var(--v-sec)'},
    SNIP: {name: 'Search snippet', color: 'var(--v-snip)'}
  };
  const fmt = v => d3.format('~g')(v);
  const dir = v => DIRECTION[v] || DIRECTION['Mixed'];
  const narrow = () => window.matchMedia('(max-width: 899px)').matches;

  const data = {};
  const DEFAULT_CROP = 'Durian';
  const state = {crop: DEFAULT_CROP, stage: 'Flowering', view: 'overview', regCrop: DEFAULT_CROP, regStage: '', regMeasured: false, listOpen: false};
  /* The default crop first, then the rest alphabetically. */
  const cropOrder = rows => [...new Set(rows.map(r => r.crop))]
    .sort((a, b) => (b === DEFAULT_CROP) - (a === DEFAULT_CROP) || a.localeCompare(b));

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
  function readout(id, title, lines, source) {
    const box = document.getElementById(id);
    box.replaceChildren(el('span', {class: 't', text: title}));
    lines.forEach(l => box.append(el('span', {text: l})));
    if (source) box.append(el('span', {class: 'm'}, `${source.level} · `, safeLink(source.name, source.url)));
  }
  function failed(id) {
    document.getElementById(id).replaceChildren(el('div', {class: 'fail', text: 'Failed to load'}));
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
  const SHORT = {up: 'Rises', peak: 'Peaks', down: 'Falls', low: 'Low', mix: 'Mixed', nod: 'Not a driver', trt: 'Applied', nd: '—'};
  const verName = v => (VERIFY[v] ? VERIFY[v].name : '');

  /* ---------- overview: one crop at a time, chosen from a picker ---------- */
  function badge(r) {
    const v = shown(r), d = DIRECTION[v];
    const inferred = !!r && r.basis === 'Inferred' && d.cls !== 'nd';
    const word = v === 'Conflicting' ? 'Conflict' : SHORT[d.cls];
    return el('span', {class: `c ${d.cls}${inferred ? ' inferred' : ''}`, title: d.word + (inferred ? ' (inferred)' : '')},
      d.cls === 'nd' ? null : el('span', {'aria-hidden': 'true', text: d.glyph}), word);
  }

  function evidenceLine(name, r) {
    const tag = [r.basis === 'Treatment only' ? 'Applied only' : r.basis, verName(r.verification)].filter(Boolean).join(' · ');
    const value = r.value ? ` (${r.value}${r.units ? ' ' + r.units : ''}${r.tissue ? ', ' + r.tissue : ''})` : '';
    return el('p', {}, el('strong', {text: name + ': '}), (r.note || '') + value, ' ',
      el('span', {class: 'src'}, `${tag}${r.source ? ' · ' : ''}`, r.source ? safeLink(r.source, r.source_url) : null));
  }

  /* The evidence behind one stage: the shared note for the classic hormones, then each other hormone and signal. */
  function stageEvidence(crop, stage) {
    const parts = [el('h4', {text: stage})];
    const byNote = new Map();
    HORMONES.filter(h => h.group === 'Classic hormones').forEach(h => {
      const r = cell(crop, stage, h.key);
      if (!r || !r.note) return;
      const entry = byNote.get(r.note) || {names: [], r};
      entry.names.push(h.key);
      byNote.set(r.note, entry);
    });
    byNote.forEach(({names, r}) => parts.push(byNote.size === 1 ? el('p', {}, el('strong', {text: 'Classic hormones: '}), r.note)
      : evidenceLine(names.join(', '), r)));
    const none = [];
    HORMONES.filter(h => h.group === 'Other hormones').forEach(h => {
      const r = cell(crop, stage, h.key);
      if (!r || r.basis === 'No data') { none.push(h.key); return; }
      parts.push(evidenceLine(h.name, r));
    });
    signals(crop, stage).forEach(r => parts.push(evidenceLine(r.hormone, r)));
    if (none.length) parts.push(el('p', {class: 'none', text: `No study found for: ${none.join(', ')}.`}));
    return el('section', {class: 'ev-stage'}, ...parts);
  }

  /* The chosen crop: one compact table (hormones down, stages across), evidence folded away below it. */
  function cropPanel(crop) {
    const table = el('div', {class: 'ct', role: 'table', 'aria-label': `${crop}: hormone direction by stage`});
    table.append(el('div', {role: 'columnheader'}));
    STAGES.forEach(s => table.append(el('div', {class: 'ct-stage', role: 'columnheader', text: s})));
    let group = null;
    HORMONES.forEach(h => {
      if (h.group !== group) { group = h.group; table.append(el('div', {class: 'ct-group', role: 'rowheader', text: group})); }
      table.append(el('div', {class: 'ct-h', role: 'rowheader', text: h.name}));
      STAGES.forEach(s => {
        const r = cell(crop, s, h.key);
        table.append(el('div', {role: 'cell', 'aria-label': `${h.name}, ${s}: ${DIRECTION[shown(r)].word}`}, badge(r)));
      });
    });
    const c = coverage(crop);
    const summary = el('p', {class: 'cov'},
      el('strong', {text: `${c.measured} of 30`}), ' hormone × stage cells measured or partly measured · ', `${c.inferred} inferred · ${c.applied} applied only · ${c.none} no data`);
    const ev = el('details', {class: 'ev'}, el('summary', {text: 'Evidence and sources'}), ...STAGES.map(s => stageEvidence(crop, s)));
    return el('div', {class: 'crop-panel', role: 'region', 'aria-label': crop}, summary, table, ev);
  }

  /* The crop list opens inline under the crop button; choosing a crop closes it again. */
  function cropList(crops) {
    return el('div', {class: 'crop-list', id: 'crop-list'},
      el('p', {class: 'note', text: `All ${crops.length} crops. Dots show how many of the three stages have at least one measured hormone.`}),
      el('div', {class: 'tiles'}, ...crops.map(crop => {
        const n = measuredStages(crop);
        return el('button', {
          type: 'button', class: 'tile', 'aria-pressed': String(crop === state.crop), 'aria-label': `${crop}, ${n} of 3 stages measured`,
          onclick: () => { state.listOpen = false; selectCrop(crop); }
        }, el('span', {class: 'tile-name', text: crop}), dots(n));
      })));
  }

  function drawCropCard() {
    if (data.evidence === null) return failed('crop-detail');
    if (!evidence()) return;
    const crops = cropOrder(data.evidence);
    if (!crops.includes(state.crop)) state.crop = crops[0];
    const n = measuredStages(state.crop);
    const toggle = () => {
      state.listOpen = !state.listOpen;
      drawCropCard();
      document.querySelector('.crop-pick').focus();
    };
    document.getElementById('crop-bar').replaceChildren(
      el('button', {type: 'button', class: 'crop-pick', 'aria-expanded': String(!!state.listOpen), 'aria-controls': 'crop-list',
        'aria-label': `${state.crop}, ${n} of 3 stages measured. ${state.listOpen ? 'Hide' : 'Show'} all ${crops.length} crops`, onclick: toggle},
        el('span', {class: 'crop-pick-name', text: state.crop}), dots(n),
        el('span', {class: 'crop-pick-more', text: state.listOpen ? 'Hide crops' : `${crops.length} crops`}),
        el('span', {class: 'caret', 'aria-hidden': 'true', text: '▾'})));
    document.getElementById('crop-detail').replaceChildren(...[state.listOpen ? cropList(crops) : null, cropPanel(state.crop)].filter(Boolean));
  }

  function selectCrop(crop, scroll) {
    state.crop = crop;
    drawCropCard();
    drawMatrix();
    if (scroll) document.getElementById('crop-card').scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  /* ---------- overview: compare all crops at one stage ---------- */
  function drawMatrix() {
    const box = document.getElementById('mx');
    if (data.evidence === null) return failed('mx');
    if (!evidence()) return;
    document.querySelectorAll('#stage-seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.stage === state.stage)));
    const crops = cropOrder(data.evidence);
    /* One card per hormone; inside, crops grouped by direction, in this order. */
    const ORDER = ['Up', 'Peak', 'Down', 'Low', 'Mixed', 'Conflicting', 'Not a driver', 'Applied', 'No data'];
    let group = null;
    const cards = [];
    HORMONES.forEach(h => {
      if (h.group !== group) { group = h.group; cards.push(el('h3', {class: 'cmp-group', text: group})); }
      const groups = new Map(ORDER.map(k => [k, []]));
      crops.forEach(crop => {
        const r = cell(crop, state.stage, h.key);
        groups.get(shown(r)).push({crop, inferred: !!r && r.basis === 'Inferred'});
      });
      const measured = crops.filter(crop => isMeasured(cell(crop, state.stage, h.key))).length;
      const lines = ORDER.filter(k => groups.get(k).length).map(k => {
        const d = DIRECTION[k];
        return el('div', {class: 'grp' + (k === 'No data' ? ' nd' : '')},
          el('span', {class: `c ${d.cls}`}, el('span', {'aria-hidden': 'true', text: d.glyph}), d.word),
          k === 'Conflicting' ? el('span', {class: 'why', text: 'Studies disagree. Open the crop and read Evidence and sources for why.'}) : null,
          k === 'Applied' ? el('span', {class: 'why', text: 'Tested as a spray or dip; the natural level was not measured.'}) : null,
          k === 'Not a driver' ? el('span', {class: 'why', text: 'The level changes, but studies show it does not cause this stage.'}) : null,
          el('span', {class: 'names'}, ...groups.get(k).map(g => el('button', {
            type: 'button', class: 'name' + (g.inferred && k !== 'No data' ? ' inferred' : '') + (g.crop === state.crop ? ' on' : ''),
            'aria-label': `${g.crop}: ${d.word}${g.inferred ? ', inferred' : ''}. Open ${g.crop}`,
            text: g.crop, onclick: () => selectCrop(g.crop, true)
          }))));
      });
      cards.push(el('article', {class: 'cmp-card'},
        el('header', {}, el('h4', {text: h.name}), el('span', {class: 'cnt', text: `${measured} of ${crops.length} measured`})), ...lines));
    });
    box.replaceChildren(...cards);
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
        el('span', {class: `act ${(r.action || '').toLowerCase()}`, text: `${r.action} ${r.target_hormone}`.trim()})),
      el('p', {class: 'reg-meta'}, `${r.crop} · ${r.stage} `, el('span', {class: `ev-badge ${evCls}`, text: r.evidence})),
      el('ol', {class: 'chain'},
        chainStep('Applied', applied, 'Product details not reported in the sources we could read'),
        chainStep('Aim', r.purpose, 'Not stated'),
        chainStep('Hormone changes', r.hormone_changes, 'Hormones were not measured in this study'),
        chainStep('What you see', r.visible_effect, 'Visible effect not reported in the sources we could read'),
        missingText(r.side_effects) ? null : chainStep('Watch for', r.side_effects, '')),
      el('details', {class: 'reg-more'}, el('summary', {text: 'Notes and source'}),
        r.note ? el('p', {text: r.note}) : null,
        el('p', {class: 'src'}, `${verName(r.verification) || r.verification}${r.source ? ' · ' : ''}`, r.source ? safeLink(r.source, r.source_url) : null)));
  }
  function drawRegulators() {
    const list = document.getElementById('reg-list');
    if (data.regulators === null) return failed('reg-list');
    if (!data.regulators) return;
    const cropSel = document.getElementById('reg-crop');
    if (!cropSel.options.length) {
      cropSel.append(el('option', {value: '', text: 'All crops'}), ...cropOrder(data.regulators).map(c => el('option', {value: c, text: c})));
      cropSel.value = state.regCrop;
    }
    document.querySelectorAll('#reg-stage button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.stage === state.regStage)));
    const rows = data.regulators
      .filter(r => (!state.regCrop || r.crop === state.regCrop) && (!state.regStage || r.stage === state.regStage) && (!state.regMeasured || r.evidence === 'Hormones measured'))
      .sort((a, b) => (EVIDENCE_ORDER[a.evidence] ?? 3) - (EVIDENCE_ORDER[b.evidence] ?? 3) || a.regulator.localeCompare(b.regulator));
    document.getElementById('reg-count').textContent =
      `${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}${state.regCrop ? ' for ' + state.regCrop : ''}. Chains with measured hormone changes come first.`;
    list.replaceChildren(...(rows.length ? rows.map(regulatorCard)
      : [el('p', {class: 'none', text: 'No regulator studies found for this choice. Try All crops or another stage.'})]));
  }

  /* ---------- charts ---------- */
  function svgFor(id, W, H) {
    const box = document.getElementById(id);
    box.replaceChildren();
    return d3.select(box).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', W).attr('height', H).attr('role', 'img');
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
    const groups = [];
    rows.forEach((d, i) => {
      const y = tops[i], rowH = 32 + lineH * lines[i].length;
      const g = svg.append('g').attr('class', 'row').attr('tabindex', 0).attr('role', 'button').attr('aria-label', lines[i].join(' '));
      const bg = g.append('rect').attr('x', 0).attr('y', y).attr('width', W).attr('height', rowH - 2).attr('rx', 6).style('fill', 'transparent');
      const lab = g.append('text').style('fill', 'var(--fg)');
      lines[i].forEach((l, j) => lab.append('tspan').attr('x', m.l + 4).attr('y', y + 15 + j * lineH).text(l));
      o.mark(g, d, x, y + 15 + lineH * (lines[i].length - 1) + 16);
      const pick = () => {
        groups.forEach(gg => gg.style('fill', 'transparent'));
        bg.style('fill', 'var(--sel)');
        o.select(d);
      };
      g.on('click', pick).on('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(); } });
      groups.push(bg);
    });
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
    return {level: v ? v.name : d.verification, name: d.source, url: d.source_url};
  }

  function drawRipening() {
    const rows = data.ripening;
    if (rows === null) return failed('ripe-chart');
    if (!rows) return;
    const list = rows.map(r => ({...r, lo: +r.low, hi: +r.high})).sort((a, b) => b.hi - a.hi);
    const value = d => d.bound === 'below' ? `< ${fmt(d.hi)}` : d.hi > d.lo ? `${fmt(d.lo)}–${fmt(d.hi)}` : fmt(d.hi);
    rowChart('ripe-chart', list, {
      title: 'Ethylene production rate by crop, log scale',
      scale: r => d3.scaleLog([0.01, 1000], r),
      axis: (svg, x, y0, y1) => gridX(svg, x, [0.01, 0.1, 1, 10, 100, 1000], y0, y1, fmt),
      label: d => `${d.crop} · ${d.condition}`,
      mark(g, d, x, y) {
        const c = (VERIFY[d.verification] || VERIFY.SNIP).color;
        if (d.bound === 'below') {
          g.append('line').attr('x1', x(d.hi)).attr('x2', x(d.hi) - 22).attr('y1', y).attr('y2', y).style('stroke', c).style('stroke-width', 2);
          g.append('path').attr('d', `M${x(d.hi) - 24},${y} l7,-5 l0,10 z`).style('fill', c);
          g.append('circle').attr('cx', x(d.hi)).attr('cy', y).attr('r', 5).style('fill', 'var(--panel)').style('stroke', c).style('stroke-width', 2);
        } else if (d.hi > d.lo) {
          g.append('line').attr('x1', x(d.lo)).attr('x2', x(d.hi)).attr('y1', y).attr('y2', y).style('stroke', c).style('stroke-width', 10).style('stroke-linecap', 'round');
        } else {
          g.append('circle').attr('cx', x(d.hi)).attr('cy', y).attr('r', 6).style('fill', c);
        }
        placeValue(g, value(d), x(d.hi) + 4, x(d.lo) - (d.bound === 'below' ? 26 : 4), y, x.range()[1] + 10);
      },
      select: d => readout('ripe-readout', `${d.crop} · ${d.cultivar}`, [d.condition, `${value(d)} µL C₂H₄/kg/h`], source(d))
    });
  }

  function drawLeaf() {
    const rows = data.mangoLeaf;
    if (rows === null) return failed('leaf-chart');
    if (!rows) return;
    const list = rows.map(r => ({...r, c: +r.control, lo: +r.girdled_low, hi: +r.girdled_high}));
    rowChart('leaf-chart', list, {
      title: 'Mango leaf hormone levels, control vs girdled, log scale',
      scale: r => d3.scaleLog([0.05, 500], r),
      axis: (svg, x, y0, y1) => gridX(svg, x, [0.1, 1, 10, 100], y0, y1, fmt),
      label: d => d.hormone,
      mark(g, d, x, y) {
        g.append('line').attr('x1', x(d.lo)).attr('x2', x(d.hi)).attr('y1', y).attr('y2', y).style('stroke', 'var(--down)').style('stroke-width', 10).style('stroke-linecap', 'round');
        g.append('circle').attr('cx', x(d.c)).attr('cy', y).attr('r', 6).style('fill', 'var(--up)').style('stroke', 'var(--panel)').style('stroke-width', 2);
      },
      select: d => readout('leaf-readout', d.hormone, [`Control: ${fmt(d.c)} ng/g FM`, `Girdled: ${fmt(d.lo)}–${fmt(d.hi)} ng/g FM`], source(d))
    });
  }

  function drawLongan() {
    const rows = data.longan;
    if (rows === null) return failed('longan-chart');
    if (!rows) return;
    const list = rows.map(r => ({...r, v: +r.value}));
    const box = document.getElementById('longan-chart');
    const W = Math.max(280, box.clientWidth), H = 240, m = {t: 22, r: 4, b: 30, l: 30};
    const svg = svgFor('longan-chart', W, H).attr('aria-label', 'Longan shoot tip hormone levels');
    const x = d3.scaleBand(list.map(d => d.hormone), [m.l, W - m.r]).padding(0.25);
    const y = d3.scaleLinear([0, 70], [H - m.b, m.t]);
    [0, 20, 40, 60].forEach(t => {
      svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(t)).attr('y2', y(t)).style('stroke', t ? 'var(--grid)' : 'var(--axis)');
      muted(svg.append('text').attr('x', m.l - 6).attr('y', y(t) + 4).attr('text-anchor', 'end').text(t));
    });
    const bars = [];
    list.forEach(d => {
      const isGA = d.hormone.startsWith('GA');
      const cx = x(d.hormone) + x.bandwidth() / 2, bw = Math.min(36, x.bandwidth());
      const g = svg.append('g').attr('class', 'row').attr('tabindex', 0).attr('role', 'button').attr('aria-label', `${d.hormone}: about ${fmt(d.v)} ng/g DW`);
      g.append('rect').attr('x', x(d.hormone)).attr('y', m.t).attr('width', x.bandwidth()).attr('height', H - m.b - m.t).style('fill', 'transparent');
      const bar = g.append('rect').attr('x', cx - bw / 2).attr('y', y(d.v)).attr('width', bw).attr('height', y(0) - y(d.v)).attr('rx', 5).style('fill', isGA ? 'var(--up)' : 'var(--brand)');
      muted(g.append('text').attr('x', cx).attr('y', y(d.v) - 6).attr('text-anchor', 'middle').text('~' + fmt(d.v)));
      g.append('text').attr('x', cx).attr('y', H - m.b + 18).attr('text-anchor', 'middle').style('fill', 'var(--fg)').text(d.hormone);
      const pick = () => {
        bars.forEach(b => b.style('opacity', 0.45)); bar.style('opacity', 1);
        readout('longan-readout', d.hormone, [d.group, `About ${fmt(d.v)} ng/g dry weight`], source(d));
      };
      g.on('click', pick).on('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(); } });
      bars.push(bar);
    });
  }

  function drawPbz() {
    const rows = data.pbz;
    if (rows === null) return failed('pbz-chart');
    if (!rows) return;
    const list = rows.map(r => ({...r, p: +r.pct}));
    const sign = v => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v)) + '%';
    const value = d => (d.qualifier ? d.qualifier + ' ' : '') + sign(d.p);
    rowChart('pbz-chart', list, {
      title: 'Percent change in mango hormones with paclobutrazol',
      scale: r => d3.scaleLinear([-100, 260], r),
      axis: (svg, x, y0, y1) => gridX(svg, x, narrow() ? [-100, 0, 100, 200] : [-100, -50, 0, 50, 100, 150, 200, 250], y0, y1, t => t > 0 ? '+' + t : String(t), 0),
      padR: 40,
      label: d => `${d.hormone} · ${d.tissue} · ${d.comparison}`,
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
      select: d => readout('pbz-readout', `${d.hormone} · ${d.tissue}`, [d.comparison, value(d)], source(d))
    });
  }

  function drawFold() {
    const rows = data.fruitset;
    if (rows === null) return failed('fold-chart');
    if (!rows) return;
    const list = rows.map(r => ({...r, f: +r.fold})).sort((a, b) => b.f - a.f);
    const value = d => (d.qualifier ? d.qualifier + ' ' : '') + fmt(d.f) + '×';
    rowChart('fold-chart', list, {
      title: 'Fold change in hormones around fruit set',
      scale: r => d3.scaleLog([1, 30], r),
      axis: (svg, x, y0, y1) => gridX(svg, x, [1, 2, 5, 10, 20], y0, y1, t => t + '×', 1),
      padR: 64,
      label: d => `${d.crop} · ${d.hormone} · ${d.comparison}`,
      mark(g, d, x, y) {
        g.append('rect').attr('x', x(1)).attr('y', y - 7).attr('width', Math.max(2, x(d.f) - x(1))).attr('height', 14).attr('rx', 5)
          .style('fill', (VERIFY[d.verification] || VERIFY.SNIP).color);
        muted(g.append('text').attr('x', x(d.f) + 8).attr('y', y + 4).text(value(d)));
      },
      select: d => readout('fold-readout', `${d.crop} · ${d.cultivar}`, [`${d.hormone}: ${d.comparison}`, value(d)], source(d))
    });
  }

  /* ---------- draw only the visible view, so hidden charts never measure a zero width ---------- */
  function drawView() {
    if (typeof d3 === 'undefined') return;
    if (state.view === 'overview') { drawCropCard(); drawMatrix(); }
    if (state.view === 'regulators') drawRegulators();
    if (state.view === 'ripening') drawRipening();
    if (state.view === 'flowering') { drawLeaf(); drawLongan(); drawPbz(); }
    if (state.view === 'fruitset') drawFold();
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
    verKey.replaceChildren(...Object.values(VERIFY).map(v => {
      const sw = el('i', {class: 'sw'}); sw.style.background = v.color;
      return el('span', {}, sw, v.name);
    }));
    document.querySelectorAll('#stage-seg button').forEach(b => b.addEventListener('click', () => { state.stage = b.dataset.stage; drawMatrix(); }));
    document.querySelectorAll('#reg-stage button').forEach(b => b.addEventListener('click', () => { state.regStage = b.dataset.stage; drawRegulators(); }));
    document.getElementById('reg-crop').addEventListener('change', e => { state.regCrop = e.target.value; drawRegulators(); });
    document.getElementById('reg-measured').addEventListener('change', e => { state.regMeasured = e.target.checked; drawRegulators(); });
    window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });
    let w = window.innerWidth, timer;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => { if (window.innerWidth !== w) { w = window.innerWidth; drawView(); } }, 120);
    });
    route();
    if (typeof d3 === 'undefined') {
      /* The chart library comes from a CDN; the service worker keeps a copy after the first online visit. */
      document.querySelectorAll('.chart, #mx').forEach(n => n.replaceChildren(el('div', {class: 'fail', text: 'Charts need one online visit before they work offline'})));
      return;
    }
    load().then(drawView);
  }

  init();
})();
