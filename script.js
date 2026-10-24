/* ---------- DEVICE CHECK (performance) ----------
   LITE  = weak phone / reduced-motion user  -> grid & background stay, but don't animate
   COARSE = touch device (phone / tablet)
   SCROLL_FNS = small functions that run once per frame while scrolling
                (one shared scroll handler instead of 4 separate ones) */
var COARSE = false;
var LITE = false;
try {
  COARSE = window.matchMedia('(pointer: coarse)').matches;
  var _reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var _mem = navigator.deviceMemory || 8;
  var _cores = navigator.hardwareConcurrency || 8;
  LITE = false;   /* never freeze the animations */
} catch (e) {}
if (LITE) document.documentElement.classList.add('lite-mode');

var SCROLL_FNS = [];
var SCROLLING = false;   /* true while the visitor is scrolling (phones pause heavy decorations then) */

/* ---------- SOUND EFFECTS ----------
   Tiny synthesized sounds made with the Web Audio API (no audio files):
     SFX.hover()    -> crisp tick when the mouse moves onto something pressable (desktop)
     SFX.click()    -> punchy click when you press a button / link / card
     SFX.tick()     -> small selection tick (dragging the carousels, timeline nodes)
     SFX.shuffle()  -> 3-part card "shuffle" when a testimonial card changes
     SFX.scroll()   -> soft tick while the page is scrolling
   Mobile uses the EXACT same sounds as desktop. On iPhone the audio is switched to
   "playback" mode so it also works when the silent switch is on.
   The speaker button (bottom-left) turns ALL sound on/off and remembers the choice. */
var SFX = (function () {
  var audioCtx = null;
  var master = null;
  var audioUnlocked = false;
  var keepAlive = null;
  var lastTick = 0;
  var lastScroll = 0;
  var MUTE_KEY = 'portfolio_sound_muted';
  var muted = false;
  var isTouch = false;

  try { muted = localStorage.getItem(MUTE_KEY) === 'true'; } catch (e) { muted = false; }
  try { isTouch = window.matchMedia('(pointer: coarse)').matches; } catch (e) { isTouch = false; }

  function isMuted() { return muted; }

  function setMuted(v) {
    muted = !!v;
    try { localStorage.setItem(MUTE_KEY, muted ? 'true' : 'false'); } catch (e) {}
  }

  /* a tiny silent WAV, built in code (no file needed) */
  function makeSilentWav() {
    var rate = 8000, n = 800;
    var buf = new ArrayBuffer(44 + n);
    var v = new DataView(buf);
    function s(o, t) { for (var i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); }
    s(0, 'RIFF'); v.setUint32(4, 36 + n, true); s(8, 'WAVE'); s(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate, true);
    v.setUint16(32, 1, true); v.setUint16(34, 8, true);
    s(36, 'data'); v.setUint32(40, n, true);
    for (var i = 0; i < n; i++) v.setUint8(44 + i, 128);
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }

  /* iPhone: makes Web Audio play even when the silent/ringer switch is on */
  function iosPlayback() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    try {
      if (!keepAlive) {
        keepAlive = document.createElement('audio');
        keepAlive.setAttribute('playsinline', '');
        keepAlive.setAttribute('webkit-playsinline', '');
        keepAlive.loop = true;
        keepAlive.src = makeSilentWav();
      }
      if (keepAlive.paused) {
        var p = keepAlive.play();
        if (p && p.catch) p.catch(function () {});
      }
    } catch (e) {}
  }

  function init() {
    try {
      if (muted) return;
      if (!audioCtx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioCtx = new AC();
        master = audioCtx.createGain();
        master.gain.value = 1;
        master.connect(audioCtx.destination);
        audioCtx.onstatechange = function () {
          if (audioCtx.state === 'running') audioUnlocked = true;
        };
      }
      if (audioCtx.state !== 'running') audioCtx.resume();
      if (!audioUnlocked) {
        var buffer = audioCtx.createBuffer(1, 1, 22050);
        var source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);
        iosPlayback();
      }
    } catch (e) {}
  }

  /* one short oscillator "pop": starts at f1, slides down to f2 */
  function pop(type, f1, f2, dur, vol, offset) {
    try {
      init();
      if (!audioCtx || !master || muted) return;
      var t = audioCtx.currentTime + (offset || 0);
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f1, t);
      osc.frequency.exponentialRampToValueAtTime(f2, t + dur);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch (err) {}
  }

  return {
    unlock: init,
    isMuted: isMuted,
    setMuted: setMuted,
    isRunning: function () { return !!audioCtx && audioCtx.state === 'running'; },
    hover: function () {
      if (muted) return;
      pop('sine', 2600, 550, 0.012, 0.35, 0);
    },
    click: function () {
      if (muted) return;
      pop('triangle', 1600, 220, 0.035, 0.5, 0);
    },
    tick: function () {
      if (muted) return;
      var now = Date.now();
      if (now - lastTick < 35) return;
      lastTick = now;
      pop('sine', 2800, 800, 0.009, 0.25, 0);
    },
    scroll: function () {
      if (muted) return;
      var now = Date.now();
      if (now - lastScroll < (isTouch ? 160 : 70)) return;
      lastScroll = now;
      pop('sine', 1500, 700, 0.014, 0.14, 0);
    },
    shuffle: function () {
      if (muted) return;
      [0, 0.035, 0.075].forEach(function (offset, idx) {
        pop('triangle', 1800 - idx * 250, 600 - idx * 100, 0.025, 0.35 - idx * 0.08, offset);
      });
    }
  };
})();

