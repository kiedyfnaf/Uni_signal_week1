const searchInput = document.querySelector('#searchInput');
const cards = [...document.querySelectorAll('.manga-card')];
const emptyState = document.querySelector('#emptyState');
const postDialog = document.querySelector('#postDialog');
const postForm = document.querySelector('#postForm');

function filterManga() {
  const query = searchInput.value.trim().toLowerCase();
  let visibleCards = 0;
  cards.forEach((card) => {
    const searchableText = `${card.dataset.title} ${card.dataset.author} ${card.dataset.genre}`.toLowerCase();
    const matches = searchableText.includes(query);
    card.hidden = !matches;
    if (matches) visibleCards += 1;
  });
  emptyState.style.display = visibleCards ? 'none' : 'block';
}

searchInput.addEventListener('input', filterManga);
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && document.activeElement !== searchInput) {
    event.preventDefault();
    searchInput.focus();
  }
});

document.querySelectorAll('.save-button').forEach((button) => {
  button.addEventListener('click', () => {
    const saved = button.classList.toggle('saved');
    button.textContent = saved ? '♥' : '♡';
  });
});

document.querySelector('#openPost').addEventListener('click', () => postDialog.showModal());
document.querySelector('#closePost').addEventListener('click', () => postDialog.close());
postDialog.addEventListener('click', (event) => {
  if (event.target === postDialog) postDialog.close();
});

document.querySelectorAll('.rating-input button').forEach((button, index, buttons) => {
  button.addEventListener('click', () => {
    buttons.forEach((item, itemIndex) => item.classList.toggle('selected', itemIndex <= index));
  });
});

postForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(postForm);
  const title = formData.get('title');
  const author = formData.get('author');
  const genre = formData.get('genre');
  const newCard = document.createElement('article');
  newCard.className = 'manga-card';
  newCard.dataset.title = title;
  newCard.dataset.author = author;
  newCard.dataset.genre = genre;
  newCard.innerHTML = `<div class="cover cover-witch"><span class="cover-kicker">NUEVO</span><strong>${title}</strong><span class="cover-volume">DE LA COMUNIDAD</span></div><div class="manga-info"><div><h3>${title}</h3><p>${author} · ${genre}</p></div><span class="score">5.0 <b>★</b></span></div><div class="card-meta"><span>Tu publicación</span><button class="save-button" aria-label="Guardar ${title}">♡</button></div>`;
  document.querySelector('#mangaGrid').prepend(newCard);
  newCard.querySelector('.save-button').addEventListener('click', (buttonEvent) => {
    const button = buttonEvent.currentTarget;
    const saved = button.classList.toggle('saved');
    button.textContent = saved ? '♥' : '♡';
  });
  postForm.reset();
  document.querySelectorAll('.rating-input button').forEach((button) => button.classList.remove('selected'));
  postDialog.close();
  newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
});