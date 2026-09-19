const searchInput = document.querySelector('#searchInput');
let cards = [...document.querySelectorAll('.manga-card')];
const emptyState = document.querySelector('#emptyState');

const rankingCategories = [
  'Visual style', 'Main cast', 'Supporting cast', 'Character depth', 'Character chemistry',
  'Plot', 'Pacing', 'World-building', 'Dialogue', 'Humor', 'Drama', 'Emotional impact',
  'Themes', 'Originality', 'Panel composition', 'Action', 'Romance', 'Atmosphere',
  'Ending', 'Reread value',
];

const rankingScores = {
  Dandadan: [9.2, 9.0, 8.8, 8.7, 9.1, 8.9, 8.6, 8.8, 9.1, 9.4, 8.3, 8.9, 8.6, 9.2, 9.3, 9.1, 7.8, 9.0, 8.5, 9.0],
  'Blue Period': [9.4, 9.3, 8.7, 9.5, 8.9, 8.8, 8.2, 8.7, 9.2, 7.2, 9.5, 9.4, 9.6, 9.0, 9.2, 6.5, 7.5, 9.1, 8.8, 9.4],
  Frieren: [9.5, 9.7, 9.0, 9.6, 9.5, 9.4, 9.0, 9.8, 9.6, 7.5, 9.7, 9.8, 9.7, 9.2, 9.6, 7.8, 8.4, 9.9, 9.4, 9.8],
  'Witch Hat Atelier': [9.8, 9.1, 8.9, 9.0, 8.8, 9.0, 8.5, 9.9, 9.3, 7.8, 8.9, 9.2, 9.3, 9.7, 9.8, 6.9, 7.2, 9.7, 8.4, 9.5],
};

function getRanking(title) {
  const scores = rankingScores[title] || rankingCategories.map((_, index) => Number((7 + ((index * 7) % 29) / 10).toFixed(1)));
  return rankingCategories.map((category, index) => ({ category, score: scores[index] }));
}

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
    const coverMarkup = entry.coverImage ? `<img class="card-cover-image" src="${entry.coverImage}" alt="${escapeHtml(entry.title)} cover" />` : `<div class="cover ${escapeHtml(entry.cover || 'cover-witch')}"><span class="cover-kicker">MY JOURNAL</span><strong>${escapeHtml(entry.title)}</strong><span class="cover-volume">PERSONAL ENTRY</span></div>`;
    const average = getRanking(entry.title).reduce((sum, rating) => sum + rating.score, 0) / rankingCategories.length;
    card.innerHTML = `${coverMarkup}<div class="manga-info"><div><h3>${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.author)} · ${escapeHtml(entry.genre)}</p></div><span class="score">${average.toFixed(1)} <b>★</b></span></div><p class="manga-note">“${escapeHtml(entry.notes.split(/\s+/).slice(0, 18).join(' '))}...”</p><div class="card-meta"><span>${entry.tags.length} tags · personal notes</span><button class="save-button" aria-label="Save ${escapeHtml(entry.title)}">♡</button></div>`;
    grid.prepend(card);
    card.querySelector('.save-button').addEventListener('click', (event) => {
      const button = event.currentTarget;
      const saved = button.classList.toggle('saved');
      button.textContent = saved ? '♥' : '♡';
    });
  });
  cards = [...document.querySelectorAll('.manga-card')];
}

document.querySelectorAll('.manga-card').forEach((card) => {
  card.addEventListener('click', (event) => {
    if (event.target.closest('.save-button')) return;
    const id = card.dataset.entryId ? `?id=${encodeURIComponent(card.dataset.entryId)}` : `?title=${encodeURIComponent(card.dataset.title)}`;
    window.location.href = `manga-view.html${id}`;
  });
});

const rankingGrid = document.querySelector('#rankingGrid');
const scoreFilter = document.querySelector('#scoreFilter');
const categoryFilter = document.querySelector('#categoryFilter');
rankingCategories.forEach((category) => categoryFilter.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`));
function renderRankings() {
  const minimum = Number(scoreFilter.value);
  const category = categoryFilter.value;
  const categoryIndex = rankingCategories.indexOf(category);
  const rows = document.querySelectorAll('.manga-card');
  const rankings = [...rows].map((card) => {
    const scores = getRanking(card.dataset.title);
    const average = scores.reduce((sum, rating) => sum + rating.score, 0) / scores.length;
    return { card, scores, average };
  }).filter((item) => item.average >= minimum && (category === 'all' || item.scores[categoryIndex].score >= minimum)).sort((a, b) => b.average - a.average);
  rankingGrid.innerHTML = rankings.map((item) => `<button class="ranking-row" type="button" data-title="${escapeHtml(item.card.dataset.title)}"><strong>${escapeHtml(item.card.dataset.title)}</strong><span>${category === 'all' ? 'Overall average' : escapeHtml(category)}</span><b>${category === 'all' ? item.average.toFixed(1) : item.scores[categoryIndex].score.toFixed(1)}<small>/10</small></b></button>`).join('');
  rankingGrid.querySelectorAll('.ranking-row').forEach((row) => row.addEventListener('click', () => { window.location.href = `manga-view.html?title=${encodeURIComponent(row.dataset.title)}`; }));
}
scoreFilter.addEventListener('change', renderRankings);
categoryFilter.addEventListener('change', renderRankings);
renderRankings();
