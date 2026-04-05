/* ============================================================
   anim.js — Portfolio Animation Engine v4 CINEMATIC
   ============================================================ */

'use strict';

/* ── helpers ─────────────────────────────────────────────── */
const isMobile = () => window.innerWidth <= 768;
const isPointerFine = () => window.matchMedia('(pointer: fine)').matches;

/* ════════════════════════════════════════════════════════════
   0. CINEMATIC PRELOADER
════════════════════════════════════════════════════════════ */
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  const nameEl = preloader.querySelector('.pl-name');
  const ruleEl = preloader.querySelector('.pl-rule');
  const metaEl = preloader.querySelector('.pl-meta');
  const numEl  = document.getElementById('pl-num');

  requestAnimationFrame(() => requestAnimationFrame(() => {
    nameEl?.classList.add('revealed');
    ruleEl?.classList.add('revealed');
    metaEl?.classList.add('revealed');
  }));

  const DURATION  = 1900;
  const startTime = performance.now();

  function tickCounter(now) {
    const t = Math.min((now - startTime) / DURATION, 1);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const n = Math.round(eased * 100);
    if (numEl) numEl.textContent = String(n).padStart(3, '0');

    if (t < 1) {
      requestAnimationFrame(tickCounter);
    } else {
      setTimeout(() => {
        preloader.classList.add('exit');
        setTimeout(() => preloader.remove(), 1050);
      }, 350);
    }
  }
  requestAnimationFrame(tickCounter);
});

/* ════════════════════════════════════════════════════════════
   1. PARTICLE FIELD (FIXED: Continuous Movement)
════════════════════════════════════════════════════════════ */
class ParticleField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d', { willReadFrequently: false, alpha: true });
    this.pts    = [];
    this.orbs   = [];
    this.mx     = window.innerWidth  / 2;
    this.my     = window.innerHeight / 2;
    this.raf    = null;

    this._resize  = this._resize.bind(this);
    this._onMouse = this._onMouse.bind(this);
    this._draw    = this._draw.bind(this);

    this._resize();
    this._bindEvents();
    this._draw();
  }

  _resize() {
    this.W = this.canvas.width  = window.innerWidth;
    this.H = this.canvas.height = window.innerHeight;
    this._spawn();
  }

  _spawn() {
    const mobile = isMobile();
    const density = mobile ? 24000 : 11000;
    const count   = Math.min(Math.floor((this.W * this.H) / density), mobile ? 40 : 100);
    this.pts = Array.from({ length: count }, () => this._makePt(mobile));

    const orbCount = mobile ? 3 : 6;
    this.orbs = Array.from({ length: orbCount }, () => this._makeOrb());
  }

  _makePt(mobile) {
    const spd = mobile ? 0.12 : 0.22;
    return {
      x:  Math.random() * this.W,
      y:  Math.random() * this.H,
      // Base velocity ensures they NEVER stop moving
      baseVx: (Math.random() - 0.5) * spd,
      baseVy: (Math.random() - 0.5) * spd,
      // Mouse velocity gets added on hover and then damped out
      mouseVx: 0,
      mouseVy: 0,
      r:  Math.random() * 1.3 + 0.4,
      a:  Math.random() * 0.38 + 0.05,
      ph: Math.random() * Math.PI * 2,
      ps: Math.random() * 0.012 + 0.003,
    };
  }

  _makeOrb() {
    const colours = ['152, 134, 134', '92, 78, 78', '178, 148, 120', '60, 52, 72', '130, 110, 100'];
    const col = colours[Math.floor(Math.random() * colours.length)];
    const r = Math.random() * 280 + 180; 

    const oc = document.createElement('canvas');
    oc.width = r * 2;
    oc.height = r * 2;
    const octx = oc.getContext('2d', { willReadFrequently: false });
    const g = octx.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0,   `rgba(${col}, 1)`);
    g.addColorStop(0.5, `rgba(${col}, 0.35)`);
    g.addColorStop(1,   `rgba(0,0,0,0)`);
    octx.fillStyle = g;
    octx.beginPath();
    octx.arc(r, r, r, 0, Math.PI * 2);
    octx.fill();

    return {
      x:   Math.random() * this.W,
      y:   Math.random() * this.H,
      vx:  (Math.random() - 0.5) * 0.18,
      vy:  (Math.random() - 0.5) * 0.18,
      r:   r,
      ph:  Math.random() * Math.PI * 2,
      ps:  0.002 + Math.random() * 0.004,
      img: oc 
    };
  }

  _bindEvents() {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(this._resize, 200);
    }, { passive: true });

    if (isPointerFine()) {
      window.addEventListener('mousemove', this._onMouse, { passive: true });
    }
  }

  _onMouse(e) {
    this.mx = e.clientX;
    this.my = e.clientY;
  }

  _draw() {
    const { ctx, W, H, pts, orbs, mx, my } = this;
    const mobile = isMobile();

    ctx.clearRect(0, 0, W, H);

    /* ── 1. Ambient breathing orbs ─────────────────────────── */
    ctx.globalCompositeOperation = 'lighter';
    for (const o of orbs) {
      o.ph += o.ps;
      o.x  += o.vx;
      o.y  += o.vy;

      if (o.x < -o.r)    o.vx = Math.abs(o.vx);
      if (o.x > W + o.r) o.vx = -Math.abs(o.vx);
      if (o.y < -o.r)    o.vy = Math.abs(o.vy);
      if (o.y > H + o.r) o.vy = -Math.abs(o.vy);

      const a = 0.028 + Math.sin(o.ph) * 0.014;
      ctx.globalAlpha = a;
      ctx.drawImage(o.img, o.x - o.r, o.y - o.r);
    }
    ctx.globalAlpha = 1.0; /* Reset */

    /* ── 2. Connection lines (desktop only) ─────────────────── */
    ctx.globalCompositeOperation = 'source-over';
    if (!mobile) {
      const THRESH = 140;
      ctx.lineWidth = 0.55;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx   = pts[i].x - pts[j].x;
          const dy   = pts[i].y - pts[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < THRESH) {
            const t = 1 - dist / THRESH;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(152,134,134,${t * t * 0.14})`; 
            ctx.stroke();
          }
        }
      }
    }

    /* ── 3. Particle dots ───────────────────────────────────── */
    const prxX = !mobile ? (mx - W * 0.5) * 0.022 : 0;
    const prxY = !mobile ? (my - H * 0.5) * 0.022 : 0;

    for (const p of pts) {
      p.ph += p.ps;
      const alpha = p.a + Math.sin(p.ph) * 0.09;

      // Mouse interaction
      if (!mobile) {
        const dx   = p.x - mx;
        const dy   = p.y - my;
        const dist = Math.hypot(dx, dy);
        if (dist < 95 && dist > 0) {
          const f = ((95 - dist) / 95) * 0.065;
          p.mouseVx += (dx / dist) * f;
          p.mouseVy += (dy / dist) * f;
        }
      }

      // Apply physics: Constant base velocity + decaying mouse velocity
      p.x += p.baseVx + p.mouseVx;
      p.y += p.baseVy + p.mouseVy;
      
      // Dampen only the mouse influence, leaving base movement intact!
      p.mouseVx *= 0.94;
      p.mouseVy *= 0.94;

      // Wrap around edges
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;

      ctx.beginPath();
      ctx.arc(p.x - prxX, p.y - prxY, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(209,208,208,${Math.max(0.02, alpha)})`;
      ctx.fill();
    }

    this.raf = requestAnimationFrame(this._draw);
  }
}

