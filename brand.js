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
