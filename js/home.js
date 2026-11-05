/* Home page only.
   Tool chips: with a mouse the description shows on hover (CSS). On a touch
   screen the first tap shows it and the second tap opens the tool. Escape hides
   an open description on any device. A description that would run past the
   edge of the row is anchored to the chip's right edge, or to the row's left
   edge when neither side fits, so it stays on screen.
   Demo video: the featured figure appears only when its data-video is set. */
(function () {
  var coarse = window.matchMedia ? window.matchMedia('(any-pointer: coarse)').matches : false;
  var wraps = Array.prototype.slice.call(document.querySelectorAll('.tchip-wrap'));

  if (wraps.length) {
    var box = wraps[0].closest('.tool-eras') || document.body;

    function align() {
      var r = box.getBoundingClientRect();
      wraps.forEach(function (w) {
        var tip = w.querySelector('.tchip-tip');
        if (!tip) return;
        var c = w.getBoundingClientRect();
        var tw = tip.offsetWidth; // laid out even while hidden
        w.classList.remove('tip-right');
        tip.style.left = '';
        if (c.left + tw <= r.right + 0.5) return;                       // fits from the chip's left edge
        if (c.right - tw >= r.left - 0.5) { w.classList.add('tip-right'); return; } // fits ending at the chip's right edge
        tip.style.left = (r.left - c.left) + 'px';                        // neither fits, hug the row's left edge
      });
    }
    align();
    var timer = 0;
    window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(align, 120); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(align);

    function closeAll(except) {
      wraps.forEach(function (w) {
        if (w === except) return;
        w.classList.remove('is-open');
        var a = w.querySelector('.tchip');
        if (a && a.hasAttribute('aria-expanded')) a.setAttribute('aria-expanded', 'false');
      });
      if (coarse) {
        var active = document.activeElement;
        if (active && active.closest && active.closest('.tchip-wrap') && active.closest('.tchip-wrap') !== except) active.blur();
      }
    }

    // Escape hides the description that hover or focus is showing, until the
    // pointer leaves the chip or focus moves on.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeAll();
      wraps.forEach(function (w) {
        if (w.contains(document.activeElement) || (w.matches && w.matches(':hover'))) w.classList.add('tip-off');
      });
    });
    wraps.forEach(function (w) {
      w.addEventListener('mouseleave', function () { w.classList.remove('tip-off'); });
      w.addEventListener('focusout', function (e) { if (!w.contains(e.relatedTarget)) w.classList.remove('tip-off'); });
    });

    if (coarse) {
      wraps.forEach(function (w) {
        var a = w.querySelector('.tchip');
        var tip = w.querySelector('.tchip-tip');
        if (!a) return;
        a.setAttribute('aria-expanded', 'false');
        a.addEventListener('click', function (e) {
          if (w.classList.contains('is-open')) return; // second tap follows the link
          e.preventDefault();
          closeAll(w);
          w.classList.remove('tip-off');
          w.classList.add('is-open');
          a.setAttribute('aria-expanded', 'true');
        });
        if (tip) tip.addEventListener('click', function () { if (w.classList.contains('is-open')) a.click(); });
      });
      document.addEventListener('click', function (e) {
        if (!(e.target.closest && e.target.closest('.tchip-wrap'))) closeAll();
      });
    }
  }

  var fig = document.querySelector('.case-video');
  if (fig && fig.getAttribute('data-video')) {
    var video = fig.querySelector('video');
    if (video) {
      video.src = fig.getAttribute('data-video');
      var poster = fig.getAttribute('data-poster');
      if (poster) video.poster = poster;
    }
    fig.hidden = false;
    var block = fig.closest('.case');
    if (block) block.classList.add('has-video');
  }
})();
