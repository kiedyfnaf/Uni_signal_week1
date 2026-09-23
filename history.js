const historyList = document.querySelector('#historyList');
const entries = JSON.parse(localStorage.getItem('mangaJournalEntries') || '[]');
const drafts = JSON.parse(localStorage.getItem('mangaJournalDrafts') || '[]');
const events = [
  ...entries.map((entry) => ({ type: 'published', title: entry.title, detail: 'Journal entry published', date: entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'Recently' })),
  ...drafts.map((draft) => ({ type: 'draft', title: draft.title || 'Untitled manga', detail: 'Draft saved', date: draft.createdAt ? new Date(draft.createdAt).toLocaleDateString() : 'Recently' })),
];
if (events.length === 0) {
  historyList.innerHTML = '<p class="empty-state" style="display:block; padding: 20px 0; color: var(--muted);">No journal activity recorded yet. When you write reviews or save drafts, they will appear here.</p>';
} else {
  historyList.innerHTML = events.map((event) => `<article class="history-item"><span class="history-marker ${event.type}">${event.type === 'published' ? '✓' : event.type === 'draft' ? '…' : '✎'}</span><div><strong>${event.title}</strong><p>${event.detail}</p></div><time>${event.date}</time></article>`).join('');
}
