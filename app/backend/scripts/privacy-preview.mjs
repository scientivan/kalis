// Temporary local preview only. No TEE claim, funding, external AI or real secrets.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
const temp=fs.mkdtempSync(path.join(os.tmpdir(),"kalis-private-preview-"));
process.env.KALIS_DATA_DIR=path.join(temp,"backend");
process.env.KALIS_PRIVATE_STATE_DIR=path.join(temp,"enclave");
process.env.KALIS_PRIVATE_LOCAL_RUNNER=fileURLToPath(new URL("../../kalis-runner/target/release/kalis-runner",import.meta.url));
process.env.KALIS_PRIVATE_DEV_SEAL_KEY=crypto.randomBytes(32).toString("hex");
for(const key of ["DEMO_BUYER_ACCOUNT","DEMO_BUYER_KEY","SETTLER_ACCOUNT","SETTLER_KEY","OUTLAYER_PAYMENT_KEY","NEAR_API_KEY","NEAR_AI_API_KEY","CREDENTIAL_KEY","MOCK_BROKER_TOKEN"])process.env[key]="";
const {server}=await import("../src/server.js");
const port=Number(process.env.KALIS_PRIVATE_PREVIEW_PORT||8798);
server.listen(port,"127.0.0.1",()=>console.log("Native private preview, NOT a TEE. Funded operations and external AI disabled. http://127.0.0.1:"+port));
function stop(){server.closeAllConnections();server.close(()=>{fs.rmSync(temp,{recursive:true,force:true});process.exit(0);});}
process.on("SIGINT",stop);process.on("SIGTERM",stop);
