# Generates the fictional .xlsx and .docx fixtures in mock/files/ used by scripts/file-import-test.mjs.
# Usage: python3 -I scripts/make-import-fixtures.py mock/files
import zipfile, sys, os
from xml.sax.saxutils import escape
out = sys.argv[1]

def col(i):
    s = ""
    i += 1
    while i:
        i, r = divmod(i - 1, 26)
        s = chr(65 + r) + s
    return s

def xlsx(path, sheets):
    shared, idx = [], {}
    def sidx(v):
        if v not in idx:
            idx[v] = len(shared); shared.append(v)
        return idx[v]
    sheet_xml = []
    for name, rows in sheets:
        rx = []
        for r, row in enumerate(rows):
            cells = []
            for c, v in enumerate(row):
                ref = f"{col(c)}{r+1}"
                if v is None: continue
                if isinstance(v, (int, float)): cells.append(f'<c r="{ref}"><v>{v}</v></c>')
                else: cells.append(f'<c r="{ref}" t="s"><v>{sidx(str(v))}</v></c>')
            rx.append(f'<row r="{r+1}">{"".join(cells)}</row>')
        sheet_xml.append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + "".join(rx) + '</sheetData></worksheet>')
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' + "".join(f'<Override PartName="/xl/worksheets/sheet{i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' for i in range(len(sheets))) + '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>')
        z.writestr("_rels/.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        z.writestr("xl/workbook.xml", '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + "".join(f'<sheet name="{escape(n)}" sheetId="{i+1}" r:id="rId{i+1}"/>' for i, (n, _) in enumerate(sheets)) + '</sheets></workbook>')
        z.writestr("xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + "".join(f'<Relationship Id="rId{i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i+1}.xml"/>' for i in range(len(sheets))) + f'<Relationship Id="rId{len(sheets)+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>')
        for i, x in enumerate(sheet_xml): z.writestr(f"xl/worksheets/sheet{i+1}.xml", x)
        z.writestr("xl/sharedStrings.xml", '<?xml version="1.0" encoding="UTF-8"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + "".join(f"<si><t>{escape(s)}</t></si>" for s in shared) + "</sst>")

weeks = [f"W{i}" for i in range(1, 14)]
cash = [["Item", "Type"] + weeks,
        ["Customer receipts", "receipt", 180, 150, 210, 140, 160, 190, 170, 150, 200, 180, 160, 175, 185],
        ["Supplier payments", "payment", 120, 140, 110, 160, 130, 120, 150, 140, 120, 130, 140, 125, 120],
        ["Payroll", "payroll", 0, 95, 0, 95, 0, 95, 0, 95, 0, 95, 0, 95, 0],
        ["Bank loan instalment", "debt", 0, 0, 0, 60, 0, 0, 0, 60, 0, 0, 0, 60, 0],
        ["Rent", "payment", 25, 0, 0, 0, 25, 0, 0, 0, 25, 0, 0, 0, 25]]
facts = [["Field", "Value", "Unit"],
         ["Company", "CV Sinar Mandiri (fictional)", None],
         ["Opening cash", 140, "IDR million"],
         ["Minimum cash reserve", 40, "IDR million"],
         ["Overdraft limit", 50, "IDR million"],
         ["Note", "Fictional demo data, not a real company", None]]
xlsx(os.path.join(out, "cash-13-week-cv-sinar-mandiri.xlsx"), [("Cash plan", cash), ("Facts", facts)])

def docx(path, paragraphs, table):
    def p(t): return f'<w:p><w:r><w:t xml:space="preserve">{escape(t)}</w:t></w:r></w:p>'
    tbl = "<w:tbl>" + "".join("<w:tr>" + "".join(f"<w:tc>{p(str(c))}</w:tc>" for c in row) + "</w:tr>" for row in table) + "</w:tbl>"
    doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + "".join(p(t) for t in paragraphs) + tbl + "</w:body></w:document>"
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
        z.writestr("_rels/.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
        z.writestr("word/document.xml", doc)

docx(os.path.join(out, "term-sheet-lumbung-tani.docx"), [
    "FICTIONAL DEMO DOCUMENT. Not a real offer.",
    "Term sheet: Series A preferred shares in PT Lumbung Tani Digital (fictional)",
    "Investor: Nusantara Growth Fund I (fictional)",
    "Investment amount: USD 3,000,000",
    "Pre-money valuation: USD 12,000,000",
    "Employee option pool: increase to 12% of the post-money fully diluted capital, created before the investment",
    "Liquidation preference: 1x non-participating",
    "Anti-dilution: broad-based weighted average",
    "This term sheet expires 72 hours after it is sent.",
], [["Holder", "Shares"], ["Founder A", 4500000], ["Founder B", 3500000], ["Seed investor", 1500000], ["Existing option pool", 500000]])
print("ok")
