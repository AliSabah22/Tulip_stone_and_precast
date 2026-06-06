/* ============================================================
   FORM VALIDATION — quote form, real-time + submit validation
   ============================================================ */

(function () {
  const form = document.querySelector('.quote-form');
  if (!form) return;

  const successEl = document.querySelector('.form-success');

  // ── Validators ───────────────────────────────────────────

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function isValidPhone(value) {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 10;
  }

  function validateField(field) {
    const group = field.closest('.field-group');
    if (!group) return true;

    const errorEl = group.querySelector('.field-error');
    const required = field.hasAttribute('required');
    const type = field.type || field.tagName.toLowerCase();
    const value = field.value.trim();

    let errorMsg = '';

    if (required && !value) {
      errorMsg = 'This field is required.';
    } else if (value && type === 'email' && !isValidEmail(value)) {
      errorMsg = 'Please enter a valid email address.';
    } else if (value && field.name === 'phone' && !isValidPhone(value)) {
      errorMsg = 'Please enter a valid phone number (10+ digits).';
    }

    const hasError = errorMsg.length > 0;
    group.classList.toggle('has-error', hasError);
    field.classList.toggle('has-error', hasError);
    if (errorEl) errorEl.textContent = errorMsg;

    return !hasError;
  }

  function validateRadioGroup(name) {
    const radios = form.querySelectorAll(`[name="${name}"]`);
    if (radios.length === 0) return true;

    const isRequired = radios[0].hasAttribute('required');
    if (!isRequired) return true;

    const isChecked = Array.from(radios).some((r) => r.checked);
    const group = radios[0].closest('.field-group');
    const errorEl = group?.querySelector('.field-error');

    if (group) group.classList.toggle('has-error', !isChecked);
    if (errorEl)
      errorEl.textContent = isChecked ? '' : 'Please select a project type.';

    return isChecked;
  }

  // ── Blur validation ──────────────────────────────────────

  const inputs = form.querySelectorAll(
    '.field-input, .field-select, .field-textarea'
  );

  inputs.forEach((input) => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      const group = input.closest('.field-group');
      if (group?.classList.contains('has-error')) {
        validateField(input);
      }
    });
  });

  // ── Submit ───────────────────────────────────────────────

  form.addEventListener('submit', (e) => {
    let allValid = true;

    inputs.forEach((input) => {
      if (!validateField(input)) allValid = false;
    });

    if (!validateRadioGroup('project-type')) allValid = false;

    if (!allValid) {
      e.preventDefault();

      // Scroll to first error
      const firstError = form.querySelector('.field-group.has-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const field = firstError.querySelector(
          '.field-input, .field-select, .field-textarea'
        );
        if (field) field.focus();
      }
      return;
    }

    // For non-Netlify environments (local dev) show success state
    const isNetlify = form.getAttribute('data-netlify') === 'true';

    if (!isNetlify) {
      e.preventDefault();
      showSuccess();
    }
    // If Netlify, let native submit proceed — Netlify redirects to success URL
    // or shows inline confirmation via their AJAX API
  });

  // ── Success state ────────────────────────────────────────

  function showSuccess() {
    form.classList.add('is-hidden');
    if (successEl) {
      successEl.classList.add('is-visible');
      successEl.focus();
    }
  }

  // Handle Netlify AJAX submission for seamless UX
  if (form.getAttribute('data-netlify') === 'true') {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Re-validate before submitting
      let allValid = true;
      inputs.forEach((input) => {
        if (!validateField(input)) allValid = false;
      });
      if (!validateRadioGroup('project-type')) allValid = false;
      if (!allValid) return;

      const data = new FormData(form);

      try {
        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(data).toString(),
        });

        if (response.ok) {
          showSuccess();
        } else {
          // Fallback: let native form submit
          form.removeEventListener('submit', arguments.callee);
          form.submit();
        }
      } catch {
        form.submit();
      }
    });
  }
})();
