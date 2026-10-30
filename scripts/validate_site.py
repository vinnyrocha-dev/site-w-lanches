#!/usr/bin/env python3
"""Basic HTML structure, local assets and JavaScript syntax for the published site."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1] / "lanchonete"
errors = []

def fail(path, message):
    errors.append(f"{path}: {message}")

def asset(path, value):
    if not value or "${" in value:
        return  # Template expressions are checked only when their paths are literal.
    url = urlsplit(value)
    if url.scheme or url.netloc or not url.path:
        return
    target = (ROOT / unquote(url.path).lstrip("/") if url.path.startswith("/")
              else path.parent / unquote(url.path)).resolve()
    if not target.is_relative_to(ROOT.resolve()) or not target.is_file():
        fail(path, f"missing or out-of-site local file: {value}")

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.doctype = False
        self.lang = False
        self.title = False
        self.in_title = False
        self.ids = set()
        self.script = None
        self.scripts = []
        self.styles = []
        self.in_style = False

    def handle_decl(self, decl):
        if decl.lower() == "doctype html":
            self.doctype = True

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "html":
            self.lang = bool(attrs.get("lang"))
        if tag == "title":
            self.in_title = True
        if "id" in attrs:
            if attrs["id"] in self.ids:
                fail(self.path, f"duplicate static id: {attrs['id']}")
            self.ids.add(attrs["id"])
        for name in ("src", "href", "poster"):
            if name in attrs:
                asset(self.path, attrs[name])
        if tag == "script" and "src" not in attrs:
            kind = attrs.get("type", "").lower()
            if kind in ("", "text/javascript", "application/javascript", "module"):
                self.script = [kind == "module", ""]
        if tag == "style":
            self.in_style = True

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "script" and self.script is not None:
            self.scripts.append(self.script)
            self.script = None
        if tag == "style":
            self.in_style = False

    def handle_data(self, data):
        if self.in_title and data.strip():
            self.title = True
        if self.script is not None:
            self.script[1] += data
        if self.in_style:
            self.styles.append(data)

def check_js(path, code, module=False):
    result = subprocess.run(
        ["node", "--check", "--input-type=" + ("module" if module else "commonjs")],
        input=code, text=True, capture_output=True,
    )
    if result.returncode:
        fail(path, result.stderr.strip())

def validate():
    pages = sorted(ROOT.rglob("*.html"))
    if not pages or not (ROOT / "index.html").is_file():
        fail(ROOT, "published index.html not found")
    for path in pages:
        text = path.read_text(encoding="utf-8")
        page = Page(path)
        page.feed(text)
        page.close()
        for condition, message in [
            (page.doctype, "missing HTML5 doctype"),
            (page.lang, "missing html lang"),
            (page.title, "missing nonempty title"),
            (page.script is None, "unclosed script element"),
        ]:
            if not condition:
                fail(path, message)
        for module, code in page.scripts:
            check_js(path, code, module)
            # Literal image paths in product data and generated HTML.
            for value in re.findall(r"""['"](img/[^'"\s<>]+)['"]""", code):
                asset(path, value)
        for css in page.styles:
            for value in re.findall(r"url\(\s*['\"]?([^'\")\s]+)", css):
                asset(path, value)
        print(f"Checked {path.relative_to(ROOT.parent)}: HTML basics, assets, {len(page.scripts)} script(s)")
    for path in sorted(ROOT.rglob("*.js")):
        check_js(path, path.read_text(encoding="utf-8"))
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print("Site validation passed.")
    return 0

if __name__ == "__main__":
    sys.exit(validate())
