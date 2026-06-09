/* ── Мок-данные ────────────────────────────────────────────────────────── */

const APPS = [
  { name: 'web-frontend',  branch: 'main',    status: 'running',  ago: 3,   reqs: [42,55,61,48,70,65,80] },
  { name: 'api-gateway',   branch: 'main',    status: 'running',  ago: 8,   reqs: [80,72,91,85,78,88,95] },
  { name: 'auth-service',  branch: 'release', status: 'building', ago: 1,   reqs: [30,35,28,40,33,29,38] },
  { name: 'worker',        branch: 'develop', status: 'running',  ago: 22,  reqs: [10,12,9,15,11,14,13] },
  { name: 'analytics',     branch: 'feature/dashboard', status: 'pending', ago: 47, reqs: [5,8,6,7,9,5,8] },
  { name: 'mailer',        branch: 'main',    status: 'failed',   ago: 63,  reqs: [0,0,0,2,0,0,1] },
  { name: 'image-resize',  branch: 'fix/oom', status: 'building', ago: 2,   reqs: [20,18,22,25,19,23,21] },
  { name: 'notifications', branch: 'main',    status: 'running',  ago: 115, reqs: [60,55,70,65,58,72,68] },
];

// Данные для графика: 24 точки (последний час по 2.5 мин)
const chartData = Array.from({ length: 24 }, (_, i) => Math.round(200 + Math.sin(i * 0.4) * 80 + Math.random() * 60));

const ACTIVITY_TEMPLATES = [
  (u, a) => ({ type: 'deploy', text: `<strong>${u}</strong> задеплоил(а) <strong>${a}</strong> в production`, icon: iconDeploy() }),
  (u, a) => ({ type: 'build',  text: `Сборка <strong>${a}</strong> завершена успешно`,                         icon: iconBuild() }),
  (u, a) => ({ type: 'user',   text: `Новый участник <strong>${u}</strong> присоединился к команде`,           icon: iconUser() }),
  (u, a) => ({ type: 'deploy', text: `<strong>${u}</strong> откатил(а) <strong>${a}</strong> до предыдущей версии`, icon: iconDeploy() }),
  (u, a) => ({ type: 'fail',   text: `Сборка <strong>${a}</strong> завершилась с ошибкой`,                     icon: iconFail() }),
  (u, a) => ({ type: 'build',  text: `<strong>${u}</strong> запустил(а) повторный деплой <strong>${a}</strong>`, icon: iconBuild() }),
];

const USERS = ['alice', 'bob', 'marina', 'ivan', 'dev-bot', 'carol', 'alex'];
const APP_NAMES = APPS.map(a => a.name);

const TOAST_MESSAGES = [
  a => ({ title: 'Деплой завершён',    body: `${a} успешно развёрнут в production`, type: 'success' }),
  a => ({ title: 'Сборка готова',      body: `Образ ${a}:latest загружен в registry`, type: 'success' }),
  a => ({ title: 'Новая версия',       body: `${a} обновлён до v${(Math.random()*3+1).toFixed(1)}.${randInt(0,9)}`, type: 'success' }),
  a => ({ title: 'Масштабирование',    body: `${a}: реплик увеличено до ${randInt(2,6)}`, type: 'warn' }),
];

/* ── KPI ───────────────────────────────────────────────────────────────── */

const kpi = {
  deploys: 47,
  online:  312,
  reqs:    84_231,
  uptime:  99.97,
};

