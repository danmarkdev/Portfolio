/* ICON FALLBACK — if a brand logo fails to load (dead link, renamed
   slug, hotlink block, temporary CDN hiccup), swap it for a clean
   text badge (the tool's initials) instead of leaving a broken-image
   icon visible. Runs immediately since this script sits at the end
   of <body>, after every icon element already exists in the DOM. */
document.querySelectorAll('.fb-icon img').forEach(function (img) {
  img.addEventListener('error', function () {
    var wrap = img.closest('.fb-icon');
    var alt = img.getAttribute('alt') || '?';
    var initials = (alt.replace(/[^A-Za-z0-9]/g, '').slice(0, 2) || '?').toUpperCase();

    // pick readable text color based on the chip's own background
    var dark = true;
    if (wrap) {
      var bg = getComputedStyle(wrap).backgroundColor;
      var rgb = bg && bg.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        var lum = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
        dark = lum > 150; // light background -> use dark text
      }
    }

    var span = document.createElement('span');
    span.textContent = initials;
    span.style.cssText =
      'font-family:var(--font-heading, sans-serif);font-weight:700;' +
      'font-size:.55em;line-height:1;color:' + (dark ? '#12162b' : '#ffffff') + ';';
    img.replaceWith(span);
  }, { once: true });
});

/* HEADER SCROLL */
window.addEventListener('scroll',function(){
  var h=document.getElementById('header');
  if(h) h.classList.toggle('scrolled',window.scrollY>30);
});

/* HAMBURGER */
var hbg=document.getElementById('hbg');
var mnav=document.getElementById('mnav');
if(hbg&&mnav){
  hbg.addEventListener('click',function(){
    var isOpen=mnav.classList.toggle('open');
    hbg.classList.toggle('open',isOpen);
    document.body.classList.toggle('menu-open',isOpen);
    hbg.setAttribute('aria-expanded',isOpen?'true':'false');
  });
}
function closeMenu(){
  if(hbg) hbg.classList.remove('open');
  if(mnav) mnav.classList.remove('open');
  document.body.classList.remove('menu-open');
  if(hbg) hbg.setAttribute('aria-expanded','false');
}

/* KEEP THE MOBILE MENU IN SYNC WITH VIEWPORT WIDTH
   The mobile nav overlay is only ever opened/closed by JS (the
   ".open" class) — it has no CSS media query of its own that hides it
   above the mobile breakpoint. So if it's left open and the window
   crosses back above 960px (closing DevTools' device toolbar,
   rotating a tablet, resizing the browser, etc.) it stayed stuck open,
   full-screen, on top of the desktop layout. This listener closes it
   automatically the moment the viewport is no longer "mobile" width,
   matching the same 960px breakpoint used in style.css. */
var MOBILE_BREAKPOINT = window.matchMedia('(max-width: 960px)');
function handleBreakpointChange(e){
  if(!e.matches) closeMenu();
}
if (MOBILE_BREAKPOINT.addEventListener) {
  MOBILE_BREAKPOINT.addEventListener('change', handleBreakpointChange);
} else if (MOBILE_BREAKPOINT.addListener) {
  MOBILE_BREAKPOINT.addListener(handleBreakpointChange); // older Safari fallback
}

/* ACTIVE NAV */
var sections=document.querySelectorAll('section[id]');
var navLinks=document.querySelectorAll('#nav a:not(.nav-cta)');
var mobileNavLinks=document.querySelectorAll('#mnav a');
if(sections.length){
  window.addEventListener('scroll',function(){
    var cur='';
    sections.forEach(function(s){ if(window.scrollY>=s.offsetTop-120) cur=s.id; });
    navLinks.forEach(function(a){ a.classList.toggle('active',a.getAttribute('href')==='#'+cur); });
    mobileNavLinks.forEach(function(a){ a.classList.toggle('active',a.getAttribute('href')==='#'+cur); });
  });
}
/* set active state instantly on click, so the nav pill turns black right away
   instead of waiting for the scroll listener to catch up with smooth-scroll */
