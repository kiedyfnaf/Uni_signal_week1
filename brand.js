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
  const savedTheme = localStorage.getItem('mangaShelfTheme') || 'midnight';
  document.documentElement.dataset.theme = savedTheme;
  if (document.body) {
    document.body.dataset.theme = savedTheme;
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.dataset.theme = savedTheme;
    });
  }

  function applyThemeEverywhere(newTheme) {
    document.documentElement.dataset.theme = newTheme;
    if (document.body) document.body.dataset.theme = newTheme;
    localStorage.setItem('mangaShelfTheme', newTheme);
    document.querySelectorAll('#themeSelect').forEach((sel) => {
      sel.value = newTheme;
    });
  }

  function ensureSettingsDialog() {
    let dialog = document.querySelector('#settingsDialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'settingsDialog';
      dialog.className = 'settings-dialog';
      dialog.innerHTML = `
        <button class="close-dialog" id="closeSettings" type="button" aria-label="Close settings">×</button>
        <p class="eyebrow">Workspace appearance</p>
        <h2>Change UI color.</h2>
        <p>Pick a theme to customize colors across every page of MangaCave.</p>
        <label>Theme &amp; Accent
          <select id="themeSelect">
            <option value="midnight">Midnight Blue (Deep Dark Slate) (dark)</option>
            <option value="current">Warm Paper (Original Light) (light)</option>
            <option value="ocean">Teal Ocean (Cool Green-Blue) (light)</option>
            <option value="red">Red Obsidian (Dark Archive) (dark)</option>
            <option value="monochrome">Monochrome (High Contrast) (light)</option>
          </select>
        </label>
        <p class="theme-applied-note" style="margin-top: 14px; font: 500 11px 'DM Mono', monospace; color: var(--coral, #ff765f);">✓ Saved across all pages</p>
      `;
      document.body.appendChild(dialog);
    }

    const select = dialog.querySelector('#themeSelect');
    if (select) {
      select.value = localStorage.getItem('mangaShelfTheme') || 'midnight';
      select.onchange = () => {
        applyThemeEverywhere(select.value);
      };
    }

    const closeBtn = dialog.querySelector('#closeSettings');
    if (closeBtn) closeBtn.onclick = () => dialog.close();
    dialog.onclick = (e) => { if (e.target === dialog) dialog.close(); };

    return dialog;
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#openSettings, .settings-button, [data-action="open-settings"]');
    if (btn) {
      e.preventDefault();
      const dialog = ensureSettingsDialog();
      const select = dialog.querySelector('#themeSelect');
      if (select) select.value = localStorage.getItem('mangaShelfTheme') || 'midnight';
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureSettingsDialog);
  } else {
    ensureSettingsDialog();
  }
})();
