"use client";
import { useId } from "react";
import { Dropdown } from "./controls";
import styles from "./manifest-fields.module.css";

export type ManifestField = {
  id: string;
  label: string;
  type?: "string" | "number" | "integer" | "boolean" | "enum" | "money" | "percent" | "date" | "array" | "object" | "text" | string;
  required?: boolean;
  private?: boolean;
  source?: string;
  help?: string;
  unit?: string;
  min?: number;
  max?: number;
  min_items?: number;
  max_items?: number;
  enum?: (string | number | boolean)[];
  fields?: ManifestField[];
  items?: Partial<ManifestField>;
  display?: "money" | "percent" | "number" | "text" | "list" | "table" | "badge" | "markdown" | string;
};
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): string => value === null || value === undefined ? "" : typeof value === "string" ? value : String(value);
const itemSchema = (field: ManifestField, index: number): ManifestField => ({ ...field.items, id: `${field.id}-${index}`, label: `Item ${index + 1}`, type: field.items?.type || (field.items?.fields ? "object" : "string") });
const minItems = (field: ManifestField) => Math.max(0, field.min_items ?? field.items?.min_items ?? 0);
const maxItems = (field: ManifestField) => field.max_items ?? field.items?.max_items ?? Infinity;
function emptyValue(field: ManifestField): unknown {
  if (field.type === "object") return Object.fromEntries((field.fields || []).map(child => [child.id, emptyValue(child)]));
  if (field.type === "array") return Array.from({ length: minItems(field) }, (_, i) => emptyValue(itemSchema(field, i)));
  return undefined;
}

/** Values are plain data. Percent inputs show 9 for 9%, and emit 0.09 to match manifest v5. */
export function ManifestInput({ field, value, onChange }: { field: ManifestField; value: unknown; onChange: (value: unknown) => void }) {
  const id = useId();
  const privateText = field.private ? ", private" : "";
  const label = `${field.label}${field.type === "percent" ? " (%)" : field.unit ? ` (${field.unit})` : ""}${field.required ? "" : ", optional"}${privateText}`;
  const help = [field.help, field.private ? "Sensitive value. It is sealed on this device before execution." : "", field.type === "percent" ? "Enter a percentage. For example, 9 is stored as 0.09." : ""].filter(Boolean).join(" ");
  if (field.type === "object") {
    const object = isObject(value) ? value : {};
    return <fieldset className={styles.group} title={help}><legend>{label}</legend><div className={styles.fields}>{(field.fields || []).map(child => <ManifestInput key={child.id} field={child} value={object[child.id]} onChange={next => onChange({ ...object, [child.id]: next })} />)}</div>{!field.fields?.length && <p>No editable fields are declared for this object.</p>}</fieldset>;
  }
  if (field.type === "array") {
    const array = Array.isArray(value) ? value : Array.from({ length: minItems(field) }, (_, i) => emptyValue(itemSchema(field, i)));
    return <fieldset className={styles.group} title={help}><legend>{label}</legend><div className={styles.array}>{array.map((item, i) => <div className={styles.item} key={i}><ManifestInput field={itemSchema(field, i)} value={item} onChange={next => onChange(array.map((previous, j) => j === i ? next : previous))} /><button className="view" type="button" disabled={array.length <= minItems(field)} onClick={() => onChange(array.filter((_, j) => j !== i))} aria-label={`Remove item ${i + 1} from ${field.label}`}>Remove</button></div>)}</div><div className={styles.arrayFooter}><span>{array.length} items{minItems(field) ? `, at least ${minItems(field)}` : ""}{Number.isFinite(maxItems(field)) ? `, at most ${maxItems(field)}` : ""}</span><button className="view" type="button" disabled={array.length >= maxItems(field)} onClick={() => onChange([...array, emptyValue(itemSchema(field, array.length))])}>Add item</button></div></fieldset>;
  }
  if (field.type === "boolean" || field.type === "enum" || field.enum) {
    const options = field.type === "boolean" ? [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] : (field.enum || []).map((option, i) => ({ value: String(i), label: String(option) }));
    const selected = field.type === "boolean" ? value === true ? "true" : value === false ? "false" : "" : String((field.enum || []).findIndex(option => option === value));
    return <div className="fx-dd" title={help}><Dropdown label={label} value={options.some(option => option.value === selected) ? selected : ""} options={[{ value: "", label: "Choose" }, ...options]} onChange={next => onChange(next === "" ? undefined : field.type === "boolean" ? next === "true" : field.enum?.[Number(next)])} /></div>;
  }
  const numeric = ["number", "integer", "money", "percent"].includes(field.type || "");
  const displayed = field.type === "percent" && typeof value === "number" ? String(Number((value * 100).toPrecision(12))) : text(value);
  const parse = (raw: string) => {
    if (raw === "") return onChange(undefined);
    if (!numeric) return onChange(raw);
    const number = Number(raw);
    onChange(Number.isFinite(number) ? field.type === "percent" ? number / 100 : number : raw);
  };
  return <label className={`fx ${field.type === "text" ? "tall full" : ""}`} htmlFor={id} title={help}><span className="fx-label">{label}</span>{field.type === "text" ? <textarea id={id} rows={3} value={displayed} required={field.required} onChange={event => parse(event.target.value)} /> : <input id={id} type={numeric ? "number" : field.type === "date" ? "date" : "text"} inputMode={numeric ? "decimal" : undefined} step={field.type === "integer" ? 1 : numeric ? "any" : undefined} min={field.min === undefined ? undefined : field.type === "percent" ? field.min * 100 : field.min} max={field.max === undefined ? undefined : field.type === "percent" ? field.max * 100 : field.max} required={field.required} value={displayed} onChange={event => parse(event.target.value)} />}</label>;
}

