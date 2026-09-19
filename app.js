const searchInput = document.querySelector('#searchInput');
let cards = [...document.querySelectorAll('.manga-card')];
const emptyState = document.querySelector('#emptyState');
const detailDialog = document.querySelector('#detailDialog');
const detailContent = document.querySelector('#detailContent');

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
      card.dataset.entryId = entry.id;
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

function openEntry(card) {
  const entries = JSON.parse(localStorage.getItem('mangaJournalEntries') || '[]');
  const storedEntry = entries.find((entry) => entry.id === card.dataset.entryId);
  const entry = storedEntry || {
    title: card.dataset.title,
    author: card.dataset.author,
    genre: card.dataset.genre,
    notes: card.querySelector('.manga-note')?.textContent.replace(/[“”]/g, '') || 'This entry is ready for a longer note.',
    tags: [],
    ratings: [],
    coverImage: '',
    panelImages: [],
  };
  const ratings = entry.ratings?.length ? `<div class="detail-ratings">${entry.ratings.map((rating) => `<span><b>${escapeHtml(rating.category)}</b><strong>${rating.score}<small>/10</small></strong></span>`).join('')}</div>` : '';
  const tags = entry.tags?.length ? `<div class="detail-tags">${entry.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : '';
  const panels = entry.panelImages?.length ? `<section class="detail-gallery"><p class="eyebrow">Panel gallery</p><div>${entry.panelImages.map((image, index) => `<img src="${image}" alt="${escapeHtml(entry.title)} panel ${index + 1}" />`).join('')}</div></section>` : '';
  detailContent.innerHTML = `<div class="detail-header"><div>${entry.coverImage ? `<img class="detail-cover-image" src="${entry.coverImage}" alt="${escapeHtml(entry.title)} front cover" />` : `<div class="detail-cover-fallback">M</div>`}</div><div><p class="eyebrow">Manga journal entry</p><h2>${escapeHtml(entry.title)}</h2><p class="detail-byline">${escapeHtml(entry.author)} · ${escapeHtml(entry.genre)}</p>${tags}</div></div><div class="detail-note"><p class="eyebrow">My notes</p><p>${escapeHtml(entry.notes).replace(/\n/g, '<br />')}</p></div>${ratings}${panels}`;
  detailDialog.showModal();
}

document.querySelectorAll('.manga-card').forEach((card) => {
  card.addEventListener('click', (event) => {
    if (event.target.closest('.save-button')) return;
    openEntry(card);
  });
});
document.querySelector('#closeDetail').addEventListener('click', () => detailDialog.close());
detailDialog.addEventListener('click', (event) => {
  if (event.target === detailDialog) detailDialog.close();
});