// Анимированный счётчик от 0 до target
function animateCount(el, target, decimals = 0, suffix = '') {
  const duration = 1400;
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const val = target * ease;
    el.textContent = decimals > 0
      ? val.toFixed(decimals) + suffix
      : Math.round(val).toLocaleString('ru') + suffix;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function initKPI() {
  animateCount(document.getElementById('kpi-deploys'), kpi.deploys);
  animateCount(document.getElementById('kpi-online'),  kpi.online);
  animateCount(document.getElementById('kpi-reqs'),    kpi.reqs);
  animateCount(document.getElementById('kpi-uptime'),  kpi.uptime, 2, '%');
}

// Периодически слегка меняем KPI — имитация живых данных
function startKPIFlicker() {
  setInterval(() => {
    kpi.online  += randInt(-3, 5);
    kpi.reqs    += randInt(80, 250);
    if (Math.random() < 0.15) kpi.deploys++;

    const onlineEl = document.getElementById('kpi-online');
    onlineEl.textContent = kpi.online.toLocaleString('ru');
    document.getElementById('kpi-reqs').textContent = kpi.reqs.toLocaleString('ru');
    document.getElementById('kpi-deploys').textContent = kpi.deploys;
    document.getElementById('online-count').textContent = kpi.online;
  }, 3000);
}

/* ── График (инлайновый SVG) ───────────────────────────────────────────── */

function drawChart() {
  const svg = document.getElementById('chart');
  const W = svg.clientWidth || 600;
  const H = svg.clientHeight || 160;
  const PAD = { top: 10, right: 10, bottom: 10, left: 10 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const min = Math.min(...chartData);
  const max = Math.max(...chartData);
  const range = max - min || 1;

  const pts = chartData.map((v, i) => {
    const x = PAD.left + (i / (chartData.length - 1)) * innerW;
    const y = PAD.top  + (1 - (v - min) / range) * innerH;
    return [x, y];
  });

  const line   = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const areaBot = H - PAD.bottom;
  const area   = `${line} L${pts.at(-1)[0]},${areaBot} L${pts[0][0]},${areaBot} Z`;

  svg.innerHTML = `
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#2f81f7" stop-opacity=".35"/>
        <stop offset="100%" stop-color="#2f81f7" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${area}" fill="url(#grad)"/>
    <path d="${line}" fill="none" stroke="#2f81f7" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map((p, i) => i === pts.length - 1
      ? `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#2f81f7" stroke="#0d1117" stroke-width="2"/>`
      : '').join('')}
  `;
}

// Добавляет новую точку и сдвигает график вправо
function tickChart() {
  const last = chartData.at(-1);
  chartData.push(Math.max(50, Math.round(last + (Math.random() - 0.45) * 60)));
  chartData.shift();
  drawChart();
}

window.addEventListener('resize', drawChart);

/* ── Таблица приложений ────────────────────────────────────────────────── */

function renderApps() {
  const tbody = document.getElementById('apps-tbody');
  tbody.innerHTML = APPS.map(app => `
    <tr>
      <td>
        <div class="app-name">${app.name}</div>
        <div class="app-branch">${iconBranch()} ${app.branch}</div>
      </td>
      <td><span class="badge ${app.status}">${statusLabel(app.status)}</span></td>
      <td class="time-ago">${fmtAgo(app.ago)}</td>
      <td>${sparkline(app.reqs)}</td>
    </tr>
  `).join('');
}

function statusLabel(s) {
  return { running: 'Running', building: 'Building', failed: 'Failed', pending: 'Pending' }[s] || s;
}

function fmtAgo(minutes) {
  if (minutes < 60)  return `${minutes} мин назад`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}ч ${m}м назад` : `${h}ч назад`;
}

function sparkline(data) {
  const W = 64, H = 24;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return `<svg class="sparkline" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <polyline points="${pts}" fill="none" stroke="#2f81f7" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`;
}

/* ── Лента активности ──────────────────────────────────────────────────── */

// Начальный список событий
const initialActivity = [
  { type: 'deploy', text: '<strong>alice</strong> задеплоила <strong>web-frontend</strong> в production', icon: iconDeploy(), ago: 0 },
  { type: 'build',  text: 'Сборка <strong>api-gateway</strong> завершена успешно', icon: iconBuild(), ago: 2 },
  { type: 'user',   text: 'Новый участник <strong>marina</strong> присоединился к команде', icon: iconUser(), ago: 5 },
  { type: 'deploy', text: '<strong>bob</strong> задеплоил <strong>notifications</strong> в production', icon: iconDeploy(), ago: 9 },
  { type: 'build',  text: 'Сборка <strong>image-resize</strong> запущена', icon: iconBuild(), ago: 12 },
  { type: 'fail',   text: 'Сборка <strong>mailer</strong> завершилась с ошибкой', icon: iconFail(), ago: 18 },
];

let activityItems = [...initialActivity];

