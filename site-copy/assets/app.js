(() => {
  'use strict';
  const pageData = document.querySelector('#page-data');
  if (!pageData) return;
  const { lang, t, u } = JSON.parse(pageData.textContent);
  const config = window.EQUINORIX_CONFIG || { preview: true };
  const $ = selector => document.querySelector(selector);
  const siteHeader = $('.header');
  const menuButton = $('.header__burger');
  const navigation = $('#site-navigation');
  let headerOffset = 0;

  function updateHeader() {
    if (!siteHeader) return;
    siteHeader.classList.toggle('is-scrolled', window.scrollY > 12);
    if (!siteHeader.classList.contains('header_active')) {
      const headerRect = siteHeader.getBoundingClientRect();
      const logoRect = siteHeader.querySelector('.header__logo')?.getBoundingClientRect();
      headerOffset = Math.ceil(Math.max(headerRect.height, (logoRect?.bottom || headerRect.bottom) - headerRect.top));
      document.documentElement.style.setProperty('--header-offset', headerOffset + 'px');
    }
  }
  function closeMenu() {
    menuButton?.setAttribute('aria-expanded', 'false');
    siteHeader?.classList.remove('header_active');
    updateHeader();
  }
  menuButton?.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(expanded));
    siteHeader?.classList.toggle('header_active', expanded);
    updateHeader();
  });
  document.addEventListener('pointerdown', event => {
    if (siteHeader?.classList.contains('header_active') && !navigation?.contains(event.target) && !menuButton?.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const wasOpen = siteHeader?.classList.contains('header_active');
    closeMenu();
    if (wasOpen) menuButton?.focus();
  });
  document.querySelectorAll('.header a').forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('pageshow', updateHeader);
  window.addEventListener('resize', () => {
    if (window.innerWidth > 767) closeMenu();
    updateHeader();
  });
  siteHeader?.querySelectorAll('img').forEach(img => img.addEventListener('load', updateHeader));
  if (window.ResizeObserver && siteHeader) {
    new ResizeObserver(updateHeader).observe(siteHeader);
  }
  updateHeader();

  const cookieDialog = $('#cookie-dialog');
  const policyDialog = $('#policy-dialog');
  const consentKey = 'equinorix-consent-v1';
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* Storage can be unavailable. */ } },
    remove(key) { try { localStorage.removeItem(key); } catch { /* Nothing to remove. */ } }
  };
  storage.remove('equinorix-language');
  let consent = null;
  try {
    const saved = JSON.parse(storage.get(consentKey));
    if (saved?.version === 1 && saved.expires > Date.now() && saved.necessary === true) {
      consent = { version: 1, necessary: true, analytics: false, expires: saved.expires };
      storage.set(consentKey, JSON.stringify(consent));
    }
  } catch { /* Request a new choice for malformed storage. */ }
  if (!consent) storage.remove(consentKey);
  function setConsent() {
    consent = { version: 1, necessary: true, analytics: false, expires: Date.now() + 180 * 86400000 };
    storage.set(consentKey, JSON.stringify(consent));
    cookieDialog?.close();
  }
  function openCookies() {
    if (!cookieDialog) return;
    $('#cookie-options').hidden = true;
    $('#save-cookies').hidden = true;
    $('#configure-cookies').hidden = false;
    $('#close-cookie').hidden = !consent;
    if (!cookieDialog.open) cookieDialog.showModal();
  }
  $('#cookie-settings')?.addEventListener('click', openCookies);
  $('#close-cookie')?.addEventListener('click', () => cookieDialog?.close());
  cookieDialog?.addEventListener('cancel', event => { if (!consent) event.preventDefault(); });
  $('#configure-cookies')?.addEventListener('click', () => {
    $('#cookie-options').hidden = false;
    $('#save-cookies').hidden = false;
    $('#configure-cookies').hidden = true;
    $('#save-cookies').focus();
  });
  document.querySelectorAll('[data-cookie-choice]').forEach(button => button.addEventListener('click', setConsent));
  $('#save-cookies')?.addEventListener('click', setConsent);

  const policies = {
    privacy: [u.policyTitle, u.policyText],
    cookies: [u.cookiePolicyTitle, u.cookiePolicyText],
    legal: [u.legalTitle, u.legalText]
  };
  document.querySelectorAll('[data-policy]').forEach(button => button.addEventListener('click', () => {
    const policy = policies[button.dataset.policy];
    if (!policy?.[1]?.trim() || !policyDialog) return;
    $('#policy-title').textContent = policy[0];
    $('#policy-text').textContent = policy[1];
    if (!policyDialog.open) policyDialog.showModal();
  }));
  $('#close-policy')?.addEventListener('click', () => policyDialog?.close());

  const form = $('#contact-form');
  const fields = $('#form-fields');
  const formResult = $('#form-result');
  const submit = form?.querySelector('[type="submit"]');
  let submitting = false;
  $('#return-form')?.addEventListener('click', () => {
    formResult.hidden = true;
    fields.hidden = false;
    form.elements.namedItem('name')?.focus();
  });
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting || !form.reportValidity()) return;
    const fieldsHeight = Math.ceil(fields.getBoundingClientRect().height);
    submitting = true;
    submit.disabled = true;
    submit.textContent = t.sending;
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      values.language = lang;
      let response, result;
      if (config.preview !== false) {
        result = { success: false, code: 'EMAIL_NOT_CONFIGURED' };
      } else {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
          response = await fetch(config.contactEndpoint || '/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(values),
            signal: controller.signal
          });
          result = await response.json();
        } finally { clearTimeout(timer); }
      }
      const successful = response?.ok === true && result?.success === true;
      const pending = result?.code === 'EMAIL_NOT_CONFIGURED';
      $('#result-title').textContent = successful ? t.successTitle : pending ? u.previewPending : t.errorMessage;
      $('#result-text').textContent = successful ? t.successText : pending ? '' : t.errorMessage;
    } catch {
      $('#result-title').textContent = t.errorMessage;
      $('#result-text').textContent = t.errorMessage;
    } finally {
      $('#result-text').hidden = !$('#result-text').textContent;
      formResult.style.minHeight = fieldsHeight + 'px';
      fields.hidden = true;
      formResult.hidden = false;
      $('#result-title').focus();
      submit.disabled = false;
      submit.textContent = t.submit;
      submitting = false;
    }
  });

  const videoSection = $('#founder-message');
  const videoMedia = videoSection?.querySelector('.founder-message__media');
  const videoPoster = '/assets/img/marbella-la-concha.webp';
  let activeVideo = videoMedia?.querySelector('video') || null;
  let videoAttempt = 0;
  function disposeVideo() {
    if (!activeVideo) return;
    const previous = activeVideo;
    activeVideo = null;
    previous.pause();
    previous.removeAttribute('src');
    previous.load();
    previous.remove();
  }
  function validVideoUrl(configuredSource) {
    if (typeof configuredSource !== 'string' || !configuredSource.trim()) return null;
    try {
      const source = configuredSource.trim();
      const url = new URL(source, location.href);
      const localPath = source.startsWith('/') && !source.startsWith('//') && !source.startsWith('/\\') && url.origin === location.origin;
      const remoteHttps = /^https:\/\//i.test(source) && url.protocol === 'https:';
      return (localPath || remoteHttps) && !url.username && !url.password ? url : null;
    } catch { return null; }
  }
  function loadFounderVideo(configuredSource, isDemo) {
    if (!videoMedia) return;
    const url = validVideoUrl(configuredSource);
    if (!url && !isDemo) {
      loadFounderVideo(config.demoVideo, true);
      return;
    }
    const attempt = ++videoAttempt;
    disposeVideo();
    videoMedia.classList.remove('has-video');
    videoSection.classList.toggle('is-demo', isDemo);
    const video = document.createElement('video');
    video.className = 'founder-message__video';
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.poster = videoPoster;
    video.setAttribute('aria-label', u.videoAlt || 'EQUINORIX');
    function unavailableVideo() {
      if (attempt !== videoAttempt || activeVideo !== video) return;
      if (!isDemo) {
        loadFounderVideo(config.demoVideo, true);
      } else {
        video.pause();
        video.removeAttribute('src');
        video.load();
        videoMedia.classList.remove('has-video');
      }
    }
    video.addEventListener('loadedmetadata', () => {
      if (attempt !== videoAttempt || activeVideo !== video) return;
      if (Number.isFinite(video.duration) && video.duration > 0 && video.duration <= 120) {
        videoMedia.classList.add('has-video');
      } else {
        unavailableVideo();
      }
    });
    video.addEventListener('error', unavailableVideo, { once: true });
    activeVideo = video;
    videoMedia.append(video);
    if (url) video.src = url.href;
  }
  if (videoSection) loadFounderVideo(config.videos?.[lang], false);
  const socialIcons = {
    linkedin: '<path d="M5 9v11M5 4v.1M10 20V9h4v2c1-3 7-3 7 3v6M14 20v-6"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>'
  };
  const socialContainer = $('.footer__social');
  Object.entries(config.social || {}).forEach(([name, source]) => {
    if (!source || !socialIcons[name] || !socialContainer) return;
    try {
      const url = new URL(source);
      if (url.protocol !== 'https:') return;
      const link = document.createElement('a');
      const label = name === 'linkedin' ? 'LinkedIn' : 'Instagram';
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', label);
      link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5">' + socialIcons[name] + '</svg><span>' + label + '</span>';
      socialContainer.append(link);
    } catch { /* Invalid or unconfigured social URLs are omitted. */ }
  });
  if (!consent) openCookies();
})();
