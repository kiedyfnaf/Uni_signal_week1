document.body.hidden = true;
MangaAuth.requireAdmin().then(() => { document.body.hidden = false; }).catch(() => {});

const form = document.querySelector('#mangaEditorForm');
const notes = document.querySelector('#notes');
const wordCount = document.querySelector('#wordCount');
const tagInput = document.querySelector('#tagInput');
const tagList = document.querySelector('#tagList');
const tagsValue = document.querySelector('#tagsValue');
const saveStatus = document.querySelector('#saveStatus');
const coverImage = document.querySelector('#coverImage');
const panelImages = document.querySelector('#panelImages');
const notesAttachment = document.querySelector('#notesAttachment');
const notesAttachmentPreview = document.querySelector('#notesAttachmentPreview');
const coverPreview = document.querySelector('#coverPreview');
const panelPreview = document.querySelector('#panelPreview');
const genreSelect = document.querySelector('#genreSelect');
let coverImageData = '';
let panelImageData = [];
const ratingGroups = {
  'Visual style': ['Originality', 'Detail', 'Clothes', 'Facial expressions', 'Panel composition'],
  'Action': ['Fighting movement', 'Choreography', 'Impact', 'Clarity', 'Tension'],
  'Main cast': ['Protagonist', 'Character depth', 'Character arc', 'Motivation', 'Memorability'],
  'Supporting cast': ['Variety', 'Chemistry', 'Character depth', 'Relationships', 'Memorability'],
  'Story': ['Plot', 'Pacing', 'Dialogue', 'Structure', 'Ending'],
  'World': ['World-building', 'Setting detail', 'Internal logic', 'Atmosphere', 'Immersion'],
  'Emotion': ['Drama', 'Humor', 'Romance', 'Emotional impact', 'Themes'],
  'Craft': ['Panel flow', 'Composition', 'Use of space', 'Visual storytelling', 'Consistency'],
  'Experience': ['Reread value', 'Surprise', 'Accessibility', 'Balance', 'Enjoyment'],
  'Identity': ['Originality', 'Tone', 'Voice', 'Ambition', 'Lasting impression'],
};
const ratingCategories = Object.entries(ratingGroups).flatMap(([group, categories]) => categories.map((category) => ({ group, category })));
const draftId = new URLSearchParams(window.location.search).get('draft');
let notesAttachmentData = {};

form.addEventListener('invalid', () => {
  saveStatus.textContent = 'Complete the required title, author, and notes fields before saving the manga entry.';
}, true);

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
    reader.addEventListener('load', () => {
      const rawDataUrl = reader.result;
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    });
    reader.addEventListener('error', reject);
    reader.readAsDataURL(file);
  });
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve({ name: file.name, type: file.type || 'application/octet-stream', data: reader.result }));
    reader.addEventListener('error', reject);
    reader.readAsDataURL(file);
  });
}

