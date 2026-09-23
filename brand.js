document.title = document.title.replace(/MangaShelf/g, 'MangaCave');
const brandWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
const brandNodes = [];
while (brandWalker.nextNode()) brandNodes.push(brandWalker.currentNode);
brandNodes.forEach((node) => {
  if (node.nodeValue.includes('MangaShelf')) node.nodeValue = node.nodeValue.replaceAll('MangaShelf', 'MangaCave');
});
document.querySelectorAll('[aria-label]').forEach((element) => {
  element.setAttribute('aria-label', element.getAttribute('aria-label').replaceAll('MangaShelf', 'MangaCave'));
});

const brandObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) node.nodeValue = node.nodeValue.replaceAll('MangaShelf', 'MangaCave');
      if (node.nodeType === Node.ELEMENT_NODE) {
        const textWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        while (textWalker.nextNode()) textNodes.push(textWalker.currentNode);
        textNodes.forEach((textNode) => { textNode.nodeValue = textNode.nodeValue.replaceAll('MangaShelf', 'MangaCave'); });
      }
    });
  });
});
brandObserver.observe(document.body, { childList: true, subtree: true });

// Global theme and settings dialog support across all pages
(function initGlobalSettings() {
  const currentTheme = localStorage.getItem('mangaShelfTheme') || 'current';
  document.body.dataset.theme = currentTheme;

  function ensureSettingsDialog() {
    let dialog = document.querySelector('#settingsDialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'settingsDialog';
      dialog.className = 'settings-dialog';
      dialog.innerHTML = `
        <button class="close-dialog" id="closeSettings" type="button" aria-label="Close settings">×</button>
        <p class="eyebrow">Workspace settings</p>
        <h2>Choose a visual style.</h2>
        <p>Only your local view changes. The manga data stays the same.</p>
        <label>Theme
          <select id="themeSelect">
            <option value="current">MangaShelf original</option>
            <option value="ocean">Green-blue studio</option>
            <option value="red">Red-black archive</option>
          </select>
        </label>
      `;
      document.body.appendChild(dialog);
    }

    const select = dialog.querySelector('#themeSelect');
    if (select) select.value = document.body.dataset.theme || 'current';

    dialog.querySelector('#closeSettings')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    select?.addEventListener('change', () => {
      const newTheme = select.value;
      document.body.dataset.theme = newTheme;
      localStorage.setItem('mangaShelfTheme', newTheme);
    });

    return dialog;
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#openSettings, .settings-button, [data-action="open-settings"]');
    if (btn) {
      e.preventDefault();
      const dialog = ensureSettingsDialog();
      dialog.showModal();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureSettingsDialog);
  } else {
    ensureSettingsDialog();
  }
})();
