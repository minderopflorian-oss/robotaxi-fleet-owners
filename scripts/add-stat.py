#!/usr/bin/env python3
"""Append a Cybercab stat and push.
Usage: scripts/add-stat.py DATE COUNT [--total N] [--miles N] [--no-push]
  DATE  YYYY-MM-DD   COUNT registered Cybercabs (Texas)
  --total  total robotaxis (optional)   --miles cumulative autonomous miles (optional, added to "miles")
Replaces an existing entry with the same date. Commits and pushes unless --no-push."""
import argparse, json, os, subprocess, datetime
p=argparse.ArgumentParser(); p.add_argument("date"); p.add_argument("count",type=int)
p.add_argument("--total",type=int); p.add_argument("--miles",type=int); p.add_argument("--no-push",action="store_true")
a=p.parse_args(); datetime.date.fromisoformat(a.date)
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); f=os.path.join(root,"data","cybercab-stats.json")
d=json.load(open(f))
e={"date":a.date,"count":a.count}
if a.total is not None: e["total_robotaxis"]=a.total
d["cybercabs"]=sorted([x for x in d["cybercabs"] if x["date"]!=a.date]+[e],key=lambda x:x["date"])
if a.miles is not None:
    d["miles"]=sorted([x for x in d.get("miles",[]) if x["date"]!=a.date]+[{"date":a.date,"miles":a.miles}],key=lambda x:x["date"])
d["updated"]=max(d["updated"],a.date)
open(f,"w").write(json.dumps(d,separators=(",",":"))+"\n")
print("saved",e)
if not a.no_push:
    g=lambda *c: subprocess.run(["git","-C",root,*c],check=True)
    g("add","data/cybercab-stats.json")
    if subprocess.run(["git","-C",root,"diff","--cached","--quiet"]).returncode==0: print("no change"); raise SystemExit
    g("-c","user.name=minderopflorian-oss","-c","user.email=minderopflorian@gmail.com","commit","-qm",f"Stats: {a.date} {a.count} Cybercabs")
    g("-c","credential.helper=","-c","credential.helper=!/usr/local/bin/gh auth git-credential","push","-q")
    print("pushed")
