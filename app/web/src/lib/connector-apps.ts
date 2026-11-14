import { BRAND_ICONS } from "./brand-icons";

/**
 * Apps a method may read from. Every connection in this build is a labelled mock with synthetic data.
 * `connector` names the mock the private runner already serves. Apps without one are listed as coming soon.
 */
export type ConnectorApp = { id: string; name: string; brand?: keyof typeof BRAND_ICONS; connector?: string; use: string };
export const CONNECTOR_APPS: ConnectorApp[] = [
  { id: "google-sheets", name: "Google Sheets", brand: "googlesheets", connector: "sheets_mock", use: "Cash planning and portfolio methods read your sheets. The sample sheet is synthetic." },
  { id: "google-docs", name: "Google Docs", brand: "googledocs", connector: "docs_mock", use: "Contract and tender methods read your drafts. The sample documents are synthetic." },
  { id: "gmail", name: "Gmail", brand: "gmail", use: "Offer and order review methods will read the emails you choose." },
  { id: "google-drive", name: "Google Drive", brand: "googledrive", use: "Methods will find the files you point them to." },
  { id: "google-calendar", name: "Google Calendar", brand: "googlecalendar", use: "Workload methods will read how your week is booked." },
  { id: "google-meet", name: "Google Meet", brand: "googlemeet", use: "Negotiation methods will read the notes of calls you pick." },
  { id: "notion", name: "Notion", brand: "notion", use: "Workflow methods will read your task boards and pages." },
  { id: "slack", name: "Slack", brand: "slack", use: "Operations methods will read the channels you allow." },
  { id: "zoom", name: "Zoom", brand: "zoom", use: "Negotiation methods will read the transcripts you choose." },
  { id: "telegram", name: "Telegram", brand: "telegram", use: "You will get approval requests from a bot of your own." },
  // Web3 trading platforms. None is connected in this build: the trading methods take numbers you type
  // or paste, and every connection below would be read only, with no order, withdrawal or transfer.
  { id: "binance", name: "Binance", brand: "binance", use: "Risk-limit and trade-split methods will read your futures positions and order book depth, read only." },
  { id: "okx", name: "OKX", brand: "okx", use: "Risk-limit methods will read your perp positions and margins, read only." },
  { id: "coinbase", name: "Coinbase", brand: "coinbase", use: "Strategy review methods will read the fills you export, read only." },
  { id: "kucoin", name: "KuCoin", brand: "kucoin", use: "Trade-split methods will read order book depth for the pair you pick." },
  { id: "near-wallet", name: "NEAR wallet", brand: "near", use: "Exit and risk methods will read token balances of the accounts you choose, read only." },
  { id: "walletconnect", name: "WalletConnect", brand: "walletconnect", use: "Methods will read balances from an EVM wallet you connect, without signing anything." },
  { id: "tradingview", name: "TradingView", brand: "tradingview", use: "Strategy review methods will read the trade list you export from a backtest." },
];
/** Mock connectors that are not third-party apps. Kept for the methods that already use them. */
export const DEMO_CONNECTORS: Record<string, string> = { broker_mock: "Demo broker", wallet_mock: "Demo lending wallet" };
export const appForConnector = (connector: string) => CONNECTOR_APPS.find(a => a.connector === connector);
export const connectorLabel = (connector: string) => appForConnector(connector)?.name || DEMO_CONNECTORS[connector] || connector;
