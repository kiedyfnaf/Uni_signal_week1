const form = document.querySelector('#mangaEditorForm');
const notes = document.querySelector('#notes');
const wordCount = document.querySelector('#wordCount');
const tagInput = document.querySelector('#tagInput');
const tagList = document.querySelector('#tagList');
const tagsValue = document.querySelector('#tagsValue');
const saveStatus = document.querySelector('#saveStatus');
const coverImage = document.querySelector('#coverImage');
const panelImages = document.querySelector('#panelImages');
const coverPreview = document.querySelector('#coverPreview');
const panelPreview = document.querySelector('#panelPreview');
const genreSelect = document.querySelector('#genreSelect');
let coverImageData = '';
let panelImageData = [];
const rankingCategories = ['Visual style', 'Main cast', 'Supporting cast', 'Character depth', 'Character chemistry', 'Plot', 'Pacing', 'World-building', 'Dialogue', 'Humor', 'Drama', 'Emotional impact', 'Themes', 'Originality', 'Panel composition', 'Action', 'Romance', 'Atmosphere', 'Ending', 'Reread value'];
const draftId = new URLSearchParams(window.location.search).get('draft');


function updateWordCount() {
  const words = notes.value.trim() ? notes.value.trim().split(/\s+/).length : 0;
  wordCount.textContent = `${words.toLocaleString()} ${words === 1 ? 'word' : 'words'}`;
}

function updateTags() {
  const tags = [...tagList.querySelectorAll('.tag-chip')].map((tag) => tag.dataset.tag);
  tagsValue.value = JSON.stringify(tags);
}

function addTag(value) {
  const tag = value.trim().replace(/\s+/g, ' ');
  const existingTags = [...tagList.querySelectorAll('.tag-chip')].map((item) => item.dataset.tag.toLowerCase());
  if (!tag || existingTags.includes(tag.toLowerCase())) return;
  const chip = document.createElement('span');
  chip.className = 'tag-chip';
  chip.dataset.tag = tag;
  chip.innerHTML = `<span>${tag}</span><button type="button" aria-label="Remove ${tag}">×</button>`;
  chip.querySelector('button').addEventListener('click', () => {
    chip.remove();
    updateTags();
  });
  tagList.append(chip);
  updateTags();
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', reject);
    reader.readAsDataURL(file);
  });
}

function renderImagePreviews() {
  coverPreview.innerHTML = coverImageData ? `<img src="${coverImageData}" alt="Selected front cover preview" />` : '';
  panelPreview.innerHTML = panelImageData.map((image, index) => `<div class="panel-thumb"><img src="${image}" alt="Selected manga panel ${index + 1}" /><button type="button" data-panel-index="${index}" aria-label="Remove panel ${index + 1}">×</button></div>`).join('');
  panelPreview.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      panelImageData.splice(Number(button.dataset.panelIndex), 1);
      renderImagePreviews();
    });
  });
}

function addRatingRows() {
  const ratingList = document.querySelector('#ratingList');
  rankingCategories.forEach((category) => {
    const row = document.createElement('label');
    row.className = 'rating-row';
    row.innerHTML = `<span>${category}</span><input class="rating-number" data-category="${category}" type="number" min="0" max="10" step="0.1" value="0" aria-label="${category} score" /><small>/ 10</small>`;
    row.querySelector('input').addEventListener('input', updateRatingTotal);
    ratingList.append(row);
  });
}

function updateRatingTotal() {
  const values = [...document.querySelectorAll('.rating-number')].map((input) => Number(input.value));
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  document.querySelector('#ratingTotal').textContent = `${average.toFixed(1)} / 10`;
}

function restoreDraft() {
  if (!draftId) return;
  const draft = JSON.parse(localStorage.getItem('mangaJournalDrafts') || '[]').find((item) => item.id === draftId);
  if (!draft) return;
  form.elements.title.value = draft.title || '';
  form.elements.author.value = draft.author || '';
  [...genreSelect.options].forEach((option) => { option.selected = (draft.genre || '').split(' / ').includes(option.value); });
  form.elements.cover.value = draft.cover || 'cover-witch';
  form.elements.linkUrl.value = draft.linkUrl || '';
  form.elements.linkDescription.value = draft.linkDescription || '';
  notes.value = draft.notes || '';
  (draft.tags || []).forEach(addTag);
  coverImageData = draft.coverImage || '';
  panelImageData = draft.panelImages || [];
  renderImagePreviews();
  (draft.ratings || []).forEach((rating) => {
    const input = document.querySelector(`.rating-number[data-category="${CSS.escape(rating.category)}"]`);
    if (input) input.value = rating.score;
  });
}

notes.addEventListener('input', updateWordCount);
addRatingRows();
restoreDraft();
tagInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault();
    addTag(tagInput.value.replace(',', ''));
    tagInput.value = '';
  }
});
coverImage.addEventListener('change', async () => {
  coverImageData = coverImage.files[0] ? await readImage(coverImage.files[0]) : '';
  renderImagePreviews();
});
panelImages.addEventListener('change', async () => {
  const selectedImages = await Promise.all([...panelImages.files].map(readImage));
  panelImageData = [...panelImageData, ...selectedImages];
  renderImagePreviews();
  panelImages.value = '';
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const saveMode = event.submitter?.value || 'entry';
  const ratings = [...document.querySelectorAll('.rating-number')].map((input) => ({ category: input.dataset.category, score: Number(input.value) }));
  const entry = {
    id: draftId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    title: data.get('title').trim(),
    author: data.get('author').trim(),
    genre: [...genreSelect.selectedOptions].map((option) => option.value).join(' / '),
    linkUrl: data.get('linkUrl').trim(),
    linkDescription: data.get('linkDescription').trim(),
    cover: data.get('cover'),
    tags: JSON.parse(tagsValue.value || '[]'),
    notes: data.get('notes'),
    coverImage: coverImageData,
    panelImages: panelImageData,
    ratings,
    createdAt: new Date().toISOString(),
  };
  const storageKey = saveMode === 'draft' ? 'mangaJournalDrafts' : 'mangaJournalEntries';
  const savedItems = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const existingIndex = savedItems.findIndex((item) => item.id === entry.id);
  if (existingIndex >= 0) savedItems[existingIndex] = entry;
  else savedItems.unshift(entry);
  localStorage.setItem(storageKey, JSON.stringify(savedItems));
  if (saveMode === 'entry' && draftId) {
    const remainingDrafts = JSON.parse(localStorage.getItem('mangaJournalDrafts') || '[]').filter((item) => item.id !== draftId);
    localStorage.setItem('mangaJournalDrafts', JSON.stringify(remainingDrafts));
  }
  saveStatus.textContent = saveMode === 'draft' ? 'Draft saved. Opening drafts...' : 'Entry saved. Returning to your journal...';
  window.setTimeout(() => { window.location.href = saveMode === 'draft' ? 'drafts.html' : 'index.html'; }, 500);
});

updateWordCount();
updateRatingTotal();
