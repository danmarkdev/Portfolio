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

/* DRAGGABLE / SWIPEABLE MARQUEE — reusable for both the Projects and
   Certificates tracks. Works with mouse drag on desktop and touch swipe on
   mobile (Pointer Events cover both), and keeps auto-scrolling on its own
   whenever the person isn't actively dragging it. loopSeconds controls how
   long one full auto-scroll loop takes, same as the old CSS animation did. */
function initSwipeMarquee(trackId, loopSeconds){
  var track = document.getElementById(trackId);
  var wrap = track ? track.closest('.projects-marquee, .cert-marquee') : null;
  if(!track || !wrap) return;

  var half = 0;          // width of one full (non-duplicated) set of cards
  var pos = 0;            // current scroll offset in px
  var dragging = false;
  var moved = false;      // did the pointer travel far enough to count as a drag (vs a tap)
  var startX = 0;
  var startPos = 0;
  var speed = 0;          // px per second, auto-scroll rate
  var activePointerId = null;

  function measure(){
    half = track.scrollWidth / 2;
    speed = half / loopSeconds;
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
      pos = wrap360(pos + speed*dt);
      render();
    }
    requestAnimationFrame(tick);
  }

  function pointerDown(e){
    dragging = true;
    moved = false;
    startX = e.clientX;
    startPos = pos;
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
    }
  }

  function pointerUp(){
    if(!dragging) return;
    dragging = false;
    track.classList.remove('dragging');
    if(moved && track.releasePointerCapture){
      try{ track.releasePointerCapture(activePointerId); }catch(err){}
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

initSwipeMarquee('projectsTrack', 60); // ~60s per loop, same pace as before
initSwipeMarquee('certTrack', 75);     // ~75s per loop, same pace as before

/* CONTACT FORM */
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
  fetch('https://formspree.io/f/xaqzgqal',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name:name,email:email,subject:subject||'New message from Portfolio',message:msg})
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

/* ---------- EDUCATION CARD: auto-typing "real HTML" effect ---------- */
(function () {
  var mount = document.getElementById('eduCode');
  if (!mount) return;

  var BLANK = { indent: 0, blank: true };

  /* now takes an optional 4th arg: desc — the paragraph shown under the
     school name in the screenshot (e.g. "BTVTED Compro - Bachelor of
     Technical-Vocational Teacher Education, major in Computer Programming."),
     rendered as a nested <desc> tag so it still reads like real markup. */
  function entry(year, current, school, desc) {
    var lines = [
      { indent: 0, segs: [
          { c: 'code-tag', t: '<school ' },
          { c: 'code-attr', t: 'year=' },
          { c: 'code-attr-val', t: '"' + year + '"' },
          { c: 'code-tag', t: '>' }
        ] },
      { indent: 1, segs: [{ c: current ? 'code-text code-current' : 'code-text', t: school }] }
    ];

    if (desc) {
      lines.push({ indent: 1, segs: [
          { c: 'code-tag', t: '<desc>' },
          { c: 'code-desc', t: desc },
          { c: 'code-tag', t: '</desc>' }
        ] });
    }

    lines.push({ indent: 0, segs: [{ c: 'code-tag', t: '</school>' }] });
    lines.push(BLANK);
    return lines;
  }

  var lines = []
    .concat(entry(
      '2026 - Present',
      true,
      'Technological University of the Philippines Manila',
      'BTVTED Compro - Bachelor of Technical-Vocational Teacher Education, major in Computer Programming.'
    ))
    .concat(entry(
      '2024 - 2026',
      false,
      'STI College Bacoor',
      'TVL Track - ICT. Yearly Awarded With Honors in Grade 12. Focused on Web & Mobile Application Development.'
    ))
    .concat(entry(
      '2021 - 2024',
      false,
      'Bacoor National High School Molino Main',
      'Specialized in Technical Drafting, 2D/3D modeling, and digital blueprinting using AutoCAD.'
    ));

  // drop the trailing blank line after the last entry
  lines.pop();

  var CHAR_DELAY = 30;   // ms per character — slower, easier to read
  var LINE_DELAY = 140;  // ms pause between lines
  var typed = false;

  function scrollToBottom() {
    mount.scrollTop = mount.scrollHeight;
  }

  function typeLine(lineIndex) {
    if (lineIndex >= lines.length) return;
    var def = lines[lineIndex];

    var row = document.createElement('div');
    row.className = 'code-line';
    mount.appendChild(row);

    if (def.blank) {
      row.innerHTML = '&nbsp;';
      scrollToBottom();
      setTimeout(function () { typeLine(lineIndex + 1); }, LINE_DELAY);
      return;
    }

    var content = document.createElement('span');
    content.className = 'code-content';
    if (def.indent) content.style.marginLeft = (def.indent * 1.6) + 'rem';
    row.appendChild(content);

    var caret = document.createElement('span');
    caret.className = 'code-caret';
    content.appendChild(caret);

    var segIndex = 0, charIndex = 0;

    function typeChar() {
      if (segIndex >= def.segs.length) {
        caret.remove();
        setTimeout(function () { typeLine(lineIndex + 1); }, LINE_DELAY);
        return;
      }
      var seg = def.segs[segIndex];
      if (charIndex === 0) {
        var span = document.createElement('span');
        span.className = seg.c;
        content.insertBefore(span, caret);
      }
      var span = caret.previousSibling;
      span.textContent += seg.t[charIndex];
      charIndex++;
      if (charIndex >= seg.t.length) {
        segIndex++;
        charIndex = 0;
      }
      scrollToBottom();
      setTimeout(typeChar, CHAR_DELAY);
    }
    typeChar();
  }

  function startTyping() {
    if (typed) return;
    typed = true;
    mount.innerHTML = '';
    typeLine(0);
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        startTyping();
        observer.disconnect();
      }
    });
  }, { threshold: 0.25 });

  observer.observe(mount);
})();