/* unlock audio on the visitor's first interaction (touchend + click are
   what mobile browsers accept). Listeners stay until audio is really running. */
(function () {
  var evts = ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'click', 'keydown'];
  function unlock() {
    SFX.unlock();
    if (SFX.isRunning()) {
      evts.forEach(function (evt) {
        window.removeEventListener(evt, unlock, true);
      });
    }
  }
  evts.forEach(function (evt) {
    window.addEventListener(evt, unlock, { passive: true, capture: true });
  });
})();

/* things that make sound when hovered / clicked */
var SFX_SELECTOR = 'a, button, .hamburger, .tech-icon-box, .stack-badge, .project-card, .cert-item, .testi-card, .edu-node';
var sfxHovered = null;

/* hover sound: plays once each time the mouse moves onto a new pressable thing */
document.addEventListener('mouseover', function (e) {
  var c = e.target && e.target.closest ? e.target.closest(SFX_SELECTOR) : null;
  if (c && c !== sfxHovered) {
    sfxHovered = c;
    SFX.hover();
  }
});
document.addEventListener('mouseout', function (e) {
  if (!sfxHovered) return;
  var related = e.relatedTarget;
  if (!related || !sfxHovered.contains(related)) sfxHovered = null;
});

/* click sound (dragging a carousel does not count as a click) */
document.addEventListener('click', function (e) {
  var t = e.target && e.target.closest ? e.target.closest(SFX_SELECTOR) : null;
  if (t) SFX.click();
});

/* ---------- SOUND ON/OFF BUTTON (bottom-left) ---------- */
(function () {
  var ON_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>' +
    '<path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
  var OFF_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>' +
    '<line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'soundToggle';
  btn.className = 'sound-toggle';

  function paint() {
    var m = SFX.isMuted();
    btn.innerHTML = m ? OFF_ICON : ON_ICON;
    btn.classList.toggle('is-muted', m);
    btn.setAttribute('aria-pressed', m ? 'true' : 'false');
    btn.setAttribute('aria-label', m ? 'Turn sound on' : 'Turn sound off');
    btn.title = m ? 'Sound off' : 'Sound on';
  }

  btn.addEventListener('click', function () {
    SFX.setMuted(!SFX.isMuted());
    paint();
    /* the click sound itself is played by the global click handler when turning ON */
  });

  paint();
  document.body.appendChild(btn);
})();

