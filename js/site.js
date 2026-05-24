// ===== Theme =====
(function () {
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  if (saved) root.setAttribute('data-theme', saved);
  window.toggleTheme = function () {
    const cur = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = cur === 'light' ? 'dark' : 'light';
    if (next === 'dark') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', next);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = next === 'light' ? '☾' : '☀';
  };
})();

// ===== Splash =====
window.addEventListener('load', () => {
  setTimeout(() => {
    const s = document.getElementById('splash');
    if (s) s.classList.add('gone');
  }, 900);
});

// ===== Reveal on scroll =====
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

function bindReveals() {
  document.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));
}
window.bindReveals = bindReveals;

// ===== Magnetic buttons =====
function bindMagnets() {
  document.querySelectorAll('[data-magnet]').forEach(el => {
    if (el._magnetBound) return;
    el._magnetBound = true;
    const strength = parseFloat(el.dataset.magnet) || 0.25;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}
window.bindMagnets = bindMagnets;

// ===== Spotlight on cards =====
function bindSpotlight() {
  document.querySelectorAll('[data-spotlight]').forEach(card => {
    if (card._spotBound) return;
    card._spotBound = true;
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}
window.bindSpotlight = bindSpotlight;

// ===== Parallax =====
function bindParallax() {
  const els = document.querySelectorAll('[data-parallax]');
  if (!els.length) return;
  let ticking = false;
  function update() {
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      const speed = parseFloat(el.dataset.parallax) || 0.15;
      const offset = (window.innerHeight / 2 - (r.top + r.height / 2)) * speed;
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    });
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
}
window.bindParallax = bindParallax;

// ===== Page fade for nav links =====
function bindPageFade() {
  const fade = document.getElementById('page-fade');
  document.querySelectorAll('[data-fade-link]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href') || '';
      if (!href || href.startsWith('#')) return;
      e.preventDefault();
      fade.classList.add('show');
      setTimeout(() => { window.location.href = href; }, 420);
    });
  });
}
window.bindPageFade = bindPageFade;

// ===== Mount hook =====
window.afterMount = function () {
  bindReveals();
  bindMagnets();
  bindSpotlight();
  bindParallax();
  bindPageFade();
};
