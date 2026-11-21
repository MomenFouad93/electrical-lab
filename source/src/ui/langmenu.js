/* Language menu: globe button in the header, list of the languages of all the plants */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui;
  let menu = null, btn = null;
  const tick = () => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'lcheck'); s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', 'M5 12.5l4.5 4.5L19 7.5'); s.appendChild(p);
    return s;
  };
  function close(focusBtn) {
    if (!menu) return;
    menu.remove(); menu = null;
    document.removeEventListener('pointerdown', onOut, true);
    document.removeEventListener('keydown', onKey, true);
    g.removeEventListener('resize', close);
    if (btn) { btn.setAttribute('aria-expanded', 'false'); if (focusBtn) btn.focus(); }
  }
  function onOut(e) { if (menu && !menu.contains(e.target) && !btn.contains(e.target)) close(); }
  function onKey(e) {
    if (!menu) return;
    if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const items = [...menu.querySelectorAll('button')], i = items.indexOf(document.activeElement);
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
    }
  }
  function open() {
    if (menu) { close(); return; }
    menu = h('div', { class: 'lmenu', role: 'listbox', 'aria-label': EL.tr(['Language', 'اللغة']) });
    for (const l of EL.langs) {
      const sel = l.c === EL.lang;
      const b = h('button', { type: 'button', role: 'option', 'aria-selected': sel ? 'true' : 'false', lang: l.bcp, dir: l.rtl ? 'rtl' : 'ltr', onclick: () => { close(true); ui.setLang(l.c); } },
        h('span', { text: l.n }), sel ? tick() : h('span', { class: 'lcode', text: l.s }));
      menu.appendChild(b);
    }
    document.body.appendChild(menu);
    const r = btn.getBoundingClientRect(), w = menu.offsetWidth, vw = document.documentElement.clientWidth;
    let left = EL.isRtl() ? r.left : r.right - w;
    left = Math.max(8, Math.min(left, vw - w - 8));
    menu.style.top = Math.round(r.bottom + 6) + 'px'; menu.style.left = Math.round(left) + 'px';
    btn.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', onOut, true);
    document.addEventListener('keydown', onKey, true);
    g.addEventListener('resize', close);
    const cur = menu.querySelector('[aria-selected=true]') || menu.querySelector('button');
    cur.focus();
  }
  ui.initLangMenu = function (b) {
    btn = b;
    btn.addEventListener('click', open);
    ui.syncLang = () => {
      const li = EL.langInfo();
      const lc = btn.querySelector('.lc'); if (lc) lc.textContent = li.s;
      btn.setAttribute('aria-label', EL.tr(['Language', 'اللغة']) + ': ' + li.n);
      if (menu) close();
    };
    ui.syncLang();
  };
})(typeof window !== 'undefined' ? window : globalThis);
