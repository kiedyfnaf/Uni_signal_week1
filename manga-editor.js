const form = document.querySelector('#mangaEditorForm');
const notes = document.querySelector('#notes');
const wordCount = document.querySelector('#wordCount');
const tagInput = document.querySelector('#tagInput');
const tagList = document.querySelector('#tagList');
const tagsValue = document.querySelector('#tagsValue');
const ratingList = document.querySelector('#ratingList');
const ratingTotal = document.querySelector('#ratingTotal');
const saveStatus = document.querySelector('#saveStatus');

const defaultRatings = ['Story', 'Characters', 'Art', 'World-building', 'Emotional impact'];

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

function updateRatingTotal() {
  const values = [...ratingList.querySelectorAll('input[type="number"]')]
    .map((input) => Number(input.value))
    .filter((value) => Number.isFinite(value));
  if (!values.length) {
    ratingTotal.textContent = '— / 10';
    return;
  }
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  ratingTotal.textContent = `${average.toFixed(1)} / 10`;
}

function addRatingRow(name = '') {
  const row = document.createElement('div');
  row.className = 'rating-row';
  row.innerHTML = `<input class="rating-name" type="text" value="${name}" placeholder="Category name" aria-label="Rating category" required /><input class="rating-number" type="number" min="0" max="10" step="0.1" value="0" aria-label="Score from 0 to 10" required /><span>/ 10</span><button class="remove-row" type="button" aria-label="Remove rating category">×</button>`;
  row.querySelector('.rating-number').addEventListener('input', updateRatingTotal);
  row.querySelector('.remove-row').addEventListener('click', () => {
    row.remove();
    updateRatingTotal();
  });
  ratingList.append(row);
}

defaultRatings.forEach((rating) => addRatingRow(rating));
notes.addEventListener('input', updateWordCount);
tagInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault();
    addTag(tagInput.value.replace(',', ''));
    tagInput.value = '';
  }
});
document.querySelector('#addRating').addEventListener('click', () => addRatingRow());

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const ratings = [...ratingList.querySelectorAll('.rating-row')].map((row) => ({
    category: row.querySelector('.rating-name').value.trim(),
    score: Number(row.querySelector('.rating-number').value),
  })).filter((rating) => rating.category);
  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title: data.get('title').trim(),
    author: data.get('author').trim(),
    genre: data.get('genre').trim(),
    cover: data.get('cover'),
    tags: JSON.parse(tagsValue.value || '[]'),
    notes: data.get('notes'),
    ratings,
    createdAt: new Date().toISOString(),
  };
  const entries = JSON.parse(localStorage.getItem('mangaJournalEntries') || '[]');
  entries.unshift(entry);
  localStorage.setItem('mangaJournalEntries', JSON.stringify(entries));
  saveStatus.textContent = 'Saved locally. Returning to your journal...';
  window.setTimeout(() => { window.location.href = 'index.html'; }, 500);
});

updateWordCount();
updateRatingTotal();
