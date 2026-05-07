/**
 * FV Real Estate — calculator.js
 * Rendementscalculator voor het Apollo Senior Living Fund
 * Versie: 1.0.0 | 2026-05-06
 *
 * Functionaliteit:
 * - Slider €100.000 – €1.000.000 (stap €10.000)
 * - Live berekening: jaarlijks rendement (8%), kwartaaluitkering, totaal na looptijd
 * - Vergelijking: spaarrekening (1,5%), staatsobligaties (2,8%), FVRE (8%)
 * - Animated count-up bij slider beweging
 * - Email capture modal bij CTA klik
 */

'use strict';

/* =============================================================================
   CONFIGURATIE
============================================================================= */

const CONFIG = {
  fvreRate:     0.08,   // 8% jaarlijks doelrendement FVRE
  savingsRate:  0.015,  // 1,5% spaarrekening
  bondsRate:    0.028,  // 2,8% staatsobligaties
  defaultYears: 5,      // standaard looptijd voor totaalberekening
  animDuration: 600,    // ms voor count-up animatie bij slider
  sliderMin:    100000,
  sliderMax:    1000000,
  sliderStep:   10000,
};

/* =============================================================================
   UTILITIES
============================================================================= */

/**
 * Formatteert bedrag als Nederlandse euro-string
 * @param {number} value
 * @param {boolean} compact - gebruik "€ 250.000" vs "€ 250.000,00"
 * @returns {string}
 */
