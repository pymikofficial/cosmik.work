/* Lite version of the connected canvas, behind every page. Faint ink dots, almost still, that join up near the cursor. Desktop only. */
(function () {
  if (window.matchMedia && (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 860px)').matches)) return;
  var cv = document.createElement('canvas');
  cv.id = 'bgConnected'; cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  var ctx = cv.getContext('2d');
  var INK = '27, 26, 23', ACCENT = '181, 69, 43';
  var nodes = [], W = 0, H = 0, dpr = 1, pointer = null, raf = 0, last = 0, active = false, idle = 0;
  var REACH = 190, BASE_LINK = 0; /* no links at rest */
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!nodes.length) seed(); draw();
  }
  function seed() {
    nodes = [];
    var count = Math.round((W * H) / 55000); /* about 24 on a laptop, 40 on a big screen */
    for (var i = 0; i < count; i++) nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .08, vy: (Math.random() - .5) * .08, r: 1.2 + Math.random() * .9 });
  }
  function step(dt) {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i], tx = n.x + n.vx * dt, ty = n.y + n.vy * dt;
      if (pointer) { var dx = pointer.x - n.x, dy = pointer.y - n.y, d = Math.hypot(dx, dy); if (d < REACH && d > 1) { var pull = (1 - d / REACH) * .35 * dt; tx += dx / d * pull; ty += dy / d * pull; } }
      if (tx < 0 || tx > W) n.vx *= -1; else n.x = tx;
      if (ty < 0 || ty > H) n.vy *= -1; else n.y = ty;
    }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H); ctx.lineWidth = .7;
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i], nearA = pointer ? Math.hypot(pointer.x - a.x, pointer.y - a.y) : 1e9;
      if (pointer) for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j], nearB = Math.hypot(pointer.x - b.x, pointer.y - b.y), near = Math.min(nearA, nearB);
        if (near >= REACH) continue;
        var d = Math.hypot(a.x - b.x, a.y - b.y), limit = (REACH - near) * 1.2;
        if (d < limit) { ctx.strokeStyle = 'rgba(' + ACCENT + ',' + ((1 - d / limit) * .4).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      ctx.fillStyle = nearA < REACH * .7 ? 'rgba(' + ACCENT + ',.8)' : 'rgba(' + INK + ',.34)';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    }
  }
  function loop(ts) {
    var dt = Math.min(32, ts - last || 16); last = ts;
    step(dt / 16); draw();
    if (!pointer) { idle += dt; if (idle > 2500) { raf = 0; active = false; return; } }
    raf = requestAnimationFrame(loop);
  }
  function wake() { idle = 0; if (!active) { active = true; last = 0; raf = requestAnimationFrame(loop); } }
  window.addEventListener('mousemove', function (e) { pointer = { x: e.clientX, y: e.clientY }; wake(); }, { passive: true });
  window.addEventListener('mouseout', function (e) { if (!e.relatedTarget) pointer = null; });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; active = false; } });
  window.addEventListener('resize', function () { nodes = []; size(); });
  size(); wake();
})();
