# Data pipeline

`data.js` is generated from two CC BY-SA sources (see `../CREDITS.md`):

- **Lexique383** (http://www.lexique.org, TSV) — French lemmas, POS tags,
  frequencies. Provides the word pool and the verb/noun split.
- **WikDict fr–en SQLite dump** (download.wikdict.com/dictionaries/sqlite/,
  e.g. `2_2025-11/fr-en.sqlite3`) — English translations and French sense
  definitions. Provides translations, style qualifiers, disambiguation hints,
  and the reflexive-verb list (`simple_translation` where written_rep starts
  with "se "/"s'").

Build steps (historical, run in /tmp with the sources above):

1. Rank Lexique383 lemmas by frequency → candidate French words (POS
   blacklist for names/onomatopoeia only).
2. Batch machine-translate to English (Google gtx) → initial prompts.
3. Re-translate all VER/AUX entries with a "to " prefix.
4. Rebuild prompts from WikDict: numbered senses ordered by WikDict `score`;
   verbs additionally verified against verb senses (French gloss starts with a
   known Lexique VER infinitive), with root-link and MT fallbacks; closed-class
   words (articles, pronouns, core prepositions/conjunctions) overridden by
   hand; same-English collisions annotated with style/definition hints;
   150 most common reflexive verbs added.
5. `patch-data.js` (this directory, committed): drops junk entries, applies the
   hand-checked OVERRIDE map for high-frequency function words, strips internal
   fields, and merges same-English rows into one row with `alt` (multiple
   accepted French spellings). Idempotent — safe to re-run:

   ```
   node data-pipeline/patch-data.js
   ```

Note: steps 1–4 scripts were session scratch files and are not committed; the
committed `patch-data.js` plus the source descriptions above are the
reproducible record of the final transformations. If the dataset is ever
regenerated from scratch, re-run steps 1–4 and then `patch-data.js`.
