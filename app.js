const searchInput = document.querySelector('#searchInput');
let cards = [...document.querySelectorAll('.manga-card')];
const emptyState = document.querySelector('#emptyState');

function filterManga() {
  const query = searchInput.value.trim().toLowerCase();
  let visibleCards = 0;
  cards.forEach((card) => {
    const searchableText = `${card.dataset.title} ${card.dataset.author} ${card.dataset.genre}`.toLowerCase();
    const matches = searchableText.includes(query);
    card.hidden = !matches;
    if (matches) visibleCards += 1;
  });
  emptyState.style.display = visibleCards ? 'none' : 'block';
}

searchInput.addEventListener('input', filterManga);
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && document.activeElement !== searchInput) {
    event.preventDefault();
    searchInput.focus();
  }
});

document.querySelectorAll('.save-button').forEach((button) => {
  button.addEventListener('click', () => {
    const saved = button.classList.toggle('saved');
    button.textContent = saved ? '♥' : '♡';
  });
});

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character]));
}

function loadSavedEntries() {
  const entries = JSON.parse(localStorage.getItem('mangaJournalEntries') || '[]');
  const grid = document.querySelector('#mangaGrid');
  entries.forEach((entry) => {
    const card = document.createElement('article');
    card.className = 'manga-card';
    card.dataset.title = entry.title;
    card.dataset.author = entry.author;
    card.dataset.genre = entry.genre;
    card.innerHTML = `<div class="cover ${escapeHtml(entry.cover || 'cover-witch')}"><span class="cover-kicker">MY JOURNAL</span><strong>${escapeHtml(entry.title)}</strong><span class="cover-volume">PERSONAL ENTRY</span></div><div class="manga-info"><div><h3>${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.author)} · ${escapeHtml(entry.genre)}</p></div><span class="score">${entry.ratings.length ? (entry.ratings.reduce((sum, rating) => sum + rating.score, 0) / entry.ratings.length).toFixed(1) : '—'} <b>★</b></span></div><p class="manga-note">“${escapeHtml(entry.notes.split(/\s+/).slice(0, 18).join(' '))}...”</p><div class="card-meta"><span>${entry.tags.length} tags · personal notes</span><button class="save-button" aria-label="Save ${escapeHtml(entry.title)}">♡</button></div>`;
    grid.prepend(card);
    card.querySelector('.save-button').addEventListener('click', (event) => {
      const button = event.currentTarget;
      const saved = button.classList.toggle('saved');
      button.textContent = saved ? '♥' : '♡';
    });
  });
  cards = [...document.querySelectorAll('.manga-card')];
}

loadSavedEntries();
