#!/usr/bin/env python3
"""Update data/cybercab-stats.json and push.
Usage:
  scripts/add-stat.py DATE [COUNT] [--total N] [--miles N] [--fare X --fare-source-text T --fare-source-url U] [--members N]
      [--fsd-miles N --fsd-city N] [--fsd-rate MI_S --fsd-city-rate MI_S] [--robotaxi-miles N] [--robotaxi-rate MI_S] [--robotaxi-wow X]
      [--week-sup N --week-city N --week-unsup N] [--texas-miles N] [--texas-mpd X] [--no-push]
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
An entry with the same date is replaced. Commits and pushes unless --no-push."""
import argparse, json, os, subprocess, datetime
p=argparse.ArgumentParser(); p.add_argument("date"); p.add_argument("count",type=int,nargs="?")
p.add_argument("--total",type=int); p.add_argument("--miles",type=int); p.add_argument("--fare",type=float); p.add_argument("--members",type=int)
for k in ["fsd-miles","fsd-city","robotaxi-miles","week-sup","week-city","week-unsup"]: p.add_argument("--"+k,type=int)
for k in ["fsd-rate","fsd-city-rate","robotaxi-rate","robotaxi-wow"]: p.add_argument("--"+k,type=float)
p.add_argument("--texas-miles",type=int); p.add_argument("--texas-mpd",type=float)
p.add_argument("--fare-source-text"); p.add_argument("--fare-source-url"); p.add_argument("--no-push",action="store_true")
a=p.parse_args(); datetime.date.fromisoformat(a.date)
if a.count is None and a.miles is None and a.fare is None and a.total is None and a.members is None and all(getattr(a,k) is None for k in ["fsd_miles","fsd_city","robotaxi_miles","week_sup","week_city","week_unsup","texas_miles","texas_mpd","fsd_rate","fsd_city_rate","robotaxi_rate","robotaxi_wow"]): p.error("nothing to update")
if a.fare is not None and not a.fare_source_url: p.error("--fare needs --fare-source-url")
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); f=os.path.join(root,"data","cybercab-stats.json")
d=json.load(open(f)); msg=[]
if a.count is not None or a.total is not None:
    old=next((x for x in d["cybercabs"] if x["date"]==a.date),{})
    e={"date":a.date,"count":a.count if a.count is not None else old.get("count")}
    if e["count"] is None: p.error("--total for a new date needs COUNT")
    t=a.total if a.total is not None else old.get("total_robotaxis")
    if t is not None: e["total_robotaxis"]=t
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
d["updated"]=max(d["updated"],a.date)
open(f,"w").write(json.dumps(d,separators=(",",":"))+"\n"); print("saved",a.date,", ".join(msg))
if not a.no_push:
    g=lambda *c: subprocess.run(["git","-C",root,*c],check=True)
    g("add","data/cybercab-stats.json")
    if subprocess.run(["git","-C",root,"diff","--cached","--quiet"]).returncode==0: print("no change"); raise SystemExit
    g("-c","user.name=minderopflorian-oss","-c","user.email=minderopflorian@gmail.com","commit","-qm",f"Stats {a.date}: "+", ".join(msg))
    g("-c","credential.helper=","-c","credential.helper=!/usr/local/bin/gh auth git-credential","push","-q"); print("pushed")
