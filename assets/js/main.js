/**
 * FV Real Estate — main.js
 * Versie: 1.0.0 | 2026-05-06
 *
 * Functionaliteit:
 * 1. GSAP scroll-animaties (fade-up, fade-left, fade-right, counters, parallax)
 * 2. Scroll progress bar
 * 3. Navigation (glassmorphism + hamburger)
 * 4. FAQ accordion
 * 5. Smooth scroll
 * 6. Intersection Observer fallback (wanneer GSAP niet laadt)
 *
 * Vereist: GSAP + ScrollTrigger via CDN (optioneel, graceful degradation)
 */

'use strict';

/* =============================================================================
   UTILITY HELPERS
============================================================================= */

/**
 * Formatteert een getal naar Nederlandse notatie (1.234.567)
 * @param {number} value
 * @param {number} decimals
 * @returns {string}
 */
function formatNumber(value, decimals = 0) {
  return new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Easing functie voor counter animaties
 * @param {number} t - progress 0-1
 * @returns {number}
 */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animeer een getal van start naar eind over een bepaalde duur
 * @param {HTMLElement} el
 * @param {number} start
 * @param {number} end
 * @param {number} duration - ms
 * @param {string} prefix
 * @param {string} suffix
 */
function animateCounter(el, start, end, duration, prefix = '', suffix = '') {
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutCubic(progress);
    const currentValue = start + (end - start) * easedProgress;

    // Toon gehele getallen zonder decimalen, floats met 1 decimaal
    const displayValue = Number.isInteger(end)
      ? formatNumber(Math.round(currentValue))
      : formatNumber(currentValue, 1);

    el.textContent = prefix + displayValue + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* =============================================================================
   1. SCROLL PROGRESS BAR
============================================================================= */

function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  function updateProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = progress + '%';
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}

/* =============================================================================
   2. NAVIGATION
============================================================================= */

function initNavigation() {
  const nav = document.querySelector('.nav');
  const hamburger = document.querySelector('.nav__hamburger');
  const mobileMenu = document.querySelector('.nav__mobile');
  const mobileLinks = document.querySelectorAll('.nav__mobile-link');

  if (!nav) return;

  // Glassmorphism effect na 50px scroll
  function handleNavScroll() {
    if (window.scrollY > 50) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // Hamburger toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      const isOpen = mobileMenu.classList.contains('is-open');

      if (isOpen) {
        mobileMenu.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      } else {
        mobileMenu.classList.add('is-open');
        hamburger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      }
    });

    // Sluit menu bij klik op link
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Sluit menu bij Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
        mobileMenu.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        hamburger.focus();
      }
    });
  }

  // Active state op huidige pagina
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav__link');

  navLinks.forEach(function (link) {
    const href = link.getAttribute('href');
    if (href && currentPath.includes(href) && href !== '/') {
      link.setAttribute('aria-current', 'page');
    } else if (href === '/' && currentPath === '/') {
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* =============================================================================
   3. GSAP ANIMATIES
============================================================================= */

function initGSAPAnimations() {
  // Controleer of GSAP beschikbaar is
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.info('GSAP niet beschikbaar — Intersection Observer fallback actief.');
    initIntersectionObserver();
    return;
  }

  // Registreer ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);

  // --- Fade-up elementen ---
  gsap.utils.toArray('.fade-up').forEach(function (el) {
    gsap.fromTo(
      el,
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        duration: 0.75,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      }
    );
  });

  // --- Fade-up met stagger (direct kinderen van .stagger container) ---
  document.querySelectorAll('.stagger').forEach(function (container) {
    const children = container.querySelectorAll('.fade-up');
    if (children.length > 0) {
      gsap.fromTo(
        children,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 85%',
            once: true,
          },
        }
      );
    }
  });

  // --- Fade-left elementen ---
  gsap.utils.toArray('.fade-left').forEach(function (el) {
    // Sla over als al in een stagger container zit
    if (el.closest('.stagger')) return;

    gsap.fromTo(
      el,
      { opacity: 0, x: -36 },
      {
        opacity: 1,
        x: 0,
        duration: 0.75,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      }
    );
  });

  // --- Fade-right elementen ---
  gsap.utils.toArray('.fade-right').forEach(function (el) {
    if (el.closest('.stagger')) return;

    gsap.fromTo(
      el,
      { opacity: 0, x: 36 },
      {
        opacity: 1,
        x: 0,
        duration: 0.75,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      }
    );
  });

  // --- Fade-in elementen ---
  gsap.utils.toArray('.fade-in').forEach(function (el) {
    gsap.fromTo(
      el,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.8,
        ease: 'power1.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      }
    );
  });

  // --- Parallax op hero sectie ---
  const heroBg = document.querySelector('.hero__bg');
  if (heroBg) {
    gsap.to(heroBg, {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  // --- Counter animaties (data-counter attribuut) ---
  initCounters();
}

/* =============================================================================
   4. COUNTER ANIMATIES
============================================================================= */

function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');

  counters.forEach(function (el) {
    const target = parseFloat(el.getAttribute('data-counter'));
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = parseInt(el.getAttribute('data-duration') || '2000');
    let triggered = false;

    if (typeof ScrollTrigger !== 'undefined') {
      // GSAP ScrollTrigger beschikbaar
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: function () {
          if (!triggered) {
            triggered = true;
            animateCounter(el, 0, target, duration, prefix, suffix);
          }
        },
      });
    } else {
      // Intersection Observer fallback
      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !triggered) {
              triggered = true;
              animateCounter(el, 0, target, duration, prefix, suffix);
              observer.unobserve(el);
            }
          });
        },
        { threshold: 0.5 }
      );
      observer.observe(el);
    }
  });
}

