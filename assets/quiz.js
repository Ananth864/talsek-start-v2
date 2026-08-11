/* =========================================================================
   TanStack Start lessons — reusable quiz widget
   A reusable component (assets/quiz.js). Any lesson can drop in a quiz with
   immediate feedback + score, without duplicating code.

   Usage (inside any lesson HTML):

     <div class="quiz" data-quiz>
       <p class="quiz__title">Check your understanding</p>
       <script type="application/json" data-questions>
         [
           {
             "q":   "Where does this code run?",
             "code":"const x = process.env.SECRET",
             "options": ["Server", "Client", "Both"],
             "answer": 2,
             "explain": "By default code is isomorphic — this leaks to the client bundle."
           }
         ]
       </script>
     </div>
     <script src="../assets/quiz.js" defer></script>

   - `code` is optional (renders a <pre> under the question).
   - `options` should be the SAME set for every question in a quiz so that no
     option is visibly longer/different — i.e. no clue through formatting.
   - The widget handles: answer selection, correct/wrong highlighting,
     explanation reveal, next-question, final score, and retry.
   ========================================================================= */
(function () {
  'use strict';

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function render(root, title, questions) {
    const state = { idx: 0, score: 0, answered: false };

    const progress = el('div', 'quiz__progress');
    const qText = el('p', 'quiz__q');
    const qCode = el('pre', 'quiz__code');
    qCode.style.display = 'none';
    const optionsWrap = el('div', 'quiz__options');
    const feedback = el('div', 'quiz__feedback');
    const actions = el('div', 'quiz__actions');
    const nextBtn = el('button', 'quiz__btn', 'Check answer');
    nextBtn.disabled = true;
    const scoreNode = el('span', 'quiz__score');
    actions.appendChild(nextBtn);
    actions.appendChild(scoreNode);

    function paintQuestion() {
      const q = questions[state.idx];
      state.answered = false;
      progress.textContent = 'Question ' + (state.idx + 1) + ' of ' + questions.length;
      qText.textContent = q.q;

      optionsWrap.innerHTML = '';
      if (q.code) {
        qCode.innerHTML = '<code>' + escapeHtml(q.code) + '</code>';
        qCode.style.display = 'block';
      } else {
        qCode.style.display = 'none';
      }

      let chosen = null;
      q.options.forEach((opt, i) => {
        const b = el('button', null, escapeHtml(opt));
        b.addEventListener('click', function () {
          if (state.answered) return;
          chosen = i;
          Array.prototype.forEach.call(optionsWrap.children, function (c) {
            c.classList.remove('is-picked');
          });
          b.classList.add('is-picked');
          b.style.borderColor = 'var(--accent)';
          b.style.background = 'var(--accent-soft)';
          nextBtn.disabled = false;
        });
        optionsWrap.appendChild(b);
      });

      feedback.innerHTML = '';
      nextBtn.textContent = 'Check answer';
      nextBtn.disabled = true;
      scoreNode.textContent = 'Score: ' + state.score + ' / ' + questions.length;

      nextBtn.onclick = function () {
        if (state.answered) {
          // advance
          state.idx += 1;
          if (state.idx >= questions.length) {
            paintDone();
          } else {
            paintQuestion();
          }
          return;
        }
        if (chosen == null) return;
        state.answered = true;
        const correct = chosen === q.answer;
        if (correct) state.score += 1;

        Array.prototype.forEach.call(optionsWrap.children, function (c, i) {
          c.style.borderColor = '';
          c.style.background = '';
          c.classList.remove('is-picked');
          c.disabled = true;
          if (i === q.answer) c.classList.add('is-correct');
          else if (i === chosen) c.classList.add('is-wrong');
        });

        feedback.innerHTML =
          (correct
            ? '<strong>Correct.</strong> '
            : '<strong>Not quite.</strong> ') +
          escapeHtml(q.explain || '');
        scoreNode.textContent = 'Score: ' + state.score + ' / ' + questions.length;
        nextBtn.textContent =
          state.idx + 1 >= questions.length ? 'See results' : 'Next question';
        nextBtn.disabled = false;
      };
    }

    function paintDone() {
      root.innerHTML = '';
      const done = el('div', 'quiz__done');
      const pct = Math.round((state.score / questions.length) * 100);
      let verdict = 'Keep going — re-read and try again.';
      if (pct === 100) verdict = 'Flawless. You have the model down.';
      else if (pct >= 60) verdict = 'Solid — a couple of edges to tighten.';
      done.appendChild(el('p', 'quiz__title', escapeHtml(title || 'Complete')));
      done.appendChild(
        el('p', 'quiz__score',
          '<b>' + state.score + ' / ' + questions.length + '</b> &middot; ' + pct + '%')
      );
      done.appendChild(el('p', '', escapeHtml(verdict)));
      const retry = el('button', 'quiz__btn', 'Try again');
      retry.addEventListener('click', function () {
        state.idx = 0;
        state.score = 0;
        root.innerHTML = '';
        build();
      });
      done.appendChild(retry);
      root.appendChild(done);
    }

    function build() {
      if (title) root.appendChild(el('p', 'quiz__title', escapeHtml(title)));
      root.appendChild(progress);
      root.appendChild(qText);
      root.appendChild(qCode);
      root.appendChild(optionsWrap);
      root.appendChild(feedback);
      root.appendChild(actions);
      paintQuestion();
    }

    build();
  }

  function init() {
    const nodes = document.querySelectorAll('[data-quiz]');
    nodes.forEach(function (node) {
      const script = node.querySelector('script[data-questions]');
      if (!script) return;
      let data;
      try {
        data = JSON.parse(script.textContent);
      } catch (e) {
        node.innerHTML = '<p class="quiz__feedback"><strong>Quiz error:</strong> ' +
          escapeHtml(e.message) + '</p>';
        return;
      }
      if (!Array.isArray(data) || data.length === 0) return;
      const title = node.getAttribute('data-title') || 'Check your understanding';
      // clear the placeholder script, then render fresh
      node.innerHTML = '';
      render(node, title, data);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
