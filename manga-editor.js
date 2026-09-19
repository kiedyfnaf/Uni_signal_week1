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
let coverImageData = '';
let panelImageData = [];


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

notes.addEventListener('input', updateWordCount);
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
  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title: data.get('title').trim(),
    author: data.get('author').trim(),
    genre: data.get('genre').trim(),
    cover: data.get('cover'),
    tags: JSON.parse(tagsValue.value || '[]'),
    notes: data.get('notes'),
    coverImage: coverImageData,
    panelImages: panelImageData,
    createdAt: new Date().toISOString(),
  };
  const entries = JSON.parse(localStorage.getItem('mangaJournalEntries') || '[]');
  entries.unshift(entry);
  localStorage.setItem('mangaJournalEntries', JSON.stringify(entries));
  saveStatus.textContent = 'Saved locally. Returning to your journal...';
  window.setTimeout(() => { window.location.href = 'index.html'; }, 500);
});

updateWordCount();
