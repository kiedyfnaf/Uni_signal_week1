document.body.hidden = true;
MangaAuth.requireAdmin().then(() => { document.body.hidden = false; }).catch(() => {});

const draftList = document.querySelector('#draftList');
const drafts = JSON.parse(localStorage.getItem('mangaJournalDrafts') || '[]');
function escapeHtml(value) { return String(value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function renderDrafts() {
  if (!drafts.length) {
    draftList.innerHTML = '<div class="empty-drafts"><p class="eyebrow">Nothing saved yet</p><h2>Your drafts will appear here.</h2><a class="button button-dark" href="manga-editor.html">Add your first manga</a></div>';
    return;
  }
  draftList.innerHTML = drafts.map((draft) => `<article class="draft-card"><div class="draft-visual">${draft.coverImage ? `<img src="${draft.coverImage}" alt="${escapeHtml(draft.title)} cover" />` : '<span>M</span>'}</div><div class="draft-copy"><p class="eyebrow">Draft entry</p><h2>${escapeHtml(draft.title || 'Untitled manga')}</h2><p>${escapeHtml(draft.author || 'Author not added')} · ${escapeHtml(draft.genre || 'Genre not added')}</p><small>${draft.notes ? `${draft.notes.trim().split(/\s+/).length.toLocaleString()} words written` : 'No notes written yet'} · ${draft.ratings?.length || 20} ratings ready</small></div><div class="draft-actions"><a class="button button-dark" href="manga-editor.html?draft=${encodeURIComponent(draft.id)}">Continue editing</a><button class="button delete-draft" data-id="${draft.id}">Delete</button></div></article>`).join('');
  draftList.querySelectorAll('.delete-draft').forEach((button) => button.addEventListener('click', () => {
    const remaining = drafts.filter((draft) => draft.id !== button.dataset.id);
    localStorage.setItem('mangaJournalDrafts', JSON.stringify(remaining));
    window.location.reload();
  }));
}
renderDrafts();
