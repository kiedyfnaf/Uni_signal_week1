const searchInput = document.querySelector('#searchInput');
let cards = [...document.querySelectorAll('.manga-card')];
const emptyState = document.querySelector('#emptyState');
const adminOnlyElements = [...document.querySelectorAll('.admin-only')];
const loginElements = [...document.querySelectorAll('.login-button')];
const logoutButton = document.querySelector('#logoutButton');

async function setupAuthUi() {
  let user = null;
  try {
    user = await MangaAuth.getUser();
  } catch {
    user = null;
  }
  const isAdmin = user?.role === 'admin';
  adminOnlyElements.forEach((element) => { element.style.display = isAdmin ? '' : 'none'; });
  loginElements.forEach((element) => { element.style.display = user ? 'none' : 'inline-flex'; });
  if (logoutButton) logoutButton.style.display = user ? 'inline-flex' : 'none';
  const profileName = document.querySelector('#profileName');
  const profileRole = document.querySelector('#profileRole');
  const profileAvatar = document.querySelector('#profileAvatar');
  const viewModeLabel = document.querySelector('#viewModeLabel');
  if (profileName) profileName.textContent = user?.username || 'MangaCave';
  if (profileRole) profileRole.textContent = user ? (isAdmin ? 'Administrator' : 'Reader') : 'Shared journal';
  if (profileAvatar) profileAvatar.textContent = user ? user.username.slice(0, 2).toUpperCase() : 'MC';
  if (viewModeLabel) viewModeLabel.textContent = isAdmin ? 'Admin view' : 'Read-only view';
  return user;
}

logoutButton?.addEventListener('click', () => MangaAuth.signOut());

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

function getVisitorAverage(title) {
  const stored = JSON.parse(localStorage.getItem('mangaVisitorRatings') || '{}')[title];
  const ratings = Array.isArray(stored) ? stored : (stored?.ratings || []);
  return ratings.length ? ratings.reduce((sum, score) => sum + score, 0) / ratings.length : null;
}

function getPersonalAverage(title) {
  const savedEntry = JSON.parse(localStorage.getItem('mangaJournalEntries') || '[]').find((entry) => entry.title === title);
  const ratings = savedEntry?.ratings?.length ? savedEntry.ratings.map((rating) => rating.score) : getRanking(title).map((rating) => rating.score);
  const scale = Math.max(...ratings) > 10 ? 20 : 10;
  return ratings.reduce((sum, score) => sum + score, 0) / ratings.length / scale * 10;
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
      const average = getPersonalAverage(entry.title);
    const visitorAverage = getVisitorAverage(entry.title);
      const combined = visitorAverage === null ? average : (average + visitorAverage) / 2;
      card.innerHTML = `${coverMarkup}<div class="manga-info"><div><h3>${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.author)} · ${escapeHtml(entry.genre)}</p><small class="creator-label">Created by ${escapeHtml(entry.creatorName || 'MangaShelf')}</small><div class="score-pair"><span class="score">${average.toFixed(1)} <b>★</b><small>My score</small></span><span class="score visitor-score">${visitorAverage === null ? '—' : visitorAverage.toFixed(1)} <b>★</b><small>Visitors</small></span><span class="score combined-score">${combined.toFixed(1)} <b>★</b><small>Combined</small></span></div></div></div><p class="manga-note">“${escapeHtml(entry.notes.split(/\s+/).slice(0, 18).join(' '))}...”</p><div class="card-meta"><span>${entry.tags.length} tags · ${entry.viewed ? 'viewed' : 'unviewed'}</span><button class="viewed-toggle" type="button" aria-pressed="${entry.viewed}">${entry.viewed ? 'Mark unviewed' : 'Mark viewed'}</button><button class="save-button" aria-label="Save ${escapeHtml(entry.title)}">♡</button></div>`;
    grid.prepend(card);
    card.querySelector('.save-button').addEventListener('click', (event) => {
      const button = event.currentTarget;
      const saved = button.classList.toggle('saved');
      button.textContent = saved ? '♥' : '♡';
    });
    card.querySelector('.viewed-toggle').addEventListener('click', async (event) => {
      event.stopPropagation();
      const viewed = !entry.viewed;
      await MangaAuth.api(`/api/manga/${encodeURIComponent(entry.id)}/viewed`, { method: 'POST', body: JSON.stringify({ viewed }) });
      entry.viewed = viewed;
      event.currentTarget.textContent = viewed ? 'Mark unviewed' : 'Mark viewed';
      event.currentTarget.setAttribute('aria-pressed', viewed);
    });
  });
    const storedEntries = JSON.parse(localStorage.getItem('mangaJournalEntries') || '[]');
    const storedDrafts = JSON.parse(localStorage.getItem('mangaJournalDrafts') || '[]');
    document.querySelector('#addedMangaCount').textContent = 4 + storedEntries.length;
    document.querySelector('#listMangaCount').textContent = 4 + storedEntries.length;
    document.querySelector('#draftCount').textContent = storedDrafts.length;
    if (storedEntries[0]?.title) document.querySelector('#lastAddedManga').textContent = storedEntries[0].title;
  cards = [...document.querySelectorAll('.manga-card')];
}

async function hydrateMangaData(user) {
  if (!user) return;
  try {
    const response = await MangaAuth.api('/api/manga');
    localStorage.setItem('mangaJournalEntries', JSON.stringify(response.manga));
    loadSavedEntries();
    cards = [...document.querySelectorAll('.manga-card')];
    decorateCardScores();
    renderRankings();
  } catch (error) {
    console.error('Could not load shared manga data.', error);
  }
}

setupAuthUi().then(hydrateMangaData);

function decorateCardScores() {
  cards.forEach((card) => {
    const score = card.querySelector('.score');
    if (!score || score.parentElement.classList.contains('score-pair')) return;
    const personal = getPersonalAverage(card.dataset.title);
    const visitor = getVisitorAverage(card.dataset.title);
    const pair = document.createElement('div');
    pair.className = 'score-pair';
    const combined = visitor === null ? personal : (personal + visitor) / 2;
    pair.innerHTML = `<span class="score">${personal.toFixed(1)} <b>★</b><small>My score</small></span><span class="score visitor-score">${visitor === null ? '—' : visitor.toFixed(1)} <b>★</b><small>Visitors</small></span><span class="score combined-score">${combined.toFixed(1)} <b>★</b><small>Combined</small></span>`;
    score.replaceWith(pair);
  });
}

decorateCardScores();

document.querySelectorAll('.manga-card').forEach((card) => {
  card.addEventListener('click', (event) => {
    if (event.target.closest('.save-button')) return;
    const id = card.dataset.entryId ? `?id=${encodeURIComponent(card.dataset.entryId)}` : `?title=${encodeURIComponent(card.dataset.title)}`;
    window.location.href = `manga-view.html${id}`;
  });
});

const mangaGrid = document.querySelector('#mangaGrid');
const gridView = document.querySelector('#gridView');
const listView = document.querySelector('#listView');
function setCollectionView(view) {
  mangaGrid.classList.toggle('list-view', view === 'list');
  gridView.classList.toggle('active', view === 'grid');
  listView.classList.toggle('active', view === 'list');
  localStorage.setItem('mangaCollectionView', view);
}
gridView.addEventListener('click', () => setCollectionView('grid'));
listView.addEventListener('click', () => setCollectionView('list'));
setCollectionView(localStorage.getItem('mangaCollectionView') || 'grid');

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
