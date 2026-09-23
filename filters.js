const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Science fiction', 'Slice of life', 'Sports', 'Supernatural'];
const categories = ['Visual style', 'Main cast', 'Supporting cast', 'Character depth', 'Character chemistry', 'Plot', 'Pacing', 'World-building', 'Dialogue', 'Humor', 'Drama', 'Emotional impact', 'Themes', 'Originality', 'Panel composition', 'Action', 'Romance', 'Atmosphere', 'Ending', 'Reread value'];
const cachedEntries = JSON.parse(localStorage.getItem('mangaJournalEntries') || '[]');
let allManga = cachedEntries;
const genreCheckboxes = document.querySelector('#genreCheckboxes');
const categorySelect = document.querySelector('#filterCategory');
genreCheckboxes.innerHTML = genres.map((genre) => `<label class="checkbox-option"><input type="checkbox" value="${genre}" />${genre}</label>`).join('');
categories.forEach((category) => categorySelect.insertAdjacentHTML('beforeend', `<option>${category}</option>`));
const controls = { search: document.querySelector('#filterSearch'), category: categorySelect, score: document.querySelector('#filterScore'), visitorScore: document.querySelector('#filterVisitorScore'), date: document.querySelector('#filterDate'), sort: document.querySelector('#filterSort'), direction: document.querySelector('#filterDirection'), view: document.querySelector('#filterView'), viewed: document.querySelector('#filterViewed') };
const results = document.querySelector('#filterResults');
const resultCount = document.querySelector('#resultCount');
const filterSummary = document.querySelector('#filterSummary');
const activeFilters = document.querySelector('#activeFilters');
const genreSelectionCount = document.querySelector('#genreSelectionCount');
const settingsDialog = document.querySelector('#settingsDialog');
const themeSelect = document.querySelector('#themeSelect');

MangaAuth.getUser().then((user) => {
  if (user?.role === 'admin') document.querySelectorAll('.admin-only').forEach((element) => { element.style.display = ''; });
}).catch(() => {});

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
  localStorage.setItem('mangaShelfTheme', theme);
  if (themeSelect) themeSelect.value = theme;
}

