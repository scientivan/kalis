// Browser proof for the private notes path. Needs privacy-preview.mjs on :8798 and the web app (built with NEXT_PUBLIC_KALIS_PRIVATE_DEV=1) on :3312. Run from the Product folder. Native development only, not a TEE.
import fs from "node:fs";
import {spawn} from "node:child_process";
import assert from "node:assert/strict";
const dir=fs.mkdtempSync("/tmp/kalis-private-browser-");
const chrome=spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",["--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check","--remote-debugging-port=9338","--user-data-dir="+dir,"about:blank"],{stdio:"ignore"});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
let ws;const network=[];
try{
 for(let i=0;i<40;i++){try{await fetch("http://127.0.0.1:9338/json/version");break;}catch{await pause(250);}}
 const targets=await(await fetch("http://127.0.0.1:9338/json/list")).json();
 ws=new WebSocket(targets.find(x=>x.type==="page").webSocketDebuggerUrl);
 await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let seq=0;const waiting=new Map();
 ws.onmessage=e=>{const d=JSON.parse(e.data);if(d.method==="Network.requestWillBeSent"&&d.params.request.url.startsWith("http://127.0.0.1:3312/"))network.push(d.params.request);if(waiting.has(d.id)){const p=waiting.get(d.id);waiting.delete(d.id);d.error?p.reject(d.error):p.resolve(d.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;waiting.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await send("Page.enable");await send("Runtime.enable");await send("Network.enable");
 await send("Page.navigate",{url:"http://127.0.0.1:3312/workspace/memory"});await pause(1600);
 await evaluate('Array.from(document.querySelectorAll("button")).find(x=>x.querySelector("b")?.textContent.trim()==="Add a note").click()');
 await pause(1200);
 const sentinel="BROWSER_PRIVATE_SENTINEL_812000000";
 await evaluate('(()=>{const t=document.querySelector("textarea");if(!t)throw new Error(document.body.innerText);Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(t,'+JSON.stringify(sentinel)+');t.dispatchEvent(new Event("input",{bubbles:true}));})()');
 await pause(150);
 await evaluate('Array.from(document.querySelectorAll("button")).find(x=>x.textContent.trim()==="Add note").click()');
 for(let n=0;n<30;n++){await pause(200);const text=await evaluate("document.body.innerText");if(text.includes(sentinel)&&text.includes("From user"))break;}
 const text=await evaluate("document.body.innerText");
 assert.ok(text.includes(sentinel)&&text.includes("From user"),text);
 await send("Page.reload");await pause(1800);
 assert.ok((await evaluate("document.body.innerText")).includes(sentinel),"Device key and encrypted notes must survive a page reload.");
 const nonExtractable=await evaluate('new Promise((resolve,reject)=>{const r=indexedDB.open("kalis-private-device-v1");r.onsuccess=()=>{const db=r.result;const q=db.transaction("device").objectStore("device").get("anonymous@device");q.onsuccess=async()=>{try{await crypto.subtle.exportKey("pkcs8",q.result.privateKey);resolve(false);}catch{resolve(q.result.privateKey.extractable===false);}finally{db.close();}};};r.onerror=reject;})');
 assert.equal(nonExtractable,true);
 const sealed=network.filter(x=>x.url.endsWith("/api/privacy/execute")&&x.method==="POST");
 assert.ok(sealed.length>=4);
 assert.ok(!network.some(x=>(x.postData||"").includes(sentinel)||x.url.includes(sentinel)),"Private sentinel leaked in a browser request.");
 assert.ok(!network.some(x=>x.url.includes("/api/protections/")),"Legacy plaintext endpoint was contacted.");
 const shot=await send("Page.captureScreenshot",{format:"png"});
 fs.mkdirSync("audit/2026-11-14-private-migration",{recursive:true});
 fs.writeFileSync("audit/2026-11-14-private-migration/notes-native.png",Buffer.from(shot.data,"base64"));
 const proof={observed_at:new Date().toISOString(),mode:"native development only, not a TEE",checks:{note_saved:true,survives_reload:true,device_key_non_extractable:true,no_plaintext_sentinel_in_requests:true,no_legacy_endpoint_requests:true},sealed_requests:sealed.length,external_ai_or_payment:false};
 fs.writeFileSync("audit/2026-11-14-private-migration/browser-proof.json",JSON.stringify(proof,null,2));
 console.log(JSON.stringify(proof,null,2));
}catch(e){console.error(e.message);process.exitCode=1;}
finally{if(ws)ws.close();chrome.kill();}
