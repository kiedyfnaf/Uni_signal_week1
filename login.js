const authForm = document.querySelector('#authForm');
const authEyebrow = document.querySelector('#authEyebrow');
const authTitle = document.querySelector('#authTitle');
const authDescription = document.querySelector('#authDescription');
const authSubmit = document.querySelector('#authSubmit');
const authStatus = document.querySelector('#authStatus');
const authNote = document.querySelector('#authNote');
const confirmPasswordField = document.querySelector('#confirmPasswordField');
const returnTo = new URLSearchParams(window.location.search).get('returnTo') || 'index.html';
let registerMode = new URLSearchParams(window.location.search).get('mode') === 'register';
const switchMode = document.querySelector('#switchMode');

function renderMode() {
  registerMode = Boolean(registerMode);
  authEyebrow.textContent = registerMode ? 'New account' : 'Shared workspace';
  authTitle.innerHTML = registerMode ? 'Create an account<span>.</span>' : 'Sign in<span>.</span>';
  authDescription.textContent = registerMode ? 'Create a view-only account. Approved usernames become administrators.' : 'Sign in to read the manga shelf. Administrators can also add manga.';
  authSubmit.textContent = registerMode ? 'Create account' : 'Sign in';
  confirmPasswordField.hidden = !registerMode;
  document.querySelector('#confirmPassword').required = registerMode;
  document.querySelector('#password').autocomplete = registerMode ? 'new-password' : 'current-password';
  switchMode.textContent = registerMode ? 'Sign in instead' : 'Create an account';
  authNote.firstChild.textContent = registerMode ? 'Already registered? ' : 'New here? ';
}

switchMode.addEventListener('click', () => { registerMode = !registerMode; renderMode(); });
renderMode();

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  authStatus.textContent = 'Checking credentials...';
  authSubmit.disabled = true;
  const username = document.querySelector('#username').value.trim();
  const password = document.querySelector('#password').value;
  try {
    if (registerMode && password !== document.querySelector('#confirmPassword').value) throw new Error('Passwords do not match.');
    if (registerMode) await MangaAuth.register(username, password);
    else await MangaAuth.signIn(username, password);
    window.location.replace(returnTo);
  } catch (error) {
    authStatus.textContent = error.message;
    authSubmit.disabled = false;
  }
});
