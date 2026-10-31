/* Everything is connected. Ink nodes on paper that drift apart and join up where the cursor or finger is. */
(function () {
  var wrap = document.getElementById('connected');
  var cv = document.getElementById('connectedCanvas');
  if (!wrap || !cv || window.__mercury) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var INK = '27, 26, 23', ACCENT = '181, 69, 43';
  var nodes = [], W = 0, H = 0, dpr = 1, pointer = null, raf = 0, last = 0;
  var N = 34, REACH = 170, BASE_LINK = 70;

  function size() {
    var r = wrap.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!nodes.length) seed();
    if (reduce) draw(0);
  }
  function seed() {
    nodes = [];
    var count = W < 600 ? 22 : N;
    for (var i = 0; i < count; i++) {
      nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18, r: 1.6 + Math.random() * 1.4, hx: 0, hy: 0 });
    }
  }
  function step(dt) {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var tx = n.x + n.vx * dt, ty = n.y + n.vy * dt;
      if (pointer) {
        var dx = pointer.x - n.x, dy = pointer.y - n.y, d = Math.hypot(dx, dy);
        if (d < REACH && d > 1) { var pull = (1 - d / REACH) * .06 * dt; tx += dx / d * pull * 4; ty += dy / d * pull * 4; }
      }
      if (tx < 0 || tx > W) n.vx *= -1; else n.x = tx;
      if (ty < 0 || ty > H) n.vy *= -1; else n.y = ty;
    }
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = .8;
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      var nearA = pointer ? Math.hypot(pointer.x - a.x, pointer.y - a.y) : 1e9;
      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j];
        var d = Math.hypot(a.x - b.x, a.y - b.y);
        var nearB = pointer ? Math.hypot(pointer.x - b.x, pointer.y - b.y) : 1e9;
        var near = Math.min(nearA, nearB);
        var limit = near < REACH ? BASE_LINK + (REACH - near) * 1.1 : BASE_LINK;
        if (d < limit) {
          var alpha = (1 - d / limit) * (near < REACH ? .55 : .18);
          ctx.strokeStyle = 'rgba(' + (near < REACH * .6 ? ACCENT : INK) + ',' + alpha.toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (var k = 0; k < nodes.length; k++) {
      var n = nodes[k];
      var nd = pointer ? Math.hypot(pointer.x - n.x, pointer.y - n.y) : 1e9;
      ctx.fillStyle = nd < REACH * .6 ? 'rgba(' + ACCENT + ',.9)' : 'rgba(' + INK + ',.75)';
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    }
  }
  function loop(ts) {
    var dt = Math.min(32, ts - last || 16); last = ts;
    step(dt / 16); draw(ts);
    raf = requestAnimationFrame(loop);
  }
  function setPointer(e) {
    var r = cv.getBoundingClientRect();
    var p = e.touches ? e.touches[0] : e;
    pointer = { x: p.clientX - r.left, y: p.clientY - r.top };
  }
  wrap.addEventListener('mousemove', setPointer);
  wrap.addEventListener('mouseleave', function () { pointer = null; });
  wrap.addEventListener('touchstart', setPointer, { passive: true });
  wrap.addEventListener('touchmove', setPointer, { passive: true });
  wrap.addEventListener('touchend', function () { pointer = null; });
  window.addEventListener('resize', size);
  size();
  if (!reduce) {
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { if (!raf) raf = requestAnimationFrame(loop); } else { cancelAnimationFrame(raf); raf = 0; } });
    }) : null;
    if (io) io.observe(wrap); else raf = requestAnimationFrame(loop);
  }
})();
