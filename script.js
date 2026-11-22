var COARSE = false;
var LITE = false;
try {
  COARSE = window.matchMedia('(pointer: coarse)').matches;
  var _reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var _mem = navigator.deviceMemory || 8;
  var _cores = navigator.hardwareConcurrency || 8;
  LITE = false;
} catch (e) {}
if (LITE) document.documentElement.classList.add('lite-mode');

var SCROLL_FNS = [];
var SCROLLING = false;

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

var SFX_SELECTOR = 'a, button, .hamburger, .tech-icon-box, .stack-badge, .project-card, .cert-item, .testi-card, .edu-node';
var sfxHovered = null;

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

document.addEventListener('click', function (e) {
  var t = e.target && e.target.closest ? e.target.closest(SFX_SELECTOR) : null;
  if (t) SFX.click();
});

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
  
  });

  paint();
  document.body.appendChild(btn);
})();

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

var MOBILE_BREAKPOINT = window.matchMedia('(max-width: 960px)');
function handleBreakpointChange(e){
  if(!e.matches) closeMenu();
}
if (MOBILE_BREAKPOINT.addEventListener) {
  MOBILE_BREAKPOINT.addEventListener('change', handleBreakpointChange);
} else if (MOBILE_BREAKPOINT.addListener) {
  MOBILE_BREAKPOINT.addListener(handleBreakpointChange);
}

var sections=document.querySelectorAll('section[id]');
var navLinks=document.querySelectorAll('#nav a:not(.nav-cta)');
var mobileNavLinks=document.querySelectorAll('#mnav a');
var headerEl=document.getElementById('header');
var orbitEl=document.getElementById('photoOrbit');
var sectionCache=[];

function measureSections(){
  var base=window.pageYOffset||document.documentElement.scrollTop||0;
  sectionCache=[];
  Array.prototype.forEach.call(sections,function(s){
    if(s.offsetParent===null&&getComputedStyle(s).position!=='fixed') return;
    var top=s.getBoundingClientRect().top+base;
    sectionCache.push({ id:s.id, top:top });
  });
  sectionCache.sort(function(a,b){ return a.top-b.top; });
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

    if(COARSE){
      if(!SCROLLING){ SCROLLING=true; if(orbitEl) orbitEl.classList.add('is-scrolling'); }
      clearTimeout(scrollEndT);
      scrollEndT=setTimeout(function(){
        SCROLLING=false;
        if(orbitEl) orbitEl.classList.remove('is-scrolling');
      },160);
    }

    acc+=Math.abs(y-lastY);
    lastY=y;
    if(acc>=(COARSE?120:70)){ acc=0; SFX.scroll(); }

    if(headerEl) headerEl.classList.toggle('scrolled',y>30);

    var cur=sectionCache.length?sectionCache[0].id:'';
    for(var i=0;i<sectionCache.length;i++){
      if(y>=sectionCache[i].top-140) cur=sectionCache[i].id;
    }
    var docH=document.documentElement.scrollHeight;
    if(sectionCache.length&&window.innerHeight+y>=docH-4){
      cur=sectionCache[sectionCache.length-1].id;
    }
    if(cur!==lastCur){
      lastCur=cur;
      navLinks.forEach(function(a){ a.classList.toggle('active',a.getAttribute('href')==='#'+cur); });
      mobileNavLinks.forEach(function(a){ a.classList.toggle('active',a.getAttribute('href')==='#'+cur); });
    }

    for(var j=0;j<SCROLL_FNS.length;j++) SCROLL_FNS[j]();
  }

  window.addEventListener('scroll',function(){
    if(!queued){ queued=true; requestAnimationFrame(frame); }
  },{passive:true});

  window.addEventListener('load',function(){ measureSections(); frame(); });
  var rT;
  window.addEventListener('resize',function(){
    clearTimeout(rT);
    rT=setTimeout(function(){ measureSections(); frame(); },150);
  });
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(function(){ measureSections(); frame(); });
  frame();
})();

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

