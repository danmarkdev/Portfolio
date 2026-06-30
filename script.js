/* BACKGROUND CANVAS ANIMATION */
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
    for(var i=0;i<dots.length;i++){
      var d = dots[i];
      d.x += d.vx; d.y += d.vy;
      if(d.x<0||d.x>W) d.vx*=-1;
      if(d.y<0||d.y>H) d.vy*=-1;

      var mDist = Math.hypot(d.x-mouse.x, d.y-mouse.y);
      var alpha = mDist<MOUSE_DIST ? 1 : .55;

      ctx.beginPath();
      ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,'+alpha+')';
      ctx.fill();

      for(var j=i+1;j<dots.length;j++){
        var d2=dots[j];
        var dist=Math.hypot(d.x-d2.x,d.y-d2.y);
        if(dist<CONN_DIST){
          var lineA = (1-dist/CONN_DIST)*0.35;
          ctx.beginPath();
          ctx.moveTo(d.x,d.y);
          ctx.lineTo(d2.x,d2.y);
          ctx.strokeStyle='rgba(255,255,255,'+lineA+')';
          ctx.lineWidth=.6;
          ctx.stroke();
        }
      }
    }
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
