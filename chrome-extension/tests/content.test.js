const { isGoogleUrl, hasAllowedExtension, makeBadge, makeErrorBadge, predictText, predictImage } = require('../content');

describe('isGoogleUrl', () => {
  test('returns true for google.com', () => {
    expect(isGoogleUrl('https://www.google.com/image.jpg')).toBe(true);
  });

  test('returns true for gstatic.com subdomains', () => {
    expect(isGoogleUrl('https://encrypted-tbn0.gstatic.com/image.jpg')).toBe(true);
  });

  test('returns true for googleusercontent.com', () => {
    expect(isGoogleUrl('https://lh3.googleusercontent.com/photo.jpg')).toBe(true);
  });

  test('returns true for googleapis.com', () => {
    expect(isGoogleUrl('https://maps.googleapis.com/map.png')).toBe(true);
  });

  test('returns false for external domains', () => {
    expect(isGoogleUrl('https://example.com/image.jpg')).toBe(false);
  });

  test('returns false for domains that contain google but are not google', () => {
    expect(isGoogleUrl('https://notgoogle.com/image.jpg')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(isGoogleUrl('')).toBe(false);
  });
});

describe('hasAllowedExtension', () => {
  test('returns true for .jpg', () => {
    expect(hasAllowedExtension('https://example.com/photo.jpg')).toBe(true);
  });

  test('returns true for .jpeg', () => {
    expect(hasAllowedExtension('https://example.com/photo.jpeg')).toBe(true);
  });

  test('returns true for .png', () => {
    expect(hasAllowedExtension('https://example.com/image.png')).toBe(true);
  });

  test('returns true for .pdf', () => {
    expect(hasAllowedExtension('https://example.com/doc.pdf')).toBe(true);
  });

  test('is case-insensitive', () => {
    expect(hasAllowedExtension('https://example.com/photo.JPG')).toBe(true);
    expect(hasAllowedExtension('https://example.com/photo.PNG')).toBe(true);
  });

  test('returns false for .gif', () => {
    expect(hasAllowedExtension('https://example.com/anim.gif')).toBe(false);
  });

  test('returns false for non-http/https URIs (e.g. data:) — rejection is path-based, not scheme-based', () => {
    expect(hasAllowedExtension('data:image/jpeg;base64,abc123')).toBe(false);
  });

  test('returns false when extension appears only in query string', () => {
    expect(hasAllowedExtension('https://example.com/page?ref=photo.jpg')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(hasAllowedExtension('')).toBe(false);
  });
});

describe('makeErrorBadge', () => {
  test('returns a span with mf-badge and mf-error classes', () => {
    const badge = makeErrorBadge();
    expect(badge.tagName).toBe('SPAN');
    expect(badge.classList.contains('mf-badge')).toBe(true);
    expect(badge.classList.contains('mf-error')).toBe(true);
  });

  test('text content is "Error"', () => {
    const badge = makeErrorBadge();
    expect(badge.textContent).toBe('Error');
  });
});

describe('makeBadge', () => {
  test('returns a span element', () => {
    const badge = makeBadge('Informative', 0.87);
    expect(badge.tagName).toBe('SPAN');
  });

  test('has mf-badge class', () => {
    const badge = makeBadge('Informative', 0.87);
    expect(badge.classList.contains('mf-badge')).toBe(true);
  });

  test('Informative label gets mf-informative class', () => {
    const badge = makeBadge('Informative', 0.87);
    expect(badge.classList.contains('mf-informative')).toBe(true);
    expect(badge.classList.contains('mf-misinformative')).toBe(false);
  });

  test('Misinformative label gets mf-misinformative class', () => {
    const badge = makeBadge('Misinformative', 0.73);
    expect(badge.classList.contains('mf-misinformative')).toBe(true);
    expect(badge.classList.contains('mf-informative')).toBe(false);
  });

  test('text shows rounded percentage and label', () => {
    const badge = makeBadge('Informative', 0.876);
    expect(badge.textContent).toBe('88% Informative');
  });

  test('confidence rounds correctly', () => {
    const badge = makeBadge('Misinformative', 0.501);
    expect(badge.textContent).toBe('50% Misinformative');
  });
});

function mockSendMessage(data) {
  global.chrome.runtime.sendMessage.mockImplementation((_msg, cb) => cb({ data }));
}

describe('predictText', () => {
  beforeEach(() => {
    global.chrome = { runtime: { lastError: null, sendMessage: jest.fn() } };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('returns a badge on success', async () => {
    mockSendMessage({ label: 'Informative', confidence: 0.9, probabilities: {} });
    const badge = await predictText('some article title');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('90% Informative');
  });

  test('calls the correct endpoint with encoded text', async () => {
    mockSendMessage({ label: 'Misinformative', confidence: 0.7, probabilities: {} });
    await predictText('hello world');
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: 'predict', url: 'https://infolytic.surf/predict_text?text=hello%20world' },
      expect.any(Function)
    );
  });

  test('returns error badge on null data (e.g. non-2xx)', async () => {
    mockSendMessage(null);
    const badge = await predictText('some text');
    expect(badge).not.toBeNull();
    expect(badge.classList.contains('mf-error')).toBe(true);
  });

  test('returns error badge on no response (e.g. worker terminated)', async () => {
    global.chrome.runtime.sendMessage.mockImplementation((_msg, cb) => cb(undefined));
    const badge = await predictText('some text');
    expect(badge).not.toBeNull();
    expect(badge.classList.contains('mf-error')).toBe(true);
  });
});

describe('predictImage', () => {
  beforeEach(() => {
    global.chrome = { runtime: { lastError: null, sendMessage: jest.fn() } };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('returns a badge on success', async () => {
    mockSendMessage({ extracted_text: 'some text', normalized_text: 'some text', prediction: { label: 'Misinformative', confidence: 0.65 } });
    const badge = await predictImage('https://example.com/image.jpg');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('65% Misinformative');
  });

  test('calls the correct endpoint with encoded image URL', async () => {
    mockSendMessage({ extracted_text: '', normalized_text: '', prediction: { label: 'Informative', confidence: 0.8 } });
    await predictImage('https://example.com/photo.png');
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: 'predict', url: 'https://infolytic.surf/predict_image?image_url=https%3A%2F%2Fexample.com%2Fphoto.png' },
      expect.any(Function)
    );
  });

  test('returns error badge when response contains error field', async () => {
    mockSendMessage({ error: 'Invalid file format.' });
    const badge = await predictImage('https://example.com/image.jpg');
    expect(badge).not.toBeNull();
    expect(badge.classList.contains('mf-error')).toBe(true);
  });

  test('returns error badge on null data', async () => {
    mockSendMessage(null);
    const badge = await predictImage('https://example.com/image.jpg');
    expect(badge).not.toBeNull();
    expect(badge.classList.contains('mf-error')).toBe(true);
  });

  test('returns error badge on no response', async () => {
    global.chrome.runtime.sendMessage.mockImplementation((_msg, cb) => cb(undefined));
    const badge = await predictImage('https://example.com/image.jpg');
    expect(badge).not.toBeNull();
    expect(badge.classList.contains('mf-error')).toBe(true);
  });
});

const { processResult } = require('../content');

describe('processResult', () => {
  let el;

  beforeEach(() => {
    global.chrome = { runtime: { lastError: null, sendMessage: jest.fn() } };
    el = document.createElement('div');
    document.body.appendChild(el);
  });

  afterEach(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
    jest.resetAllMocks();
  });

  test('injects a badge after h3 for a result with a title', async () => {
    mockSendMessage({ label: 'Informative', confidence: 0.9, probabilities: {} });

    const h3 = document.createElement('h3');
    h3.textContent = 'Test Article Title';
    el.appendChild(h3);

    await processResult(h3);

    const badge = h3.nextElementSibling;
    expect(badge).not.toBeNull();
    expect(badge.classList.contains('mf-badge')).toBe(true);
    expect(badge.textContent).toBe('90% Informative');
  });

  test('does not process the same element twice (idempotency guard)', async () => {
    mockSendMessage({ label: 'Informative', confidence: 0.9, probabilities: {} });

    const h3 = document.createElement('h3');
    h3.textContent = 'Some Title';
    el.appendChild(h3);

    await processResult(h3);
    await processResult(h3); // second call should be a no-op

    // sendMessage should only have been called once
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
  });

  test('skips badge injection when title is empty', async () => {
    const h3 = document.createElement('h3');
    h3.textContent = '';
    el.appendChild(h3);
    await processResult(h3);
    expect(global.chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });
});