function formatEuro(value, compact = true) {
  if (compact) {
    return '€\u00A0' + new Intl.NumberFormat('nl-NL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  }
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/**
 * Easing: ease-out-cubic
 * @param {number} t - progress 0-1
 * @returns {number}
 */
function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animeer een tekstnode van vorige waarde naar nieuwe waarde
 * Houdt raf-referentie bij zodat een nieuwe aanroep de vorige stopt
 */
const activeAnimations = new Map();

function animateValue(el, targetValue, formatter, duration) {
  if (!el) return;

  // Stop eventueel lopende animatie
  if (activeAnimations.has(el)) {
    cancelAnimationFrame(activeAnimations.get(el));
  }

  const startValue = parseFloat(el.getAttribute('data-current') || '0');
  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = startValue + (targetValue - startValue) * easeOut(progress);

    el.textContent = formatter(current);

    if (progress < 1) {
      const rafId = requestAnimationFrame(tick);
      activeAnimations.set(el, rafId);
    } else {
      el.setAttribute('data-current', targetValue);
      activeAnimations.delete(el);
    }
  }

  const rafId = requestAnimationFrame(tick);
  activeAnimations.set(el, rafId);
}

/* =============================================================================
   BEREKENINGEN
============================================================================= */

/**
 * Berekent rendement voor een investering
 * @param {number} principal - hoofdsom in euro
 * @param {number} annualRate - jaarlijks percentage (0.08 = 8%)
 * @param {number} years - looptijd
 * @returns {object}
 */
function calcReturns(principal, annualRate, years) {
  const annualReturn  = principal * annualRate;
  const quarterReturn = annualReturn / 4;
  const totalReturn   = principal * annualRate * years;
  const totalValue    = principal + totalReturn;

  return {
    annual:   annualReturn,
    quarter:  quarterReturn,
    total:    totalReturn,
    endValue: totalValue,
  };
}

/* =============================================================================
   SLIDER & DISPLAY
============================================================================= */

/**
 * Bereken percentage voor slider track vulling
 * @param {number} value
 * @returns {string} percentage als CSS string
 */
function sliderProgress(value) {
  const pct = ((value - CONFIG.sliderMin) / (CONFIG.sliderMax - CONFIG.sliderMin)) * 100;
  return pct.toFixed(2) + '%';
}

/**
 * Update alle calculator-elementen op basis van nieuw bedrag
 * @param {number} amount
 */
function updateCalculator(amount) {
  const fvre    = calcReturns(amount, CONFIG.fvreRate,    CONFIG.defaultYears);
  const savings = calcReturns(amount, CONFIG.savingsRate, CONFIG.defaultYears);
  const bonds   = calcReturns(amount, CONFIG.bondsRate,   CONFIG.defaultYears);

  // --- Bedrag display ---
  const amountDisplay = document.getElementById('calc-amount');
  if (amountDisplay) {
    animateValue(amountDisplay, amount, formatEuro, CONFIG.animDuration);
  }

  // --- Jaarlijks rendement ---
  const annualEl = document.getElementById('calc-annual');
  if (annualEl) {
    animateValue(annualEl, fvre.annual, function (v) {
      return formatEuro(v) + ' per jaar';
    }, CONFIG.animDuration);
  }

  // --- Kwartaaluitkering ---
  const quarterEl = document.getElementById('calc-quarterly');
  if (quarterEl) {
    animateValue(quarterEl, fvre.quarter, function (v) {
      return formatEuro(v) + ' per kwartaal';
    }, CONFIG.animDuration);
  }

  // --- Totaal na looptijd ---
  const totalEl = document.getElementById('calc-total');
  if (totalEl) {
    animateValue(totalEl, fvre.endValue, function (v) {
      return formatEuro(v) + ' na ' + CONFIG.defaultYears + ' jaar';
    }, CONFIG.animDuration);
  }

  // --- Vergelijkingsbars & bedragen ---
  updateComparison(amount, fvre, savings, bonds);

  // --- Sla bedrag op in dataset voor modal ---
  const calculator = document.getElementById('calculator');
  if (calculator) {
    calculator.setAttribute('data-amount', amount);
  }
}

/**
 * Update de drie vergelijkingsitems (spaar, obligatie, FVRE)
 */
function updateComparison(amount, fvre, savings, bonds) {
  const maxTotal = fvre.total; // FVRE is altijd de referentie (100%)

  // Spaarrekening
  const savingsItem   = document.querySelector('.comp-item[data-type="savings"]');
  const savingsBar    = savingsItem ? savingsItem.querySelector('.comp-item__bar') : null;
  const savingsAmount = savingsItem ? savingsItem.querySelector('.comp-item__amount') : null;

  if (savingsBar) {
    const pct = (savings.total / maxTotal) * 100;
    savingsBar.style.width = Math.max(pct, 3).toFixed(1) + '%';
  }

  if (savingsAmount) {
    animateValue(savingsAmount, savings.total, formatEuro, CONFIG.animDuration);
  }

  // Staatsobligaties
  const bondsItem   = document.querySelector('.comp-item[data-type="bonds"]');
  const bondsBar    = bondsItem ? bondsItem.querySelector('.comp-item__bar') : null;
  const bondsAmount = bondsItem ? bondsItem.querySelector('.comp-item__amount') : null;

  if (bondsBar) {
    const pct = (bonds.total / maxTotal) * 100;
    bondsBar.style.width = Math.max(pct, 3).toFixed(1) + '%';
  }

  if (bondsAmount) {
    animateValue(bondsAmount, bonds.total, formatEuro, CONFIG.animDuration);
  }

  // FVRE (altijd 100%)
  const fvreItem   = document.querySelector('.comp-item[data-type="fvre"]');
  const fvreBar    = fvreItem ? fvreItem.querySelector('.comp-item__bar') : null;
  const fvreAmount = fvreItem ? fvreItem.querySelector('.comp-item__amount') : null;

  if (fvreBar) {
    fvreBar.style.width = '100%';
  }

  if (fvreAmount) {
    animateValue(fvreAmount, fvre.total, formatEuro, CONFIG.animDuration);
  }
}

/* =============================================================================
   MODAL — EMAIL CAPTURE
============================================================================= */

function initModal() {
  const ctaBtn  = document.getElementById('calc-cta');
  const modal   = document.getElementById('calc-modal');
  const closeBtn = document.getElementById('calc-modal-close');
  const form    = document.getElementById('calc-modal-form');

  if (!ctaBtn || !modal) return;

  // Open modal
  ctaBtn.addEventListener('click', function () {
    // Voeg gepersonaliseerd bedrag toe aan modal koptekst
    const calculator = document.getElementById('calculator');
    const amount = calculator ? parseInt(calculator.getAttribute('data-amount') || '250000') : 250000;
    const fvre = calcReturns(amount, CONFIG.fvreRate, CONFIG.defaultYears);

    const amountInModal = document.getElementById('modal-amount');
    if (amountInModal) {
      amountInModal.textContent = formatEuro(amount);
    }

    const returnInModal = document.getElementById('modal-return');
    if (returnInModal) {
      returnInModal.textContent = formatEuro(fvre.annual) + ' per jaar';
    }

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    // Focus op eerste input
    const firstInput = modal.querySelector('input[type="email"], input[type="text"]');
    if (firstInput) {
      setTimeout(function () { firstInput.focus(); }, 300);
    }
  });

  // Sluit modal via sluitknop
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Sluit modal via klik op overlay
  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Sluit modal via Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  // Formulier verzenden
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      handleModalSubmit(form, modal);
    });
  }

  function closeModal() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    if (ctaBtn) ctaBtn.focus();
  }
}

