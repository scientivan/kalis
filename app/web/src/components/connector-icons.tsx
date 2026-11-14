import { BrandLogo } from "./brand-logo";
import { icon } from "./shell";
import { appForConnector, connectorLabel, CONNECTOR_APPS } from "../lib/connector-apps";
import type { BRAND_ICONS } from "../lib/brand-icons";

/** Apps a method reads from, shown as small marks with their names on hover and for screen readers. */
export function ConnectorIcons({ connectors, brands }: { connectors?: string[]; brands?: string[] }) {
  const items = [
    ...(connectors || []).map(c => ({ key: c, name: connectorLabel(c), brand: appForConnector(c)?.brand })),
    ...(brands || []).map(b => ({ key: b, name: CONNECTOR_APPS.find(a => a.brand === b)?.name || b, brand: b as keyof typeof BRAND_ICONS })),
  ];
  if (!items.length) return <div className="mcard-connectors is-none"><span>Uses only what you type</span></div>;
  return <div className="mcard-connectors" aria-label={`Reads from ${items.map(i => i.name).join(", ")}`}>
    {items.map(i => <span className="mcard-connector" key={i.key} title={i.name}>{i.brand ? <BrandLogo brand={i.brand} size={22} /> : <span className="brand-logo is-demo" style={{ width: 22, height: 22 }}>{icon(i.key === "wallet_mock" ? "wallet" : "m-chart")}</span>}</span>)}
    <span className="mcard-connector-names">{items.map(i => i.name).join(", ")}</span>
  </div>;
}
export const manifestConnectors = (manifest: unknown): string[] => {
  const m = manifest as { connectors?: { id: string }[]; inputs?: { sources?: { id: string }[] } };
  return (m?.connectors || m?.inputs?.sources || []).map(c => c.id).filter(Boolean);
};
