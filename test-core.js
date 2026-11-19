// Node tests for quiz-core.js: node test-core.js
const assert = require('assert');
const C = require('./quiz-core.js');

// normalizeAnswer: accents, case, apostrophes, hyphens, spaces
assert.strictEqual(C.normalizeAnswer('  ÉpÉré  '), 'epere');
assert.strictEqual(C.normalizeAnswer('repété'), 'repete');
assert.strictEqual(C.normalizeAnswer('RÉPÉTÉ'), 'repete');
assert.strictEqual(C.normalizeAnswer('aujourd’hui'), 'aujourdhui');
assert.strictEqual(C.normalizeAnswer('aujourd\'hui'), 'aujourdhui');
assert.strictEqual(C.normalizeAnswer('grand-père'), 'grandpere');
assert.strictEqual(C.normalizeAnswer('grand père'), 'grandpere');
assert.strictEqual(C.normalizeAnswer('ŒUF'), 'oeuf');
assert.strictEqual(C.normalizeAnswer('  '), '');

// isCorrect
assert.strictEqual(C.isCorrect('repete', 'répété'), true);
assert.strictEqual(C.isCorrect('  répéTÉ ', 'repete'), true);
assert.strictEqual(C.isCorrect('maison', 'montagne'), false);
assert.strictEqual(C.isCorrect('', 'maison'), false);
assert.strictEqual(C.isCorrect('  ', 'maison'), false);

// isCorrect with alternate accepted spellings (alt list)
assert.strictEqual(C.isCorrect('soulier', 'chaussure', ['soulier', 'godasse']), true);
assert.strictEqual(C.isCorrect('Godasse', 'chaussure', ['soulier', 'godasse']), true);
assert.strictEqual(C.isCorrect('souliers', 'chaussure', ['soulier']), false);
assert.strictEqual(C.isCorrect('soulier', 'chaussure'), false);

// grade honors alt spellings
const itemsAlt = [{ fr: 'chaussure', en: 'shoe', alt: ['soulier'] }, { fr: 'chien', en: 'dog' }];
const ga = C.grade(itemsAlt, ['soulier', 'chien']);
assert.strictEqual(ga[0].correct, true);
assert.strictEqual(ga[1].correct, true);

// shuffle determinism
const seq = [0, 0.5, 0.9, 0.1, 0.3, 0.7, 0.25, 0.75, 0.6, 0.15];
const makeRnd = () => { let c = 0; return () => seq[c++ % seq.length]; };
const a = C.shuffle([1, 2, 3, 4, 5], makeRnd());
assert.strictEqual(JSON.stringify(a), JSON.stringify(C.shuffle([1, 2, 3, 4, 5], makeRnd())));
assert.deepStrictEqual([...a].sort(), [1, 2, 3, 4, 5]);

// pickRandom: count and membership, immutability of source
const pool = Array.from({ length: 100 }, (_, i) => i);
const picked = C.pickRandom(pool, 10);
assert.strictEqual(picked.length, 10);
picked.forEach(p => assert(pool.includes(p)));
assert.strictEqual(pool.length, 100);
assert.deepStrictEqual([...pool].sort((x, y) => x - y), Array.from({ length: 100 }, (_, i) => i));

// no duplicates in pickRandom
assert.strictEqual(new Set(picked).size, 10);

// formatTime
assert.strictEqual(C.formatTime(600), '10:00');
assert.strictEqual(C.formatTime(65), '1:05');
assert.strictEqual(C.formatTime(0), '0:00');
assert.strictEqual(C.formatTime(-5), '0:00');

// grade: answered, unanswered, accent-insensitive scoring
const items = [{ fr: 'chien', en: 'dog' }, { fr: 'répété', en: 'repeated' }, { fr: 'cheval', en: 'horse' }];
const g = C.grade(items, ['chien', 'repetes', '   ']);
assert.strictEqual(g[0].answered && g[0].correct, true);
assert.strictEqual(g[1].answered && !g[1].correct, true);
assert.strictEqual(!g[2].answered && !g[2].correct, true);

// makeColumns
const cols = C.makeColumns(Array.from({ length: 103 }, (_, i) => i), 25);
assert.deepStrictEqual(cols.map(c => c.length), [25, 25, 25, 25, 3]);
const flat = cols.reduce((acc, c) => acc.concat(c), []);
assert.deepStrictEqual(flat, Array.from({ length: 103 }, (_, i) => i));

console.log('All core tests passed.');