/* ---------- PRESSED COLOR FLASH ----------
   VIEW PROJECTS, SEND MESSAGE and BACK TO HOME turn WHITE the moment they are
   pressed (mouse or finger). Links wait ~220ms before moving on, so you can
   actually SEE the color change before the page scrolls / changes. */
(function () {
  var st = document.createElement('style');
  st.textContent =
    '.btn-primary.is-pressed,.contact-form button.is-pressed{' +
      'background:#ffffff !important;color:#050507 !important;' +
      'box-shadow:0 10px 24px rgba(255,255,255,.22) !important;' +
      'transform:scale(.97) !important;border-color:#ffffff !important}' +
    '.back-home.is-pressed{color:#ffffff !important;font-weight:700 !important}';
  document.head.appendChild(st);

  var PRESS_SEL = '.btn-primary, .contact-form button, .back-home';
  var timers = new WeakMap();

  function flash(el) {
    el.classList.add('is-pressed');
    clearTimeout(timers.get(el));
    timers.set(el, setTimeout(function () { el.classList.remove('is-pressed'); }, 1200));
  }

  document.addEventListener('pointerdown', function (e) {
    var el = e.target && e.target.closest ? e.target.closest(PRESS_SEL) : null;
    if (el) flash(el);
  }, true);

  /* delay navigation a moment so the white flash is visible */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a.btn-primary, a.back-home') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || a.hasAttribute('download')) return;
    e.preventDefault();
    flash(a);
    setTimeout(function () {
      if (href.charAt(0) === '#') {
        var target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        try { history.pushState(null, '', href); } catch (err) {}
      } else {
        window.location.href = href;
      }
    }, 220);
  }, true);
})();

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

/* ---------- ONE SHARED SCROLL HANDLER ----------
   Before: 4 separate scroll listeners (header, active nav, scroll sound,
   grid) ran on EVERY scroll event, and the nav one read offsetTop of every
   section each time (forces layout = jank on phones).
   Now: ONE listener, runs at most once per frame (requestAnimationFrame),
   and the section positions are measured once and cached. */
var sections=document.querySelectorAll('section[id]');
var navLinks=document.querySelectorAll('#nav a:not(.nav-cta)');
var mobileNavLinks=document.querySelectorAll('#mnav a');
var headerEl=document.getElementById('header');
var orbitEl=document.getElementById('photoOrbit');
var sectionCache=[];

function measureSections(){
  sectionCache=Array.prototype.map.call(sections,function(s){
    return { id:s.id, top:s.offsetTop };
  });
}
measureSections();

(function(){
  var lastY=window.scrollY||0;
  var acc=0;
  var queued=false;
  var lastCur=null;

  var scrollEndT;
  function frame(){
    queued=false;
    var y=window.scrollY||0;

    /* mark 'is scrolling' on touch devices; cleared 160ms after the last scroll */
    if(COARSE){
      if(!SCROLLING){ SCROLLING=true; if(orbitEl) orbitEl.classList.add('is-scrolling'); }
      clearTimeout(scrollEndT);
      scrollEndT=setTimeout(function(){
        SCROLLING=false;
        if(orbitEl) orbitEl.classList.remove('is-scrolling');
      },160);
    }

    /* scroll sound: a soft tick every ~70px */
    acc+=Math.abs(y-lastY);
    lastY=y;
    if(acc>=(COARSE?120:70)){ acc=0; SFX.scroll(); }

    /* header shadow */
    if(headerEl) headerEl.classList.toggle('scrolled',y>30);

    /* active nav link (only touches the DOM when the section changes) */
    var cur='';
    for(var i=0;i<sectionCache.length;i++){
      if(y>=sectionCache[i].top-120) cur=sectionCache[i].id;
    }
    if(cur!==lastCur){
      lastCur=cur;
      navLinks.forEach(function(a){ a.classList.toggle('active',a.getAttribute('href')==='#'+cur); });
      mobileNavLinks.forEach(function(a){ a.classList.toggle('active',a.getAttribute('href')==='#'+cur); });
    }

    /* anything else that wants to run while scrolling (the grid) */
    for(var j=0;j<SCROLL_FNS.length;j++) SCROLL_FNS[j]();
  }

  window.addEventListener('scroll',function(){
    if(!queued){ queued=true; requestAnimationFrame(frame); }
  },{passive:true});

  window.addEventListener('load',function(){ measureSections(); frame(); });
  var rT;
  window.addEventListener('resize',function(){
    clearTimeout(rT);
    rT=setTimeout(measureSections,150);
  });
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(measureSections);
})();

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