/* =============================================================================
   5. INTERSECTION OBSERVER FALLBACK
   Wordt gebruikt wanneer GSAP niet beschikbaar is
============================================================================= */

function initIntersectionObserver() {
  const animatedEls = document.querySelectorAll(
    '.fade-up, .fade-left, .fade-right, .fade-in'
  );

  if (animatedEls.length === 0) return;

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // Stagger vertraging ophalen van parent container
          const parent = entry.target.parentElement;
          if (parent && parent.classList.contains('stagger')) {
            const siblings = Array.from(parent.querySelectorAll(
              '.fade-up, .fade-left, .fade-right, .fade-in'
            ));
            const index = siblings.indexOf(entry.target);
            entry.target.style.transitionDelay = (index * 100) + 'ms';
          }

          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  animatedEls.forEach(function (el) {
    observer.observe(el);
  });

  // Initialiseer counters ook via observer
  initCounters();
}

/* =============================================================================
   6. FAQ ACCORDION
============================================================================= */

function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function (item) {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (!question || !answer) return;

    question.addEventListener('click', function () {
      const isOpen = item.classList.contains('is-open');

      // Sluit alle andere items
      faqItems.forEach(function (otherItem) {
        if (otherItem !== item) {
          const otherAnswer = otherItem.querySelector('.faq-answer');
          otherItem.classList.remove('is-open');
          otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
          if (otherAnswer) otherAnswer.style.maxHeight = '0';
        }
      });

      // Toggle huidig item
      if (isOpen) {
        item.classList.remove('is-open');
        question.setAttribute('aria-expanded', 'false');
        answer.style.maxHeight = '0';
      } else {
        item.classList.add('is-open');
        question.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });

    // Keyboard: Enter en Space openen/sluiten
    question.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        question.click();
      }
    });

    // Initiële ARIA-attributen
    question.setAttribute('aria-expanded', 'false');
    const answerId = 'faq-answer-' + Math.random().toString(36).substr(2, 9);
    answer.setAttribute('id', answerId);
    question.setAttribute('aria-controls', answerId);
  });
}

/* =============================================================================
   7. SMOOTH SCROLL
============================================================================= */

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const navHeight = document.querySelector('.nav')
        ? document.querySelector('.nav').offsetHeight
        : 0;

      const targetPosition =
        target.getBoundingClientRect().top + window.scrollY - navHeight - 16;

      if (typeof gsap !== 'undefined') {
        gsap.to(window, {
          scrollTo: targetPosition,
          duration: 0.85,
          ease: 'power2.inOut',
        });
      } else {
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    });
  });
}

/* =============================================================================
   8. INITIALISATIE
============================================================================= */

function init() {
  initScrollProgress();
  initNavigation();
  initFAQ();
  initSmoothScroll();

  // GSAP animaties starten na korte delay zodat DOM volledig is
  if (typeof gsap !== 'undefined') {
    initGSAPAnimations();
  } else {
    // Wacht kort om zeker te zijn dat externe scripts geladen zijn
    setTimeout(function () {
      if (typeof gsap !== 'undefined') {
        initGSAPAnimations();
      } else {
        initIntersectionObserver();
        initCounters();
      }
    }, 300);
  }
}

// Starten zodra DOM gereed is
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
