"""Add a content fingerprint to each local script and stylesheet link, e.g. app.js?v=3f9a1c2b7d.

Browsers may reuse a cached app.js or styles.css for up to 10 minutes on GitHub Pages, which can pair a new
index.html with an old script. A link that changes whenever the file changes rules that out.
Run before every commit:  python tools/stamp_assets.py
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ["index.html", "report.html"]
ASSETS = ["styles.css", "i18n.js", "app.js", "settings.js", "share.js", "update.js", "install.js"]


def fingerprint(name):
    return hashlib.sha256((ROOT / name).read_bytes()).hexdigest()[:10]


def main():
    stamps = {name: fingerprint(name) for name in ASSETS}
    for page in PAGES:
        path = ROOT / page
        text = path.read_text(encoding="utf-8")
        for name, stamp in stamps.items():
            text = re.sub(r'((?:src|href)=")' + re.escape(name) + r'(?:\?v=[0-9a-f]+)?(")', rf"\g<1>{name}?v={stamp}\g<2>", text)
        path.write_text(text, encoding="utf-8", newline="\n")
        print(page, "stamped")


if __name__ == "__main__":
    main()
