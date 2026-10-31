/* Starlight. A sparse night sky behind every page. Each star breathes on its own slow period,
   now and then one flares, and on a desktop the cursor is a bow wave the stars ease around. */
(function () {
  var m = window.matchMedia ? function (q) { return window.matchMedia(q).matches; } : function () { return false; };
  var reduce = m('(prefers-reduced-motion: reduce)') || m('(max-width: 767px)'); // still frame on phones, saves battery
  var pointerFine = m('(pointer: fine)');
  var cv = document.createElement('canvas');
  cv.id = 'sky'; cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  var ctx = cv.getContext('2d');
  if (!ctx) { cv.remove(); return; }

  var stars = [], W = 0, H = 0, dpr = 1, raf = 0, last = 0, running = false;
  var pointer = null, REACH = 140, PUSH = 40;
  // real stars are not all the same white
  var TINTS = [[255, 244, 230], [255, 251, 243], [243, 243, 255], [225, 234, 255], [255, 238, 216]];

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!stars.length || Math.abs(stars.length - count()) > stars.length * .3) seed();
    draw(performance.now());
  }
  function count() { return Math.round(W * H / 7000); }
  function seed() {
    stars = [];
    var n = count();
    for (var i = 0; i < n; i++) {
      var u = Math.random();
      // most stars faint and small, a few bright, like a real sky
      var mag = Math.pow(u, 2.6);
      var r = 0.35 + mag * 1.5 + (u > 0.985 ? 0.9 : 0);
      stars.push({
        x: Math.random() * W, y: Math.random() * H, hx: 0, hy: 0, ox: 0, oy: 0,
        r: r, base: 0.18 + mag * 0.72,
        tint: TINTS[Math.floor(Math.random() * TINTS.length)],
        period: 4000 + Math.random() * 8000, phase: Math.random() * Math.PI * 2, amp: 0.1 + Math.random() * 0.22,
        flare: 0, nextFlare: performance.now() + 4000 + Math.random() * 30000,
        dx: (Math.random() - .5) * 0.006, dy: (Math.random() - .5) * 0.006
      });
    }
  }
  function draw(ts) {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = reduce ? 0 : Math.sin(ts / s.period * Math.PI * 2 + s.phase) * s.amp;
      var a = s.base + tw;
      var r = s.r;
      if (s.flare > 0) { a += s.flare * 0.9; r += s.flare * s.r * 1.6; }
      if (a < 0.05) a = 0.05; if (a > 1) a = 1;
      var x = s.x + s.ox, y = s.y + s.oy, t = s.tint;
      if (r > 1.3 || s.flare > 0.1) {
        // halo for the brighter ones
        var g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
        g.addColorStop(0, 'rgba(' + t[0] + ',' + t[1] + ',' + t[2] + ',' + (a * 0.35).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(' + t[0] + ',' + t[1] + ',' + t[2] + ',0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(' + t[0] + ',' + t[1] + ',' + t[2] + ',' + a.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  function step(ts, dt) {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      // very slow drift, wraps at the edges
      s.x += s.dx * dt; s.y += s.dy * dt;
      if (s.x < -4) s.x = W + 4; if (s.x > W + 4) s.x = -4; if (s.y < -4) s.y = H + 4; if (s.y > H + 4) s.y = -4;
      // the occasional flare
      if (s.flare > 0) s.flare = Math.max(0, s.flare - dt / 900);
      else if (ts > s.nextFlare) { s.flare = 1; s.nextFlare = ts + 12000 + Math.random() * 50000; }
      // bow wave around the cursor
      var tx = 0, ty = 0;
      if (pointer) {
        var ddx = s.x - pointer.x, ddy = s.y - pointer.y, d = Math.sqrt(ddx * ddx + ddy * ddy);
        if (d < REACH && d > 0.1) { var k = (1 - d / REACH); k = k * k; tx = ddx / d * PUSH * k; ty = ddy / d * PUSH * k; }
      }
      s.ox += (tx - s.ox) * Math.min(1, 0.08 * dt / 16.67);
      s.oy += (ty - s.oy) * Math.min(1, 0.08 * dt / 16.67);
    }
  }
  function loop(ts) {
    var dt = Math.min(50, ts - last || 16.67); last = ts;
    step(ts, dt); draw(ts);
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!running && !reduce) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); } }
  function stop() { running = false; cancelAnimationFrame(raf); raf = 0; }

  if (pointerFine) {
    window.addEventListener('mousemove', function (e) { pointer = { x: e.clientX, y: e.clientY }; }, { passive: true });
    window.addEventListener('mouseout', function (e) { if (!e.relatedTarget) pointer = null; });
  }
  window.addEventListener('resize', size);
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  size(); start();
})();
