const searchInput = document.querySelector('#searchInput');
const emptyState = document.querySelector('#emptyState');
const mangaGrid = document.querySelector('#mangaGrid');
const adminOnlyElements = [...document.querySelectorAll('.admin-only')];
const loginElements = [...document.querySelectorAll('.login-button')];
const logoutButton = document.querySelector('#logoutButton');

let currentMangaList = [];
let cards = [];
let showingFavoritesOnly = false;

function getSavedFavorites() {
  try {
    return JSON.parse(localStorage.getItem('mangaSavedFavorites') || '[]');
  } catch {
    return [];
  }
}

function setSavedFavorites(list) {
  localStorage.setItem('mangaSavedFavorites', JSON.stringify(list));
  updateFavoritesCounters();
}

function updateFavoritesCounters() {
  const favorites = getSavedFavorites();
  const navCount = document.querySelector('#favoritesNavCount');
  const badge = document.querySelector('#savedCountBadge');
  if (navCount) navCount.textContent = favorites.length;
  if (badge) badge.textContent = favorites.length;
}

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
  const avatarButton = document.querySelector('#button_avatar');
  if (profileName) profileName.textContent = user?.username || 'MangaCave';
  if (profileRole) profileRole.textContent = user ? (isAdmin ? 'Administrator' : 'Reader') : 'Shared journal';
  if (profileAvatar) profileAvatar.textContent = user ? user.username.slice(0, 2).toUpperCase() : 'MC';
  if (avatarButton) avatarButton.textContent = user ? user.username.slice(0, 2).toUpperCase() : 'MC';
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

function getPersonalAverage(entry) {
  const ratings = entry?.ratings?.length ? entry.ratings.map((rating) => rating.score) : getRanking(entry.title).map((rating) => rating.score);
  const scale = Math.max(...ratings) > 10 ? 20 : 10;
  return ratings.reduce((sum, score) => sum + score, 0) / ratings.length / scale * 10;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character]));
}

