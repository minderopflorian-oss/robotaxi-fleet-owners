#!/usr/bin/env python3
"""Update data/cybercab-stats.json and push.
Usage:
  scripts/add-stat.py DATE [COUNT] [--total N] [--miles N] [--fare X --fare-source-text T --fare-source-url U] [--members N]
      [--fsd-miles N --fsd-city N] [--fsd-rate MI_S --fsd-city-rate MI_S] [--robotaxi-miles N] [--robotaxi-rate MI_S] [--robotaxi-wow X]
      [--week-sup N --week-city N --week-unsup N] [--texas-miles N] [--texas-mpd X] [--no-push]
      [--model-y N] [--event TEXT [--event-url U] [--event-kind K]] [--robotaxi-wow-band LO,HI] [--city "Austin, TX=2118015" ...] [--no-card]
  DATE   YYYY-MM-DD
  COUNT  registered Cybercabs in Texas (optional, e.g. for a miles-only update)
  --total   total robotaxis in the fleet on DATE (stored on the cybercabs entry)
  --miles   cumulative Robotaxi miles from https://www.tesla.com/robotaxi on DATE
  --members X Community member count on DATE
  --fare    fare per mile in USD (needs a public source), with --fare-source-text/--fare-source-url
  --fsd-miles/--fsd-city  FSD (Supervised) total + city counters from tesla.com/fsd/safety (stamped now)
  --robotaxi-miles  unsupervised counter from tesla.com/robotaxi/safety (stamped now, also added to history)
  --*-rate   counter pace in miles per second; --robotaxi-wow weekly growth for forecast (0.17)
  --week-*   weekly miles for the rate table, row = DATE
  --texas-miles  cumulative driverless miles in Texas cities (Austin, Dallas, Houston) on DATE
  --texas-mpd    driverless miles per Texas Robotaxi per day, week ending DATE
  --model-y   registered Model Y Robotaxis in Texas on DATE (stored on the cybercabs entry; if left out the
              site uses total_robotaxis - COUNT)
  --event     dated milestone shown on the miles chart + ticker (same DATE+TEXT is replaced); --event-url source link,
              --event-kind one of city|fleet|tesla|report (optional)
  --robotaxi-wow-band LO,HI  forecast band for the miles chart, e.g. 0.10,0.24 (default 10%-24%)
  --city      "City, ST=MILES" driverless miles per city from Tesla's Robotaxi safety report, repeat per city;
              replaces city_share.unsupervised, as_of = DATE (pct recomputed)
  --no-card   do not regenerate img/miles-card.png (share card, needs Pillow; skipped silently if missing)
An entry with the same date is replaced. Commits and pushes unless --no-push."""
import argparse, json, os, subprocess, datetime
p=argparse.ArgumentParser(); p.add_argument("date"); p.add_argument("count",type=int,nargs="?")
p.add_argument("--total",type=int); p.add_argument("--miles",type=int); p.add_argument("--fare",type=float); p.add_argument("--members",type=int)
for k in ["fsd-miles","fsd-city","robotaxi-miles","week-sup","week-city","week-unsup"]: p.add_argument("--"+k,type=int)
for k in ["fsd-rate","fsd-city-rate","robotaxi-rate","robotaxi-wow"]: p.add_argument("--"+k,type=float)
p.add_argument("--texas-miles",type=int); p.add_argument("--texas-mpd",type=float)
p.add_argument("--model-y",type=int); p.add_argument("--event"); p.add_argument("--event-url"); p.add_argument("--event-kind")
p.add_argument("--robotaxi-wow-band"); p.add_argument("--city",action="append"); p.add_argument("--no-card",action="store_true")
p.add_argument("--fare-source-text"); p.add_argument("--fare-source-url"); p.add_argument("--no-push",action="store_true")
a=p.parse_args(); datetime.date.fromisoformat(a.date)
if a.count is None and a.miles is None and a.fare is None and a.total is None and a.members is None and all(getattr(a,k) is None for k in ["model_y","event","robotaxi_wow_band","city","fsd_miles","fsd_city","robotaxi_miles","week_sup","week_city","week_unsup","texas_miles","texas_mpd","fsd_rate","fsd_city_rate","robotaxi_rate","robotaxi_wow"]): p.error("nothing to update")
if a.fare is not None and not a.fare_source_url: p.error("--fare needs --fare-source-url")
if (a.event_url or a.event_kind) and not a.event: p.error("--event-url/--event-kind need --event")
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); f=os.path.join(root,"data","cybercab-stats.json")
d=json.load(open(f)); msg=[]
if a.count is not None or a.total is not None or a.model_y is not None:
    old=next((x for x in d["cybercabs"] if x["date"]==a.date),{})
    e={"date":a.date,"count":a.count if a.count is not None else old.get("count")}
    if e["count"] is None: p.error("--total/--model-y for a new date needs COUNT")
    t=a.total if a.total is not None else old.get("total_robotaxis")
    if t is not None: e["total_robotaxis"]=t
    for k in ("model_y","batch","last7"):
        if old.get(k) is not None: e[k]=old[k]
    if a.model_y is not None: e["model_y"]=a.model_y; msg.append(f"{a.model_y} Model Y")
    d["cybercabs"]=sorted([x for x in d["cybercabs"] if x["date"]!=a.date]+[e],key=lambda x:x["date"]); msg.append(f"{e['count']} Cybercabs")
if a.miles is not None:
    d["miles"]=sorted([x for x in d.get("miles",[]) if x["date"]!=a.date]+[{"date":a.date,"miles":a.miles}],key=lambda x:x["date"]); msg.append(f"{a.miles} miles")