document.querySelector('#openSettings').addEventListener('click', () => settingsDialog.showModal());
document.querySelector('#closeSettings').addEventListener('click', () => settingsDialog.close());
settingsDialog.addEventListener('click', (event) => { if (event.target === settingsDialog) settingsDialog.close(); });
themeSelect.addEventListener('change', () => applyTheme(themeSelect.value));
applyTheme(localStorage.getItem('mangaShelfTheme') || 'current');
function scoresFor(manga) { return manga.ratings?.length ? categories.map((category) => { const score = manga.ratings.find((rating) => rating.category === category)?.score ?? 0; return score > 10 ? score / 2 : score; }) : categories.map(() => 0); }
function averageFor(manga) { return scoresFor(manga).reduce((sum, score) => sum + score, 0) / categories.length; }
function visitorAverageFor(manga) { const ratings = JSON.parse(localStorage.getItem('mangaVisitorRatings') || '{}')[manga.title]?.ratings || []; return ratings.length ? ratings.reduce((sum, score) => sum + score, 0) / ratings.length : null; }
function escapeHtml(value) { return String(value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function render() {
  const query = controls.search.value.trim().toLowerCase();
  const selectedGenres = [...genreCheckboxes.querySelectorAll('input:checked')].map((input) => input.value.toLowerCase());
  genreSelectionCount.textContent = selectedGenres.length ? `${selectedGenres.length} selected` : 'All genres';
  const category = controls.category.value;
  const categoryIndex = categories.indexOf(category);
  const minimum = Number(controls.score.value);
  const visitorMinimum = Number(controls.visitorScore.value);
  const age = controls.date.value === 'all' ? Infinity : Number(controls.date.value);
  const cutoff = age === Infinity ? -Infinity : Date.now() - age * 86400000;
  const matches = allManga.filter((manga) => {
    const scores = scoresFor(manga);
    const created = new Date(manga.createdAt || '2026-09-01').getTime();
    const personalScore = category === 'all' ? averageFor(manga) : scores[categoryIndex];
    const visitorScore = visitorAverageFor(manga);
    const mangaGenres = manga.genre.toLowerCase();
    const genreMatch = !selectedGenres.length || selectedGenres.some((genre) => mangaGenres.includes(genre));
    const viewedMatch = controls.viewed.value === 'all' || Boolean(manga.viewed) === (controls.viewed.value === 'viewed');
    return `${manga.title} ${manga.author}`.toLowerCase().includes(query) && genreMatch && viewedMatch && personalScore >= minimum && (visitorMinimum === 0 || (visitorScore !== null && visitorScore >= visitorMinimum)) && created >= cutoff;
  }).sort((a, b) => {
    const direction = controls.direction.value === 'asc' ? 1 : -1;
    if (controls.sort.value === 'title') return direction * a.title.localeCompare(b.title);
    if (controls.sort.value === 'date') return direction * (new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    if (controls.sort.value === 'visitor') return direction * ((visitorAverageFor(a) || 0) - (visitorAverageFor(b) || 0));
    const aScore = category === 'all' ? averageFor(a) : scoresFor(a)[categoryIndex];
    const bScore = category === 'all' ? averageFor(b) : scoresFor(b)[categoryIndex];
    return direction * (aScore - bScore);
  });
  resultCount.textContent = `${matches.length} result${matches.length === 1 ? '' : 's'}`;
  filterSummary.textContent = selectedGenres.length ? `Genres: ${selectedGenres.join(', ')}` : 'Showing all genres';
  activeFilters.innerHTML = selectedGenres.map((genre) => `<button type="button" class="active-filter" data-genre="${genre}">${genre} ×</button>`).join('');
  activeFilters.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
    const checkbox = [...genreCheckboxes.querySelectorAll('input')].find((input) => input.value.toLowerCase() === button.dataset.genre);
    if (checkbox) checkbox.checked = false;
    render();
  }));
  results.classList.toggle('list-view', controls.view.value === 'list');
  results.innerHTML = matches.map((manga) => {
    const score = category === 'all' ? averageFor(manga) : scoresFor(manga)[categoryIndex];
    const visitorScore = visitorAverageFor(manga);
    const coverSrc = manga.coverImage || manga.cover_image;
    const image = coverSrc ? `<img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(manga.title)} cover" />` : '<span>M</span>';
    const filterUrl = manga.id ? `manga-view.html?id=${encodeURIComponent(manga.id)}&title=${encodeURIComponent(manga.title)}` : `manga-view.html?title=${encodeURIComponent(manga.title)}`;
    return `<a class="filter-result" href="${filterUrl}"><div class="filter-result-cover ${escapeHtml(manga.cover || '')}">${image}</div><div class="filter-result-copy"><strong>${escapeHtml(manga.title)}</strong><p>${escapeHtml(manga.author)} · ${escapeHtml(manga.genre)}</p><small>Created by ${escapeHtml(manga.creatorName || 'MangaShelf')} · ${manga.viewed ? 'Viewed' : 'Unviewed'}</small></div><b class="filter-result-score">${score.toFixed(1)} <small>my score</small><em>${visitorScore === null ? '—' : visitorScore.toFixed(1)} <small>visitors</small></em></b></a>`;
  }).join('') || '<p class="empty-state visible">No manga matches those filters.</p>';
}
genreCheckboxes.addEventListener('change', render);
Object.values(controls).forEach((control) => control.addEventListener('input', render));
document.querySelector('#selectAllGenres').addEventListener('click', () => { genreCheckboxes.querySelectorAll('input').forEach((input) => { input.checked = true; }); render(); });
document.querySelector('#clearGenres').addEventListener('click', () => { genreCheckboxes.querySelectorAll('input').forEach((input) => { input.checked = false; }); render(); });
document.querySelector('#clearFilters').addEventListener('click', () => { controls.search.value = ''; genreCheckboxes.querySelectorAll('input').forEach((input) => { input.checked = false; }); controls.category.value = 'all'; controls.score.value = '0'; controls.visitorScore.value = '0'; controls.date.value = 'all'; controls.sort.value = 'score'; controls.direction.value = 'desc'; controls.view.value = 'grid'; controls.viewed.value = 'all'; render(); });
render();
fetch('/api/manga')
  .then((res) => (res.ok ? res.json() : null))
  .then((response) => {
    if (response?.manga) {
      allManga = response.manga;
      localStorage.setItem('mangaJournalEntries', JSON.stringify(allManga));
      render();
    }
  })
  .catch((err) => console.warn('Could not load manga dynamically in filters:', err));
