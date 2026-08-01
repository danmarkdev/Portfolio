/* BACKGROUND CANVAS ANIMATION - "falling code" matrix-style rain (performance-safe) */
try{
  var canvas = document.getElementById('bg-canvas');
  if(canvas){
    var ctx = canvas.getContext('2d');
    var W, H, cols, drops, fontSize = 15;
    var CHARS = "01{}[]()<>=+-*/;:.#$%&_ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    function resizeCanvas(){
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      cols = Math.floor(W / fontSize);
      drops = [];
      for(var i=0;i<cols;i++){
        drops[i] = {
          y: Math.random()*-H,
          speed: 0.6 + Math.random()*1.6,
          len: 8 + Math.floor(Math.random()*14)
        };
      }
    }

    function drawCode(){
      /* soft trail fade - uses the page's gray tone so trails blend with the theme */
      ctx.fillStyle = 'rgba(77,77,77,.16)';
      ctx.fillRect(0,0,W,H);
      ctx.font = fontSize+'px monospace';
      ctx.textAlign = 'center';

      for(var i=0;i<cols;i++){
        var d = drops[i];
        var x = i*fontSize + fontSize/2;

        for(var j=0;j<d.len;j++){
          var y = d.y - j*fontSize;
          if(y<-fontSize || y>H+fontSize) continue;
          var ch = CHARS[Math.floor(Math.random()*CHARS.length)];
          var fade = 1 - (j/d.len);
          if(j===0){
            /* leading character - bright green with glow */
            ctx.fillStyle = 'rgba(120,255,150,'+(0.95*fade+0.1)+')';
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(80,255,120,.8)';
          } else {
            /* trailing characters - classic matrix green */
            ctx.fillStyle = 'rgba(40,220,90,'+(fade*0.5)+')';
            ctx.shadowBlur = 0;
          }
          ctx.fillText(ch, x, y);
        }

        d.y += d.speed*fontSize*0.14;
        if(d.y - d.len*fontSize > H){
          d.y = Math.random()*-200;
          d.speed = 0.6 + Math.random()*1.6;
          d.len = 8 + Math.floor(Math.random()*14);
        }
      }
      ctx.shadowBlur = 0;

      requestAnimationFrame(drawCode);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    ctx.fillStyle = '#4d4d4d';
    ctx.fillRect(0,0,W,H);
    drawCode();
  }
}catch(bgErr){
  console.error('Background animation failed to start:', bgErr);
}

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
    track.classList.add('dragging');
    if(track.setPointerCapture){
      try{ track.setPointerCapture(e.pointerId); }catch(err){}
    }
  }

  function pointerMove(e){
    if(!dragging) return;
    var dx = e.clientX - startX;
    /* FIX: raised from 4px to 15px — 4px was small enough that normal mouse
       jitter during a plain click was being misread as a drag, which then
       caused the click handler below to preventDefault() and swallow every
       "View Live Site" link click. 15px only triggers on an actual drag. */
    if(Math.abs(dx) > 15) moved = true;
    pos = wrap360(startPos - dx);
    render();
  }

  function pointerUp(){
    if(!dragging) return;
    dragging = false;
    track.classList.remove('dragging');
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