var obs=new IntersectionObserver(function(entries){
  entries.forEach(function(e,i){
    if(e.isIntersecting){
      setTimeout(function(){ e.target.classList.add('visible'); },i*60);
      obs.unobserve(e.target);
    }
  });
},{threshold:.05,rootMargin:'0px 0px 120px 0px'});
document.querySelectorAll('.reveal').forEach(function(el){ obs.observe(el); });

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
    if(dt > 0.1) dt = 0.1;

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
      SFX.tick();
      lastSoundDx = dx;
      if(track.setPointerCapture){
        try{ track.setPointerCapture(activePointerId); }catch(err){}
      }
    }
    if(moved){
      pos = wrap360(startPos - dx);
      render();

      if(Math.abs(dx - lastSoundDx) > 40){
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

initSwipeMarquee('certTrack', 75, 1);
initSwipeMarquee('certTrack2', 75, -1);

var PAGE_LOADED = Date.now();

function sendMsg(){
  var val=function(id){ var el=document.getElementById(id); return el?el.value.trim():''; };
  var name=val('cf-name'), email=val('cf-email'), subject=val('cf-subject'), msg=val('cf-msg');
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
  formData.append('website', val('cf-website'));
  formData.append('elapsed', Date.now() - PAGE_LOADED);

  fetch('https://script.google.com/macros/s/AKfycbzFKLKp7Z-6tA3BH80f1bpkj9ORJrDVIL4dOi7WMWazKDgszjCdHUoMo1_8FNY0eec/exec', { method:'POST', body: formData })
    .then(function(res){ return res.text(); })
    .then(function(txt){
      var data=null;
      try{ data=JSON.parse(txt); }catch(e){}
      if(data && data.ok){
        status.style.color='#22c55e'; status.textContent='Message Sent!';
        ['cf-name','cf-email','cf-subject','cf-msg'].forEach(function(id){
          var el=document.getElementById(id); if(el) el.value='';
        });
      } else if(data && data.error==='rate'){
        status.style.color='#ff6b6b'; status.textContent='Too many messages. Please try again later.';
      } else {
        status.style.color='#ff6b6b'; status.textContent='Failed to send. Please try again.';
      }
    })
    .catch(function(){
      status.style.color='#ff6b6b'; status.textContent='Failed to send. Please try again.';
    })
    .then(function(){
      btn.textContent='SEND MESSAGE'; btn.disabled=false;
    });
}

document.addEventListener('copy',function(e){ e.preventDefault(); });
document.addEventListener('cut',function(e){ e.preventDefault(); });
document.addEventListener('contextmenu',function(e){ e.preventDefault(); });
document.addEventListener('keydown',function(e){
  if((e.ctrlKey||e.metaKey)&&['c','x','u','s','a'].includes(e.key.toLowerCase())) e.preventDefault();
  if(e.key==='F12'||(e.ctrlKey&&e.shiftKey&&['i','j'].includes(e.key.toLowerCase()))) e.preventDefault();
});

(function () {
  var deck = document.getElementById('testiDeck');
  if (!deck) return;

  var cards = Array.prototype.slice.call(deck.querySelectorAll('.testi-card'));
  if (!cards.length) return;

  var dotsWrap = document.getElementById('testiDots');
  if (dotsWrap) dotsWrap.style.display = 'none';

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
    var maxShown = Math.max(3, half);
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
    if (next !== active) SFX.shuffle();
    active = next;
    render();
  }

  cards.forEach(function (card, i) {
    card.addEventListener('click', function () {
      if (i !== active) goTo(i);
    });
  });

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

(function () {
  var orbit = document.getElementById('photoOrbit');
  if (!orbit || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (entries) {
    orbit.classList.toggle('is-offscreen', !entries[0].isIntersecting);
  }, { rootMargin: '60px' }).observe(orbit);
})();

(function () {
  var orbit = document.getElementById('photoOrbit');
  if (!orbit) return;

  var st = document.createElement('style');
  st.textContent =
    '#photoOrbit:hover:not(.is-offscreen):not(.is-scrolling) .orbit-item,' +
    '#photoOrbit:hover:not(.is-offscreen):not(.is-scrolling) .orbit-counter,' +
    '#photoOrbit.has-active:not(.is-offscreen):not(.is-scrolling) .orbit-item,' +
    '#photoOrbit.has-active:not(.is-offscreen):not(.is-scrolling) .orbit-counter{' +
      'animation-play-state:running}' +
    '#photoOrbit .orbit-item.is-active,' +
    '#photoOrbit .orbit-item.is-active .orbit-counter{' +
      'animation-play-state:paused !important}' +
    '#photoOrbit .orbit-counter{touch-action:manipulation}';
  document.head.appendChild(st);

  var items = Array.prototype.slice.call(orbit.querySelectorAll('.orbit-item'));
  var active = null;
  var activePointerId = null;
  var lastDown = 0;

  items.forEach(function (it) {
    var counter = it.querySelector('.orbit-counter');
    var badge = it.querySelector('.stack-badge');
    var icon = badge && badge.querySelector('.fb-icon');
    if (!counter || !icon) return;
    var tip = document.createElement('div');
    tip.className = 'orbit-tip';
    tip.setAttribute('role', 'tooltip');
    tip.appendChild(icon.cloneNode(true));
    var nm = document.createElement('span');
    nm.className = 'orbit-tip-name';
    nm.textContent = it.getAttribute('data-name') || '';
    tip.appendChild(nm);
    counter.appendChild(tip);

    badge.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(it, null);
      }
    });
  });

  function place(it) {
    var counter = it.querySelector('.orbit-counter');
    var tip = it.querySelector('.orbit-tip');
    if (!counter || !tip) return;
    it.classList.remove('tip-flip');
    tip.style.setProperty('--tip-shift', '0px');
    var r = counter.getBoundingClientRect();
    if (r.top < tip.offsetHeight + 14 + 90) it.classList.add('tip-flip');
    var vw = document.documentElement.clientWidth;
    var cx = r.left + r.width / 2, tw = tip.offsetWidth, m = 10, shift = 0;
    if (cx - tw / 2 < m) shift = m - (cx - tw / 2);
    else if (cx + tw / 2 > vw - m) shift = (vw - m) - (cx + tw / 2);
    tip.style.setProperty('--tip-shift', shift + 'px');
  }

  function closeTip() {
    if (active) active.classList.remove('is-active');
    active = null;
    activePointerId = null;
  }

  function openTip(it, pointerId) {
    closeTip();
    active = it;
    activePointerId = pointerId;
    it.classList.add('is-active');
    place(it);
  }

  function toggle(it, pointerId) {
    if (it === active) closeTip(); else openTip(it, pointerId);
  }

  function itemFrom(e) {
    var it = e.target && e.target.closest ? e.target.closest('.orbit-item') : null;
    return (it && items.indexOf(it) !== -1) ? it : null;
  }

  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    var it = itemFrom(e);
    if (!it) { closeTip(); return; }
    lastDown = Date.now();
    toggle(it, e.pointerId);
  }, { passive: true });

  document.addEventListener('pointercancel', function (e) {
    if (active && e.pointerId === activePointerId) closeTip();
  }, { passive: true });

  document.addEventListener('click', function (e) {
    if (Date.now() - lastDown < 600) return;
    var it = itemFrom(e);
    if (!it) { closeTip(); return; }
    toggle(it, null);
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeTip(); });
  window.addEventListener('resize', function () { if (active) place(active); });
})();