/* SCROLL REVEAL
   rootMargin makes things appear a little BEFORE they reach the screen,
   so sections never look empty while you scroll on a slow phone. */
var obs=new IntersectionObserver(function(entries){
  entries.forEach(function(e,i){
    if(e.isIntersecting){
      setTimeout(function(){ e.target.classList.add('visible'); },i*60);
      obs.unobserve(e.target);
    }
  });
},{threshold:.05,rootMargin:'0px 0px 120px 0px'});
document.querySelectorAll('.reveal').forEach(function(el){ obs.observe(el); });

/* DRAGGABLE / SWIPEABLE MARQUEE — used by the Projects and Certificates
   tracks. direction: 1 = normal, -1 = reversed.
   Plays a small tick when the visitor starts dragging and every ~40px after.
   PERFORMANCE: the loop does nothing while the marquee is off-screen, and
   it moves with translate3d (GPU). */
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
  var inView = true;

  var momentumVelocity = 0;
  var momentumActive = false;
  var lastMoveTime = 0;
  var lastMovePos = 0;
  var MAX_VELOCITY = 4200;
  var FRICTION = 3.2;

  if('IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      inView = entries[0].isIntersecting;
    },{ rootMargin:'120px' }).observe(wrap);
  }

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
    track.style.transform = 'translate3d(' + (-pos) + 'px,0,0)';
  }

  var lastTime = null;
  function tick(t){
    if(lastTime===null) lastTime = t;
    var dt = (t - lastTime) / 1000;
    lastTime = t;
    if(dt > 0.1) dt = 0.1;          /* no big jump after a tab switch / lag spike */

    /* off-screen: do no work at all */
    if((!inView || (COARSE && SCROLLING)) && !dragging){
      requestAnimationFrame(tick);
      return;
    }

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
      SFX.tick();                     /* tick when the drag starts */
      lastSoundDx = dx;
      if(track.setPointerCapture){
        try{ track.setPointerCapture(activePointerId); }catch(err){}
      }
    }
    if(moved){
      pos = wrap360(startPos - dx);
      render();

      if(Math.abs(dx - lastSoundDx) > 40){    /* tick every ~40px while dragging */
        SFX.tick();
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
        SFX.tick();
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
   Swiping / tapping a card plays the card-shuffle sound. */
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
    if (next !== active) SFX.shuffle();   /* card shuffle sound on every card change */
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

  /* only re-measure when the WIDTH changes (on phones, the address bar
     hiding/showing changes the height while scrolling — ignore that) */
  var lastW = window.innerWidth;
  var resizeT;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
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

/* (the tooltip is recomputed on hover/touch, so a full pass is only
   needed once on load and when the screen WIDTH changes) */
function adjustAllTechTips(){
  document.querySelectorAll('.tech-icon-box').forEach(computeTipShift);
}
(function(){
  var lastW = window.innerWidth;
  var t;
  function later(){
    clearTimeout(t);
    t = setTimeout(adjustAllTechTips, 200);
  }
  window.addEventListener('load', adjustAllTechTips);
  window.addEventListener('resize', function(){
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    later();
  });
  window.addEventListener('orientationchange', later);
})();

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
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    place();
  });
})();

