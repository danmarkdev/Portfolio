/* ---------- SOUND EFFECTS ----------
   Tiny sounds made with the browser's Web Audio API (no audio files needed).
     SFX.click()  -> soft "pop" when a button / link / card is clicked
     SFX.swipe()  -> soft "whoosh" when swiping or dragging a carousel
   Browsers only allow sound after the visitor touches the page once, so the
   audio is unlocked on the first tap / click / key press.
   To make everything quieter or louder, change MASTER_VOLUME below. */
var SFX = (function () {
  var MASTER_VOLUME = 0.6;
  var ctx = null, master = null, noiseBuf = null;
  var lastClick = 0, lastSwipe = 0, lastHover = 0;

  function ensure() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      try { ctx = new AC(); } catch (err) { return null; }
      master = ctx.createGain();
      master.gain.value = MASTER_VOLUME;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended' && ctx.resume) { ctx.resume(); }
    return ctx;
  }

  function blip(f1, f2, dur, type, vol, delay) {
    var c = ensure();
    if (!c) return;
    var t = c.currentTime + (delay || 0);
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  function whoosh(vol, dur, f1, f2) {
    var c = ensure();
    if (!c) return;
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      var data = noiseBuf.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    var t = c.currentTime;
    var src = c.createBufferSource();
    src.buffer = noiseBuf;
    var bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(f1, t);
    bp.frequency.exponentialRampToValueAtTime(f2, t + dur);
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.03);
  }

  return {
    unlock: ensure,
    click: function () {
      var n = Date.now();
      if (n - lastClick < 60) return;
      lastClick = n;
      blip(920, 600, 0.07, 'triangle', 0.22, 0);
      blip(1380, 900, 0.05, 'sine', 0.10, 0.012);
    },
    hover: function () {
      var n = Date.now();
      if (n - lastHover < 70) return;
      lastHover = n;
      blip(1500, 1900, 0.04, 'sine', 0.07, 0);
    },
    swipe: function (soft) {
      var n = Date.now();
      if (n - lastSwipe < (soft ? 110 : 140)) return;
      lastSwipe = n;
      if (soft) whoosh(0.16, 0.14, 1200, 2600);
      else whoosh(0.28, 0.22, 700, 2800);
    }
  };
})();

/* unlock audio on the visitor's first touch / click / key press */
['pointerdown', 'touchstart', 'keydown'].forEach(function (evt) {
  window.addEventListener(evt, function () { SFX.unlock(); }, { once: true, passive: true });
});

/* click sound for buttons, links and clickable cards.
   (Testimonial cards play the swipe sound instead; dragging a carousel
   plays the swipe sound and does not trigger a click sound.) */
document.addEventListener('click', function (e) {
  var t = e.target && e.target.closest
    ? e.target.closest('a, button, .tech-icon-box, .edu-node, .project-card, .cert-item')
    : null;
  if (t) SFX.click();
});

/* HOVER sound: a tiny tick when the mouse moves onto something you can press
   (before you click it). Only for mouse; phones have no hover.
   Note: browsers keep audio locked until the first click / tap / key press. */
var lastHoverEl = null;
document.addEventListener('pointerover', function (e) {
  if (e.pointerType && e.pointerType !== 'mouse') return;
  var t = e.target && e.target.closest
    ? e.target.closest('a, button, .tech-icon-box, .edu-node, .project-card, .cert-item, .testi-card, .stack-badge')
    : null;
  if (t && t !== lastHoverEl) SFX.hover();
  lastHoverEl = t;
});

/* ICON FALLBACK — if a brand logo fails to load, swap it for a clean
   text badge (the tool's initials) instead of a broken-image icon. */
