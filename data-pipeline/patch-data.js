// patch-data.js — one-shot data-quality pass over data.js.
// Run: node data-pipeline/patch-data.js
// Reads ../data.js, applies overrides / drops / twin-merging, writes it back.
// Idempotent: safe to re-run.
'use strict';
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data.js');

// Hand-checked closed-class / function-word primaries (WikDict score ranking
// picks a wrong sense for these high-frequency words).
const OVERRIDE = {
  de: 'of', du: 'of the', des: 'of the', pas: 'not', ne: 'not',
  en: 'in', dans: 'in', sur: 'on', avec: 'with', sans: 'without',
  ou: 'or', mais: 'but', et: 'and', car: 'because', donc: 'so', ni: 'nor', or: 'or',
  que: 'that', qui: 'who', quoi: 'what', dont: 'whose', où: 'where',
  quand: 'when', comment: 'how', pourquoi: 'why', combien: 'how much',
  ça: 'it', est: 'is', a: 'has', pouvoir: 'to be able', plus: 'more', moins: 'less',
  très: 'very', bien: 'well', mal: 'badly', ici: 'here', voilà: 'here is',
  alors: 'then', ainsi: 'thus', tout: 'all', tous: 'all', rien: 'nothing',
  quelque: 'some', chaque: 'each', même: 'same', autre: 'other',
  autour: 'around', rejoindre: 'to rejoin', virer: 'to transfer',
  dîner: 'to dine', fier: 'to rely on',
};

// Entries that are pure noise (MT noun-junk with no usable sense).
const DROP = new Set(['dealer', 'ficher', 'coltiner', 'sataner', 'gaber', 'tringler', 'vouvoyer', 'gauler', 'banner']);

const STYLE = new Set(['dated', 'informal', 'slang', 'pejorative', 'literary', 'figurative', 'euphemism', 'ironic', 'vulgar', 'formal', 'colloquial']);
const stripHint = e => e.replace(/\s*\([^)]*\)\s*$/, '');
const hintOf = e => { const m = e.match(/\(([^)]*)\)\s*$/); return m ? m[1] : null; };

function main() {
  const src = fs.readFileSync(DATA, 'utf8');
  const words = JSON.parse(src.slice(src.indexOf('=') + 1).replace(/;\s*$/, ''));

  // 1. drop junk, 2. overrides, 3. strip internal vcands field
  let items = words.filter(x => !DROP.has(x.fr));
  for (const it of items) {
    if (OVERRIDE[it.fr]) it.en = OVERRIDE[it.fr];
    delete it.vcands;
  }

  // 4. merge same-English twins into one row with multiple accepted French
  //    answers (alt). Style-qualified rows (informal/dated/…) stay separate.
  //    Existing alt members are re-expanded so re-running is idempotent.
  const expanded = [];
  for (const it of items) {
    const hint = hintOf(it.en);
    const base = stripHint(it.en).trim();
    expanded.push({ fr: it.fr, en: base, hint, freq: it.freq || 0, pos: it.pos, style: STYLE.has(hint) });
    for (const a of (it.alt || [])) expanded.push({ fr: a, en: base, hint, freq: -1, pos: it.pos, style: STYLE.has(hint) });
    delete it.alt;
  }
  const groups = new Map();
  for (const it of expanded) {
    const key = (it.style ? it.en + ' [' + it.hint + ']' : it.en).toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(it);
  }
  const merged = [];
  let altCount = 0;
  for (const g of groups.values()) {
    g.sort((a, b) => (b.freq || 0) - (a.freq || 0));
    const head = g[0];
    const row = { fr: head.fr, en: head.style ? head.en + ' (' + head.hint + ')' : head.en, pos: head.pos, freq: head.freq };
    if (g.length > 1) {
      const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[œæ]/g, c => c === 'œ' ? 'oe' : 'ae').replace(/[\s'’-]/g, '');
      row.alt = g.slice(1).map(x => x.fr).filter(a => norm(a) !== norm(head.fr));
      if (!row.alt.length) delete row.alt;
      else altCount += row.alt.length;
    }
    merged.push(row);
  }
  merged.sort((a, b) => (b.freq || 0) - (a.freq || 0));

  // 5. hint polish: nothing left except style hints, which are already clean.

  const header =
    '// Word list based on Lexique383 (http://www.lexique.org) + WikDict/Wiktionary fr-en (http://www.wikdict.com),\n' +
    '// both CC BY-SA 4.0 — see CREDITS.md. Derived work, licensed CC BY-SA 4.0.\n' +
    '// Verbs as "to <verb>". Rows sharing an English prompt accept all listed French spellings\n' +
    '// (item.alt). Same-word pairs kept intentionally. Regenerate/patch via data-pipeline/patch-data.js.\n';
  fs.writeFileSync(DATA, header + 'window.QUIZ_WORDS = ' + JSON.stringify(merged) + ';\n');
  console.log('entries:', merged.length, '(was', words.length + ') | merged away:', altCount, '| alts on rows:', merged.filter(x => x.alt).length);
}
main();