if a.members is not None:
    d["members"]=sorted([x for x in d.get("members",[]) if x["date"]!=a.date]+[{"date":a.date,"count":a.members}],key=lambda x:x["date"]); msg.append(f"{a.members} members")
if a.fare is not None:
    d["fare_per_mile"]=a.fare; d["fare_source"]={"text":a.fare_source_text or "","url":a.fare_source_url}; msg.append(f"fare {a.fare}/mi")
K=d.setdefault("tracker",{}); S=K.setdefault("supervised",{}); U=K.setdefault("unsupervised",{}); now=datetime.datetime.now().astimezone().isoformat(timespec="seconds")
if a.fsd_miles is not None or a.fsd_city is not None:
    if a.fsd_miles is None or a.fsd_city is None: p.error("--fsd-miles and --fsd-city go together")
    S.update(ts=now,miles=a.fsd_miles,city=a.fsd_city); K["sup_history"]=sorted([x for x in K.get("sup_history",[]) if x["date"]!=a.date]+[{"date":a.date,"miles":a.fsd_miles}],key=lambda x:x["date"]); msg.append(f"FSD {a.fsd_miles} mi")
if a.robotaxi_miles is not None:
    U.update(ts=now,miles=a.robotaxi_miles); K["unsup_history"]=sorted([x for x in K.get("unsup_history",[]) if x["date"]!=a.date]+[{"date":a.date,"miles":a.robotaxi_miles,"note":"Tesla Robotaxi safety report counter"}],key=lambda x:x["date"]); msg.append(f"unsupervised {a.robotaxi_miles} mi")
for k,o,key in [("fsd_rate",S,"rate_s"),("fsd_city_rate",S,"city_rate_s"),("robotaxi_rate",U,"rate_s"),("robotaxi_wow",U,"wow")]:
    if getattr(a,k) is not None: o[key]=getattr(a,k); msg.append(f"{k} {getattr(a,k)}")
if any(getattr(a,k) is not None for k in ["week_sup","week_city","week_unsup"]):
    W=K.setdefault("weekly",[]); r=next((x for x in W if x["date"]==a.date),None) or {"date":a.date}
    for k,key in [("week_sup","sup_wk"),("week_city","city_wk"),("week_unsup","unsup_wk")]:
        if getattr(a,k) is not None: r[key]=getattr(a,k)
    K["weekly"]=sorted([x for x in W if x["date"]!=a.date]+[r],key=lambda x:x["date"]); msg.append("weekly rates")
if a.texas_miles is not None:
    d["texas_miles"]=sorted([x for x in d.get("texas_miles",[]) if x["date"]!=a.date]+[{"date":a.date,"miles":a.texas_miles}],key=lambda x:x["date"]); msg.append(f"Texas {a.texas_miles} mi")
if a.texas_mpd is not None:
    v=int(a.texas_mpd) if a.texas_mpd==int(a.texas_mpd) else a.texas_mpd
    d["texas_mpd"]=sorted([x for x in d.get("texas_mpd",[]) if x["week_end"]!=a.date]+[{"week_end":a.date,"mpd":v}],key=lambda x:x["week_end"]); msg.append(f"Texas {v} mi/day")
if a.event:
    ev={"date":a.date,"text":a.event}
    if a.event_url: ev["url"]=a.event_url
    if a.event_kind: ev["kind"]=a.event_kind
    d["events"]=sorted([x for x in d.get("events",[]) if not (x["date"]==a.date and x["text"]==a.event)]+[ev],key=lambda x:x["date"]); msg.append("event: "+a.event)
if a.robotaxi_wow_band:
    try: lo,hi=[float(x) for x in a.robotaxi_wow_band.split(",")]
    except ValueError: p.error("--robotaxi-wow-band needs LO,HI e.g. 0.10,0.24")
    U.update(wow_lo=lo,wow_hi=hi); msg.append(f"wow band {lo}-{hi}")
if a.city:
    rows=[]
    for c in a.city:
        if "=" not in c: p.error('--city needs "City, ST=MILES"')
        n,m=c.rsplit("=",1); rows.append({"city":n.strip(),"miles":int(m.replace(",","").strip())})
    tot=sum(r["miles"] for r in rows) or 1
    for r in rows: r["pct"]=round(r["miles"]/tot*100,1)
    CS=d.setdefault("city_share",{}); CS["unsupervised"]=sorted(rows,key=lambda r:-r["miles"]); CS["as_of"]=a.date; msg.append(f"city split {len(rows)} cities")
d["updated"]=max(d["updated"],a.date)
open(f,"w").write(json.dumps(d,separators=(",",":"))+"\n"); print("saved",a.date,", ".join(msg))
card=os.path.join(root,"img","miles-card.png")
if not a.no_card:
    try: subprocess.run(["python3",os.path.join(root,"scripts","make-card.py")],check=True)
    except Exception as e: print("share card skipped:",e)
if not a.no_push:
    g=lambda *c: subprocess.run(["git","-C",root,*c],check=True)
    try: subprocess.run(["python3",os.path.join(root,"scripts","network-revenue.py")],check=True)
    except Exception as e: print("network-revenue skipped:",e)
    g("add","data/cybercab-stats.json","data/network-revenue.json")
    if os.path.exists(card): g("add","img/miles-card.png")
    if subprocess.run(["git","-C",root,"diff","--cached","--quiet"]).returncode==0: print("no change"); raise SystemExit
    g("-c","user.name=minderopflorian-oss","-c","user.email=minderopflorian@gmail.com","commit","-qm",f"Stats {a.date}: "+", ".join(msg))
    g("-c","credential.helper=","-c","credential.helper=!/usr/local/bin/gh auth git-credential","push","-q"); print("pushed")
