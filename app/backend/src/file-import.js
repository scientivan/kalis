// Read .xlsx and .docx files on the buyer's device, so the file never leaves it (RANCANGAN 65.3, option C).
// Isomorphic ES module with no dependencies: browsers and Node 18+ both provide DecompressionStream.
// The parsed values are then sealed with kalis-crypto.js like any typed input.
//
//   import { parseXlsx, parseDocx, sheetToObjects } from "/file-import.js";
//   const book = await parseXlsx(await file.arrayBuffer());   // { sheets: [{ name, rows: [[cell, ...], ...] }] }
//   const doc = await parseDocx(await file.arrayBuffer());    // { paragraphs: [string], tables: [[[cell text]]], text }
//
// Limits: no formulas are evaluated (the cached value saved by Excel is used), no styles or dates
// conversion (date cells come back as Excel serial numbers), files up to 10 MB.

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_ENTRIES = 2000;

export class FileImportError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

const u8 = (b) => (b instanceof Uint8Array ? b : new Uint8Array(b));
const td = new TextDecoder("utf-8");

// ---------- zip ----------
function readZipDirectory(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new FileImportError("not_zip", "This is not an Office file (no zip directory found)");
  const count = dv.getUint16(eocd + 10, true);
  let off = dv.getUint32(eocd + 16, true);
  if (count > MAX_ENTRIES) throw new FileImportError("too_many_entries", "The file has too many parts");
  const entries = new Map();
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(off, true) !== 0x02014b50) throw new FileImportError("bad_zip", "Corrupt zip directory");
    const method = dv.getUint16(off + 10, true);
    const compSize = dv.getUint32(off + 20, true);
    const size = dv.getUint32(off + 24, true);
    const nameLen = dv.getUint16(off + 28, true);
    const extraLen = dv.getUint16(off + 30, true);
    const commentLen = dv.getUint16(off + 32, true);
    const local = dv.getUint32(off + 42, true);
    const name = td.decode(bytes.subarray(off + 46, off + 46 + nameLen));
    entries.set(name, { method, compSize, size, local });
    off += 46 + nameLen + extraLen + commentLen;
  }
  return { dv, entries };
}