function renderMangaList(list) {
  currentMangaList = list || [];
  mangaGrid.innerHTML = '';
  const favorites = getSavedFavorites();

  currentMangaList.forEach((entry) => {
    const card = document.createElement('article');
    card.className = 'manga-card';
    card.dataset.title = entry.title;
    card.dataset.author = entry.author;
    card.dataset.genre = entry.genre;
    card.dataset.entryId = entry.id;

    const isFavorite = favorites.includes(entry.title) || (entry.id && favorites.includes(entry.id));
    const average = getPersonalAverage(entry);
    const visitorAverage = getVisitorAverage(entry.title);
    const combined = visitorAverage === null ? average : (average + visitorAverage) / 2;

    const viewUrl = entry.id
      ? `manga-view.html?id=${encodeURIComponent(entry.id)}&title=${encodeURIComponent(entry.title || '')}`
      : `manga-view.html?title=${encodeURIComponent(entry.title || '')}`;

    const imageSrc = entry.coverImage || entry.cover_image;
    const coverInner = imageSrc
      ? `<img class="card-cover-image" src="${escapeHtml(imageSrc)}" alt="${escapeHtml(entry.title)} cover" />`
      : `<div class="cover ${escapeHtml(entry.cover || 'cover-witch')}"><span class="cover-kicker">MANGA JOURNAL</span><strong>${escapeHtml(entry.title)}</strong><span class="cover-volume">${escapeHtml(entry.chapter || 'VOL. 01')}</span></div>`;

    const coverMarkup = `<a class="card-cover-link" href="${viewUrl}" aria-label="View ${escapeHtml(entry.title)}">${coverInner}</a>`;

    const viewedBadge = entry.viewed ? `<span class="viewed-badge">✓ Viewed</span>` : '';
    const noteSnippet = entry.notes ? escapeHtml(entry.notes.split(/\s+/).slice(0, 16).join(' ')) + '...' : 'Personal journal entry ready to explore.';

    card.innerHTML = `
      ${coverMarkup}
      <div class="manga-info">
        <div>
          <h3><a class="card-title-link" href="${viewUrl}">${escapeHtml(entry.title)}</a></h3>
          <p>${escapeHtml(entry.author)} · ${escapeHtml(entry.genre)}</p>
          <small class="creator-label">Created by ${escapeHtml(entry.creatorName || 'MangaShelf')}</small>
          <div class="score-pair">
            <span class="score">${average.toFixed(1)} <b>★</b><small>My score</small></span>
            <span class="score visitor-score">${visitorAverage === null ? '—' : visitorAverage.toFixed(1)} <b>★</b><small>Visitors</small></span>
            <span class="score combined-score">${combined.toFixed(1)} <b>★</b><small>Combined</small></span>
          </div>
        </div>
      </div>
      <p class="manga-note">“${noteSnippet}”</p>
      <div class="card-meta">
        <span>${(entry.tags || []).length} tags ${viewedBadge}</span>
        <button class="save-button ${isFavorite ? 'saved' : ''}" type="button" aria-label="Save ${escapeHtml(entry.title)} to favorites">${isFavorite ? '♥' : '♡'}</button>
      </div>
    `;

    // Save button event
    card.querySelector('.save-button').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const favs = getSavedFavorites();
      const identifier = entry.id || entry.title;
      const index = favs.indexOf(identifier);
      const isNowSaved = index === -1;
      if (isNowSaved) favs.push(identifier);
      else favs.splice(index, 1);
      setSavedFavorites(favs);
      event.currentTarget.classList.toggle('saved', isNowSaved);
      event.currentTarget.textContent = isNowSaved ? '♥' : '♡';
      if (showingFavoritesOnly && !isNowSaved) {
        card.style.display = 'none';
        filterManga();
      }
    });

    // Card click opens description view
    card.addEventListener('click', (event) => {
      if (event.target.closest('.save-button')) return;
      if (event.target.closest('a')) return; // natural link navigation handles this
      window.location.href = viewUrl;
    });

    mangaGrid.appendChild(card);
  });

  cards = [...document.querySelectorAll('.manga-card')];

  const addedMangaCount = document.querySelector('#addedMangaCount');
  const lastAddedManga = document.querySelector('#lastAddedManga');
  const listMangaCount = document.querySelector('#listMangaCount');
  if (addedMangaCount) addedMangaCount.textContent = currentMangaList.length;
  if (listMangaCount) listMangaCount.textContent = currentMangaList.length;
  if (lastAddedManga) lastAddedManga.textContent = currentMangaList[0]?.title || '—';

  updateFavoritesCounters();
  filterManga();
  renderRankings();
}

function filterManga() {
  const query = (searchInput?.value || '').trim().toLowerCase();
  const favorites = getSavedFavorites();
  let visibleCards = 0;

  cards.forEach((card) => {
    const title = card.dataset.title || '';
    const id = card.dataset.entryId || '';
    const searchableText = `${title} ${card.dataset.author || ''} ${card.dataset.genre || ''}`.toLowerCase();
    const matchesQuery = searchableText.includes(query);
    const matchesFavorites = !showingFavoritesOnly || favorites.includes(title) || favorites.includes(id);
    const visible = matchesQuery && matchesFavorites;
    card.hidden = !visible;
    if (visible) visibleCards += 1;
  });

  if (emptyState) {
    if (currentMangaList.length === 0) {
      emptyState.textContent = 'No manga reviews yet. Click "Add manga" to create your first review!';
      emptyState.style.display = 'block';
    } else {
      emptyState.textContent = 'No manga found for that search.';
      emptyState.style.display = visibleCards ? 'none' : 'block';
    }
  }
}

searchInput?.addEventListener('input', filterManga);
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && document.activeElement !== searchInput) {
    event.preventDefault();
    searchInput?.focus();
  }
});

// Favorites filter toggle button & sidebar links
const filterFavoritesBtn = document.querySelector('#filterFavoritesBtn');
const filterFavoritesNav = document.querySelector('#filterFavoritesNav');
const filterAllNav = document.querySelector('#filterAllNav');

function toggleFavoritesFilter(enable) {
  showingFavoritesOnly = enable !== undefined ? enable : !showingFavoritesOnly;
  if (filterFavoritesBtn) {
    filterFavoritesBtn.classList.toggle('active', showingFavoritesOnly);
    filterFavoritesBtn.setAttribute('aria-pressed', showingFavoritesOnly);
  }
  filterManga();
}

