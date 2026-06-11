/* LOADER */
(function () {
  var loader = document.getElementById('loader');
  var bar    = document.getElementById('lbar');
  /* Contact page has no loader — skip safely */
  if (!bar || !loader) return;
  var p = 0;
  var tick = setInterval(function () {
    p = Math.min(p + Math.random() * 18, 100);
    bar.style.width = p + '%';
    if (p >= 100) {
      clearInterval(tick);
      setTimeout(function () {
        loader.style.opacity = '0';
        setTimeout(function () { loader.style.display = 'none'; }, 500);
      }, 300);
    }
  }, 100);
})();

/* HEADER SCROLL */
window.addEventListener('scroll', function () {
  var h = document.getElementById('header');
  if (h) h.classList.toggle('scrolled', window.scrollY > 30);
});

/* HAMBURGER */
var hbg  = document.getElementById('hbg');
var mnav = document.getElementById('mnav');
if (hbg && mnav) {
  hbg.addEventListener('click', function () {
    hbg.classList.toggle('open');
    mnav.classList.toggle('open');
  });
}
function closeMenu() {
  if (hbg)  hbg.classList.remove('open');
  if (mnav) mnav.classList.remove('open');
}

/* ACTIVE NAV (index page only) */
var sections  = document.querySelectorAll('section[id]');
var navLinks  = document.querySelectorAll('#nav a:not(.nav-cta)');
if (sections.length) {
  window.addEventListener('scroll', function () {
    var cur = '';
    sections.forEach(function (s) {
      if (window.scrollY >= s.offsetTop - 120) cur = s.id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + cur);
    });
  });
}

/* SCROLL REVEAL */
var obs = new IntersectionObserver(function (entries) {
  entries.forEach(function (e, i) {
    if (e.isIntersecting) {
      setTimeout(function () { e.target.classList.add('visible'); }, i * 60);
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });

/* CONTACT FORM */
function sendMsg() {
  var name    = document.getElementById('cf-name')    ? document.getElementById('cf-name').value.trim()    : '';
  var email   = document.getElementById('cf-email')   ? document.getElementById('cf-email').value.trim()   : '';
  var subject = document.getElementById('cf-subject') ? document.getElementById('cf-subject').value.trim() : '';
  var msg     = document.getElementById('cf-msg')     ? document.getElementById('cf-msg').value.trim()     : '';
  var status  = document.getElementById('cf-status');
  var btn     = document.getElementById('cf-btn');

  if (!status || !btn) return;

  if (!name || !email || !msg) {
    status.style.color = '#ff6b6b';
    status.textContent = 'Please fill in all required fields.';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    status.style.color = '#ff6b6b';
    status.textContent = 'Please enter a valid email address.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending...';
  status.style.color = '#888';
  status.textContent = 'Sending your message…';

  fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_key: 'dccfe411-ebfa-41c4-956c-e33f7ba558ab',
      name:       name,
      email:      email,
      subject:    subject || 'New message from Portfolio',
      message:    msg,
      botcheck:   false
    })
  })
  .then(function (res) { return res.json(); })
  .then(function (data) {
    if (data.success) {
      status.style.color = '#6c63ff';
      status.textContent = "Message sent! I'll get back to you soon.";
      document.getElementById('cf-name').value  = '';
      document.getElementById('cf-email').value = '';
      if (document.getElementById('cf-subject')) document.getElementById('cf-subject').value = '';
      document.getElementById('cf-msg').value   = '';
    } else {
      status.style.color = '#ff6b6b';
      status.textContent = 'Failed to send. Please try again.';
    }
    btn.textContent = 'SEND MESSAGE';
    btn.disabled = false;
  })
  .catch(function () {
    status.style.color = '#ff6b6b';
    status.textContent = 'Failed to send. Please try again.';
    btn.textContent = 'SEND MESSAGE';
    btn.disabled = false;
  });
}

/* COPY PROTECTION */
document.addEventListener('copy',        function (e) { e.preventDefault(); });
document.addEventListener('cut',         function (e) { e.preventDefault(); });
document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
document.addEventListener('keydown',     function (e) {
  if ((e.ctrlKey || e.metaKey) && ['c','x','u','s','a'].includes(e.key.toLowerCase())) e.preventDefault();
  if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['i','j'].includes(e.key.toLowerCase()))) e.preventDefault();
});
