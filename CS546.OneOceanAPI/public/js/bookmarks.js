// Bookmarks page: toggle whether the current user's saved beaches are public or private.
(function () {
  const bar = document.getElementById('privacy-bar');
  const toggle = document.getElementById('privacy-toggle');
  if (!bar || !toggle) return;

  const stateEl = document.getElementById('privacy-state');
  const hintEl = document.getElementById('privacy-hint');
  const userId = bar.dataset.userId;

  const render = (isPrivate) => {
    if (stateEl) stateEl.textContent = isPrivate ? 'private' : 'public';
    if (hintEl) {
      hintEl.textContent = isPrivate
        ? 'Only you can see this list.'
        : 'Anyone with your profile link can see this list.';
    }
    bar.dataset.private = String(isPrivate);
  };

  toggle.addEventListener('change', async () => {
    const isPrivate = toggle.checked;
    toggle.disabled = true;

    try {
      const res = await fetch(`/users/${userId}/favorites/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ isPrivate })
      });

      if (!res.ok) throw new Error('Request failed');

      const data = await res.json();
      render(Boolean(data.isBookmarksPrivate));
    } catch (err) {
      // Revert the switch if the update didn't go through
      toggle.checked = !isPrivate;
      render(!isPrivate);
      alert('Could not update your bookmark visibility. Please try again.');
    } finally {
      toggle.disabled = false;
    }
  });
})();
