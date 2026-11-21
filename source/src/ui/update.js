/* Updates: the installed app checks version.json when it opens and when it comes back to the screen.
   A newer build shows a bar with "Update now". The service worker loads the page network-first,
   so a reload always brings the newest version while there is internet. */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T;
  EL.BUILD = EL.BUILD || 'dev';
  const web = () => /^https?:$/.test(location.protocol);
  let shown = false, lastCheck = 0;
  function check(force) {
    if (!web() || shown) return;
    const now = Date.now();
    if (!force && now - lastCheck < 60000) return;
    lastCheck = now;
    fetch('version.json?t=' + now, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => { if (v && typeof v.build === 'string' && v.build !== EL.BUILD && v.build > EL.BUILD) bar(v); })
      .catch(() => {});
  }
  function bar(v) {
    shown = true;
    const note = typeof v.note === 'string' ? v.note.replace(/[<>]/g, '').slice(0, 160) : '';
    const b = h('div', { class: 'upd-bar', role: 'status' },
      h('div', null, h('b', { text: T(['A new version is ready', 'فيه نسخة جديدة جاهزة']) }), note ? h('div', { class: 'mute sm', text: note }) : null),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: () => { b.remove(); }, text: T(['Later', 'بعدين']) }),
        h('button', { class: 'btn pri', onclick: () => { try { EL.bench && EL.bench.save && EL.bench.save(); } catch (e) {} location.reload(); }, text: T(['Update now', 'حدّث دلوقتي']) })));
    document.body.appendChild(b);
  }
  EL.checkUpdate = check;
  g.addEventListener('DOMContentLoaded', () => {
    const brand = document.querySelector('.brand');
    if (brand) brand.title = 'Version ' + EL.BUILD;
    if (!web()) return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').then((reg) => { try { reg.update(); } catch (e) {} setInterval(() => { try { reg.update(); } catch (e) {} }, 30 * 60 * 1000); }).catch(() => {});
    }
    setTimeout(() => check(true), 5000);
    setInterval(() => check(), 30 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    g.addEventListener('online', () => check(true));
  });
})(typeof window !== 'undefined' ? window : globalThis);
