#!/usr/bin/env python3
"""Refresh data/network-revenue.json from /workspace/cybercab-count-log.csv and robotaxi-miles-log.csv.
Rate = Cybercabs/day over ~7 days; miles/car/day = 7-day avg daily Robotaxi miles / latest total robotaxis."""
import csv,json,os
from datetime import datetime
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C=[r for r in csv.DictReader(open("/workspace/cybercab-count-log.csv")) if r["cybercabs"]]
M=list(csv.DictReader(open("/workspace/robotaxi-miles-log.csv")))
pd=lambda s:datetime.strptime(s[:16],"%Y-%m-%d %H:%M") if len(s)>10 else datetime.strptime(s,"%Y-%m-%d")
last=C[-1];ld=pd(last["date"])
base=min(C[:-1],key=lambda r:abs((ld-pd(r["date"])).days-7))
days=(ld-pd(base["date"])).days
rate=(int(last["cybercabs"])-int(base["cybercabs"]))/days
ml=M[-1];mt=pd(ml["date_time_amsterdam"])
mb=min(M[:-1],key=lambda r:abs((mt-pd(r["date_time_amsterdam"])).total_seconds()/86400-7))
md=(mt-pd(mb["date_time_amsterdam"])).total_seconds()/86400
fleet=int(next(r["total_robotaxis"] for r in reversed(C) if r["total_robotaxis"]))
mpd=(int(ml["miles"])-int(mb["miles"]))/md/fleet
st=json.load(open(f"{root}/data/cybercab-stats.json"))
out={"updated":ml["date_time_amsterdam"][:10],"count":int(last["cybercabs"]),"count_date":last["date"],
"rate_per_day":round(rate,1),"rate_window":f'{base["date"]} to {last["date"]}',
"miles_per_car_day":round(mpd,1),"miles_window":f'{mb["date_time_amsterdam"][:10]} to {ml["date_time_amsterdam"][:10]}',
"total_robotaxis":fleet,"fare_per_mile":st.get("fare_per_mile",1.4),"fare_source":st.get("fare_source"),
"count_source":{"text":"Texas DMV registrations via @herbertong / @joehansen","url":last["source"]},
"miles_source":"https://www.tesla.com/robotaxi"}
open(f"{root}/data/network-revenue.json","w").write(json.dumps(out,indent=1)+"\n");print("network-revenue",out["count"],out["rate_per_day"],out["miles_per_car_day"])
