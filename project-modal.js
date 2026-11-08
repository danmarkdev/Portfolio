/* ==========================================================
   PROJECT DETAILS OVERLAY
   Click (or press Enter on) a project card -> a full-screen details
   view opens. Close it with the X, the "Close Overview" button,
   or the Esc key.

   - Add this file in index.html AFTER script.js.
   - The card's image and live-site link are read from the card itself,
     so you only edit the text below.
   - To change a project: edit its entry in PROJECTS (the key must
     match the card title exactly).
   - Leave `tech` empty ( [] ) to hide the Technologies section.
   - The arrow icon on each card still opens the live site directly.
   ========================================================== */
(function () {
  var PROJECTS = {
    'HealthSync Clinic Management System': {
      kicker: '// CAPSTONE SYSTEM',
      badge: 'LIVE DEPLOYMENT',
      title: 'HealthSync Clinic Management System',
      intro: 'A web-based capstone system that simplifies the school nurse\u2019s workflow, from digital records to real-time communication.',
      points: [
        ['School nurse workflow:', 'Simplifies the daily tasks of the school nurse in one organized system.'],
        ['Digital records:', 'Keeps clinic information in digital form instead of paper.'],
        ['Real-time communication:', 'Built-in tools for communicating in real time.'],
        ['Streamlined healthcare processes:', 'Simple, organized and easy to use for managing clinic information and daily tasks.']
      ],
      tech: []   /* add your stack here, e.g. ['PHP', 'MySQL'] */
    },

    'Julia AI': {
      kicker: '// FLAGSHIP AI SYSTEM',
      badge: 'PRIVATE DEPLOYMENT',
      title: 'Julia AI',
      intro: 'Developed in September 2026. A Hello Kitty-themed AI companion and Danmark\u2019s most challenging project.',
      points: [
        ['Natural conversation:', 'Chats naturally as a friendly AI companion, with replies that stream in real time.'],
        ['Image generation:', 'Turns your ideas into generated images. Julia decides on her own when a message is a picture request.'],
        ['Reads photos, PDFs and links:', 'Understands photos, PDF files, text files and shared web links.'],
        ['Clear formatting:', 'Formats answers clearly, from step-by-step lists and tables to copy-ready code blocks.'],
        ['Practice quiz and flashcards:', 'Creates quizzes and flashcards from a chat, a file or any topic, with Easy, Average and Hard levels.'],
        ['Cross-device sync:', 'Syncs chats between phone and computer using a private sync code.'],
        ['Chat tools:', 'Read aloud, copy, edit and resend, good or bad feedback, retry, and rename or delete chats.'],
        ['Hello Kitty theme:', 'A cheerful, creative interface with a daily motivation card that makes tasks easier and more fun.']
      ],
      tech: [
        'HTML5',
        'CSS3',
        'JavaScript',
        'Google Gemini API',
        'Cloudflare Workers',
        'Cloudflare Workers AI',
        'FLUX.1 schnell',
        'Cloudflare KV',
        'Web Speech API'
      ]
    },

    'Resume Analyzer': {
      kicker: '// WEB APP',
      badge: 'LIVE DEPLOYMENT',
      title: 'Resume Analyzer',
      intro: 'A web-based resume review system that helps job seekers improve their resumes with rule-based checks and AI feedback.',
      points: [
        ['PDF and DOCX upload:', 'Accepts resumes in the two most common formats.'],
        ['Rule-based ATS checks:', 'Checks the resume against common applicant tracking system rules.'],
        ['AI-generated feedback:', 'Gives written feedback on the resume\u2019s content.'],
        ['Keyword matching:', 'Compares the resume against a job posting\u2019s keywords.'],
        ['Section-by-section suggestions:', 'Shows what to improve in each part of the resume.']
      ],
      tech: ['Node.js', 'Tailwind CSS']
    },

    'Learn & Approach': {
      kicker: '// INTERACTIVE GAME',
      badge: 'LIVE DEPLOYMENT',
      title: 'Learn & Approach',
      intro: 'An interactive matching game designed to sharpen attention to detail.',
      points: [
        ['Four levels:', 'Each level tests how closely the player looks.'],
        ['Shuffled choices:', 'Three shuffled choices per round, with only one correct match.'],
        ['Activity questions:', 'The final results connect players to the activity questions in Google Drive.']
      ],
      tech: ['GitHub Pages', 'Google Drive']
    },

    'Digital Father\u2019s Day Letter': {
      kicker: '// INTERACTIVE LETTER',
      badge: 'LIVE DEPLOYMENT',
      title: 'Digital Father\u2019s Day Letter',
      intro: 'An interactive tap-to-open envelope with a scripture-rooted tribute to the two church pastors.',
      points: [
        ['Tap-to-open envelope:', 'The letter opens with a tap, like a real envelope.'],
        ['Personalized letters:', 'Individual letters written for each pastor.'],
        ['Scroll-triggered reveal:', 'Content appears as the reader scrolls.'],
        ['Closing message:', 'Ends with a message of gratitude from the congregation.']
      ],
      tech: []
    }
  };

  /* normalise titles so  Father's  /  Father\u2019s  and  &  all match */
  function norm(s) {
    return (s || '').replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
  }
  var LOOKUP = {};
  Object.keys(PROJECTS).forEach(function (k) { LOOKUP[norm(k)] = PROJECTS[k]; });

  var X_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
  var ARROW_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  /* build the overlay once */
  var overlay = document.createElement('div');
  overlay.className = 'pm-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'pmTitle');
  overlay.innerHTML =
    '<div class="pm-wrap">' +
      '<div class="pm-top">' +
        '<div class="pm-head">' +
          '<div class="pm-meta"><span class="pm-kicker"></span><span class="pm-badge"></span></div>' +
          '<h2 class="pm-title" id="pmTitle"></h2>' +
        '</div>' +
        '<button type="button" class="pm-x" aria-label="Close">' + X_ICON + '</button>' +
      '</div>' +
      '<p class="pm-intro"></p>' +
      '<div class="pm-grid">' +
        '<div class="pm-shot"><img alt=""/></div>' +
        '<div class="pm-info">' +
          '<h4 class="pm-h">// KEY CAPABILITIES &amp; IMPACT</h4>' +
          '<ul class="pm-list"></ul>' +
          '<div class="pm-tech-wrap">' +
            '<h4 class="pm-h">// TECHNOLOGIES &amp; TOOLS</h4>' +
            '<div class="pm-tech"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="pm-actions">' +
        '<button type="button" class="pm-close">Close Overview</button>' +
        '<a class="pm-visit" target="_blank" rel="noopener"></a>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  var $ = function (sel) { return overlay.querySelector(sel); };
  var elKicker = $('.pm-kicker'), elBadge = $('.pm-badge'), elTitle = $('.pm-title');
  var elIntro = $('.pm-intro'), elImg = $('.pm-shot img'), elList = $('.pm-list');
  var elTechWrap = $('.pm-tech-wrap'), elTech = $('.pm-tech'), elVisit = $('.pm-visit');
  var elX = $('.pm-x'), elClose = $('.pm-close');
  var lastFocus = null;

  function fill(card) {
    var titleEl = card.querySelector('.project-card-title');
    var cardTitle = titleEl ? titleEl.textContent.trim() : '';
    var descEl = card.querySelector('.project-card-desc');
    var imgEl = card.querySelector('.project-img-wrap img');
    var linkEl = card.querySelector('.project-link-icon');
    var href = linkEl ? linkEl.getAttribute('href') : '';
    var isPrivate = !href || href === '#' || (linkEl && linkEl.classList.contains('project-link-locked'));

    var d = LOOKUP[norm(cardTitle)] || {
      kicker: '// PROJECT',
      badge: isPrivate ? 'PRIVATE DEPLOYMENT' : 'LIVE DEPLOYMENT',
      title: cardTitle,
      intro: descEl ? descEl.textContent.trim() : '',
      points: [],
      tech: []
    };

    elKicker.textContent = d.kicker;
    elBadge.textContent = d.badge;
    elTitle.textContent = d.title;
    elIntro.textContent = d.intro;

    if (imgEl) {
      elImg.src = imgEl.getAttribute('src');
      elImg.alt = imgEl.getAttribute('alt') || cardTitle;
    }

    elList.innerHTML = '';
    d.points.forEach(function (p) {
      var li = document.createElement('li');
      var strong = document.createElement('strong');
      strong.textContent = p[0];
      li.appendChild(strong);
      li.appendChild(document.createTextNode(' ' + p[1]));
      elList.appendChild(li);
    });
    elList.style.display = d.points.length ? '' : 'none';
    var firstHeading = overlay.querySelector('.pm-info > .pm-h');
    if (firstHeading) firstHeading.style.display = d.points.length ? '' : 'none';

    elTech.innerHTML = '';
    d.tech.forEach(function (t) {
      var chip = document.createElement('span');
      chip.className = 'pm-chip';
      chip.textContent = t;
      elTech.appendChild(chip);
    });
    elTechWrap.style.display = d.tech.length ? '' : 'none';

    if (isPrivate) {
      elVisit.classList.add('is-disabled');
      elVisit.removeAttribute('href');
      elVisit.setAttribute('aria-disabled', 'true');
      elVisit.textContent = 'Private System';
    } else {
      elVisit.classList.remove('is-disabled');
      elVisit.setAttribute('href', href);
      elVisit.removeAttribute('aria-disabled');
      elVisit.innerHTML = 'Visit Live Site ' + ARROW_ICON;
    }
  }

  function openOverlay(card) {
    lastFocus = document.activeElement;
    fill(card);
    overlay.scrollTop = 0;
    overlay.classList.add('open');
    document.body.classList.add('pm-open');
    setTimeout(function () { try { elX.focus({ preventScroll: true }); } catch (e) {} }, 50);
  }

  function closeOverlay() {
    if (!overlay.classList.contains('open')) return;
    overlay.classList.remove('open');
    document.body.classList.remove('pm-open');
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
  }

  elX.addEventListener('click', closeOverlay);
  elClose.addEventListener('click', closeOverlay);
  elVisit.addEventListener('click', function (e) {
    if (elVisit.classList.contains('is-disabled')) e.preventDefault();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeOverlay();
  });

  /* make the visible cards keyboard-friendly */
  var cards = Array.prototype.slice.call(document.querySelectorAll('.project-card:not([aria-hidden="true"])'));
  cards.forEach(function (c) {
    c.setAttribute('tabindex', '0');
    c.setAttribute('role', 'button');
    c.addEventListener('keydown', function (e) {
      if (e.target !== c) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openOverlay(c);
      }
    });
  });

  /* click a card -> open (the arrow icon still goes straight to the live site) */
  document.addEventListener('click', function (e) {
    var card = e.target && e.target.closest ? e.target.closest('.project-card') : null;
    if (!card || card.getAttribute('aria-hidden') === 'true') return;
    if (e.target.closest('.project-link-icon')) return;
    openOverlay(card);
  });
})();
