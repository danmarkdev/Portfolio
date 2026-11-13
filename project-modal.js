/* PROJECT DETAILS OVERLAY */
(function () {
  var PROJECTS = {
    /* "School" removed from the title */
    'Clinic Compliance & Records Management System': {
      kicker: '// CAPSTONE SYSTEM',
      badge: 'LIVE DEPLOYMENT',
      name: 'HealthSync Clinic Management System',
      intro: 'A full-stack capstone clinic management system for STI College Bacoor. Features a real-time compliance dashboard, Excel and manual record import, scheduled Gmail and Outlook reminders, and a submission review workflow that updates each record automatically.',
      points: [
        ['Real-Time Compliance Dashboard:', 'Live population chart (bar, doughnut or pie), complete and pending counts, and a notification bell that refreshes every 10 seconds with new submissions and scheduled reminder results.'],
        ['Population and Records Management:', 'Separate SHS and Tertiary views for students and teachers, grouped by strand or course, with profile cards, search, archive and restore, plus printable reports.'],
        ['Bulk Import and Smart Validation:', 'Add records by hand or import Excel and CSV files with a downloadable template, numeric ID and email validation, and duplicate detection.'],
        ['Automated Email Reminders:', 'Send or schedule Gmail and Outlook reminders with templates and file attachments; scheduled blasts run automatically and replies from the clinic inbox are matched to the right record.'],
        ['Approval Workflow and Secure Access:', 'The nurse approves or rejects each submission (rejections email the reason back) and approved files mark the record Complete; login uses email OTP and reset links expire in 30 minutes.']
      ],
      tech: [
        'PHP (MySQLi)',
        'MySQL',
        'PHPMailer 7',
        'IMAP Inbox Reader',
        'EmailJS (OTP and Reset)',
        'Chart.js',
        'SheetJS (XLSX Import)',
        'JavaScript ES6+',
        'HTML5 and CSS3'
      ]
    },

    'AI Companion and Quiz Platform': {
      kicker: '// FLAGSHIP AI SYSTEM',
      badge: 'PRIVATE DEPLOYMENT',
      name: 'Julia AI',
      intro: 'A Hello Kitty-themed AI companion engineered by Danmark Rosalejos in September 2026. Features real-time Gemini chat, image generation with FLUX.1 on Cloudflare Workers AI, photo, PDF and link reading, a practice quiz and flashcard engine, and cross-device chat sync.',
      points: [
        ['Streaming AI Companion Chat:', 'Real-time conversation powered by the Gemini API through a secure Cloudflare Worker proxy, with markdown replies, copy-ready code blocks, tables and lists.'],
        ['Autonomous Image Generation:', 'Julia decides on her own when a message is a picture request, then generates the image with FLUX.1 schnell on Cloudflare Workers AI and shows it right in the chat.'],
        ['Multimodal Understanding:', 'Reads photos, PDF and text files, and shared web links; the Worker opens each link, extracts the page text and falls back to a reader service for JavaScript-heavy pages.'],
        ['Practice Quiz and Flashcard Engine:', 'Builds multiple-choice quizzes and flip flashcards from a chat, a file or any topic, with Easy, Average and Hard levels and instant scoring.'],
        ['Cross-Device Sync and Hello Kitty UX:', 'A private sync code keeps chats in step between phone and computer (Cloudflare KV), plus read-aloud replies, feedback buttons and a daily motivation card.']
      ],
      tech: [
        'Google Gemini API',
        'Cloudflare Workers',
        'Cloudflare Workers AI (FLUX.1)',
        'Cloudflare KV',
        'Server-Sent Events Streaming',
        'JavaScript ES6+ (Vanilla)',
        'Custom Markdown Renderer',
        'Web Speech API',
        'HTML5 and CSS3'
      ]
    },

    'AI Resume Review & ATS Scoring System': {
      kicker: '// WEB APP',
      badge: 'LIVE DEPLOYMENT',
      name: 'Resume Analyzer',
      intro: 'A full-stack resume review web app built with Node.js and Tailwind CSS. Features PDF and DOCX upload, AI and ATS readiness scores, rule-based checks, keyword matching against job postings, and section-by-section improvement suggestions.',
      points: [
        ['Drag-and-Drop Resume Upload:', 'Accepts PDF and DOCX files up to 5MB, with an optional job description field that sharpens keyword matching.'],
        ['Dual AI and ATS Scoring:', 'Two animated score rings from 0 to 100, color-coded green, amber or red, so job seekers see their ATS readiness at a glance.'],
        ['Rule-Based ATS Checks:', 'Detects email, phone number, bullet points and section headers, reports the word count, and lists detected issues in the resume.'],
        ['Job-Targeted Keyword Matching:', 'Compares the resume against a pasted job posting to give a keyword match percentage and a list of missing keywords.'],
        ['Structured AI Feedback:', 'Returns strengths, formatting issues, top recommendations and section-by-section advice, shown as clear result cards.']
      ],
      tech: [
        'Node.js (REST API)',
        'Tailwind CSS',
        'JavaScript ES6+ (Fetch API)',
        'HTML5',
        'PDF and DOCX Parsing',
        'AI Feedback API',
        'Render (API Hosting)'
      ]
    },

    /* The key matches the card title in index.html exactly */
    'Interactive Matching Learning Game': {
      kicker: '// INTERACTIVE GAME',
      badge: 'LIVE DEPLOYMENT',
      name: 'Learn & Approach',
      intro: 'An interactive image-matching game for a ProfEd 1 class activity. Features four levels with three shuffled choices each, live scoring and feedback, and a results screen that connects players to the activity questions in Google Drive.',
      points: [
        ['Four-Level Matching Challenge:', 'Each level shows a reference image and three look-alike choices with only one exact match, built to sharpen attention to detail.'],
        ['Shuffled Choices Every Round:', 'Answer positions are randomized each time, so players cannot memorize where the correct image sits.'],
        ['Instant Feedback and Progress Tracking:', 'Right and wrong answers are highlighted right away, with a live score and a step bar that turns green or red for each level.'],
        ['Results and Activity Hand-Off:', 'Ends with a final score and an encouraging message, a play-again option, and a button that opens the activity questions in Google Drive.'],
        ['Config-Driven and Responsive:', 'Levels and the activity link live in one config block, and the layout adapts to desktop and phone screens.']
      ],
      tech: [
        'HTML5',
        'CSS3 (Grid and Flexbox)',
        'JavaScript ES6+ (Vanilla)',
        'GitHub Pages',
        'Google Drive',
        'Google Fonts'
      ]
    },

    'Interactive Digital Tribute Letter for Pastors': {
      kicker: '// INTERACTIVE LETTER',
      badge: 'LIVE DEPLOYMENT',
      name: 'Digital Father\u2019s Day Letter',
      intro: 'An interactive digital letter for the two pastors of the Lorimi Bacoor Faith Family. Features a tap-to-open envelope, a scripture-rooted tribute, personal messages for each pastor, a scroll-triggered reveal, and a closing message of gratitude from the congregation.',
      points: [
        ['Tap-to-Open Envelope Intro:', 'A CSS-animated envelope with a flipping flap and a rising letter opens on tap, and page scrolling stays locked until it does.'],
        ['Scripture-Rooted Tribute:', 'Opens with 1 Thessalonians 2:11-12 and a heartfelt tribute thanking the pastors for shepherding the church like fathers.'],
        ['Pastor Profile Cards:', 'Each pastor gets a framed photo, name, role and a personal thank-you message written by the church family.'],
        ['Scroll-Triggered Reveal:', 'The pastor cards fade in as the reader scrolls down to them, driven by the Intersection Observer API.'],
        ['Letters of Gratitude:', 'A letter from the church family and a personal greeting from Danmark close the page, followed by a final thank-you message.']
      ],
      tech: [
        'HTML5',
        'CSS3 (Keyframes and Transitions)',
        'JavaScript ES6+ (Vanilla)',
        'Intersection Observer API',
        'Responsive Design'
      ]
    }
  };

  /* normalise titles so  Father's  /  Father\u2019s  and  &  all match */
  function norm(s) {
    return (s || '').replace(/[\u2018\u2019]/g, "'").replace(/-/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  }
  var LOOKUP = {};
  Object.keys(PROJECTS).forEach(function (k) { LOOKUP[norm(k)] = PROJECTS[k]; });

  /* ALIASES: older / alternate card titles that should open the same details.
     If you ever rename a card again, add its old or new title here. */
  var ALIASES = {
    'Interactive Image-Matching Learning Game': 'Interactive Matching Learning Game',
    'Learn & Approach': 'Interactive Matching Learning Game',
    /* old clinic title (with "School") now points to the new title */
    'School Clinic Compliance & Records Management System': 'Clinic Compliance & Records Management System'
  };
  Object.keys(ALIASES).forEach(function (alias) {
    var target = PROJECTS[ALIASES[alias]];
    if (target) LOOKUP[norm(alias)] = target;
  });

  /* Make the visible card titles match the canonical titles above, so the
     card and the overview always show the SAME name (even if index.html
     still has an old title). Hidden duplicate cards are skipped. */
  var CANON = {};
  Object.keys(PROJECTS).forEach(function (k) { CANON[norm(k)] = k; });
  Object.keys(ALIASES).forEach(function (a) { CANON[norm(a)] = ALIASES[a]; });
  Array.prototype.forEach.call(
    document.querySelectorAll('.project-card:not([aria-hidden="true"]) .project-card-title'),
    function (t) {
      var canon = CANON[norm(t.textContent)];
      if (canon) t.textContent = canon;
    }
  );

  /* RENAMES: rewrites the visible card title on the page, so the card AND the
     overview both show the new title even if index.html still has the old one. */
  var RENAMES = {
    'Interactive Image-Matching Learning Game': 'Interactive Matching Learning Game',
    'School Clinic Compliance & Records Management System': 'Clinic Compliance & Records Management System'
  };
  Array.prototype.forEach.call(document.querySelectorAll('.project-card-title'), function (el) {
    var t = el.textContent.trim();
    if (RENAMES[t]) el.textContent = RENAMES[t];
  });

  var X_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
  var ARROW_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  var pmStyle = document.createElement('style');
  pmStyle.textContent =
    '.pm-name{font-family:var(--font-mono);font-size:.8rem;font-weight:600;letter-spacing:.06em;color:#a4a7b8;margin-top:.55rem}' +
    '@media(min-width:961px){.pm-name{font-size:clamp(.7rem,1.6vh,.8rem);margin-top:clamp(.3rem,.9vh,.55rem)}}';
  document.head.appendChild(pmStyle);

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
          '<p class="pm-name"></p>' +
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
  var elName = $('.pm-name');
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
      name: '',
      intro: descEl ? descEl.textContent.trim() : '',
      points: [],
      tech: []
    };

    elKicker.textContent = d.kicker;
    elBadge.textContent = d.badge;
    elBadge.classList.toggle('is-private', !!isPrivate);
    /* the overview title is ALWAYS the same name as the card on the page;
       the project's own name (HealthSync, Julia AI ...) shows under it */
    elTitle.textContent = cardTitle || d.name;
    if (d.name && norm(d.name) !== norm(cardTitle)) {
      elName.textContent = d.name;
      elName.style.display = '';
    } else {
      elName.textContent = '';
      elName.style.display = 'none';
    }
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

    elVisit.classList.remove('is-disabled');
    elVisit.removeAttribute('aria-disabled');
    if (isPrivate) {
      /* private systems: the button sends the visitor to the contact page */
      elVisit.setAttribute('href', 'contact.html');
      elVisit.removeAttribute('target');
      elVisit.innerHTML = 'Inquire About ' + (d.name || cardTitle) + ' ' + ARROW_ICON;
    } else {
      elVisit.setAttribute('href', href);
      elVisit.setAttribute('target', '_blank');
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

  /* click a card, its arrow icon or its lock icon -> open the overview.
     (capture phase, so the arrow's live-site link and the lock's old alert
     never fire; the live site is now reached from the overview's button) */
  document.addEventListener('click', function (e) {
    var card = e.target && e.target.closest ? e.target.closest('.project-card') : null;
    if (!card || card.getAttribute('aria-hidden') === 'true') return;
    if (e.target.closest('.project-link-icon')) {
      e.preventDefault();
      e.stopPropagation();
      try { if (window.SFX && SFX.click) SFX.click(); } catch (err) {}
    }
    openOverlay(card);
  }, true);
})();
