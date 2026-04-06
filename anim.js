/* ============================================================
   anim.js — Portfolio Animation Engine v6 FULL-SITE CINEMATIC
   ============================================================ */
 
'use strict';
 
/* ── Helpers ─────────────────────────────────────────────── */
const isMobile = () => window.innerWidth <= 768;
const isPointerFine = () => window.matchMedia('(pointer: fine)').matches;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
 
/* ════════════════════════════════════════════════════════════
   0. CINEMATIC PRELOADER & TEXT SCRAMBLE
════════════════════════════════════════════════════════════ */
class TextScrambler {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#_0101101';
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => this.resolve = resolve);
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = '';
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="scramble-char">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;
 
  const nameEl = document.getElementById('pl-name');
  const ruleEl = preloader.querySelector('.pl-rule');
  const metaEl = preloader.querySelector('.pl-meta');
  const numEl  = document.getElementById('pl-num');
 
  requestAnimationFrame(() => requestAnimationFrame(() => {
    nameEl?.classList.add('revealed');
    ruleEl?.classList.add('revealed');
    metaEl?.classList.add('revealed');
  }));
 
  const DURATION = 2200;
  const startTime = performance.now();
  
  if(nameEl) {
    const scrambler = new TextScrambler(nameEl);
    setTimeout(() => {
        scrambler.setText('WELCOME');
    }, 600);
  }
 
  function tickCounter(now) {
    const t = Math.min((now - startTime) / DURATION, 1);
    const eased = easeInOutCubic(t);
    const n = Math.round(eased * 100);
    if (numEl) numEl.textContent = String(n).padStart(3, '0');
 
    if (t < 1) {
      requestAnimationFrame(tickCounter);
    } else {
      setTimeout(() => {
        preloader.classList.add('exit');
        setTimeout(() => {
          preloader.remove();
          heroEntry();
        }, 1200);
      }, 400);
    }
  }
  requestAnimationFrame(tickCounter);
});
 
