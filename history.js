const historyList = document.querySelector('#historyList');
const entries = JSON.parse(localStorage.getItem('mangaJournalEntries') || '[]');
const drafts = JSON.parse(localStorage.getItem('mangaJournalDrafts') || '[]');
const events = [
  { type: 'published', title: 'Witch Hat Atelier', detail: 'Journal entry published', date: 'Today' },
  { type: 'edited', title: 'Frieren', detail: 'Reading notes updated', date: 'Yesterday' },
  { type: 'published', title: 'Blue Period', detail: 'Journal entry published', date: 'September 16' },
  ...entries.map((entry) => ({ type: 'published', title: entry.title, detail: 'Journal entry published', date: new Date(entry.createdAt).toLocaleDateString() })),
  ...drafts.map((draft) => ({ type: 'draft', title: draft.title || 'Untitled manga', detail: 'Draft saved', date: new Date(draft.createdAt).toLocaleDateString() })),
];
historyList.innerHTML = events.map((event) => `<article class="history-item"><span class="history-marker ${event.type}">${event.type === 'published' ? '✓' : event.type === 'draft' ? '…' : '✎'}</span><div><strong>${event.title}</strong><p>${event.detail}</p></div><time>${event.date}</time></article>`).join('');
