French Spelling Quiz
====================

A self-contained (no build, no server) web app that quizzes you on the
spelling of frequent French words: it shows an English word, you type the
French word, correct entries lock instantly, and accents are optional
(repete is accepted for répété, and the correctly accented spelling is shown
back to you when you lock the cell).

- Word list: the ~13,900 most frequent French lemmas (Lexique383) with
  translations from WikDict/Wiktionary, ~2,830 verbs (always shown/expected
  as "<to verb>", including 150 most common reflexive verbs).
- Timer with extend-a-minute or give-up modals; results table highlights
  correct / wrong / unanswered rows and always shows the right spelling.
- Configurable word count, duration and word type (All / Verbs).

Run: open `index.html` in a browser (or `python3 -m http.server`).

Data licensing: the word list is derived from CC BY-SA datasets — see
`CREDITS.md`. Code is MIT (see `LICENSE`).

The scripts in `data-pipeline/` regenerate `data.js` (see `data-pipeline/README.md`).
Tests: `node test-core.js`.