/**
 * Verwerkt het modal formulier
 * Toont succesmelding — koppel hier je eigen backend/CRM aan
 */
function handleModalSubmit(form, modal) {
  const submitBtn = form.querySelector('button[type="submit"]');

  // Valideer e-mail
  const emailInput = form.querySelector('input[type="email"]');
  if (emailInput && !emailInput.value.trim()) {
    emailInput.focus();
    emailInput.classList.add('is-error');
    return;
  }

  // Laadstatus
  if (submitBtn) {
    submitBtn.textContent = 'Verzenden…';
    submitBtn.disabled = true;
  }

  // Simuleer verzending (vervang door echte API-aanroep)
  setTimeout(function () {
    const successEl = form.querySelector('.form-success');
    const fieldsEl  = form.querySelector('.form-fields');

    if (fieldsEl) fieldsEl.style.display = 'none';
    if (successEl) successEl.style.display = 'block';

    // Sluit modal na 3 seconden
    setTimeout(function () {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      form.reset();
      if (fieldsEl) fieldsEl.style.display = '';
      if (successEl) successEl.style.display = 'none';
      if (submitBtn) {
        submitBtn.textContent = 'Ontvang mijn overzicht';
        submitBtn.disabled = false;
      }
    }, 3000);
  }, 1200);
}

/* =============================================================================
   SLIDER INITIALISATIE
============================================================================= */

function initSlider() {
  const slider = document.getElementById('calc-slider');
  if (!slider) return;

  // Stel initiële track-kleur in via CSS custom property
  function updateSliderTrack(slider) {
    const pct = sliderProgress(parseInt(slider.value));
    slider.style.setProperty('--slider-progress', pct);
  }

  // Verwerk slider beweging
  function onSliderChange() {
    const amount = parseInt(slider.value);
    updateSliderTrack(slider);
    updateCalculator(amount);
  }

  slider.addEventListener('input', onSliderChange);

  // Touch-friendly: ook change event voor discrete browsers
  slider.addEventListener('change', onSliderChange);

  // Initiële berekening
  updateSliderTrack(slider);
  updateCalculator(parseInt(slider.value));
}

/* =============================================================================
   INITIALISATIE
============================================================================= */

function initCalculator() {
  // Controleer of calculator op de pagina staat
  const calculator = document.getElementById('calculator');
  if (!calculator) return;

  initSlider();
  initModal();
}

// Starten zodra DOM gereed is
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalculator);
} else {
  initCalculator();
}
