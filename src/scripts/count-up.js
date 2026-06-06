/* ============================================================
   COUNT UP — animates [data-count-up] elements
   triggered by IntersectionObserver on the trust bar
   ============================================================ */

(function () {
  const countEls = document.querySelectorAll('[data-count-up]');
  if (countEls.length === 0) return;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // easeOutQuart
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animateCount(el) {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const startTime = performance.now();

    if (prefersReducedMotion) {
      el.textContent = target + suffix;
      return;
    }

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      const current = Math.round(eased * target);

      el.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  // Watch the trust bar section
  const trustBar = document.querySelector('.trust-bar');
  const watchTarget = trustBar || countEls[0].closest('section') || countEls[0];

  let hasRun = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasRun) {
          hasRun = true;
          countEls.forEach((el) => animateCount(el));
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  observer.observe(watchTarget);
})();
