"use client";
import {useState} from "react";
import {backend} from "../lib/backend/client";
export function VersionEvidence({methodId,version}:{methodId:string;version:number}){
 const[data,setData]=useState<unknown>(),[error,setError]=useState("");
 return <details className="dblock" onToggle={e=>{if(e.currentTarget.open&&data===undefined)Promise.all([backend(`methods/${encodeURIComponent(methodId)}/versions/${version}/evidence`),backend(`methods/${encodeURIComponent(methodId)}/versions/${version}/contribution-package`)]).then(([evidence,contribution])=>setData({evidence,contribution})).catch(e=>setError(e.message));}}><summary>Test evidence and contribution interface</summary>{error&&<div className="note-row" role="alert">{error}</div>}{data===undefined&&!error?<div className="note-row">Loading evidence</div>:<pre className="backend-data">{JSON.stringify(data,null,2)}</pre>}</details>;
}
