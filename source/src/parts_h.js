/* Parts H: 3-wire 0-10 V transmitter (level, pressure, temperature) for PLC analog inputs */
(function (g) {
  const EL = g.EL;
  const { P, INT, Z, VS } = EL;
  const D = EL.defs;
  const T = EL.T, pin = EL.mkpin;
  const wl = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="wl"/>`;
  D.TXV = {
    cat: 'field', prefix: 'B', name: ['Transmitter 0-10 V (3-wire)', 'ترانسميتر 0-10 فولت (3 سلك)'], w: 100, h: 110,
    info: ['3-wire transmitter: +24 V and 0 V supply it, OUT gives 0-10 V for 0-100 % of its range. Wire OUT to a PLC analog input (AI0 reads it as IW64, 0-27648). Link it to a tank or a line in the Plant view so the value follows the process.', 'ترانسميتر 3 سلك: +24 و0 فولت بيغذوه، وOUT بيطلع 0-10 فولت لـ0-100% من المدى. وصّل OUT على مدخل أنالوج في الـPLC (AI0 بيقراه IW64 من 0 لـ27648). اربطه بتانك أو خط في شاشة العملية عشان القيمة تمشي مع العملية.'],
    pins: [pin('pos', '+24V', 20, 110, 'd', { role: 'pos' }), pin('com', '0V', 50, 110, 'd', { role: 'neg' }), pin('out', 'OUT', 80, 110, 'd')],
    props: [
      { k: 'kind', label: ['Measures', 'بيقيس'], t: 'sel', opts: [['level', 'Level'], ['press', 'Pressure'], ['temp', 'Temperature']], def: 'level' },
      { k: 'proc', label: ['Process value (%)', 'قيمة العملية (%)'], t: 'num', min: 0, max: 100, step: 1, def: 50 },
    ],
    faults: [['none', ['None', 'سليم']], ['dead', ['Dead (0 V out)', 'ميت (0 فولت)']], ['high', ['Stuck at 10 V', 'ثابت على 10 فولت']]],
    diag: { kind: 'sensor' }, electronic: true,
    init(p) { p.state = { sup: false, vout: 0 }; },
    elements(p, ctx) {
      if (ctx && ctx.dead) return [];
      const out = [Z(P(p, 'pos'), P(p, 'com'), 1200, 0, { tag: 'sup', noAC: true })];
      const st = p.state;
      let v = 10 * Math.max(0, Math.min(100, +p.props.proc || 0)) / 100;
      if (p.fault === 'dead') v = 0; if (p.fault === 'high') v = 10;
      if (st.sup && v > 0.005) out.push(VS(P(p, 'com'), INT(p, 'o'), { vdc: v, tag: 'o' }), Z(INT(p, 'o'), P(p, 'out'), 100, 0, { tag: 'oz' }));
      else out.push(Z(P(p, 'out'), P(p, 'com'), 1e5, 0, { tag: 'oz', noAC: true }));
      return out;
    },
    update(p, sim) {
      const r = EL.eRead(sim, p.id, 'sup'), v = r.vdc;
      p.state.vin = v;
      p.state.sup = v >= 15 && v <= 32;
      p.state.vout = p.state.sup ? sim.vdc(P(p, 'out'), P(p, 'com')) : 0;
    },
    draw(p) {
      const st = p.state, k = p.props.kind, u = k === 'press' ? 'P' : k === 'temp' ? 'T' : 'L';
      return wl(20, 110, 20, 90) + wl(50, 110, 50, 90) + wl(80, 110, 80, 90) +
        `<rect x="8" y="10" width="84" height="80" rx="9" fill="#1a2238" stroke="#7b879f" stroke-width="2"/><circle cx="50" cy="10" r="9" fill="#47BFD9" stroke="#0e1626"/>` +
        T(50, 14, u + 'T', 'psub') +
        `<rect x="16" y="26" width="68" height="24" rx="3" class="lcd"/><text class="lcdt" x="50" y="43" text-anchor="middle" font-size="13">${st.sup ? (+st.vout || 0).toFixed(2) + ' V' : '---'}</text>` +
        T(50, 66, Math.round(+p.props.proc) + ' %', 'pbtn') + T(50, 82, '0-10 V', 'psub');
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
