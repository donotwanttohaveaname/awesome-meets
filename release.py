#!/usr/bin/env python3
"""Give the site a new version number, everywhere at once.

    python3 release.py 2.3

It changes three things in one go:
  1. the version in assets/js/config.js
  2. the hidden version tag in every page (<meta name="am-version">). Anna asked for no visible
     version on this site (30 Sep 2026): the footer only says "© 2026 Awesome Meets".
  3. the ?v=... on every stylesheet and script link

Number 3 is the reason this file exists. Browsers keep stylesheets and scripts for ten minutes.
Without a new ?v= a visitor can get the new page with the OLD stylesheet, and the page looks
broken (that happened on 30 Sep 2026, right after the step cards were added). A new ?v= makes
the browser fetch the new files together with the new page.

Run it before every commit that changes the site, then commit and push.
"""
import datetime
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
PAGES = ['index.html', 'join/index.html', 'about/index.html', 'data/index.html', 'feedback/index.html', '404.html']


def main():
    if len(sys.argv) != 2 or not re.fullmatch(r'\d+\.\d+', sys.argv[1]):
        sys.exit('Usage: python3 release.py 2.3')
    number = sys.argv[1]
    today = datetime.date.today()
    stamp = 'v%s · %d %s %d' % (number, today.day, today.strftime('%b'), today.year)

    config = ROOT / 'assets/js/config.js'
    text = config.read_text()
    text, n = re.subn(r"version: 'v[^']*'", "version: '%s'" % stamp, text)
    if n != 1:
        sys.exit('Could not find the version line in assets/js/config.js')
    config.write_text(text)

    for page in PAGES:
        path = ROOT / page
        text = path.read_text()
        text, lines = re.subn(r'<meta name="am-version" content="[0-9.]+">', '<meta name="am-version" content="%s">' % number, text)
        text, links = re.subn(r'(assets/(?:css|js)/[a-z]+\.(?:css|js))(?:\?v=[0-9.]+)?"', r'\1?v=%s"' % number, text)
        if lines != 1 or links < 3:
            sys.exit('%s: expected one version tag and at least three asset links, found %d and %d' % (page, lines, links))
        path.write_text(text)
        print('%-18s %d asset links' % (page, links))
    print('Now at ' + stamp)


if __name__ == '__main__':
    main()
