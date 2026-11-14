// Fictional data behind the labelled mock connectors (sheets_mock, docs_mock, wallet_mock).
// Every company, person and account here is invented for the Kalis demo.
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../config.js";

const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, "mock", f), "utf8"));

export const MOCK_SHEETS = {
  "sinar-mandiri-cash-13w": read("productivity-sheet-sinar-mandiri-cash-13w.json"),
  "maju-tender-cost-T-2026-114": read("productivity-sheet-maju-tender-cost.json"),
  "nusa-data-cap-table": read("productivity-sheet-nusa-data-cap-table.json"),
};
export const MOCK_DOCS = {
  "arunika-supply-contract-draft": read("productivity-doc-arunika-supply-contract.json"),
  "nusa-data-term-sheet": read("productivity-doc-nusa-data-term-sheet.json"),
};
export const MOCK_WALLET = read("wallet-loan-position.json");