function renderActivity() {
  const list = document.getElementById('activity-list');
  list.innerHTML = activityItems.slice(0, 8).map(item => `
    <div class="activity-item">
      <div class="act-icon ${item.type}">${item.icon}</div>
      <div class="act-body">
        <div class="act-text">${item.text}</div>
        <div class="act-time">${item.ago === 0 ? 'только что' : `${item.ago} мин назад`}</div>
      </div>
    </div>
  `).join('');
}

function addActivityItem() {
  const u = pick(USERS);
  const a = pick(APP_NAMES);
  const tpl = pick(ACTIVITY_TEMPLATES);
  const ev  = tpl(u, a);
  activityItems = [{ ...ev, ago: 0 }, ...activityItems.map(i => ({ ...i, ago: i.ago + randInt(1, 3) }))];
  renderActivity();
}

/* ── Тосты ─────────────────────────────────────────────────────────────── */

function showToast({ title, body, type = 'success' }) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type === 'success' ? '' : type}`.trim();
  el.innerHTML = `<div class="toast-title">${title}</div><div class="toast-body">${body}</div>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toast-out .3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 4500);
}

function scheduleToasts() {
  function fire() {
    const a = pick(APP_NAMES);
    const tpl = pick(TOAST_MESSAGES);
    showToast(tpl(a));
    setTimeout(fire, randInt(10_000, 22_000));
  }
  setTimeout(fire, 3500);
}

/* ── Живые часы ────────────────────────────────────────────────────────── */

function startClock() {
  const el = document.getElementById('clock');
  function tick() {
    const d = new Date();
    el.textContent = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  tick();
  setInterval(tick, 1000);
}

/* ── Вспомогательные функции ───────────────────────────────────────────── */

function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick(arr)      { return arr[Math.floor(Math.random() * arr.length)]; }

/* ── SVG-иконки (инлайн, без внешних ресурсов) ────────────────────────── */

function iconDeploy() {
  return `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm3.54 6.06L7.5 10.1 4.96 7.56a.75.75 0 0 1 1.06-1.06L7.5 7.98l3-3a.75.75 0 0 1 1.06 1.06z"/>
  </svg>`;
}

function iconBuild() {
  return `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M14.5 1.5a1 1 0 0 0-1-1h-10a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-13zm-2 1v11h-8V2.5h8zm-2.5 2H5.5a.5.5 0 0 0 0 1h4.5a.5.5 0 0 0 0-1zm0 2.5H5.5a.5.5 0 0 0 0 1h4.5a.5.5 0 0 0 0-1zm-2 2.5H5.5a.5.5 0 0 0 0 1H8a.5.5 0 0 0 0-1z"/>
  </svg>`;
}

function iconUser() {
  return `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M10.5 5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zm.5 3.5a3 3 0 0 0-3-3h-1a3 3 0 0 0-3 3v.5A.5.5 0 0 0 4.5 9H5a.5.5 0 0 0 .5-.5v-.5A2 2 0 0 1 7.5 6h1a2 2 0 0 1 2 2v.5a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 .5-.5V8.5z"/>
  </svg>`;
}

function iconFail() {
  return `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.54 10.46a.75.75 0 0 1-1.06 1.06L8 9.06l-2.46 2.46a.75.75 0 0 1-1.06-1.06L6.94 8 4.48 5.54a.75.75 0 0 1 1.06-1.06L8 6.94l2.46-2.46a.75.75 0 0 1 1.06 1.06L9.06 8l2.46 2.46z"/>
  </svg>`;
}

function iconBranch() {
  return `<svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm0 2.122a2.25 2.25 0 1 0-1.5 0v.878A2.25 2.25 0 0 0 5.75 8.5h1.5v2.128a2.251 2.251 0 1 0 1.5 0V8.5h1.5a2.25 2.25 0 0 0 2.25-2.25v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 5 6.25v-.878zm3.75 7.378a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm3-8.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z"/>
  </svg>`;
}

/* ── Инициализация ─────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  initKPI();
  startKPIFlicker();

  // Рисуем график после рендера (нужны размеры элемента)
  requestAnimationFrame(() => {
    drawChart();
  });

  renderApps();
  renderActivity();

  startClock();
  scheduleToasts();

  // Новое событие в ленту каждые ~15–25 секунд
  setInterval(addActivityItem, randInt(15_000, 25_000));

  // Новая точка на графике каждые 8 секунд
  setInterval(tickChart, 8_000);
});
