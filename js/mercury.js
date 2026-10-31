/* Mercury. Small chrome drops that drift on the paper and run together where the cursor or finger is.
   WebGL metaballs with a reflection of the page's own colours. Falls back to the plain dots if WebGL is missing. */
function mountMercury(wrap, cv, o) {
  var gl = cv.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true });
  if (!gl) return false;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MAX = 32, REACH = o.reach, PULL = o.pull, IDLE = o.idle || 0;
  var balls = [], W = 0, H = 0, dpr = 1, pointer = null, raf = 0, last = 0, running = false, idle = 0;

  var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS = [
    'precision highp float;',
    'uniform vec2 u_res;uniform float u_dpr;uniform int u_n;uniform vec3 u_b[' + MAX + '];',
    'uniform vec3 u_paper;uniform vec3 u_ink;uniform vec3 u_deep;',
    'float fld(vec2 p,out float rw){float F=0.;rw=0.;for(int i=0;i<' + MAX + ';i++){if(i>=u_n)break;vec3 b=u_b[i];vec2 d=p-b.xy;float q=b.z*b.z/(dot(d,d)+.5);float w=q*q;F+=w;rw+=w*b.z;}return F;}',
    'float hgt(vec2 p){float rw;float F=fld(p,rw);if(F<=1.)return 0.;return (rw/F)*sqrt(1.-1./F);}',
    'float env(float ry,float rx){',
    ' float v=1.0-.26*smoothstep(-.55,-.08,ry);',
    ' v=mix(v,.6,smoothstep(-.02,.14,ry));',
    ' v-=.34*exp(-pow(ry*13.,2.));',
    ' v-=.1*smoothstep(.5,1.,ry);',
    ' v+=.16*exp(-pow((rx-.45)*2.2,2.)-pow((ry+.7)*2.2,2.));return v;}',
    'void main(){vec2 p=gl_FragCoord.xy/u_dpr;p.y=u_res.y-p.y;',
    ' float rw;float F=fld(p,rw);',
    ' if(F<=1.){',
    '   float Fs=fld(p+vec2(-4.,-7.),rw);',
    '   float sh=smoothstep(.35,1.,Fs)*.22;',
    '   gl_FragColor=vec4(u_ink*sh,sh);return;}',
    ' float h=(rw/F)*sqrt(1.-1./F);',
    ' float e=.8;float hx=(hgt(p+vec2(e,0.))-hgt(p-vec2(e,0.)))/(2.*e);float hy=(hgt(p+vec2(0.,e))-hgt(p-vec2(0.,e)))/(2.*e);',
    ' vec3 n=normalize(vec3(-hx,-hy,1.));',
    ' float rx=2.*n.z*n.x,ry=2.*n.z*n.y;',
    ' float v=env(ry,rx);',
    ' vec3 L=normalize(vec3(-.5,-.7,.55));float ndl=max(0.,dot(n,L));',
    ' float spec=pow(ndl,140.);',
    ' float rim=pow(1.-max(0.,n.z),2.5);',
    ' vec3 col=mix(u_ink,u_paper,v);col=mix(col,u_deep,rim*.55);col+=spec*.9;',
    ' float a=clamp(h/1.0,0.,1.);',
    ' gl_FragColor=vec4(col*a,a);}'
  ].join('\n');

  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { throw new Error(gl.getShaderInfoLog(s)); } return s; }
  var prog;
  try {
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { return false; }
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var aloc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(aloc); gl.vertexAttribPointer(aloc, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ['u_res', 'u_dpr', 'u_n', 'u_b', 'u_paper', 'u_ink', 'u_deep'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
  gl.uniform3f(U.u_paper, 1.0, 0.985, 0.95);
  gl.uniform3f(U.u_ink, 0.106, 0.102, 0.09);
  gl.uniform3f(U.u_deep, 0.93, 0.905, 0.855);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  var ub = new Float32Array(MAX * 3);

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, o.fixed ? 1.5 : 2);
    if (o.fixed) { W = window.innerWidth; H = window.innerHeight; } else { var r = wrap.getBoundingClientRect(); W = r.width; H = r.height; }
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(U.u_res, W, H); gl.uniform1f(U.u_dpr, dpr);
    if (!balls.length) seed();
    draw();
  }
  function seed() {
    balls = [];
    var count = o.count(W, H);
    for (var i = 0; i < count; i++) {
      balls.push({ x: 30 + Math.random() * (W - 60), y: 30 + Math.random() * (H - 60), vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: o.rmin + Math.random() * (o.rmax - o.rmin) });
    }
  }
  function step(dt) {
    var i, j, b, o, dx, dy, d;
    for (i = 0; i < balls.length; i++) {
      b = balls[i];
      if (pointer) {
        dx = pointer.x - b.x; dy = pointer.y - b.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < REACH && d > 0.5) { var pull = (0.25 + 0.75 * (1 - d / REACH)) * PULL * dt; b.vx += dx / d * pull; b.vy += dy / d * pull; }
      }
      // drops that are not being gathered keep a little distance, like beads on a table
      for (j = i + 1; j < balls.length; j++) {
        o = balls[j]; dx = o.x - b.x; dy = o.y - b.y; d = Math.sqrt(dx * dx + dy * dy) || 1;
        var want = (b.r + o.r) * 1.6;
        if (d < want) {
          var near = pointer ? Math.min(Math.hypot(pointer.x - b.x, pointer.y - b.y), Math.hypot(pointer.x - o.x, pointer.y - o.y)) : 1e9;
          if (near > REACH * .55) { var push = (1 - d / want) * 0.05 * dt; b.vx -= dx / d * push; b.vy -= dy / d * push; o.vx += dx / d * push; o.vy += dy / d * push; }
        }
      }
      b.vx *= 0.92; b.vy *= 0.92;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); } if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx); }
      if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); } if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy); }
      // keep a slow drift alive
      if (Math.abs(b.vx) + Math.abs(b.vy) < 0.04) { b.vx += (Math.random() - .5) * .08; b.vy += (Math.random() - .5) * .08; }
    }
  }
  function draw() {
    for (var i = 0; i < balls.length; i++) { ub[i * 3] = balls[i].x; ub[i * 3 + 1] = balls[i].y; ub[i * 3 + 2] = balls[i].r; }
    gl.uniform3fv(U.u_b, ub); gl.uniform1i(U.u_n, balls.length);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function loop(ts) {
    var dt = Math.min(2, (ts - last) / 16.67 || 1); last = ts;
    step(dt); draw();
    if (IDLE && !pointer) { idle += dt * 16.67; if (idle > IDLE) { running = false; raf = 0; return; } }
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!running && !reduce) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); } }
  function stop() { running = false; cancelAnimationFrame(raf); raf = 0; }
  function local(e) { if (o.fixed) return { x: e.clientX, y: e.clientY }; var r = wrap.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  var tgt = o.fixed ? window : wrap;
  tgt.addEventListener('mousemove', function (e) { pointer = local(e); idle = 0; start(); }, { passive: true });
  tgt.addEventListener(o.fixed ? 'mouseout' : 'mouseleave', function (e) { if (!o.fixed || !e.relatedTarget) pointer = null; });
  if (!o.fixed) {
    wrap.addEventListener('touchstart', function (e) { pointer = local(e.touches[0]); }, { passive: true });
    wrap.addEventListener('touchmove', function (e) { pointer = local(e.touches[0]); }, { passive: true });
    wrap.addEventListener('touchend', function () { pointer = null; });
  }
  window.addEventListener('resize', function () { if (o.fixed) balls = []; size(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  if (!o.fixed && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }, { threshold: 0.05 }).observe(wrap);
  } else start();
  size();
  return true;
}

(function () {
  var m = window.matchMedia ? function (q) { return window.matchMedia(q).matches; } : function () { return false; };
  // the band on About, full strength, mouse and touch
  var wrap = document.getElementById('connected'), cv = document.getElementById('connectedCanvas');
  if (wrap && cv && mountMercury(wrap, cv, { count: function (W) { return W < 600 ? 10 : 18; }, rmin: 7, rmax: 15, reach: 210, pull: 0.22 })) window.__mercury = true;
  // the quiet version behind every page, desktop pointer only
  if (m('(prefers-reduced-motion: reduce)') || m('(pointer: coarse)') || m('(max-width: 860px)')) return;
  var bg = document.createElement('canvas'); bg.id = 'bgConnected'; bg.setAttribute('aria-hidden', 'true');
  document.body.prepend(bg);
  if (mountMercury(document.body, bg, { fixed: true, count: function (W, H) { return Math.max(6, Math.round(W * H / 110000)); }, rmin: 3.5, rmax: 6.5, reach: 190, pull: 0.2, idle: 2500 })) window.__mercuryBg = true;
  else bg.remove();
})();
