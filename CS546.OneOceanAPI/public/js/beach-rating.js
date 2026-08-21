(function () {
  const own = document.getElementById('rating-own');
  if (!own) return;

  const beachId = own.dataset.beachId;
  const select = document.getElementById('rating-edit-select');
  const errorEl = document.getElementById('rating-error');
  if (select && own.dataset.ownRating) select.value = own.dataset.ownRating;

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  const updateBtn = document.getElementById('rating-update-btn');
  if (updateBtn) {
    updateBtn.addEventListener('click', async function () {
      errorEl.hidden = true;
      try {
        const response = await fetch('/beaches/' + beachId + '/ratings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating: select.value })
        });
        if (!response.ok) {
          const data = await response.json().catch(function () { return {}; });
          showError(data.error || 'Could not update rating.');
          return;
        }
        window.location.reload();
      } catch (err) {
        showError('Could not update rating.');
      }
    });
  }

  const removeBtn = document.getElementById('rating-remove-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', async function () {
      if (!window.confirm('Remove your rating for this beach?')) return;
      errorEl.hidden = true;
      try {
        const response = await fetch('/beaches/' + beachId + '/ratings', { method: 'DELETE' });
        if (!response.ok) {
          const data = await response.json().catch(function () { return {}; });
          showError(data.error || 'Could not remove rating.');
          return;
        }
        window.location.reload();
      } catch (err) {
        showError('Could not remove rating.');
      }
    });
  }
})();
