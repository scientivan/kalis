import type React from "react";
/**
 * Small scenes of what each upcoming method does, drawn from the product's own vocabulary
 * (an offer, a bid sheet, a flagged clause, a cash runway, a wrong parcel, a stalled board).
 * Solid Kalis colors only. Text inside is decorative, so the SVG is hidden from assistive tech.
 */
const INK = "#101010", BLUE = "#0038FF", ORANGE = "#FF5F04", PINK = "#FF77CD", YELLOW = "#FEE897", LILAC = "#9FA9F5", PAPER = "#FFFFFF", LINE = "#E4E4E7";
const T = ({ x, y, s = 15, w = 700, c = INK, children }: { x: number; y: number; s?: number; w?: number; c?: string; children: string }) =>
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} fontFamily="Inter, -apple-system, sans-serif">{children}</text>;

function Offer() {
  return <>
    <rect width="320" height="120" fill={LILAC} />
    <rect x="24" y="16" width="170" height="92" rx="8" fill={PAPER} stroke={LINE} />
    <T x={36} y={36}>Offer letter</T>
    <rect x="36" y="46" width="120" height="6" rx="3" fill={LINE} /><rect x="36" y="58" width="96" height="6" rx="3" fill={LINE} />
    <T x={36} y={92} s={18} w={800}>$84,000</T>
    <rect x="210" y="28" width="86" height="72" rx="8" fill={PAPER} />
    <rect x="222" y="74" width="16" height="16" rx="3" fill={LINE} /><rect x="244" y="60" width="16" height="30" rx="3" fill={LINE} /><rect x="266" y="42" width="16" height="48" rx="3" fill={BLUE} />
    <line x1="218" x2="290" y1="56" y2="56" stroke={ORANGE} strokeWidth="2" strokeDasharray="4 3" />
    <T x={214} y={50} s={12} c={ORANGE}>floor</T>
  </>;
}
function Tender() {
  return <>
    <rect width="320" height="120" fill={YELLOW} />
    <rect x="24" y="14" width="272" height="92" rx="8" fill={PAPER} stroke={LINE} />
    <T x={38} y={34}>Bid sheet</T>
    {[["Materials", 0.62], ["Labour", 0.5], ["Transport", 0.34]].map(([n, v], i) => <g key={n as string}>
            <rect x="38" y={46 + i * 18} width="180" height="10" rx="5" fill={LINE} /><rect x="38" y={46 + i * 18} width={180 * (v as number)} height="10" rx="5" fill={INK} />
      <T x={232} y={57 + i * 18} s={14} c={i === 2 ? ORANGE : BLUE}>{i === 2 ? "8%" : i === 1 ? "14%" : "18%"}</T>
    </g>)}
    <line x1="110" x2="110" y1="40" y2="100" stroke={ORANGE} strokeWidth="2" strokeDasharray="4 3" />
  </>;
}
function Contract() {
  return <>
    <rect width="320" height="120" fill={PINK} />
    <rect x="60" y="10" width="200" height="104" rx="8" fill={PAPER} stroke={LINE} />
    <T x={74} y={30}>Supply agreement</T>
    {[40, 52, 64, 88, 100].map(y => <rect key={y} x="74" y={y} width={y === 64 ? 130 : 170} height="6" rx="3" fill={LINE} />)}
    <rect x="70" y="70" width="178" height="18" rx="4" fill={YELLOW} />
    <T x={76} y={84} s={12} w={800}>Penalty 20%</T>
    <circle cx="262" cy="79" r="11" fill={ORANGE} /><T x={258} y={83} s={12} w={800} c={PAPER}>!</T>
  </>;
}
function Cash() {
  const h = [54, 50, 46, 40, 34, 26, 18, 22, 30, 38, 44, 50, 56];
  return <>
    <rect width="320" height="120" fill={LILAC} />
    <rect x="20" y="12" width="280" height="96" rx="8" fill={PAPER} stroke={LINE} />
    <T x={32} y={30}>13 week cash</T>
    {h.map((v, i) => <rect key={i} x={34 + i * 20} y={98 - v} width="12" height={v} rx="3" fill={v < 32 ? ORANGE : BLUE} />)}
    <line x1="30" x2="290" y1="66" y2="66" stroke={INK} strokeWidth="1.5" strokeDasharray="4 3" />
    <T x={228} y={30} s={13} w={800}>payroll line</T>
  </>;
}
function Orders() {
  return <>
    <rect width="320" height="120" fill={YELLOW} />
    {[0, 1].map(i => <g key={i} transform={`translate(${44 + i * 130} 18)`}>
      <rect width="104" height="84" rx="8" fill={i ? ORANGE : PAPER} stroke={LINE} />
      <rect x="12" y="12" width="80" height="26" rx="4" fill={PAPER} stroke={LINE} />
      <T x={22} y={31} s={14} w={800}>{i ? "Size L" : "Size M"}</T>
      <T x={14} y={68} s={14} w={800} c={INK}>{i ? "Shipped" : "Ordered"}</T>
    </g>)}
    <circle cx="160" cy="60" r="12" fill={INK} /><path d="M155 55l10 10M165 55l-10 10" stroke={PAPER} strokeWidth="2.4" strokeLinecap="round" />
  </>;
}
function Board() {
  return <>
    <rect width="320" height="120" fill={PINK} />
    {[["To do", 2, PAPER], ["Waiting", 5, YELLOW], ["Done", 1, PAPER]].map(([n, c, f], i) => <g key={n as string} transform={`translate(${24 + i * 94} 12)`}>
      <rect width="84" height="98" rx="8" fill={f as string} stroke={LINE} />
      <T x={10} y={21} s={13} w={800}>{n as string}</T>
      {Array.from({ length: c as number }, (_, k) => <rect key={k} x="10" y={28 + k * 13} width="64" height="9" rx="3" fill={i === 1 ? ORANGE : LINE} />)}
    </g>)}
  </>;
}

