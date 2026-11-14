// One-time cleanup: remove extracted document text stored by servers older than the
// "metadata only" change (documents.js). Keeps text_chars and adds text_sha256 where possible.
// Usage: node scripts/scrub-document-text.mjs [data dir]
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DATA_DIR } from "../src/config.js";

const dir = path.join(process.argv[2] || DATA_DIR, "workspaces");
let files = 0, rows = 0;
for (const ws of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
  const f = path.join(dir, ws, "documents.json");
  if (!fs.existsSync(f)) continue;
  const list = JSON.parse(fs.readFileSync(f, "utf8"));
  let changed = false;
  for (const r of list) {
    if (typeof r.text === "string") {
      r.text_chars = r.text.length;
      r.text_sha256 = crypto.createHash("sha256").update(r.text, "utf8").digest("hex");
      delete r.text; r.text_kept = false; changed = true; rows++;
    }
  }
  if (changed) { fs.writeFileSync(f, JSON.stringify(list, null, 2), { mode: 0o600 }); files++; }
}
console.log(`scrubbed ${rows} document rows in ${files} files under ${dir}`);