[navLinks, mobileNavLinks].forEach(function(list){
  list.forEach(function(a){
    a.addEventListener('click',function(){
      list.forEach(function(b){ b.classList.remove('active'); });
      a.classList.add('active');
    });
  });
});

/* TECHNICAL STACK TABS (mobile: switch panel. desktop: tabs are hidden via CSS
   and all panels show at once in a grid, so this click handler simply has no
   visible effect on desktop — which is exactly what we want) */
var stackTabs = document.getElementById('stackTabs');
if(stackTabs){
  var tabBtns = stackTabs.querySelectorAll('.stack-tab-btn');
  var panels = document.querySelectorAll('.stack-panel');
  stackTabs.addEventListener('click', function(e){
    var btn = e.target.closest('.stack-tab-btn');
    if(!btn) return;
    var target = btn.getAttribute('data-tab');
    tabBtns.forEach(function(b){ b.classList.toggle('active', b===btn); });
    panels.forEach(function(p){ p.classList.toggle('active', p.getAttribute('data-panel')===target); });
  });
}

/* SCROLL REVEAL */
var obs=new IntersectionObserver(function(entries){
  entries.forEach(function(e,i){
    if(e.isIntersecting){
      setTimeout(function(){ e.target.classList.add('visible'); },i*60);
      obs.unobserve(e.target);
    }
  });
},{threshold:.1});
document.querySelectorAll('.reveal').forEach(function(el){ obs.observe(el); });

/* DRAGGABLE / SWIPEABLE MARQUEE — used by the Projects and Certificates
   tracks. Works with mouse drag on desktop and touch swipe on mobile
   (Pointer Events cover both), and keeps auto-scrolling on its own
   whenever the person isn't actively dragging it. loopSeconds controls
   how long one full auto-scroll loop takes, same as the old CSS
   animation did. direction controls which way the row drifts on its
   own (1 = normal, -1 = reversed) — used so the two Certificates rows
   scroll opposite ways instead of both sliding the same direction. */
