# Data credits & licensing

`data.js` (the quiz word list) is a merged, adapted dataset built from the two
sources below. It is a derived work and is therefore distributed under the
**Creative Commons Attribution-ShareAlike 4.0 International License
(CC BY-SA 4.0)**, carried forward from both sources. The application code is
separately MIT-licensed (see `LICENSE`).

## Lexique383 (French lemmas, POS tags, word frequencies)

- Source: <http://www.lexique.org> — © Boris New, Christophe Pallier,
  Marc Brysbaert, Ludovic Ferrand.
- License: CC BY-SA 4.0.
- How used: which words exist, their grammatical category (verbs vs nouns…),
  and frequency ranking for selection.
- Please cite:
  - New, B., Pallier, C., Brysbaert, M., & Ferrand, L. (2004). *Lexique 2:
    A new French lexical database.* Behavior Research Methods, Instruments,
    & Computers, 36(3), 516–524.
  - New, B., Brysbaert, M., Veronis, J., & Pallier, C. (2007). *The use of
    film subtitles to estimate word frequencies.* Applied Psycholinguistics,
    28(4), 661–677.

## WikDict fr–en / Wiktionary (English translations & French sense definitions)

- Source: <https://www.wikdict.com> (fr-en SQLite dump, 2025-11 edition),
  built from Wiktionary; © WikDict contributors and Wiktionary contributors.
- License: Creative Commons Attribution-ShareAlike (as applied by WikDict;
  Wiktionary text is dual-licensed CC BY-SA / GFDL — the CC BY-SA option is
  the one followed here).
- How used: English translations of the French words, disambiguation hints
  (English style qualifiers such as "informal"/"dated" and French sense
  definitions in parentheses), and the reflexive verb list.
- Changes made: senses reordered/pruned, translations reformatted
  (verbs prefixed with "to "), French sense definitions truncated, and a small
  number of entries dropped or corrected by hand.

## Obligations carried by CC BY-SA

If you reuse the dataset (`data.js`) you must (1) attribute the sources above,
(2) license your derived database under a compatible ShareAlike license, and
(3) indicate changes you made to it.
