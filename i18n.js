/* Three languages: English, Simplified Chinese and Malay. Every interface string lives here as [en, zh, ms].
   Static page text is marked with data-i18n (text), data-i18n-html (our own markup) or data-i18n-aria / -title.
   Long study notes and sources in the data files stay in English, the language of the papers. */
(function () {
  'use strict';
  const LANGS = {
    en: {label: 'English', short: 'EN', html: 'en'},
    zh: {label: '中文（简体）', short: '中文', html: 'zh-Hans'},
    ms: {label: 'Bahasa Melayu', short: 'BM', html: 'ms'}
  };
  const ORDER = ['en', 'zh', 'ms'];
  const KEY = 'crophormone.lang';

  const T = {
    /* ---------- app, language ---------- */
    'app.title': ['Tropical fruit hormone charts', '热带水果激素图表', 'Carta hormon buah tropika'],
    'brand': ['Fruit hormones', '水果激素', 'Hormon buah'],
    'lang.button': ['Language', '语言', 'Bahasa'],
    'lang.dataNote': ['', '研究笔记、数值说明和文献来源保留英文原文。', 'Nota kajian, keterangan nilai dan sumber dikekalkan dalam bahasa Inggeris.'],
    'aria.sections': ['Sections', '栏目', 'Bahagian'],
    'aria.sectionsBottom': ['Sections, bottom bar', '栏目（底部栏）', 'Bahagian, bar bawah'],
    'install.btn': ['Install app', '安装应用', 'Pasang aplikasi'],

    /* ---------- tabs and bottom bar ---------- */
    'tab.overview': ['Crop', '作物', 'Tanaman'],
    'tab.regulators': ['Regulators', '调节剂', 'Pengawal atur'],
    'tab.flowering': ['Flowering', '开花', 'Pembungaan'],
    'tab.fruitset': ['Fruit set', '坐果', 'Buah jadi'],
    'tab.ripening': ['Ripening', '成熟', 'Pemasakan'],
    'tab.report': ['Report', '报告', 'Laporan'],
    'nav.flowering': ['Flowering', '开花', 'Berbunga'],
    'nav.ripening': ['Ripening', '成熟', 'Masak'],

    /* ---------- names: crops, stages, hormones, groups ---------- */
    'crop.Durian': ['Durian', '榴莲', 'Durian'],
    'crop.Avocado': ['Avocado', '牛油果', 'Avokado'],
    'crop.Banana': ['Banana', '香蕉', 'Pisang'],
    'crop.Citrus': ['Citrus', '柑橘', 'Sitrus'],
    'crop.Guava': ['Guava', '番石榴', 'Jambu batu'],
    'crop.Litchi': ['Litchi', '荔枝', 'Laici'],
    'crop.Longan': ['Longan', '龙眼', 'Longan'],
    'crop.Mango': ['Mango', '芒果', 'Mangga'],
    'crop.Mangosteen': ['Mangosteen', '山竹', 'Manggis'],
    'crop.Papaya': ['Papaya', '木瓜', 'Betik'],
    'crop.Passion fruit': ['Passion fruit', '百香果', 'Markisa'],
    'crop.Pineapple': ['Pineapple', '菠萝', 'Nanas'],
    'crop.Rambutan': ['Rambutan', '红毛丹', 'Rambutan'],
    'stage.Flowering': ['Flowering', '开花', 'Pembungaan'],
    'stage.Fruit set': ['Fruit set', '坐果', 'Pembentukan buah'],
    'stage.Ripening': ['Ripening', '成熟', 'Pemasakan'],
    /* A stage inside a sentence: "at {stage}". */
    'stageL.Flowering': ['flowering', '开花期', 'pembungaan'],
    'stageL.Fruit set': ['fruit set', '坐果期', 'pembentukan buah'],
    'stageL.Ripening': ['ripening', '成熟期', 'pemasakan'],
    'h.GA': ['Gibberellin (GA)', '赤霉素 (GA)', 'Giberelin (GA)'],
    'h.Cytokinin': ['Cytokinin', '细胞分裂素', 'Sitokinin'],
    'h.ABA': ['Abscisic acid (ABA)', '脱落酸 (ABA)', 'Asid absisik (ABA)'],
    'h.IAA': ['Auxin (IAA)', '生长素 (IAA)', 'Auksin (IAA)'],
    'h.Ethylene': ['Ethylene', '乙烯', 'Etilena'],
    'h.JA': ['Jasmonates (JA)', '茉莉酸类 (JA)', 'Jasmonat (JA)'],
    'h.SA': ['Salicylic acid (SA)', '水杨酸 (SA)', 'Asid salisilik (SA)'],
    'h.BR': ['Brassinosteroids (BR)', '油菜素甾醇类 (BR)', 'Brasinosteroid (BR)'],
    'h.Polyamines': ['Polyamines', '多胺', 'Poliamina'],
    'h.Strigolactones': ['Strigolactones', '独脚金内酯', 'Strigolakton'],
    /* Short hormone names on regulator cards. */
    'hs.GA': ['GA', '赤霉素', 'GA'],
    'hs.Auxin': ['Auxin', '生长素', 'Auksin'],
    'hs.Cytokinin': ['Cytokinin', '细胞分裂素', 'Sitokinin'],
    'hs.Ethylene': ['Ethylene', '乙烯', 'Etilena'],
    'hs.ABA': ['ABA', '脱落酸', 'ABA'],
    'hs.BR': ['BR', '油菜素甾醇', 'BR'],
    'hs.JA': ['JA', '茉莉酸', 'JA'],
    'hs.Polyamines': ['Polyamines', '多胺', 'Poliamina'],
    'hs.Several': ['Several', '多种激素', 'Pelbagai'],
    'group.Classic hormones': ['Classic hormones', '经典激素', 'Hormon klasik'],
    'group.Other hormones': ['Other hormones', '其他激素', 'Hormon lain'],

    /* ---------- marks ---------- */
    'dir.up': ['Rises', '上升', 'Naik'],
    'dir.drop': ['Rises at drop', '落果时上升', 'Naik semasa gugur'],
    'dir.down': ['Falls', '下降', 'Turun'],
    'dir.peak': ['Peaks', '达到峰值', 'Memuncak'],
    'dir.low': ['Stays low', '保持低水平', 'Kekal rendah'],
    'dir.mix': ['Mixed', '有升有降', 'Bercampur'],
    'dir.conflict': ['Conflicting', '相互矛盾', 'Bercanggah'],
    'dir.nod': ['Not a driver', '非主导因素', 'Bukan pemacu'],
    'dir.trt': ['Applied only', '仅施用试验', 'Ujian semburan sahaja'],
    'dir.nd': ['No data', '无数据', 'Tiada data'],
    'short.up': ['Rises', '上升', 'Naik'],
    'short.drop': ['At drop', '落果时', 'Semasa gugur'],
    'short.peak': ['Peaks', '峰值', 'Puncak'],
    'short.down': ['Falls', '下降', 'Turun'],
    'short.low': ['Low', '低', 'Rendah'],
    'short.mix': ['Mixed', '升降不一', 'Bercampur'],
    'short.conflict': ['Conflict', '矛盾', 'Bercanggah'],
    'short.nod': ['Not a driver', '非主导', 'Bukan pemacu'],
    'short.trt': ['Applied', '仅施用', 'Semburan'],
    'inferred': [' (inferred)', '（推断）', ' (disimpulkan)'],
    'inferredShort': [', inferred', '，推断', ', disimpulkan'],

    /* ---------- how a value was checked ---------- */
    'v.FT': ['Full text', '全文', 'Teks penuh'],
    'v.ABS': ['Abstract', '摘要', 'Abstrak'],
    'v.SEC': ['Review or guide', '综述或指南', 'Ulasan atau panduan'],
    'v.SNIP': ['Search snippet', '搜索摘录', 'Petikan carian'],
    'v.DB': ['Database', '数据库', 'Pangkalan data'],
    'basis.Measured': ['Measured', '实测', 'Diukur'],
    'basis.Partly measured': ['Partly measured', '部分实测', 'Sebahagian diukur'],
    'basis.Inferred': ['Inferred', '推断', 'Disimpulkan'],
    'basis.Treatment only': ['Applied only', '仅施用试验', 'Ujian semburan sahaja'],

    /* ---------- small shared pieces ---------- */
    'colon': [': ', '：', ': '],
    'sep': [', ', '、', ', '],
    'and': [' and ', '和', ' dan '],
    'or': [' or ', ' 或 ', ' atau '],
    'fail': ['Failed to load', '加载失败', 'Gagal dimuatkan'],
    'offline': ['Needs one online visit before it works offline. Connect and reload.', '需要先联网打开一次才能离线使用。请联网后重新加载。', 'Perlu dibuka sekali dalam talian sebelum boleh digunakan luar talian. Sambung ke internet dan muat semula.'],
    'closer': ['Close ▴', '收起 ▴', 'Tutup ▴'],
    'source': ['source', '来源', 'sumber'],

    /* ---------- Crop tab ---------- */
    'overview.lead': ['Ten hormone classes for 13 crops at flowering, fruit set and ripening: the five classic hormones plus jasmonates, salicylic acid, brassinosteroids, polyamines and strigolactones. Every cell says whether it was measured, inferred, only tested as a spray, or has no study yet, so nothing is hidden.',
      '涵盖13种作物在开花、坐果和成熟阶段的十类激素：五大经典激素，以及茉莉酸类、水杨酸、油菜素甾醇类、多胺和独脚金内酯。每个格子都注明是实测、推断、仅做过喷施试验，还是尚无研究，不作任何隐瞒。',
      'Sepuluh kelas hormon bagi 13 tanaman semasa pembungaan, pembentukan buah dan pemasakan: lima hormon klasik serta jasmonat, asid salisilik, brasinosteroid, poliamina dan strigolakton. Setiap petak menyatakan sama ada ia diukur, disimpulkan, hanya diuji sebagai semburan, atau belum dikaji, supaya tiada apa yang disembunyikan.'],
    'overview.cropTitle': ['{crop} through the growth cycle', '{crop}：整个生长周期', '{crop} sepanjang kitaran pertumbuhan'],
    'overview.cropTitleDefault': ['Through the growth cycle', '整个生长周期', 'Sepanjang kitaran pertumbuhan'],
    'overview.note': ['Change crop with the Crop button in the top bar; every tab follows it. Dashed marks are inferred from the fruit type, not measured in that crop. “Applied” means the hormone was only tested as a spray or dip. “Mixed” means results go both ways (by variety, tissue or study) and “At drop” means a rise only in fruitlets that fall; the reason is listed under the table.',
      '用顶部栏的“作物”按钮切换作物，所有页面都会随之切换。虚线框标记是根据果实类型推断的，并非在该作物中实测。“仅施用”表示该激素只做过喷施或浸果试验。“升降不一”表示结果因品种、组织或研究而方向不同；“落果时”表示只在将要脱落的幼果中上升。原因列在表格下方。',
      'Tukar tanaman dengan butang Tanaman di bar atas; setiap tab akan mengikutinya. Tanda bergaris putus-putus disimpulkan daripada jenis buah, bukan diukur pada tanaman itu. “Semburan” bermaksud hormon itu hanya diuji sebagai semburan atau rendaman. “Bercampur” bermaksud keputusan berbeza arah (mengikut varieti, tisu atau kajian) dan “Semasa gugur” bermaksud kenaikan hanya dalam buah muda yang gugur; sebabnya disenaraikan di bawah jadual.'],
    'cov.count': ['{m} of 30', '{m}/30', '{m} daripada 30'],
    'cov.rest': [' hormone × stage cells measured or partly measured · {i} inferred · {a} applied only · {n} no data',
      ' 个“激素 × 阶段”格子为实测或部分实测 · {i} 个推断 · {a} 个仅施用试验 · {n} 个无数据',
      ' petak hormon × peringkat diukur atau sebahagian diukur · {i} disimpulkan · {a} ujian semburan sahaja · {n} tiada data'],
    'table.aria': ['{crop}: hormone direction by stage', '{crop}：各阶段激素变化方向', '{crop}: arah perubahan hormon mengikut peringkat'],
    'ev.summary': ['Evidence and sources', '证据与来源', 'Bukti dan sumber'],
    'ev.none': ['No study found for: {list}.', '尚无研究：{list}。', 'Tiada kajian ditemui untuk: {list}.'],
    'why.head': ['{hormones} at {stage}: ', '{stage}的{hormones}：', '{hormones} semasa {stage}: '],
    'why.inferred': ['Inferred general pattern; not measured in {crop}. ', '根据一般规律推断，未在{crop}中实测。', 'Corak umum yang disimpulkan; tidak diukur pada {crop}. '],
    'why.dropInferred': ['In fruit that has been studied, they rise in fruitlets the tree sheds, triggering the drop; fruit that stays on does not show this rise.',
      '在已有研究的果树中，它们在即将脱落的幼果中上升并引发落果；留在树上的果实没有这种上升。',
      'Dalam buah yang telah dikaji, hormon ini naik dalam buah muda yang digugurkan oleh pokok lalu mencetuskan keguguran; buah yang kekal di pokok tidak menunjukkan kenaikan ini.'],
    'why.drop2': ['Both rise in fruitlets the tree sheds, triggering the drop; fruit that stays on does not show this rise.',
      '两者都在即将脱落的幼果中上升并引发落果；留在树上的果实没有这种上升。',
      'Kedua-duanya naik dalam buah muda yang digugurkan oleh pokok lalu mencetuskan keguguran; buah yang kekal di pokok tidak menunjukkan kenaikan ini.'],
    'why.drop1': ['Rises in fruitlets the tree sheds, triggering the drop; fruit that stays on does not show this rise.',
      '在即将脱落的幼果中上升并引发落果；留在树上的果实没有这种上升。',
      'Naik dalam buah muda yang digugurkan oleh pokok lalu mencetuskan keguguran; buah yang kekal di pokok tidak menunjukkan kenaikan ini.'],
    'gaps.label': ['No study found yet: ', '尚无研究：', 'Belum ada kajian: '],
    'gaps.rest': ['. These are open research gaps, not zero levels.', '。这些是尚待研究的空白，不代表含量为零。', '. Ini jurang penyelidikan yang belum dikaji, bukan tahap sifar.'],

    /* ---------- crop button and menu ---------- */
    'chip.label': ['Crop', '作物', 'Tanaman'],
    'chip.aria': ['Crop: {crop}. {action} all {n} crops', '作物：{crop}。{action}全部 {n} 种作物', 'Tanaman: {crop}. {action} kesemua {n} tanaman'],
    'chip.show': ['Show', '显示', 'Tunjuk'],
    'chip.hide': ['Hide', '隐藏', 'Sembunyi'],
    'menu.aria': ['Choose a crop', '选择作物', 'Pilih tanaman'],
    'opt.aria': ['{crop}, {n} of 3 stages measured', '{crop}，3 个阶段中有 {n} 个有实测', '{crop}, {n} daripada 3 peringkat diukur'],
    'menu.note': ['Dots: stages with at least one measured hormone.', '圆点：至少有一种激素实测的阶段数。', 'Titik: peringkat yang mempunyai sekurang-kurangnya satu hormon diukur.'],

    /* ---------- stage tabs: all crops compared ---------- */
    'cmp.h2.Flowering': ['All crops at flowering', '开花期：所有作物', 'Semua tanaman semasa pembungaan'],
    'cmp.h2.Fruit set': ['All crops at fruit set', '坐果期：所有作物', 'Semua tanaman semasa pembentukan buah'],
    'cmp.h2.Ripening': ['All crops at ripening', '成熟期：所有作物', 'Semua tanaman semasa pemasakan'],
    'cmp.head': ['All crops at {stage}. {crop} is highlighted. ', '{stage}的所有作物，已突出显示{crop}。', 'Semua tanaman semasa {stage}. {crop} diserlahkan. '],
    'cmp.link': ['See {crop} through the whole cycle', '查看{crop}的整个生长周期', 'Lihat {crop} sepanjang kitaran'],
    'cmp.none': ['No crop has data at {stage} for: ', '{stage}没有任何作物有以下激素的数据：', 'Tiada tanaman mempunyai data semasa {stage} untuk: '],
    'cmp.noStudy': ['+{n} crops with no study', '+{n} 种作物尚无研究', '+{n} tanaman belum dikaji'],
    'cmp.noStudy1': ['+1 crop with no study', '+1 种作物尚无研究', '+1 tanaman belum dikaji'],
    'cmp.measured': ['{m} of {n} crops measured', '{n} 种作物中有 {m} 种有实测', '{m} daripada {n} tanaman diukur'],
    'cmp.noData': ['{n} no data', '{n} 种无数据', '{n} tiada data'],
    'cmp.open': ['{crop}: {dir}{inf}. Open {crop}', '{crop}：{dir}{inf}。打开{crop}', '{crop}: {dir}{inf}. Buka {crop}'],
    'why.conflict': ['Studies disagree. Open the crop and read Evidence and sources for why.', '各研究结论相互矛盾。打开该作物并查看“证据与来源”了解原因。', 'Kajian tidak sepakat. Buka tanaman itu dan baca Bukti dan sumber untuk sebabnya.'],
    'why.dropStage': ['In fruit that has been studied, it rises in fruitlets the tree sheds, triggering the drop; fruit that stays on does not show this rise.',
      '在已有研究的果树中，它在即将脱落的幼果中上升并引发落果；留在树上的果实没有这种上升。',
      'Dalam buah yang telah dikaji, hormon ini naik dalam buah muda yang digugurkan oleh pokok lalu mencetuskan keguguran; buah yang kekal di pokok tidak menunjukkan kenaikan ini.'],
    'why.dashed': [' Dashed crop names are inferred from this pattern, not measured.', '虚线框中的作物是据此规律推断的，并非实测。', ' Nama tanaman bergaris putus-putus disimpulkan daripada corak ini, bukan diukur.'],
    'why.mixed': ['Results go both ways, depending on variety, tissue or study:', '结果因品种、组织或研究而方向不同：', 'Keputusan berbeza arah, bergantung pada varieti, tisu atau kajian:'],
    'why.applied': ['Tested as a spray or dip; the natural level was not measured.', '只做过喷施或浸果试验，未测定天然含量。', 'Diuji sebagai semburan atau rendaman; tahap semula jadi tidak diukur.'],
    'why.nod': ['The level changes, but studies show it does not cause this stage.', '含量会变化，但研究表明它并非引起这一阶段的原因。', 'Tahapnya berubah, tetapi kajian menunjukkan ia bukan punca peringkat ini.'],
    'note.highlighted': ['{crop} is highlighted below.', '下方已突出显示{crop}。', '{crop} diserlahkan di bawah.'],
    'note.missing': ['No {what} found for {crop} yet. The chart shows the crops that have them.', '尚未找到{crop}的{what}。图表显示有数据的作物。', 'Belum ada {what} ditemui untuk {crop}. Carta menunjukkan tanaman yang mempunyainya.'],
    'what.ripe': ['ripening ethylene values', '成熟期乙烯数据', 'nilai etilena semasa pemasakan'],
    'what.fold': ['fruit-set fold changes', '坐果期倍数变化数据', 'data perubahan gandaan semasa pembentukan buah'],
    'flower.mine': ['{crop}’s charts are marked and shown first.', '{crop}的图表已标记并排在最前。', 'Carta {crop} ditanda dan dipaparkan dahulu.'],
    'flower.none': ['No measured flowering hormone values found for {crop} yet. Charts below are for the crops that have them.', '尚未找到{crop}开花期激素的实测数值。下方图表来自有数据的作物。', 'Belum ada nilai hormon pembungaan yang diukur ditemui untuk {crop}. Carta di bawah adalah untuk tanaman yang mempunyainya.'],

    /* ---------- residues ---------- */
    'res.summary': ['Residues: soil and fruit', '残留：土壤与果实', 'Residu: tanah dan buah'],
    'res.does': ['What it does: ', '作用：', 'Fungsi: '],
    'res.concern': ['Main concern: ', '主要隐患：', 'Kebimbangan utama: '],
    'res.time97': ['Time to about 97% gone in soil: ', '在土壤中降解约 97% 所需时间：', 'Masa sehingga kira-kira 97% hilang dalam tanah: '],
    'res.notFound': ['not found', '未找到', 'tidak ditemui'],
    'res.orchard': ['Measured in orchards: ', '果园实测：', 'Diukur di dusun: '],
    'res.repeat': ['Repeated use: ', '重复使用：', 'Penggunaan berulang: '],
    'res.effects': ['Effects on trees and later crops: ', '对果树和后茬作物的影响：', 'Kesan pada pokok dan tanaman seterusnya: '],
    'res.water': ['Water: ', '水体：', 'Air: '],
    'res.restrict': ['Restrictions: ', '限制：', 'Sekatan: '],
    'res.limits': ['Fruit residue limits for {crop}:', '{crop}果实残留限量：', 'Had residu dalam buah untuk {crop}:'],
    'res.seeNote': ['see note', '见说明', 'lihat nota'],
    'res.noValue': ['no value found', '未找到数值', 'tiada nilai ditemui'],
    'res.measured': [' · measured: ', ' · 实测：', ' · diukur: '],
    'res.noLimit': ['No fruit residue limit found for {crop} in the markets checked (China, US, EU, Codex, Japan). Where no limit is set, many markets apply a default of 0.01 mg/kg: check your export market.',
      '在所查市场（中国、美国、欧盟、国际食品法典、日本）中未找到{crop}的果实残留限量。未设限量时，许多市场采用 0.01 mg/kg 的默认值，请查询您的出口市场。',
      'Tiada had residu buah ditemui untuk {crop} di pasaran yang disemak (China, AS, EU, Codex, Jepun). Jika tiada had ditetapkan, banyak pasaran menggunakan had lalai 0.01 mg/kg: semak pasaran eksport anda.'],
    'persist.high': ['Long-lasting', '残留持久', 'Tahan lama'],
    'persist.mid': ['Moderate', '中等', 'Sederhana'],
    'persist.low': ['Short-lived', '残留短暂', 'Cepat terurai'],
    'persist.unknown': ['Unknown', '未知', 'Tidak diketahui'],
    'soil.lasts': ['Lasts in soil: ', '在土壤中残留：', 'Kekal dalam tanah: '],
    'soil.notFound': ['Not found', '未找到', 'Tidak ditemui'],
    'soil.class': ['Persistence class: ', '持久性等级：', 'Kelas ketahanan: '],
    'soil.dt50': ['Soil half-life (DT₅₀): ', '土壤半衰期 (DT₅₀)：', 'Separuh hayat dalam tanah (DT₅₀): '],
    'soil.dt50val': ['lab (controlled laboratory soil): {lab}; field (real fields, usually more relevant): {field}',
      '实验室（受控的实验室土壤）：{lab}；田间（真实田地，通常更有参考价值）：{field}',
      'makmal (tanah makmal terkawal): {lab}; ladang (ladang sebenar, biasanya lebih relevan): {field}'],
    'soil.97': ['Time to about 97% gone: ', '降解约 97% 所需时间：', 'Masa sehingga kira-kira 97% hilang: '],
    'soil.g.synthetic': ['Synthetic growth regulators', '合成植物生长调节剂', 'Pengawal atur tumbesaran sintetik'],
    'soil.n.synthetic': ['Where real soil residue concerns are. Longest-lasting first.', '真正的土壤残留隐患在这一类。残留最久的排在前面。', 'Di sinilah kebimbangan sebenar tentang residu dalam tanah. Yang paling tahan lama disenaraikan dahulu.'],
    'soil.g.natural': ['Natural hormones and hormone-like compounds', '天然激素及类激素物质', 'Hormon semula jadi dan sebatian seakan-hormon'],
    'soil.n.natural': ['Compounds plants make themselves; few have formal soil studies.', '植物自身会合成的物质；很少有正式的土壤研究。', 'Sebatian yang dihasilkan sendiri oleh tumbuhan; sedikit sahaja yang mempunyai kajian tanah formal.'],
    'soil.g.other': ['Other chemicals with residue concerns', '其他有残留隐患的化学品', 'Bahan kimia lain yang membimbangkan dari segi residu'],
    'soil.n.other': ['Not hormones themselves, but used to force flowering or ripening, with real residue risks.', '本身不是激素，但被用来催花或催熟，存在真实的残留风险。', 'Bukan hormon, tetapi digunakan untuk memaksa pembungaan atau pemasakan, dengan risiko residu yang nyata.'],

    /* ---------- regulators ---------- */
    'ev.Hormones measured': ['Hormones measured', '测定了激素', 'Hormon diukur'],
    'ev.Effect only': ['Effect only', '仅有效果', 'Kesan sahaja'],
    'ev.Practice': ['Practice', '生产实践', 'Amalan'],
    'act.Blocks': ['Blocks', '抑制', 'Menyekat'],
    'act.Boosts': ['Boosts', '促进', 'Meningkatkan'],
    'act.Indirect': ['Indirect', '间接影响', 'Tidak langsung'],
    'act.Mimics': ['Mimics', '模拟', 'Meniru'],
    'act.Releases': ['Releases', '释放', 'Membebaskan'],
    'act.Several': ['Affects', '影响', 'Mempengaruhi'],
    'reg.hc': ['Hormone changes', '激素变化', 'Perubahan hormon'],
    'reg.hcEmpty': ['Hormones were not measured in this study', '本研究未测定激素', 'Hormon tidak diukur dalam kajian ini'],
    'reg.see': ['What you see', '可见效果', 'Apa yang anda lihat'],
    'reg.seeEmpty': ['Visible effect not reported in the sources we could read', '我们能查阅的资料中未报告可见效果', 'Kesan yang boleh dilihat tidak dilaporkan dalam sumber yang dapat kami baca'],
    'reg.more': ['Product, aim, side effects and source', '产品、目的、副作用与来源', 'Produk, tujuan, kesan sampingan dan sumber'],
    'reg.used': ['Used in the study (not a recommendation)', '研究中的用法（非推荐用法）', 'Digunakan dalam kajian (bukan saranan)'],
    'reg.usedEmpty': ['Product details not reported in the sources we could read', '我们能查阅的资料中未报告产品细节', 'Butiran produk tidak dilaporkan dalam sumber yang dapat kami baca'],
    'reg.aim': ['Aim', '目的', 'Tujuan'],
    'reg.notStated': ['Not stated', '未说明', 'Tidak dinyatakan'],
    'reg.watch': ['Watch for', '注意', 'Awasi'],
    'reg.entries': ['{n} entries', '{n} 条记录', '{n} entri'],
    'reg.entry1': ['1 entry', '1 条记录', '1 entri'],
    'reg.forCrop': [' for {crop}', '（{crop}）', ' untuk {crop}'],
    'reg.forAll': [' for all crops', '（所有作物）', ' untuk semua tanaman'],
    'reg.order': ['. Entries with measured hormone changes come first.', '。有实测激素变化的记录排在前面。', '. Entri dengan perubahan hormon yang diukur disenaraikan dahulu.'],
    'reg.onlyCrop': ['Show {crop} only', '只显示{crop}', 'Tunjuk {crop} sahaja'],
    'reg.all': ['Show entries for all crops', '显示所有作物的记录', 'Tunjuk entri untuk semua tanaman'],
    'reg.none': ['No regulator studies found for {crop} at this stage.', '未找到{crop}在这一阶段的调节剂研究。', 'Tiada kajian pengawal atur ditemui untuk {crop} pada peringkat ini.'],
    'reg.moreBtn': ['Show {k} more of {n}', '再显示 {k} 条（还有 {n} 条）', 'Tunjuk {k} lagi daripada {n}'],

    /* ---------- charts ---------- */
    'hint.row': ['Tap a row for its details and source.', '点按一行查看详情和来源。', 'Ketik satu baris untuk butiran dan sumbernya.'],
    'hint.hormone': ['Tap a hormone for its values.', '点按一种激素查看数值。', 'Ketik satu hormon untuk melihat nilainya.'],
    'hint.bar': ['Tap a bar for its value.', '点按柱形查看数值。', 'Ketik satu bar untuk melihat nilainya.'],
    'ripe.aria': ['Ethylene production by crop: at harvest and at the ripening peak, log scale', '各作物乙烯释放量：采收时与成熟高峰，对数刻度', 'Pengeluaran etilena mengikut tanaman: semasa tuai dan pada puncak pemasakan, skala log'],
    'ripe.low': ['Low: under 1', '低：小于 1', 'Rendah: bawah 1'],
    'ripe.harvestOnly': ['At harvest {v}; peak not measured', '采收时 {v}；未测峰值', 'Semasa tuai {v}; puncak tidak diukur'],
    'ripe.from': [' · from {v} at harvest', ' · 采收时为 {v}', ' · daripada {v} semasa tuai'],
    'ripe.disagree': ['Peak {v} (sources disagree){from}', '峰值 {v}（来源不一致）{from}', 'Puncak {v} (sumber bercanggah){from}'],
    'ripe.peak': ['Peak {v}{from}', '峰值 {v}{from}', 'Puncak {v}{from}'],
    'ripe.more': [' (+{n} more in details)', '（详情中另有 {n} 条）', ' (+{n} lagi dalam butiran)'],
    'role.harvest': ['At harvest', '采收时', 'Semasa tuai'],
    'role.peak': ['Peak', '峰值', 'Puncak'],
    'role.other': ['Other', '其他', 'Lain-lain'],
    'leaf.aria': ['Mango leaf hormone levels, control vs girdled, log scale', '芒果叶片激素含量，对照与环剥，对数刻度', 'Tahap hormon daun mangga, kawalan berbanding dikelar gelang, skala log'],
    'leaf.control': ['Control (untreated branches): {v} ng/g fresh mass', '对照（未处理枝条）：{v} ng/g 鲜重', 'Kawalan (dahan tidak dirawat): {v} ng/g jisim segar'],
    'leaf.girdled': ['Girdled branches: {v} ng/g fresh mass', '环剥枝条：{v} ng/g 鲜重', 'Dahan dikelar gelang: {v} ng/g jisim segar'],
    'longan.aria': ['Longan shoot tip hormone levels', '龙眼梢尖激素含量', 'Tahap hormon pucuk longan'],
    'longan.about': ['About {v} ng/g dry weight', '约 {v} ng/g 干重', 'Kira-kira {v} ng/g berat kering'],
    'longan.bar': ['{h}: about {v} ng/g DW', '{h}：约 {v} ng/g 干重', '{h}: kira-kira {v} ng/g berat kering'],
    'pbz.aria': ['Percent change in mango hormones with paclobutrazol', '施用多效唑后芒果激素的变化百分比', 'Peratus perubahan hormon mangga dengan paklobutrazol'],
    'fold.aria': ['Fold change in hormones around fruit set', '坐果前后激素的倍数变化', 'Perubahan gandaan hormon sekitar pembentukan buah'],

    /* ---------- static page text ---------- */
    'reg.h1': ['Regulators', '植物生长调节剂', 'Pengawal atur tumbesaran'],
    'reg.lead': ['Growers boost or block hormones with sprays, drenches and storage treatments. Each card follows the chain from product to hormone to what you see on the tree or fruit, and says how strong the evidence is.',
      '种植者通过喷施、淋土和贮藏处理来促进或抑制激素。每张卡片沿着“产品 → 激素 → 树上或果实上可见的效果”这条链条展开，并说明证据的强弱。',
      'Penanam meningkatkan atau menyekat hormon melalui semburan, siraman tanah dan rawatan semasa penyimpanan. Setiap kad menjejaki rantaian daripada produk kepada hormon kepada apa yang anda lihat pada pokok atau buah, dan menyatakan kekuatan buktinya.'],
    'reg.cmpTitle': ['Boosters and blockers', '促进剂与抑制剂', 'Penggalak dan penyekat'],
    'reg.cmpSum': ['Which products raise or block each hormone, and its natural opponent. Tap to open.', '哪些产品会提高或抑制各种激素，以及它的天然拮抗激素。点按展开。', 'Produk yang meningkatkan atau menyekat setiap hormon, dan lawan semula jadinya. Ketik untuk buka.'],
    'reg.cmpNote': ['For each hormone: products that boost it, products that block it, and the plant hormone that naturally works against it.', '每种激素：促进它的产品、抑制它的产品，以及天然与它作用相反的植物激素。', 'Bagi setiap hormon: produk yang meningkatkannya, produk yang menyekatnya, dan hormon tumbuhan yang secara semula jadi bertindak menentangnya.'],
    'pair.ga_html': ['<span class="ph">Gibberellin</span><span><b>Boost:</b> GA₃ sprays (fruit set, delaying flowering, slowing peel ageing)</span><span><b>Block:</b> paclobutrazol, uniconazole, prohexadione-calcium stop its production (forcing flowering, curbing flush)</span><span><b>Natural opponent:</b> ABA (rest and flowering vs growth)</span>',
      '<span class="ph">赤霉素</span><span><b>促进：</b>喷施 GA₃（坐果、推迟开花、延缓果皮衰老）</span><span><b>抑制：</b>多效唑、烯效唑、调环酸钙阻止其合成（催花、控梢）</span><span><b>天然拮抗：</b>脱落酸（休眠和开花对抗生长）</span>',
      '<span class="ph">Giberelin</span><span><b>Galak:</b> semburan GA₃ (pembentukan buah, melewatkan pembungaan, melambatkan penuaan kulit)</span><span><b>Sekat:</b> paklobutrazol, unikonazol, proheksadion-kalsium menghentikan penghasilannya (memaksa pembungaan, mengawal pucuk baharu)</span><span><b>Lawan semula jadi:</b> ABA (dorman dan pembungaan berbanding pertumbuhan)</span>'],
    'pair.eth_html': ['<span class="ph">Ethylene</span><span><b>Boost:</b> ethephon, ethylene gas (pineapple forcing, ripening, degreening)</span><span><b>Block:</b> 1-MCP stops the plant sensing it; AVG stops its production; permanganate absorbs it from the air (shelf life, less drop)</span><span><b>Natural opponent:</b> auxin (keeps young fruit attached)</span>',
      '<span class="ph">乙烯</span><span><b>促进：</b>乙烯利、乙烯气体（菠萝催花、催熟、褪绿）</span><span><b>抑制：</b>1-MCP 使植物无法感知乙烯；AVG 阻止其合成；高锰酸钾从空气中吸收乙烯（延长货架期、减少落果）</span><span><b>天然拮抗：</b>生长素（使幼果不脱落）</span>',
      '<span class="ph">Etilena</span><span><b>Galak:</b> etefon, gas etilena (memaksa nanas berbunga, pemasakan, menghilangkan warna hijau kulit)</span><span><b>Sekat:</b> 1-MCP menghalang tumbuhan mengesannya; AVG menghentikan penghasilannya; permanganat menyerapnya dari udara (jangka hayat simpanan, kurang gugur)</span><span><b>Lawan semula jadi:</b> auksin (memastikan buah muda tidak gugur)</span>'],
    'pair.aux_html': ['<span class="ph">Auxin</span><span><b>Boost:</b> NAA, 2,4-D, 4-CPA (less fruit drop, bigger fruit)</span><span><b>Block:</b> no commercial blocker (TIBA is research only)</span><span><b>Natural opponent:</b> ethylene (lowers auxin flow and causes drop); cytokinin (side-bud growth)</span>',
      '<span class="ph">生长素</span><span><b>促进：</b>NAA、2,4-D、4-CPA（减少落果、果实更大）</span><span><b>抑制：</b>没有商用抑制剂（TIBA 仅用于研究）</span><span><b>天然拮抗：</b>乙烯（减少生长素运输并引起落果）；细胞分裂素（侧芽生长）</span>',
      '<span class="ph">Auksin</span><span><b>Galak:</b> NAA, 2,4-D, 4-CPA (kurang buah gugur, buah lebih besar)</span><span><b>Sekat:</b> tiada penyekat komersial (TIBA untuk penyelidikan sahaja)</span><span><b>Lawan semula jadi:</b> etilena (mengurangkan aliran auksin dan menyebabkan gugur); sitokinin (pertumbuhan tunas sisi)</span>'],
    'pair.ck_html': ['<span class="ph">Cytokinin</span><span><b>Boost:</b> CPPU, 6-BA (fruit set and size); KNO₃ acts partly through cytokinin</span><span><b>Block:</b> no commercial blocker</span><span><b>Natural opponent:</b> auxin at the shoot tip</span>',
      '<span class="ph">细胞分裂素</span><span><b>促进：</b>CPPU、6-BA（坐果和果实大小）；KNO₃ 部分通过细胞分裂素起作用</span><span><b>抑制：</b>没有商用抑制剂</span><span><b>天然拮抗：</b>梢尖的生长素</span>',
      '<span class="ph">Sitokinin</span><span><b>Galak:</b> CPPU, 6-BA (pembentukan dan saiz buah); KNO₃ bertindak sebahagiannya melalui sitokinin</span><span><b>Sekat:</b> tiada penyekat komersial</span><span><b>Lawan semula jadi:</b> auksin di hujung pucuk</span>'],
    'pair.aba_html': ['<span class="ph">ABA</span><span><b>Boost:</b> S-ABA (peel colour); water stress and girdling raise it</span><span><b>Block:</b> no commercial blocker (fluridone is research only)</span><span><b>Natural opponent:</b> gibberellin (growth vs rest)</span>',
      '<span class="ph">脱落酸</span><span><b>促进：</b>S-ABA（果皮着色）；水分胁迫和环剥会使其升高</span><span><b>抑制：</b>没有商用抑制剂（氟啶酮仅用于研究）</span><span><b>天然拮抗：</b>赤霉素（生长对抗休眠）</span>',
      '<span class="ph">ABA</span><span><b>Galak:</b> S-ABA (warna kulit); tekanan air dan kelar gelang meningkatkannya</span><span><b>Sekat:</b> tiada penyekat komersial (fluridon untuk penyelidikan sahaja)</span><span><b>Lawan semula jadi:</b> giberelin (pertumbuhan berbanding dorman)</span>'],
    'pair.oth_html': ['<span class="ph">Others</span><span><b>Boost:</b> MeJA, salicylic acid, brassinolide, putrescine, melatonin (colour, chilling and browning control, fruit set)</span><span><b>Block:</b> no commercial blockers</span><span><b>Natural opponent:</b> salicylic acid and jasmonates often oppose each other; polyamines compete with ethylene for the same building block</span>',
      '<span class="ph">其他</span><span><b>促进：</b>茉莉酸甲酯、水杨酸、芸苔素内酯、腐胺、褪黑素（着色、防冷害和褐变、坐果）</span><span><b>抑制：</b>没有商用抑制剂</span><span><b>天然拮抗：</b>水杨酸与茉莉酸类常相互拮抗；多胺与乙烯争夺同一种合成原料</span>',
      '<span class="ph">Lain-lain</span><span><b>Galak:</b> MeJA, asid salisilik, brasinolid, putresina, melatonin (warna, kawalan kecederaan sejuk dan keperangan, pembentukan buah)</span><span><b>Sekat:</b> tiada penyekat komersial</span><span><b>Lawan semula jadi:</b> asid salisilik dan jasmonat sering saling menentang; poliamina bersaing dengan etilena untuk bahan binaan yang sama</span>'],
    'pair.note_html': ['<b>Block</b> is a product that stops the plant making or sensing a hormone. <b>Natural opponent</b> is another of the plant’s own hormones with the opposite effect; where no blocker exists, growers shift the balance through it.',
      '<b>抑制</b>指阻止植物合成或感知某种激素的产品。<b>天然拮抗</b>指植物自身另一种作用相反的激素；没有抑制剂时，种植者就通过它来调节平衡。',
      '<b>Sekat</b> ialah produk yang menghalang tumbuhan menghasilkan atau mengesan sesuatu hormon. <b>Lawan semula jadi</b> ialah hormon lain milik tumbuhan itu sendiri yang memberi kesan bertentangan; jika tiada penyekat, penanam mengubah keseimbangan melaluinya.'],
    'reg.cause': ['Cause and effect for your crop', '您所选作物的因果关系', 'Sebab dan akibat untuk tanaman anda'],
    'reg.stage': ['Stage', '阶段', 'Peringkat'],
    'reg.allStages': ['All stages', '所有阶段', 'Semua peringkat'],
    'reg.measuredOnly': ['Only studies that measured hormones', '只看测定了激素的研究', 'Hanya kajian yang mengukur hormon'],
    'reg.measuredTitle': ['Hide entries that report only a visible effect or label advice', '隐藏只报告可见效果或标签建议的记录', 'Sembunyikan entri yang hanya melaporkan kesan yang boleh dilihat atau nasihat label'],
    'reg.notice_html': ['<strong>Not dosing advice:</strong> rates are what each study used; follow your local label.', '<strong>非用药建议：</strong>所列用量是各研究使用的用量；请遵循当地产品标签。', '<strong>Bukan nasihat dos:</strong> kadar ialah yang digunakan oleh setiap kajian; ikut label tempatan anda.'],
    'reg.noticeBody': ['Rates and timings shown are what each study used, in its own country and conditions. They may not be tested where you farm, and a product may not be registered or legal for your crop. Always follow your local registration and the product label, and ask your extension officer.',
      '所示用量和时间是各研究在其所在国家和条件下使用的。它们可能未在您的种植地区试验过，某些产品在您的作物上也可能未登记或不合法。请始终遵循当地的登记规定和产品标签，并咨询农业推广人员。',
      'Kadar dan masa yang ditunjukkan ialah yang digunakan oleh setiap kajian, di negara dan keadaannya sendiri. Ia mungkin belum diuji di kawasan anda bertani, dan sesuatu produk mungkin tidak berdaftar atau tidak sah untuk tanaman anda. Sentiasa ikut pendaftaran tempatan dan label produk, dan rujuk pegawai pengembangan pertanian anda.'],
    'soil.h2': ['What stays in the soil', '哪些会残留在土壤中', 'Apa yang kekal dalam tanah'],
    'soil.note_html': ['Each time is how long until about 97% of the product has broken down in soil, which is five <strong>soil half-lives (DT₅₀)</strong>. The half-life, or DT₅₀ (“disappearance time 50%”), is the time for half of it to break down: half is gone after one, three-quarters after two, about 97% after five. Pesticide labels and databases use this term. Real times vary with soil type, temperature, moisture and repeated use. Tap a product for measured orchard residues and effects.',
      '每个时间表示产品在土壤中降解约 97% 所需的时间，即五个<strong>土壤半衰期 (DT₅₀)</strong>。半衰期或 DT₅₀（“消失 50% 的时间”）是一半被降解所需的时间：一个半衰期后剩一半，两个后剩四分之一，五个后约 97% 已降解。农药标签和数据库都使用这个术语。实际时间会因土壤类型、温度、湿度和重复使用而不同。点按产品可查看果园实测残留及其影响。',
      'Setiap masa ialah tempoh sehingga kira-kira 97% produk terurai dalam tanah, iaitu lima kali <strong>separuh hayat dalam tanah (DT₅₀)</strong>. Separuh hayat, atau DT₅₀ (“masa hilang 50%”), ialah masa untuk separuh daripadanya terurai: separuh hilang selepas satu, tiga suku selepas dua, kira-kira 97% selepas lima. Label racun perosak dan pangkalan data menggunakan istilah ini. Masa sebenar berbeza mengikut jenis tanah, suhu, kelembapan dan penggunaan berulang. Ketik satu produk untuk residu yang diukur di dusun dan kesannya.'],
    'ripe.lead': ['Climacteric fruits (mango, durian, papaya, passion fruit, avocado) show an ethylene peak after harvest. Non-climacteric fruits such as rambutan stay low.',
      '呼吸跃变型水果（芒果、榴莲、木瓜、百香果、牛油果）在采收后会出现乙烯高峰。非呼吸跃变型水果（如红毛丹）的乙烯一直保持低水平。',
      'Buah klimakterik (mangga, durian, betik, markisa, avokado) menunjukkan puncak etilena selepas dituai. Buah bukan klimakterik seperti rambutan kekal rendah.'],
    'ripe.h2chart': ['Ethylene production: all crops compared', '乙烯释放量：各作物比较', 'Pengeluaran etilena: perbandingan semua tanaman'],
    'ripe.note': ['One row per crop. Hollow dot: ethylene at harvest. Filled mark: the ripening peak (a bar is a reported range; two marks mean two sources). The dashed arrow shows the rise. µL ethylene per kg of fruit per hour, log scale; each gridline is 10 times the last. Tap a crop for every measurement and its source.',
      '每种作物一行。空心圆点：采收时的乙烯。实心标记：成熟高峰（横条表示报告的范围；两个标记表示两个来源）。虚线箭头表示上升过程。单位为每公斤果实每小时释放的乙烯微升数 (µL)，对数刻度；每条网格线是前一条的 10 倍。点按作物可查看每项测量及其来源。',
      'Satu baris bagi setiap tanaman. Titik berongga: etilena semasa tuai. Tanda berisi: puncak pemasakan (bar ialah julat yang dilaporkan; dua tanda bermaksud dua sumber). Anak panah putus-putus menunjukkan kenaikan. µL etilena per kg buah per jam, skala log; setiap garis grid ialah 10 kali ganda garis sebelumnya. Ketik satu tanaman untuk setiap ukuran dan sumbernya.'],
    'flower.lead': ['How each hormone changes in buds, leaves and shoots before flowering, across all crops. Measured-value charts follow; units differ between studies, so each chart keeps its own scale.',
      '所有作物开花前，芽、叶和枝梢中各激素的变化。下面是实测数值图表；各研究的单位不同，因此每个图表使用各自的刻度。',
      'Bagaimana setiap hormon berubah dalam tunas, daun dan pucuk sebelum berbunga, merentas semua tanaman. Carta nilai yang diukur menyusul; unit berbeza antara kajian, jadi setiap carta menggunakan skalanya sendiri.'],
    'leaf.h2': ['Mango leaf, girdled vs control', '芒果叶片：环剥与对照', 'Daun mangga: dikelar gelang berbanding kawalan'],
    'leaf.note': ['ng/g fresh mass (FM: weight of fresh, undried leaf), measured by LC-MS/MS, log scale. “Control” means untreated comparison branches. Alphonso, one month after girdling. Girdled rows in the source table were scrambled, so treat ranges as approximate.',
      '单位 ng/g 鲜重（FM：新鲜、未烘干叶片的重量），用 LC-MS/MS 测定，对数刻度。“对照”指未处理的对比枝条。品种为 Alphonso，环剥后一个月。原始表格中环剥组的数据行有错位，因此范围只作参考。',
      'ng/g jisim segar (FM: berat daun segar yang belum dikeringkan), diukur dengan LC-MS/MS, skala log. “Kawalan” bermaksud dahan perbandingan yang tidak dirawat. Varieti Alphonso, sebulan selepas dikelar gelang. Baris dahan dikelar dalam jadual sumber bercampur aduk, jadi anggap julatnya sebagai anggaran.'],
    'leaf.key.control': ['Control (untreated, not girdled)', '对照（未处理、未环剥）', 'Kawalan (tidak dirawat, tidak dikelar)'],
    'leaf.key.girdled': ['Girdled branches (range)', '环剥枝条（范围）', 'Dahan dikelar gelang (julat)'],
    'longan.h2': ['Longan shoot tips after potassium chlorate (KClO₃)', '施用氯酸钾 (KClO₃) 后的龙眼梢尖', 'Pucuk longan selepas kalium klorat (KClO₃)'],
    'longan.note': ['Potassium chlorate is a salt poured on the soil under longan trees to make them flower out of season; its residues are listed under Regulators. Values in ng/g dry weight (DW: weight after drying), measured by LC-ESI-MS (a lab method that separates and weighs each hormone), read from the abstract. Gibberellins from treated trees; cytokinins from untreated trees.',
      '氯酸钾是一种盐，淋在龙眼树下的土壤中，使其在非当季开花；其残留情况见“调节剂”页面。数值单位为 ng/g 干重（DW：烘干后的重量），用 LC-ESI-MS（一种分离并称量每种激素的实验室方法）测定，数据取自论文摘要。赤霉素数据来自处理过的树；细胞分裂素数据来自未处理的树。',
      'Kalium klorat ialah garam yang dituang ke tanah di bawah pokok longan untuk memaksanya berbunga di luar musim; residunya disenaraikan di bawah Pengawal atur. Nilai dalam ng/g berat kering (DW: berat selepas dikeringkan), diukur dengan LC-ESI-MS (kaedah makmal yang memisahkan dan menimbang setiap hormon), dibaca daripada abstrak. Giberelin daripada pokok yang dirawat; sitokinin daripada pokok yang tidak dirawat.'],
    'longan.key.ga': ['Gibberellins, treated', '赤霉素，已处理', 'Giberelin, dirawat'],
    'longan.key.ck': ['Cytokinins, untreated', '细胞分裂素，未处理', 'Sitokinin, tidak dirawat'],
    'pbz.h2': ['Mango: change with paclobutrazol (PBZ)', '芒果：施用多效唑 (PBZ) 后的变化', 'Mangga: perubahan dengan paklobutrazol (PBZ)'],
    'pbz.note': ['Percent change in PBZ-treated Alphonso trees compared with untreated trees of the same orchard (the “control”, left untreated so any difference can be credited to PBZ). Burondkar 2016, from search snippets. The two “untreated trees” rows instead compare two dates within the untreated trees. Orange bars are decreases, blue bars increases, measured from the 0 line.',
      '施用 PBZ 的 Alphonso 芒果树与同一果园未处理树（即“对照”，保持不处理，以便把差异归因于 PBZ）相比的变化百分比。数据来自 Burondkar 2016 的搜索摘录。两行“未处理树”则是比较未处理树在两个日期之间的变化。橙色条表示减少，蓝色条表示增加，都从 0 线起算。',
      'Peratus perubahan pada pokok Alphonso yang dirawat PBZ berbanding pokok tidak dirawat di dusun yang sama (“kawalan”, dibiarkan tanpa rawatan supaya sebarang perbezaan boleh dikaitkan dengan PBZ). Burondkar 2016, daripada petikan carian. Dua baris “pokok tidak dirawat” pula membandingkan dua tarikh dalam pokok yang tidak dirawat. Bar jingga ialah penurunan, bar biru ialah kenaikan, diukur dari garis 0.'],
    'fruitset.lead': ['Before young fruit drop, ABA, ACC and ethylene climb. Few absolute fruit-set levels exist for these crops, so the chart shows fold changes.',
      '幼果脱落前，脱落酸、ACC 和乙烯会升高。这些作物很少有坐果期激素的绝对含量数据，因此图表显示的是倍数变化。',
      'Sebelum buah muda gugur, ABA, ACC dan etilena meningkat. Sedikit sahaja tahap mutlak semasa pembentukan buah tersedia bagi tanaman ini, jadi carta menunjukkan perubahan gandaan.'],
    'fold.h2': ['Fold change: all crops with data', '倍数变化：有数据的所有作物', 'Perubahan gandaan: semua tanaman yang mempunyai data'],
    'fold.note': ['Fold change: the hormone level as a multiple of the comparison level (untreated fruit or an earlier stage). 2× means double, 10× ten times as much, 1× no change. Log scale, so each step to the right multiplies. Colour shows how the value was checked.',
      '倍数变化：激素水平是对比对象（未处理的果实或较早的阶段）的多少倍。2× 表示翻倍，10× 表示是原来的十倍，1× 表示没有变化。采用对数刻度，向右每一格都是成倍增加。颜色表示数值的核实方式。',
      'Perubahan gandaan: tahap hormon sebagai gandaan tahap perbandingannya (buah tidak dirawat atau peringkat lebih awal). 2× bermaksud dua kali ganda, 10× sepuluh kali ganda, 1× tiada perubahan. Skala log, jadi setiap langkah ke kanan ialah gandaan. Warna menunjukkan cara nilai itu disemak.'],
    'foot.data_html': ['Values compiled from published studies, abstracts, reviews and extension guides. Every value’s verification level and source are in the <a href="https://github.com/stanleywoosweeleong/crophormone/tree/main/data" target="_blank" rel="noopener">data files (CSV, opens in GitHub)</a>; CSV files open in any spreadsheet app.',
      '数值汇编自已发表的研究、摘要、综述和农业推广指南。每个数值的核实等级和来源都在<a href="https://github.com/stanleywoosweeleong/crophormone/tree/main/data" target="_blank" rel="noopener">数据文件（CSV，在 GitHub 打开）</a>中；CSV 文件可用任何电子表格软件打开。',
      'Nilai dikumpul daripada kajian yang diterbitkan, abstrak, ulasan dan panduan pengembangan. Tahap pengesahan dan sumber setiap nilai terdapat dalam <a href="https://github.com/stanleywoosweeleong/crophormone/tree/main/data" target="_blank" rel="noopener">fail data (CSV, dibuka di GitHub)</a>; fail CSV boleh dibuka dalam mana-mana aplikasi hamparan.'],
    'foot.report_html': ['Full write-up with sources, gaps and conflicts: <a href="report.html">research report</a>.',
      '包含来源、研究空白和矛盾之处的完整说明：<a href="report.html">研究报告</a>（英文）。',
      'Laporan penuh dengan sumber, jurang dan percanggahan: <a href="report.html">laporan penyelidikan</a> (dalam bahasa Inggeris).'],
    'report.title': ['Research report · Fruit hormones', '研究报告 · 水果激素', 'Laporan penyelidikan · Hormon buah'],
    'report.only': ['', '本报告仅提供英文版。', 'Laporan ini hanya tersedia dalam bahasa Inggeris.'],
    'report.loading': ['Loading report…', '正在加载报告…', 'Memuatkan laporan…'],
    'report.fail': ['The report could not be loaded. Check your connection and try again.', '无法加载报告。请检查网络连接后重试。', 'Laporan tidak dapat dimuatkan. Semak sambungan anda dan cuba lagi.'],

    /* ---------- update toast ---------- */
    'toast.updated': ['App updated to the latest version.', '应用已更新到最新版本。', 'Aplikasi telah dikemas kini ke versi terkini.'],
    'toast.new': ['A new version is available.', '有新版本可用。', 'Versi baharu tersedia.'],
    'toast.reload': ['Reload', '重新加载', 'Muat semula'],
    'toast.ok': ['OK', '好', 'OK'],

    /* ---------- install steps (menu names follow each browser in that language) ---------- */
    'inst.done': ['Got it', '知道了', 'Faham'],
    'inst.ios.title': ['Install on iPhone or iPad', '在 iPhone 或 iPad 上安装', 'Pasang pada iPhone atau iPad'],
    'inst.ios.1a': ['Tap Share', '点按“分享”', 'Ketik Kongsi'],
    'inst.ios.1b': [' (the square with an arrow) in the browser toolbar.', '（带箭头的方框），位于浏览器工具栏。', ' (petak dengan anak panah) di bar alat pelayar.'],
    'inst.ios.2a': ['Scroll and tap Add to Home Screen.', '向下滚动并点按“添加到主屏幕”。', 'Tatal dan ketik Tambah ke Skrin Utama.'],
    'inst.ios.3a': ['Tap Add.', '点按“添加”。', 'Ketik Tambah.'],
    'inst.ios.3b': [' The app opens from your Home Screen and works offline.', '之后可从主屏幕打开应用，并可离线使用。', ' Aplikasi dibuka dari Skrin Utama anda dan boleh digunakan luar talian.'],
    'inst.ios.ff': ['In Firefox, Share is in the menu (☰).', '在 Firefox 中，“分享”位于菜单 (☰) 里。', 'Dalam Firefox, Kongsi terdapat dalam menu (☰).'],
    'inst.ios.note': ['Works in Safari, and in Chrome and Edge on iOS 16.4 or later.', '适用于 Safari，以及 iOS 16.4 或更高版本上的 Chrome 和 Edge。', 'Berfungsi dalam Safari, dan dalam Chrome serta Edge pada iOS 16.4 atau lebih baharu.'],
    'inst.and.title': ['Install on Android', '在 Android 上安装', 'Pasang pada Android'],
    'inst.and.menu': ['Tap the menu', '点按菜单', 'Ketik menu'],
    'inst.and.menuFf': [' (⋮).', ' (⋮)。', ' (⋮).'],
    'inst.and.menuSam': [' (☰) at the bottom.', ' (☰)，位于底部。', ' (☰) di bahagian bawah.'],
    'inst.and.menuTop': [' (⋮) at the top right.', ' (⋮)，位于右上角。', ' (⋮) di penjuru kanan atas.'],
    'inst.and.ffInstall': ['Tap Install', '点按“安装”', 'Ketik Pasang'],
    'inst.and.orHome': [' or Add to Home screen.', '或“添加到主屏幕”。', ' atau Tambah ke Skrin utama.'],
    'inst.and.sam': ['Tap Add page to, then Home screen.', '点按“添加页面到”，然后选“主屏幕”。', 'Ketik Tambah halaman ke, kemudian Skrin utama.'],
    'inst.and.install': ['Tap Install app', '点按“安装应用”', 'Ketik Pasang apl'],
    'inst.and.confirm': ['Confirm with Install.', '点按“安装”确认。', 'Sahkan dengan Pasang.'],
    'inst.and.after': [' The app opens from your home screen and works offline.', '之后可从主屏幕打开应用，并可离线使用。', ' Aplikasi dibuka dari skrin utama anda dan boleh digunakan luar talian.'],
    'inst.mac.title': ['Install on a Mac', '在 Mac 上安装', 'Pasang pada Mac'],
    'inst.mac.1a': ['In the menu bar, choose File', '在菜单栏中选择“文件”', 'Di bar menu, pilih Fail'],
    'inst.mac.1b': [' › Add to Dock (Safari 17 or later).', ' › “添加到程序坞”（Safari 17 或更高版本）。', ' › Tambah ke Dock (Safari 17 atau lebih baharu).'],
    'inst.mac.2a': ['Click Add.', '点按“添加”。', 'Klik Tambah.'],
    'inst.ff.title': ['Install this app', '安装此应用', 'Pasang aplikasi ini'],
    'inst.ff.1a': ['Firefox on a computer can’t install web apps.', '电脑上的 Firefox 无法安装网页应用。', 'Firefox pada komputer tidak boleh memasang aplikasi web.'],
    'inst.ff.1b': [' Open this page in Chrome or Edge to install it.', '请在 Chrome 或 Edge 中打开本页来安装。', ' Buka halaman ini dalam Chrome atau Edge untuk memasangnya.'],
    'inst.pc.title': ['Install on this computer', '在这台电脑上安装', 'Pasang pada komputer ini'],
    'inst.pc.1a': ['Click the install icon', '点击安装图标', 'Klik ikon pasang'],
    'inst.pc.1b': [' at the right end of the address bar (a screen with a down arrow).', '，位于地址栏右端（带向下箭头的屏幕图标）。', ' di hujung kanan bar alamat (skrin dengan anak panah ke bawah).'],
    'inst.pc.2a': ['Or open the menu', '或打开菜单', 'Atau buka menu'],
    'inst.pc.2edge': [' (…) › Apps › Install this site as an app.', ' (…) › “应用” › “将此站点作为应用安装”。', ' (…) › Apl › Pasang tapak ini sebagai apl.'],
    'inst.pc.2chrome': [' (⋮) › Cast, save and share › Install page as app.', ' (⋮) › “投放、保存和分享” › “将网页作为应用安装”。', ' (⋮) › Hantar, simpan dan kongsi › Pasang halaman sebagai apl.'],
    'inst.pc.3a': ['Click Install.', '点击“安装”。', 'Klik Pasang.'],
    'inst.pc.3b': [' The app gets its own window and works offline.', '应用会有自己的窗口，并可离线使用。', ' Aplikasi mendapat tetingkapnya sendiri dan boleh digunakan luar talian.']
  };

  const idx = l => Math.max(0, ORDER.indexOf(l));
  function saved() { try { const l = localStorage.getItem(KEY); return LANGS[l] ? l : null; } catch (e) { return null; } }
  let lang = saved() || 'en';

  /* t('key', {name: value}): the string in the current language, English if a translation is missing. */
  function t(key, vars) {
    const row = T[key];
    let s = row ? (row[idx(lang)] || row[0]) : key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return s;
  }
  /* Names that may be missing from the table (a new crop in the data) fall back to the English name. */
  const name = (prefix, n) => (T[prefix + n] ? t(prefix + n) : n);
  const crop = n => {
    if (T['crop.' + n]) return t('crop.' + n);
    /* "Citrus (sweet orange)": translate the crop, keep the detail. */
    const base = Object.keys(T).find(k => k.startsWith('crop.') && n.startsWith(k.slice(5) + ' '));
    return base ? t(base) + n.slice(base.length - 5) : n;
  };
  /* A data field in the current language: r.function_zh, falling back to r.function. */
  const field = (r, f) => (r && (r[f + '_' + lang] || r[f])) || '';

  function apply() {
    const html = document.documentElement;
    html.lang = LANGS[lang].html;
    html.dataset.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach(e => { e.innerHTML = t(e.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-aria]').forEach(e => e.setAttribute('aria-label', t(e.dataset.i18nAria)));
    document.querySelectorAll('[data-i18n-title]').forEach(e => e.setAttribute('title', t(e.dataset.i18nTitle)));
    document.querySelectorAll('[data-i18n-hide-en]').forEach(e => { e.hidden = lang === 'en'; });
    if (document.body.dataset.titleKey) document.title = t(document.body.dataset.titleKey);
    const b = document.getElementById('lang-btn');
    if (b) { b.textContent = LANGS[lang].short; b.setAttribute('aria-label', `${t('lang.button')}: ${LANGS[lang].label}`); }
  }

  function set(l) {
    if (!LANGS[l]) return;
    lang = l;
    try { localStorage.setItem(KEY, l); } catch (e) { /* not remembered */ }
    apply();
    window.dispatchEvent(new CustomEvent('langchange', {detail: l}));
  }

  /* The language picker: shown on first open, and from the language button. The title is in all three languages,
     since the reader has not chosen yet. */
  function picker(first) {
    let d = document.getElementById('lang-sheet');
    if (!d) {
      d = document.createElement('dialog');
      d.id = 'lang-sheet';
      d.className = 'sheet lang-sheet';
      d.setAttribute('aria-labelledby', 'lang-title');
      document.body.append(d);
      d.addEventListener('click', e => { if (e.target === d) d.close(); });
      /* Closing without a choice keeps the current language and does not ask again. */
      d.addEventListener('close', () => { if (!saved()) set(lang); });
    }
    /* One short title in all three languages, so it reads the same before and after a choice. */
    const h = document.createElement('h2');
    h.id = 'lang-title';
    h.textContent = ORDER.map(l => T['lang.button'][idx(l)]).join(' · ');
    const list = document.createElement('div');
    list.className = 'lang-list';
    ORDER.forEach(l => {
      const on = l === lang && !first;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-opt';
      btn.lang = LANGS[l].html;
      btn.setAttribute('aria-pressed', String(on));
      /* The short tag matches the top-bar button, which is where the language is changed later. */
      const name = document.createElement('span');
      name.textContent = LANGS[l].label;
      const tag = document.createElement('span');
      tag.className = 'lang-tag';
      tag.setAttribute('aria-hidden', 'true');
      tag.textContent = on ? '✓' : LANGS[l].short;
      btn.append(name, tag);
      btn.addEventListener('click', () => { set(l); d.close(); });
      list.append(btn);
    });
    d.replaceChildren(h, list);
    d.showModal();
    (list.querySelector('[aria-pressed="true"]') || list.firstChild).focus();
  }

  window.I18N = {t, crop, field, apply, set, picker, LANGS,
    get lang() { return lang; },
    stage: s => name('stage.', s), stageL: s => name('stageL.', s), hormone: k => name('h.', k), hs: k => name('hs.', k)};

  document.addEventListener('DOMContentLoaded', () => {
    apply();
    const b = document.getElementById('lang-btn');
    if (b) b.addEventListener('click', () => picker(false));
    if (!saved() && typeof HTMLDialogElement === 'function') picker(true);
  });
})();
