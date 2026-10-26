/* Tropical fruit hormone charts: loads the CSVs in data/, routes between views by hash, draws each chart. */
(function () {
  'use strict';

  const FILES = {
    lifecycle: 'data/lifecycle_direction.csv',
    ripening: 'data/ripening_ethylene.csv',
    mangoLeaf: 'data/flowering_mango_leaf.csv',
    longan: 'data/flowering_longan.csv',
    pbz: 'data/flowering_pct_change.csv',
    fruitset: 'data/fruitset_fold.csv'
  };
  const VIEWS = ['overview', 'ripening', 'flowering', 'fruitset'];
  const STAGES = ['Flowering', 'Fruit set', 'Ripening'];
  const HORMONES = [
    {field: 'GA', short: 'GA', name: 'Gibberellin (GA)'},
    {field: 'cytokinin', short: 'CK', name: 'Cytokinin'},
    {field: 'ABA', short: 'ABA', name: 'Abscisic acid (ABA)'},
    {field: 'IAA', short: 'IAA', name: 'Auxin (IAA)'},
    {field: 'ethylene', short: 'Eth', name: 'Ethylene'}
  ];
  const DIRECTION = {
    'Up': {glyph: '▲', cls: 'up', word: 'Rises'},
    'Down': {glyph: '▼', cls: 'down', word: 'Falls'},
    'Peak': {glyph: '▲', cls: 'peak', word: 'Peaks'},
    'Low': {glyph: '▽', cls: 'low', word: 'Stays low'},
    'Mixed': {glyph: '◆', cls: 'mix', word: 'Mixed'},
    'Conflicting': {glyph: '◆', cls: 'mix', word: 'Conflicting'},
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
  const state = {crop: DEFAULT_CROP, stage: 'Flowering', view: 'overview'};
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

  /* ---------- overview: one crop at a time, chosen from a picker ---------- */
  const stageRow = (rows, crop, s) => rows.find(x => x.crop === crop && x.stage === s);
  const measuredStages = (rows, crop) => STAGES.filter(s => { const r = stageRow(rows, crop, s); return r && /measured/i.test(r.basis); }).length;
  const dots = n => el('span', {class: 'dots', 'aria-hidden': 'true'}, ...STAGES.map((s, i) => el('i', {class: i < n ? 'on' : ''})));

  const SHORT = {up: 'Rises', peak: 'Peaks', down: 'Falls', low: 'Low', mix: 'Mixed', nd: '—'};
  const basisClass = b => b === 'Measured' ? 'measured' : b === 'Partly measured' ? 'partly' : b === 'Inferred' ? 'inferred' : '';

  /* The chosen crop: one compact table (hormones down, stages across), evidence folded away below it. */
  function cropPanel(rows, crop) {
    const byStage = STAGES.map(s => stageRow(rows, crop, s));
    const table = el('div', {class: 'ct', role: 'table', 'aria-label': `${crop}: hormone direction by stage`});
    table.append(el('div', {role: 'columnheader'}));
    STAGES.forEach((s, i) => {
      const basis = byStage[i] ? byStage[i].basis : 'No data';
      table.append(el('div', {class: 'ct-stage', role: 'columnheader'},
        el('span', {text: s}), el('span', {class: 'pill ' + basisClass(basis), text: basis.replace('Partly measured', 'Partly')})));
    });
    HORMONES.forEach(h => {
      table.append(el('div', {class: 'ct-h', role: 'rowheader', text: h.name}));
      byStage.forEach((r, i) => {
        const v = r ? r[h.field] : 'No data', d = dir(v);
        const inferred = r && r.basis === 'Inferred' && d.cls !== 'nd';
        table.append(el('div', {role: 'cell', 'aria-label': `${STAGES[i]}: ${d.word}${inferred ? ' (inferred)' : ''}`},
          el('span', {class: `c ${d.cls}${inferred ? ' inferred' : ''}`, title: d.word},
            d.cls === 'nd' ? null : el('span', {'aria-hidden': 'true', text: d.glyph}), SHORT[d.cls])));
      });
    });
    const evidence = el('details', {class: 'ev'}, el('summary', {text: 'Evidence and sources'}),
      ...STAGES.map((s, i) => el('p', {}, el('strong', {text: s + ': '}), byStage[i] ? byStage[i].note : 'No data found.')));
    return el('div', {class: 'crop-panel', role: 'region', 'aria-label': crop}, table, evidence);
  }

  /* The picker: every crop as a compact tile in a sheet; choosing one closes it. */
  let picker = null;
  function openPicker() {
    const rows = data.lifecycle;
    if (!rows) return;
    if (!picker) {
      picker = el('dialog', {class: 'sheet picker', 'aria-labelledby': 'picker-title'});
      picker.addEventListener('click', e => { if (e.target === picker) picker.close(); });
      document.body.append(picker);
    }
    picker.replaceChildren(
      el('h2', {id: 'picker-title', text: 'Choose a crop'}),
      el('p', {class: 'note', text: 'Dots show how many of the three stages have measurements.'}),
      el('div', {class: 'tiles'}, ...cropOrder(rows).map(crop => {
        const n = measuredStages(rows, crop);
        return el('button', {
          type: 'button', class: 'tile', 'aria-pressed': String(crop === state.crop), 'aria-label': `${crop}, ${n} of 3 stages measured`,
          onclick: () => { picker.close(); selectCrop(crop); }
        }, el('span', {class: 'tile-name', text: crop}), dots(n));
      })),
      el('button', {type: 'button', class: 'sheet-close', text: 'Cancel', onclick: () => picker.close()}));
    picker.showModal();
    const current = picker.querySelector('[aria-pressed="true"]');
    if (current) current.focus();
  }

  function drawCropCard() {
    const rows = data.lifecycle;
    if (rows === null) return failed('crop-detail');
    if (!rows) return;
    const crops = cropOrder(rows);
    if (!crops.includes(state.crop)) state.crop = crops[0];
    const i = crops.indexOf(state.crop);
    const n = measuredStages(rows, state.crop);
    const step = d => selectCrop(crops[(i + d + crops.length) % crops.length]);
    document.getElementById('crop-bar').replaceChildren(
      el('button', {type: 'button', class: 'crop-pick', 'aria-haspopup': 'dialog', 'aria-label': `${state.crop}, ${n} of 3 stages measured. Change crop`, onclick: openPicker},
        el('span', {class: 'crop-pick-name', text: state.crop}), dots(n), el('span', {class: 'caret', 'aria-hidden': 'true', text: '▾'})),
      el('span', {class: 'crop-count', text: `${i + 1} of ${crops.length}`}),
      el('span', {class: 'stepper'},
        el('button', {type: 'button', 'aria-label': `Previous crop: ${crops[(i - 1 + crops.length) % crops.length]}`, text: '‹', onclick: () => step(-1)}),
        el('button', {type: 'button', 'aria-label': `Next crop: ${crops[(i + 1) % crops.length]}`, text: '›', onclick: () => step(1)})));
    document.getElementById('crop-detail').replaceChildren(cropPanel(rows, state.crop));
  }

  function selectCrop(crop, scroll) {
    state.crop = crop;
    drawCropCard();
    drawMatrix();
    if (scroll) document.getElementById('crop-card').scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  /* ---------- overview: map of all crops ---------- */
  function drawMatrix() {
    const box = document.getElementById('mx');
    const rows = data.lifecycle;
    if (rows === null) return failed('mx');
    if (!rows) return;
    document.querySelectorAll('#stage-seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.stage === state.stage)));
    const crops = cropOrder(rows);
    const by = new Map(rows.map(r => [r.crop + '|' + r.stage, r]));
    /* One card per hormone; inside, crops grouped by direction, in this order. */
    const ORDER = ['Up', 'Peak', 'Down', 'Low', 'Mixed', 'Conflicting', 'No data'];
    box.replaceChildren(...HORMONES.map(h => {
      const groups = new Map(ORDER.map(k => [k, []]));
      crops.forEach(crop => {
        const r = by.get(crop + '|' + state.stage);
        const v = r && DIRECTION[r[h.field]] ? r[h.field] : 'No data';
        groups.get(v).push({crop, inferred: !!r && r.basis === 'Inferred'});
      });
      const lines = ORDER.filter(k => groups.get(k).length).map(k => {
        const d = DIRECTION[k];
        return el('div', {class: 'grp' + (k === 'No data' ? ' nd' : '')},
          el('span', {class: `c ${d.cls}`}, el('span', {'aria-hidden': 'true', text: d.glyph}), d.word),
          el('span', {class: 'names'}, ...groups.get(k).map(g => el('button', {
            type: 'button', class: 'name' + (g.inferred && k !== 'No data' ? ' inferred' : '') + (g.crop === state.crop ? ' on' : ''),
            'aria-label': `${g.crop}: ${d.word}${g.inferred ? ', inferred' : ''}. Open ${g.crop}`,
            text: g.crop, onclick: () => selectCrop(g.crop, true)
          }))));
      });
      return el('article', {class: 'cmp-card'}, el('h3', {text: h.name}), ...lines);
    }));
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
