/**
 * Startup Insight — app.js
 * Shared utilities and page-specific logic
 * Modular, well-commented, ready for Flask backend integration
 */

/* ============================================================
   SECTION 1 — Theme Manager
   ============================================================ */
const ThemeManager = {
  key: 'si-theme',

  init() {
    const saved = localStorage.getItem(this.key) || 'dark';
    this.apply(saved);
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => this.toggle());
    });
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    });
    localStorage.setItem(this.key, theme);
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    this.apply(current === 'dark' ? 'light' : 'dark');
  }
};

/* ============================================================
   SECTION 2 — Toast Notifications
   ============================================================ */
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3500) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-msg">${message}</span>
      <button class="toast-close" aria-label="Dismiss">✕</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => this.remove(toast));
    this.container.appendChild(toast);

    setTimeout(() => this.remove(toast), duration);
  },

  remove(toast) {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }
};

/* ============================================================
   SECTION 3 — Scroll Reveal (Intersection Observer)
   ============================================================ */
const ScrollReveal = {
  init() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger children
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => entry.target.classList.add('revealed'), delay);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('[data-reveal]').forEach((el, i) => {
      if (!el.dataset.delay) el.dataset.delay = i * 80;
      observer.observe(el);
    });
  }
};

/* ============================================================
   SECTION 4 — Navigation
   ============================================================ */
const NavManager = {
  init() {
    // Mobile menu
    const toggle = document.querySelector('.menu-toggle');
    const mobileNav = document.querySelector('.nav-mobile');

    if (toggle && mobileNav) {
      toggle.addEventListener('click', () => {
        const isOpen = mobileNav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen);
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!toggle.contains(e.target) && !mobileNav.contains(e.target)) {
          mobileNav.classList.remove('open');
        }
      });
    }

    // Mark active link
    const path = location.pathname.split('/').pop() || '/';
    document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === path || (path === '' && href === '/')) {
        a.classList.add('active');
      }
    });
  }
};

/* ============================================================
   SECTION 5 — Particle Canvas (Hero)
   ============================================================ */
