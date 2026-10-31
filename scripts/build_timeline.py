import json,html
d=json.load(open('data/timeline.json'));L={'done':'Done','announced':'Announced by Tesla','expected':'Expected','estimate':'Our estimate'}
rows=''
for m in d['milestones']:
    s=f'<a href="{m["src"]}" target="_blank" rel="noopener">Source</a>' if m['src'] else ''
    cta='<a class="btn" href="https://x.com/i/communities/1912893645050511710" target="_blank" rel="noopener">Join the community and start</a>' if m.get('plan') else ''
    rows+=f'<li class="{m["status"]}{" plan" if m.get("plan") else ""}"><div class="d">{html.escape(m["date"])}</div><div class="t">{html.escape(m["title"])}</div><div class="m"><span class="b">{L[m["status"]]}</span> {s}</div>{cta}</li>\n'
open('timeline.html','w').write(f'''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Timeline : from today to your fleet on the Robotaxi network · Cybercab Fleet Owners</title>
<meta name="description" content="Timeline from today to the first private fleet owners on the Robotaxi network , with sources . Timelines are estimates , not promises .">
<link rel="canonical" href="https://cybercabfleetowners.com/timeline.html"><meta name="theme-color" content="#000000"><meta property="og:image" content="https://cybercabfleetowners.com/og.png">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500&display=swap" rel="stylesheet">
<style>:root{{--gold:#d4af6a;--line:rgba(212,175,106,.35)}}*{{box-sizing:border-box;margin:0;padding:0}}body{{background:#000;color:#fff;font-family:Inter,system-ui,sans-serif;font-weight:300}}a{{color:var(--gold)}}
nav{{display:flex;justify-content:space-between;align-items:center;padding:14px 40px;border-bottom:1px solid var(--line);flex-wrap:wrap}}nav a{{color:#fff;text-decoration:none;margin-left:18px;font-size:14px}}nav .brand{{margin:0;letter-spacing:.12em;font-weight:500;color:var(--gold)}}
.w{{max-width:860px;margin:0 auto;padding:56px 24px}}.e{{color:var(--gold);letter-spacing:.2em;font-size:12px;text-transform:uppercase}}h1{{font-weight:200;font-size:40px;margin:12px 0 14px}}p{{color:#ccc;line-height:1.6}}
.note{{border:1px solid var(--gold);border-radius:12px;padding:14px 18px;margin:22px 0;color:#f1d9a0}}.leg span{{margin-right:14px;font-size:13px}}
ol{{list-style:none;border-left:2px solid var(--line);margin:30px 0 0 8px}}li{{position:relative;padding:0 0 30px 28px}}li::before{{content:"";position:absolute;left:-8px;top:4px;width:14px;height:14px;border-radius:50%;background:#000;border:2px solid var(--gold)}}
li.done::before{{background:var(--gold)}}li.estimate::before{{border-style:dashed;border-color:#888}}.d{{color:var(--gold);font-size:13px;letter-spacing:.1em;text-transform:uppercase}}.t{{font-size:18px;margin:4px 0 6px}}.m{{font-size:13px;color:#999}}
.b{{border:1px solid #444;border-radius:999px;padding:2px 10px;margin-right:8px}}li.done .b{{border-color:var(--gold);color:var(--gold)}}li.announced .b{{color:#fff;border-color:#fff}}li.estimate .b{{border-style:dashed}}
li.plan{{background:linear-gradient(90deg,rgba(212,175,106,.12),transparent);border-radius:12px;padding-top:14px}}li.plan::before{{width:20px;height:20px;left:-11px;background:var(--gold)}}
.btn{{display:inline-block;margin-top:12px;padding:11px 20px;border-radius:999px;background:var(--gold);color:#000;text-decoration:none;font-weight:500}}</style></head><body>
<nav><a class="brand" href="/">CYBERCAB FLEET OWNERS</a><div><a href="/">Home</a><a href="guide.html">Free guide</a><a href="fleet-map.html">Fleet map</a><a href="https://x.com/i/communities/1912893645050511710" target="_blank" rel="noopener">Community</a></div></nav>
<div class="w"><div class="e">Timeline · updated {d["updated"]}</div><h1>From today to your fleet on the network</h1>
<p>Every step from today to the moment the first private fleet owners can add their cars to the Robotaxi network . We mark what Tesla said , what regulators did and what is our own estimate , each with a source .</p>
<div class="note">Timelines are estimates , not promises . Tesla's dates have slipped before , so plan for delays .</div>
<div class="leg"><span>● Done</span><span>○ Announced by Tesla</span><span>○ Expected</span><span>◌ Our estimate</span></div>
<ol>
{rows}</ol>
<p>Why January 2027 ? Tesla says the first customer cars join around Q2 2027 . The 90-Day Fleet Plan takes about 90 days , so starting in January means you are ready when your city opens .</p>
<p><a class="btn" href="https://x.com/i/communities/1912893645050511710" target="_blank" rel="noopener">Join the Tesla Cybercab Fleet Owners community</a></p></div>
<footer style="text-align:center;padding:24px 16px;color:#999;font-size:13px;border-top:1px solid #222">© 2026 Tesla Cybercab Fleet Owners · Independent community, not affiliated with Tesla, Inc. · <a href="/" style="color:#d4af6a">cybercabfleetowners.com</a></footer></body></html>''')
