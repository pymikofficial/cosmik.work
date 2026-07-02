// Shared global starfield ~ used on every page via <canvas id="bgStars">.
// Fixed to the viewport (not the document), so it stays put behind all
// content as the page scrolls. Three depth layers: distant/dim,
// mid/twinkling, near/sparse with a soft glow ~ same treatment everywhere
// for a uniform cosmic background across the whole site.
(function () {
  const canvas = document.getElementById('bgStars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let layers = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function makeLayer(density, rRange, aRange, twinkleRange, drift, glow) {
    const count = Math.floor((canvas.width * canvas.height) / density);
    return {
      glow,
      stars: Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: rRange[0] + Math.random() * (rRange[1] - rRange[0]),
        baseAlpha: aRange[0] + Math.random() * (aRange[1] - aRange[0]),
        twinkleSpeed: twinkleRange[0] + Math.random() * (twinkleRange[1] - twinkleRange[0]),
        phase: Math.random() * Math.PI * 2,
        dx: (Math.random() - 0.5) * drift,
        dy: (Math.random() - 0.5) * drift
      }))
    };
  }

  function makeStars() {
    layers = [
      makeLayer(26000, [0.3, 0.7], [0.08, 0.22], [0.002, 0.006], 0.006, false), // distant, near-static
      makeLayer(12000, [0.5, 1.1], [0.16, 0.40], [0.005, 0.012], 0.010, false), // mid, gentle twinkle
      makeLayer(60000, [1.0, 1.7], [0.35, 0.68], [0.008, 0.016], 0.012, true)   // near, soft glow, sparse
    ];
  }

  resize();
  makeStars();
  window.addEventListener('resize', () => { resize(); makeStars(); });

  let t = 0;
  function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    layers.forEach((layer) => {
      layer.stars.forEach((s) => {
        const a = reduceMotion
          ? s.baseAlpha
          : s.baseAlpha + Math.sin(t * s.twinkleSpeed * 10 + s.phase) * (s.baseAlpha * 0.45);
        if (!reduceMotion) {
          s.x = (s.x + s.dx + canvas.width) % canvas.width;
          s.y = (s.y + s.dy + canvas.height) % canvas.height;
        }
        ctx.beginPath();
        if (layer.glow) {
          ctx.shadowColor = 'rgba(167,139,250,0.6)';
          ctx.shadowBlur = 4;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fillStyle = 'rgba(245,245,247,' + Math.max(0, Math.min(1, a)) + ')';
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    t += 1;
    requestAnimationFrame(drawStars);
  }
  drawStars();
})();
