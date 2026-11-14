// Tests src/file-import.js (the on-device .xlsx/.docx reader) on the fictional fixtures in mock/files/.
// Usage: node scripts/file-import-test.mjs [base url]   (base url optional: also checks GET /file-import.js)
import fs from "node:fs";
import { parseXlsx, parseDocx, sheetToObjects, parseOfficeFile } from "../src/file-import.js";

const dir = new URL("../mock/files/", import.meta.url);
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`); };

const book = await parseXlsx(fs.readFileSync(new URL("cash-13-week-cv-sinar-mandiri.xlsx", dir)));
check("xlsx: both sheets read with their names", book.sheets.map((s) => s.name).join(",") === "Cash plan,Facts");
const plan = sheetToObjects(book.sheets[0]);
check("xlsx: 5 cash lines with 13 weeks", plan.length === 5 && plan[0].W13 === 185 && plan[2].Item === "Payroll" && plan[2].W2 === 95, JSON.stringify(plan[2]));
const facts = Object.fromEntries(sheetToObjects(book.sheets[1]).map((r) => [r.Field, r.Value]));
check("xlsx: numbers stay numbers and text stays text", facts["Opening cash"] === 140 && facts.Company === "CV Sinar Mandiri (fictional)");

const doc = await parseDocx(fs.readFileSync(new URL("term-sheet-lumbung-tani.docx", dir)));
check("docx: paragraphs read in order", doc.paragraphs[0].startsWith("FICTIONAL DEMO") && doc.paragraphs.some((p) => p.includes("Pre-money valuation: USD 12,000,000")));
check("docx: cap table read as a table", doc.tables[0]?.[1]?.join("|") === "Founder A|4500000", JSON.stringify(doc.tables[0]?.[1]));

let refused = null;
try { await parseOfficeFile("notes.pdf", new Uint8Array([1, 2, 3])); } catch (e) { refused = e.code; }
check("other file types are refused", refused === "unsupported_type");
refused = null;
try { await parseXlsx(new Uint8Array([80, 75, 1, 2, 3, 4])); } catch (e) { refused = e.code; }
check("a broken file is refused with a reason", refused === "not_zip");
refused = null;
try { await parseXlsx(fs.readFileSync(new URL("term-sheet-lumbung-tani.docx", dir))); } catch (e) { refused = e.code; }
check("a .docx passed as .xlsx is refused", refused === "not_xlsx");

if (process.argv[2]) {
  const r = await fetch(`${process.argv[2]}/file-import.js`);
  const t = await r.text();
  check("server serves the module as JavaScript", r.ok && /javascript/.test(r.headers.get("content-type") || "") && t.includes("export async function parseXlsx"));
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
