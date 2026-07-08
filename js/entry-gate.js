// Page Zero entry gate: hands-together animation on click/tap, skip link,
// and a Replay intro button on the homepage. See BUILD-cosmikwork-entry-gate.md.
(function () {
  var GATE_KEY = 'cosmikwork_intro_seen';

  var gate = document.getElementById('entryGate');
  var replayBtn = document.getElementById('gateReplay');
  var mainContent = document.getElementById('mainContent');

  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function focusMain() {
    if (mainContent) mainContent.focus();
  }

  function closeInstantly(gateEl) {
    gateEl.style.display = 'none';
    try { localStorage.setItem(GATE_KEY, '1'); } catch (e) {}
    focusMain();
  }

  function runAnimation(gateEl) {
    gateEl.classList.add('gate-active');
    setTimeout(function () {
      gateEl.classList.add('gate-burst');
    }, 600);
    setTimeout(function () {
      gateEl.classList.add('gate-closing');
    }, 1000);
    setTimeout(function () {
      gateEl.style.display = 'none';
      gateEl.classList.remove('gate-active', 'gate-burst', 'gate-closing');
      try { localStorage.setItem(GATE_KEY, '1'); } catch (e) {}
      focusMain();
    }, 1800);
  }

  function wireGate(gateEl) {
    var skip = document.getElementById('gateSkip');

    function onEnter(e) {
      if (e.target === skip || (skip && skip.contains(e.target))) return;
      gateEl.removeEventListener('click', onEnter);
      if (reducedMotion) {
        closeInstantly(gateEl);
      } else {
        runAnimation(gateEl);
      }
    }

    gateEl.addEventListener('click', onEnter);

    // The gate div itself isn't in the tab order (no tabindex): keyboard
    // users always reach the site via the focusable Skip link, never the
    // click-anywhere animation path. That's intentional, not an oversight.
    if (skip) {
      skip.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        gateEl.removeEventListener('click', onEnter);
        closeInstantly(gateEl);
      });
    }
  }

  // The inline script at the top of <body> already removed #entryGate if the
  // visitor has seen it before, so only wire it up if it's still present.
  if (gate) {
    if (reducedMotion) {
      // Reduced motion: skip the gate entirely, no animation, straight to homepage.
      closeInstantly(gate);
    } else {
      wireGate(gate);
    }
  }

  if (replayBtn) {
    replayBtn.addEventListener('click', function () {
      try { localStorage.removeItem(GATE_KEY); } catch (e) {}

      var existing = document.getElementById('entryGate');
      if (existing) {
        existing.style.display = '';
        existing.classList.remove('gate-active', 'gate-burst', 'gate-closing');
        wireGate(existing);
        existing.querySelector('.gate-skip').focus();
      }
      // If the gate node was removed entirely (repeat-visitor case before
      // this click), reload so the static markup is present again ~ the
      // spec allows either approach and this is the simpler of the two.
      else {
        location.reload();
      }
    });
  }
})();
