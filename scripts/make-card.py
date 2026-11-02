#!/usr/bin/env python3
"""Render img/miles-card.png (1200x630 share card) from data/cybercab-stats.json.
Black, white and gold. No Tesla logos. Called by add-stat.py (skip with --no-card).
Needs Pillow; Inter font if installed, else DejaVu."""
import json, os, datetime, glob
from PIL import Image, ImageDraw, ImageFont
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d=json.load(open(os.path.join(root,"data","cybercab-stats.json")))
U=d["tracker"]["unsupervised"]; ts=datetime.datetime.fromisoformat(U["ts"]); now=datetime.datetime.now().astimezone()
miles=U["miles"]+U.get("rate_s",0)*max(0,(now-ts).total_seconds()); wk=U.get("rate_s",0)*7*86400; g=U.get("wow",.17)
def font(sz,w=300):
    for pat in ["/usr/share/fonts/**/Inter-VariableFont*.ttf","/usr/share/fonts/**/Inter*.ttf"]:
        for f in glob.glob(pat,recursive=True):
            try:
                ft=ImageFont.truetype(f,sz)
                try: ft.set_variation_by_axes([14,w]) if "opsz" in f else ft.set_variation_by_axes([w])
                except Exception: pass
                return ft
            except Exception: pass
    return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",sz)
W,H=1200,630; GOLD=(212,175,106); GOLD2=(241,217,160); GREY=(154,154,154)
im=Image.new("RGB",(W,H),(0,0,0)); dr=ImageDraw.Draw(im)
# subtle gold glow bottom-right
glow=Image.new("L",(W,H),0); gd=ImageDraw.Draw(glow)
for r in range(420,0,-6): gd.ellipse([W-260-r,H-40-r,W-260+r,H-40+r],fill=int(38*(1-r/420)))
im.paste(Image.new("RGB",(W,H),GOLD),(0,0),glow)
dr=ImageDraw.Draw(im)
logo=os.path.join(root,"img","logo-mark-wide.png")
if os.path.exists(logo):
    lg=Image.open(logo).convert("RGBA"); lg.thumbnail((150,60)); im.paste(lg,(64,58),lg)
dr.text((64 if not os.path.exists(logo) else 230,74),"CYBERCAB FLEET OWNERS",font=font(20,500),fill=(255,255,255))
dr.text((64,150),"ROBOTAXI MILES TRACKER",font=font(22,400),fill=GOLD)
dr.text((60,180),f"{round(miles):,}",font=font(118,200),fill=GOLD2)
dr.text((64,330),f"driverless miles  ·  ~{round(wk/1000):,}K per week",font=font(30,300),fill=(255,255,255))
# mini chart: last 30 days history + forecast to 31 Dec
hist=[(datetime.datetime.fromisoformat(p["date"]).replace(tzinfo=now.tzinfo),p["miles"]) for p in d["tracker"]["unsup_history"]]
hist=[h for h in hist if h[0]<now]+[(now,miles)]
x0=now-datetime.timedelta(days=30); end=datetime.datetime(now.year,12,31,tzinfo=now.tzinfo)
fc=lambda t:miles+wk*((1+g)**((t-now).total_seconds()/604800)-1)/g
ymax=fc(end)*1.08; cx0,cx1,cy0,cy1=64,1136,410,545
X=lambda t:cx0+(t-x0).total_seconds()/(end-x0).total_seconds()*(cx1-cx0); Y=lambda v:cy1-v/ymax*(cy1-cy0)
def vat(t):
    for a,b in zip(hist,hist[1:]):
        if b[0]>=t: return a[1]+(b[1]-a[1])*(t-a[0]).total_seconds()/max(1,(b[0]-a[0]).total_seconds())
    return miles
pts=[(X(x0),Y(vat(x0)))]+[(X(t),Y(v)) for t,v in hist if t>x0]
dr.polygon(pts+[(pts[-1][0],cy1),(pts[0][0],cy1)],fill=(58,48,29)); dr.line(pts,fill=GOLD2,width=4)
F=[now+datetime.timedelta(days=i/2) for i in range(int((end-now).days*2)+1)]
fp=[(X(t),Y(fc(t))) for t in F]
for i in range(0,len(fp)-1,2): dr.line([fp[i],fp[i+1]],fill=GOLD,width=3)
dr.ellipse([pts[-1][0]-7,pts[-1][1]-7,pts[-1][0]+7,pts[-1][1]+7],fill=GOLD2)
fe=fc(end); dr.text((cx1,Y(fe)-34),f"~{fe/1e6:.1f}M by 31 Dec*",font=font(22,400),fill=GOLD2,anchor="ra")
dr.line([(cx0,cy1),(cx1,cy1)],fill=(40,40,40),width=1)
C=[c for c in d.get("cybercabs",[]) if c.get("total_robotaxis")]
foot=""
if C:
    c=C[-1]; my=c.get("model_y",c["total_robotaxis"]-c["count"]); foot=f"Texas fleet: {c['count']:,} Cybercab · {my:,} Model Y"
dr.text((64,568),foot,font=font(22,300),fill=(255,255,255))
dr.text((W-64,568),"cybercabfleetowners.com/#miles",font=font(22,400),fill=GOLD,anchor="ra")
dr.text((64,600),f"Source: Tesla Robotaxi safety report counter, Texas DMV registrations via public trackers. *Illustration at {round(g*100)}%/week, not a prediction. Not affiliated with Tesla. {now:%d %b %Y}",font=font(13,300),fill=GREY)
out=os.path.join(root,"img","miles-card.png"); im.save(out,optimize=True); print("card",out)