function Rebalance() {
  const rows: [string, number, number][] = [["Stocks", 0.72, 0.55], ["Bonds", 0.2, 0.3], ["Cash", 0.08, 0.15]];
  return <>
    <rect width="320" height="120" fill={LILAC} />
    <rect x="20" y="12" width="280" height="96" rx="8" fill={PAPER} stroke={LINE} />
    <T x={32} y={32}>Now vs target</T>
    {rows.map(([n, now, target], i) => <g key={n}>
      <rect x="32" y={44 + i * 20} width="200" height="12" rx="6" fill={LINE} />
      <rect x="32" y={44 + i * 20} width={200 * now} height="12" rx="6" fill={i === 0 ? ORANGE : BLUE} />
      <line x1={32 + 200 * target} x2={32 + 200 * target} y1={40 + i * 20} y2={60 + i * 20} stroke={INK} strokeWidth="2.5" />
      <T x={242} y={55 + i * 20} s={13}>{n}</T>
    </g>)}
  </>;
}
function Counter() {
  return <>
    <rect width="320" height="120" fill={YELLOW} />
    <rect x="22" y="16" width="170" height="38" rx="12" fill={PAPER} stroke={LINE} />
    <T x={36} y={40} s={13}>We can offer $78k</T>
    <rect x="120" y="64" width="178" height="40" rx="12" fill={BLUE} />
    <T x={134} y={89} s={13} c={PAPER}>I can start at $92k</T>
    <rect x="22" y="72" width="80" height="24" rx="12" fill={PAPER} stroke={ORANGE} strokeWidth="2" />
    <T x={32} y={89} s={12} c={ORANGE}>floor $85k</T>
  </>;
}
function SealedBid() {
  return <>
    <rect width="320" height="120" fill={PINK} />
    <rect x="40" y="22" width="150" height="80" rx="8" fill={PAPER} stroke={LINE} />
    <path d="M40 30 L115 70 L190 30" fill="none" stroke={LINE} strokeWidth="2" />
    <T x={70} y={96}>Bid $412,000</T>
    <rect x="206" y="30" width="86" height="64" rx="8" fill={PAPER} />
    <T x={218} y={52} s={12}>Margin</T>
    <T x={218} y={80} s={22} w={800} c={BLUE}>12%</T>
  </>;
}
function Loan() {
  return <>
    <rect width="320" height="120" fill={LILAC} />
    <rect x="20" y="12" width="280" height="96" rx="8" fill={PAPER} stroke={LINE} />
    <T x={32} y={32}>Loan health</T>
    <rect x="32" y="48" width="256" height="16" rx="8" fill={LINE} />
    <rect x="32" y="48" width="64" height="16" rx="8" fill={ORANGE} />
    <rect x="96" y="48" width="70" height="16" fill={YELLOW} />
    <circle cx="112" cy="56" r="10" fill={INK} />
    <T x={32} y={92} s={13} c={ORANGE}>Liquidation</T>
    <T x={196} y={92} s={13} c={BLUE}>Add collateral</T>
  </>;
}
function Payroll() {
  return <>
    <rect width="320" height="120" fill={YELLOW} />
    <rect x="20" y="12" width="280" height="96" rx="8" fill={PAPER} stroke={LINE} />
    <T x={32} y={32}>Payroll days</T>
    {Array.from({ length: 13 }, (_, i) => <g key={i}>
      <rect x={32 + i * 20} y="46" width="16" height="16" rx="4" fill={i === 6 ? ORANGE : i % 2 ? LINE : BLUE} />
      {i % 2 === 0 && i !== 6 ? <path d={`M${36 + i * 20} 54 l3 3 l6 -6`} fill="none" stroke={PAPER} strokeWidth="2" strokeLinecap="round" /> : null}
    </g>)}
    <T x={32} y={92} s={13}>Week 7 is short by $6,400</T>
  </>;
}
function Concessions() {
  return <>
    <rect width="320" height="120" fill={PINK} />
    {[["Ask 30 days", BLUE], ["Give 45 days", YELLOW], ["Walk away", ORANGE]].map(([n, c], i) => <g key={n} transform={`translate(${24 + i * 92} ${62 - i * 20})`}>
      <rect width="88" height={40 + i * 20} rx="8" fill={c} stroke={LINE} />
      <T x={8} y={22} s={12} c={c === BLUE ? PAPER : INK}>{n}</T>
    </g>)}
  </>;
}
function Unlock() {
  const h = [30, 30, 30, 30, 30, 30, 30, 30];
  return <>
    <rect width="320" height="120" fill={LILAC} />
    <rect x="20" y="12" width="280" height="96" rx="8" fill={PAPER} stroke={LINE} />
    <T x={32} y={32}>Daily sells</T>
    {h.map((v, i) => <rect key={i} x={34 + i * 32} y={98 - v} width="22" height={v} rx="4" fill={BLUE} />)}
    <path d="M34 50 L90 48 L150 52 L210 49 L280 51" fill="none" stroke={ORANGE} strokeWidth="3" strokeLinecap="round" />
    <T x={210} y={32} s={12} c={ORANGE}>price holds</T>
  </>;
}
function CapTable() {
  return <>
    <rect width="320" height="120" fill={YELLOW} />
    <rect x="20" y="12" width="280" height="96" rx="8" fill={PAPER} stroke={LINE} />
    <T x={32} y={32}>Ownership after the round</T>
    <rect x="32" y="46" width="150" height="22" rx="4" fill={BLUE} /><rect x="182" y="46" width="70" height="22" fill={ORANGE} /><rect x="252" y="46" width="36" height="22" rx="4" fill={PINK} />
    <T x={32} y={92} s={13} c={BLUE}>Founders 58%</T>
    <T x={150} y={92} s={13} c={ORANGE}>Investors 28%</T>
  </>;
}
function DayRate() {
  return <>
    <rect width="320" height="120" fill={PINK} />
    <rect x="24" y="14" width="120" height="92" rx="8" fill={PAPER} stroke={LINE} />
    <rect x="24" y="14" width="120" height="26" rx="8" fill={BLUE} />
    <T x={52} y={32} c={PAPER}>1 day</T>
    <T x={44} y={80} s={24} w={800}>$640</T>
    <rect x="160" y="40" width="136" height="40" rx="20" fill={PAPER} stroke={ORANGE} strokeWidth="2" />
    <T x={176} y={65} s={14} c={ORANGE}>floor $520</T>
  </>;
}
function PerpFit() {
  const rows: [string, string, string][] = [["BTC long 8k", "ALLOW", BLUE], ["ETH long 17k", "WARN", YELLOW], ["SOL 12x", "BLOCK", ORANGE], ["Withdraw 15k", "BLOCK", ORANGE]];
  return <>
    <rect width="320" height="120" fill={YELLOW} />
    <rect x="20" y="10" width="280" height="100" rx="8" fill={PAPER} stroke={LINE} />
    <T x={32} y={28}>Agent orders</T>
    {rows.map(([n, v, c], i) => <g key={n}>
      <T x={32} y={48 + i * 18} s={12}>{n}</T>
      <rect x="214" y={37 + i * 18} width="72" height="15" rx="7.5" fill={c} stroke={c === YELLOW ? INK : c} />
      <T x={226} y={48 + i * 18} s={12} c={c === YELLOW ? INK : PAPER}>{v}</T>
    </g>)}
  </>;
}
function ScamScreen() {
  const rows = ["Sell fails in simulation", "Sell tax 99%", "Agent told to ignore checks"];
  return <>
    <rect width="320" height="120" fill={LILAC} />
    <rect x="20" y="12" width="280" height="96" rx="8" fill={PAPER} stroke={LINE} />
    <T x={32} y={32}>MOONPAY2</T>
    <rect x="212" y="18" width="76" height="22" rx="11" fill={ORANGE} />
    <T x={228} y={34} s={13} c={PAPER}>BLOCK</T>
    {rows.map((n, i) => <g key={n}>
      <circle cx="38" cy={53 + i * 18} r="5" fill={ORANGE} />
      <T x={50} y={57 + i * 18} s={12}>{n}</T>
    </g>)}
  </>;
}
function Robustness() {
  return <>
    <rect width="320" height="120" fill={LILAC} />
    <rect x="20" y="12" width="280" height="96" rx="8" fill={PAPER} stroke={LINE} />
    <T x={32} y={32}>Net per trade</T>
    <rect x="44" y="50" width="56" height="44" rx="4" fill={BLUE} />
    <rect x="124" y="88" width="56" height="6" rx="3" fill={ORANGE} />
    <line x1="34" x2="196" y1="94" y2="94" stroke={INK} strokeWidth="1.5" />
    <T x={44} y={46} s={12} c={BLUE}>Fitted</T>
    <T x={124} y={82} s={12} c={ORANGE}>Unseen</T>
    <rect x="208" y="44" width="80" height="26" rx="13" fill={ORANGE} />
    <T x={224} y={62} s={13} c={PAPER}>Fragile</T>
    <T x={208} y={90} s={12}>2 checks fail</T>
  </>;
}
function SwapSplit() {
  const rows: [string, number][] = [["Binance", 0.85], ["OKX", 0.59], ["Ref pool", 0.08], ["KuCoin", 0]];
  return <>
    <rect width="320" height="120" fill={PINK} />
    <rect x="20" y="12" width="280" height="96" rx="8" fill={PAPER} stroke={LINE} />
    <T x={32} y={30}>Agent sale plan</T>
    <rect x="212" y="18" width="76" height="18" rx="9" fill={YELLOW} stroke={INK} />
    <T x={230} y={31} s={12}>WARN</T>
    {rows.map(([n, v], i) => <g key={n}>
      <T x={32} y={51 + i * 16} s={12}>{n}</T>
      {v > 0 ? <rect x="108" y={42 + i * 16} width={Math.max(6, 170 * v)} height="10" rx="5" fill={BLUE} /> : <T x={108} y={51 + i * 16} s={12} c={ORANGE}>Blocked, not approved</T>}
    </g>)}
  </>;
}
const ART: Record<string, () => React.ReactElement> = {
  "portfolio-rebalance": Rebalance, "salary-counteroffer": Counter, "tender-bid": SealedBid, "defi-liquidation-guard": Loan,
  "cash-runway-13w": Payroll, "supplier-concession-plan": Concessions, "token-unlock-sell-plan": Unlock, "term-sheet-dilution": CapTable,
  "scientivanmsk-freelance-rate": DayRate,
  "perp-risk-limit-fit": PerpFit, "strategy-robustness-audit": Robustness, "large-swap-split": SwapSplit, "token-scam-screen": ScamScreen,
  "upcoming-offer-counter": Offer, "upcoming-tender-margin": Tender, "upcoming-contract-check": Contract,
  "upcoming-payroll-cash": Cash, "upcoming-wrong-orders": Orders, "upcoming-bottleneck": Board,
};
export const hasUseCaseArt = (id: string) => id in ART;
export function UseCaseArt({ id }: { id: string }) {
  const Scene = ART[id];
  if (!Scene) return null;
  return <svg className="usecase-art" viewBox="0 0 320 120" role="presentation" aria-hidden="true" preserveAspectRatio="xMidYMid slice"><Scene /></svg>;
}
