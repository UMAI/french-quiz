// Pure quiz logic — shared between the browser and node tests.
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.QuizCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  // Accent-, case-, apostrophe- and hyphen-insensitive comparison.
  function normalizeAnswer(s) {
    return String(s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/œ/g, 'oe')
      .replace(/æ/g, 'ae')
      .replace(/[’´`]/g, "'")
      .replace(/[\s'’-]/g, '')
      .trim();
  }

  function isCorrect(guess, answer, alts) {
    const g = normalizeAnswer(guess);
    if (!g) return false;
    if (g === normalizeAnswer(answer)) return true;
    if (Array.isArray(alts)) return alts.some(a => g === normalizeAnswer(a));
    return false;
  }

  // Fisher–Yates; rnd is injectable so tests are deterministic.
  function shuffle(arr, rnd) {
    const rng = rnd || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickRandom(words, n) {
    return shuffle(words).slice(0, n);
  }

  function formatTime(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  // Grade the quiz: results[i] = { item, given, answered, correct }
  function grade(items, answers) {
    return items.map((item, i) => {
      const given = (answers[i] || '').trim();
      return {
        item,
        given,
        answered: given.length > 0,
        correct: isCorrect(given, item.fr, item.alt),
      };
    });
  }

  // Split items into columns of `perCol` rows for a wrapped table layout.
  function makeColumns(items, perCol) {
    const cols = [];
    for (let i = 0; i < items.length; i += perCol) cols.push(items.slice(i, i + perCol));
    return cols;
  }

  return { normalizeAnswer, isCorrect, shuffle, pickRandom, formatTime, grade, makeColumns };
});