document.querySelectorAll('.fb-icon img').forEach(function (img) {
  img.addEventListener('error', function () {
    var wrap = img.closest('.fb-icon');
    var alt = img.getAttribute('alt') || '?';
    var initials = (alt.replace(/[^A-Za-z0-9]/g, '').slice(0, 2) || '?').toUpperCase();

    var dark = true;
    if (wrap) {
      var bg = getComputedStyle(wrap).backgroundColor;
      var rgb = bg && bg.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        var lum = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
        dark = lum > 150;
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

/* KEEP THE MOBILE MENU IN SYNC WITH VIEWPORT WIDTH */
var MOBILE_BREAKPOINT = window.matchMedia('(max-width: 960px)');
function handleBreakpointChange(e){
  if(!e.matches) closeMenu();
}
if (MOBILE_BREAKPOINT.addEventListener) {
  MOBILE_BREAKPOINT.addEventListener('change', handleBreakpointChange);
} else if (MOBILE_BREAKPOINT.addListener) {
  MOBILE_BREAKPOINT.addListener(handleBreakpointChange);
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
/* set active state instantly on click */
[navLinks, mobileNavLinks].forEach(function(list){
  list.forEach(function(a){
    a.addEventListener('click',function(){
      list.forEach(function(b){ b.classList.remove('active'); });
      a.classList.add('active');
    });
  });
});

/* TECHNICAL STACK TABS (no visible effect on desktop) */
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
   tracks. direction: 1 = normal, -1 = reversed.
   Plays a swipe sound when the visitor starts dragging, plus a softer one
   every ~170px of dragging. */
function initSwipeMarquee(trackId, loopSeconds, direction){
  direction = direction || 1;
  var track = document.getElementById(trackId);
  var wrap = track ? track.closest('.projects-marquee, .cert-marquee-row') : null;
  if(!track || !wrap) return;

  var half = 0;
  var pos = 0;
  var dragging = false;
  var moved = false;
  var startX = 0;
  var startPos = 0;
  var speed = 0;
  var activePointerId = null;
  var lastSoundDx = 0;

  var momentumVelocity = 0;
  var momentumActive = false;
  var lastMoveTime = 0;
  var lastMovePos = 0;
  var MAX_VELOCITY = 4200;
  var FRICTION = 3.2;

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
    lastSoundDx = 0;
    lastMoveTime = performance.now();
    lastMovePos = pos;
    activePointerId = e.pointerId;
  }

  function pointerMove(e){
    if(!dragging) return;
    var dx = e.clientX - startX;
    if(!moved && Math.abs(dx) > 15){
      moved = true;
      track.classList.add('dragging');
      SFX.swipe(false);               /* swipe sound when the drag starts */
      lastSoundDx = dx;
      if(track.setPointerCapture){
        try{ track.setPointerCapture(activePointerId); }catch(err){}
      }
    }
    if(moved){
      pos = wrap360(startPos - dx);
      render();

      if(Math.abs(dx - lastSoundDx) > 170){   /* soft tick while dragging */
        SFX.swipe(true);
        lastSoundDx = dx;
      }

      var now = performance.now();
      var dt = now - lastMoveTime;
      if(dt > 0){
        var rawVelocity = (pos - lastMovePos) / dt * 1000;
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

  track.addEventListener('click', function(e){
    if(moved){ e.preventDefault(); e.stopPropagation(); }
  }, true);

  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  measure();
  requestAnimationFrame(tick);
}

initSwipeMarquee('projectTrack', 108, 1);
initSwipeMarquee('certTrack', 75, 1);
initSwipeMarquee('certTrack2', 75, -1);

/* CONTACT FORM — Google Apps Script */
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
  status.style.color='#a4a7b8'; status.textContent='Sending your message\u2026';

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

  /* NOTE: the AI Store Visualizer is an idea/concept only — it has not been built. */
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

  var ICONS = {
    cap: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3z"/><path d="M5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.8-7-3.8z"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="13" rx="3"/><rect x="10.5" y="17" width="3" height="2"/><rect x="7.5" y="19.3" width="9" height="1.7" rx="0.85"/><path class="cut" d="M10.6 8.2 8 10.6l2.6 2.6" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path class="cut" d="M13.4 8.2 16 10.6l-2.6 2.6" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chip: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="10" y="1" width="2" height="4"/><rect x="14" y="1" width="2" height="4"/><rect x="10" y="19" width="2" height="4"/><rect x="14" y="19" width="2" height="4"/><rect x="1" y="10" width="4" height="2"/><rect x="1" y="14" width="4" height="2"/><rect x="19" y="10" width="4" height="2"/><rect x="19" y="14" width="4" height="2"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12v6a6 6 0 0 1-12 0V3z"/><path d="M6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="11" y="14" width="2" height="4"/><rect x="7" y="18" width="10" height="3" rx="1"/></svg>',
    badge: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15 8.5 22 9.3 17 14.1 18.2 21 12 17.6 5.8 21 7 14.1 2 9.3 9 8.5 12 2"/></svg>'
  };

  function buildTimeline(mountId, data) {
    var mount = document.getElementById(mountId);
    if (!mount) return null;
    mount.innerHTML = '';

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
   Each card is rearranged to: [avatar name rating] / quote icon / text.
   Testimonials are SHORTENED here (SHORT_TEXT) so every card stays the same
   compact size as the reference design (~330px wide, short quote).
   To edit a quote, just change the text next to the person's name below.
   Swiping / tapping a card plays the swipe sound. */
(function () {
  var deck = document.getElementById('testiDeck');
  if (!deck) return;

  var cards = Array.prototype.slice.call(deck.querySelectorAll('.testi-card'));
  if (!cards.length) return;

  var dotsWrap = document.getElementById('testiDots');
  if (dotsWrap) dotsWrap.style.display = 'none';

  /* SHORT versions of each testimonial, matched by the person's name */
  var SHORT_TEXT = {
    'Josh Aguilera':    'Danmark did a great job on the HealthSync Clinic Management System. It\u2019s simple, organized, and easy to use, with features that are practical for daily clinic tasks.',
    'Julia Sardalla':   'The AI Danmark created for me is easy to use and has a creative design. It helped me with my tasks and improved the quality of my work.',
    'Clark Zablan':     'His development was quite fast, even remarkable. From learning the basics, he has gained a lot of knowledge and solved many problems.',
    'Benny Scoggins':   'He is very passionate about his work and pours his time, skills, and knowledge into it. He finds solutions you wouldn\u2019t think of.',
    'Asher Brum':       'His growth was exemplary and worthy of imitation, and his programming skills were commendable even from his early stages.',
    'Joaquin Flores':   'Danmark handled the design and back-end work alone and delivered on time. He\u2019s honest, responsible, and a snappy developer.',
    'Ken Cuaresma':     'Danmark is a skilled and dedicated developer. He is easy to work with, takes every project seriously, and I would definitely recommend him.',
    'Shanell Jamandre': 'Danmark gave me a hugeee help in creating the minigame I desired for my activity simulation for practice teaching. It went to success as he resolved the issues in my minigame program.'
  };

  /* fallback for any new testimonial not listed above:
     whole sentences only, up to ~170 characters */
  var MAX_CHARS = 170;
  function shorten(t) {
    t = t.replace(/\s+/g, ' ').trim();
    var parts = t.replace(/([.!?])\s+/g, '$1|').split('|');
    var out = '';
    for (var i = 0; i < parts.length; i++) {
      var next = (out ? out + ' ' : '') + parts[i];
      if (i > 0 && next.length > MAX_CHARS) break;
      out = next;
    }
    return out;
  }

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

    var personName = name ? name.textContent.trim() : '';

    var head = document.createElement('div');
    head.className = 'testi-head';
    if (avatar) head.appendChild(avatar);
    if (name) head.appendChild(name);
    if (rating) head.appendChild(rating);

    if (text) {
      text.textContent = SHORT_TEXT[personName] || shorten(text.textContent);
    }

    c.innerHTML = '';
    c.appendChild(head);
    if (quote) c.appendChild(quote);
    if (text) c.appendChild(text);
  });

  var n = cards.length;
  var active = 0;

  function isMobile() {
    return window.matchMedia('(max-width:700px)').matches;
  }

  /* cards are position:absolute: make them equal height, size the deck */
  function sizeDeck() {
    var max = 0;
    cards.forEach(function (c) { c.style.height = 'auto'; });
    cards.forEach(function (c) { max = Math.max(max, c.offsetHeight); });
    cards.forEach(function (c) { c.style.height = max + 'px'; });
    var extra = isMobile() ? 2 * 46 + 24 : 3 * 26 + 30;
    deck.style.height = (max + extra) + 'px';
  }

  function render() {
    var half = Math.floor(n / 2);
    var maxShown = Math.max(3, half);   /* show EVERY card (8 testimonials = 4 on the left, 3 on the right) */
    cards.forEach(function (c, i) {
      var o = ((i - active + n + half) % n) - half;
      var r = (i - active + n) % n;
      c.style.setProperty('--o', o);
      c.style.setProperty('--a', Math.abs(o));
      c.style.setProperty('--r', r);
      c.classList.toggle('testi-active', i === active);
      c.classList.toggle('testi-far', r > 2);
      c.classList.toggle('testi-out', Math.abs(o) > maxShown);
    });
  }

  function goTo(i) {
    var next = (i + n) % n;
    if (next !== active) SFX.swipe(false);   /* swipe sound on every card change */
    active = next;
    render();
  }

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

/* TECH TIP EDGE GUARD — keeps the Technical Stack tooltip inside the screen. */
function computeTipShift(box){
  var tip = box.querySelector('.tech-tip');
  if(!tip) return;
  var margin = 12;

  box.classList.remove('tip-flip');
  box.style.setProperty('--tip-shift','0px');

  var boxRect = box.getBoundingClientRect();

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

/* ORBIT DOTS (scattered, still) */
(function () {
  var ring = document.getElementById('orbitRing');
  if (!ring) return;

  ring.querySelectorAll('.orbit-dot').forEach(function (el) {
    el.parentNode.removeChild(el);
  });

  var cfg = [
    { a: 20,  ring: 3, s: 8 },
    { a: 75,  ring: 1, s: 7 },
    { a: 130, ring: 2, s: 8 },
    { a: 190, ring: 3, s: 9 },
    { a: 245, ring: 1, s: 7 },
    { a: 300, ring: 2, s: 8 },
    { a: 345, ring: 1, s: 7 }
  ];

  var dots = cfg.map(function (c) {
    var el = document.createElement('div');
    el.style.cssText =
      'position:absolute;top:50%;left:50%;border-radius:50%;pointer-events:none;z-index:0;' +
      'width:' + c.s + 'px;height:' + c.s + 'px;' +
      'margin:' + (-c.s / 2) + 'px 0 0 ' + (-c.s / 2) + 'px;' +
      'background:rgba(255,255,255,.75);box-shadow:0 0 8px 1px rgba(255,255,255,.25);';
    ring.insertBefore(el, ring.firstChild);
    return { el: el, c: c };
  });

  function place() {
    var cs = getComputedStyle(ring);
    var radii = {
      1: parseFloat(cs.getPropertyValue('--r1')) || 180,
      2: parseFloat(cs.getPropertyValue('--r2')) || 220,
      3: parseFloat(cs.getPropertyValue('--r3')) || 260
    };
    dots.forEach(function (d) {
      var rad = d.c.a * Math.PI / 180;
      var r = radii[d.c.ring];
      d.el.style.transform =
        'translate(' + (Math.cos(rad) * r) + 'px,' + (Math.sin(rad) * r) + 'px)';
    });
  }
  place();
  window.addEventListener('resize', place);
})();

/* ---------- ANIMATED BACKGROUND ----------
   Drifting soft glows + a floating particle network that reacts to the
   mouse. Creates its own <canvas id="bg-canvas"> if the page doesn't have
   one. */
(function () {
  var canvas = document.getElementById('bg-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'bg-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);
  }
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var ACC = '255,255,255';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, dpr = 1;
  var pts = [];
  var mouse = { x: -9999, y: -9999 };
  var LINK = 140;

  var blobs = [
    { s: 1.0, p: 0.0, a: 0.02 },
    { s: 0.7, p: 2.1, a: 0.015 },
    { s: 1.3, p: 4.2, a: 0.012 }
  ];

  function make() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.8
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.max(24, Math.min(90, Math.round(W * H / 16000)));
    while (pts.length < count) pts.push(make());
    pts.length = count;
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    var big = Math.max(W, H) * 0.45;
    blobs.forEach(function (b) {
      var x = W * (0.5 + 0.4 * Math.sin(t * 0.00007 * b.s + b.p));
      var y = H * (0.5 + 0.4 * Math.cos(t * 0.00005 * b.s + b.p * 1.3));
      var g = ctx.createRadialGradient(x, y, 0, x, y, big);
      g.addColorStop(0, 'rgba(' + ACC + ',' + b.a + ')');
      g.addColorStop(1, 'rgba(' + ACC + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });

    var i, j, p, q, dx, dy, d2;
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      if (!reduce) {
        dx = p.x - mouse.x;
        dy = p.y - mouse.y;
        d2 = dx * dx + dy * dy;
        if (d2 < 14400 && d2 > 1) {
          var d = Math.sqrt(d2);
          var f = (120 - d) / 120 * 0.6;
          p.x += (dx / d) * f;
          p.y += (dy / d) * f;
        }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
      }
    }

    ctx.lineWidth = 1;
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      for (j = i + 1; j < pts.length; j++) {
        q = pts[j];
        dx = p.x - q.x;
        dy = p.y - q.y;
        d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          var a = (1 - Math.sqrt(d2) / LINK) * 0.16;
          ctx.strokeStyle = 'rgba(' + ACC + ',' + a.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      ctx.fillStyle = 'rgba(' + ACC + ',0.45)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(t) {
    draw(t);
    requestAnimationFrame(loop);
  }

  window.addEventListener('pointermove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });
  window.addEventListener('pointerleave', function () {
    mouse.x = mouse.y = -9999;
  });

  var rT;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () {
      resize();
      if (reduce) draw(0);
    }, 120);
  });

  resize();
  if (reduce) { draw(0); } else { requestAnimationFrame(loop); }
})();

/* ---------- PERSPECTIVE GRID BACKGROUND ----------
   A fixed grid "floor" that fades in while the visitor is anywhere between
   the Testimonials section and the end of Technical Stacks, and fades out
   everywhere else. */
(function () {
  var testi = document.getElementById('testimonials');
  var skills = document.getElementById('skills');
  if (!testi || !skills) return;

  var g = document.createElement('div');
  g.id = 'grid-bg';
  g.setAttribute('aria-hidden', 'true');
  g.innerHTML = '<div class="grid-floor"></div>';
  document.body.insertBefore(g, document.body.firstChild);

  function update() {
    var H = window.innerHeight;
    var top = testi.getBoundingClientRect().top;
    var bottom = skills.getBoundingClientRect().bottom;
    g.classList.toggle('on', top < H * 0.65 && bottom > H * 0.35);
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('load', update);
  update();
})();
