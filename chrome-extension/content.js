const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

function isGoogleUrl(url) {
  try {
    const host = new URL(url).hostname;
    return ['google.com', 'gstatic.com', 'googleusercontent.com', 'googleapis.com']
      .some(domain => host === domain || host.endsWith('.' + domain));
  } catch {
    return false;
  }
}

function hasAllowedExtension(url) {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return ALLOWED_EXTENSIONS.some(ext => path.endsWith(ext));
  } catch {
    return false;
  }
}

function makeErrorBadge() {
  const span = document.createElement('span');
  span.className = 'mf-badge mf-error';
  span.textContent = 'Error';
  return span;
}

function makeBadge(label, confidence) {
  const span = document.createElement('span');
  span.className = 'mf-badge ' + (label === 'Informative' ? 'mf-informative' : 'mf-misinformative');
  span.textContent = Math.round(confidence * 100) + '% ' + label;
  return span;
}

function apiPost(url) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'predict', url }, response => {
      void chrome.runtime.lastError; // suppress unchecked lastError warning
      resolve(response?.data ?? null);
    });
  });
}

async function predictText(text) {
  try {
    const data = await apiPost(
      'https://infolytic.surf/predict_text?text=' + encodeURIComponent(text)
    );
    if (!data) return makeErrorBadge();
    return makeBadge(data.label, data.confidence);
  } catch {
    return makeErrorBadge();
  }
}

async function predictImage(imageUrl) {
  try {
    const data = await apiPost(
      'https://infolytic.surf/predict_image?image_url=' + encodeURIComponent(imageUrl)
    );
    if (!data || data.error || !data.prediction) return makeErrorBadge();
    return makeBadge(data.prediction.label, data.prediction.confidence);
  } catch {
    return makeErrorBadge();
  }
}

// processResult takes an h3 element (the result title) as its anchor.
// Google dropped the div.g selector; h3 inside #search is the stable hook.
async function processResult(h3) {
  if (h3.dataset.mfChecked) return;
  h3.dataset.mfChecked = '1';

  const title = h3.textContent ?? '';
  if (!title) return;

  // Walk up to find the result block for snippet and image search.
  // data-sokoban-container is a known Google result wrapper; fall back to ancestors.
  const block = h3.closest('[data-sokoban-container]') ||
                h3.parentElement?.parentElement?.parentElement ||
                h3.parentElement;

  const snippet = block?.querySelector('.VwiC3b')?.textContent ??
                  block?.querySelector('[data-sncf]')?.textContent ?? '';

  const badge = await predictText(title + '. ' + snippet);
  // Inject after the anchor wrapping the h3 (not inside it) to avoid
  // inheriting any CSS transforms Google applies to the link container.
  const anchor = h3.closest('a');
  if (badge) (anchor || h3).after(badge);

  if (block) {
    const mediaPromises = [];

    for (const img of block.querySelectorAll('img')) {
      if (img.src && hasAllowedExtension(img.src) && !isGoogleUrl(img.src)) {
        mediaPromises.push(
          predictImage(img.src).then(b => { if (b) img.after(b); })
        );
      }
    }

    for (const obj of block.querySelectorAll('object')) {
      const src = obj.getAttribute('data');
      if (src && hasAllowedExtension(src) && !isGoogleUrl(src)) {
        mediaPromises.push(
          predictImage(src).then(b => { if (b) obj.after(b); })
        );
      }
    }

    for (const embed of block.querySelectorAll('embed')) {
      if (embed.src && hasAllowedExtension(embed.src) && !isGoogleUrl(embed.src)) {
        mediaPromises.push(
          predictImage(embed.src).then(b => { if (b) embed.after(b); })
        );
      }
    }

    await Promise.all(mediaPromises);
  }
}

function init() {
  document.querySelectorAll('#search h3').forEach(el => processResult(el));

  const target = document.querySelector('#search') || document.body;
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.matches('h3')) processResult(node);
        node.querySelectorAll('h3').forEach(el => processResult(el));
      }
    }
  });
  observer.observe(target, { childList: true, subtree: true });
}

// Run in browser; export in test environment
if (typeof module !== 'undefined') {
  module.exports = { isGoogleUrl, hasAllowedExtension, makeBadge, makeErrorBadge, predictText, predictImage, processResult };
} else {
  init();
}
