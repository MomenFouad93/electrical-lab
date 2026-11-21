/* QA harness shared by qa_*.js */
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const SHOT = '/tmp/claude-0/qa/';
require('fs').mkdirSync(SHOT, { recursive: true });
const results = [];
let fails = 0;
function ok(c, m, extra) { results.push([!!c, m]); if (!c) { fails++; console.log('FAIL', m, extra != null ? '| ' + String(extra).slice(0, 400) : ''); } else console.log('ok  ', m); return !!c; }
async function start(opts = {}) {
  const b = await chromium.launch();
  const ctxOpts = opts.mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, acceptDownloads: true } : { viewport: { width: 1440, height: 900 }, acceptDownloads: true };
  const ctx = await b.newContext(ctxOpts);
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' / ')));
  p.on('dialog', (d) => d.accept());
  await p.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI)); });
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html');
  await p.waitForTimeout(900);
  return { b, ctx, p, errs };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function toasts(p) { return p.evaluate(() => [...document.querySelectorAll('.toast')].map((t) => t.className + '::' + t.textContent)); }
async function clearToasts(p) { await p.evaluate(() => document.querySelectorAll('.toast').forEach((t) => t.remove())); }
async function shot(p, name) { const f = SHOT + name + '.png'; await p.screenshot({ path: f }); return f; }
async function modalCount(p) { return p.evaluate(() => document.querySelectorAll('.modal').length); }
async function closeModals(p) { await p.evaluate(() => document.querySelectorAll('.modal').forEach((m) => m.remove())); }
function summary(errs, p) {
  const e = errs.filter((x) => !/favicon/.test(x));
  ok(!e.length, 'no console/page errors', e.join(' || '));
  console.log(fails ? fails + ' FAILED' : 'ALL OK');
}
module.exports = { start, ok, sleep, toasts, clearToasts, shot, modalCount, closeModals, summary, SHOT, get fails() { return fails; } };