/* PAUSE THE ORBITING ICONS WHEN THEY ARE OFF-SCREEN
   (17 icons x 2 animations each = a lot of work for nothing once you
   have scrolled past the hero) */
(function () {
  var orbit = document.getElementById('photoOrbit');
  if (!orbit || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (entries) {
    orbit.classList.toggle('is-offscreen', !entries[0].isIntersecting);
  }, { rootMargin: '60px' }).observe(orbit);
})();

/* ---------- ANIMATED BACKGROUND ----------
   Drifting soft glows + a floating particle network that reacts to the
   mouse. Creates its own <canvas id="bg-canvas"> if the page doesn't have
   one.

   PERFORMANCE:
   - STOPS COMPLETELY (no drawing at all) while the grid tunnel is
     showing or the tab is hidden. Before, it kept drawing invisibly.
   - On phones: fewer particles, 1 glow instead of 3, 1x pixel ratio and
     ~30fps, and it ignores the height-only resizes caused by the address
     bar hiding/showing while you scroll.
   - On weak devices (LITE) it draws ONE still frame and never animates. */
var BG = { gridOn: false, kick: function () {} };

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
  var still = LITE;                       /* reduced motion or weak device */
  var small = COARSE || window.matchMedia('(max-width: 960px)').matches;
  var W = 0, H = 0, dpr = 1;
  var pts = [];
  var mouse = { x: -9999, y: -9999 };
  var LINK = small ? 110 : 140;
  var running = false;
  var lastFrame = 0;
  var lastW = 0;

  var allBlobs = [
    { s: 1.0, p: 0.0, a: 0.02 },
    { s: 0.7, p: 2.1, a: 0.015 },
    { s: 1.3, p: 4.2, a: 0.012 }
  ];
  var blobs = small ? allBlobs.slice(0, 1) : allBlobs;

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
    dpr = small ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    lastW = W;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var maxPts = small ? 34 : 90;
    var count = Math.max(20, Math.min(maxPts, Math.round(W * H / (small ? 20000 : 16000))));
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
      if (!still) {
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
    ctx.fillStyle = 'rgba(' + ACC + ',0.45)';
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* the loop only runs when it is really needed */
  function shouldRun() {
    return !still && !BG.gridOn && !document.hidden;
  }

  function loop(t) {
    if (!shouldRun()) { running = false; return; }
    /* phones: ~30fps is plenty for a slow background */
    if (small && t - lastFrame < 33) { requestAnimationFrame(loop); return; }
    lastFrame = t;
    draw(t);
    requestAnimationFrame(loop);
  }

  function start() {
    if (still) { draw(0); return; }
    if (running || !shouldRun()) return;
    running = true;
    requestAnimationFrame(loop);
  }

  BG.kick = start;   /* the grid calls this when it turns on / off */

  document.addEventListener('visibilitychange', start);

  window.addEventListener('pointermove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });
  window.addEventListener('pointerleave', function () {
    mouse.x = mouse.y = -9999;
  });

  var rT;
  window.addEventListener('resize', function () {
    /* phones: scrolling changes the HEIGHT (address bar). Ignore that. */
    if (small && window.innerWidth === lastW) return;
    clearTimeout(rT);
    rT = setTimeout(function () {
      resize();
      if (still) draw(0);
    }, 150);
  });

  resize();
  start();
})();

/* ---------- GRID TUNNEL BACKGROUND ----------
   A "room" of grid lines: a small back wall (the box hole) in the middle,
   floor / ceiling / side walls running out to the screen edges. The square
   rings flow toward the viewer, and the box hole itself breathes (zooms in
   and out) and sways a little, so the whole tunnel looks alive.
   Shows from Testimonials down to the end of Technical Stacks.
   Same canvas drawing, same settings and same movement on desktop and phones. */
