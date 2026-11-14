import { BRAND_ICONS } from "../lib/brand-icons";

/** Brand mark of a third-party app, drawn in its own color on a white tile. */
export function BrandLogo({ brand, size = 36 }: { brand?: keyof typeof BRAND_ICONS; size?: number }) {
  const b = brand ? BRAND_ICONS[brand] : undefined;
  return <span className="brand-logo" style={{ width: size, height: size }} aria-hidden="true">
    {b ? <svg viewBox="0 0 24 24" width={size * 0.56} height={size * 0.56}><path d={b.path} fill={b.hex} /></svg> : null}
  </span>;
}