/* ════════════════════════════════════════════════════════════
   1. PARTICLE FIELD (Hardware Accelerated Canvas)
════════════════════════════════════════════════════════════ */
class ParticleField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: false, alpha: true });
    this.pts = [];
    this.orbs = [];
    this.mx = window.innerWidth / 2;
    this.my = window.innerHeight / 2;
    this.scrollOffset = 0;
 
    this._resize = this._resize.bind(this);
    this._onMouse = this._onMouse.bind(this);
    this._onScroll = this._onScroll.bind(this);
    this._draw = this._draw.bind(this);
 
    this._resize();
    this._bindEvents();
    this._draw();
  }
 
  _resize() {
    this.W = this.canvas.width = window.innerWidth;
    this.H = this.canvas.height = window.innerHeight;
    this._spawn();
  }
 
  _spawn() {
    const mobile = isMobile();
    const density = mobile ? 30000 : 12000;
    const count = Math.min(Math.floor((this.W * this.H) / density), mobile ? 30 : 90);
    this.pts = Array.from({ length: count }, () => this._makePt(mobile));
 
    const orbCount = mobile ? 2 : 5;
    this.orbs = Array.from({ length: orbCount }, () => this._makeOrb());
  }
 
  _makePt(mobile) {
    const spd = mobile ? 0.08 : 0.15;
    return {
      x: Math.random() * this.W, y: Math.random() * this.H,
      baseVx: (Math.random() - 0.5) * spd,
      baseVy: (Math.random() - 0.5) * spd,
      mouseVx: 0, mouseVy: 0,
      r: Math.random() * 1.4 + 0.35,
      a: Math.random() * 0.36 + 0.05,
      ph: Math.random() * Math.PI * 2,
      ps: Math.random() * 0.011 + 0.003,
    };
  }
 
  _makeOrb() {
    const colours = ['152,134,134','92,78,78','178,148,120','60,52,72','130,110,100'];
    const col = colours[Math.floor(Math.random() * colours.length)];
    const r = Math.random() * 300 + 160;
    const oc = document.createElement('canvas');
    oc.width = r * 2; oc.height = r * 2;
    const octx = oc.getContext('2d', { willReadFrequently: false });
    const g = octx.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, `rgba(${col},1)`);
    g.addColorStop(0.5, `rgba(${col},0.35)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    octx.fillStyle = g;
    octx.beginPath(); octx.arc(r, r, r, 0, Math.PI * 2); octx.fill();
    return {
      x: Math.random() * this.W, y: Math.random() * this.H,
      vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
      r, ph: Math.random() * Math.PI * 2, ps: 0.002 + Math.random() * 0.004, img: oc,
    };
  }
 
  _bindEvents() {
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(this._resize, 200); }, { passive: true });
    window.addEventListener('scroll', this._onScroll, { passive: true });
    if (isPointerFine()) window.addEventListener('mousemove', this._onMouse, { passive: true });
  }
 
  _onMouse(e) { this.mx = e.clientX; this.my = e.clientY; }
  _onScroll() { this.scrollOffset = window.scrollY * 0.15; }
 
  _draw() {
    const { ctx, W, H, pts, orbs, mx, my } = this;
    const mobile = isMobile();
    ctx.clearRect(0, 0, W, H);
 
    ctx.globalCompositeOperation = 'lighter';
    for (const o of orbs) {
      o.ph += o.ps; o.x += o.vx; o.y += o.vy;
      if (o.x < -o.r) o.vx = Math.abs(o.vx);
      if (o.x > W + o.r) o.vx = -Math.abs(o.vx);
      if (o.y < -o.r) o.vy = Math.abs(o.vy);
      if (o.y > H + o.r) o.vy = -Math.abs(o.vy);
      ctx.globalAlpha = 0.025 + Math.sin(o.ph) * 0.012;
      ctx.drawImage(o.img, o.x - o.r, o.y - o.r - (this.scrollOffset * 0.5));
    }
    ctx.globalAlpha = 1;
 
    ctx.globalCompositeOperation = 'source-over';
    if (!mobile) {
      const THRESH = 135;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < THRESH * THRESH) {
            const t = 1 - Math.sqrt(d2) / THRESH;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y - this.scrollOffset);
            ctx.lineTo(pts[j].x, pts[j].y - this.scrollOffset);
            ctx.strokeStyle = `rgba(152,134,134,${t * t * 0.12})`;
            ctx.stroke();
          }
        }
      }
    }
 
    const prxX = !mobile ? (mx - W * 0.5) * 0.02 : 0;
    const prxY = !mobile ? (my - H * 0.5) * 0.02 : 0;
 
    for (const p of pts) {
      p.ph += p.ps;
      const alpha = p.a + Math.sin(p.ph) * 0.08;
 
      if (!mobile) {
        const dx = p.x - mx, dy = (p.y - this.scrollOffset) - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < 9025 && d2 > 0) { 
          const d = Math.sqrt(d2);
          const f = ((95 - d) / 95) * 0.06;
          p.mouseVx += (dx / d) * f;
          p.mouseVy += (dy / d) * f;
        }
      }
 
      p.x += p.baseVx + p.mouseVx;
      p.y += p.baseVy + p.mouseVy;
      p.mouseVx *= 0.93; p.mouseVy *= 0.93;
 
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      
      const actualY = p.y - this.scrollOffset;
      if (actualY < -10) p.y += H + 20;
      if (actualY > H + 10) p.y -= (H + 20);
 
      ctx.beginPath();
      ctx.arc(p.x - prxX, actualY - prxY, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(209,208,208,${Math.max(0.02, alpha)})`;
      ctx.fill();
    }
    requestAnimationFrame(this._draw);
  }
}
 
/* ════════════════════════════════════════════════════════════
   2. SPLIT TEXT — char-by-char reveal
════════════════════════════════════════════════════════════ */
class SplitText {
  constructor() { this._prepare(); }
  _prepare() {
    document.querySelectorAll('.split-heading').forEach(el => this._splitEl(el));
  }
  _splitEl(el) {
    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        [...node.textContent].forEach((ch, i) => {
          if (ch === ' ') {
            frag.appendChild(document.createTextNode(' '));
          } else {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = ch;
            frag.appendChild(span);
          }
        });
        node.replaceWith(frag);
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'BR') {
        [...node.childNodes].forEach(walk);
      }
    };
    [...el.childNodes].forEach(walk);
 
    let idx = 0;
    el.querySelectorAll('.char').forEach(ch => {
      ch.style.transitionDelay = `${0.08 + idx * 0.025}s`;
      idx++;
    });
  }
}
 
