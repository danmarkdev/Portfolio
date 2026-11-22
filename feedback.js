(function () {
  var SUPABASE_URL = 'https://clwfpsfitruokqrxfoyt.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_ve9e-w9WgQKLfrvC-1DVRQ_VpCcKP0E';
  var TABLE = 'feedback';
  var LIMIT = 12;
  var LIKED_KEY = 'fb_liked';
  var POST_KEY = 'fb_last_post';
  var COOLDOWN = 60000;

  var grid = document.getElementById('fbGrid');
  var empty = document.getElementById('fbEmpty');
  var openBtn = document.getElementById('fbOpen');
  var modal = document.getElementById('fbModal');
  var closeBtn = document.getElementById('fbClose');
  var form = document.getElementById('fbForm');
  var nameEl = document.getElementById('fbName');
  var affEl = document.getElementById('fbAff');
  var msgEl = document.getElementById('fbMsg');
  var honeyEl = document.getElementById('fbWebsite');
  var rateEl = document.getElementById('fbRate');
  var statusEl = document.getElementById('fbStatus');
  var submitBtn = document.getElementById('fbSubmit');
  if (!grid || !modal || !form) return;

  var configured = /^https?:\/\//.test(SUPABASE_URL) && SUPABASE_KEY.indexOf('YOUR_') !== 0;
  var rating = 5;
  var openedAt = 0;
  var liked = [];
  try { liked = JSON.parse(localStorage.getItem(LIKED_KEY) || '[]'); } catch (e) { liked = []; }
  if (!Array.isArray(liked)) liked = [];

  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>';
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

  function api(path, opts) {
    opts = opts || {};
    var headers = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };
    if (SUPABASE_KEY.indexOf('eyJ') === 0) headers.Authorization = 'Bearer ' + SUPABASE_KEY;
    if (opts.prefer) headers.Prefer = opts.prefer;
    return fetch(SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      if (!res.ok) throw new Error('http ' + res.status);
      return res.json();
    });
  }

  function mk(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function fmtDate(v) {
    var d = new Date(v);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function saveLiked() {
    try { localStorage.setItem(LIKED_KEY, JSON.stringify(liked)); } catch (e) {}
  }

  function buildCard(item) {
    var card = mk('article', 'fb-card');
    card.setAttribute('data-pinned', item.pinned ? '1' : '0');
    var name = String(item.name || 'Anonymous');
    var role = item.affiliation ? String(item.affiliation) : 'Visitor';
    var stars = Math.max(1, Math.min(5, parseInt(item.rating, 10) || 5));

    var top = mk('div', 'fb-card-top');
    top.appendChild(mk('div', 'fb-avatar', name.charAt(0).toUpperCase()));

    var who = mk('div', 'fb-who');
    who.appendChild(mk('div', 'fb-name', name));
    who.appendChild(mk('div', 'fb-role', role));
    top.appendChild(who);

    var starWrap = mk('div', 'fb-stars');
    starWrap.setAttribute('aria-label', 'Rated ' + stars + ' out of 5');
    for (var i = 1; i <= 5; i++) {
      var holder = document.createElement('span');
      holder.innerHTML = STAR;
      var svg = holder.firstChild;
      if (i > stars) svg.setAttribute('class', 'off');
      starWrap.appendChild(svg);
    }
    top.appendChild(starWrap);
    card.appendChild(top);

    card.appendChild(mk('p', 'fb-text', '\u201C' + String(item.message || '') + '\u201D'));

    var foot = mk('div', 'fb-foot');
    foot.appendChild(mk('span', 'fb-date', fmtDate(item.created_at)));

    var likeBtn = mk('button', 'fb-like');
    likeBtn.type = 'button';
    likeBtn.setAttribute('aria-label', 'Like this feedback');
    likeBtn.innerHTML = HEART;
    var count = mk('span', 'fb-like-count', String(item.likes || 0));
    likeBtn.appendChild(count);
    if (liked.indexOf(item.id) !== -1) likeBtn.classList.add('liked');

    likeBtn.addEventListener('click', function () {
      if (likeBtn.disabled || !configured) return;
      var isLiked = liked.indexOf(item.id) !== -1;
      likeBtn.disabled = true;
      api('rpc/' + (isLiked ? 'unlike_feedback' : 'like_feedback'), { method: 'POST', body: { fid: item.id } })
        .then(function (n) {
          var next = typeof n === 'number' ? n : Math.max(0, (item.likes || 0) + (isLiked ? -1 : 1));
          item.likes = next;
          count.textContent = String(next);
          if (isLiked) {
            liked = liked.filter(function (x) { return x !== item.id; });
            likeBtn.classList.remove('liked');
          } else {
            liked.push(item.id);
            likeBtn.classList.add('liked');
          }
          saveLiked();
        })
        .catch(function () {})
        .then(function () { likeBtn.disabled = false; });
    });

    foot.appendChild(likeBtn);
    card.appendChild(foot);
    return card;
  }

  function showEmpty(text) {
    empty.textContent = text;
    empty.hidden = false;
  }

  function loadFeedback() {
    if (!configured) {
      showEmpty('Feedback is not available yet.');
      return;
    }
    showEmpty('Loading feedback\u2026');
    api(TABLE + '?select=*&order=pinned.desc,created_at.desc&limit=' + LIMIT)
      .then(function (rows) {
        grid.innerHTML = '';
        if (!rows || !rows.length) {
          showEmpty('No feedback yet. Be the first to leave one!');
          return;
        }
        empty.hidden = true;
        rows.forEach(function (row) { grid.appendChild(buildCard(row)); });
      })
      .catch(function () {
        showEmpty('Could not load feedback right now.');
      });
  }

  function paintRate(n) {
    Array.prototype.forEach.call(rateEl.children, function (b, i) {
      b.classList.toggle('on', i < n);
      b.setAttribute('aria-checked', (i + 1) === rating ? 'true' : 'false');
    });
  }

  (function buildRate() {
    rateEl.setAttribute('role', 'radiogroup');
    rateEl.setAttribute('aria-label', 'Rating');
    for (var i = 1; i <= 5; i++) {
      (function (n) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-label', n + ' star' + (n > 1 ? 's' : ''));
        b.innerHTML = STAR;
        b.addEventListener('mouseenter', function () { paintRate(n); });
        b.addEventListener('focus', function () { paintRate(n); });
        b.addEventListener('click', function () { rating = n; paintRate(rating); });
        rateEl.appendChild(b);
      })(i);
    }
    rateEl.addEventListener('mouseleave', function () { paintRate(rating); });
    rateEl.addEventListener('focusout', function () { paintRate(rating); });
    paintRate(rating);
  })();

  function setStatus(text, kind) {
    statusEl.textContent = text || '';
    statusEl.className = 'fb-status' + (kind ? ' ' + kind : '');
  }

  var lockY = 0;

  function currentY() {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }

  function keepScroll() {
    if (Math.abs(currentY() - lockY) > 1) {
      window.scrollTo({ top: lockY, left: 0, behavior: 'instant' });
    }
  }

  function openModal() {
    setStatus('');
    openedAt = Date.now();
    lockY = currentY();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(function () {
      try { nameEl.focus({ preventScroll: true }); } catch (err) { nameEl.focus(); }
      keepScroll();
    }, 60);
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  window.addEventListener('scroll', function () {
    if (modal.classList.contains('open')) keepScroll();
  }, { passive: true });

  function blockOutside(e) {
    if (!modal.classList.contains('open')) return;
    if (e.target && e.target.closest && e.target.closest('.fb-dialog')) return;
    e.preventDefault();
  }
  modal.addEventListener('wheel', blockOutside, { passive: false });
  modal.addEventListener('touchmove', blockOutside, { passive: false });

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!configured) { setStatus('Feedback is not available yet.', 'err'); return; }

    var name = nameEl.value.trim();
    var aff = affEl.value.trim();
    var msg = msgEl.value.trim();

    if (honeyEl && honeyEl.value) return;
    if (!name || !msg) { setStatus('Please fill in your name and message.', 'err'); return; }
    if (Date.now() - openedAt < 2500) { setStatus('Please take a moment to write your message.', 'err'); return; }

    var last = 0;
    try { last = parseInt(localStorage.getItem(POST_KEY) || '0', 10) || 0; } catch (err) { last = 0; }
    if (Date.now() - last < COOLDOWN) { setStatus('Please wait a minute before posting again.', 'err'); return; }

    submitBtn.disabled = true;
    setStatus('Posting\u2026');

    api(TABLE + '?select=*', {
      method: 'POST',
      prefer: 'return=representation',
      body: { name: name.slice(0, 40), affiliation: aff ? aff.slice(0, 40) : null, rating: rating, message: msg.slice(0, 500) }
    })
      .then(function (rows) {
        var row = rows && rows[0];
        try { localStorage.setItem(POST_KEY, String(Date.now())); } catch (err) {}
        if (row) {
          empty.hidden = true;
          var firstUnpinned = null;
          for (var i = 0; i < grid.children.length; i++) {
            if (grid.children[i].getAttribute('data-pinned') !== '1') { firstUnpinned = grid.children[i]; break; }
          }
          grid.insertBefore(buildCard(row), firstUnpinned);
          while (grid.children.length > LIMIT) grid.removeChild(grid.lastChild);
        }
        form.reset();
        rating = 5;
        paintRate(rating);
        setStatus('Thank you for your feedback!', 'ok');
        setTimeout(closeModal, 900);
      })
      .catch(function () {
        setStatus('Could not post right now. Please try again.', 'err');
      })
      .then(function () { submitBtn.disabled = false; });
  });

  loadFeedback();
})();