function initSwipeMarquee(trackId, loopSeconds, direction){
  direction = direction || 1;
  var track = document.getElementById(trackId);
  var wrap = track ? track.closest('.projects-marquee, .cert-marquee-row') : null;
  if(!track || !wrap) return;

  var half = 0;          // width of one full (non-duplicated) set of cards
  var pos = 0;            // current scroll offset in px
  var dragging = false;
  var moved = false;      // did the pointer travel far enough to count as a drag (vs a tap)
  var startX = 0;
  var startPos = 0;
  var speed = 0;          // px per second, auto-scroll rate
  var activePointerId = null;

  /* momentum tracking — lets a released swipe glide and decelerate on its
     own, the same "flick" feel as native touch scrolling (like the
     Technical Stack cards), instead of stopping dead the instant the
     finger lifts. */
  var momentumVelocity = 0;  // px/sec, active right after release
  var momentumActive = false;
  var lastMoveTime = 0;
  var lastMovePos = 0;
  var MAX_VELOCITY = 4200;   // px/sec cap so a hard flick doesn't fling too far
  var FRICTION = 3.2;        // higher = stops sooner

  function measure(){
    half = track.scrollWidth / 2;
    speed = (half / loopSeconds) * direction;
  }

  function wrap360(p){
    if(half<=0) return 0;
    p = p % half;
    if(p<0) p += half;
    return p;
  }

  function render(){
    track.style.transform = 'translateX(' + (-pos) + 'px)';
  }

  var lastTime = null;
  function tick(t){
    if(lastTime===null) lastTime = t;
    var dt = (t - lastTime) / 1000;
    lastTime = t;
    if(!dragging){
      if(momentumActive){
        pos = wrap360(pos + momentumVelocity*dt);
        /* exponential decay, frame-rate independent */
        momentumVelocity *= Math.pow(1/(1+FRICTION), dt);
        if(Math.abs(momentumVelocity) < 40){
          momentumActive = false;
        }
      } else {
        pos = wrap360(pos + speed*dt);
      }
      render();
    }
    requestAnimationFrame(tick);
  }

  function pointerDown(e){
    dragging = true;
    moved = false;
    momentumActive = false;
    momentumVelocity = 0;
    startX = e.clientX;
    startPos = pos;
    lastMoveTime = performance.now();
    lastMovePos = pos;
    activePointerId = e.pointerId;
    /* NOTE: we deliberately do NOT call setPointerCapture here. Capturing on
       every pointerdown — even a plain click on a link — makes the browser
       redirect the resulting mouseup/click to this track element instead of
       the link that was actually pressed, so the click silently never fires
       on the <a> tag. We only capture once we've confirmed a real drag
       (see pointerMove below), so ordinary clicks pass straight through. */
  }

  function pointerMove(e){
    if(!dragging) return;
    var dx = e.clientX - startX;
    if(!moved && Math.abs(dx) > 15){
      moved = true;
      track.classList.add('dragging');
      if(track.setPointerCapture){
        try{ track.setPointerCapture(activePointerId); }catch(err){}
      }
    }
    if(moved){
      pos = wrap360(startPos - dx);
      render();

      /* sample velocity from the last little stretch of movement so
         release can carry that speed into the momentum glide */
      var now = performance.now();
      var dt = now - lastMoveTime;
      if(dt > 0){
        var rawVelocity = (pos - lastMovePos) / dt * 1000; // px/sec
        momentumVelocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, rawVelocity));
        lastMoveTime = now;
        lastMovePos = pos;
      }
    }
  }

  function pointerUp(){
    if(!dragging) return;
    dragging = false;
    track.classList.remove('dragging');
    if(moved && track.releasePointerCapture){
      try{ track.releasePointerCapture(activePointerId); }catch(err){}
    }
    /* hand off to momentum glide if the release was a real flick */
    if(moved && Math.abs(momentumVelocity) > 40){
      momentumActive = true;
    }
  }

  track.style.animation = 'none';
  track.addEventListener('pointerdown', pointerDown);
  track.addEventListener('pointermove', pointerMove);
  track.addEventListener('pointerup', pointerUp);
  track.addEventListener('pointercancel', pointerUp);
  track.addEventListener('pointerleave', function(){ if(dragging) pointerUp(); });

  /* prevent a dragged swipe from also firing a link/card click underneath it */
  track.addEventListener('click', function(e){
    if(moved){ e.preventDefault(); e.stopPropagation(); }
  }, true);

  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  measure();
  requestAnimationFrame(tick);
}

initSwipeMarquee('projectTrack', 90, 1);  // slow, gentle auto-scroll for Projects
initSwipeMarquee('certTrack', 75, 1);     // ~75s per loop, same pace as before
initSwipeMarquee('certTrack2', 75, -1);   // second row, scrolls the opposite way

/* CONTACT FORM — now using Google Apps Script (free, no submission limits) */
function sendMsg(){
  var name=document.getElementById('cf-name')?document.getElementById('cf-name').value.trim():'';
  var email=document.getElementById('cf-email')?document.getElementById('cf-email').value.trim():'';
  var subject=document.getElementById('cf-subject')?document.getElementById('cf-subject').value.trim():'';
  var msg=document.getElementById('cf-msg')?document.getElementById('cf-msg').value.trim():'';
  var status=document.getElementById('cf-status');
  var btn=document.getElementById('cf-btn');
  if(!status||!btn) return;
  if(!name||!email||!msg){ status.style.color='#ff6b6b'; status.textContent='Please fill in all required fields.'; return; }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ status.style.color='#ff6b6b'; status.textContent='Please enter a valid email address.'; return; }
  btn.disabled=true; btn.textContent='Sending...';
  status.style.color='#666'; status.textContent='Sending your message\u2026';

  var formData = new URLSearchParams();
  formData.append('name', name);
  formData.append('email', email);
  formData.append('subject', subject || 'New message from Portfolio');
  formData.append('message', msg);

  fetch('https://script.google.com/macros/s/AKfycbx9vIB7FvB0Inv97LWBio3U4_XNGmVLPlAvZxJ7cBNQN2xtIIwkqEW9GzRj9yIxYCd7/exec',{
    method:'POST',
    body: formData
  }).then(function(res){ return res.json(); }).then(function(data){
    if(data.ok){
      status.style.color='#22c55e'; status.textContent='Message Sent!';
      document.getElementById('cf-name').value='';
      document.getElementById('cf-email').value='';
      if(document.getElementById('cf-subject')) document.getElementById('cf-subject').value='';
      document.getElementById('cf-msg').value='';
    } else { status.style.color='#ff6b6b'; status.textContent='Failed to send. Please try again.'; }
    btn.textContent='SEND MESSAGE'; btn.disabled=false;
  }).catch(function(){
    status.style.color='#ff6b6b'; status.textContent='Failed to send. Please try again.';
    btn.textContent='SEND MESSAGE'; btn.disabled=false;
  });
}

