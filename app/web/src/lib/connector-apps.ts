import { BRAND_ICONS } from "./brand-icons";

/**
 * Apps a method may read from. Every connection in this build is a labelled mock with synthetic data.
 * `connector` names the mock the private runner already serves. Apps without one are listed as coming soon.
 */
export type ConnectorApp = { id: string; name: string; category: "web3" | "web2"; brand?: keyof typeof BRAND_ICONS; icon?: string; connector?: string; use: string };
// web3-first ordering: wallets, exchanges and the demo trading mocks come first, then Web2 work apps.
export const CONNECTOR_APPS: ConnectorApp[] = [
  // Web3 first. No real wallet or exchange is connected in this build: the trading methods take numbers
  // you type or paste, and every connection below would be read only, with no order, withdrawal or transfer.
  // TradingView sits here because its only use is reading trades exported from a trading backtest.
  { id: "near-wallet", name: "NEAR wallet", category: "web3", brand: "near", use: "Exit and risk methods will read token balances of the accounts you choose, read only." },
  { id: "walletconnect", name: "WalletConnect", category: "web3", brand: "walletconnect", use: "Methods will read balances from an EVM wallet you connect, without signing anything." },
  { id: "binance", name: "Binance", category: "web3", brand: "binance", use: "Risk-limit and trade-split methods will read your futures positions and order book depth, read only." },
  { id: "okx", name: "OKX", category: "web3", brand: "okx", use: "Risk-limit methods will read your perp positions and margins, read only." },
  { id: "coinbase", name: "Coinbase", category: "web3", brand: "coinbase", use: "Strategy review methods will read the fills you export, read only." },
  { id: "kucoin", name: "KuCoin", category: "web3", brand: "kucoin", use: "Trade-split methods will read order book depth for the pair you pick." },
  { id: "tradingview", name: "TradingView", category: "web3", brand: "tradingview", use: "Strategy review methods will read the trade list you export from a backtest." },
  { id: "demo-broker", name: "Demo broker", category: "web3", icon: "m-chart", connector: "broker_mock", use: "Exit and risk methods read sample positions and prices. Every number is synthetic." },
  { id: "wallet-allowance", name: "Wallet allowance", category: "web3", icon: "wallet", use: "Your AI agent pays from a sandbox sub-account funded with only the cap. The allowance guard checks every payment; you approve each one." },
  { id: "demo-lending-wallet", name: "Demo lending wallet", category: "web3", icon: "wallet", connector: "wallet_mock", use: "The liquidation guard reads a sample loan and its collateral. Every number is synthetic." },
  { id: "google-sheets", name: "Google Sheets", category: "web2", brand: "googlesheets", connector: "sheets_mock", use: "Cash planning and portfolio methods read your sheets. The sample sheet is synthetic." },
  { id: "google-docs", name: "Google Docs", category: "web2", brand: "googledocs", connector: "docs_mock", use: "Contract and tender methods read your drafts. The sample documents are synthetic." },
  { id: "gmail", name: "Gmail", category: "web2", brand: "gmail", use: "Offer and order review methods will read the emails you choose." },
  { id: "google-drive", name: "Google Drive", category: "web2", brand: "googledrive", use: "Methods will find the files you point them to." },
  { id: "google-calendar", name: "Google Calendar", category: "web2", brand: "googlecalendar", use: "Workload methods will read how your week is booked." },
  { id: "google-meet", name: "Google Meet", category: "web2", brand: "googlemeet", use: "Negotiation methods will read the notes of calls you pick." },
  { id: "notion", name: "Notion", category: "web2", brand: "notion", use: "Workflow methods will read your task boards and pages." },
  { id: "slack", name: "Slack", category: "web2", brand: "slack", use: "Operations methods will read the channels you allow." },
  { id: "zoom", name: "Zoom", category: "web2", brand: "zoom", use: "Negotiation methods will read the transcripts you choose." },
  { id: "telegram", name: "Telegram", category: "web2", brand: "telegram", use: "You will get approval requests from a bot of your own." },
];
/** Mock connectors that are not third-party apps. Kept for the methods that already use them. */
export const DEMO_CONNECTORS: Record<string, string> = { broker_mock: "Demo broker", wallet_mock: "Demo lending wallet" };
// web3-first ordering
export const appForConnector = (connector: string) => CONNECTOR_APPS.find(a => a.connector === connector);
export const connectorLabel = (connector: string) => appForConnector(connector)?.name || DEMO_CONNECTORS[connector] || connector;
