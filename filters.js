const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Science fiction', 'Slice of life', 'Sports', 'Supernatural'];
const sampleManga = [
  { title: 'Dandadan', author: 'Yukinobu Tatsu', genre: 'Action / Supernatural', score: 8.9 },
  { title: 'Blue Period', author: 'Tsubasa Yamaguchi', genre: 'Drama / Art', score: 8.8 },
  { title: 'Frieren', author: 'Kanehito Yamada', genre: 'Fantasy / Adventure', score: 9.3 },
  { title: 'Witch Hat Atelier', author: 'Kamome Shirahama', genre: 'Fantasy / Magic', score: 9.1 },
];
const saved = JSON.parse(localStorage.getItem('mangaJournalEntries') || '[]').map((entry) => ({ title: entry.title, author: entry.author, genre: entry.genre, score: 8.5 }));
const allManga = [...sampleManga, ...saved];
const genreSelect = document.querySelector('#filterGenre');
genres.forEach((genre) => genreSelect.insertAdjacentHTML('beforeend', `<option>${genre}</option>`));
const search = document.querySelector('#filterSearch');
const score = document.querySelector('#filterScore');
const view = document.querySelector('#filterView');
const results = document.querySelector('#filterResults');
const resultCount = document.querySelector('#resultCount');
function render() {
  const query = search.value.trim().toLowerCase();
  const selectedGenre = genreSelect.value;
  const minimum = Number(score.value);
  const matches = allManga.filter((manga) => `${manga.title} ${manga.author}`.toLowerCase().includes(query) && (selectedGenre === 'all' || manga.genre.toLowerCase().includes(selectedGenre.toLowerCase())) && manga.score >= minimum);
  resultCount.textContent = `${matches.length} result${matches.length === 1 ? '' : 's'}`;
  results.classList.toggle('list-view', view.value === 'list');
  results.innerHTML = matches.map((manga) => `<a class="filter-result" href="manga-view.html?title=${encodeURIComponent(manga.title)}"><div class="filter-result-cover">M</div><div><strong>${manga.title}</strong><p>${manga.author} · ${manga.genre}</p></div><b>${manga.score.toFixed(1)} <small>/ 10</small></b></a>`).join('') || '<p class="empty-state visible">No manga matches those filters.</p>';
}
[search, genreSelect, score, view].forEach((control) => control.addEventListener('input', render));
document.querySelector('#clearFilters').addEventListener('click', () => { search.value = ''; genreSelect.value = 'all'; score.value = '0'; view.value = 'grid'; render(); });
render();
