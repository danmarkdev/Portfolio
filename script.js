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
      desc: 'An AI system concept for generating storefront visuals from text descriptions using AWS Step Functions.',
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
    cap: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3z"/><path d="M5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.8-7-3.8z"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="13" rx="3"/><rect x="10.5" y="17" width="3" height="2"/><rect x="7.5" y="19.3" width="9" height="1.7" rx="0.85"/><path d="M10.6 8.2 8 10.6l2.6 2.6" fill="none" stroke="#e4e9f5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.4 8.2 16 10.6l-2.6 2.6" fill="none" stroke="#e4e9f5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chip: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="10" y="1" width="2" height="4"/><rect x="14" y="1" width="2" height="4"/><rect x="10" y="19" width="2" height="4"/><rect x="14" y="19" width="2" height="4"/><rect x="1" y="10" width="4" height="2"/><rect x="1" y="14" width="4" height="2"/><rect x="19" y="10" width="4" height="2"/><rect x="19" y="14" width="4" height="2"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12v6a6 6 0 0 1-12 0V3z"/><path d="M6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="11" y="14" width="2" height="4"/><rect x="7" y="18" width="10" height="3" rx="1"/></svg>',
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

/* ---------- TESTIMONIALS: 3D fan (desktop) / stacked deck (mobile) ----------
   Works with the ORIGINAL testimonial HTML — no HTML edits needed.
   - Rearranges each card: [avatar name rating] / quote icon / text
   - Repeats the cards up to 8 slots so the fan looks full on desktop
   - No dots, no autoplay: click a card (or swipe) to bring it to the front
   Per card it sets --o (signed offset), --a (|offset|), --r (rank). */
(function () {
  var deck = document.getElementById('testiDeck');
  if (!deck) return;

  var cards = Array.prototype.slice.call(deck.querySelectorAll('.testi-card'));
  if (!cards.length) return;

  var dotsWrap = document.getElementById('testiDots');
  if (dotsWrap) dotsWrap.style.display = 'none';

  /* 1) restructure each card */
  cards.forEach(function (c) {
    if (c.querySelector('.testi-head')) return;
    var top = c.querySelector('.testi-card-top');
    var footer = c.querySelector('.testi-footer');
    var text = c.querySelector('.testi-text');
    var quote = top && top.querySelector('.testi-quote-icon');
    var rating = top && top.querySelector('.testi-rating');
    var avatar = footer && footer.querySelector('.testi-avatar');
    var name = footer && footer.querySelector('.testi-name');

    var head = document.createElement('div');
    head.className = 'testi-head';
    if (avatar) head.appendChild(avatar);
    if (name) head.appendChild(name);
    if (rating) head.appendChild(rating);

    c.innerHTML = '';
    c.appendChild(head);
    if (quote) c.appendChild(quote);
    if (text) c.appendChild(text);
  });

  /* 2) fill the fan: repeat the real testimonials until there are at least 8
     slots. The total is always a multiple of the real count, so the cards
     next to the center are always DIFFERENT testimonials
     (3 real -> 9 slots, 4 real -> 8 slots, 5 real -> 10 slots). */
  /* NO duplicates: only the real testimonials are shown
     (5 testimonials = 5 cards in the fan). */
  var n = cards.length;
  var active = 0;

  function isMobile() {
    return window.matchMedia('(max-width:700px)').matches;
  }

  /* 3) cards are position:absolute: make them equal height, size the deck */
  function sizeDeck() {
    var max = 0;
    cards.forEach(function (c) { c.style.height = 'auto'; });
    cards.forEach(function (c) { max = Math.max(max, c.offsetHeight); });
    cards.forEach(function (c) { c.style.height = max + 'px'; });
    /* mobile: room for the two peeking cards (34px each) + shadow;
       desktop: room for the dropped side cards */
    var extra = isMobile() ? 2 * 46 + 24 : 3 * 26 + 30;
    deck.style.height = (max + extra) + 'px';
  }

  function render() {
    var half = Math.floor(n / 2);
    cards.forEach(function (c, i) {
      var o = ((i - active + n + half) % n) - half;
      var r = (i - active + n) % n;
      c.style.setProperty('--o', o);
      c.style.setProperty('--a', Math.abs(o));
      c.style.setProperty('--r', r);
      c.classList.toggle('testi-active', i === active);
      c.classList.toggle('testi-far', r > 2);          // mobile: only 3 cards in the stack
      c.classList.toggle('testi-out', Math.abs(o) > 3); // desktop: 7 visible cards
    });
  }

  function goTo(i) {
    active = (i + n) % n;
    render();
  }

  /* click any side / back card to bring it to the front */
  cards.forEach(function (card, i) {
    card.addEventListener('click', function () {
      if (i !== active) goTo(i);
    });
  });

  /* swipe left / right */
  var sx = null, sy = null;
  deck.addEventListener('touchstart', function (e) {
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
  }, { passive: true });
  deck.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx;
    var dy = e.changedTouches[0].clientY - sy;
    sx = sy = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      goTo(active + (dx < 0 ? 1 : -1));
    }
  }, { passive: true });

  var resizeT;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(sizeDeck, 120);
  });
  window.addEventListener('load', sizeDeck);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeDeck);

  sizeDeck();
  render();
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

/* ORBIT DOTS — moves the blue dots along the rings (paste at the VERY BOTTOM of script.js) */
(function () {
  var cfg = {
    'od-1': { start: 0,   dur: 12, dir:  1 },
    'od-2': { start: 180, dur: 12, dir:  1 },
    'od-3': { start: 70,  dur: 18, dir: -1 },
    'od-4': { start: 20,  dur: 26, dir:  1 },
    'od-5': { start: 200, dur: 26, dir:  1 }
  };
  var dots = [];
  document.querySelectorAll('.orbit-dot').forEach(function (el) {
    Object.keys(cfg).forEach(function (k) {
      if (el.classList.contains(k)) dots.push({ el: el, c: cfg[k] });
    });
  });
  if (!dots.length) return;
  function tick(t) {
    var sec = t / 1000;
    dots.forEach(function (d) {
      var deg = (d.c.start + d.c.dir * (sec / d.c.dur) * 360) % 360;
      d.el.style.transform = 'translate(-50%,-50%) rotate(' + deg + 'deg)';
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