function renderNotesAttachment() {
  notesAttachmentPreview.innerHTML = notesAttachmentData.data
    ? `<span>${notesAttachmentData.name}</span><button type="button" id="removeNotesAttachment" aria-label="Remove notes attachment">×</button>`
    : '';
  document.querySelector('#removeNotesAttachment')?.addEventListener('click', () => {
    notesAttachmentData = {};
    notesAttachment.value = '';
    renderNotesAttachment();
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
  Object.entries(ratingGroups).forEach(([group, categories], groupIndex) => {
    const section = document.createElement('details');
    section.className = 'rating-group';
    section.open = groupIndex === 0;
    section.innerHTML = `<summary><span>${group}</span><strong>0 / 100</strong></summary><div class="rating-group-rows"></div>`;
    const rows = section.querySelector('.rating-group-rows');
    categories.forEach((category) => {
      const key = `${group}: ${category}`;
      const row = document.createElement('label');
      row.className = 'rating-row';
      row.innerHTML = `<span>${category}</span><input class="rating-number" data-group="${group}" data-category="${key}" type="number" min="0" max="20" step="1" value="0" aria-label="${key} score" /><small>/ 20</small>`;
      row.querySelector('input').addEventListener('input', () => { updateRatingTotal(); updateGroupTotal(section); });
      rows.append(row);
    });
    ratingList.append(section);
  });
}

function updateGroupTotal(section) {
  const total = [...section.querySelectorAll('.rating-number')].reduce((sum, input) => sum + Number(input.value), 0);
  section.querySelector('summary strong').textContent = `${total} / 100`;
}

function updateRatingTotal() {
  const values = [...document.querySelectorAll('.rating-number')].map((input) => Number(input.value));
  const total = values.reduce((sum, value) => sum + value, 0);
  document.querySelector('#ratingTotal').textContent = `${total} / 1000`;
  document.querySelectorAll('.rating-group').forEach(updateGroupTotal);
}

function restoreDraft() {
  if (!draftId) return;
  const draft = JSON.parse(localStorage.getItem('mangaJournalDrafts') || '[]').find((item) => item.id === draftId);
  if (!draft) return;
  form.elements.title.value = draft.title || '';
  form.elements.author.value = draft.author || '';
  [...genreSelect.options].forEach((option) => { option.selected = (draft.genre || '').split(' / ').includes(option.value); });
  form.elements.cover.value = draft.cover || 'cover-witch';
  form.elements.chapter.value = draft.chapter || '';
  form.elements.linkUrl.value = draft.linkUrl || '';
  form.elements.linkDescription.value = draft.linkDescription || '';
  notes.value = draft.notes || '';
  (draft.tags || []).forEach(addTag);
  coverImageData = draft.coverImage || '';
  panelImageData = draft.panelImages || [];
  notesAttachmentData = draft.notesAttachment || {};
  renderImagePreviews();
  renderNotesAttachment();
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
notesAttachment.addEventListener('change', async () => {
  const file = notesAttachment.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    saveStatus.textContent = 'The notes attachment must be 5 MB or smaller.';
    notesAttachment.value = '';
    return;
  }
  notesAttachmentData = await readFile(file);
  renderNotesAttachment();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const saveMode = event.submitter?.value || 'entry';
  const ratings = [...document.querySelectorAll('.rating-number')].map((input) => ({ group: input.dataset.group, category: input.dataset.category, score: Number(input.value) }));
  const entry = {
    id: draftId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    title: data.get('title').trim(),
    author: data.get('author').trim(),
    genre: [...genreSelect.selectedOptions].map((option) => option.value).join(' / '),
    linkUrl: data.get('linkUrl').trim(),
    linkDescription: data.get('linkDescription').trim(),
    cover: data.get('cover'),
    chapter: data.get('chapter').trim(),
    tags: JSON.parse(tagsValue.value || '[]'),
    notes: data.get('notes'),
    notesAttachment: notesAttachmentData,
    coverImage: coverImageData,
    panelImages: panelImageData,
    ratings,
    createdAt: new Date().toISOString(),
  };
  if (saveMode === 'entry') {
    saveStatus.textContent = 'Saving manga...';
    try {
      await MangaAuth.api('/api/manga', { method: 'POST', body: JSON.stringify({ ...entry, linkUrl: entry.linkUrl, linkDescription: entry.linkDescription }) });
      saveStatus.textContent = 'Entry saved. Returning to your journal...';
      window.setTimeout(() => { window.location.href = 'index.html'; }, 500);
    } catch (error) {
      saveStatus.textContent = error.message;
    }
    return;
  }
  const storageKey = 'mangaJournalDrafts';
  const savedItems = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const existingIndex = savedItems.findIndex((item) => item.id === entry.id);
  if (existingIndex >= 0) savedItems[existingIndex] = entry;
  else savedItems.unshift(entry);
  localStorage.setItem(storageKey, JSON.stringify(savedItems));
  saveStatus.textContent = 'Draft saved. Opening drafts...';
  window.setTimeout(() => { window.location.href = 'drafts.html'; }, 500);
});

updateWordCount();
updateRatingTotal();