const ParticleCanvas = {
  canvas: null, ctx: null, particles: [], mouse: { x: 0, y: 0 }, raf: null,

  init(id) {
    this.canvas = document.getElementById(id);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.createParticles();
    this.animate();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
  },

  resize() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
  },

  createParticles() {
    const count = Math.floor((this.canvas.width * this.canvas.height) / 14000);
    this.particles = Array.from({ length: Math.min(count, 60) }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.5 + 0.15,
    }));
  },

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    this.particles.forEach(p => {
      // Move
      p.x += p.vx; p.y += p.vy;

      // Wrap
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fillStyle = isDark
        ? `rgba(129,140,248,${p.alpha})`
        : `rgba(79,70,229,${p.alpha * 0.6})`;
      this.ctx.fill();

      // Connect to mouse
      const dx = p.x - this.mouse.x, dy = p.y - this.mouse.y;
      const distMouse = Math.sqrt(dx * dx + dy * dy);
      if (distMouse < 130) {
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(this.mouse.x, this.mouse.y);
        this.ctx.strokeStyle = isDark
          ? `rgba(129,140,248,${0.18 * (1 - distMouse / 130)})`
          : `rgba(79,70,229,${0.12 * (1 - distMouse / 130)})`;
        this.ctx.lineWidth = 0.7;
        this.ctx.stroke();
      }
    });

    // Connect nearby particles
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i], b = this.particles[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 90) {
          this.ctx.beginPath();
          this.ctx.moveTo(a.x, a.y);
          this.ctx.lineTo(b.x, b.y);
          this.ctx.strokeStyle = isDark
            ? `rgba(167,139,250,${0.12 * (1 - d / 90)})`
            : `rgba(79,70,229,${0.08 * (1 - d / 90)})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }

    this.raf = requestAnimationFrame(() => this.animate());
  }
};

/* ============================================================
   SECTION 6 — Counter Animation
   ============================================================ */
function animateCounter(el, target, duration = 1800, suffix = '') {
  let start = null;
  const step = (ts) => {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(eased * target).toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        animateCounter(el, +el.dataset.count, 1800, el.dataset.suffix || '');
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

/* ============================================================
   SECTION 7 — Prediction Form Logic
   ============================================================ */
const PredictForm = {
  form: null,
  overlay: null,

  init() {
    this.form = document.getElementById('predict-form');
    this.overlay = document.getElementById('loading-overlay');
    if (!this.form) return;

    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    document.getElementById('reset-btn')?.addEventListener('click', () => this.handleReset());

    // Live validation feedback
    this.form.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('blur', () => this.validateField(el));
      el.addEventListener('input', () => {
        const group = el.closest('.form-group');
        if (group?.classList.contains('invalid')) this.validateField(el);
      });
    });
  },

  validateField(el) {
    const group = el.closest('.form-group');
    if (!group) return true;
    const valid = el.checkValidity();
    group.classList.toggle('invalid', !valid);
    return valid;
  },

  validateAll() {
    let allValid = true;
    this.form.querySelectorAll('input[required], select[required]').forEach(el => {
      if (!this.validateField(el)) allValid = false;
    });
    return allValid;
  },

  handleReset() {
    this.form.reset();
    this.form.querySelectorAll('.form-group').forEach(g => g.classList.remove('invalid'));
    Toast.show('Form cleared.', 'info');
  },

  async handleSubmit(e) {
    e.preventDefault();
    if (!this.validateAll()) {
      Toast.show('Please fill in all required fields.', 'error');
      return;
    }

    // Gather form data
    const data = Object.fromEntries(new FormData(this.form));

    // Show loading
    this.showLoading();

    try {
      /**
       * POST /predict — replace with actual Flask endpoint when ready.
       * The response should contain: { prediction, probability, confidence,
       * risk_level, strengths, weaknesses, suggestions, ... }
       *
       * For now we simulate with a timeout and store demo data in sessionStorage.
       */
      // const response = await fetch('/predict', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      // const result = await response.json();

    // Send request to Flask backend
const response = await fetch("/predict", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
});

if (!response.ok) {
    throw new Error("Prediction request failed");
}

const result = await response.json();

this.saveToHistory(finalResult);

window.location.href = "/result";

    } catch (err) {
      console.error('[PredictForm] Error:', err);
      Toast.show('Prediction failed. Please try again.', 'error');
    } finally {
      this.hideLoading();
    }
  },

  /**
   * generateDemoResult — produces a plausible-looking AI result.
   * REMOVE this function when integrating with Flask.
   */
  generateDemoResult(data) {
    const probability = Math.floor(50 + Math.random() * 45);
    return {
      prediction: probability >= 65 ? 'SUCCESS' : 'NEEDS WORK',
      probability,
      confidence: Math.floor(70 + Math.random() * 25),
      risk_level: probability > 75 ? 'Low' : probability > 60 ? 'Medium' : 'High',
      funding_score: Math.floor(60 + Math.random() * 35),
      health_score: Math.floor(55 + Math.random() * 40),
      strengths: ['Strong funding pipeline', 'Large addressable market', 'Experienced founding team'],
      weaknesses: ['Revenue growth needs improvement', 'Team size could be larger'],
      suggestions: ['Accelerate customer acquisition', 'Improve monthly cash flow', 'Consider Series A round'],
    };
  },

  saveToHistory(entry) {
    const history = JSON.parse(localStorage.getItem('si-history') || '[]');
    history.unshift({
      id: Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      startup_name: entry.startup_name,
      industry: entry.industry,
      prediction: entry.prediction,
      probability: entry.probability,
    });
    localStorage.setItem('si-history', JSON.stringify(history.slice(0, 100))); // keep last 100
  },

  showLoading() {
    if (this.overlay) this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  hideLoading() {
    if (this.overlay) this.overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
};

/* ============================================================
   SECTION 8 — Result Page Logic
   ============================================================ */
const ResultPage = {
  data: null,

  init() {
    if (!document.getElementById('result-verdict')) return;

    const raw = sessionStorage.getItem('si-last-result');
    if (!raw) {
      // No data, redirect to predict
      Toast.show('No prediction data found. Please run a prediction first.', 'warning');
      setTimeout(() => window.location.href = '/predict', 1800);
      return;
    }

    this.data = JSON.parse(raw);
    this.render();
  },

  render() {
    const d = this.data;

    // Startup name
    const nameEl = document.getElementById('result-startup-name');
    if (nameEl) nameEl.textContent = d.startup_name || 'Your Startup';

    // Verdict
    const verdict = document.getElementById('result-verdict');
    if (verdict) {
      verdict.textContent = d.prediction;
      if (d.prediction !== 'SUCCESS') verdict.classList.add('fail');
    }

    // Probability ring
    const pct = d.probability || 0;
    document.querySelectorAll('.result-pct').forEach(el => el.textContent = pct + '%');

    // Animate ring
    const ring = document.getElementById('ring-progress');
    if (ring) {
      const circumference = 283;
      const offset = circumference - (pct / 100) * circumference;
      setTimeout(() => { ring.style.strokeDashoffset = offset; }, 300);
    }

    // Metrics
    this.setInner('result-confidence', (d.confidence || 85) + '%');
    this.setInner('result-risk', d.risk_level || 'Medium');
    this.setInner('result-probability', pct + '%');
    this.setInner('result-funding', (d.funding_score || 72) + '/100');
    this.setInner('result-health', (d.health_score || 68) + '/100');

    // Risk color
    const riskEl = document.getElementById('result-risk');
    if (riskEl) {
      riskEl.className = 'metric-value ' + (d.risk_level === 'Low' ? 'good' : d.risk_level === 'High' ? 'bad' : 'warn');
    }

    // Insights lists
    this.renderList('strengths-list', d.strengths, '✓', 'success');
    this.renderList('weaknesses-list', d.weaknesses, '✗', 'danger');
    this.renderList('suggestions-list', d.suggestions, '→', 'indigo');

    // Download report
    document.getElementById('download-btn')?.addEventListener('click', () => {
      Toast.show('Report download coming soon!', 'info');
    });

    // Predict again
    document.getElementById('predict-again-btn')?.addEventListener('click', () => {
      window.location.href = '/predict';
    });

    // Animate donut
    this.animateDonut(pct);
  },

  setInner(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  },

  renderList(id, items, icon, type) {
    const ul = document.getElementById(id);
    if (!ul || !items) return;
    ul.innerHTML = items.map(item => `
      <li>
        <span class="insight-icon" style="color:var(--${type === 'success' ? 'success' : type === 'danger' ? 'danger' : 'indigo-light'})">${icon}</span>
        <span>${item}</span>
      </li>
    `).join('');
  },

  animateDonut(pct) {
    const donut = document.getElementById('donut-progress');
    if (!donut) return;
    const circumference = 2 * Math.PI * 42; // r=42
    const offset = circumference - (pct / 100) * circumference;
    setTimeout(() => { donut.style.strokeDashoffset = offset; }, 400);
  }
};

/* ============================================================
   SECTION 9 — History Page Logic
   ============================================================ */
const HistoryPage = {
  data: [],
  filtered: [],
  page: 1,
  perPage: 8,

  init() {
    if (!document.getElementById('history-tbody')) return;

    this.data = JSON.parse(localStorage.getItem('si-history') || '[]');
    this.filtered = [...this.data];

    this.render();

    // Controls
    document.getElementById('history-search')?.addEventListener('input', (e) => this.search(e.target.value));
    document.getElementById('history-filter')?.addEventListener('change', (e) => this.filter(e.target.value));
    document.getElementById('sort-btn')?.addEventListener('click', () => this.sortToggle());
    document.getElementById('clear-history-btn')?.addEventListener('click', () => this.clearAll());
  },

  render() {
    const start = (this.page - 1) * this.perPage;
    const slice = this.filtered.slice(start, start + this.perPage);

    const tbody = document.getElementById('history-tbody');
    const emptyState = document.getElementById('empty-state');
    const tableWrap = document.getElementById('table-wrap');
    const countEl = document.getElementById('record-count');

    if (countEl) countEl.textContent = `${this.filtered.length} record${this.filtered.length !== 1 ? 's' : ''}`;

    if (this.filtered.length === 0) {
      if (tableWrap) tableWrap.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      this.renderPagination(0);
      return;
    }

    if (tableWrap) tableWrap.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = slice.map(row => `
      <tr>
        <td>${row.date}</td>
        <td style="color:var(--text-primary);font-weight:600">${row.startup_name}</td>
        <td>${row.industry}</td>
        <td>
          <span class="badge ${row.prediction === 'SUCCESS' ? 'badge-success' : 'badge-danger'}">
            ${row.prediction === 'SUCCESS' ? '✓' : '✗'} ${row.prediction}
          </span>
        </td>
        <td style="color:var(--text-primary);font-weight:600">${row.probability}%</td>
        <td>
          <div class="actions-cell">
            <button class="btn btn-ghost btn-sm" onclick="HistoryPage.viewEntry(${row.id})">View</button>
            <button class="btn btn-danger btn-sm" onclick="HistoryPage.deleteEntry(${row.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    this.renderPagination(this.filtered.length);
  },

  renderPagination(total) {
    const pages = Math.ceil(total / this.perPage);
    const container = document.getElementById('pagination');
    if (!container) return;

    if (pages <= 1) { container.innerHTML = ''; return; }

    let html = `<button class="page-btn" onclick="HistoryPage.goPage(${this.page - 1})" ${this.page === 1 ? 'disabled' : ''}>‹</button>`;
    for (let i = 1; i <= pages; i++) {
      html += `<button class="page-btn ${i === this.page ? 'active' : ''}" onclick="HistoryPage.goPage(${i})">${i}</button>`;
    }
    html += `<button class="page-btn" onclick="HistoryPage.goPage(${this.page + 1})" ${this.page === pages ? 'disabled' : ''}>›</button>`;
    container.innerHTML = html;
  },

  goPage(p) {
    const pages = Math.ceil(this.filtered.length / this.perPage);
    if (p < 1 || p > pages) return;
    this.page = p;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  search(q) {
    const term = q.toLowerCase();
    this.filtered = this.data.filter(r =>
      r.startup_name.toLowerCase().includes(term) ||
      r.industry.toLowerCase().includes(term)
    );
    this.page = 1;
    this.render();
  },

  filter(val) {
    if (!val || val === 'all') {
      this.filtered = [...this.data];
    } else {
      this.filtered = this.data.filter(r => r.prediction === val.toUpperCase());
    }
    this.page = 1;
    this.render();
  },

  sortToggle() {
    this.filtered.reverse();
    this.page = 1;
    this.render();
    Toast.show('Order reversed.', 'info');
  },

  viewEntry(id) {
    const entry = this.data.find(r => r.id === id);
    if (!entry) return;
    // Restore to session and navigate to result
    sessionStorage.setItem('si-last-result', JSON.stringify(entry));
    window.location.href = '/result';
  },

  deleteEntry(id) {
    this.data = this.data.filter(r => r.id !== id);
    this.filtered = this.filtered.filter(r => r.id !== id);
    localStorage.setItem('si-history', JSON.stringify(this.data));
    this.render();
    Toast.show('Prediction deleted.', 'success');
  },

  clearAll() {
    if (!confirm('Clear all prediction history? This cannot be undone.')) return;
    localStorage.removeItem('si-history');
    this.data = []; this.filtered = [];
    this.render();
    Toast.show('History cleared.', 'success');
  }
};

/* ============================================================
   SECTION 10 — Service Worker Registration (PWA)
   ============================================================ */
function registerServiceWorker() {
 if ('serviceWorker' in navigator){
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register(window.SI_SERVICE_WORKER_URL || '/static/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}
}

/* ============================================================
   SECTION 11 — Global Init
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  Toast.init();
  NavManager.init();
  ScrollReveal.init();
  initCounters();
  registerServiceWorker();

  // Page-specific
  ParticleCanvas.init('hero-canvas');
  PredictForm.init();
  ResultPage.init();
  HistoryPage.init();
});
