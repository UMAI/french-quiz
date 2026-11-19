(function () {
  'use strict';

  var C = window.QuizCore;
  var WORDS = window.QUIZ_WORDS || [];

  // Elements
  var elStart = document.getElementById('start-screen');
  var elQuiz = document.getElementById('quiz-screen');
  var elResults = document.getElementById('results-screen');
  var elProgress = document.getElementById('stat-progress');
  var elTimer = document.getElementById('stat-timer');
  var elGrid = document.getElementById('quiz-grid');
  var elResultsGrid = document.getElementById('results-grid');
  var elResultsSummary = document.getElementById('results-summary');
  var elDataInfo = document.getElementById('data-info');
  var elType = document.getElementById('setting-type');
  var modalTimeup = document.getElementById('modal-timeup');
  var modalGiveup = document.getElementById('modal-giveup');

  var state = {
    items: [],
    answers: [],
    inputs: [],
    deadline: 0,
    timerId: null,
    active: false,
    initialSeconds: 600,
  };

  // ---- Screens -------------------------------------------------------------

  function show(screen) {
    [elStart, elQuiz, elResults].forEach(function (s) { s.classList.add('hidden'); });
    screen.classList.remove('hidden');
  }

  // ---- Quiz build ----------------------------------------------------------

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function isVerbEntry(w) { return /^(VER|AUX)\b/.test(w.pos); }

  function pickPool() {
    return elType.value === 'verb' ? WORDS.filter(isVerbEntry) : WORDS;
  }

  function updateWordCountInfo() {
    var pool = pickPool();
    var kind = elType.value === 'verb' ? 'verbs' : 'common French words';
    elDataInfo.textContent = pool.length + ' ' + kind + ' available.';
  }
  elType.addEventListener('change', updateWordCountInfo);
  updateWordCountInfo();

  function startQuiz() {
    var pool = pickPool();
    var hi = Math.min(500, pool.length);
    if (hi < 1) return; // empty selection, don't start
    var n = clamp(parseInt(document.getElementById('setting-words').value, 10) || 100, Math.min(5, hi), hi);
    var minutes = clamp(parseInt(document.getElementById('setting-minutes').value, 10) || 10, 1, 120);
    state.items = C.pickRandom(pool, n);
    state.answers = new Array(n).fill('');
    state.inputs = [];
    state.initialSeconds = minutes * 60;
    state.deadline = Date.now() + state.initialSeconds * 1000;
    state.active = true;

    buildQuizGrid(state.items);
    updateProgress();
    show(elQuiz);
    startTimer();
    focusFirstUnanswered();
  }

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function buildQuizGrid(items) {
    var perCol = Math.max(10, Math.ceil(items.length / 4));
    var cols = C.makeColumns(items, perCol);
    elGrid.textContent = '';
    state.inputs = new Array(items.length).fill(null);

    cols.forEach(function (colItems) {
      var table = document.createElement('table');
      table.className = 'wrap-table';
      var head = document.createElement('tr');
      head.innerHTML = '<th class="num">#</th><th>English</th><th>French</th>';
      table.appendChild(head);
      colItems.forEach(function (item) {
        var idx = items.indexOf(item); // items are unique objects, safe
        var tr = document.createElement('tr');
        tr.dataset.index = idx;

        var tdNum = document.createElement('td');
        tdNum.className = 'num';
        tdNum.textContent = idx + 1;

        var tdEn = document.createElement('td');
        tdEn.className = 'english';
        tdEn.textContent = item.en;

        var tdFr = document.createElement('td');
        var input = document.createElement('input');
        input.type = 'text';
        input.autocomplete = 'off';
        input.autocapitalize = 'off';
        input.spellcheck = false;
        input.dataset.index = idx;
        input.setAttribute('aria-label', 'French for ' + item.en);
        input.addEventListener('input', onType);
        input.addEventListener('keydown', onKeydown);
        input.addEventListener('focus', function () { markCurrent(idx); });
        tdFr.appendChild(input);

        tr.appendChild(tdNum);
        tr.appendChild(tdEn);
        tr.appendChild(tdFr);
        table.appendChild(tr);
        state.inputs[idx] = { input: input, row: tr };
      });
      elGrid.appendChild(table);
    });
  }

  // ---- Input handling ------------------------------------------------------

  function onType(e) {
    var idx = +e.target.dataset.index;
    var val = e.target.value;
    state.answers[idx] = val;
    var cell = state.inputs[idx];

    // Live check: lock the cell green as soon as the word matches (no Enter needed).
    if (C.isCorrect(val, state.items[idx].fr, state.items[idx].alt)) {
      lockCell(cell, state.items[idx].fr);
      updateProgress();
      var next = nextUnansweredAfter(idx);
      if (next === -1) next = nextUnansweredAfter(-1);
      if (next !== -1) state.inputs[next].input.focus();
      if (allAnswered()) finishQuiz();
      return;
    }

    updateProgress();
    if (state.active && allAnswered()) finishQuiz();
  }

  function lockCell(cell, word) {
    cell.locked = true;
    cell.input.classList.add('locked');
    // Accept the answer but show the correct accents when they were missed.
    if (word && cell.input.value !== word) {
      cell.input.value = word;
      cell.input.classList.add('autofixed');
    }
    cell.input.disabled = true;
    cell.row.classList.remove('current');
    cell.row.classList.add('ok');
  }

  function onKeydown(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    var idx = +e.target.dataset.index;
    var next = nextUnansweredAfter(idx);
    if (next === -1) next = nextUnansweredAfter(-1);
    if (next !== -1) state.inputs[next].input.focus();
  }

  function nextUnansweredAfter(idx) {
    for (var i = idx + 1; i < state.answers.length; i++) {
      if (!state.answers[i].trim()) return i;
    }
    return -1;
  }

  function allAnswered() {
    return state.answers.every(function (a) { return a.trim().length > 0; });
  }

  function markCurrent(idx) {
    state.inputs.forEach(function (cell) { cell.row.classList.remove('current'); });
    state.inputs[idx].row.classList.add('current');
  }

  function focusFirstUnanswered() {
    var i = nextUnansweredAfter(-1);
    if (i !== -1) state.inputs[i].input.focus();
  }

  function updateProgress() {
    var done = state.answers.filter(function (a) { return a.trim().length > 0; }).length;
    elProgress.textContent = done + ' / ' + state.answers.length;
  }

  // ---- Timer ---------------------------------------------------------------

  function startTimer() {
    stopTimer();
    modalTimeup.classList.add('hidden');
    setInputsEnabled(true);
    elTimer.classList.remove('low');
    state.timerId = setInterval(tick, 250);
    tick();
  }

  function stopTimer() {
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
  }

  function secondsLeft() {
    return Math.round((state.deadline - Date.now()) / 1000);
  }

  function tick() {
    if (!state.active) { stopTimer(); return; }
    var left = secondsLeft();
    elTimer.textContent = C.formatTime(left);
    if (left <= 60) elTimer.classList.add('low');
    if (left <= 0) {
      stopTimer();
      setInputsEnabled(false);
      modalTimeup.classList.remove('hidden');
    }
  }

  function extendOneMinute() {
    state.deadline += 60 * 1000;
    startTimer();
  }

  function setInputsEnabled(enabled) {
    state.inputs.forEach(function (cell) {
      // Locked (already solved) cells stay locked.
      cell.input.disabled = !enabled || cell.locked;
    });
  }

  // ---- Finish / results ----------------------------------------------------

  function finishQuiz() {
    state.active = false;
    stopTimer();
    setInputsEnabled(false);
    modalTimeup.classList.add('hidden');
    modalGiveup.classList.add('hidden');
    renderResults();
    show(elResults);
  }

  function renderResults() {
    var rowResults = C.grade(state.items, state.answers);
    var score = rowResults.filter(function (r) { return r.correct; }).length;
    var unanswered = rowResults.filter(function (r) { return !r.answered; }).length;
    var total = state.items.length;
    var minutes = Math.round(state.initialSeconds / 60);

    document.getElementById('results-title').textContent =
      score === total ? 'Perfect!' : 'Results';
    elResultsSummary.textContent =
      'Score: ' + score + ' / ' + total +
      (unanswered > 0 ? '  —  ' + unanswered + ' word' + (unanswered === 1 ? '' : 's') + ' left unanswered (spelling shown below)' : '') +
      '  —  ' + minutes + ' min' + (minutes === 1 ? '' : 's');

    var perCol = Math.max(10, Math.ceil(rowResults.length / 4));
    var cols = C.makeColumns(rowResults, perCol);
    elResultsGrid.textContent = '';

    cols.forEach(function (col) {
      var table = document.createElement('table');
      table.className = 'wrap-table';
      var head = document.createElement('tr');
      head.innerHTML = '<th class="num">#</th><th>English</th><th>Your answer</th><th>French</th>';
      table.appendChild(head);
      col.forEach(function (r) {
        var idx = rowResults.indexOf(r);
        var tr = document.createElement('tr');
        tr.className = r.correct ? 'ok' : (r.answered ? 'bad' : 'unanswered');

        var tdNum = document.createElement('td');
        tdNum.className = 'num';
        tdNum.textContent = idx + 1;

        var tdEn = document.createElement('td');
        tdEn.textContent = r.item.en;

        var tdGiven = document.createElement('td');
        if (r.answered) {
          tdGiven.textContent = r.given;
          tdGiven.className = 'answer-given';
        }

        var tdFr = document.createElement('td');
        tdFr.className = 'answer-fr';
        tdFr.textContent = r.item.alt && r.item.alt.length
          ? r.item.fr + ' / ' + r.item.alt.join(' / ')
          : r.item.fr;

        tr.appendChild(tdNum);
        tr.appendChild(tdEn);
        tr.appendChild(tdGiven);
        tr.appendChild(tdFr);
        table.appendChild(tr);
      });
      elResultsGrid.appendChild(table);
    });
  }

  // ---- Wiring --------------------------------------------------------------

  document.getElementById('btn-start').addEventListener('click', startQuiz);
  document.getElementById('btn-giveup').addEventListener('click', function () {
    modalGiveup.classList.remove('hidden');
  });
  document.getElementById('btn-giveup-yes').addEventListener('click', finishQuiz);
  document.getElementById('btn-giveup-no').addEventListener('click', function () {
    modalGiveup.classList.add('hidden');
  });
  document.getElementById('btn-giveup-modal').addEventListener('click', finishQuiz);
  document.getElementById('btn-extend').addEventListener('click', extendOneMinute);
  document.getElementById('btn-again').addEventListener('click', startQuiz);
})();
