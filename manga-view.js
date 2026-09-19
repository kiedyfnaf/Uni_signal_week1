const content = document.querySelector('#viewContent');
const params = new URLSearchParams(window.location.search);
const entries = JSON.parse(localStorage.getItem('mangaJournalEntries') || '[]');
const rankingCategories = ['Visual style', 'Main cast', 'Supporting cast', 'Character depth', 'Character chemistry', 'Plot', 'Pacing', 'World-building', 'Dialogue', 'Humor', 'Drama', 'Emotional impact', 'Themes', 'Originality', 'Panel composition', 'Action', 'Romance', 'Atmosphere', 'Ending', 'Reread value'];
const rankingScores = {
  Dandadan: [9.2, 9.0, 8.8, 8.7, 9.1, 8.9, 8.6, 8.8, 9.1, 9.4, 8.3, 8.9, 8.6, 9.2, 9.3, 9.1, 7.8, 9.0, 8.5, 9.0],
  'Blue Period': [9.4, 9.3, 8.7, 9.5, 8.9, 8.8, 8.2, 8.7, 9.2, 7.2, 9.5, 9.4, 9.6, 9.0, 9.2, 6.5, 7.5, 9.1, 8.8, 9.4],
  Frieren: [9.5, 9.7, 9.0, 9.6, 9.5, 9.4, 9.0, 9.8, 9.6, 7.5, 9.7, 9.8, 9.7, 9.2, 9.6, 7.8, 8.4, 9.9, 9.4, 9.8],
  'Witch Hat Atelier': [9.8, 9.1, 8.9, 9.0, 8.8, 9.0, 8.5, 9.9, 9.3, 7.8, 8.9, 9.2, 9.3, 9.7, 9.8, 6.9, 7.2, 9.7, 8.4, 9.5],
};
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function rankingsFor(title) { const scores = rankingScores[title] || rankingCategories.map((_, index) => Number((7 + ((index * 7) % 29) / 10).toFixed(1))); return rankingCategories.map((category, index) => ({ category, score: scores[index] })); }
const entry = params.has('id') ? entries.find((item) => item.id === params.get('id')) : null;
const title = entry?.title || params.get('title') || 'Manga entry';
const fallback = { title, author: 'Unknown author', genre: 'Personal entry', notes: 'This manga entry is ready for your notes.', tags: [], coverImage: '', panelImages: [] };
const manga = entry || fallback;
const ratings = rankingsFor(title);
const average = ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length;
const cover = manga.coverImage ? `<img class="view-cover" src="${manga.coverImage}" alt="${escapeHtml(title)} front cover" />` : `<div class="view-cover-fallback">M</div>`;
const tags = manga.tags?.length ? `<div class="detail-tags">${manga.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : '';
const panels = manga.panelImages?.length ? `<section class="view-gallery"><p class="eyebrow">Panel gallery</p><div>${manga.panelImages.map((image, index) => `<img src="${image}" alt="${escapeHtml(title)} panel ${index + 1}" />`).join('')}</div></section>` : '';
content.innerHTML = `<section class="view-hero"><div>${cover}</div><div><p class="eyebrow">Manga journal entry</p><h1>${escapeHtml(title)}<span>.</span></h1><p class="view-byline">${escapeHtml(manga.author)} · ${escapeHtml(manga.genre)}</p><div class="view-score"><strong>${average.toFixed(1)}</strong><span>/ 10 average rating<br />20 fixed categories</span></div>${tags}</div></section><section class="view-layout"><article class="view-notes"><p class="eyebrow">My notes</p><div>${escapeHtml(manga.notes).replace(/\n/g, '<br />')}</div></article><aside class="view-rankings"><div class="panel-heading"><div><p class="eyebrow">Manga ranking</p><h2>20 categories</h2></div><span class="rating-total">${average.toFixed(1)} / 10</span></div>${ratings.map((rating) => `<div class="view-rating"><span>${escapeHtml(rating.category)}</span><strong>${rating.score.toFixed(1)}</strong><div><i style="width:${rating.score * 10}%"></i></div></div>`).join('')}</aside></section>${panels}`;
