// Draw from a picture or PDF: the dialog with the AI service mocked (no real API call). node test/ui_ai_import.js d|m
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs');
(async () => {
  const mode = process.argv[2] || 'd';
  const SH = '/tmp/claude-0/shots'; fs.mkdirSync(SH, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let fail = 0; const ok = (c, m) => { if (!c) fail++; console.log(c ? 'ok  ' : 'FAIL', m); };
  const ctx = await b.newContext(mode === 'm' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); let dialogs = 0; p.on('dialog', (d) => { dialogs++; d.accept(); });
  // the mocked AI service
  let answer = { status: 200, text: '' }, lastReq = null, calls = 0;
  await p.route('https://api.anthropic.com/**', async (route) => {
    calls++; lastReq = JSON.parse(route.request().postData() || '{}');
    if (answer.status !== 200) return route.fulfill({ status: answer.status, contentType: 'application/json', body: JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }) });
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ content: [{ type: 'text', text: answer.text }], stop_reason: 'end_turn' }) });
  });
  const DOL = 'Here is the drawing:\n```json\n' + JSON.stringify({
    parts: [['G1', 'SRC3', 40, 20], ['QF1', 'MCB3', 40, 150, { rating: 16 }], ['KM1', 'CONT3', 40, 320, { coil: '230VAC' }], ['FR1', 'OL', 40, 590, { set: 3.5 }], ['M1', 'MOT3', 30, 800],
      ['FU1', 'FUSE', 400, 150], ['SB1', 'PB_NC', 340, 280], ['SB2', 'PB_NO', 430, 280], ['XX1', 'WARP_DRIVE', 0, 0]],
    wires: [['G1.L1', 'QF1.1'], ['G1.L2', 'QF1.3'], ['G1.L3', 'QF1.5'], ['QF1.2', 'KM1.1'], ['QF1.4', 'KM1.3'], ['QF1.6', 'KM1.5'], ['KM1.2', 'FR1.1'], ['KM1.4', 'FR1.3'], ['KM1.6', 'FR1.5'], ['FR1.2', 'M1.U1'], ['FR1.4', 'M1.V1'], ['FR1.6', 'M1.W1'],
      ['QF1.2', 'FU1.1'], ['FU1.2', 'SB1.1'], ['SB1.2', 'SB2.3'], ['SB1.2', 'KM1.13'], ['SB2.4', 'KM1.14'], ['SB2.4', 'FR1.95'], ['FR1.96', 'KM1.A1'], ['KM1.A2', 'G1.N'], ['KM1.A9', 'G1.N']],
    notes: ['Control circuit 230 V from L1 and N'], unsure: ['Overload setting not readable'],
  }) + '\n```';
  const PLANT = JSON.stringify({ units: [['S1', 'SUPPLY', 0, 300], ['T1', 'TANK', 200, 80, { lt: 'B1' }], ['P1', 'PUMP', 460, 300, { motor: 'M1' }], ['V1', 'VALVE', 700, 300], ['D1', 'DRAIN', 900, 300]],
    pipes: [['S1.out', 'T1.inA'], ['T1.out1', 'P1.in'], ['P1.out', 'V1.a'], ['V1.b', 'D1.in']], parts: [['M1', 'MOT3', 40, 20], ['B1', 'TXV', 300, 20]], wires: [], notes: ['Pump P-101 shown as P1'] });
  const MECH = JSON.stringify({ title: 'Centrifugal pump section', summary: 'End-suction pump with a mechanical seal.', how_it_works: 'The impeller throws water outwards.', parts: [{ name: '1 - casing', qty: 1, material: 'cast iron', function: 'holds the water', lib: 'PUMPID' }, { name: '2 - mechanical seal', qty: 1, lib: null }], assembly_order: ['Fit the seal', 'Fit the impeller'], checks: ['Check the seal for leaks'] });
  const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAGklEQVR42mP8z8Dwn4EIwMRAJGAcVUgfhQAAvJcEDQ8MeqQAAAAASUVORK5CYII=', 'base64');
  const url = 'file:///home/claude/lab/dist/electrical-lab.html';
  await p.goto(url); await p.waitForTimeout(900);
  await p.evaluate(() => { localStorage.removeItem('ellab.ai'); localStorage.removeItem('ellab.benchHome'); const c = EL.bench.ed.c; c.parts[0].tag = 'MYWORK'; EL.bench.save(); });
  await p.reload(); await p.waitForTimeout(900);
  const mechId = await p.evaluate(() => (EL.mech.lib.find((c) => c.cat === 'pumps') || EL.mech.lib[0]).id);

  for (const lang of ['en', 'ar']) {
    await p.evaluate((l) => EL.ui.setLang(l), lang); await p.waitForTimeout(200);
    await p.evaluate(() => EL.ui.show('bench'));
    ok(await p.isVisible('#btnAiImport'), lang + ': toolbar button "From a drawing" visible');
    await p.click('#btnAiImport'); await p.waitForTimeout(300);
    ok(await p.isVisible('.aim-box'), lang + ': dialog opens');
    await p.screenshot({ path: SH + '/aim_' + mode + '_' + lang + '_open.png' });
    if (lang === 'en') ok(await p.isDisabled('#aimGo'), 'Read and draw is off until a file is added'); else ok((await p.$$('.aim-th')).length === 1, 'ar: the picture is kept when the dialog is opened again');
    if (lang === 'en') {
      ok(await p.evaluate(() => document.querySelector('.aim-key').open), 'key fields open when no key is set');
      await p.setInputFiles('#aimImgIn', { name: 'diagram.png', mimeType: 'image/png', buffer: PNG }); await p.waitForTimeout(400);
      ok((await p.$$('.aim-th')).length === 1, 'picture added as a thumbnail');
      await p.click('#aimGo'); await p.waitForTimeout(300);
      ok(/API key/i.test(await p.textContent('.aim-err')) && calls === 0, 'no key -> clear message, nothing sent');
      await p.fill('#aimKey', 'sk-ant-test-' + 'x'.repeat(30)); await p.dispatchEvent('#aimKey', 'change');
      answer = { status: 401 }; await p.click('#aimRetry'); await p.waitForSelector('.aim-err', { timeout: 5000 }); await p.waitForTimeout(200);
      ok(/refused the key/.test(await p.textContent('.aim-err')), 'API error 401 -> "refused the key" message');
      answer = { status: 200, text: 'Sorry, I cannot see a diagram in this picture.' }; await p.click('#aimRetry'); await p.waitForTimeout(600);
      ok(/expected format/.test(await p.textContent('.aim-err')) && (await p.isVisible('.aim-err details')), 'no JSON -> message + the raw answer');
      answer = { status: 200, text: DOL };
      await p.fill('#aimNote', 'only the motor starter'); await p.click('#aimRetry'); await p.waitForSelector('.aim-res', { timeout: 5000 });
      const blocks = lastReq.messages[0].content.map((x) => x.type);
      ok(blocks[0] === 'image' && lastReq.messages[0].content[0].source.media_type === 'image/jpeg' && blocks[blocks.length - 1] === 'text', 'request: JPEG image block then the text');
      ok(/CONT3 \|/.test(lastReq.messages[0].content[1].text) && /only the motor starter/.test(lastReq.messages[0].content[1].text) && /simulator/.test(lastReq.system), 'request carries the catalog, the note and the system prompt');
      ok(lastReq.max_tokens >= 8000, 'room for a big answer: max_tokens ' + lastReq.max_tokens);
    } else {
      await p.click('.aim-kind[data-k=panel]'); answer = { status: 200, text: DOL }; await p.click('#aimGo'); await p.waitForSelector('.aim-res', { timeout: 5000 });
      ok(/Egyptian Arabic/.test(lastReq.messages[0].content[lastReq.messages[0].content.length - 1].text), 'ar: the AI is asked to write the notes in Egyptian Arabic');
    }
    const res = await p.textContent('.aim-res');
    ok(/8/.test(res) && (/WARP_DRIVE/.test(await p.textContent('.aim-drop'))), lang + ': preview shows counts and the dropped unknown type');
    ok(await p.isVisible('svg.aim-pv'), lang + ': panel preview drawn');
    await p.screenshot({ path: SH + '/aim_' + mode + '_' + lang + '_panel.png' });
    const d0 = dialogs;
    await p.click('#aimOpen'); await p.waitForTimeout(800);
    const s = await p.evaluate(() => ({ tab: EL.ui.view(), view: EL.bench.view, tags: EL.bench.ed.c.parts.map((x) => x.tag), w: EL.bench.ed.c.wires.length, proj: EL.bench.ed.c.proj && EL.bench.ed.c.proj.id, home: !!localStorage.getItem('ellab.benchHome') }));
    ok(s.tab === 'bench' && s.view === 'panel' && ['G1', 'QF1', 'KM1', 'FR1', 'M1', 'SB2'].every((t) => s.tags.includes(t)) && s.w === 20, lang + ': opened on the bench: ' + s.tags.length + ' parts, ' + s.w + ' wires');
    ok(s.proj === 'ai' && s.home && dialogs === d0, lang + ': opened as a visit (own bench kept, nothing asked)');
    ok(await p.isVisible('#btnHome'), lang + ': "My bench" button shown');
    await p.screenshot({ path: SH + '/aim_' + mode + '_' + lang + '_bench.png' });
    await p.click('#btnHome'); await p.waitForTimeout(500);
    ok(await p.evaluate(() => EL.bench.ed.c.parts[0].tag === 'MYWORK' && !EL.bench.ed.c.proj), lang + ': "My bench" brings back my own work');
  }
  // P&ID with linked panel parts -> Whole plant
  await p.evaluate(() => EL.ui.setLang('en'));
  await p.click('#tabs .tab[data-v=projects]'); await p.waitForTimeout(300);
  ok(await p.isVisible('#pjAiImport'), 'Projects page has "Draw from a picture or PDF"');
  await p.click('#pjAiImport'); await p.waitForTimeout(300);
  await p.click('.aim-kind[data-k=plant]');
  await p.setInputFiles('#aimPdfIn', { name: 'manual.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF') }); await p.waitForTimeout(300);
  await p.fill('#aimPage', 'page 12');
  answer = { status: 200, text: PLANT }; await p.click('#aimGo'); await p.waitForSelector('.aim-res', { timeout: 5000 });
  const pdfB = lastReq.messages[0].content.find((x) => x.type === 'document');
  ok(pdfB && pdfB.source.media_type === 'application/pdf' && pdfB.source.data.length > 10 && /page 12/.test(lastReq.messages[0].content.slice(-1)[0].text), 'PDF sent as a document block with the page hint');
  ok(lastReq.messages[0].content.some((x) => x.type === 'image'), 'earlier picture still attached (several pages allowed)');
  ok(await p.isVisible('#aimOpenAll'), 'P&ID with panel parts offers "Open in Whole plant"');
  await p.screenshot({ path: SH + '/aim_' + mode + '_en_plant.png' });
  await p.click('#aimOpenAll'); await p.waitForTimeout(900);
  ok(await p.evaluate(() => EL.bench.view === 'all' && EL.bench.ed.c.plant.units.length === 5 && EL.bench.ed.c.parts.length === 2), 'Whole plant view opened with 5 units and 2 panel parts');
  await p.click('#btnHome'); await p.waitForTimeout(400);
  // replace my drawing
  await p.click('#btnAiImport'); await p.waitForTimeout(300);
  await p.click('.aim-kind[data-k=panel]'); answer = { status: 200, text: DOL }; await p.click('#aimGo'); await p.waitForSelector('.aim-res', { timeout: 5000 });
  const d1 = dialogs; await p.click('#aimReplace'); await p.waitForTimeout(600);
  ok(dialogs === d1 + 1 && (await p.evaluate(() => !EL.bench.ed.c.proj && EL.bench.ed.c.parts.some((x) => x.tag === 'KM1'))), '"Replace my drawing" asks first, then the drawing becomes the own bench');
  // mechanical
  await p.click('#btnAiImport'); await p.waitForTimeout(300);
  await p.click('.aim-kind[data-k=mech]'); answer = { status: 200, text: MECH.replace('PUMPID', mechId) }; await p.click('#aimGo'); await p.waitForSelector('.aim-res', { timeout: 5000 });
  ok((await p.$$('.aim-tab tr')).length === 3 && (await p.isVisible('#aimOpen3d')), 'mechanical: parts table and "Open in 3D library"');
  await p.evaluate(() => EL.ui.setLang('ar')); await p.waitForTimeout(300);
  await p.screenshot({ path: SH + '/aim_' + mode + '_ar_mech.png' });
  await p.click('#aimOpen3d'); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => EL.ui.view() === 'mech'), 'opens the 3D library on the matched item');
  console.log(errs.length ? errs : 'no errors'); if (errs.length) fail++;
  console.log(fail ? fail + ' FAILED' : 'ALL OK'); await b.close(); process.exit(fail ? 1 : 0);
})();
