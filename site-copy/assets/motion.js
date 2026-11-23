(() => {
  'use strict';

  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactViewport = window.matchMedia('(max-width: 767px)');
  const records = new Map();
  const seen = new WeakSet();
  const drawnChecks = new WeakSet();
  const groups = [
    '.services__title, .services__text',
    '.services__item',
    '.about__jpg',
    '.about__list > ul',
    '.founder-message__copy, .founder-message__figure',
    '.form__column',
    '.footer__base'
  ];
  groups.forEach(selector => {
    document.querySelectorAll(selector).forEach((element, index) => {
      records.set(element, (index % 3) * 70);
    });
  });
  const photos = [...document.querySelectorAll('.about__jpg > img')];
  const checks = [...document.querySelectorAll('.about__list > ul > li')]
    .filter(item => item.querySelector('.about__check'));
  let observer = null;
  let checkObserver = null;
  let enabled = false;
  let frame = 0;

  function reveal(element) {
    seen.add(element);
    element.classList.add('is-revealed');
    observer?.unobserve(element);
  }

  function revealFocused(event) {
    const element = event.target?.closest?.('.motion-reveal');
    if (element) reveal(element);
  }

  function drawCheck(item) {
    drawnChecks.add(item);
    item.classList.add('is-check-drawn');
    checkObserver?.unobserve(item);
  }

  function updateParallax() {
    frame = 0;
    if (!enabled) return;
    const viewportHeight = window.innerHeight || root.clientHeight;
    if (!viewportHeight) return;
    photos.forEach(photo => {
      const rect = photo.parentElement.getBoundingClientRect();
      if (rect.height <= 0) return;
      const distance = viewportHeight / 2 - (rect.top + rect.height / 2);
      const range = (viewportHeight + rect.height) / 2;
      const progress = Math.max(-1, Math.min(1, distance / range));
      const limit = compactViewport.matches
        ? Math.min(28, rect.height * .06)
        : Math.min(64, rect.height * .13);
      photo.style.setProperty('--parallax-shift', (progress * limit).toFixed(2) + 'px');
    });
  }

  function requestUpdate() {
    if (enabled && !frame) frame = window.requestAnimationFrame(updateParallax);
  }

  function stopMotion() {
    enabled = false;
    observer?.disconnect();
    observer = null;
    checkObserver?.disconnect();
    checkObserver = null;
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    root.classList.remove('motion-enabled');
    records.forEach((delay, element) => {
      seen.add(element);
      element.classList.remove('motion-reveal', 'is-revealed');
      element.style.removeProperty('--motion-delay');
    });
    checks.forEach(item => {
      drawnChecks.add(item);
      item.classList.remove('check-motion', 'is-check-drawn');
      item.style.removeProperty('--check-delay');
    });
    photos.forEach(photo => {
      photo.classList.remove('motion-parallax');
      photo.style.removeProperty('--parallax-shift');
      photo.removeEventListener('load', requestUpdate);
    });
    window.removeEventListener('scroll', requestUpdate);
    window.removeEventListener('resize', requestUpdate);
    window.removeEventListener('pageshow', requestUpdate);
    document.removeEventListener('focusin', revealFocused);
  }

  function startMotion() {
    if (enabled) return;
    observer = new IntersectionObserver(entries => {
      if (!enabled) return;
      entries.forEach(entry => {
        if (entry.isIntersecting) reveal(entry.target);
      });
    }, { threshold: .1, rootMargin: '0px 0px -24px 0px' });
    enabled = true;
    records.forEach((delay, element) => {
      element.classList.add('motion-reveal');
      element.style.setProperty('--motion-delay', delay + 'ms');
      if (seen.has(element)) reveal(element);
      else observer.observe(element);
    });
    const pendingChecks = checks.filter(item => !drawnChecks.has(item));
    if (pendingChecks.length) {
      checkObserver = new IntersectionObserver(entries => {
        if (!enabled) return;
        entries.forEach(entry => {
          if (entry.isIntersecting) drawCheck(entry.target);
        });
      }, { threshold: .25, rootMargin: '0px 0px -16px 0px' });
      pendingChecks.forEach(item => {
        const row = [...item.parentElement.children].indexOf(item);
        item.classList.add('check-motion');
        item.style.setProperty('--check-delay', ((row % 4) * 70) + 'ms');
        checkObserver.observe(item);
      });
    }
    photos.forEach(photo => {
      photo.classList.add('motion-parallax');
      photo.addEventListener('load', requestUpdate);
    });
    root.classList.add('motion-enabled');
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    window.addEventListener('pageshow', requestUpdate);
    document.addEventListener('focusin', revealFocused);
    revealFocused({ target: document.activeElement });
    requestUpdate();
  }

  function synchronizeMotion() {
    if (preference.matches || !('IntersectionObserver' in window)) stopMotion();
    else startMotion();
  }

  if (preference.addEventListener) preference.addEventListener('change', synchronizeMotion);
  else preference.addListener(synchronizeMotion);
  synchronizeMotion();
})();
