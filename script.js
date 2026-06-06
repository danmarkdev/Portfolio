/* LOADER */
(function () {
  let p = 0;
  const bar = document.getElementById('lbar');
  const loader = document.getElementById('loader');
  if (!bar || !loader) return;

  const tick = setInterval(() => {
    p = Math.min(p + Math.random() * 18, 100);
    bar.style.width = p + '%';
    if (p >= 100) {
      clearInterval(tick);
      setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
      }, 300);
    }
  }, 100);
})();

/* HEADER SCROLL */
window.addEventListener('scroll', () => {
  document.getElementById('header').classList.toggle('scrolled', window.scrollY > 30);
});

/* HAMBURGER */
const hbg = document.getElementById('hbg');
const mnav = document.getElementById('mnav');
hbg.addEventListener('click', () => {
  hbg.classList.toggle('open');
  mnav.classList.toggle('open');
});
function closeMenu() {
  hbg.classList.remove('open');
  mnav.classList.remove('open');
}

/* ACTIVE NAV */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('#nav a:not(.nav-cta)');
if (sections.length) {
  window.addEventListener('scroll', () => {
    let cur = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) cur = s.id; });
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + cur);
    });
  });
}

/* SCROLL REVEAL */
const obs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 60);
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

/* CONTACT FORM */
function sendMsg() {
  const name = document.getElementById('cf-name').value.trim();
  const email = document.getElementById('cf-email').value.trim();
  const subject = document.getElementById('cf-subject') ? document.getElementById('cf-subject').value.trim() : '';
  const msg = document.getElementById('cf-msg').value.trim();
  const status = document.getElementById('cf-status');
  const btn = document.getElementById('cf-btn');

  if (!name || !email || !msg) {
    status.style.color = '#ff6b6b';
    status.textContent = 'Please fill in all fields.';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    status.style.color = '#ff6b6b';
    status.textContent = 'Please enter a valid email.';
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Sending...';
  status.style.color = '#888';
  status.textContent = 'Sending your message...';

  /* TODO: Replace with your actual EmailJS call */
  setTimeout(() => {
    status.style.color = '#6c63ff';
    status.textContent = 'Message sent! I\'ll get back to you soon.';
    btn.textContent = 'Send Message';
    btn.disabled = false;
    document.getElementById('cf-name').value = '';
    document.getElementById('cf-email').value = '';
    if (document.getElementById('cf-subject')) document.getElementById('cf-subject').value = '';
    document.getElementById('cf-msg').value = '';
  }, 1500);
}

/* COPY PROTECTION */
document.addEventListener('copy', e => e.preventDefault());
document.addEventListener('cut', e => e.preventDefault());
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && ['c','x','u','s','a'].includes(e.key.toLowerCase())) e.preventDefault();
  if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['i','j'].includes(e.key.toLowerCase()))) e.preventDefault();
});