(function () {
  function fixTextNode(node) {
    var text = node.nodeValue;
    if (text.indexOf('-') === -1) return;
    var parts = text.split(/(\S+-\S+)/g);
    var frag = document.createDocumentFragment();
    parts.forEach(function (part, i) {
      if (i % 2 === 1) {
        var span = document.createElement('span');
        span.style.whiteSpace = 'nowrap';
        span.textContent = part;
        frag.appendChild(span);
      } else if (part) {
        frag.appendChild(document.createTextNode(part));
      }
    });
    node.parentNode.replaceChild(frag, node);
  }

  function fix(el) {
    if (el.getAttribute('data-nohyphen') === '1') return;
    var nodes = Array.prototype.filter.call(el.childNodes, function (n) { return n.nodeType === 3; });
    nodes.forEach(fixTextNode);
    el.setAttribute('data-nohyphen', '1');
  }

  var HIGHLIGHTS = ['web based capstone system'];

  function highlight(el) {
    HIGHLIGHTS.forEach(function (phrase) {
      var lower = phrase.toLowerCase();
      var nodes = Array.prototype.filter.call(el.childNodes, function (n) { return n.nodeType === 3; });
      nodes.forEach(function (node) {
        var idx = node.nodeValue.toLowerCase().indexOf(lower);
        if (idx === -1) return;
        var text = node.nodeValue;
        var span = document.createElement('span');
        span.className = 'hl-white';
        span.style.color = '#ffffff';
        span.style.fontWeight = '700';
        span.textContent = text.substr(idx, phrase.length);
        var frag = document.createDocumentFragment();
        if (idx > 0) frag.appendChild(document.createTextNode(text.slice(0, idx)));
        frag.appendChild(span);
        if (idx + phrase.length < text.length) frag.appendChild(document.createTextNode(text.slice(idx + phrase.length)));
        node.parentNode.replaceChild(frag, node);
      });
    });
  }

  function run() {
    document.querySelectorAll('.project-card-desc').forEach(function (el) {
      highlight(el);
      fix(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();

(function(){
  var overlay=document.createElement('div');
  overlay.className='cert-viewer';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML='<button type="button" class="cert-viewer-close" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg></button><figure class="cert-viewer-figure"><img class="cert-viewer-img" alt=""/><figcaption class="cert-viewer-caption"></figcaption></figure>';
  document.body.appendChild(overlay);

  var img=overlay.querySelector('.cert-viewer-img');
  var cap=overlay.querySelector('.cert-viewer-caption');
  var closeBtn=overlay.querySelector('.cert-viewer-close');
  var down=false;
  var moved=false;
  var startX=0;
  var startY=0;

  function openViewer(item){
    var thumb=item.querySelector('img');
    if(!thumb)return;
    var title=item.querySelector('h4');
    var source=item.querySelector('p');
    var text=[];
    if(title)text.push(title.textContent.trim());
    if(source)text.push(source.textContent.trim());
    var nextSrc=thumb.currentSrc||thumb.src;
    clearTimeout(clearT);
    img.style.transition='none';
    img.style.opacity='0';
    img.onload=function(){
      img.style.transition='opacity .2s ease';
      img.style.opacity='1';
    };
    img.onerror=function(){
      img.style.transition='opacity .2s ease';
      img.style.opacity='1';
    };
    img.removeAttribute('src');
    img.alt=title?title.textContent.trim():'Certificate';
    cap.textContent=text.join(' - ');
    img.src=nextSrc;
    if(img.complete&&img.naturalWidth>0){
      img.style.transition='opacity .2s ease';
      img.style.opacity='1';
    }
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
    document.body.classList.add('cert-open');
  }

  var clearT;
  function closeViewer(){
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    document.body.classList.remove('cert-open');
    clearTimeout(clearT);
    clearT=setTimeout(function(){
      if(overlay.classList.contains('open'))return;
      img.style.opacity='0';
      img.removeAttribute('src');
      cap.textContent='';
    },300);
  }

  document.addEventListener('pointerdown',function(e){
    down=true;
    moved=false;
    startX=e.clientX;
    startY=e.clientY;
  },true);

  document.addEventListener('pointermove',function(e){
    if(!down)return;
    if(Math.abs(e.clientX-startX)>6||Math.abs(e.clientY-startY)>6)moved=true;
  },true);

  document.addEventListener('pointerup',function(){down=false},true);
  document.addEventListener('pointercancel',function(){down=false;moved=true},true);

  document.addEventListener('click',function(e){
    if(overlay.classList.contains('open'))return;
    var item=e.target.closest('.cert-item');
    if(!item)return;
    if(moved){moved=false;return}
    openViewer(item);
  });

  closeBtn.addEventListener('click',closeViewer);

  overlay.addEventListener('click',function(e){
    if(e.target===overlay||e.target.classList.contains('cert-viewer-figure'))closeViewer();
  });

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&overlay.classList.contains('open'))closeViewer();
  });
})();
