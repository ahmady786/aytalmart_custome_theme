"""Inventory public sitemap URLs, HTTP status, canonical, and internal links. No account operations."""
import subprocess, json
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit
from xml.etree import ElementTree as ET

origin = "https://aytalmart.com"
def fetch(url):
    if urlsplit(url).hostname != "aytalmart.com": raise ValueError(url)
    r = subprocess.run(["curl","-q","-sS","--max-time","25", "-w","\n%{http_code}",url], capture_output=True)
    body,_,status=r.stdout.rpartition(b"\n")
    return status.decode(),body
def locations(body):
    return [n.text for n in ET.fromstring(body).findall("./*/{*}loc")]
class Links(HTMLParser):
    def __init__(self, url):
        super().__init__(); self.url=url; self.canonical=""; self.links=set()
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=="link" and "canonical" in (a.get("rel") or "").lower().split(): self.canonical=a.get("href","")
        if tag!="a" or not a.get("href"): return
        u=urlsplit(urljoin(self.url,a["href"]))
        if u.hostname=="aytalmart.com" and not u.query and not u.path.startswith(("/cdn/","/apps/","/account/")): self.links.add(u.path or "/")
def audit(url):
    code,body=fetch(url); page=Links(url)
    if not url.endswith(".md"): page.feed(body.decode("utf-8","replace"))
    return (urlsplit(url).path or "/",code,page.canonical,sorted(page.links))
if __name__=="__main__":
    code,body=fetch(origin+"/sitemap.xml")
    if code!="200": raise SystemExit("Old sitemap unavailable: "+code)
    paths=set()
    for child in locations(body):
        status,xml=fetch(child)
        if status!="200": raise SystemExit("Incomplete inventory: "+child.split("?")[0]+" "+status)
        paths.update(locations(xml))
    with ThreadPoolExecutor(max_workers=3) as pool: rows=list(pool.map(audit,sorted(paths)))
    print(json.dumps({"sitemap":[{"path":p,"status":s,"canonical":c} for p,s,c,_ in rows],
                      "linked_paths":sorted(set().union(*(r[3] for r in rows)))},indent=2,ensure_ascii=True))
