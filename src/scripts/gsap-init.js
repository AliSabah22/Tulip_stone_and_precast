/* ============================================================
   GSAP INIT — hero text reveal, scroll reveal, parallax,
   magnetic buttons, clip reveals, line draws
   ============================================================ */

(async function () {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // ── IntersectionObservers run IMMEDIATELY — no GSAP needed ──
  // These must be set up synchronously before any await so that
  // elements become visible even if the GSAP CDN is slow or blocked.

  // Scroll reveal (.reveal → .is-visible)
  const revealElements = document.querySelectorAll('.reveal');

  if (revealElements.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -60px 0px',
      }
    );

    revealElements.forEach((el) => observer.observe(el));
  }

  // Clip image reveal
  const clipRevealElements = document.querySelectorAll('.clip-reveal');

  if (clipRevealElements.length > 0 && !prefersReducedMotion) {
    const clipObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            clipObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    clipRevealElements.forEach((el) => clipObserver.observe(el));
  }

  // Horizontal line draw
  const drawLines = document.querySelectorAll('.draw-line');

  if (drawLines.length > 0) {
    const lineObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            lineObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    drawLines.forEach((el) => lineObserver.observe(el));
  }

  // ── Load GSAP from CDN for enhanced animations ─────────────
  // If the CDN fails, all CSS transition reveals above still work.

  let gsap, ScrollTrigger;

  try {
    [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('https://cdn.skypack.dev/gsap@3.12.5'),
      import('https://cdn.skypack.dev/gsap@3.12.5/ScrollTrigger'),
    ]);

    gsap.registerPlugin(ScrollTrigger);
  } catch {
    document.dispatchEvent(new CustomEvent('gsap:ready'));
    return;
  }

  // ── 1. HERO TEXT REVEAL ────────────────────────────────────

  const heroHeadline = document.querySelector('.hero-headline');

  if (heroHeadline && !prefersReducedMotion) {
    function splitWords(el) {
      const walker = document.createTreeWalker(
        el,
        NodeFilter.SHOW_TEXT,
        null
      );

      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue.trim()) textNodes.push(node);
      }

      textNodes.forEach((textNode) => {
        const words = textNode.nodeValue.split(/(\s+)/);
        const fragment = document.createDocumentFragment();

        words.forEach((word) => {
          if (/^\s+$/.test(word)) {
            fragment.appendChild(document.createTextNode(word));
          } else if (word.length > 0) {
            const wrap = document.createElement('span');
            wrap.className = 'word-wrap';
            const inner = document.createElement('span');
            inner.className = 'word-inner';
            inner.textContent = word;
            wrap.appendChild(inner);
            fragment.appendChild(wrap);
          }
        });

        textNode.parentNode.replaceChild(fragment, textNode);
      });
    }

    splitWords(heroHeadline);

    const wordInners = heroHeadline.querySelectorAll('.word-inner');

    gsap.set(wordInners, { clipPath: 'inset(0 0 100% 0)' });

    gsap.to(wordInners, {
      clipPath: 'inset(0 0 0% 0)',
      duration: 0.8,
      stagger: 0.12,
      ease: 'power3.out',
      delay: 0.3,
    });
  }

  // ── 2. HERO PARALLAX (desktop only) ───────────────────────

  const heroBg = document.querySelector('.hero-bg');

  if (heroBg && !prefersReducedMotion) {
    ScrollTrigger.matchMedia({
      '(min-width: 768px)': function () {
        gsap.to(heroBg, {
          y: '30%',
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      },
    });
  }

  // ── 3. STAGGERED SECTION CHILDREN ─────────────────────────

  const staggerGroups = document.querySelectorAll('[data-stagger-group]');

  staggerGroups.forEach((group) => {
    const children = group.querySelectorAll('[data-stagger-child]');
    if (children.length === 0) return;

    const groupObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!prefersReducedMotion) {
              gsap.from(children, {
                opacity: 0,
                y: 30,
                duration: 0.6,
                stagger: 0.1,
                ease: 'power2.out',
              });
            } else {
              gsap.set(children, { opacity: 1, y: 0 });
            }
            groupObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    groupObserver.observe(group);
  });

  // ── 4. MAGNETIC BUTTONS (desktop, no touch) ───────────────

  const isTouchDevice =
    'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (!isTouchDevice && !prefersReducedMotion) {
    const magneticBtns = document.querySelectorAll('.btn-magnetic');

    magneticBtns.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distX = e.clientX - centerX;
        const distY = e.clientY - centerY;
        const distance = Math.sqrt(distX ** 2 + distY ** 2);

        if (distance < 80) {
          const moveX = Math.max(-8, Math.min(8, distX * 0.3));
          const moveY = Math.max(-8, Math.min(8, distY * 0.3));
          gsap.to(btn, {
            x: moveX,
            y: moveY,
            duration: 0.3,
            ease: 'power2.out',
          });
        }
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.4)',
        });
      });
    });
  }

  document.dispatchEvent(new CustomEvent('gsap:ready'));
})();
