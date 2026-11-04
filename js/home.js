/* Home page only.
   Tool chips: with a mouse the description shows on hover (CSS). On a touch
   screen the first tap shows it and the second tap opens the tool. Chips on the
   right half of the row open their description to the left so it stays on screen.
   Demo video: the featured figure appears only when its data-video is set. */
(function () {
  var coarse = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
  var wraps = Array.prototype.slice.call(document.querySelectorAll('.tchip-wrap'));

  if (wraps.length) {
    var box = wraps[0].closest('.tool-eras') || document.body;

    function align() {
      var r = box.getBoundingClientRect();
      var mid = r.left + r.width / 2;
      wraps.forEach(function (w) {
        var c = w.getBoundingClientRect();
        w.classList.toggle('tip-right', c.left + c.width / 2 > mid);
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
        if (a) a.setAttribute('aria-expanded', 'false');
      });
      var active = document.activeElement;
      if (active && active.closest && active.closest('.tchip-wrap') && active.closest('.tchip-wrap') !== except) active.blur();
    }

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
          w.classList.add('is-open');
          a.setAttribute('aria-expanded', 'true');
        });
        if (tip) tip.addEventListener('click', function () { a.click(); });
      });
      document.addEventListener('click', function (e) {
        if (!(e.target.closest && e.target.closest('.tchip-wrap'))) closeAll();
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
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
