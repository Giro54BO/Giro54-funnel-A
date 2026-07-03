
document.documentElement.classList.add('js-loaded');

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        } else {
            entry.target.classList.remove('show');
        }
    });
});

const hiddenElements = document.querySelectorAll('.hidden');
hiddenElements.forEach((el) => observer.observe(el));

// ── Currency picker dropdown ──
(function () {
  var triggerBtn  = document.getElementById('currency-picker-btn');
  var menu        = document.getElementById('currency-picker-menu');
  var symbolEl    = document.getElementById('price-symbol');
  var amountEl    = document.getElementById('price-amount');
  var labelEl     = document.getElementById('currency-label');
  if (!triggerBtn || !menu) return;

  function openMenu() {
    menu.hidden = false;
    triggerBtn.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    menu.hidden = true;
    triggerBtn.setAttribute('aria-expanded', 'false');
  }

  triggerBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    menu.hidden ? openMenu() : closeMenu();
  });

  menu.querySelectorAll('.currency-picker-item').forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.querySelectorAll('.currency-picker-item').forEach(function (i) { i.classList.remove('active'); });
      item.classList.add('active');
      symbolEl.textContent = item.dataset.symbol;
      amountEl.textContent = item.dataset.amount;
      labelEl.textContent  = item.dataset.label;
      closeMenu();
    });
  });

  document.addEventListener('click', function () { closeMenu(); });
})();

// ── Live exchange rates ──
(function () {
  var BASE_USD   = 500;
  var CACHE_KEY  = 'giro54_rates_v4';

  var fmt = new Intl.NumberFormat('es-BO', { maximumFractionDigits: 0 });

  function roundAmount(amount, rate) {
    // Round to a "clean" figure based on magnitude
    if (amount >= 1000000) return Math.round(amount / 10000) * 10000;
    if (amount >= 100000)  return Math.round(amount / 1000)  * 1000;
    if (amount >= 10000)   return Math.round(amount / 100)   * 100;
    if (amount >= 1000)    return Math.round(amount / 25)    * 25;
    return Math.round(amount / 5) * 5;
  }

  function applyRates(rates) {
    var menu     = document.getElementById('currency-picker-menu');
    var amountEl = document.getElementById('price-amount');
    var rateNote = document.getElementById('rate-note');
    if (!menu) return;

    menu.querySelectorAll('.currency-picker-item').forEach(function (btn) {
      var code = btn.dataset.currency;
      if (!code || code === 'USD' || !rates[code]) return;
      var converted = BASE_USD * rates[code];
      var rounded   = roundAmount(converted, rates[code]);
      var formatted = fmt.format(rounded);
      btn.dataset.amount = formatted;
      if (btn.classList.contains('active') && amountEl) {
        amountEl.textContent = formatted;
      }
    });

    if (rateNote) rateNote.style.display = '';
  }

  function tryCache() {
    try {
      var cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (!cached) return null;
      var now = Date.now();
      // Most recent 00:01 UTC (= 20:01 Bolivia time, when BCB posts the daily rate)
      var d = new Date(now);
      var lastReset = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 1, 0);
      if (now < lastReset) lastReset -= 24 * 60 * 60 * 1000;
      return cached.ts >= lastReset ? cached.rates : null;
    } catch (e) {}
    return null;
  }

  function saveCache(rates) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), rates: rates })); } catch (e) {}
  }

  function fetchBOBFromBCB(fallback) {
    var bcbUrl   = 'https://www.bcb.gob.bo/librerias/indicadores/otras/ultimo.php';
    var proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(bcbUrl);
    return fetch(proxyUrl)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        // The page is a compact indicators table; grab every decimal in the 5–20 range
        // that appears after a USD / dólar label on the same row/cell
        var patterns = [
          /D[Ooó]LAR[^0-9]{0,60}([0-9]{1,2}[.,][0-9]{1,2})/i,
          /ESTADOS\s+UNIDOS[^0-9]{0,80}([0-9]{1,2}[.,][0-9]{1,2})/i,
          /(?:d[oó]lar|USD)[^0-9]{0,60}([0-9]{1,2}[.,][0-9]{2})/i
        ];
        for (var i = 0; i < patterns.length; i++) {
          var m = html.match(patterns[i]);
          if (m) {
            var rate = parseFloat(m[1].replace(',', '.'));
            if (rate > 5 && rate < 20) return rate;
          }
        }
        return fallback;
      })
      .catch(function () { return fallback; });
  }

  function init() {
    var cached = tryCache();
    if (cached) { applyRates(cached); return; }

    fetch('https://open.er-api.com/v6/latest/USD')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || data.result !== 'success') return;
        var rates = data.rates;
        // Override BOB with the official BCB rate
        return fetchBOBFromBCB(rates['BOB']).then(function (bobRate) {
          rates['BOB'] = bobRate;
          saveCache(rates);
          applyRates(rates);
        });
      })
      .catch(function () {});
  }

  init();
})();

// ── Before/After Comparison Slider (W3Schools pattern) ──
(function () {
  var containers = document.querySelectorAll('.img-comp-container');
  containers.forEach(function (container) {
    var overlay = container.querySelector('.img-comp-overlay');
    if (!overlay) return;

    // Build the slider handle
    var slider = document.createElement('div');
    slider.className = 'img-comp-slider';
    slider.innerHTML = '<i class="bi bi-chevron-left" style="font-size:0.75rem;"></i><i class="bi bi-chevron-right" style="font-size:0.75rem;"></i>';
    container.appendChild(slider);

    // Start at 50 %
    var w = container.offsetWidth;
    slide(w / 2);

    var clicked = false;

    slider.addEventListener('mousedown', function () { clicked = true; });
    window.addEventListener('mouseup',   function () { clicked = false; container.classList.remove('dragging'); });

    window.addEventListener('mousemove', function (e) {
      if (!clicked) return;
      container.classList.add('dragging');
      var rect = container.getBoundingClientRect();
      slide(e.clientX - rect.left);
    });

    slider.addEventListener('touchstart', function () { clicked = true; }, { passive: true });
    window.addEventListener('touchend',   function () { clicked = false; container.classList.remove('dragging'); });

    window.addEventListener('touchmove', function (e) {
      if (!clicked) return;
      container.classList.add('dragging');
      var rect = container.getBoundingClientRect();
      slide(e.touches[0].clientX - rect.left);
    }, { passive: true });

    function slide(x) {
      var total = container.offsetWidth;
      x = Math.max(0, Math.min(x, total));

      // Clip the overlay to x pixels wide
      overlay.style.width = x + 'px';
      // Keep the inner image at full width so it doesn't squish
      var img = overlay.querySelector('img');
      if (img) img.style.width = total + 'px';

      // Position the handle at the boundary
      slider.style.left = x + 'px';
    }
  });
})();
