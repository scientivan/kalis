"use client";
import { useEffect, useState, type ReactNode } from "react";
import { backend } from "../lib/backend/client";
type Feature = { id: string; status: string; reason: string };
// Notes sit inside a card so no text floats loose on the page.
const Note = ({ children, role }: { children: ReactNode; role?: string }) => <section className="card ph"><div className="note-row" role={role}><span><b>{children}</b></span></div></section>;
export function Capability({ id, children }: { id: string; children: ReactNode }) {
  const [feature, setFeature] = useState<Feature>(); const [error,setError]=useState("");
  useEffect(() => { let alive=true; backend<{features:Feature[]}>("capabilities").then(d=>{if(alive)setFeature(d.features.find(f=>f.id===id)||{id,status:"unavailable",reason:"This server does not declare this feature."});}).catch(e=>{if(alive)setError(e.message);}); return()=>{alive=false;}; },[id]);
  if(error)return <Note role="alert">Feature availability could not be checked. {error}</Note>;
  if(!feature)return <Note role="status">Checking availability</Note>;
  if(!["enabled","demo","read_only"].includes(feature.status))return <Note>{feature.reason}</Note>;
  return <>{feature.status!=="enabled"&&<Note>{feature.reason}</Note>}{children}</>;
}
