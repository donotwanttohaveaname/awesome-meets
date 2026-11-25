/* Awesome Meets: the "stop emails about new rounds" page (unsubscribe/index.html).

   People land here from the small link at the bottom of an invitation email:
       /unsubscribe/?u=<personal link code>
   The code is a signature the backend made from the address. It holds no name and no email address.
   Opening the page saves NOTHING: a mail scanner that follows links must not be able to unsubscribe anyone.
   Pressing "Yes, don't email me again" sends { optOut: { token, step: 'stop' } } to the same Apps Script web app
   as the forms (AM.endpoint in config.js); the backend writes the address into the tab "Unsubscribed" and every
   invitation email leaves those addresses out from then on. "Undo" sends step 'undo'.

   Like the feedback page, nothing here waits for Google: the answer shows at once and is saved in the background,
   with up to three tries. Only if saving fails does the page say so and offer "Try again".

   A PREVIEW email (sent to Anna only) links to /unsubscribe/?u=preview: the same page, and its buttons save nothing.

   Check the look without sending anything, on this computer only:
       http://localhost:<port>/unsubscribe/?preview=ask   (also: slow, bad, offline) */
(function () {
  var AM = window.AM || {};
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var token = params.get('u') || '';

  var isLocal = ['localhost', '127.0.0.1', '[::1]'].indexOf(location.hostname) > -1;
  var preview = isLocal ? params.get('preview') : '';
  if (token === 'preview') preview = 'demo';   // the link in a preview email: show everything, save nothing

  var states = ['unAsk', 'unDone', 'unError'];
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
          resolve({ ok: true });
        }, preview === 'slow' ? 6000 : 1200);
      });
    }
    // Saving the same answer twice is harmless (one row per address), so try up to three times.
    // keepalive: the request finishes even if the person closes the page right away.
    function attempt(n) {
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, 20000);
      return fetch(AM.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ optOut: payload }), signal: ctrl.signal, keepalive: true })
        .then(function (r) { return r.json(); })
        .finally(function () { clearTimeout(timer); })
        .catch(function (err) {
          if (n >= 3) throw err;
          return new Promise(function (resolve) { setTimeout(resolve, 1500 * n); }).then(function () { return attempt(n + 1); });
        });
    }
    return attempt(1);
  }

  var TEXT = {
    stop: { title: 'Done', saving: 'Saving…', saved: 'You won\'t hear from me about new rounds again.' + (preview === 'demo' ? ' (This is the preview: nothing was saved.)' : '') },
    undo: { title: 'Undone', saving: 'Saving…', saved: 'I\'ll keep you posted when a new round opens.' }
  };
  var last = 'stop';
  function save(step) {
    last = step;
    var lead = $('unDoneLead'), retry = $('unRetry'), undo = $('unUndo');
    retry.hidden = true; undo.hidden = true;
    $('unDoneTitle').textContent = TEXT[step].title;
    lead.textContent = TEXT[step].saving;
    show('unDone');
    call({ token: token, step: step }).then(function (res) {
      if (res && res.error === 'bad_link') { show('unError'); return; }
      if (!res || !res.ok) throw new Error((res && res.error) || 'server');
      lead.textContent = TEXT[step].saved;
      undo.hidden = step !== 'stop';
    }).catch(function () {
      lead.textContent = 'That didn\'t save. Please try again, or reply to my email instead.';
      retry.hidden = false;
    });
  }
  $('unStop').addEventListener('click', function () { save('stop'); });
  $('unUndo').addEventListener('click', function () { save('undo'); });
  $('unRetry').addEventListener('click', function () { save(last); });

  if (!preview && (!/^u[A-Za-z0-9_-]{22}$/.test(token) || !AM.endpoint)) show('unError');
  else show('unAsk');
})();
