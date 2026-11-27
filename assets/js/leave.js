/* Awesome Meets: the "take me off the list" page (leave/index.html).

   People land here from the button in the confirmation email ("You're in!"):
       /leave/?l=<personal link code>
   The code is a signature the backend made from the round and the address. It holds no name and no email address.
   Opening the page saves NOTHING: a mail scanner that follows links must not be able to take anyone off.
   The two buttons send { leave: { token, step } } to the same Apps Script web app as the forms (AM.endpoint in config.js):
       step 'round'  out of this round, still in for the next ones
       step 'all'    out of this round and all future ones
       step 'undo'   back to how it was
   The backend changes the Status and "Keep me in" cells of that person's row (no row is deleted) and lists the click in
   the tab "Left by link". After the round's cut-off it changes nothing and answers 'closed'.

   Like the unsubscribe page, nothing here waits for Google: the answer shows at once and is saved in the background,
   with up to three tries. Only if saving fails does the page say so and offer "Try again".

   A PREVIEW email (sent to Anna only) links to /leave/?l=preview: the same page, and its buttons save nothing.

   Check the look without sending anything, on this computer only:
       http://localhost:<port>/leave/?preview=ask   (also: slow, bad, closed, offline) */
(function () {
  var AM = window.AM || {};
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var token = params.get('l') || '';

  var isLocal = ['localhost', '127.0.0.1', '[::1]'].indexOf(location.hostname) > -1;
  var preview = isLocal ? params.get('preview') : '';
  if (token === 'preview') preview = 'demo';   // the link in a preview email: show everything, save nothing

  var states = ['lvAsk', 'lvDone', 'lvClosed', 'lvError'];
  function show(id) {
    states.forEach(function (s) { $(s).hidden = s !== id; });
    window.scrollTo(0, 0);
  }

  // ---- talking to the backend
  function call(payload) {
    if (preview) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          if (preview === 'offline') return reject(new Error('offline'));
          if (preview === 'bad') return resolve({ ok: false, error: 'bad_link' });
          if (preview === 'closed') return resolve({ ok: false, error: 'closed', round: 'January' });
          resolve({ ok: true, round: preview === 'demo' ? '' : 'January' });
        }, preview === 'slow' ? 6000 : 1200);
      });
    }
    // Saving the same answer twice is harmless (the backend notices), so try up to three times.
    // keepalive: the request finishes even if the person closes the page right away.
    function attempt(n) {
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, 20000);
      return fetch(AM.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ leave: payload }), signal: ctrl.signal, keepalive: true })
        .then(function (r) { return r.json(); })
        .finally(function () { clearTimeout(timer); })
        .catch(function (err) {
          if (n >= 3) throw err;
          return new Promise(function (resolve) { setTimeout(resolve, 1500 * n); }).then(function () { return attempt(n + 1); });
        });
    }
    return attempt(1);
  }

  var demo = preview === 'demo' ? ' (This is the preview: nothing was saved.)' : '';
  function round(res) { return res && res.round ? 'the ' + res.round + ' round' : 'this round'; }
  var TEXT = {
    round: { title: 'Done', saved: function (res) { return 'You\'re off ' + round(res) + ', and I\'ll count you in for the next one with the same answers.' + demo; } },
    all: { title: 'Done', saved: function (res) { return 'You\'re off ' + round(res) + ' and I won\'t include you in future ones. You\'re welcome back any time: just sign up again.' + demo; } },
    undo: { title: 'Undone', saved: function (res) { return 'You\'re back on the list for ' + round(res) + ', as before.'; } }
  };
  var last = 'round';
  function save(step) {
    last = step;
    var lead = $('lvDoneLead'), retry = $('lvRetry'), undo = $('lvUndo');
    retry.hidden = true; undo.hidden = true;
    $('lvDoneTitle').textContent = TEXT[step].title;
    lead.textContent = 'Saving…';
    show('lvDone');
    call({ token: token, step: step }).then(function (res) {
      if (res && res.error === 'bad_link') { show('lvError'); return; }
      if (res && res.error === 'closed') {
        if (res.round) $('lvClosedLead').textContent = 'Sign-ups for ' + res.round + ' have closed and matching is under way. Reply to my email and I\'ll sort it out by\u00a0hand.';
        show('lvClosed');
        return;
      }
      if (!res || !res.ok) throw new Error((res && res.error) || 'server');
      lead.textContent = TEXT[step].saved(res);
      undo.hidden = step === 'undo';
    }).catch(function () {
      lead.textContent = 'That didn\'t save. Please try again, or reply to my email instead.';
      retry.hidden = false;
    });
  }
  $('lvRound').addEventListener('click', function () { save('round'); });
  $('lvAll').addEventListener('click', function () { save('all'); });
  $('lvUndo').addEventListener('click', function () { save('undo'); });
  $('lvRetry').addEventListener('click', function () { save(last); });

  if (!preview && (!/^l[A-Za-z0-9_-]{22}$/.test(token) || !AM.endpoint)) show('lvError');
  else show('lvAsk');
})();
