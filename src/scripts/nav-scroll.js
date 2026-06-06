/* ============================================================
   NAV SCROLL — solid state after 80px + mobile menu
   ============================================================ */

(function () {
  const nav = document.querySelector('#main-nav');
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileOverlay = document.querySelector('.nav-mobile-overlay');
  const mobileLinks = document.querySelectorAll('.nav-mobile-overlay a');

  if (!nav) return;

  // ── Scroll state ────────────────────────────────────────

  function updateScrollState() {
    if (window.scrollY > 80) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateScrollState, { passive: true });
  updateScrollState();

  // ── Mobile menu ──────────────────────────────────────────

  if (!hamburger || !mobileOverlay) return;

  let focusableElements = [];
  let firstFocusable = null;
  let lastFocusable = null;

  function getFocusableElements() {
    focusableElements = Array.from(
      mobileOverlay.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    firstFocusable = focusableElements[0];
    lastFocusable = focusableElements[focusableElements.length - 1];
  }

  function openMenu() {
    document.body.classList.add('menu-open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileOverlay.setAttribute('aria-hidden', 'false');
    getFocusableElements();
    // Focus first element after animation
    setTimeout(() => {
      if (firstFocusable) firstFocusable.focus();
    }, 350);
  }

  function closeMenu() {
    document.body.classList.remove('menu-open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileOverlay.setAttribute('aria-hidden', 'true');
    hamburger.focus();
  }

  function toggleMenu() {
    if (document.body.classList.contains('menu-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  hamburger.addEventListener('click', toggleMenu);

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      closeMenu();
    }

    // Trap focus inside menu
    if (
      e.key === 'Tab' &&
      document.body.classList.contains('menu-open') &&
      focusableElements.length > 0
    ) {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  });

  // Close on outside click (overlay background)
  mobileOverlay.addEventListener('click', (e) => {
    if (e.target === mobileOverlay) closeMenu();
  });

  // Close on nav link click
  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => closeMenu());
  });
})();
