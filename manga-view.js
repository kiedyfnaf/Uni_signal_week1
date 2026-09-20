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
const ratingDescriptions = {
  'Visual style': 'How strong and distinctive the manga looks overall.', 'Main cast': 'How compelling and memorable the central characters are.', 'Supporting cast': 'How much the side characters add to the story.', 'Character depth': 'How layered and believable the characters feel.', 'Character chemistry': 'How naturally the characters connect and react to each other.', 'Plot': 'How well the main story is constructed.', 'Pacing': 'How smoothly the story moves from moment to moment.', 'World-building': 'How rich, coherent, and interesting the setting is.', 'Dialogue': 'How natural, sharp, and memorable the conversations are.', 'Humor': 'How effective and enjoyable the funny moments are.', 'Drama': 'How strongly the serious conflicts and stakes land.', 'Emotional impact': 'How deeply the manga makes you feel something.', 'Themes': 'How thoughtfully the larger ideas are explored.', 'Originality': 'How fresh and different the manga feels.', 'Panel composition': 'How well panels guide the eye and tell the story.', 'Action': 'How clear, exciting, and impactful action scenes are.', 'Romance': 'How convincing and satisfying the romantic elements are.', 'Atmosphere': 'How strongly the manga creates a mood.', 'Ending': 'How satisfying and fitting the ending is.', 'Reread value': 'How much the manga rewards returning to it.'
};
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function rankingsFor(title) { const scores = rankingScores[title] || rankingCategories.map((_, index) => Number((7 + ((index * 7) % 29) / 10).toFixed(1))); return rankingCategories.map((category, index) => ({ category, score: scores[index] })); }
const entry = params.has('id') ? entries.find((item) => item.id === params.get('id')) : null;
const title = entry?.title || params.get('title') || 'Manga entry';
const fallback = { title, author: 'Unknown author', genre: 'Personal entry', notes: 'This manga entry is ready for your notes.', tags: [], coverImage: '', panelImages: [] };
const manga = entry || fallback;
const ratings = entry?.ratings?.length ? entry.ratings : rankingsFor(title);
const personalAverage = ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length;
const visitorRatings = JSON.parse(localStorage.getItem('mangaVisitorRatings') || '{}');
const visitorRecord = visitorRatings[title] || { ratings: [] };
const visitorScores = Array.isArray(visitorRecord) ? visitorRecord : (visitorRecord.ratings || []);
const visitorKey = localStorage.getItem('mangaVisitorKey') || (() => { const key = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()); localStorage.setItem('mangaVisitorKey', key); return key; })();
const visitorOwnScore = Array.isArray(visitorRecord) ? null : visitorRecord.byVisitor?.[visitorKey] ?? null;
const visitorAverage = visitorScores.length ? visitorScores.reduce((sum, score) => sum + score, 0) / visitorScores.length : null;
const combinedAverage = visitorAverage === null ? personalAverage : (personalAverage + visitorAverage) / 2;
const cover = manga.coverImage ? `<img class="view-cover" src="${manga.coverImage}" alt="${escapeHtml(title)} front cover" />` : `<div class="view-cover-fallback">M</div>`;
const tags = manga.tags?.length ? `<div class="detail-tags">${manga.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : '';
const panels = manga.panelImages?.length ? `<section class="view-gallery"><p class="eyebrow">Panel gallery</p><div>${manga.panelImages.map((image, index) => `<img src="${image}" alt="${escapeHtml(title)} panel ${index + 1}" />`).join('')}</div></section>` : '';
const links = manga.linkUrl ? `<section class="reference-links"><p class="eyebrow">References</p><a href="${escapeHtml(manga.linkUrl)}" target="_blank" rel="noreferrer">${escapeHtml(manga.linkDescription || manga.linkUrl)} ↗</a></section>` : '';
const chapterMarker = manga.chapter ? `<span class="chapter-marker">Written at ${escapeHtml(manga.chapter)}</span>` : '';
const creatorMarker = manga.creatorName ? ` · Created by ${escapeHtml(manga.creatorName)}` : '';
content.innerHTML = `<section class="view-hero"><div>${cover}</div><div><p class="eyebrow">Manga journal entry</p><h1>${escapeHtml(title)}<span>.</span></h1><p class="view-byline">${escapeHtml(manga.author)} · ${escapeHtml(manga.genre)}${creatorMarker}</p><div class="view-score"><strong>${combinedAverage.toFixed(1)}</strong><span>combined score / 10<br />My score ${personalAverage.toFixed(1)} · Visitors ${visitorAverage === null ? '—' : visitorAverage.toFixed(1)}</span></div>${tags}${links}</div></section><section class="visitor-rating-box"><div><p class="eyebrow">Visitor rating</p><h2>What do you think?</h2><p>Give this manga a score from 0.0 to 10.0. ${visitorOwnScore === null ? '' : `Your current score: ${visitorOwnScore.toFixed(1)} / 10`}</p></div><form id="visitorRatingForm"><input id="visitorScore" type="number" min="0" max="10" step="0.1" value="${visitorOwnScore === null ? '' : visitorOwnScore}" required placeholder="8.5" aria-label="Your score from 0 to 10" /><button class="button button-dark" type="submit">${visitorOwnScore === null ? 'Rate manga' : 'Update rating'}</button></form><span id="visitorRatingStatus" role="status"></span></section><section class="view-layout"><article class="view-notes"><p class="eyebrow">My notes</p><div>${escapeHtml(manga.notes).replace(/\n/g, '<br />')}</div></article><aside class="view-rankings"><div class="panel-heading"><div><p class="eyebrow">Manga ranking</p><h2>20 categories</h2></div><span class="rating-total">${personalAverage.toFixed(1)} / 10</span></div>${ratings.map((rating) => `<div class="view-rating" title="${escapeHtml(ratingDescriptions[rating.category] || 'Personal category score.')}"><span>${escapeHtml(rating.category)} <i>?</i></span><strong>${rating.score.toFixed(1)}</strong><div><i style="width:${rating.score * 10}%"></i></div></div>`).join('')}</aside></section>${panels}`;
if (chapterMarker) document.querySelector('.view-byline').insertAdjacentHTML('beforeend', ` ${chapterMarker}`);
document.querySelector('#visitorRatingForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const score = Number(document.querySelector('#visitorScore').value);
  const savedRatings = JSON.parse(localStorage.getItem('mangaVisitorRatings') || '{}');
  const current = savedRatings[title] && !Array.isArray(savedRatings[title]) ? savedRatings[title] : { ratings: Array.isArray(savedRatings[title]) ? savedRatings[title] : [], byVisitor: {} };
  const previous = current.byVisitor[visitorKey];
  if (previous !== undefined) current.ratings = current.ratings.map((value, index) => value === previous && index === current.ratings.findIndex((item) => item === previous) ? score : value);
  else current.ratings.push(score);
  current.byVisitor[visitorKey] = score;
  savedRatings[title] = current;
  localStorage.setItem('mangaVisitorRatings', JSON.stringify(savedRatings));
  document.querySelector('#visitorRatingStatus').textContent = 'Your rating was saved on this browser.';
  window.setTimeout(() => window.location.reload(), 500);
});
