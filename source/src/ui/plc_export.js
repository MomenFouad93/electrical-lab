/* Export dialog next to the ladder: "S7-1200 code" (SCL with line numbers, copy, download) and "TIA Portal" (steps + downloads of the
   external source and the PLC tag table .xlsx / .csv). Conversion: EL.scl (src/plc_scl.js). */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T;
  const PX = (ui.plcExport = {});
  const KEY = 'ellab.sclSym';
  const symOn = () => { try { return localStorage.getItem(KEY) !== 'off'; } catch (e) { return true; } };
  const setSym = (v) => { try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch (e) { /* private mode */ } };

  function download(name, data, type) {
    const a = h('a', { href: URL.createObjectURL(new Blob([data], { type })), download: name });
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }
  function copy(text) {
    const done = () => ui.toast(['Copied. Paste it into an external source file or an SCL block.', 'اتنسخ. الصقه في ملف سورس خارجي أو بلوك SCL.'], 'ok');
    const fallback = () => {
      const ta = h('textarea', { style: { position: 'fixed', top: '-1000px', opacity: '0' } }); ta.value = text;
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      if (ok) done(); else ui.toast(['Copy is blocked here: use Download .scl.', 'النسخ مقفول هنا: استخدم تنزيل .scl.'], 'warn');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }

  PX.open = function (part, work, tab) {
    if (!part) { ui.toast(['Add a PLC to the panel first.', 'ضيف PLC في اللوحة الأول.'], 'warn'); return null; }
    const circuit = EL.bench && EL.bench.ed ? EL.bench.ed.c : null;
    let cur = tab === 'tia' ? 'tia' : 'code', res = null;
    const base = EL.scl.fileBase(part);
    const files = {
      scl: () => download(base + '_FB_Main.scl', res.scl, 'text/plain;charset=utf-8'),
      xlsx: () => download(base + '_PLC_Tags.xlsx', EL.scl.tagsXlsx(res.tags), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
      csv: () => download(base + '_PLC_Tags.csv', EL.scl.tagsCsv(res.tags), 'text/csv;charset=utf-8'),
    };
    const body = h('div', { class: 'scl-body' });
    const seg = h('div', { class: 'seg scl-tabs' },
      h('button', { class: 'btn sm', 'data-tab': 'code', onclick: () => { cur = 'code'; render(); }, text: T(['S7-1200 code', 'كود S7-1200']) }),
      h('button', { class: 'btn sm', 'data-tab': 'tia', onclick: () => { cur = 'tia'; render(); }, text: 'TIA Portal' }));
    const symBox = h('input', { type: 'checkbox', id: 'sclSym' }); symBox.checked = symOn();
    symBox.addEventListener('change', () => { setSym(symBox.checked); convert(); render(); });
    const cpuLine = h('div', { class: 'scl-cpu' });
    const m = ui.modal([h('div', { class: 'scl-dlg' },
      h('h3', { text: T(['Export the ladder of ', 'تصدير لادر ']) + part.tag + T([' to a real PLC', ' لـPLC حقيقي']) }),
      cpuLine, seg,
      h('label', { class: 'scl-opt' }, symBox, h('span', { text: T(['Use tag names in the code (import the tag table first)', 'استخدم أسماء التاجات في الكود (استورد جدول التاجات الأول)']) })),
      body)]);
    const box = m.querySelector('.box'); if (box) box.classList.add('scl-box');
    m.classList.add('scl-modal');

    function convert() {
      const src = work && work.nets ? work : part;
      res = EL.scl.convert(src, circuit, { part, symbolic: symBox.checked });
    }
    function warnCard() {
      const c = h('div', { class: 'card scl-warn' }, h('h4', { text: T(['Conversion notes', 'ملاحظات التحويل']) + ' (' + res.warnings.length + ')' }));
      if (!res.warnings.length) c.appendChild(h('p', { class: 'mute sm', text: T(['No conversion warnings: every element has an SCL translation.', 'مفيش تحذيرات: كل عنصر له ترجمة SCL.']) }));
      for (const w of res.warnings) c.appendChild(h('div', { class: 'scl-w ' + w.lvl }, w.ni >= 0 ? h('b', { text: 'N' + (w.ni + 1) + ' ' }) : null, h('span', { text: T(w.msg) })));
      return c;
    }
    function codeView() {
      const lines = res.scl.split('\r\n');
      while (lines.length && lines[lines.length - 1] === '') lines.pop();
      const pre = h('div', { class: 'scl-code', dir: 'ltr', role: 'region', 'aria-label': 'SCL' });
      const frag = document.createDocumentFragment();
      lines.forEach((l, i) => {
        const row = h('div', { class: 'scl-l' + (/^\s*\/\/ TODO/.test(l) || /TODO:/.test(l) ? ' todo' : /^\s*\/\//.test(l) ? ' c' : '') });
        row.append(h('span', { class: 'n', text: String(i + 1) }), h('span', { class: 't', text: l.replace(/\t/g, '    ') || ' ' }));
        frag.appendChild(row);
      });
      pre.appendChild(frag);
      return pre;
    }
    function tiaView() {
      const steps = [
        ['In TIA Portal (V16 or newer) add the CPU: Add new device > Controllers > SIMATIC S7-1200 > CPU > ' + res.cpu.name + ' (pick the order number and firmware of your hardware).', 'في TIA Portal (V16 أو أحدث) ضيف الـCPU: Add new device > Controllers > SIMATIC S7-1200 > CPU > ' + res.cpu.name + ' (اختار رقم الطلب والفيرموير بتوع الجهاز بتاعك).'],
        ['Import the tags first: PLC tags > Show all tags > Import (button in the tag table) > choose the .xlsx file.', 'استورد التاجات الأول: PLC tags > Show all tags > Import (زرار في جدول التاجات) > اختار ملف الـ.xlsx.'],
        ['Add the code: in the project tree under the CPU open External source files > Add new external file > choose the .scl file.', 'ضيف الكود: في شجرة المشروع تحت الـCPU افتح External source files > Add new external file > اختار ملف الـ.scl.'],
        ['Right-click the source > Generate blocks from source. FB_Main, IDB_Main and Main (OB1) appear in Program blocks. Accept replacing the empty Main.', 'كليك يمين على السورس > Generate blocks from source. هيظهر FB_Main و IDB_Main و Main (OB1) في Program blocks. وافق إنه يستبدل الـMain الفاضي.'],
        ['Compile: right-click the CPU > Compile > Software (rebuild all). Fix any message, then check the I/O addresses in the device view match the tag table.', 'اعمل Compile: كليك يمين على الـCPU > Compile > Software (rebuild all). صلّح أي رسالة، واتأكد إن عناوين الـI/O في الـdevice view مطابقة لجدول التاجات.'],
        ['Download to device (PG/PC interface, CPU IP address), put the CPU in RUN, then go online and monitor FB_Main. Test with the machine in a safe state.', 'Download to device (واجهة الـPG/PC وعنوان IP بتاع الـCPU)، حط الـCPU في RUN، وبعدين اعمل Go online وراقب FB_Main. اختبر والماكينة في وضع آمن.'],
      ];
      const ol = h('ol', { class: 'scl-steps' }); for (const s of steps) ol.appendChild(h('li', { text: T(s) }));
      const tb = h('div', { class: 'scl-tags', dir: 'ltr' });
      tb.append(...['Name', 'Logical Address', 'Data Type', 'Comment'].map((x) => h('b', { text: x })));
      for (const t of res.tags) tb.append(h('span', { text: t.name }), h('span', { text: t.addr }), h('span', { text: t.type }), h('span', { class: 'mute', text: t.comment }));
      return [ol,
        h('div', { class: 'row wrap scl-btns' },
          h('button', { class: 'btn sm pri', 'data-dl': 'scl', onclick: files.scl, text: '⤓ ' + T(['Download .scl', 'نزّل .scl']) }),
          h('button', { class: 'btn sm pri', 'data-dl': 'xlsx', onclick: files.xlsx, text: '⤓ ' + T(['Download tags .xlsx', 'نزّل التاجات .xlsx']) }),
          h('button', { class: 'btn sm', 'data-dl': 'csv', onclick: files.csv, text: '⤓ ' + T(['Download tags .csv', 'نزّل التاجات .csv']) })),
        h('p', { class: 'scl-note', text: T(['Not tested on a real TIA Portal install: the files follow the TIA formats (external SCL source, tag table sheet "PLC Tags"). Check the result before you run a machine.', 'ما اتجربش على TIA Portal حقيقي: الملفات ماشية على صيغ TIA (سورس SCL خارجي، وجدول تاجات في شيت "PLC Tags"). راجع النتيجة قبل ما تشغّل ماكينة.']) }),
        h('h4', { text: T(['PLC tags', 'تاجات الـPLC']) + ' (' + res.tags.length + ')' }), tb];
    }
    function render() {
      for (const b of seg.children) b.classList.toggle('on', b.dataset.tab === cur);
      cpuLine.innerHTML = '';
      cpuLine.append(h('span', { class: 'pill', text: res.cpu.text }),
        h('span', { class: 'mute sm', text: ' ' + res.nets + T([' networks, ', ' نتورك، ']) + res.tags.length + T([' tags', ' تاج']) }));
      if (res.beyond.length) cpuLine.append(h('span', { class: 'pill warn', text: T(['Beyond the CPU: ', 'أكبر من الـCPU: ']) + res.beyond.join(', ') }));
      body.innerHTML = '';
      if (cur === 'code') {
        body.append(h('div', { class: 'row wrap scl-btns' },
          h('button', { class: 'btn sm pri', 'data-act': 'copy', onclick: () => copy(res.scl), text: '⧉ ' + T(['Copy', 'انسخ']) }),
          h('button', { class: 'btn sm', 'data-dl': 'scl', onclick: files.scl, text: '⤓ ' + T(['Download .scl', 'نزّل .scl']) }),
          h('span', { class: 'mute sm', text: T(['External source: FB_Main + IDB_Main + OB1 Main.', 'سورس خارجي: FB_Main + IDB_Main + OB1 Main.']) })),
        codeView());
      } else body.append(...tiaView());
      body.appendChild(warnCard());
    }
    convert(); render();
    PX.last = { res: () => res, modal: m };
    return m;
  };
})(typeof window !== 'undefined' ? window : globalThis);
