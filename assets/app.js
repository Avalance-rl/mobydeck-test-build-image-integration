/* ── Звёздный фон ──────────────────────────────────────────────────────── */
(function initStars() {
  const canvas = document.getElementById('star-canvas');
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function mkStar() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + .2,
      a: Math.random(),
      speed: Math.random() * .003 + .001,
      phase: Math.random() * Math.PI * 2,
    };
  }

  function initStarsList() {
    stars = Array.from({ length: 180 }, mkStar);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = performance.now() / 1000;
    for (const s of stars) {
      const alpha = s.a * (.4 + .6 * Math.sin(t * s.speed * 10 + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); initStarsList(); });
  resize();
  initStarsList();
  draw();
})();

/* ── Счётчики-статы ────────────────────────────────────────────────────── */
function animCount(el, target, suffix = '', decimals = 0) {
  const dur = 1600;
  const start = performance.now();
  const run = now => {
    const p = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    const val = target * ease;
    el.textContent = (decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString('ru')) + suffix;
    if (p < 1) requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
}

/* ── Анимации при скролле ──────────────────────────────────────────────── */
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');

        // Запускаем счётчики, когда stats-строка попадает в поле зрения
        if (e.target.classList.contains('stats-row')) {
          animCount(document.getElementById('stat-seats'),   80, '+');
          animCount(document.getElementById('stat-fps'),    240, ' fps');
          animCount(document.getElementById('stat-hours'),   24, '/7');
          animCount(document.getElementById('stat-members'), 3, 'к+');
        }

        observer.unobserve(e.target);
      }
    });
  }, { threshold: .15 });

  document.querySelectorAll('.reveal, .stats-row').forEach(el => observer.observe(el));
}

/* ── Активная ссылка в навбаре при скролле ─────────────────────────────── */
function initNavHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-links a[href^="#"]');

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: .35 });

  sections.forEach(s => obs.observe(s));
}

/* ── Плавный скролл по якорям ──────────────────────────────────────────── */
function initSmoothLinks() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ── Параллакс Hero-заголовка ──────────────────────────────────────────── */
function initParallax() {
  const hero = document.querySelector('.hero-title');
  if (!hero) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    hero.style.transform = `translateY(${y * .12}px)`;
  }, { passive: true });
}

/* ── Эффект магнита на кнопках ─────────────────────────────────────────── */
function initMagnet() {
  document.querySelectorAll('.btn-primary, .btn-plan').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) * .25;
      const dy = (e.clientY - r.top  - r.height / 2) * .25;
      btn.style.transform = `translate(${dx}px,${dy}px) translateY(-2px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

/* ── Бегущая строка (онлайн-счётчик в badge) ───────────────────────────── */
function initOnlineTicker() {
  const el = document.getElementById('online-count');
  if (!el) return;
  let val = 34 + Math.floor(Math.random() * 12);
  el.textContent = val;
  setInterval(() => {
    val += Math.floor(Math.random() * 5) - 2;
    val = Math.max(20, Math.min(val, 70));
    el.textContent = val;
  }, 4000);
}

/* ── Инициализация ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initNavHighlight();
  initSmoothLinks();
  initParallax();
  initMagnet();
  initOnlineTicker();
});
