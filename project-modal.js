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
   - The arrow / lock icon on each card also opens this overview
     (the live site is reached from the button at the bottom).
   ========================================================== */
(function () {
  var PROJECTS = {
    'HealthSync Clinic Management System': {
      kicker: '// CAPSTONE SYSTEM',
      badge: 'LIVE DEPLOYMENT',
      title: 'HealthSync Clinic Management System',
      intro: 'A web-based capstone clinic management system engineered by Danmark Rosalejos for STI College Bacoor. Features a compliance dashboard, Excel and manual record import, scheduled Gmail and Outlook reminders, and a submission review flow that updates each record automatically.',
      points: [
        ['Dashboard and analytics:', 'Live population chart, compliance counts and a bell for pending items.'],
        ['Records management:', 'SHS and Tertiary students and teachers in separate views, with archive and restore.'],
        ['Excel and manual import:', 'Bulk import with validation and a downloadable template, or add records by hand.'],
        ['Broadcast reminders:', 'Sends or schedules Gmail and Outlook reminders using ready-made templates.'],
        ['Submission review:', 'Reads replies from the clinic inbox; the nurse approves or rejects with an emailed reason.'],
        ['Printable reports:', 'Prints or saves PDF reports filtered by compliance status or school level.'],
        ['Secure access:', 'Email OTP two-step login, reset links that expire in 30 minutes, and dark mode.']
      ],
      tech: [
        'HTML5',
        'CSS3',
        'JavaScript',
        'PHP',
        'MySQL',
        'PHPMailer',
        'EmailJS',
        'Chart.js',
        'SheetJS'
      ]
    },

    'Julia AI': {
      kicker: '// FLAGSHIP AI SYSTEM',
      badge: 'PRIVATE DEPLOYMENT',
      title: 'Julia AI',
      intro: 'A Hello Kitty-themed AI companion engineered by Danmark Rosalejos in September 2026. Features real-time Gemini chat, image generation with FLUX.1 on Cloudflare Workers AI, photo, PDF and link reading, a practice quiz and flashcard engine, and cross-device chat sync.',
      points: [
        ['Natural conversation:', 'Chats as a friendly AI companion with real-time streaming replies.'],
        ['Image generation:', 'Turns your ideas into images; Julia decides when a message is a picture request.'],
        ['Reads photos, PDFs and links:', 'Understands photos, PDF and text files, and shared web links.'],
        ['Clear formatting:', 'Answers come as step-by-step lists, tables and copy-ready code blocks.'],
        ['Practice quiz and flashcards:', 'Builds them from a chat, a file or any topic, at three difficulty levels.'],
        ['Cross-device sync:', 'Syncs chats between phone and computer with a private sync code.'],
        ['Hello Kitty theme:', 'A cheerful interface with a daily motivation card that makes tasks more fun.']
      ],
      tech: [
        'HTML5',
        'CSS3',
        'JavaScript',
        'Google Gemini API',
        'Cloudflare Workers',
        'Workers AI (FLUX.1)',
        'Cloudflare KV',
        'Web Speech API'
      ]
    },

    'Resume Analyzer': {
      kicker: '// WEB APP',
      badge: 'LIVE DEPLOYMENT',
      title: 'Resume Analyzer',
      intro: 'A web-based resume review system engineered by Danmark Rosalejos with Node.js and Tailwind CSS. Features PDF and DOCX upload, AI and ATS readiness scores, rule-based checks, keyword matching against job postings, and section-by-section improvement suggestions.',
      points: [
        ['PDF and DOCX upload:', 'Drag and drop or choose a resume file, up to 5MB.'],
        ['Dual scoring:', 'Shows an AI score and an ATS score from 0 to 100, color-coded by readiness.'],
        ['Rule-based ATS checks:', 'Detects email, phone, bullet points and section headers, and flags issues.'],
        ['Keyword matching:', 'Paste a job posting to get a match percentage and a list of missing keywords.'],
        ['AI-generated feedback:', 'Lists strengths, formatting issues and top recommendations.'],
        ['Section-by-section suggestions:', 'Shows what to improve in each part of the resume.']
      ],
      tech: [
        'HTML5',
        'CSS3',
        'JavaScript',
        'Tailwind CSS',
        'Node.js',
        'REST API',
        'Render'
      ]
    },

    'Learn & Approach': {
      kicker: '// INTERACTIVE GAME',
      badge: 'LIVE DEPLOYMENT',
      title: 'Learn & Approach',
      intro: 'An interactive matching game engineered by Danmark Rosalejos for a ProfEd 1 class activity. Features four levels with three shuffled choices each, live scoring and feedback, and a results screen that connects players to the activity questions in Google Drive.',
      points: [
        ['Four levels:', 'Each level shows a reference image and tests how closely the player looks.'],
        ['Shuffled choices:', 'Three choices per round in random order, with only one correct match.'],
        ['Instant feedback:', 'Right and wrong answers are highlighted right away, with a live score.'],
        ['Progress tracker:', 'A step bar turns green or red for each answered level.'],
        ['Results and activity link:', 'Shows the final score, then links to the activity questions in Google Drive.'],
        ['Easy to edit, mobile friendly:', 'Levels and the activity link live in one config block; the layout fits phones.']
      ],
      tech: [
        'HTML5',
        'CSS3',
        'JavaScript',
        'GitHub Pages',
        'Google Drive',
        'Google Fonts'
      ]
    },

    'Digital Father\u2019s Day Letter': {
      kicker: '// INTERACTIVE LETTER',
      badge: 'LIVE DEPLOYMENT',
      title: 'Digital Father\u2019s Day Letter',
      intro: 'An interactive digital letter engineered by Danmark Rosalejos. Features a tap-to-open envelope, a scripture-rooted tribute to the two church pastors, personalized letters, a scroll-triggered reveal, and a closing message of gratitude from the congregation.',
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
    elBadge.classList.toggle('is-private', !!isPrivate);
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

    elVisit.classList.remove('is-disabled');
    elVisit.removeAttribute('aria-disabled');
    if (isPrivate) {
      /* private systems: the button sends the visitor to the contact page */
      elVisit.setAttribute('href', 'contact.html');
      elVisit.removeAttribute('target');
      elVisit.innerHTML = 'Inquire About ' + d.title + ' ' + ARROW_ICON;
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