/* ════════════════════════════════════════════════════════════
   3. UNIVERSAL SCROLL REVEAL 
════════════════════════════════════════════════════════════ */
class RevealOnScroll {
  constructor() {
    const opts = { threshold: 0.10, rootMargin: '0px 0px -40px 0px' };
    this.io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          requestAnimationFrame(() => {
            e.target.classList.add('visible');
          });
          this.io.unobserve(e.target);
        }
      });
    }, opts);
    document.querySelectorAll('.reveal, .split-heading').forEach(el => this.io.observe(el));
  }
}
 
/* ════════════════════════════════════════════════════════════
   4. SCROLL PROGRESS BAR
════════════════════════════════════════════════════════════ */
class ProgressBar {
  constructor() {
    this.bar = document.getElementById('scroll-progress');
    if (!this.bar) return;
    window.addEventListener('scroll', this._update.bind(this), { passive: true });
  }
  _update() {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    this.bar.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + '%';
  }
}
 
/* ════════════════════════════════════════════════════════════
   5. NAVBAR — Sticky + section active (Hide logic removed)
════════════════════════════════════════════════════════════ */
class Navbar {
  constructor() {
    this.nav = document.getElementById('navbar');
    this.links = [...document.querySelectorAll('.nav-links a[data-to]')];
    this.sections = this.links.map(l => document.getElementById(l.dataset.to)).filter(Boolean);
    this.ticking = false;
    if (!this.nav) return;
    window.addEventListener('scroll', this._onScroll.bind(this), { passive: true });
    this._onScroll();
  }
 
  _onScroll() {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        
        // Add blurred background when scrolling down
        this.nav.classList.toggle('scrolled', y > 55);
 
        // Active link tracking
        let active = null;
        for (const sec of this.sections) {
          if (sec.getBoundingClientRect().top <= 100) active = sec.id;
        }
        this.links.forEach(l => l.classList.toggle('active', l.dataset.to === active));
        
        this.ticking = false;
      });
      this.ticking = true;
    }
  }
}
 
/* ════════════════════════════════════════════════════════════
   6. TYPEWRITER
════════════════════════════════════════════════════════════ */
class Typewriter {
  constructor(el, lines, { speed = 52, pause = 2200, del = 26 } = {}) {
    this.el = el; this.lines = lines;
    this.speed = speed; this.pause = pause; this.del = del;
    this.li = 0; this.ci = 0; this.deleting = false;
    this._tick();
  }
  _tick() {
    const line = this.lines[this.li];
    if (!this.deleting) {
      this.el.textContent = line.slice(0, ++this.ci);
      if (this.ci === line.length) {
        this.deleting = true;
        setTimeout(() => this._tick(), this.pause); return;
      }
      setTimeout(() => this._tick(), this.speed);
    } else {
      this.el.textContent = line.slice(0, --this.ci);
      if (this.ci === 0) { this.deleting = false; this.li = (this.li + 1) % this.lines.length; }
      setTimeout(() => this._tick(), this.del);
    }
  }
}
 
/* ════════════════════════════════════════════════════════════
   7. CUSTOM CURSOR + MAGNETIC + MOUSE TRAIL
════════════════════════════════════════════════════════════ */
class CursorSystem {
  constructor() {
    if (!isPointerFine() || isMobile()) return;
    document.body.classList.add('has-cursor');
    this.dot = document.getElementById('cursor-dot');
    this.ring = document.getElementById('cursor-ring');
    this.trailContainer = document.getElementById('cursor-trail-container');
    
    if (!this.dot || !this.ring) return;
    this.mx = -200; this.my = -200;
    this.rx = -200; this.ry = -200;
    this.hoverEl = null;
 
    this.COUNT = 10;
    this.trailPositions = Array.from({ length: this.COUNT }, () => ({ x: -200, y: -200 }));
    this.dots = Array.from({ length: this.COUNT }, (_, i) => {
      const d = document.createElement('div');
      d.className = 'trail-dot';
      const size = 3 - i * 0.2;
      d.style.cssText = `width:${size}px; height:${size}px; opacity:${0.35 - i * 0.03};`;
      this.trailContainer.appendChild(d);
      return d;
    });

    window.addEventListener('mousemove', e => { this.mx = e.clientX; this.my = e.clientY; }, { passive: true });
    window.addEventListener('mousedown', () => this.ring.classList.add('clicked'), { passive: true });
    window.addEventListener('mouseup', () => this.ring.classList.remove('clicked'), { passive: true });
 
    this._bindHovers();
    this._tick();
  }
 
