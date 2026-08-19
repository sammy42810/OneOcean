// OOD-33 — client-side validation for the profile edit view.
// Mirrors the server-side rules in utils/user_utils.js so users get instant
// feedback; the server (routes/users.js + data/users.js) remains the source of truth.

(function () {
  const NAME_RE = /^[A-Za-z-]+$/;
  const CITY_RE = /^[A-Za-z-' ]+$/;
  const STATE_RE = /^[A-Za-z]{2}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const val = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };

  function setError(name, msg) {
    const slot = document.querySelector('[data-error-for="' + name + '"]');
    const input = document.getElementById(name);
    if (slot) slot.textContent = msg || '';
    if (input) input.classList.toggle('input-invalid', Boolean(msg));
    return !msg;
  }

  // restore gender selection from the value the server rendered
  const gender = document.getElementById('gender');
  if (gender && gender.dataset.selected) gender.value = gender.dataset.selected;

  const editForm = document.getElementById('profile-edit-form');
  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      let ok = true;

      const nameMsg = 'Must be 2–50 characters, letters and hyphens only.';
      const first = val('firstName');
      ok = setError('firstName', first.length >= 2 && first.length <= 50 && NAME_RE.test(first) ? '' : nameMsg) && ok;
      const last = val('lastName');
      ok = setError('lastName', last.length >= 2 && last.length <= 50 && NAME_RE.test(last) ? '' : nameMsg) && ok;

      ok = setError('email', EMAIL_RE.test(val('email')) ? '' : 'Enter a valid email address.') && ok;

      ok = setError('gender', ['M', 'F', 'NB'].includes(val('gender')) ? '' : 'Select an option.') && ok;

      const age = Number(val('age'));
      ok = setError('age', Number.isFinite(age) && age > 0 ? '' : 'Enter a valid age.') && ok;

      const city = val('city');
      ok = setError('city', city.length >= 2 && city.length <= 50 && CITY_RE.test(city) ? '' : 'Must be 2–50 characters, letters only.') && ok;

      ok = setError('state', STATE_RE.test(val('state')) ? '' : 'Use a 2-letter state code, e.g. CA.') && ok;

      if (!ok) e.preventDefault();
    });
  }
})();