/** Validate the complete value before consent/payment, including nested structures and array bounds. */
export function manifestInputErrors(field: ManifestField, value: unknown, path = field.label): string[] {
  const missing = value === undefined || value === null || value === "";
  if (missing) return field.required ? [`${path} is required.`] : [];
  if (field.type === "object") {
    if (!isObject(value)) return [`${path} must be an object.`];
    return (field.fields || []).flatMap(child => manifestInputErrors(child, value[child.id], `${path}, ${child.label}`));
  }
  if (field.type === "array") {
    if (!Array.isArray(value)) return [`${path} must be a list.`];
    const errors = value.length < minItems(field) ? [`${path} needs at least ${minItems(field)} items.`] : value.length > maxItems(field) ? [`${path} allows at most ${maxItems(field)} items.`] : [];
    return [...errors, ...value.flatMap((item, i) => manifestInputErrors({ ...itemSchema(field, i), required: true }, item, `${path}, item ${i + 1}`))];
  }
  if (field.enum && !field.enum.includes(value as string | number | boolean)) return [`${path} must be one of the declared choices.`];
  if (field.type === "boolean" && typeof value !== "boolean") return [`${path} must be Yes or No.`];
  if (["number", "integer", "money", "percent"].includes(field.type || "")) {
    if (typeof value !== "number" || !Number.isFinite(value)) return [`${path} must be a finite number.`];
    if (field.type === "integer" && !Number.isInteger(value)) return [`${path} must be a whole number.`];
    if (field.min !== undefined && value < field.min) return [`${path} is below the allowed minimum.`];
    if (field.max !== undefined && value > field.max) return [`${path} is above the allowed maximum.`];
  }
  if (["string", "text", "date"].includes(field.type || "") && typeof value !== "string") return [`${path} must be text.`];
  if (field.type === "date" && (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)))) return [`${path} must be a valid date.`];
  return [];
}

function scalarOutput(field: ManifestField, value: unknown): string {
  if (value === null || value === undefined) return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const format = field.display || field.type;
  if (typeof value === "number" && Number.isFinite(value)) {
    if (format === "percent") return new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: 4 }).format(value);
    if (format === "money" && field.unit && /^[A-Z]{3}$/.test(field.unit)) {
      try { return new Intl.NumberFormat("en-GB", { style: "currency", currency: field.unit, maximumFractionDigits: 8 }).format(value); } catch { /* Non-ISO assets use the unit label below. */ }
    }
    return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 8 }).format(value)}${field.unit && field.unit !== "%" ? ` ${field.unit}` : ""}`;
  }
  return typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
}

/** Output data is rendered as React text. Markdown never runs HTML or seller code. */
export function ManifestOutput({ field, value }: { field: ManifestField; value: unknown }) {
  if (isObject(value)) {
    const fields = field.fields?.length ? field.fields : Object.keys(value).map(id => ({ id, label: id }));
    return <section className={styles.output}><h3>{field.label}</h3><div className={styles.outputChildren}>{fields.map(child => <ManifestOutput key={child.id} field={child} value={value[child.id]} />)}</div></section>;
  }
  if (Array.isArray(value)) {
    const declared = field.items?.fields || field.fields;
    const columns: ManifestField[] = declared?.length ? declared : [...new Set(value.filter(isObject).flatMap(row => Object.keys(row)))].map(id => ({ id, label: id }));
    if ((field.display === "table" || field.items?.type === "object") && columns.length) return <section className={styles.output}><h3>{field.label}</h3><div className={styles.tableWrap}><table><caption className={styles.sr}>{field.label}</caption><thead><tr>{columns.map(column => <th key={column.id} scope="col">{column.label}</th>)}</tr></thead><tbody>{value.map((row, i) => <tr key={i}>{columns.map(column => <td key={column.id}>{isObject(row) ? scalarOutput(column, row[column.id]) : scalarOutput(column, row)}</td>)}</tr>)}</tbody></table></div></section>;
    return <section className={styles.output}><h3>{field.label}</h3>{value.length ? <div className={styles.outputChildren}>{value.map((item, i) => <ManifestOutput key={i} field={itemSchema(field, i)} value={item} />)}</div> : <p>No items</p>}</section>;
  }
  return <div className={`row ${styles.scalar}`}><span className="two"><span>{field.label}</span><strong className={field.display === "badge" ? styles.badge : styles.value}>{scalarOutput(field, value)}</strong></span></div>;
}