filterFavoritesBtn?.addEventListener('click', () => toggleFavoritesFilter());
filterFavoritesNav?.addEventListener('click', (event) => {
  event.preventDefault();
  toggleFavoritesFilter(true);
  document.querySelector('#saved')?.scrollIntoView({ behavior: 'smooth' });
});
filterAllNav?.addEventListener('click', (event) => {
  event.preventDefault();
  toggleFavoritesFilter(false);
  document.querySelector('#saved')?.scrollIntoView({ behavior: 'smooth' });
});

async function hydrateMangaData() {
  try {
    const response = await fetch('/api/manga').then((res) => {
      if (!res.ok) throw new Error('API response status ' + res.status);
      return res.json();
    });
    if (response?.manga) {
      const fullList = response.manga;
      localStorage.setItem('mangaJournalEntries', JSON.stringify(fullList));
      renderMangaList(fullList);
      return;
    }
  } catch (error) {
    console.warn('Could not fetch /api/manga dynamically, reading local cache:', error);
  }

  // Fallback to cache without old hardcoded seeds
  const cached = JSON.parse(localStorage.getItem('mangaJournalEntries') || '[]');
  const listToRender = cached.filter((item) => !item.id?.startsWith('manga-dandadan') && !item.id?.startsWith('manga-blue') && !item.id?.startsWith('manga-frieren') && !item.id?.startsWith('manga-witch'));
  renderMangaList(listToRender);
}

setupAuthUi();
hydrateMangaData();

// Collection grid / list view switcher
const gridView = document.querySelector('#gridView');
const listView = document.querySelector('#listView');
function setCollectionView(view) {
  mangaGrid?.classList.toggle('list-view', view === 'list');
  gridView?.classList.toggle('active', view === 'grid');
  listView?.classList.toggle('active', view === 'list');
  localStorage.setItem('mangaCollectionView', view);
}
gridView?.addEventListener('click', () => setCollectionView('grid'));
listView?.addEventListener('click', () => setCollectionView('list'));
setCollectionView(localStorage.getItem('mangaCollectionView') || 'grid');

// Ranking section filter
const rankingGrid = document.querySelector('#rankingGrid');
const scoreFilter = document.querySelector('#scoreFilter');
const categoryFilter = document.querySelector('#categoryFilter');
if (categoryFilter) {
  rankingCategories.forEach((category) => categoryFilter.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`));
}

function renderRankings() {
  if (!rankingGrid || !scoreFilter || !categoryFilter) return;
  const minimum = Number(scoreFilter.value);
  const category = categoryFilter.value;
  const categoryIndex = rankingCategories.indexOf(category);
  const rows = document.querySelectorAll('.manga-card');
  const rankings = [...rows].map((card) => {
    const scores = getRanking(card.dataset.title);
    const average = scores.reduce((sum, rating) => sum + rating.score, 0) / scores.length;
    return { card, scores, average };
  }).filter((item) => item.average >= minimum && (category === 'all' || item.scores[categoryIndex]?.score >= minimum)).sort((a, b) => b.average - a.average);

  rankingGrid.innerHTML = rankings.map((item) => `
    <button class="ranking-row" type="button" data-title="${escapeHtml(item.card.dataset.title)}">
      <strong>${escapeHtml(item.card.dataset.title)}</strong>
      <span>${category === 'all' ? 'Overall average' : escapeHtml(category)}</span>
      <b>${category === 'all' ? item.average.toFixed(1) : (item.scores[categoryIndex]?.score || 0).toFixed(1)}<small>/10</small></b>
    </button>
  `).join('');

  rankingGrid.querySelectorAll('.ranking-row').forEach((row) => {
    row.addEventListener('click', () => {
      const match = currentMangaList.find((m) => m.title === row.dataset.title);
      const param = match?.id ? `?id=${encodeURIComponent(match.id)}` : `?title=${encodeURIComponent(row.dataset.title)}`;
      window.location.href = `manga-view.html${param}`;
    });
  });
}

scoreFilter?.addEventListener('change', renderRankings);
categoryFilter?.addEventListener('change', renderRankings);