/* ════════════════════════════════════════════════════════════
   2. REVEAL ON SCROLL
════════════════════════════════════════════════════════════ */
class RevealOnScroll {
  constructor() {
    const options = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
    this.io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          this.io.unobserve(entry.target);
        }
      });
    }, options);
    document.querySelectorAll('.reveal').forEach(el => this.io.observe(el));
  }
}

/* ════════════════════════════════════════════════════════════
   3. SCROLL PROGRESS BAR
════════════════════════════════════════════════════════════ */
class ProgressBar {
  constructor() {
    this.bar     = document.getElementById('scroll-progress');
    this.ticking = false;
    if (!this.bar) return;
    window.addEventListener('scroll', this._onScroll.bind(this), { passive: true });
  }

  _onScroll() {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        this.bar.style.width = ((window.scrollY / max) * 100).toFixed(2) + '%';
        this.ticking = false;
      });
      this.ticking = true;
    }
  }
}

/* ════════════════════════════════════════════════════════════
   4. STICKY NAVBAR
════════════════════════════════════════════════════════════ */
class Navbar {
  constructor() {
    this.nav     = document.getElementById('navbar');
    this.ticking = false;
    if (!this.nav) return;
    window.addEventListener('scroll', this._onScroll.bind(this), { passive: true });
    this._onScroll();
  }

  _onScroll() {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.nav.classList.toggle('scrolled', window.scrollY > 55);
        this.ticking = false;
      });
      this.ticking = true;
    }
  }
}

/* ════════════════════════════════════════════════════════════
   5. TYPEWRITER
════════════════════════════════════════════════════════════ */
class Typewriter {
  constructor(el, lines, { speed = 55, pause = 2000, del = 28 } = {}) {
    this.el       = el;
    this.lines    = lines;
    this.speed    = speed;
    this.pause    = pause;
    this.del      = del;
    this.li       = 0;
    this.ci       = 0;
    this.deleting = false;
    this._tick();
  }

  _tick() {
    const line = this.lines[this.li];
    if (!this.deleting) {
      this.el.textContent = line.slice(0, ++this.ci);
      if (this.ci === line.length) {
        this.deleting = true;
        setTimeout(() => this._tick(), this.pause);
        return;
      }
      setTimeout(() => this._tick(), this.speed);
    } else {
      this.el.textContent = line.slice(0, --this.ci);
      if (this.ci === 0) {
        this.deleting = false;
        this.li = (this.li + 1) % this.lines.length;
      }
      setTimeout(() => this._tick(), this.del);
    }
  }
}

