const content = document.querySelector('#viewContent');
const params = new URLSearchParams(window.location.search);

const ratingGroups = ['Visual style', 'Action', 'Main cast', 'Supporting cast', 'Story', 'World', 'Emotion', 'Craft', 'Experience', 'Identity'];
const rankingCategories = ['Visual style', 'Main cast', 'Supporting cast', 'Character depth', 'Character chemistry', 'Plot', 'Pacing', 'World-building', 'Dialogue', 'Humor', 'Drama', 'Emotional impact', 'Themes', 'Originality', 'Panel composition', 'Action', 'Romance', 'Atmosphere', 'Ending', 'Reread value'];
const rankingScores = {
  Dandadan: [9.2, 9.0, 8.8, 8.7, 9.1, 8.9, 8.6, 8.8, 9.1, 9.4, 8.3, 8.9, 8.6, 9.2, 9.3, 9.1, 7.8, 9.0, 8.5, 9.0],
  'Blue Period': [9.4, 9.3, 8.7, 9.5, 8.9, 8.8, 8.2, 8.7, 9.2, 7.2, 9.5, 9.4, 9.6, 9.0, 9.2, 6.5, 7.5, 9.1, 8.8, 9.4],
  Frieren: [9.5, 9.7, 9.0, 9.6, 9.5, 9.4, 9.0, 9.8, 9.6, 7.5, 9.7, 9.8, 9.7, 9.2, 9.6, 7.8, 8.4, 9.9, 9.4, 9.8],
  'Witch Hat Atelier': [9.8, 9.1, 8.9, 9.0, 8.8, 9.0, 8.5, 9.9, 9.3, 7.8, 8.9, 9.2, 9.3, 9.7, 9.8, 6.9, 7.2, 9.7, 8.4, 9.5],
};
const ratingDescriptions = {
  'Visual style': 'How strong and distinctive the manga looks overall.',
  'Main cast': 'How compelling and memorable the central characters are.',
  'Supporting cast': 'How much the side characters add to the story.',
  'Character depth': 'How layered and believable the characters feel.',
  'Character chemistry': 'How naturally the characters connect and react to each other.',
  'Plot': 'How well the main story is constructed.',
  'Pacing': 'How smoothly the story moves from moment to moment.',
  'World-building': 'How rich, coherent, and interesting the setting is.',
  'Dialogue': 'How natural, sharp, and memorable the conversations are.',
  'Humor': 'How effective and enjoyable the funny moments are.',
  'Drama': 'How strongly the serious conflicts and stakes land.',
  'Emotional impact': 'How deeply the manga makes you feel something.',
  'Themes': 'How thoughtfully the larger ideas are explored.',
  'Originality': 'How fresh and different the manga feels.',
  'Panel composition': 'How well panels guide the eye and tell the story.',
  'Action': 'How clear, exciting, and impactful action scenes are.',
  'Romance': 'How convincing and satisfying the romantic elements are.',
  'Atmosphere': 'How strongly the manga creates a mood.',
  'Ending': 'How satisfying and fitting the ending is.',
  'Reread value': 'How much the manga rewards returning to it.'
};

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function showToast(message) {
  let toast = document.querySelector('.toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

function getSavedFavorites() {
  try { return JSON.parse(localStorage.getItem('mangaSavedFavorites') || '[]'); }
  catch { return []; }
}

function isFavorited(identifier) {
  return getSavedFavorites().includes(identifier);
}

function toggleFavorite(identifier) {
  const list = getSavedFavorites();
  const index = list.indexOf(identifier);
  const nowFavorited = index === -1;
  if (nowFavorited) list.push(identifier);
  else list.splice(index, 1);
  localStorage.setItem('mangaSavedFavorites', JSON.stringify(list));
  return nowFavorited;
}

function rankingsFor(title) {
  const scores = rankingScores[title] || rankingCategories.map((_, index) => Number((7 + ((index * 7) % 29) / 10).toFixed(1)));
  return rankingCategories.map((category, index) => ({ category, score: scores[index] }));
}

async function initView() {
  let user = null;
  try {
    user = await MangaAuth.getUser();
  } catch {
    user = null;
  }

  const requestedId = params.get('id');
  const requestedTitle = params.get('title');

  let entry = null;

  // 1. Try fetching fresh data from API by ID or Title
  const lookupKey = requestedId || requestedTitle;
  if (lookupKey) {
    try {
      const res = await fetch(`/api/manga/${encodeURIComponent(lookupKey)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.manga) entry = json.manga;
      }
    } catch (e) {
      console.warn('Could not fetch single manga from API by key:', e);
    }
  }

  // 2. If single lookup did not return manga, query full /api/manga list
  if (!entry) {
    try {
      const res = await fetch('/api/manga');
      if (res.ok) {
        const json = await res.json();
        const list = json?.manga || [];
        if (requestedId) entry = list.find((item) => item.id === requestedId);
        if (!entry && requestedTitle) {
          const lower = requestedTitle.toLowerCase();
          entry = list.find((item) => item.title && item.title.toLowerCase() === lower);
        }
        if (!entry && !requestedId && !requestedTitle && list.length) {
          entry = list[0];
        }
      }
    } catch (e) {
      console.warn('Could not fetch manga list from API:', e);
    }
  }

  if (requestedTitle && requestedId) {
    // This will format the tab as "Naruto - MangaCave"
    document.title = `${requestedTitle} - MangaCave`; 
  } else {
    // Fallback if the manga isn't found
    document.title = 'Manga Not Found - MangaCave';
  }

  // 3. Fallback to cached entries in localStorage
  if (!entry) {
    const cachedEntries = JSON.parse(localStorage.getItem('mangaJournalEntries') || '[]');
    if (requestedId) entry = cachedEntries.find((item) => item.id === requestedId);
    if (!entry && requestedTitle) entry = cachedEntries.find((item) => item.title.toLowerCase() === requestedTitle.toLowerCase());
    if (!entry && !requestedId && !requestedTitle && cachedEntries.length) entry = cachedEntries[0];
  }

  const title = entry?.title || requestedTitle || 'Manga entry';
  const fallback = {
    title,
    author: 'Unknown author',
    genre: 'Personal entry',
    notes: 'This manga entry is ready for your notes.',
    tags: [],
    coverImage: '',
    panelImages: [],
    viewed: false
  };
  const manga = entry || fallback;
  const mangaIdentifier = manga.id || title;

  // Reading progress state
  const progressKey = `mangaProgress_${mangaIdentifier}`;
  let readingProgress = { status: 'plan_to_read', currentChapter: 1 };
  try {
    const savedProgress = JSON.parse(localStorage.getItem(progressKey));
    if (savedProgress) readingProgress = savedProgress;
  } catch {}

  const ratings = entry?.ratings?.length ? entry.ratings : rankingsFor(title);
  const ratingTotal = ratings.reduce((sum, rating) => sum + rating.score, 0);
  const ratingScale = ratings.length && Math.max(...ratings.map((rating) => rating.score)) > 10 ? 20 : 10;
  const personalAverage = ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length / ratingScale * 10;

  const visitorRatings = JSON.parse(localStorage.getItem('mangaVisitorRatings') || '{}');
  const visitorRecord = visitorRatings[title] || { ratings: [] };
  const visitorScores = Array.isArray(visitorRecord) ? visitorRecord : (visitorRecord.ratings || []);

  const visitorKey = user ? `user_${user.id}` : (localStorage.getItem('mangaVisitorKey') || (() => {
    const key = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    localStorage.setItem('mangaVisitorKey', key);
    return key;
  })());

  const visitorOwnScore = Array.isArray(visitorRecord) ? null : (visitorRecord.byVisitor?.[visitorKey] ?? null);
  const visitorAverage = visitorScores.length ? visitorScores.reduce((sum, score) => sum + score, 0) / visitorScores.length : null;
  const combinedAverage = visitorAverage === null ? personalAverage : (personalAverage + visitorAverage) / 2;

  const coverSrc = manga.coverImage || manga.cover_image;
  const cover = coverSrc
    ? `<img class="view-cover zoomable-image" src="${escapeHtml(coverSrc)}" alt="${escapeHtml(title)} front cover" title="Click to view full photo" />`
    : (manga.cover ? `<div class="cover ${escapeHtml(manga.cover)}"><span class="cover-kicker">MANGA JOURNAL</span><strong>${escapeHtml(title)}</strong><span class="cover-volume">${escapeHtml(manga.chapter || 'VOL. 01')}</span></div>` : `<div class="view-cover-fallback">M</div>`);

  const tags = manga.tags?.length
    ? `<div class="detail-tags">${manga.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>`
    : '';

  const panels = manga.panelImages?.length
    ? `<section class="view-gallery"><p class="eyebrow">Panel gallery (click to view photo)</p><div>${manga.panelImages.map((image, index) => `<img class="zoomable-image" src="${image}" alt="${escapeHtml(title)} panel ${index + 1}" title="Click to view full photo" />`).join('')}</div></section>`
    : '';

  const links = manga.linkUrl
    ? `<section class="reference-links"><p class="eyebrow">References</p><a href="${escapeHtml(manga.linkUrl)}" target="_blank" rel="noreferrer">${escapeHtml(manga.linkDescription || manga.linkUrl)} ↗</a></section>`
    : '';

  const notesAttachment = manga.notesAttachment?.data
    ? `<section class="notes-attachment"><p class="eyebrow">Attached notes</p><a href="${manga.notesAttachment.data}" download="${escapeHtml(manga.notesAttachment.name || 'manga-notes')}">${escapeHtml(manga.notesAttachment.name || 'Open attached notes')} ↗</a><small>${escapeHtml(manga.notesAttachment.type || 'File')}</small></section>`
    : '';

  const chapterMarker = manga.chapter ? `<span class="chapter-marker">Written at ${escapeHtml(manga.chapter)}</span>` : '';
  const creatorMarker = manga.creatorName ? ` · Created by ${escapeHtml(manga.creatorName)}` : '';

  const displayGroups = ratings.some((rating) => rating.group) ? ratingGroups : ['Legacy categories'];
  const ratingMarkup = displayGroups.map((group) => {
    const groupRatings = ratings.filter((rating) => rating.group === group || (!rating.group && group === 'Legacy categories'));
    if (!groupRatings.length) return '';
    const groupTotal = groupRatings.reduce((sum, rating) => sum + rating.score, 0);
    return `<details class="view-rating-group" open><summary><span>${group}</span><strong>${groupTotal} / ${groupRatings.length * ratingScale}</strong></summary>${groupRatings.map((rating) => `<div class="view-rating" title="${escapeHtml(ratingDescriptions[rating.category] || 'Personal category score.')}"><span>${escapeHtml(rating.category.replace(`${group}: `, ''))}</span><strong>${rating.score}</strong><div><i style="width:${rating.score / ratingScale * 100}%"></i></div></div>`).join('')}</details>`;
  }).join('');

  // Viewed button markup
  let isViewed = Boolean(manga.viewed);
  const viewedButtonMarkup = `
    <button id="viewedButton" class="viewed-action-btn ${isViewed ? 'is-viewed' : ''}" type="button" aria-pressed="${isViewed}">
      <span class="viewed-icon">${isViewed ? '✓' : '👁'}</span>
      <span class="viewed-label">${isViewed ? 'Viewed in Journal' : 'Mark as viewed'}</span>
    </button>
  `;

  // Favorite button
  const isFav = isFavorited(mangaIdentifier);
  const favButtonMarkup = `
    <button id="favoriteButton" class="save-action-btn ${isFav ? 'is-saved' : ''}" type="button">
      <span>${isFav ? '♥ Saved to favorites' : '♡ Save to favorites'}</span>
    </button>
  `;

  // Visitor rating section (guarded: visitors must be logged in to review/rate)
  let visitorRatingContent = '';
  if (user) {
    visitorRatingContent = `
      <div>
        <p class="eyebrow">Visitor review score</p>
        <h2>What do you think?</h2>
        <p>Give this manga a score from 0.0 to 10.0 (signed in as <strong>${escapeHtml(user.username)}</strong>). ${visitorOwnScore === null ? '' : `Your current score: <strong>${visitorOwnScore.toFixed(1)} / 10</strong>`}</p>
      </div>
      <form id="visitorRatingForm">
        <input id="visitorScore" type="number" min="0" max="10" step="0.1" value="${visitorOwnScore === null ? '' : visitorOwnScore}" required placeholder="8.5" aria-label="Your score from 0 to 10" />
        <button class="button button-dark" type="submit">${visitorOwnScore === null ? 'Submit rating' : 'Update rating'}</button>
      </form>
      <span id="visitorRatingStatus" role="status"></span>
    `;
  } else {
    visitorRatingContent = `
      <div>
        <p class="eyebrow">Community reviews</p>
        <h2>Reader scores</h2>
        <p>Current visitor score: <strong>${visitorAverage === null ? 'No ratings yet' : visitorAverage.toFixed(1) + ' / 10'}</strong> (${visitorScores.length} review${visitorScores.length === 1 ? '' : 's'}).</p>
      </div>
      <div class="visitor-login-prompt">
        <p>Sign in to submit your score and track your reading journal.</p>
        <a href="login.html?returnTo=${encodeURIComponent(window.location.href)}" class="button button-dark">Sign in to rate</a>
      </div>
    `;
  }

  // Reading status & Chapter Progress card (Suggested & implemented enhancement!)
  const readingProgressCard = `
    <section class="reading-progress-card">
      <div class="reading-controls-group">
        <label style="font: 500 11px 'DM Mono', monospace; text-transform: uppercase; color: #766d64; display: flex; align-items: center; gap: 8px;">
          Status
          <select id="readingStatusSelect" class="reading-status-select">
            <option value="plan_to_read" ${readingProgress.status === 'plan_to_read' ? 'selected' : ''}>Plan to Read</option>
            <option value="reading" ${readingProgress.status === 'reading' ? 'selected' : ''}>Currently Reading</option>
            <option value="completed" ${readingProgress.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="on_hold" ${readingProgress.status === 'on_hold' ? 'selected' : ''}>On Hold</option>
            <option value="dropped" ${readingProgress.status === 'dropped' ? 'selected' : ''}>Dropped</option>
          </select>
        </label>
        <div class="chapter-stepper" title="Current chapter progress">
          <button id="chapterMinusBtn" type="button" aria-label="Previous chapter">−</button>
          <span id="chapterDisplay">Ch. ${readingProgress.currentChapter || 1}</span>
          <button id="chapterPlusBtn" type="button" aria-label="Next chapter">＋</button>
        </div>
      </div>
      <div class="reading-controls-group">
        ${viewedButtonMarkup}
        ${favButtonMarkup}
      </div>
    </section>
  `;

  content.innerHTML = `
    <section class="view-hero">
      <div>${cover}</div>
      <div>
        <p class="eyebrow">Manga journal entry</p>
        <h1>${escapeHtml(title)}<span>.</span></h1>
        <p class="view-byline">${escapeHtml(manga.author)} · ${escapeHtml(manga.genre)}${creatorMarker}</p>
        <div class="view-score">
          <strong>${combinedAverage.toFixed(1)}</strong>
          <span>combined score / 10<br />My score ${personalAverage.toFixed(1)} · Visitors ${visitorAverage === null ? '—' : visitorAverage.toFixed(1)}</span>
        </div>
        ${tags}
        ${links}
      </div>
    </section>
    ${readingProgressCard}
    <section class="visitor-rating-box">${visitorRatingContent}</section>
    <section class="view-layout">
      <article class="view-notes">
        ${notesAttachment}
        <p class="eyebrow">My notes</p>
        <div>${escapeHtml(manga.notes).replace(/\n/g, '<br />')}</div>
      </article>
      <aside class="view-rankings">
        <div class="panel-heading">
          <div><p class="eyebrow">Manga ranking</p><h2>${ratings.length === 50 ? '50 criteria' : `${ratings.length} categories`}</h2></div>
          <span class="rating-total">${ratingTotal} / ${ratings.length * ratingScale * 10}</span>
        </div>
        ${ratingMarkup}
      </aside>
    </section>
    ${panels}
  `;

  if (chapterMarker) {
    document.querySelector('.view-byline')?.insertAdjacentHTML('beforeend', ` ${chapterMarker}`);
  }

  // Handle Mark Viewed button
  const viewedBtn = document.querySelector('#viewedButton');
  viewedBtn?.addEventListener('click', async () => {
    if (!user) {
      showToast('Please sign in to save your personal viewed progress.');
      return;
    }
    if (!manga.id) {
      showToast('This manga is not stored in the database.');
      return;
    }
    const newViewed = !isViewed;
    try {
      viewedBtn.disabled = true;
      await MangaAuth.api(`/api/manga/${encodeURIComponent(manga.id)}/viewed`, {
        method: 'POST',
        body: JSON.stringify({ viewed: newViewed })
      });
      isViewed = newViewed;
      manga.viewed = newViewed;
      viewedBtn.classList.toggle('is-viewed', newViewed);
      viewedBtn.setAttribute('aria-pressed', newViewed);
      viewedBtn.querySelector('.viewed-icon').textContent = newViewed ? '✓' : '👁';
      viewedBtn.querySelector('.viewed-label').textContent = newViewed ? 'Viewed in Journal' : 'Mark as viewed';

      // Update cached entry
      const cached = JSON.parse(localStorage.getItem('mangaJournalEntries') || '[]');
      const match = cached.find((item) => item.id === manga.id);
      if (match) {
        match.viewed = newViewed;
        localStorage.setItem('mangaJournalEntries', JSON.stringify(cached));
      }
      showToast(newViewed ? 'Marked as viewed in your journal!' : 'Marked as unviewed.');
    } catch (err) {
      showToast('Error updating viewed status: ' + err.message);
    } finally {
      viewedBtn.disabled = false;
    }
  });

  // Handle favorite button
  const favBtn = document.querySelector('#favoriteButton');
  favBtn?.addEventListener('click', () => {
    const isNowFav = toggleFavorite(mangaIdentifier);
    favBtn.classList.toggle('is-saved', isNowFav);
    favBtn.querySelector('span').textContent = isNowFav ? '♥ Saved to favorites' : '♡ Save to favorites';
    showToast(isNowFav ? 'Added to your favorites!' : 'Removed from favorites.');
  });

  // Handle Reading Status & Chapter Stepper
  const statusSelect = document.querySelector('#readingStatusSelect');
  const chapterDisplay = document.querySelector('#chapterDisplay');
  const minusBtn = document.querySelector('#chapterMinusBtn');
  const plusBtn = document.querySelector('#chapterPlusBtn');

  function saveProgress() {
    localStorage.setItem(progressKey, JSON.stringify(readingProgress));
  }

  statusSelect?.addEventListener('change', () => {
    readingProgress.status = statusSelect.value;
    saveProgress();
    showToast(`Status updated to ${statusSelect.options[statusSelect.selectedIndex].text}`);
  });

  minusBtn?.addEventListener('click', () => {
    if (readingProgress.currentChapter > 1) {
      readingProgress.currentChapter -= 1;
      chapterDisplay.textContent = `Ch. ${readingProgress.currentChapter}`;
      saveProgress();
    }
  });

  plusBtn?.addEventListener('click', () => {
    readingProgress.currentChapter = (readingProgress.currentChapter || 1) + 1;
    chapterDisplay.textContent = `Ch. ${readingProgress.currentChapter}`;
    saveProgress();
  });

  // Handle Visitor Rating Form (only exists for logged in users)
  const ratingForm = document.querySelector('#visitorRatingForm');
  if (ratingForm) {
    ratingForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const score = Number(document.querySelector('#visitorScore').value);
      const savedRatings = JSON.parse(localStorage.getItem('mangaVisitorRatings') || '{}');
      const current = savedRatings[title] && !Array.isArray(savedRatings[title])
        ? savedRatings[title]
        : { ratings: Array.isArray(savedRatings[title]) ? savedRatings[title] : [], byVisitor: {} };

      const previous = current.byVisitor[visitorKey];
      if (previous !== undefined) {
        current.ratings = current.ratings.map((value, index) =>
          value === previous && index === current.ratings.findIndex((item) => item === previous) ? score : value
        );
      } else {
        current.ratings.push(score);
      }
      current.byVisitor[visitorKey] = score;
      savedRatings[title] = current;
      localStorage.setItem('mangaVisitorRatings', JSON.stringify(savedRatings));
      showToast('Your rating has been saved!');
      window.setTimeout(() => window.location.reload(), 600);
    });
  }

  // Handle Image Lightbox Modal for Cover & Gallery photos
  function openPhotoModal(src, caption) {
    let modal = document.querySelector('#photoModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'photoModal';
      modal.className = 'photo-modal-overlay';
      modal.innerHTML = `
        <div class="photo-modal-card">
          <button type="button" class="photo-modal-close" aria-label="Close photo">×</button>
          <img id="photoModalImg" src="" alt="Full view" />
          <p id="photoModalCaption" class="photo-modal-caption"></p>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector('.photo-modal-close').addEventListener('click', () => modal.classList.remove('active'));
      modal.addEventListener('click', (event) => {
        if (event.target === modal) modal.classList.remove('active');
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('active')) {
          modal.classList.remove('active');
        }
      });
    }
    const modalImg = modal.querySelector('#photoModalImg');
    const modalCap = modal.querySelector('#photoModalCaption');
    if (modalImg) modalImg.src = src;
    if (modalCap) modalCap.textContent = caption || '';
    modal.classList.add('active');
  }

  content.querySelectorAll('.zoomable-image').forEach((img) => {
    img.addEventListener('click', () => {
      openPhotoModal(img.src, `${title} · ${img.alt || 'Photo view'}`);
    });
  });
}

initView();
