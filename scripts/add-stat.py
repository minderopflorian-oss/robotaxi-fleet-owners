#!/usr/bin/env python3
"""Update data/cybercab-stats.json and push.
Usage:
  scripts/add-stat.py DATE [COUNT] [--total N] [--miles N] [--fare X --fare-source-text T --fare-source-url U] [--members N] [--no-push]
  DATE   YYYY-MM-DD
  COUNT  registered Cybercabs in Texas (optional, e.g. for a miles-only update)
  --total   total robotaxis in the fleet on DATE (stored on the cybercabs entry)
  --miles   cumulative Robotaxi miles from https://www.tesla.com/robotaxi on DATE
  --members X Community member count on DATE
  --fare    fare per mile in USD (needs a public source), with --fare-source-text/--fare-source-url
An entry with the same date is replaced. Commits and pushes unless --no-push."""
import argparse, json, os, subprocess, datetime
p=argparse.ArgumentParser(); p.add_argument("date"); p.add_argument("count",type=int,nargs="?")
p.add_argument("--total",type=int); p.add_argument("--miles",type=int); p.add_argument("--fare",type=float); p.add_argument("--members",type=int)
p.add_argument("--fare-source-text"); p.add_argument("--fare-source-url"); p.add_argument("--no-push",action="store_true")
a=p.parse_args(); datetime.date.fromisoformat(a.date)
if a.count is None and a.miles is None and a.fare is None and a.total is None and a.members is None: p.error("nothing to update")
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
d["updated"]=max(d["updated"],a.date)
open(f,"w").write(json.dumps(d,separators=(",",":"))+"\n"); print("saved",a.date,", ".join(msg))
if not a.no_push:
    g=lambda *c: subprocess.run(["git","-C",root,*c],check=True)
    g("add","data/cybercab-stats.json")
    if subprocess.run(["git","-C",root,"diff","--cached","--quiet"]).returncode==0: print("no change"); raise SystemExit
    g("-c","user.name=minderopflorian-oss","-c","user.email=minderopflorian@gmail.com","commit","-qm",f"Stats {a.date}: "+", ".join(msg))
    g("-c","credential.helper=","-c","credential.helper=!/usr/local/bin/gh auth git-credential","push","-q"); print("pushed")