/* ════════════════════════════════════════════════════════════
   6. CUSTOM CURSOR
════════════════════════════════════════════════════════════ */
class Cursor {
  constructor() {
    if (!isPointerFine()) return;

    document.body.classList.add('has-cursor');

    this.dot  = document.getElementById('cursor-dot');
    this.ring = document.getElementById('cursor-ring');
    if (!this.dot || !this.ring) return;

    this.mx = -200; this.my = -200;
    this.rx = -200; this.ry = -200;
    this.hoverEl = null;

    window.addEventListener('mousemove', e => {
      this.mx = e.clientX;
      this.my = e.clientY;
    }, { passive: true });

    this._bindMagnetics();
    this._tick();
  }

  _bindMagnetics() {
    document.querySelectorAll('a, button, .card, .reel-item, .btn').forEach(el => {
      el.addEventListener('mouseenter', () => {
        this.ring.classList.add('hovered');
        this.hoverEl = el;
      });
      el.addEventListener('mouseleave', () => {
        this.ring.classList.remove('hovered');
        this.hoverEl = null;
      });
    });
  }

  _tick() {
    const dH = 2.5; 
    this.dot.style.transform = `translate3d(${this.mx - dH}px, ${this.my - dH}px, 0)`;

    let targetRX = this.mx;
    let targetRY = this.my;

    if (this.hoverEl) {
      const r  = this.hoverEl.getBoundingClientRect();
      const cx = r.left + r.width  * 0.5;
      const cy = r.top  + r.height * 0.5;
      targetRX = this.mx + (cx - this.mx) * 0.28;
      targetRY = this.my + (cy - this.my) * 0.28;
    }

    this.rx += (targetRX - this.rx) * 0.17;
    this.ry += (targetRY - this.ry) * 0.17;

    const rH = 17; 
    this.ring.style.transform = `translate3d(${this.rx - rH}px, ${this.ry - rH}px, 0)`;

    requestAnimationFrame(() => this._tick());
  }
}

/* ════════════════════════════════════════════════════════════
   7. HERO 3D TILT
════════════════════════════════════════════════════════════ */
function initHeroTilt() {
  if (!isPointerFine()) return;

  const hero    = document.getElementById('hero');
  const content = document.querySelector('.hero-content');
  if (!hero || !content) return;

  let active = false;

  window.addEventListener('mousemove', e => {
    if (!active) return;

    const cx = window.innerWidth  * 0.5;
    const cy = window.innerHeight * 0.5;
    const nx = (e.clientX - cx) / cx;
    const ny = (e.clientY - cy) / cy;

    const tiltX = ny * -5;
    const tiltY = nx * 5;
    const transX = nx * 7;
    const transY = ny * 5;

    content.style.transform =
      `perspective(1100px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translate3d(${transX}px, ${transY}px, 0)`;
  }, { passive: true });

  hero.addEventListener('mouseenter', () => { active = true;  });
  hero.addEventListener('mouseleave', () => {
    active = false;
    content.style.transform = '';
  });
}

/* ════════════════════════════════════════════════════════════
   8. CARD SPOTLIGHT
════════════════════════════════════════════════════════════ */
function initCardSpotlight() {
  if (!isPointerFine()) return;

  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width  * 100).toFixed(1);
      const my = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
      card.style.setProperty('--mx', `${mx}%`);
      card.style.setProperty('--my', `${my}%`);

      const rx = ((e.clientY - r.top  - r.height * 0.5) / r.height) * -9;
      const ry = ((e.clientX - r.left - r.width  * 0.5) / r.width)  * 9;
      card.style.transform =
        `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-5px)`;
    }, { passive: true });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ════════════════════════════════════════════════════════════
   9. MOBILE MENU
════════════════════════════════════════════════════════════ */
function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const menu   = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', open);
  });

  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.classList.remove('active');
    });
  });
}

/* ════════════════════════════════════════════════════════════
   10. NAV LINK SMOOTH SCROLL
════════════════════════════════════════════════════════════ */
function initNavLinks() {
  document.querySelectorAll('[data-to]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById(el.dataset.to);
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
      document.getElementById('mobile-menu')?.classList.remove('open');
      document.getElementById('menu-toggle')?.classList.remove('active');
    });
  });
}

/* ════════════════════════════════════════════════════════════
   11. HERO ENTRY ANIMATION
════════════════════════════════════════════════════════════ */
function heroEntry() {
  const content = document.querySelector('.hero-content');
  if (!content) return;
  setTimeout(() => {
    content.classList.add('visible');
    setTimeout(() => content.classList.add('tilt-ready'), 1400);
  }, 350);
}

/* ════════════════════════════════════════════════════════════
   BOOT
════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('particle-canvas');
  if (canvas) new ParticleField(canvas);

  new RevealOnScroll();
  new ProgressBar();
  new Navbar();

  const twEl = document.getElementById('tw-text');
  if (twEl) {
    new Typewriter(twEl, [
      'AI & Machine Learning.',
      'Frontend Developer.',
      'UI/UX Designer.',
      'Creative Technologist.',
      'Video Director.',
    ]);
  }

  new Cursor();
  initHeroTilt();
  setTimeout(initCardSpotlight, 150);
  initNavLinks();
  initMobileMenu();
  heroEntry();
});