(function () {
  var testi = document.getElementById('testimonials');
  var skills = document.getElementById('skills');
  if (!testi || !skills) return;

  var small = COARSE || window.matchMedia('(max-width: 960px)').matches;

  var g = document.createElement('div');
  g.id = 'grid-bg';
  g.setAttribute('aria-hidden', 'true');
  g.innerHTML = '<canvas class="grid-canvas"></canvas>';
  document.body.insertBefore(g, document.body.firstChild);

  var gc = g.querySelector('canvas');
  var gx = gc.getContext('2d');
  if (!gx) return;

  /* ---- settings you can tweak (SAME on desktop and mobile) ---- */
  var BOX_W   = 0.15;     /* small hole: width as a fraction of the screen width (smaller = smaller hole) */
  var BOX_ASP = 1.5;      /* box shape: width / height (1 = square, 1.5 = wide, 0.7 = tall) */
  var BREATHE = 0.35;     /* hole zooms toward you / away (0 = none, 0.6 = a lot)  [was 0.08] */
  var BREATHE_MS = 4000;  /* ms for one zoom in/out (smaller = faster)             [was 6000] */
  var SWAY    = 0.12;     /* how far the hole wanders around the screen (0 = stays centered) [was 0.02] */
  var SWAY_MS = 7000;     /* ms for one wander loop (smaller = faster)             [was 9000] */
  var TILT    = 0.06;     /* the whole tunnel rocks left/right, in radians (0 = no tilt) [was 0] */
  var TILT_MS = 7000;     /* ms for one rock left-right-left */
  var D_BACK  = 5;        /* depth of the tunnel (perspective strength) */
  var D_NEAR  = 0.3;
  var SPACING = 0.34;     /* distance between rings (bigger = fewer rings) */
  var PERIOD  = 700;      /* ms for rings to move one spacing (smaller = faster)   [was 1500] */
  var LINE_A  = 0.9;      /* line brightness 0 - 1 (1 = pure white) */
  var COLS    = 12;       /* lines across the ceiling / floor: same on phone and desktop [was 5 on phone] */

  var Z_MAX = D_BACK - D_NEAR;
  var iB = 1 / D_BACK, iN = 1 / D_NEAR;
  var GW = 0, GH = 0, ROWS = 6, dpr = 1;
  var isOn = false, running = false;

  function setupCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    GW = window.innerWidth;
    GH = window.innerHeight;
    gc.width = Math.round(GW * dpr);
    gc.height = Math.round(GH * dpr);
    gx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ROWS = Math.max(3, Math.round(COLS / BOX_ASP));
  }

  function drawTunnel(t) {
    var cx = GW / 2, cy = GH / 2;

    /* the box hole: size zooms, position wanders (two waves = not a boring loop) */
    var k = 1 + BREATHE * Math.sin(t * 2 * Math.PI / BREATHE_MS);
    var bw = GW * BOX_W * 0.5 * k;
    var bh = bw / BOX_ASP;
    var wx = Math.sin(t * 2 * Math.PI / SWAY_MS) + 0.4 * Math.sin(t * 2 * Math.PI / (SWAY_MS * 0.43) + 1.3);
    var wy = Math.cos(t * 2 * Math.PI / (SWAY_MS * 1.3)) + 0.4 * Math.cos(t * 2 * Math.PI / (SWAY_MS * 0.57) + 0.7);
    var bx = cx + wx * GW * SWAY * 0.8;
    var by = cy + wy * GH * SWAY * 0.8;

    /* the "near" box is far bigger than the screen, so walls reach every edge */
    var nw = GW * 0.5 * iN / iB * 0.55;
    var nh = GH * 0.5 * iN / iB * 0.55;
    if (nw < GW) nw = GW;
    if (nh < GH) nh = GH;

    /* box (center + half size) at tunnel position p (0 = back wall, 1 = near) */
    function boxAt(p) {
      return {
        x: bx + (cx - bx) * p,
        y: by + (cy - by) * p,
        w: bw + (nw - bw) * p,
        h: bh + (nh - bh) * p
      };
    }

    var i, j, u, B, N;
    gx.clearRect(0, 0, GW, GH);
    gx.save();
    gx.translate(cx, cy);
    gx.rotate(TILT * Math.sin(t * 2 * Math.PI / TILT_MS));
    gx.translate(-cx, -cy);
    gx.lineWidth = 1;

    /* dark hole in the middle */
    gx.fillStyle = 'rgba(5,5,7,0.92)';
    gx.fillRect(bx - bw, by - bh, bw * 2, bh * 2);

    /* 1) lines running from the back wall out to the screen edges */
    B = boxAt(0); N = boxAt(1);
    gx.strokeStyle = 'rgba(255,255,255,' + LINE_A + ')';
    gx.beginPath();
    for (i = 0; i <= COLS; i++) {            /* ceiling + floor */
      u = -1 + (2 * i) / COLS;
      gx.moveTo(B.x + u * B.w, B.y - B.h);
      gx.lineTo(N.x + u * N.w, N.y - N.h);
      gx.moveTo(B.x + u * B.w, B.y + B.h);
      gx.lineTo(N.x + u * N.w, N.y + N.h);
    }
    for (j = 1; j < ROWS; j++) {             /* left + right walls */
      u = -1 + (2 * j) / ROWS;
      gx.moveTo(B.x - B.w, B.y + u * B.h);
      gx.lineTo(N.x - N.w, N.y + u * N.h);
      gx.moveTo(B.x + B.w, B.y + u * B.h);
      gx.lineTo(N.x + N.w, N.y + u * N.h);
    }
    gx.stroke();

    /* 2) square rings that flow toward the viewer */
    var offset = ((t % PERIOD) / PERIOD) * SPACING;
    for (var r = 0; ; r++) {
      var z = r * SPACING + offset;
      if (z > Z_MAX) break;
      var p = (1 / (D_BACK - z) - iB) / (iN - iB);     /* perspective-correct position */
      var R = boxAt(p);
      var a = Math.min(1, z / (SPACING * 2)) * LINE_A;  /* fade in from the back */
      gx.strokeStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
      gx.strokeRect(R.x - R.w, R.y - R.h, R.w * 2, R.h * 2);
    }

    /* 3) the back wall outline */
    gx.strokeStyle = 'rgba(255,255,255,' + LINE_A + ')';
    gx.strokeRect(bx - bw, by - bh, bw * 2, bh * 2);
    gx.restore();
  }

  function gridLoop(t) {
    if (!isOn || document.hidden) { running = false; return; }
    drawTunnel(t);
    requestAnimationFrame(gridLoop);
  }
  function startGrid() {
    if (running || !isOn || document.hidden) return;
    running = true;
    requestAnimationFrame(gridLoop);
  }

  setupCanvas();
  var lastGW = window.innerWidth;
  window.addEventListener('resize', function () {
    /* phones: ignore height-only resizes caused by the address bar */
    if (small && window.innerWidth === lastGW) return;
    lastGW = window.innerWidth;
    setupCanvas();
  });
  document.addEventListener('visibilitychange', startGrid);

  function update() {
    var H = window.innerHeight;
    var top = testi.getBoundingClientRect().top;
    var bottom = skills.getBoundingClientRect().bottom;
    var on = top < H * 0.65 && bottom > H * 0.35;
    if (on === isOn) return;
    isOn = on;
    g.classList.toggle('on', on);
    BG.gridOn = on;          /* the dots canvas stops while the tunnel is showing */
    BG.kick();
    if (on) startGrid();
  }

  SCROLL_FNS.push(update);
  window.addEventListener('resize', update);
  window.addEventListener('load', update);
  update();
})();