/* COPY PROTECTION */
document.addEventListener('copy',function(e){ e.preventDefault(); });
document.addEventListener('cut',function(e){ e.preventDefault(); });
document.addEventListener('contextmenu',function(e){ e.preventDefault(); });
document.addEventListener('keydown',function(e){
  if((e.ctrlKey||e.metaKey)&&['c','x','u','s','a'].includes(e.key.toLowerCase())) e.preventDefault();
  if(e.key==='F12'||(e.ctrlKey&&e.shiftKey&&['i','j'].includes(e.key.toLowerCase()))) e.preventDefault();
});

/* ---------- EDUCATION & MILESTONES: interactive timeline ---------- */
(function () {
  var academicData = [
    {
      year: '2026',
      label: 'TUP',
      range: '2026 - Present',
      current: true,
      title: 'Technological University of the Philippines Manila',
      org: '',
      desc: 'Bachelor of Technical-Vocational Teacher Education, Major in Computer Programming.',
      icon: 'cap'
    },
    {
      year: '2024',
      label: 'STI',
      range: '2024 - 2026',
      current: false,
      title: 'STI College Bacoor',
      org: 'TVL Track - ICT Major in Mobile Application & Web Development',
      icon: 'monitor'
    },
    {
      year: '2021',
      label: 'BNHS',
      range: '2021 - 2024',
      current: false,
      title: 'Bacoor National High School Molino Main',
      org: 'Technical Drafting, 2D/3D modeling, and digital blueprinting using AutoCAD.',
      icon: 'chip'
    }
  ];

  /* NOTE: the AI Store Visualizer is an idea/concept only — it has not
     been built. The copy below is written to make that clear rather
     than implying a finished, working tool. */
  var recognitionData = [
    {
      year: 'Sept 2026',
      label: 'Ideathon',
      range: 'Sept 26, 2026',
      current: true,
      title: 'AI Visualizer - 7th Place',
      org: 'AWS Student Builder Group - TUP Manila',
      desc: 'An AI concept idea that would generate storefront visuals from text descriptions, using AWS Step Functions.',
      icon: 'trophy'
    },
    {
      year: 'Sept 2026',
      label: 'UI/UX Role',
      range: 'Sept 26, 2026',
      current: false,
      title: 'UI/UX & Web Development Associate',
      org: 'AWS Student Builder Group - TUP Manila',
      desc: 'Officially appointed to the role responsible for UI/UX design and web development in the student builder community.',
      icon: 'badge'
    }
  ];

  /* Solid/filled icons (fill="currentColor", no stroke-only outlines) so
     every shape renders as a clean closed silhouette with no hollow gaps. */
  var ICONS = {
    cap: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3Zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9ZM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72Z"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="13" rx="3"/><rect x="10.5" y="17" width="3" height="2"/><rect x="7.5" y="19.3" width="9" height="1.7" rx="0.85"/><path d="M10.6 8.2 8 10.6l2.6 2.6" fill="none" stroke="#e4e9f5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.4 8.2 16 10.6l-2.6 2.6" fill="none" stroke="#e4e9f5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chip: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="10" y="1" width="2" height="4"/><rect x="14" y="1" width="2" height="4"/><rect x="10" y="19" width="2" height="4"/><rect x="14" y="19" width="2" height="4"/><rect x="1" y="10" width="4" height="2"/><rect x="1" y="14" width="4" height="2"/><rect x="19" y="10" width="4" height="2"/><rect x="19" y="14" width="4" height="2"/></svg>',
    trophy: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M184 96a56 56 0 11-56-56 56 56 0 0156 56Zm32 0a87.8 87.8 0 01-32 67.8V240a8 8 0 01-8 8 9.4 9.4 0 01-3.6-.8L128 224.9l-44.4 22.3a8 8 0 01-7.8-.4A7.9 7.9 0 0172 240v-76.2A88 88 0 11216 96Zm-16 0a72 72 0 10-72 72 72.1 72.1 0 0072-72Z"/></svg>',
    badge: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15 8.5 22 9.3 17 14.1 18.2 21 12 17.6 5.8 21 7 14.1 2 9.3 9 8.5 12 2"/></svg>'
  };

  function buildTimeline(mountId, data) {
    var mount = document.getElementById(mountId);
    if (!mount) return null;
    mount.innerHTML = '';

    /* The connecting line is now drawn in CSS by each node (.edu-node::before),
       so no separate line element is needed here. */
    var nodes = data.map(function (item, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'edu-node' + (i === 0 ? ' active' : '');
      btn.setAttribute('data-index', i);
      btn.innerHTML =
        '<span class="edu-node-label">' + item.label + '</span>' +
        '<span class="edu-node-circle">' + ICONS[item.icon] + '</span>' +
        '<span class="edu-node-year">' + item.year + '</span>';
      mount.appendChild(btn);
      return btn;
    });

    return nodes;
  }

  function renderDetail(detailId, item) {
    var detail = document.getElementById(detailId);
    if (!detail) return;
    detail.innerHTML =
      '<div class="edu-detail-date' + (item.current ? ' edu-detail-current' : '') + '">' +
        '<span class="edu-detail-dot"></span>' + item.range +
      '</div>' +
      '<h3 class="edu-detail-title">' + item.title + '</h3>' +
      (item.org ? '<p class="edu-detail-org">' + item.org + '</p>' : '') +
      (item.desc ? '<p class="edu-detail-desc">' + item.desc + '</p>' : '');
  }

  function initTimeline(mountId, detailId, data) {
    var nodes = buildTimeline(mountId, data);
    if (!nodes || !nodes.length) return;
    renderDetail(detailId, data[0]);
    nodes.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        nodes.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderDetail(detailId, data[i]);
      });
    });
  }

  initTimeline('academicTimeline', 'academicDetail', academicData);
  initTimeline('recognitionTimeline', 'recognitionDetail', recognitionData);

  /* toggle between Academic Path / Recognition Log */
  var eduToggle = document.getElementById('eduToggle');
  var eduViews = document.querySelectorAll('.edu-timeline-view');
  if (eduToggle) {
    eduToggle.addEventListener('click', function (e) {
      var btn = e.target.closest('.edu-toggle-btn');
      if (!btn) return;
      var target = btn.getAttribute('data-view');
      eduToggle.querySelectorAll('.edu-toggle-btn').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      eduViews.forEach(function (v) {
        v.classList.toggle('active', v.getAttribute('data-panel') === target);
      });
    });
  }
})();

