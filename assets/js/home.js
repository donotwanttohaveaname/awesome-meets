/* Awesome Meets homepage, v2: the question arrives word by word, and the rest fades in as it
   arrives (the paragraphs of the second view one after another). Nothing here collects anything:
   the two waitlist forms are handled in site.js. */
(function () {
  'use strict';
  window.AMHome = true;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }

  // ---- the question: one word at a time (the words are split here so the HTML stays a plain sentence)
  var n = 0;
  $$('.ask-hero h1, .ask-hero h1 .grad').forEach(function (host) {
    [].slice.call(host.childNodes).forEach(function (node) {
      if (node.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span');
        w.className = 'w';
        w.textContent = part;
        frag.appendChild(w);
      });
      host.replaceChild(frag, node);
    });
  });
  $$('.ask-hero .w').forEach(function (w) { w.style.setProperty('--n', n++); });

  // ---- safety net: the entrance must never leave the page empty. After 3.5 s everything in the hero is simply
  // visible (the animations are over by then anyway). If the page is opened somewhere animations and scrolling do
  // not happen (a link preview, a tab opened in the background), show everything at once.
  var hidden = document.visibilityState === 'hidden';
  function settle() { document.documentElement.classList.add('settled'); }
  if (hidden || reduce) settle(); else setTimeout(settle, 3500);

  // ---- scrolling: the progress line, the header hairline, and the question easing back as you leave it
  var fill = document.getElementById('scrollFill'), hero = document.querySelector('.ask-hero'), title = hero && hero.querySelector('h1');
  var ticking = false;
  function paint() {
    ticking = false;
    var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    if (fill) fill.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, Math.max(0, y / max)) : 0) + ')';
    document.body.classList.toggle('is-scrolled', y > 8);
    if (title && !reduce) {
      var p = Math.min(1, Math.max(0, y / (hero.offsetHeight * 0.85)));
      title.style.setProperty('--hero-scale', (1 - p * 0.1).toFixed(3));
      title.style.setProperty('--hero-fade', (1 - p * 0.85).toFixed(3));
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
  window.addEventListener('resize', paint);
  paint();

  // ---- everything else fades in as it arrives (the paragraphs of the second view one after another)
  var reveals = $$('.reveal');
  if (reduce || hidden || !('IntersectionObserver' in window)) {
    reveals.forEach(function (r) { r.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    reveals.forEach(function (r) { io.observe(r); });
  }

  // ---- "Join the waitlist for November" links land with the cursor in the email box
  $$('a[href="#waitlist"]').forEach(function (a) {
    a.addEventListener('click', function () {
      var input = document.querySelector('#waitlist input[type="email"]');
      if (input) setTimeout(function () { try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); } }, reduce ? 50 : 700);
    });
  });
})();
