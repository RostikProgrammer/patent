/**
 * script.js — Presentation engine + charts + particles
 * Всі дані відповідають тексту реферату
 */
document.addEventListener('DOMContentLoaded', function () {

  /* ══════════════════════════════════════════
     PARTICLES — живий фон
  ══════════════════════════════════════════ */
  var canvas = document.getElementById('particles-canvas');
  var ctx = canvas.getContext('2d');
  var W, H, particles = [], isMobile;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    isMobile = W < 600;
  }
  window.addEventListener('resize', resize);
  resize();

  var COLORS = ['rgba(8,103,136,', 'rgba(0,176,232,', 'rgba(240,200,8,', 'rgba(221,28,26,'];
  var COUNT  = isMobile ? 30 : 60;

  function mkParticle() {
    var c = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      o: Math.random() * 0.4 + 0.05,
      color: c
    };
  }

  for (var i = 0; i < COUNT; i++) particles.push(mkParticle());

  /* Реагування на мишу */
  var mx = W / 2, my = H / 2;
  document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });

  function drawParticles() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      /* Слабке притягання до курсора */
      var dx = mx - p.x, dy = my - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        p.vx += dx * 0.00008;
        p.vy += dy * 0.00008;
      }
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.99; p.vy *= 0.99;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.o + ')';
      ctx.fill();
    }
    /* З'єднувальні лінії між близькими частинками */
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 80) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(0,176,232,' + (0.04 * (1 - d / 80)) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(drawParticles);
  }
  drawParticles();

  /* ══════════════════════════════════════════
     PRESENTATION ENGINE
  ══════════════════════════════════════════ */
  var slides     = document.querySelectorAll('.slide');
  var total      = slides.length;
  var current    = 0;
  var isAnimating = false;

  var scCurrent = document.getElementById('sc-current');
  var scTotal   = document.getElementById('sc-total');
  var pfill     = document.getElementById('progress-fill');
  var dotNav    = document.getElementById('dot-nav');
  var btnPrev   = document.getElementById('btn-prev');
  var btnNext   = document.getElementById('btn-next');
  var scrollHint = document.getElementById('scroll-hint');

  /* Лічильник */
  if (scTotal) scTotal.textContent = String(total).padStart(2, '0');

  /* Крапки навігації */
  slides.forEach(function (_, i) {
    var btn = document.createElement('button');
    btn.className = 'dot-btn';
    btn.setAttribute('aria-label', 'Слайд ' + (i + 1));
    btn.addEventListener('click', function () { goTo(i); });
    dotNav.appendChild(btn);
  });
  var dots = dotNav.querySelectorAll('.dot-btn');

  function updateUI() {
    if (scCurrent) scCurrent.textContent = String(current + 1).padStart(2, '0');
    if (pfill) pfill.style.width = ((current / (total - 1)) * 100) + '%';
    dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
    if (btnPrev) btnPrev.disabled = current === 0;
    if (btnNext) btnNext.disabled = current === total - 1;
    if (scrollHint) scrollHint.classList.toggle('hidden', current > 0);
  }

  function goTo(idx, dir) {
    if (idx === current || isAnimating || idx < 0 || idx >= total) return;
    isAnimating = true;
    var direction = (dir !== undefined) ? dir : (idx > current ? 'up' : 'down');
    var prev = current;
    current = idx;

    /* Зняти active зі старого */
    slides[prev].classList.remove('active');
    slides[prev].classList.add(direction === 'up' ? 'exit-up' : 'exit-down');

    /* Активувати новий */
    slides[current].classList.add('active');
    slides[current].classList.remove('exit-up', 'exit-down');

    /* Stagger-анімації всередині нового слайда */
    triggerStagger(slides[current]);

    /* Лічильник «8 принципів» на слайді 2 */
    if (current === 2) setTimeout(function () { countUp(document.getElementById('pw-num'), 8, 1000); }, 250);

    /* Діаграми на слайді 7 (index 7) */
    if (current === 7) {
      setTimeout(buildCharts, 300);
    }

    setTimeout(function () {
      slides[prev].classList.remove('exit-up', 'exit-down');
      isAnimating = false;
    }, 750);

    updateUI();
  }

  function triggerStagger(slide) {
    var els = slide.querySelectorAll('.anim-stagger');
    els.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(22px) scale(.95)';
    });
    els.forEach(function (el, i) {
      setTimeout(function () {
        el.style.transition = 'opacity .5s ease, transform .6s cubic-bezier(.2,.8,.25,1.18)';
        el.style.opacity = '1';
        el.style.transform = 'none';
      }, 70 + i * 55);
    });
  }

  /* Плавний підрахунок числа 0 → target */
  function countUp(el, target, dur) {
    if (!el) return;
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3); /* ease-out cubic */
      el.textContent = Math.round(e * target);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  function next() { goTo(current + 1, 'up'); }
  function prev() { goTo(current - 1, 'down'); }

  if (btnPrev) btnPrev.addEventListener('click', prev);
  if (btnNext) btnNext.addEventListener('click', next);

  /* Клавіатура */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
    if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    if (e.key === 'Home') goTo(0);
    if (e.key === 'End')  goTo(total - 1);
  });

  /* Колесо миші */
  var wheelLock = false;
  window.addEventListener('wheel', function (e) {
    if (wheelLock) return;
    if (Math.abs(e.deltaY) < 20) return;
    wheelLock = true;
    if (e.deltaY > 0) next(); else prev();
    setTimeout(function () { wheelLock = false; }, 900);
  }, { passive: true });

  /* Свайп */
  var touchStartY = 0;
  document.addEventListener('touchstart', function (e) { touchStartY = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    var dy = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 40) { if (dy > 0) next(); else prev(); }
  }, { passive: true });

  /* Ініціалізація першого слайда */
  slides[0].classList.add('active');
  triggerStagger(slides[0]);
  updateUI();

  /* ══════════════════════════════════════════
     CHARTS (слайд 7 — індекс 7)
     Дані: ст. 420 ЦК та спеціальні закони
  ══════════════════════════════════════════ */
  var chartsBuilt = false;

  /* DONUT — ст. 420 ЦК: об'єкти, згруповані у 4 категорії */
  var donutData = [
    { label: 'Авторське право і суміжні', count: 6, pct: 37, color: '#086788' },
    { label: 'Патентні права',           count: 3, pct: 19, color: '#00b0e8' },
    { label: 'Знаки та позначення',      count: 3, pct: 19, color: '#f0c808' },
    { label: 'Нетрадиційні та інші',     count: 4, pct: 25, color: '#dd1c1a' }
  ];

  /* DURATION — спеціальні закони України */
  var durData = [
    { label: 'Авторське право',  display: '70 р.',   val: 70, maxVal: 75, color: '#086788', ref: 'Закон № 2811-IX' },
    { label: 'Суміжні права',    display: '50 р.',   val: 50, maxVal: 75, color: '#00b0e8', ref: 'Закон № 2811-IX' },
    { label: 'Патент (винахід)', display: '20 р.',   val: 20, maxVal: 75, color: '#0a80a8', ref: 'Закон № 3687-XII' },
    { label: 'Торговельна марка', display: '10 р. ∞', val: 10, maxVal: 75, color: '#dd1c1a', ref: 'Закон № 3689-XII' },
    { label: 'Компонування ІМС', display: '10 р.',   val: 10, maxVal: 75, color: '#f0c808', ref: 'Закон № 621/97-ВР' },
    { label: 'Корисна модель',   display: '10 р.',   val: 10, maxVal: 75, color: '#086788', ref: 'Закон № 3687-XII' },
    { label: 'Промисловий зразок', display: '5 р. *', val: 5,  maxVal: 75, color: '#00b0e8', ref: 'Закон № 3688-XII' }
  ];

  function buildDonut() {
    var svg    = document.getElementById('donut-svg');
    var legend = document.getElementById('donut-legend');
    if (!svg || !legend || legend.children.length > 0) return;
    var ns = 'http://www.w3.org/2000/svg';
    var cx = 130, cy = 130, R = 95, r = 58;
    var total = donutData.reduce(function (s, d) { return s + d.count; }, 0);
    var angle = -Math.PI / 2;

    donutData.forEach(function (d, di) {
      var slice = (d.count / total) * 2 * Math.PI;
      var end = angle + slice, large = slice > Math.PI ? 1 : 0;
      var x1=cx+R*Math.cos(angle), y1=cy+R*Math.sin(angle);
      var x2=cx+R*Math.cos(end),   y2=cy+R*Math.sin(end);
      var x3=cx+r*Math.cos(end),   y3=cy+r*Math.sin(end);
      var x4=cx+r*Math.cos(angle), y4=cy+r*Math.sin(angle);

      var path = document.createElementNS(ns, 'path');
      path.setAttribute('d', 'M'+x1+' '+y1+' A'+R+' '+R+' 0 '+large+' 1 '+x2+' '+y2+' L'+x3+' '+y3+' A'+r+' '+r+' 0 '+large+' 0 '+x4+' '+y4+' Z');
      path.setAttribute('fill', d.color);
      path.style.transition = 'opacity .5s ease, transform .6s cubic-bezier(.2,.8,.25,1.15)';
      path.style.transformOrigin = cx + 'px ' + cy + 'px'; path.style.cursor = 'pointer';
      path.style.opacity = '0'; path.style.transform = 'scale(.35) rotate(-12deg)';
      path.addEventListener('mouseenter', function () { path.style.opacity = '1'; path.style.transform = 'scale(1.06)'; });
      path.addEventListener('mouseleave', function () { path.style.opacity = '0.9'; path.style.transform = ''; });
      svg.appendChild(path); angle = end;
      /* поступова поява секторів */
      (function (pp, idx) {
        setTimeout(function () { pp.style.opacity = '0.9'; pp.style.transform = ''; }, 180 + idx * 160);
      })(path, di);

      var item = document.createElement('div');
      item.className = 'dpl-item';
      item.innerHTML = '<span class="dpl-dot" style="background:'+d.color+'"></span>'
        + '<span>'+d.label+'</span>'
        + '<span class="dpl-pct">'+d.count+' ('+d.pct+'%)</span>';
      legend.appendChild(item);
    });

    var t = document.createElementNS(ns, 'text');
    t.setAttribute('x', cx); t.setAttribute('y', cy-4);
    t.setAttribute('text-anchor','middle'); t.setAttribute('fill','#00b0e8');
    t.setAttribute('font-size','34'); t.setAttribute('font-weight','700');
    t.setAttribute('font-family','Cormorant Garamond, serif');
    t.textContent = '0'; svg.appendChild(t);
    setTimeout(function () { countUp(t, total, 1100); }, 250);

    var s = document.createElementNS(ns, 'text');
    s.setAttribute('x', cx); s.setAttribute('y', cy+16);
    s.setAttribute('text-anchor','middle'); s.setAttribute('fill','#9fb6c4'); s.setAttribute('font-size','12');
    s.textContent = 'об’єктів'; svg.appendChild(s);
  }

  function buildDurBars() {
    var container = document.getElementById('dur-bars');
    if (!container || container.children.length > 0) return;

    durData.forEach(function (d, i) {
      var row = document.createElement('div'); row.className = 'db-row';
      var label = document.createElement('div'); label.className = 'db-label'; label.textContent = d.label;
      var track = document.createElement('div'); track.className = 'db-track';
      var fill  = document.createElement('div'); fill.className = 'db-fill'; fill.style.background = d.color;
      var ftxt  = document.createElement('span'); ftxt.className = 'db-fill-txt'; ftxt.textContent = d.display;
      fill.appendChild(ftxt); track.appendChild(fill);
      var years = document.createElement('div'); years.className = 'db-years'; years.textContent = d.display;
      row.appendChild(label); row.appendChild(track); row.appendChild(years);
      container.appendChild(row);

      var pct = Math.min((d.val / d.maxVal) * 100, 96);
      setTimeout(function () {
        fill.style.width = pct + '%';
      }, 200 + i * 100);
    });
  }

  function buildCharts() {
    if (chartsBuilt) return;
    chartsBuilt = true;
    buildDonut();
    buildDurBars();
  }

  /* Якщо стартуємо одразу на слайді 7 */
  if (current === 7) setTimeout(buildCharts, 300);

  /* ══════════════════════════════════════════
     МОБІЛЬНИЙ СКРОЛ (для малих екранів)
  ══════════════════════════════════════════ */
  if (window.innerWidth <= 600) {
    /* На мобільних — звичайний скрол, charts при появі */
    var chartSlide = document.querySelector('.slide-charts');
    if (chartSlide) {
      var chartObs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { buildCharts(); chartObs.disconnect(); }
      }, { threshold: 0.3 });
      chartObs.observe(chartSlide);
    }
  }

});
