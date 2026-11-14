/* TECH STACK POPUP */
(function () {
  'use strict';

  /* TechStacks Descriptions */
  var css = `
  .tech-icon-box .tech-tip{
    width:290px;
    max-width:calc(100vw - 24px);
    padding:.85rem 1rem 1rem;
    border-radius:14px;
    text-align:left;
    background:#0d0d11;
    border:1px solid rgba(255,255,255,.18);
    box-shadow:0 14px 34px -8px rgba(0,0,0,.9);
    pointer-events:none;
  }
  .tech-icon-box .tech-tip-head{
    display:flex;
    align-items:center;
    justify-content:flex-start;
    gap:.7rem;
  }
  .tech-icon-box .tech-tip-icon{
    width:32px;
    height:32px;
    border-radius:8px;
    border:1px solid rgba(255,255,255,.18) !important;
    background:#0a0b10 !important;
  }
  .tech-icon-box .tech-tip-icon img,
  .tech-icon-box .tech-tip-icon svg{width:20px;height:20px}
  .tech-icon-box .tech-tip-titles{
    flex:1;
    min-width:0;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:.6rem;
  }
  .tech-icon-box .tech-tip-name{
    font-family:var(--font-body);
    font-size:1rem;
    font-weight:700;
    color:#ffffff;
    white-space:nowrap;
  }
  .tech-icon-box .tech-tip-tag{
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
  .tech-icon-box .tech-tip-desc{
    display:block;
    margin-top:.65rem;
    font-family:var(--font-body);
    font-size:.85rem;
    font-weight:400;
    line-height:1.5;
    color:var(--muted);
    text-align:left;
  }

  /* open click */
  .tech-icon-box.tip-open{z-index:60}
  .tech-icon-box.tip-open .tech-tip{
    opacity:1;
    visibility:visible;
    transform:translateX(calc(-50% + var(--tip-shift, 0px))) translateY(0);
  }
  .tech-icon-box.tip-open > .fb-icon{border-color:rgba(255,255,255,.85)}
  .tech-icon-box.tip-flip.tip-open .tech-tip{
    transform:translateX(calc(-50% + var(--tip-shift, 0px))) translateY(0);
  }

  @media(max-width:960px){
    .tech-icon-box .tech-tip{width:min(280px, calc(100vw - 24px))}
  }
  `;
  var st = document.createElement('style');
  st.id = 'tech-popup-css';
  st.textContent = css;
  document.head.appendChild(st);

  /* Behavior */
  var boxes = Array.prototype.slice.call(document.querySelectorAll('.tech-icon-box'));
  if (!boxes.length) return;

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
  }

  function openTip(box) {
    if (openBox && openBox !== box) openBox.classList.remove('tip-open');
    openBox = box;
    place(box);
    box.classList.add('tip-open');
  }

  boxes.forEach(function (box) {
    box.setAttribute('tabindex', '0');
    box.setAttribute('role', 'button');

    var nameEl = box.querySelector('.tech-tip-name');
    if (nameEl) box.setAttribute('aria-label', nameEl.textContent.trim());

    /* Popup position */
    box.addEventListener('mouseenter', function () { place(box); });

    /* tech icons popup clickable (Desktop/Mobile) */
    box.addEventListener('click', function (e) {
      e.stopPropagation();
      if (openBox === box) closeTip();
      else openTip(box);
    });

    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (openBox === box) closeTip();
        else openTip(box);
      }
    });
  });

  /* click & Tap */
  document.addEventListener('click', function (e) {
    if (!openBox) return;
    if (e.target && e.target.closest && e.target.closest('.tech-icon-box')) return;
    closeTip();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeTip();
  });

  /* Resize & Rotate */
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    if (openBox) place(openBox);
  });
  window.addEventListener('orientationchange', function () {
    setTimeout(function () { if (openBox) place(openBox); }, 200);
  });
})();
