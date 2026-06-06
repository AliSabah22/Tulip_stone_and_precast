/* ============================================================
   PARTICLES INIT — tsParticles, hero section only,
   destroyed when hero leaves viewport
   ============================================================ */

(async function () {
  const heroCanvas = document.getElementById('hero-canvas');
  if (!heroCanvas) return;

  // Disable on small screens or reduced motion
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (window.innerWidth < 768 || prefersReducedMotion) return;

  const heroSection = heroCanvas.closest('.hero') || document.querySelector('.hero');
  if (!heroSection) return;

  let particlesInstance = null;

  const particlesConfig = {
    particles: {
      number: {
        value: 35,
        density: { enable: true, value_area: 800 },
      },
      color: {
        value: ['#C8A882', '#E8D5BC', '#7A9176'],
      },
      opacity: {
        value: 0.2,
        random: { enable: true, minimumValue: 0.05 },
        anim: {
          enable: true,
          speed: 0.5,
          opacity_min: 0.05,
          sync: false,
        },
      },
      size: {
        value: { min: 0.5, max: 2.5 },
        random: true,
        anim: { enable: false },
      },
      move: {
        enable: true,
        speed: 0.35,
        direction: 'top',
        random: true,
        straight: false,
        outModes: { default: 'out' },
      },
      links: { enable: false },
    },
    background: { color: 'transparent' },
    detectRetina: true,
    interactivity: {
      events: {
        onHover: { enable: false },
        onClick: { enable: false },
      },
    },
  };

  async function loadParticles() {
    if (particlesInstance) return;

    try {
      const { tsParticles } = await import(
        'https://cdn.jsdelivr.net/npm/tsparticles@2.12.0/tsparticles.bundle.min.js'
      );

      particlesInstance = await tsParticles.load('hero-canvas', particlesConfig);
    } catch (err) {
      // Particles are purely decorative — silent fail is acceptable
    }
  }

  function destroyParticles() {
    if (particlesInstance) {
      particlesInstance.destroy();
      particlesInstance = null;
    }
  }

  // Use IntersectionObserver to load/destroy based on hero visibility
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadParticles();
        } else {
          destroyParticles();
        }
      });
    },
    { threshold: 0.01 }
  );

  observer.observe(heroSection);
})();
