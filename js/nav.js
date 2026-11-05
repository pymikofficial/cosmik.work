// Mobile nav, hamburger toggle for the full-screen overlay menu.
// Shared across every page via <script src="js/nav.js">.
// On the homepage it also marks the nav link of the section in view.
(function () {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  const closeBtn = document.getElementById('mobileMenuClose');
  if (!toggle || !menu) return;

  let lastFocusedElement = null;

  function getFocusableElements() {
    return Array.from(menu.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
  }

  function openMenu() {
    lastFocusedElement = document.activeElement;
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    menu.inert = false;
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');

    const focusables = getFocusableElements();
    if (focusables.length) focusables[0].focus();
  }
  function closeMenu(skipFocus) {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    menu.inert = true;
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');

    if (skipFocus) return;
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    } else {
      toggle.focus();
    }
  }

  toggle.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', () => closeMenu());
  // A jump to a section on this page lets the browser move focus to that
  // section, so the menu closes without sending focus back to the toggle.
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    const href = a.getAttribute('href') || '';
    closeMenu(href.charAt(0) === '#');
  }));
  document.addEventListener('keydown', (e) => {
    if (!menu.classList.contains('open')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusables = getFocusableElements();
    if (!focusables.length) {
      e.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  });
})();

// Homepage section highlight. The nav links are #section jumps there. The
// link of the section under the nav is marked active, and the last section
// is marked once the page is scrolled to the bottom, since it may be too
// short to reach the top. After a jump the target stays marked until the
// visitor scrolls by hand, so a short section near the end still lights up.
// Nothing animates, so reduced motion is unaffected.
(function () {
  const links = Array.from(document.querySelectorAll('a[data-section][href^="#"]'));
  if (!links.length) return;
  const ids = Array.from(new Set(links.map((a) => a.getAttribute('data-section'))));
  const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
  if (!sections.length) return;
  const nav = document.getElementById('nav');
  let current = null;
  let queued = false;
  let pinned = null;

  function mark(id) {
    if (id === current) return;
    current = id;
    links.forEach((a) => {
      const on = a.getAttribute('data-section') === id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  }

  function update() {
    queued = false;
    const line = (nav ? nav.offsetHeight : 52) + window.innerHeight * 0.25;
    const doc = document.documentElement;
    let id = null;
    if (pinned) {
      mark(pinned);
      return;
    }
    if (window.scrollY > 0 && window.innerHeight + window.scrollY >= doc.scrollHeight - 2) {
      id = sections[sections.length - 1].id;
    } else {
      sections.forEach((s) => { if (s.getBoundingClientRect().top <= line) id = s.id; });
    }
    mark(id);
  }

  function queue() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(update);
  }

  function pinTo(hash) {
    const id = (hash || '').slice(1);
    pinned = ids.indexOf(id) !== -1 && document.getElementById(id) ? id : null;
    queue();
  }
  function unpin() {
    if (!pinned) return;
    pinned = null;
    queue();
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a) pinTo(a.getAttribute('href'));
  });
  ['wheel', 'touchstart', 'mousedown'].forEach((t) => window.addEventListener(t, unpin, { passive: true }));
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].indexOf(e.key) !== -1) unpin();
  });
  if (location.hash) pinned = ids.indexOf(location.hash.slice(1)) !== -1 ? location.hash.slice(1) : null;

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  window.addEventListener('hashchange', () => pinTo(location.hash));
  window.addEventListener('load', queue);
  update();
})();