  _bindHovers() {
    document.querySelectorAll('a, button, .card, .reel-item, .btn, .magnetic').forEach(el => {
      el.addEventListener('mouseenter', () => { this.ring.classList.add('hovered'); this.hoverEl = el; });
      el.addEventListener('mouseleave', () => { this.ring.classList.remove('hovered'); this.hoverEl = null; });
    });
  }
 
  _tick() {
    const dH = 2.5;
    this.dot.style.transform = `translate3d(${this.mx - dH}px, ${this.my - dH}px, 0)`;
 
    let targetRX = this.mx, targetRY = this.my;
    if (this.hoverEl) {
      const r = this.hoverEl.getBoundingClientRect();
      const cx = r.left + r.width * 0.5;
      const cy = r.top + r.height * 0.5;
      targetRX = this.mx + (cx - this.mx) * 0.28;
      targetRY = this.my + (cy - this.my) * 0.28;
    }
    this.rx = lerp(this.rx, targetRX, 0.17);
    this.ry = lerp(this.ry, targetRY, 0.17);
    const rH = 18;
    this.ring.style.transform = `translate3d(${this.rx - rH}px, ${this.ry - rH}px, 0)`;

    for (let i = this.trailPositions.length - 1; i > 0; i--) {
      this.trailPositions[i].x = lerp(this.trailPositions[i].x, this.trailPositions[i - 1].x, 0.6);
      this.trailPositions[i].y = lerp(this.trailPositions[i].y, this.trailPositions[i - 1].y, 0.6);
    }
    this.trailPositions[0].x = lerp(this.trailPositions[0].x, this.mx, 0.55);
    this.trailPositions[0].y = lerp(this.trailPositions[0].y, this.my, 0.55);
    
    this.dots.forEach((d, i) => {
      d.style.transform = `translate3d(${this.trailPositions[i].x}px, ${this.trailPositions[i].y}px, 0)`;
    });

    requestAnimationFrame(() => this._tick());
  }
}
 
/* ════════════════════════════════════════════════════════════
   8. MAGNETIC ELEMENTS
════════════════════════════════════════════════════════════ */
function initMagnetics() {
  if (!isPointerFine() || isMobile()) return;
  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width * 0.5;
      const cy = r.top + r.height * 0.5;
      const dx = (e.clientX - cx) * 0.28;
      const dy = (e.clientY - cy) * 0.28;
      el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}
 
/* ════════════════════════════════════════════════════════════
   9. HERO & CARD TILT 3D
════════════════════════════════════════════════════════════ */
function initHeroTilt() {
  if (!isPointerFine()) return;
  const hero = document.getElementById('hero');
  const content = document.querySelector('.hero-content');
  if (!hero || !content) return;
 
  let active = false, raf = null;
  let tx = 0, ty = 0, cx = 0, cy = 0;
 
  window.addEventListener('mousemove', e => { if (!active) return; cx = e.clientX; cy = e.clientY; }, { passive: true });
 
  function tick() {
    const W = window.innerWidth, H = window.innerHeight;
    const nx = (cx - W * 0.5) / (W * 0.5);
    const ny = (cy - H * 0.5) / (H * 0.5);
    tx = lerp(tx, ny * -5, 0.08);
    ty = lerp(ty, nx * 5, 0.08);
    content.style.transform = `perspective(1100px) rotateX(${tx}deg) rotateY(${ty}deg) translate3d(${nx * 6}px, ${ny * 4}px, 0)`;
    raf = requestAnimationFrame(tick);
  }
 
  hero.addEventListener('mouseenter', () => { active = true; raf = requestAnimationFrame(tick); });
  hero.addEventListener('mouseleave', () => { active = false; cancelAnimationFrame(raf); content.style.transform = ''; tx = ty = 0; });
}
 
