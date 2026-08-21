// OOD-21 — client-side behavior for the Community events list filter bar.
// The backend stores/filters eventDate as MM/DD/YYYY, but <input type="date">
// works in YYYY-MM-DD, so we convert in both directions here.

(function () {
  const form = document.getElementById('event-filters');
  if (!form) return;

  const dateInput = document.getElementById('filter-date');
  const typeSelect = document.getElementById('filter-type');

  // Restore active filters into the controls (server sends them back as-is)
  if (typeSelect && typeSelect.dataset.selected) {
    typeSelect.value = typeSelect.dataset.selected;
  }
  if (dateInput && dateInput.dataset.current) {
    // MM/DD/YYYY -> YYYY-MM-DD so the date picker shows the active filter
    const parts = dateInput.dataset.current.split('/');
    if (parts.length === 3) {
      dateInput.value = parts[2] + '-' + parts[0] + '-' + parts[1];
    }
  }

  const distanceRadius = document.getElementById('filter-distance-radius');
  const distanceLabel = document.getElementById('distance-label');
  distanceRadius.addEventListener('input', function() {
    distanceLabel.innerHTML = "Dist from Long Beach: " + this.value + " miles";
  });
  
  // On submit: convert the picked date to MM/DD/YYYY (what the backend matches
  // against) and drop empty fields so the URL stays clean.
  form.addEventListener('submit', function () {
    if (dateInput && dateInput.value) {
      const parts = dateInput.value.split('-'); // YYYY-MM-DD
      if (parts.length === 3) {
        // swap the input to text right before submit so the browser sends MM/DD/YYYY
        dateInput.type = 'text';
        dateInput.value = parts[1] + '/' + parts[2] + '/' + parts[0];
      }
    }
    Array.from(form.elements).forEach(function (el) {
      if (el.name && !el.value) el.disabled = true;
    });
  });
})();
