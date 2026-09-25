"use strict";
(() => {
  const $ = (selector, root = document) => root?.querySelector(selector);
  const $$ = (selector, root = document) => root ? [...root.querySelectorAll(selector)] : [];
  const body = document.body;
  const header = $('.site-header');
  const main = $('main');
  const footer = $('.site-footer');
  const intro = $('#cinematicIntro');
  const menuButton = $('.menu-button');
  const mobileMenu = $('.mobile-menu');
  const track = $('.project-track');
  const prev = $('.project-prev');
  const next = $('.project-next');
  const projectCase = $('#projectCase');
  const closeCaseButton = $('.project-case__close');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 981px)');
  const stages = $$('.stage');
  const navLinks = $$('.nav-link, .mobile-menu nav a');
  const sections = $$('main > section[id]');
  const motion = () => reduceMotion.matches ? 'auto' : 'smooth';
  let activeOverlay = null;
  let previousFocus = null;
  let savedScroll = 0;
  let frame = 0;
  let introTimer = 0;

  $$('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });

  function finishIntro() {
    clearTimeout(introTimer);
    intro?.classList.add('is-done');
    body.classList.remove('intro-playing');
    body.classList.add('is-ready');
    $$('#home .reveal').forEach(el => el.classList.add('is-visible'));
  }
  let introSeen = false;
  try {
    introSeen = sessionStorage.getItem('mora-intro-seen') === '1';
    sessionStorage.setItem('mora-intro-seen', '1');
  } catch (_) { /* Storage may be disabled in private or local-file contexts. */ }
  if (!intro || reduceMotion.matches || introSeen || location.hash) {
    finishIntro();
  } else {
    body.classList.add('intro-playing');
    introTimer = setTimeout(finishIntro, 1650);
    document.addEventListener('pointerdown', finishIntro, { once: true });
    document.addEventListener('keydown', finishIntro, { once: true });
  }

  // Fixed-body scroll lock also preserves the page position on mobile Safari.
  function setOverlay(kind) {
    if (kind && !activeOverlay) {
      savedScroll = window.scrollY;
      body.style.position = 'fixed';
      body.style.top = `-${savedScroll}px`;
      body.style.width = '100%';
    }
    const wasOpen = Boolean(activeOverlay);
    activeOverlay = kind;
    main.inert = Boolean(kind);
    footer.inert = Boolean(kind);
    header.inert = kind === 'case';
    $('.site-header .logo').inert = kind === 'menu';
    body.classList.toggle('menu-open', kind === 'menu');
    body.classList.toggle('case-open', kind === 'case');
    if (!kind && wasOpen) {
      body.style.position = '';
      body.style.top = '';
      body.style.width = '';
      const original = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, savedScroll);
      document.documentElement.style.scrollBehavior = original;
      requestUpdate();
    }
  }

  function setMenu(open, restoreFocus = true) {
    if (!menuButton || !mobileMenu || (open && desktop.matches)) return;
    if (!open && activeOverlay !== 'menu') return;
    if (!open && mobileMenu.contains(document.activeElement)) document.activeElement.blur();
    menuButton.classList.toggle('is-active', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    mobileMenu.inert = !open;
    mobileMenu.setAttribute('aria-hidden', String(!open));
    mobileMenu.classList.toggle('is-open', open);
    setOverlay(open ? 'menu' : null);
    if (open) {
      $('nav a', mobileMenu)?.focus({ preventScroll: true });
    } else if (restoreFocus) {
      menuButton.focus({ preventScroll: true });
    }
  }
  menuButton?.addEventListener('click', () => setMenu(activeOverlay !== 'menu'));
  desktop.addEventListener('change', event => {
    if (event.matches) setMenu(false, false);
  });

  function closeProject(restoreFocus = true) {
    if (activeOverlay !== 'case') return;
    if (projectCase.contains(document.activeElement)) document.activeElement.blur();
    projectCase.classList.remove('is-open');
    projectCase.inert = true;
    projectCase.setAttribute('aria-hidden', 'true');
    setOverlay(null);
    if (restoreFocus) previousFocus?.focus({ preventScroll: true });
  }
  function openProject(visual) {
    const card = visual.closest('.project-card');
    if (!card || !projectCase || activeOverlay) return;
    previousFocus = visual;
    for (const [selector, key] of [['.project-case__category', 'category'], ['.project-case__title', 'project'], ['.project-case__description', 'description'], ['.project-case__year', 'year']]) {
      $(selector, projectCase).textContent = card.dataset[key] || '';
    }
    setOverlay('case');
    projectCase.inert = false;
    projectCase.setAttribute('aria-hidden', 'false');
    projectCase.classList.add('is-open');
    projectCase.scrollTop = 0;
    closeCaseButton.focus({ preventScroll: true });
  }
  $$('.project-open').forEach(visual => visual.addEventListener('click', () => openProject(visual)));
  closeCaseButton?.addEventListener('click', () => closeProject());
  projectCase?.addEventListener('click', event => {
    if (event.target === projectCase) closeProject();
  });

  // Keep keyboard navigation in the visible overlay and restore focus on close.
  const focusables = root => $$('a[href],button:not([disabled]),input,textarea,[tabindex="0"]', root)
    .filter(el => !el.hidden && el.getClientRects().length && !el.closest('[inert]'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (activeOverlay === 'menu') setMenu(false);
      else closeProject();
    }
    if (event.key !== 'Tab' || !activeOverlay) return;
    const elements = activeOverlay === 'menu' ? [menuButton, ...focusables(mobileMenu)] : focusables(projectCase);
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first?.focus();
    }
  });

  // Close overlays before scrolling so the fixed-body lock cannot swallow anchors.
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    event.preventDefault();
    finishIntro();
    if (activeOverlay === 'menu') setMenu(false, false);
    if (activeOverlay === 'case') closeProject(false);
    try { history.pushState(null, '', hash); } catch (_) { /* file:// preview */ }
    target.scrollIntoView({ behavior: motion(), block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }));
  $$('.mobile-menu a[href^="mailto:"]').forEach(link => link.addEventListener('click', () => setMenu(false)));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, current) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        current.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -28px 0px' });
    $$('.reveal').forEach(el => {
      if (reduceMotion.matches) el.classList.add('is-visible');
      else if (!el.closest('#home')) observer.observe(el);
    });
    const nearObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('is-near', entry.isIntersecting));
    }, { rootMargin: '150px 0px' });
    stages.forEach(stage => nearObserver.observe(stage));
  } else {
    $$('.reveal').forEach(el => el.classList.add('is-visible'));
    stages.forEach(stage => stage.classList.add('is-near'));
  }

  function updateFrame() {
    frame = 0;
    if (activeOverlay) return;
    header?.classList.toggle('is-scrolled', scrollY > 28);
    const marker = (header?.offsetHeight || 76) + innerHeight * .25;
    let active = 'home';
    sections.forEach(section => {
      if (section.getBoundingClientRect().top <= marker) active = section.id;
    });
    if (active === 'concept-flow') active = 'home';
    if (scrollY > 0 && innerHeight + scrollY >= document.documentElement.scrollHeight - 8) active = 'contact';
    navLinks.forEach(link => {
      const current = link.getAttribute('href') === `#${active}`;
      link.classList.toggle('is-active', current);
      if (current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    if (!reduceMotion.matches) {
      stages.forEach(stage => {
        const type = $('.transition-type', stage);
        if (!type || !stage.classList.contains('is-near')) return;
        const rect = stage.getBoundingClientRect();
        const distance = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - innerHeight / 2) / innerHeight));
        type.style.transform = `translate3d(${distance * -120}px,-50%,0)`;
      });
    }
  }
  function requestUpdate() {
    if (!frame) frame = requestAnimationFrame(updateFrame);
  }
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', () => { requestUpdate(); updateProjectButtons(); }, { passive: true });
  updateFrame();

  function projectStep() {
    const card = $('.project-card', track);
    return card ? card.getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0) : 320;
  }
  function updateProjectButtons() {
    if (!track || !prev || !next) return;
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    prev.disabled = track.scrollLeft <= 3;
    next.disabled = track.scrollLeft >= max - 3;
  }
  function moveTrack(direction) {
    track?.scrollBy({ left: projectStep() * direction, behavior: motion() });
  }
  prev?.addEventListener('click', () => moveTrack(-1));
  next?.addEventListener('click', () => moveTrack(1));
  let trackFrame = 0;
  track?.addEventListener('scroll', () => {
    if (trackFrame) return;
    trackFrame = requestAnimationFrame(() => { trackFrame = 0; updateProjectButtons(); });
  }, { passive: true });
  track?.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home' || event.key === 'End') track.scrollTo({ left: event.key === 'Home' ? 0 : track.scrollWidth, behavior: motion() });
    else moveTrack(event.key === 'ArrowRight' ? 1 : -1);
  });
  if (track && 'ResizeObserver' in window) new ResizeObserver(updateProjectButtons).observe(track);
  document.fonts?.ready.then(updateProjectButtons);
  updateProjectButtons();

  // Capture only after an actual mouse drag; a normal click still opens its card.
  if (track) {
    let pointer = null;
    let startX = 0;
    let startScroll = 0;
    let dragged = false;
    let suppressClick = false;
    track.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      pointer = event.pointerId;
      startX = event.clientX;
      startScroll = track.scrollLeft;
      dragged = false;
      suppressClick = false;
    });
    track.addEventListener('pointermove', event => {
      if (pointer !== event.pointerId) return;
      const delta = event.clientX - startX;
      if (!dragged && Math.abs(delta) > 7) {
        dragged = true;
        track.classList.add('is-dragging');
        track.setPointerCapture(pointer);
      }
      if (dragged) { event.preventDefault(); track.scrollLeft = startScroll - delta; }
    });
    function stopDrag(event) {
      if (pointer !== event.pointerId) return;
      suppressClick = dragged;
      if (track.hasPointerCapture(pointer)) track.releasePointerCapture(pointer);
      track.classList.remove('is-dragging');
      pointer = null;
      setTimeout(() => { suppressClick = false; }, 0);
    }
    track.addEventListener('pointerup', stopDrag);
    track.addEventListener('pointercancel', stopDrag);
    track.addEventListener('pointerleave', event => { if (!dragged) stopDrag(event); });
    track.addEventListener('click', event => {
      if (suppressClick && event.detail !== 0) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, true);
  }

  const form = $('.contact-form');
  const status = $('.form-status');
  const copyButton = $('.copy-request');
  const copyField = $('.request-copy');
  let preparedRequest = '';
  form?.addEventListener('submit', event => {
    event.preventDefault();
    const name = form.elements.namedItem('name');
    const email = form.elements.namedItem('email');
    const message = form.elements.namedItem('message');
    for (const field of [name, email, message]) {
      field.value = field.value.trim();
      field.setCustomValidity(field.value ? '' : 'Будь ласка, заповніть це поле.');
    }
    if (!form.reportValidity()) return;
    preparedRequest = `Ім’я: ${name.value}\nEmail: ${email.value}\n\nПро проєкт:\n${message.value}`;
    const mail = `mailto:hello@mora.design?subject=${encodeURIComponent('Новий проєкт для MORA')}&body=${encodeURIComponent(preparedRequest)}`;
    status.textContent = 'Лист підготовлено. Надішліть його у поштовій програмі. Якщо вона не відкрилась — скопіюйте запит і напишіть на hello@mora.design.';
    status.className = 'form-status';
    copyButton.hidden = false;
    copyField.hidden = true;
    // A mailto link never claims server-side delivery and preserves all entered fields.
    const link = document.createElement('a');
    link.href = mail;
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
  });
  form?.addEventListener('input', event => {
    if (event.target.setCustomValidity) event.target.setCustomValidity('');
    status.textContent = '';
    copyButton.hidden = true;
    copyField.hidden = true;
  });
  copyButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(preparedRequest);
      status.textContent = 'Текст скопійовано. Вставте його в лист на hello@mora.design.';
    } catch (_) {
      copyField.value = preparedRequest;
      copyField.hidden = false;
      copyField.focus();
      copyField.select();
      status.textContent = 'Текст виділено — скопіюйте його й надішліть на hello@mora.design.';
    }
  });
  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) {
      finishIntro();
      $$('.reveal').forEach(el => el.classList.add('is-visible'));
      $$('.transition-type').forEach(el => { el.style.transform = ''; });
    }
  });
  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('page-hidden', document.hidden);
    if (!document.hidden) requestUpdate();
  });
  addEventListener('pageshow', event => { if (event.persisted) { finishIntro(); requestUpdate(); } });
  document.documentElement.classList.add('js-ready');
})();
