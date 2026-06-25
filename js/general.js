
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
    item.addEventListener('click', function () {
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
