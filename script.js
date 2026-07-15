/* BACKGROUND CANVAS ANIMATION - glowing white dots (performance-safe) */
(function(){
  var canvas = document.getElementById('bg-canvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var W, H, dots = [], mouse = {x:-999,y:-999};
  var NUM = 90, CONN_DIST = 140, MOUSE_DIST = 100;

  function resize(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function Dot(){
    this.x = Math.random()*W;
    this.y = Math.random()*H;
    this.vx = (Math.random()-.5)*.35;
    this.vy = (Math.random()-.5)*.35;
    this.r = Math.random()*1.5+.5;
  }

  function init(){
    resize();
    dots = [];
    for(var i=0;i<NUM;i++) dots.push(new Dot());
  }

  function draw(){
    ctx.clearRect(0,0,W,H);

    for(var k=0;k<dots.length;k++){
      var p = dots[k];
      p.x += p.vx; p.y += p.vy;
      if(p.x<0||p.x>W) p.vx*=-1;
      if(p.y<0||p.y>H) p.vy*=-1;
    }

    ctx.shadowBlur = 0;
    ctx.lineWidth = .7;
    for(var i=0;i<dots.length;i++){
      var d = dots[i];
      for(var j=i+1;j<dots.length;j++){
        var d2=dots[j];
        var dx = d.x-d2.x, dy = d.y-d2.y;
        var dist = Math.sqrt(dx*dx+dy*dy);
        if(dist<CONN_DIST){
          var lineA = (1-dist/CONN_DIST)*0.5;
          ctx.beginPath();
          ctx.moveTo(d.x,d.y);
          ctx.lineTo(d2.x,d2.y);
          ctx.strokeStyle='rgba(255,255,255,'+lineA+')';
          ctx.stroke();
        }
      }
    }

    for(var k2=0;k2<dots.length;k2++){
      var q = dots[k2];
      var mDist = Math.hypot(q.x-mouse.x, q.y-mouse.y);
      var near = mDist<MOUSE_DIST;
      var alpha = near ? 1 : .85;

      ctx.shadowBlur = near ? 16 : 8;
      ctx.shadowColor = 'rgba(255,255,255,.9)';
      ctx.beginPath();
      ctx.arc(q.x,q.y,near ? q.r*1.6 : q.r,0,Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,'+alpha+')';
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', function(e){ mouse.x=e.clientX; mouse.y=e.clientY; });
  window.addEventListener('touchmove', function(e){ if(e.touches[0]){ mouse.x=e.touches[0].clientX; mouse.y=e.touches[0].clientY; }},{passive:true});

  init();
  draw();
})();

/* LOADER */
(function(){
  var loader = document.getElementById('loader');
  var bar = document.getElementById('lbar');
  if(!bar||!loader) return;
  var p=0;
  var tick=setInterval(function(){
    p=Math.min(p+Math.random()*18,100);
    bar.style.width=p+'%';
    if(p>=100){
      clearInterval(tick);
      setTimeout(function(){
        loader.style.opacity='0';
        setTimeout(function(){ loader.style.display='none'; },500);
      },300);
    }
  },100);
})();

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

/* ROTATING "FULL STACK" BADGE — cycles through GitHub / JavaScript / SQL / VS Code */
(function(){
  var badge = document.getElementById('rotatingBadge');
  var iconEl = document.getElementById('rotatingBadgeIcon');
  var titleEl = document.getElementById('rotatingBadgeTitle');
  if(!badge||!iconEl||!titleEl) return;

  var items = [
    { name:'GitHub', bg:'#181717', icon:'<img src="https://cdn.simpleicons.org/github/ffffff" alt="GitHub" loading="lazy"/>' },
    { name:'JavaScript', bg:'#F7DF1E', icon:'<img src="https://cdn.simpleicons.org/javascript/000000" alt="JavaScript" loading="lazy"/>' },
    { name:'SQL', bg:'#0EA5E9', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 5v6c0 1.66-4.03 3-9 3s-9-1.34-9-3V5"/><path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6"/></svg>' },
    { name:'VS Code', bg:'#1e1e1e', icon:'<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg" alt="VS Code" loading="lazy"/>' }
  ];

  var idx = 0;

  function render(){
    var it = items[idx];
    iconEl.style.background = it.bg;
    iconEl.innerHTML = it.icon;
    titleEl.textContent = it.name;
    badge.style.opacity = '1';
  }

  function next(){
    badge.style.opacity = '0';
    setTimeout(function(){
      idx = (idx+1) % items.length;
      render();
    }, 250);
  }

  render();
  setInterval(next, 2200);
})();

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
