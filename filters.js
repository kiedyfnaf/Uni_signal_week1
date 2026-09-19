const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Science fiction', 'Slice of life', 'Sports', 'Supernatural'];
const categories = ['Visual style', 'Main cast', 'Supporting cast', 'Character depth', 'Character chemistry', 'Plot', 'Pacing', 'World-building', 'Dialogue', 'Humor', 'Drama', 'Emotional impact', 'Themes', 'Originality', 'Panel composition', 'Action', 'Romance', 'Atmosphere', 'Ending', 'Reread value'];
const rankingScores = { Dandadan: [9.2, 9, 8.8, 8.7, 9.1, 8.9, 8.6, 8.8, 9.1, 9.4, 8.3, 8.9, 8.6, 9.2, 9.3, 9.1, 7.8, 9, 8.5, 9], 'Blue Period': [9.4, 9.3, 8.7, 9.5, 8.9, 8.8, 8.2, 8.7, 9.2, 7.2, 9.5, 9.4, 9.6, 9, 9.2, 6.5, 7.5, 9.1, 8.8, 9.4], Frieren: [9.5, 9.7, 9, 9.6, 9.5, 9.4, 9, 9.8, 9.6, 7.5, 9.7, 9.8, 9.7, 9.2, 9.6, 7.8, 8.4, 9.9, 9.4, 9.8], 'Witch Hat Atelier': [9.8, 9.1, 8.9, 9, 8.8, 9, 8.5, 9.9, 9.3, 7.8, 8.9, 9.2, 9.3, 9.7, 9.8, 6.9, 7.2, 9.7, 8.4, 9.5] };
const sampleManga = [
  { title: 'Dandadan', author: 'Yukinobu Tatsu', genre: 'Action / Supernatural', createdAt: '2026-09-19', cover: 'cover-dandadan' },
  { title: 'Blue Period', author: 'Tsubasa Yamaguchi', genre: 'Drama / Art', createdAt: '2026-09-18', cover: 'cover-blue' },
  { title: 'Frieren', author: 'Kanehito Yamada', genre: 'Fantasy / Adventure', createdAt: '2026-09-17', cover: 'cover-frieren' },
  { title: 'Witch Hat Atelier', author: 'Kamome Shirahama', genre: 'Fantasy / Magic', createdAt: '2026-09-16', cover: 'cover-witch' },
];
const allManga = [...sampleManga, ...JSON.parse(localStorage.getItem('mangaJournalEntries') || '[]')];
const genreSelect = document.querySelector('#filterGenre');
const categorySelect = document.querySelector('#filterCategory');
genres.forEach((genre) => genreSelect.insertAdjacentHTML('beforeend', `<option>${genre}</option>`));
categories.forEach((category) => categorySelect.insertAdjacentHTML('beforeend', `<option>${category}</option>`));
const controls = { search: document.querySelector('#filterSearch'), genre: genreSelect, category: categorySelect, score: document.querySelector('#filterScore'), date: document.querySelector('#filterDate'), sort: document.querySelector('#filterSort'), direction: document.querySelector('#filterDirection'), view: document.querySelector('#filterView') };
const results = document.querySelector('#filterResults');
const resultCount = document.querySelector('#resultCount');
const filterSummary = document.querySelector('#filterSummary');
function scoresFor(manga) { return manga.ratings?.length ? categories.map((category) => manga.ratings.find((rating) => rating.category === category)?.score ?? 0) : rankingScores[manga.title] || categories.map((_, index) => Number((7 + ((index * 7) % 29) / 10).toFixed(1))); }
function averageFor(manga) { return scoresFor(manga).reduce((sum, score) => sum + score, 0) / categories.length; }
function escapeHtml(value) { return String(value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function render() {
  const query = controls.search.value.trim().toLowerCase();
  const selectedGenre = controls.genre.value.toLowerCase();
  const category = controls.category.value;
  const categoryIndex = categories.indexOf(category);
  const minimum = Number(controls.score.value);
  const age = controls.date.value === 'all' ? Infinity : Number(controls.date.value);
  const cutoff = age === Infinity ? -Infinity : Date.now() - age * 86400000;
  const matches = allManga.filter((manga) => { const scores = scoresFor(manga); const created = new Date(manga.createdAt || '2026-09-01').getTime(); const selectedScore = category === 'all' ? averageFor(manga) : scores[categoryIndex]; return `${manga.title} ${manga.author}`.toLowerCase().includes(query) && (selectedGenre === 'all' || manga.genre.toLowerCase().includes(selectedGenre)) && selectedScore >= minimum && created >= cutoff; }).sort((a, b) => { const direction = controls.direction.value === 'asc' ? 1 : -1; if (controls.sort.value === 'title') return direction * a.title.localeCompare(b.title); if (controls.sort.value === 'date') return direction * (new Date(a.createdAt || 0) - new Date(b.createdAt || 0)); const aScore = category === 'all' ? averageFor(a) : scoresFor(a)[categoryIndex]; const bScore = category === 'all' ? averageFor(b) : scoresFor(b)[categoryIndex]; return direction * (aScore - bScore); });
  resultCount.textContent = `${matches.length} result${matches.length === 1 ? '' : 's'}`;
  filterSummary.textContent = category === 'all' ? 'Sorted by overall average' : `Sorted by ${category}`;
  results.classList.toggle('list-view', controls.view.value === 'list');
  results.innerHTML = matches.map((manga) => { const score = category === 'all' ? averageFor(manga) : scoresFor(manga)[categoryIndex]; const image = manga.coverImage ? `<img src="${manga.coverImage}" alt="${escapeHtml(manga.title)} cover" />` : '<span>M</span>'; return `<a class="filter-result" href="manga-view.html?title=${encodeURIComponent(manga.title)}"><div class="filter-result-cover ${escapeHtml(manga.cover || '')}">${image}</div><div><strong>${escapeHtml(manga.title)}</strong><p>${escapeHtml(manga.author)} · ${escapeHtml(manga.genre)}</p><small>Added ${new Date(manga.createdAt || '2026-09-01').toLocaleDateString()}</small></div><b>${score.toFixed(1)} <small>/ 10</small></b></a>`; }).join('') || '<p class="empty-state visible">No manga matches those filters.</p>';
}
Object.values(controls).forEach((control) => control.addEventListener('input', render));
document.querySelector('#clearFilters').addEventListener('click', () => { Object.assign(controls.search, { value: '' }); controls.genre.value = 'all'; controls.category.value = 'all'; controls.score.value = '0'; controls.date.value = 'all'; controls.sort.value = 'score'; controls.direction.value = 'desc'; controls.view.value = 'grid'; render(); });
render();