/* ---------- TESTIMONIALS: fanned deck cycler ---------- */
(function () {
  var deck = document.getElementById('testiDeck');
  var dotsWrap = document.getElementById('testiDots');
  if (!deck || !dotsWrap) return;

  var cards = Array.prototype.slice.call(deck.querySelectorAll('.testi-card'));
  if (!cards.length) return;

  var active = 0;
  var AUTOPLAY_MS = 6000;
  var timer = null;

  /* Cards are stacked with position:absolute so the deck wrapper doesn't
     naturally grow to fit them. Measure the tallest card's real content
     height (scrollHeight still reports full content even when a card's
     own box is being stretched to inset:0) and size the deck to match,
     so a longer quote never pushes the avatar/name below the card. */
  function sizeDeck() {
    var maxH = 0;
    cards.forEach(function (c) {
      maxH = Math.max(maxH, c.scrollHeight);
    });
    if (maxH > 0) deck.style.height = maxH + 'px';
  }
  sizeDeck();
  window.addEventListener('resize', sizeDeck);
  window.addEventListener('load', sizeDeck);

  cards.forEach(function (_, i) {
    var dot = document.createElement('button');
    dot.className = 'testi-dot';
    dot.setAttribute('aria-label', 'Show testimonial ' + (i + 1));
    dot.addEventListener('click', function () { goTo(i); });
    dotsWrap.appendChild(dot);
  });
  var dots = Array.prototype.slice.call(dotsWrap.querySelectorAll('.testi-dot'));

  function render() {
    cards.forEach(function (card, i) {
      card.classList.remove('testi-active', 'testi-behind-1', 'testi-behind-2', 'testi-hidden');
      var offset = (i - active + cards.length) % cards.length;
      if (offset === 0) card.classList.add('testi-active');
      else if (offset === 1) card.classList.add('testi-behind-1');
      else if (offset === 2) card.classList.add('testi-behind-2');
      else card.classList.add('testi-hidden');
    });
    dots.forEach(function (d, i) { d.classList.toggle('testi-dot-active', i === active); });
  }

  function goTo(i) {
    active = i % cards.length;
    render();
    restartAutoplay();
  }

  function next() { goTo((active + 1) % cards.length); }

  function restartAutoplay() {
    if (timer) clearInterval(timer);
    if (cards.length > 1) timer = setInterval(next, AUTOPLAY_MS);
  }

  cards.forEach(function (card, i) {
    card.addEventListener('click', function () {
      if (i !== active) goTo(i);
    });
  });

  render();
  restartAutoplay();
})();

