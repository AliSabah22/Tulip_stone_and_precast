/* ============================================================
   COLOUR SELECTOR — swatch click → preview CSS variable update
   ============================================================ */

(function () {
  const swatches = document.querySelectorAll('[data-colour]');
  const preview = document.getElementById('colour-preview');

  if (swatches.length === 0) return;

  let activeSwatch = null;

  function selectSwatch(swatch) {
    if (activeSwatch) {
      activeSwatch.classList.remove('is-active');
      activeSwatch.setAttribute('aria-pressed', 'false');
    }

    swatch.classList.add('is-active');
    swatch.setAttribute('aria-pressed', 'true');
    activeSwatch = swatch;

    const colour = swatch.dataset.colour;
    const colourName = swatch.dataset.name || '';

    if (preview) {
      preview.style.transition = 'opacity 200ms ease';
      preview.style.opacity = '0';

      setTimeout(() => {
        preview.style.setProperty('--preview-colour', colour);
        preview.dataset.activeColour = colourName;

        const nameDisplay = document.querySelector('[data-colour-name-display]');
        if (nameDisplay) nameDisplay.textContent = colourName;

        preview.style.opacity = '1';
      }, 200);
    }

    document.documentElement.style.setProperty('--preview-colour', colour);
  }

  swatches.forEach((swatch) => {
    swatch.setAttribute('role', 'button');
    swatch.setAttribute('tabindex', '0');
    swatch.setAttribute('aria-pressed', 'false');

    swatch.addEventListener('click', () => selectSwatch(swatch));

    swatch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectSwatch(swatch);
      }
    });
  });

  if (swatches[0]) selectSwatch(swatches[0]);
})();