async function inflateRaw(data) {
  if (typeof DecompressionStream === "undefined") throw new FileImportError("unsupported", "This browser cannot unpack Office files (no DecompressionStream)");
  // ryux-ignore RX-AS-03: [data] is a Blob parts array in code, not a UI placeholder
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readEntry(bytes, zip, name) {
  const e = zip.entries.get(name);
  if (!e) return null;
  const { dv } = zip;
  if (dv.getUint32(e.local, true) !== 0x04034b50) throw new FileImportError("bad_zip", `Corrupt part ${name}`);
  const start = e.local + 30 + dv.getUint16(e.local + 26, true) + dv.getUint16(e.local + 28, true);
  const data = bytes.subarray(start, start + e.compSize);
  if (e.method === 0) return td.decode(data);
  if (e.method === 8) return td.decode(await inflateRaw(data));
  throw new FileImportError("unsupported_compression", `Part ${name} uses an unsupported compression`);
}

// ---------- tiny XML helpers (enough for the Office parts we read) ----------
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
export const xmlText = (s) => s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_, e) =>
  e[0] === "#" ? String.fromCodePoint(e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENT[e]);
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`)); return m ? xmlText(m[1]) : null; };
const textOf = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "g"))].map((m) => xmlText(m[1])).join("");

function colIndex(ref) {
  const letters = (ref || "").match(/^[A-Z]+/)?.[0] || "A";
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function checkSize(bytes) {
  if (!bytes.length) throw new FileImportError("empty", "The file is empty");
  if (bytes.length > MAX_BYTES) throw new FileImportError("too_large", "The file is larger than 10 MB");
}

// ---------- xlsx ----------
export async function parseXlsx(input) {
  const bytes = u8(input);
  checkSize(bytes);
  const zip = readZipDirectory(bytes);
  const workbook = await readEntry(bytes, zip, "xl/workbook.xml");
  if (!workbook) throw new FileImportError("not_xlsx", "This is not an .xlsx workbook");
  const rels = (await readEntry(bytes, zip, "xl/_rels/workbook.xml.rels")) || "";
  const target = {};
  for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) target[attr(m[0], "Id")] = attr(m[0], "Target");
  const shared = [];
  const sst = await readEntry(bytes, zip, "xl/sharedStrings.xml");
  if (sst) for (const m of sst.matchAll(/<si>([\s\S]*?)<\/si>/g)) shared.push(textOf(m[1], "t"));
  const sheets = [];
  for (const m of workbook.matchAll(/<sheet\b[^>]*\/?>/g)) {
    const name = attr(m[0], "name");
    const rid = attr(m[0], "r:id");
    let t = target[rid] || "";
    t = t.startsWith("/") ? t.slice(1) : `xl/${t.replace(/^\.\//, "")}`;
    const xml = await readEntry(bytes, zip, t);
    if (!xml) continue;
    const rows = [];
    for (const r of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
      const rowNum = Number(attr(`<row${r[1]}>`, "r")) || rows.length + 1;
      const row = [];
      for (const c of r[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const head = `<c${c[1]}>`;
        const type = attr(head, "t");
        const body = c[2] || "";
        const v = textOf(body, "v");
        let value = null;
        if (type === "s") value = shared[Number(v)] ?? null;
        else if (type === "inlineStr") value = textOf(body, "t");
        else if (type === "str") value = v;
        else if (type === "b") value = v === "1";
        else if (v !== "") value = Number(v);
        row[colIndex(attr(head, "r"))] = value;
      }
      rows[rowNum - 1] = Array.from(row, (x) => (x === undefined ? null : x));
    }
    sheets.push({ name, rows: Array.from(rows, (x) => x || []) });
  }
  return { kind: "xlsx", sheets, parsed_on: "this device" };
}

/** Rows after `headerRow` as objects keyed by the header cells. Empty rows are skipped. */
export function sheetToObjects(sheet, headerRow = 0) {
  const header = (sheet.rows[headerRow] || []).map((h) => String(h ?? "").trim());
  return sheet.rows.slice(headerRow + 1)
    .filter((r) => r.some((x) => x !== null && x !== ""))
    .map((r) => Object.fromEntries(header.map((h, i) => [h || `col${i + 1}`, r[i] ?? null])));
}

// ---------- docx ----------
function paragraphText(p) {
  let out = "";
  for (const m of p.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>/g)) {
    if (m[1] !== undefined) out += xmlText(m[1]);
    else out += m[0] === "<w:tab/>" ? "\t" : "\n";
  }
  return out;
}

export async function parseDocx(input) {
  const bytes = u8(input);
  checkSize(bytes);
  const zip = readZipDirectory(bytes);
  const xml = await readEntry(bytes, zip, "word/document.xml");
  if (!xml) throw new FileImportError("not_docx", "This is not a .docx document");
  const body = xml.match(/<w:body>([\s\S]*)<\/w:body>/)?.[1] || xml;
  const tables = [];
  for (const t of body.matchAll(/<w:tbl>([\s\S]*?)<\/w:tbl>/g)) {
    tables.push([...t[1].matchAll(/<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/g)].map((tr) =>
      [...tr[1].matchAll(/<w:tc>([\s\S]*?)<\/w:tc>/g)].map((tc) =>
        [...tc[1].matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>|<w:p\b[^>]*\/>/g)].map((p) => paragraphText(p[1] || "")).join("\n").trim())));
  }
  const outside = body.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, "");
  const paragraphs = [...outside.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)].map((p) => paragraphText(p[1]).trim()).filter(Boolean);
  const text = [...paragraphs, ...tables.flatMap((t) => t.map((r) => r.join("\t")))].join("\n");
  return { kind: "docx", paragraphs, tables, text, parsed_on: "this device" };
}

/** Pick the parser from the file name or the first bytes. */
export async function parseOfficeFile(name, input) {
  const n = String(name || "").toLowerCase();
  if (n.endsWith(".xlsx")) return parseXlsx(input);
  if (n.endsWith(".docx")) return parseDocx(input);
  throw new FileImportError("unsupported_type", "Only .xlsx and .docx files can be imported");
}