/* TECH TIP EDGE GUARD — keeps the Technical Stack description card from
   spilling off the left/right edge of the screen on mobile. The card is
   centered on its icon by default; this measures how far it would
   overflow the viewport and pushes it back in by setting --tip-shift,
   which .tech-tip (and its pointer arrow) already read from the CSS.
   Recalculated right as each tooltip is about to show (hover/touch/focus)
   rather than only once at page load, so it can never go stale if the
   layout shifts after load (font reflow, scroll, browser UI collapsing). */
function computeTipShift(box){
  var tip = box.querySelector('.tech-tip');
  if(!tip) return;
  var margin = 12;

  box.classList.remove('tip-flip');
  box.style.setProperty('--tip-shift','0px'); // reset before measuring

  var boxRect = box.getBoundingClientRect();

  // vertical flip: not enough room above -> show tooltip below instead
  var tipHeight = tip.offsetHeight;
  var spaceAbove = boxRect.top;
  if (spaceAbove < tipHeight + 14 + 20) {
    box.classList.add('tip-flip');
  }

  var tipWidth = tip.offsetWidth;
  var vw = (window.visualViewport && window.visualViewport.width) || window.innerWidth;
  var centerX = boxRect.left + boxRect.width / 2;
  var tipLeft = centerX - tipWidth / 2;
  var tipRight = centerX + tipWidth / 2;

  var shift = 0;
  if (tipLeft < margin) {
    shift = margin - tipLeft;
  } else if (tipRight > vw - margin) {
    shift = (vw - margin) - tipRight;
  }
  box.style.setProperty('--tip-shift', shift + 'px');
}

document.querySelectorAll('.tech-icon-box').forEach(function(box){
  box.addEventListener('mouseenter', function(){ computeTipShift(box); });
  box.addEventListener('touchstart', function(){ computeTipShift(box); }, { passive:true });
  box.addEventListener('focus', function(){ computeTipShift(box); }, true);
});

function adjustAllTechTips(){
  document.querySelectorAll('.tech-icon-box').forEach(computeTipShift);
}
window.addEventListener('load', adjustAllTechTips);
window.addEventListener('resize', adjustAllTechTips);
window.addEventListener('orientationchange', adjustAllTechTips);