function initCardSpotlight() {
  if (!isPointerFine()) return;
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width * 100).toFixed(1);
      const my = ((e.clientY - r.top) / r.height * 100).toFixed(1);
      card.style.setProperty('--mx', `${mx}%`);
      card.style.setProperty('--my', `${my}%`);
      const rx = ((e.clientY - r.top - r.height * 0.5) / r.height) * -8;
      const ry = ((e.clientX - r.left - r.width * 0.5) / r.width) * 8;
      card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(0, -6px, 0) scale(1.01)`;
    }, { passive: true });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}
 
/* ════════════════════════════════════════════════════════════
   10. NUMBER COUNTER
════════════════════════════════════════════════════════════ */
class CounterAnimation {
  constructor() {
    this.io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          this._animate(e.target);
          this.io.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.stat-num[data-target]').forEach(el => this.io.observe(el));
  }
  _animate(el) {
    const target = parseInt(el.dataset.target);
    const dur = 1400;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(easeOutExpo(t) * target);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
 
/* ════════════════════════════════════════════════════════════
   11. STAGGER REVEALS
════════════════════════════════════════════════════════════ */
function initReelStagger() {
  const items = document.querySelectorAll('.reel-item');
  if (!items.length) return;
  items.forEach((item, i) => {
    item.style.opacity = '0';
    item.style.transform = 'translate3d(-20px, 0, 0)';
    item.style.transition = `opacity .6s ${0.08 + i * 0.12}s cubic-bezier(0.16,1,0.3,1), transform .6s ${0.08 + i * 0.12}s cubic-bezier(0.16,1,0.3,1)`;
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const idx = [...items].indexOf(e.target);
        setTimeout(() => {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translate3d(0, 0, 0)';
        }, idx * 120);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  items.forEach(item => io.observe(item));
}

function initCardsReveal() {
  document.querySelectorAll('.cards-grid').forEach(grid => {
    const cards = grid.querySelectorAll('.card');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = [...cards].indexOf(e.target);
          e.target.style.transitionDelay = `${idx * 0.14}s`;
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    cards.forEach(c => io.observe(c));
  });
}

function initSkillStagger() {
  const grid = document.querySelector('.skills-grid');
  if (!grid) return;
  const items = grid.querySelectorAll('.skill-item');
  items.forEach((item, i) => {
    item.style.opacity = '0';
    item.style.transform = 'translate3d(0, 24px, 0) scale(0.96)';
    item.style.transition = `opacity .7s ${0.1 + i * 0.1}s cubic-bezier(0.16,1,0.3,1), transform .7s ${0.1 + i * 0.1}s cubic-bezier(0.34,1.56,0.64,1)`;
  });
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      items.forEach(item => {
        item.style.opacity = '1';
        item.style.transform = 'translate3d(0, 0, 0) scale(1)';
      });
      io.disconnect();
    }
  }, { threshold: 0.2 });
  io.observe(grid);
}
 
/* ════════════════════════════════════════════════════════════
   12. VISUAL POLISH & NAVIGATION
════════════════════════════════════════════════════════════ */
function initLineDraws() {
  document.querySelectorAll('.hr, .deco-line').forEach(line => {
    line.style.transformOrigin = 'left';
    line.style.transform = 'scaleX(0)';
    line.style.transition = 'transform 1.2s cubic-bezier(0.16,1,0.3,1)';
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { line.style.transform = 'scaleX(1)'; io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(line);
  });
}

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
 
function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', open);
  });
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => { menu.classList.remove('open'); toggle.classList.remove('active'); });
  });
}
 
function heroEntry() {
  const content = document.querySelector('.hero-content');
  if (!content) return;
  setTimeout(() => {
    content.classList.add('visible');
    setTimeout(() => content.classList.add('tilt-ready'), 1600);
  }, 200);
}
 
function initFooter() {
  const footer = document.querySelector('footer');
  if (!footer) return;
  footer.style.opacity = '0';
  footer.style.transform = 'translate3d(0, 12px, 0)';
  footer.style.transition = 'opacity .8s cubic-bezier(0.16,1,0.3,1), transform .8s cubic-bezier(0.16,1,0.3,1)';
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { footer.style.opacity = '1'; footer.style.transform = 'translate3d(0, 0, 0)'; io.disconnect(); }
  }, { threshold: 0.3 });
  io.observe(footer);
}
 
/* ════════════════════════════════════════════════════════════
   BOOTSTRAP
════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('particle-canvas');
  if (canvas) new ParticleField(canvas);
 
  new RevealOnScroll();
  new ProgressBar();
  new Navbar();
  new SplitText();
 
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
 
  new CursorSystem();
  initMagnetics();
  initHeroTilt();
  setTimeout(initCardSpotlight, 200);
 
  new CounterAnimation();
  initReelStagger();
  initSkillStagger();
  initCardsReveal();
 
  initLineDraws();
  initFooter();
 
  initNavLinks();
  initMobileMenu();
 
  if (!document.getElementById('preloader')) {
    heroEntry();
  }
});
