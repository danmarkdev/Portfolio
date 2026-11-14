/* TECH STACK POPUP */
(function () {
  'use strict';

  /* TechStacks Descriptions */
  var css = `
  /* Shared card look (desktop tooltip + mobile card) */
  .tp-body{
    background:#0d0d11;
    border:1px solid rgba(255,255,255,.18);
    border-radius:14px;
    padding:.9rem 1rem 1rem;
    text-align:left;
    box-shadow:0 14px 34px -8px rgba(0,0,0,.9);
  }
  .tp-body .tech-tip-head{
    display:flex;
    align-items:center;
    justify-content:flex-start;
    gap:.7rem;
  }
  .tp-body .tech-tip-icon{
    width:32px;
    height:32px;
    border-radius:8px;
    flex-shrink:0;
    border:1px solid rgba(255,255,255,.18) !important;
    background:#0a0b10 !important;
  }
  .tp-body .tech-tip-icon img,
  .tp-body .tech-tip-icon svg{width:20px;height:20px}
  .tp-body .tech-tip-titles{
    flex:1;
    min-width:0;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:.6rem;
  }
  .tp-body .tech-tip-name{
    font-family:var(--font-body);
    font-size:1rem;
    font-weight:700;
    color:#ffffff;
    white-space:nowrap;
  }
  .tp-body .tech-tip-tag{
    display:inline-block;
    flex-shrink:0;
    font-family:var(--font-body);
    font-size:.56rem;
    font-weight:700;
    letter-spacing:.06em;
    color:#ffffff;
    background:rgba(255,255,255,.08);
    border:1px solid rgba(255,255,255,.3);
    border-radius:100px;
    padding:.2rem .55rem;
    white-space:nowrap;
  }
  .tp-body .tech-tip-desc{
    display:block;
    margin-top:.65rem;
    font-family:var(--font-body);
    font-size:.85rem;
    font-weight:400;
    line-height:1.5;
    color:var(--muted);
    text-align:left;
  }

  /* Desktop tooltip (above the icon) */
  .tech-icon-box .tech-tip.tp-body{
    width:290px;
    max-width:calc(100vw - 24px);
    pointer-events:none;
  }

  /* open click */
  .tech-icon-box.tip-open{z-index:60}
  .tech-icon-box.tip-open > .fb-icon{border-color:rgba(255,255,255,.85)}
  .tech-icon-box.tip-open .tech-tip{
    opacity:1;
    visibility:visible;
    transform:translateX(calc(-50% + var(--tip-shift, 0px))) translateY(0);
  }
  .tech-icon-box.tip-flip.tip-open .tech-tip{
    transform:translateX(calc(-50% + var(--tip-shift, 0px))) translateY(0);
  }

  /* only one popup at a time (no 2nd popup from hovering another icon) */
  .tech-icon-grid.has-open .tech-icon-box:not(.tip-open) .tech-tip{
    opacity:0 !important;
    visibility:hidden !important;
  }

  /* Mobile / Touch: hide per-icon tooltips, use the single fixed card */
  @media (max-width:960px), (pointer:coarse){
    .tech-icon-box .tech-tip{display:none !important}
  }

  /* Mobile card (fixed under the navbar) */
  #techPopupCard{
    position:fixed;
    top:5.6rem;
    left:50%;
    width:calc(100vw - 32px);
    max-width:480px;
    z-index:999;
    opacity:0;
    visibility:hidden;
    pointer-events:none;
    transform:translateX(-50%) translateY(-8px);
    transition:opacity .2s ease, transform .2s ease, visibility .2s;
  }
  #techPopupCard.show{
    opacity:1;
    visibility:visible;
    pointer-events:auto;
    transform:translateX(-50%) translateY(0);
  }
  #techPopupCard .tech-tip-name{font-size:1.05rem}
  #techPopupCard .tech-tip-desc{font-size:.9rem}

  /* Orbit icons popup (hero) - same full card as the tech stacks */
  .orbit-tip.tp-body{
    display:block;
    width:290px;
    max-width:calc(100vw - 24px);
    padding:.9rem 1rem 1rem;
    border-radius:14px;
    text-align:left;
  }
  .orbit-tip.tp-body .tech-tip-icon{
    width:32px;
    height:32px;
    border-radius:8px;
    border:1px solid rgba(255,255,255,.18) !important;
    background:#0a0b10 !important;
    box-shadow:none !important;
  }
  .orbit-tip.tp-body .tech-tip-icon img,
  .orbit-tip.tp-body .tech-tip-icon svg{width:20px;height:20px}

  /* Mobile / Touch: orbit icons use the single fixed card too */
  @media (max-width:960px), (pointer:coarse){
    .orbit-item .orbit-tip{display:none !important}
  }
  `;
  var st = document.createElement('style');
  st.id = 'tech-popup-css';
  st.textContent = css;
  document.head.appendChild(st);

  /* Behavior */
  var grid = document.querySelector('.tech-icon-grid');
  var boxes = Array.prototype.slice.call(document.querySelectorAll('.tech-icon-box'));
  if (!boxes.length) return;

  /* Mobile / Touch check */
  var mq = window.matchMedia('(max-width:960px), (pointer:coarse)');
  function isMobile() { return mq.matches; }

  /* Style every per-icon tooltip like the card */
  boxes.forEach(function (box) {
    var tip = box.querySelector('.tech-tip');
    if (tip) tip.classList.add('tp-body');
  });

  /* Single mobile card */
  var card = document.createElement('div');
  card.id = 'techPopupCard';
  card.className = 'tp-body';
  card.setAttribute('role', 'dialog');
  document.body.appendChild(card);

  var openBox = null;

  /* Popup Screen Inside */
  function place(box) {
    var tip = box.querySelector('.tech-tip');
    if (!tip) return;

    box.classList.remove('tip-flip');
    box.style.setProperty('--tip-shift', '0px');

    var r = box.getBoundingClientRect();
    var tipH = tip.offsetHeight;
    var tipW = tip.offsetWidth;
    var vw = document.documentElement.clientWidth;
    var margin = 12;

    /* navigation bar space */
    if (r.top < tipH + 16 + 90) box.classList.add('tip-flip');

    var cx = r.left + r.width / 2;
    var left = cx - tipW / 2;
    var right = cx + tipW / 2;
    var shift = 0;
    if (left < margin) shift = margin - left;
    else if (right > vw - margin) shift = (vw - margin) - right;
    box.style.setProperty('--tip-shift', shift + 'px');
  }

  function closeTip() {
    if (openBox) openBox.classList.remove('tip-open');
    openBox = null;
    card.classList.remove('show');
    if (grid) grid.classList.remove('has-open');
  }

  function openTip(box) {
    if (openBox && openBox !== box) openBox.classList.remove('tip-open');
    openBox = box;
    orbitCard = false;
    box.classList.add('tip-open');
    if (grid) grid.classList.add('has-open');

    if (isMobile()) {
      /* Mobile: show the single card at the top */
      var tip = box.querySelector('.tech-tip');
      if (tip) card.innerHTML = tip.innerHTML;
      card.classList.add('show');
    } else {
      /* Desktop: popup above the icon */
      card.classList.remove('show');
      place(box);
    }
  }

  function toggle(box) {
    if (openBox === box) closeTip();
    else openTip(box);
  }

  boxes.forEach(function (box) {
    box.setAttribute('tabindex', '0');
    box.setAttribute('role', 'button');

    var nameEl = box.querySelector('.tech-tip-name');
    if (nameEl) box.setAttribute('aria-label', nameEl.textContent.trim());

    /* Popup position */
    box.addEventListener('mouseenter', function () {
      if (!isMobile()) place(box);
    });

    /* tech icons popup clickable (Desktop/Mobile) */
    box.addEventListener('click', function (e) {
      e.stopPropagation();
      toggle(box);
    });

    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(box);
      }
    });
  });

  /* click & Tap */
  document.addEventListener('click', function (e) {
    if (!openBox) return;
    if (e.target && e.target.closest && e.target.closest('.tech-icon-box, .orbit-item')) return;
    closeTip();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeTip();
  });

  /* Close when the tapped icon scrolls out of view */
  window.addEventListener('scroll', function () {
    if (!openBox) return;
    var r = openBox.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) closeTip();
  }, { passive: true });

  /* Switching between Mobile / Desktop layout */
  function onModeChange() { closeTip(); }
  if (mq.addEventListener) mq.addEventListener('change', onModeChange);
  else if (mq.addListener) mq.addListener(onModeChange);

  /* Resize & Rotate */
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    if (openBox && !isMobile()) place(openBox);
  });
  window.addEventListener('orientationchange', function () {
    setTimeout(function () { if (openBox && !isMobile()) place(openBox); }, 200);
  });

  /* ORBIT ICONS POPUP (hero) */
  var techTips = {};
  boxes.forEach(function (box) {
    var n = box.querySelector('.tech-tip-name');
    var t = box.querySelector('.tech-tip');
    if (n && t) techTips[n.textContent.trim()] = t.innerHTML;
  });

  var orbitItems = Array.prototype.slice.call(document.querySelectorAll('#photoOrbit .orbit-item'));
  var orbitCard = false;

  /* Use the same icon + name + tag + description as the Technical Stacks */
  orbitItems.forEach(function (it) {
    var html = techTips[it.getAttribute('data-name')];
    it.__tpHtml = html || '';
    var tip = it.querySelector('.orbit-tip');
    if (tip && html) {
      tip.innerHTML = html;
      tip.classList.add('tp-body');
    }
  });

  /* Orbit icon clicked / tapped (is-active is handled by script.js) */
  function syncOrbitCard() {
    var act = document.querySelector('#photoOrbit .orbit-item.is-active');
    if (act) {
      closeTip(); /* close any open tech stack popup */
      if (isMobile() && act.__tpHtml) {
        /* Mobile: show the single card at the top */
        card.innerHTML = act.__tpHtml;
        card.classList.add('show');
        orbitCard = true;
      }
    } else if (orbitCard) {
      card.classList.remove('show');
      orbitCard = false;
    }
  }
  if ('MutationObserver' in window) {
    var mo = new MutationObserver(syncOrbitCard);
    orbitItems.forEach(function (it) {
      mo.observe(it, { attributes: true, attributeFilter: ['class'] });
    });
  }

  /* Close the orbit card when the icon scrolls out of view */
  window.addEventListener('scroll', function () {
    if (!orbitCard) return;
    var act = document.querySelector('#photoOrbit .orbit-item.is-active');
    if (!act) return;
    var r = act.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) {
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    }
  }, { passive: true });
})();
