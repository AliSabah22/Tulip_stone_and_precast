/* ============================================================
   FORM VALIDATION — quote form, real-time + submit via function
   ============================================================ */

(function () {
  const form      = document.querySelector('.quote-form');
  if (!form) return;

  const successEl  = document.querySelector('.form-success');
  const errorEl    = document.querySelector('.form-error-msg');
  const submitBtn  = form.querySelector('[type="submit"]');

  // ── Validators ───────────────────────────────────────────

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function isValidPhone(value) {
    return value.replace(/\D/g, '').length >= 10;
  }

  function validateField(field) {
    const group = field.closest('.field-group');
    if (!group) return true;

    const errorSpan = group.querySelector('.field-error');
    const required  = field.hasAttribute('required');
    const value     = field.value.trim();
    let errorMsg    = '';

    if (required && !value) {
      errorMsg = 'This field is required.';
    } else if (value && field.type === 'email' && !isValidEmail(value)) {
      errorMsg = 'Please enter a valid email address.';
    } else if (value && field.name === 'phone' && !isValidPhone(value)) {
      errorMsg = 'Please enter a valid phone number (10+ digits).';
    }

    const hasError = errorMsg.length > 0;
    group.classList.toggle('has-error', hasError);
    field.classList.toggle('has-error', hasError);
    if (errorSpan) errorSpan.textContent = errorMsg;

    return !hasError;
  }

  function validateRadioGroup(name) {
    const radios = form.querySelectorAll(`[name="${name}"]`);
    if (!radios.length) return true;

    const isRequired = radios[0].hasAttribute('required');
    if (!isRequired) return true;

    const isChecked = Array.from(radios).some((r) => r.checked);
    const group     = radios[0].closest('.field-group');
    const errorSpan = group?.querySelector('.field-error');

    if (group) group.classList.toggle('has-error', !isChecked);
    if (errorSpan) errorSpan.textContent = isChecked ? '' : 'Please select a project type.';

    return isChecked;
  }

  // ── Real-time blur validation ────────────────────────────

  const inputs = form.querySelectorAll('.field-input, .field-select, .field-textarea');

  inputs.forEach((input) => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.closest('.field-group')?.classList.contains('has-error')) {
        validateField(input);
      }
    });
  });

  // ── Success / error UI ───────────────────────────────────

  function showSuccess() {
    form.classList.add('is-hidden');
    if (errorEl) errorEl.style.display = 'none';
    if (successEl) {
      successEl.classList.add('is-visible');
      successEl.focus();
    }
  }

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled  = loading;
    submitBtn.textContent = loading ? 'Sending…' : 'Submit Request';
  }

  // ── Submit ───────────────────────────────────────────────

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all fields
    let allValid = true;
    inputs.forEach((input) => { if (!validateField(input)) allValid = false; });
    if (!validateRadioGroup('project-type')) allValid = false;

    if (!allValid) {
      const firstError = form.querySelector('.field-group.has-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.querySelector('.field-input, .field-select, .field-textarea')?.focus();
      }
      return;
    }

    // Hide any previous error
    if (errorEl) errorEl.style.display = 'none';
    setLoading(true);

    try {
      // FormData preserves file uploads as multipart/form-data automatically
      const response = await fetch('/.netlify/functions/submit-inquiry', {
        method: 'POST',
        body:   new FormData(form),
        // Do NOT set Content-Type — browser adds multipart boundary automatically
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success) {
        showSuccess();
      } else {
        setLoading(false);
        showError(
          'There was a problem sending your request. Please try again or contact us directly at office@tulipprecast.com'
        );
      }
    } catch {
      setLoading(false);
      showError(
        'Connection error. Please check your internet and try again, or email us at office@tulipprecast.com'
      );
    }
  });
})();
