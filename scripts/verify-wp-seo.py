"""Read-only migration smoke test. Run against a seeded local release candidate (indexing enabled)."""
import json, sys
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, build_opener
from xml.etree import ElementTree as ET

base=sys.argv[1].rstrip("/")
manifest=json.loads((Path(__file__).resolve().parents[1]/"lib/aytal-content.json").read_text("utf-8"))
paths=["/","/blogs/news","/collections","/collections/all","/guide"]+["/"+k+"/"+v["slug"] for k in manifest for v in manifest[k]]

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self,*args): return None
def fetch(path):
    try: r=build_opener(NoRedirect).open(base+path,timeout=90)
    except HTTPError as e: r=e
    with r: return r.status,r.headers,r.read().decode("utf-8","replace")
class Meta(HTMLParser):
    def __init__(self):
        super().__init__(); self.titles=[];self.canon=[];self.desc=[];self.h1=0;self.intitle=False
    def handle_starttag(self,t,attrs):
        a=dict(attrs)
        if t=="title":self.intitle=True; self.titles.append("")
        if t=="link" and "canonical" in a.get("rel","").split():self.canon.append(a.get("href"))
        if t=="meta" and a.get("name")=="description":self.desc.append(a.get("content",""))
        if t=="h1":self.h1+=1
    def handle_endtag(self,t):
        if t=="title": self.intitle=False
    def handle_data(self,s):
        if self.intitle:self.titles[-1]+=s
def page(path):
    code,headers,body=fetch(path);m=Meta();m.feed(body)
    errors=[]
    if code!=200:errors.append("HTTP "+str(code))
    if m.canon!=[base+path]:errors.append("canonical "+str(m.canon))
    if len(m.titles)!=1 or not m.titles[0].strip():errors.append("title "+str(m.titles))
    if len(m.desc)!=1 or not m.desc[0].strip():errors.append("description missing or duplicated")
    if m.h1!=1:errors.append("H1 "+str(m.h1))
    if 'noindex' in headers.get('X-Robots-Tag',''):errors.append("noindex")
    print(("PASS " if not errors else "FAIL ")+path+" "+", ".join(errors),flush=True)
    return not errors
if __name__=="__main__":
    with ThreadPoolExecutor(max_workers=2) as pool: results=list(pool.map(page,paths))
    def check(ok,name):
        print(("PASS " if ok else "FAIL ")+name,flush=True);results.append(bool(ok))
    code,h,body=fetch('/sitemap.xml')
    # Playground's must-use plugin issues this same-origin redirect before themes load.
    if code==301 and h.get('Location') in ('/wp-sitemap.xml',base+'/wp-sitemap.xml'):
        code,_,body=fetch('/wp-sitemap.xml');print('INFO sitemap.xml served via core index')
    check(code==200 and base+'/aytal-store-sitemap.xml' in body and ET.fromstring(body).tag.endswith('sitemapindex'),'sitemap index')
    code,_,body=fetch('/aytal-store-sitemap.xml')
    urls={n.text for n in ET.fromstring(body).findall('./*/{*}loc')} if code==200 else set()
    check({base+p for p in paths}<=urls,'legacy sitemap coverage')
    for kind in ('agentic_discovery','products_1','pages_1','collections_1','blogs_1'):
        code,_,xml=fetch('/sitemap_'+kind+'.xml')
        check(code==200 and '<urlset' in xml and base+'/agents.md' in xml,'legacy child sitemap '+kind)
    code,h,txt=fetch('/robots.txt')
    check(code==200 and 'text/plain' in h.get('Content-Type','') and 'User-agent: *' in txt and ('Sitemap: '+base+'/sitemap.xml' in txt or 'Sitemap: https://aytalmart.com/sitemap.xml' in txt),'robots.txt')
    code,_,body=fetch('/agents.md');check(code==200 and 'AYTAL MART' in body and '<html' not in body,'agents.md')
    for path in ('/products/not-an-aytal-product','/pages/not-an-aytal-page','/collections/not-an-aytal-collection'):
        check(fetch(path)[0]==404,path+' must be 404')
    for path,dest in [('/faq/','/pages/faq'),('/aytal-privacy-policy/','/pages/privacy-policy'),('/product-category/islamic-collection/','/collections/islamic-collection')]:
        code,h,_=fetch(path);check(code==301 and h.get('Location')==base+dest,path+' one-hop redirect')
    for path in ('/cart/','/checkout/','/my-account/'):
        code,h,_=fetch(path);check('noindex' in h.get('X-Robots-Tag',''),path+' noindex')
    print(f'{sum(results)}/{len(results)} checks passed');sys.exit(0 if all(results) else 1)
