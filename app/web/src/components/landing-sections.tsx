"use client";
import { useEffect, useRef, useState } from "react";
import { BRAND_ICONS } from "../lib/brand-icons";
import { CONNECTOR_APPS } from "../lib/connector-apps";
import "./landing-sections.css";
import { UseCaseArt } from "./use-case-art";
const app = "https://app.kalis.scientivan.dev";
function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}
function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}
function Mark({ brand }: { brand: string }) {
  const b = BRAND_ICONS[brand];
  return b ? (
    <svg className="sn-brand-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path d={b.path} fill={b.hex} stroke="none" />
    </svg>
  ) : null;
}
const FAQ_ITEMS = [
  [
    "Is this real money?",
    "Kalis uses NEAR testnet settlement. Fiat top-ups and available app connectors are labelled mocks.",
  ],
  [
    "Can I connect my apps?",
    "Google Sheets and Google Docs are demo connectors using synthetic data. Other integrations are coming soon.",
  ],
  [
    "What does Kalis protect?",
    "Kalis provides the execution, privacy and permission controls around a method, rather than guaranteeing its business outcome. Core runs use sealed inputs in an OutLayer TEE, but hardware certificate-chain verification remains incomplete and prompt outputs can still disclose information.",
  ],
  [
    "Why buy a method instead of asking an AI?",
    "You pay for an expert’s approach, rules or strategy and a controlled way to run it on private data. Some methods use AI and others are programs, but Kalis does not promise that every method outperforms an ordinary AI prompt.",
  ],
  [
    "Who is responsible for the method’s quality?",
    "The author defines the approach and its intended use, while Kalis supplies the execution and permission framework. Review the author, sample output, limits and available test evidence before buying a run.",
  ],
  [
    "Can the expert read my private inputs?",
    "Core execution takes sealed inputs into the protected runner, rather than sending plaintext inputs to the expert. Review each method’s declared permissions and any separate document-processing disclosures before you run it.",
  ],
  [
    "Do I receive the expert’s private source?",
    "You buy a run of the published version, not a copy of its private program or prompt. Sealing does not guarantee that repeated outputs can never reveal parts of an approach.",
  ],
  [
    "Where are my saved notes and documents kept?",
    "Owner-vault notes and documents are encrypted in your browser with a device key, so the backend does not receive their contents through that storage path. The vault is tied to that browser, with no account-wide recovery or multi-device sync yet.",
  ],
  [
    "Can an AI method freely spend from my wallet?",
    "The wallet guard example uses a separately funded sandbox and checks proposed actions against the owner’s policy before exact-action approval and manual signing. The recorded testnet demonstration does not give the agent your main wallet key or prove protection against every possible attack.",
  ],
  [
    "What happens if a run fails?",
    "A technical stage failure can trigger a refund, and a timeout can allow reclaim under the contract’s terms. Those mechanisms are separate from a dispute about answer quality, and device checks alone do not release or refund escrow.",
  ],
  [
    "Does using a method let the community test on my data?",
    "A normal run does not grant private testing or training access. Testing a private case requires separate permission for the candidate and purpose, with expiry, attempt limits and restricted output.",
  ],
  [
    "Does Kalis guarantee a good result?",
    "No. Declared checks evaluate computable conditions. They do not guarantee financial returns, procurement success or expert quality.",
  ],
];
const FAQ_GROUPS = [
  { name: "Getting started", items: [0, 1, 9] },
  { name: "Methods", items: [3, 4, 6, 11] },
  { name: "Privacy", items: [2, 5, 7] },
  { name: "Wallet & consent", items: [8, 10] },
];
function ProductFAQ() {
  const [category, setCategory] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="sn-faq-browser">
      <div
        className="sn-faq-categories"
        role="group"
        aria-label="FAQ categories"
      >
        {FAQ_GROUPS.map((group, i) => (
          <button
            key={group.name}
            aria-pressed={category === i}
            onClick={() => {
              setCategory(i);
              setOpen(null);
            }}
          >
            {group.name}
            <span>{group.items.length}</span>
          </button>
        ))}
      </div>
      <div
        className="sn-faq-list"
        aria-label={FAQ_GROUPS[category].name + " questions"}
      >
        {FAQ_GROUPS[category].items.map((i) => (
          <div className="sn-faq-item" key={i}>
            <h3>
              <button
                id={"faq-question-" + i}
                aria-expanded={open === i}
                aria-controls={"faq-answer-" + i}
                onClick={() => setOpen((v) => (v === i ? null : i))}
              >
                {FAQ_ITEMS[i][0]}
                <span aria-hidden="true">{open === i ? "−" : "+"}</span>
              </button>
            </h3>
            <div
              id={"faq-answer-" + i}
              role="region"
              aria-labelledby={"faq-question-" + i}
              hidden={open !== i}
            >
              <p>{FAQ_ITEMS[i][1]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function MethodJourneyStory() {
  const root = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(-1);
  const [mode, setMode] = useState<"guard" | "portfolio">("guard");
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    let started = false;
    setProgress(-1);
    const show = () => {
      if (media.matches) {
        setProgress(8);
        return;
      }
      if (started) return;
      started = true;
      setProgress(0);
      let step = 0;
      timer = setInterval(() => {
        step++;
        setProgress(step);
        if (step === 8) clearInterval(timer);
      }, 1150);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) show();
      },
      { threshold: 0.2 },
    );
    observer.observe(el.querySelector(".wg-intro") || el);
    media.addEventListener("change", show);
    return () => {
      observer.disconnect();
      clearInterval(timer);
      media.removeEventListener("change", show);
    };
  }, [mode]);
  const tx = "9EnSucxUDD4r2cMqaptt6i39nAu3jDMTAbva2FKMjCTg";
  const core = [
    {
      title: "Set the limit",
      body: (
        <>
          <div className="wg-value">
            0.15 <small>NEAR / week</small>
          </div>
          <div className="wg-policy">
            <span>0.05 NEAR per payment</span>
            <span>Approved recipients only</span>
            <span>Contract and method scopes</span>
            <span>Expiry date</span>
          </div>
        </>
      ),
    },
    {
      title: "Fund a separate wallet",
      body: (
        <>
          <div className="wg-wallet">
            <span>Main wallet</span>
            <strong>Keys stay with you</strong>
          </div>
          <Arrow />
          <div className="wg-wallet is-sandbox">
            <span>Sandbox balance</span>
            <strong>0.15 NEAR</strong>
          </div>
          <a
            className="wg-proof"
            href="https://testnet.nearblocks.io/address/allowance.auth-test.scientivan.testnet"
            target="_blank"
            rel="noreferrer"
          >
            View sandbox account
            <Arrow />
          </a>
        </>
      ),
    },
    {
      title: "AI proposes payments",
      body: (
        <div className="wg-requests">
          <div>
            <span>a1</span>
            <strong>Pay an approved invoice</strong>
          </div>
          <div className="is-suspicious">
            <span>a2</span>
            <strong>Drain to an unknown account</strong>
            <small>Untrusted claim “owner approved”</small>
          </div>
          <div>
            <span>a3</span>
            <strong>A payment outside the goal</strong>
          </div>
        </div>
      ),
    },
    {
      title: "The guard checks",
      body: (
        <>
          <div className="wg-layers">
            <span>Structural checks</span>
            <span>Private AI review</span>
            <strong>Policy has final authority</strong>
          </div>
          <div className="wg-verdicts">
            <span>
              a1 <b>ALLOW</b>
            </span>
            <span>
              a2 <b>BLOCK</b>
            </span>
            <span>
              a3 <b>WARN</b>
            </span>
          </div>
          <div className="wg-proof-label">Inside the protected runner</div>
        </>
      ),
    },
    {
      title: "Approve within the limit",
      body: (
        <>
          <div className="wg-payment">
            <span>Approved payment</span>
            <strong>0.02 NEAR</strong>
            <a
              href={"https://testnet.nearblocks.io/txns/" + tx}
              target="_blank"
              rel="noreferrer"
            >
              9EnSuc…jCTg
              <Arrow />
            </a>
          </div>
          <div className="wg-rejected">
            <strong>1 NEAR rejected</strong>
            <span>Network balance limit</span>
          </div>
          <div className="wg-proof-label">Exact action approval required</div>
        </>
      ),
    },
  ];
  const guardCards = [
    {
      title: "Find the method",
      body: (
        <>
          <div className="wg-wallet">
            <span>Kalis marketplace</span>
            <strong>Wallet Allowance Guard</strong>
          </div>
          <div className="wg-policy">
            <span>Expert’s private method</span>
            <span>Inputs, permissions and price</span>
          </div>
          <div className="wg-proof-label">One example from the marketplace</div>
        </>
      ),
    },
    {
      title: "Sign in with your wallet",
      body: (
        <>
          <div className="wg-wallet">
            <span>Your NEAR testnet account</span>
            <strong>Review wallet sign-in</strong>
          </div>
          <div className="wg-layers">
            <span>Open Connectors</span>
            <strong>Set up a wallet allowance</strong>
          </div>
          <div className="wg-proof-label">You review setup in your wallet</div>
        </>
      ),
    },
    core[0],
    core[1],
    {
      title: "Prepare and start the run",
      body: (
        <>
          <div className="wg-policy">
            <span>Your goal and proposed actions</span>
            <span>Private policy and spending context</span>
            <span>Review permissions and exact cost</span>
          </div>
          <div className="wg-wallet">
            <span>Authorize the method run</span>
            <strong>Seal inputs and review payment</strong>
          </div>
          <div className="wg-proof-label">
            Method fee is separate from agent spending
          </div>
        </>
      ),
    },
    core[2],
    core[3],
    core[4],
    {
      title: "Keep the result and receipt",
      body: (
        <>
          <div className="wg-wallet">
            <span>Your run result</span>
            <strong>Verdicts and device checks</strong>
          </div>
          <div className="wg-wallet">
            <span>Your authorized payment</span>
            <strong>Transaction receipt</strong>
          </div>
          <div className="wg-policy">
            <span>Run and settlement history</span>
            <span>Method fee supports the expert and community</span>
          </div>
        </>
      ),
    },
  ];
  const portfolioCards = [
    {
      title: "Find the method",
      labels: [
        "Kalis marketplace",
        "Portfolio Rebalancing",
        "Review the expert’s method and limits",
      ],
    },
    {
      title: "Sign in to Kalis",
      labels: [
        "Your NEAR testnet wallet",
        "Review sign-in",
        "Choose the published method version",
      ],
    },
    {
      title: "Bring your portfolio",
      labels: [
        "Private holdings and cash",
        "Asset prices and transaction costs",
        "Fictional sample data in the demo",
      ],
    },
    {
      title: "Set your constraints",
      labels: [
        "Target allocation ranges",
        "Minimum cash reserve and sector cap",
        "Whole-unit buy and sell limits",
      ],
    },
    {
      title: "Review the run",
      labels: [
        "Version and permissions",
        "Exact method and network cost",
        "Review consent before payment",
      ],
    },
    {
      title: "Seal and start",
      labels: [
        "Inputs sealed on your device",
        "Review and sign the method payment",
        "Protected execution reads the data",
      ],
    },
    {
      title: "Find a feasible plan",
      labels: [
        "Search permitted whole-unit trades",
        "Minimize transaction cost within limits",
        "Report infeasible if no plan fits",
      ],
    },
    {
      title: "Open and check",
      labels: [
        "Synthetic example, sell 3 A and buy 2 C",
        "Your device checks allocation and cash rules",
        "A plan to review, no trades placed",
      ],
    },
    {
      title: "Keep the run record",
      labels: [
        "Result and execution record",
        "Settlement or applicable recovery status",
        "Method fee supports expert and community",
      ],
    },
  ].map((step, i) => ({
    title: step.title,
    body: (
      <>
        <div className="wg-wallet">
          <span>
            {i === 7
              ? "Synthetic output illustration"
              : "Portfolio Rebalancing"}
          </span>
          <strong>{step.labels[0]}</strong>
        </div>
        <div className="wg-policy">
          {step.labels.slice(1).map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        {i === 7 && (
          <div className="wg-proof-label">
            Illustrative cost 0.18, cash after 8.82
          </div>
        )}
      </>
    ),
  }));
  const cards = mode === "guard" ? guardCards : portfolioCards;
  return (
    <div ref={root} className="wg-story">
      <div className="sn-intro wg-intro">
        <h2>
          One method in action.
          <br />
          {mode === "guard"
            ? "Wallet Allowance Guard."
            : "Portfolio Rebalancing."}
        </h2>
        <p>
          Two examples of expert methods on Kalis. Choose a journey to read from
          the first step to the result, without entering any private data.
        </p>
      </div>
      <div
        className="wg-method-switch"
        role="group"
        aria-label="Choose a method explanation"
      >
        <button
          aria-pressed={mode === "guard"}
          onClick={() => setMode("guard")}
        >
          Wallet Allowance Guard
        </button>
        <button
          aria-pressed={mode === "portfolio"}
          onClick={() => setMode("portfolio")}
        >
          Portfolio Rebalancing
        </button>
      </div>
      <div
        className="wg-flow wg-journey"
        aria-label={
          mode === "guard"
            ? "Wallet guard journey from discovery to payment receipt"
            : "Portfolio journey from discovery to checked result"
        }
      >
        {cards.map((card, i) => (
          <div className="wg-flow-item" key={card.title}>
            <article
              className={`wg-step ${progress >= i ? "is-reached" : ""} ${progress === i ? "is-current" : ""}`}
              aria-label={"Step " + (i + 1) + " " + card.title}
            >
              <div className="wg-step-head">
                <span>{i + 1}</span>
                <h3>{card.title}</h3>
              </div>
              <div className="wg-fragment">{card.body}</div>
            </article>
            {i < cards.length - 1 && (
              <svg
                className={`wg-connector ${progress > i ? "is-reached" : ""}`}
                viewBox="0 0 40 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M2 12h34m-7-7 7 7-7 7" />
              </svg>
            )}
          </div>
        ))}
      </div>
      <div className="wg-foot">
        <div className="wg-actions">
          <a
            className="sn-action"
            href={
              app +
              "/marketplace/" +
              (mode === "guard"
                ? "wallet-allowance-guard"
                : "portfolio-rebalance")
            }
          >
            {mode === "guard" ? "Try the guard" : "View the portfolio method"}
            <Arrow />
          </a>
        </div>
      </div>
    </div>
  );
}
function FlowExplorer({
  items,
}: {
  items: { title: string; detail: string }[];
}) {
  const [selected, setSelected] = useState(0);
  return (
    <div className="sn-flow-explorer">
      <div className="sn-flow-progress" aria-hidden="true">
        <span
          style={{ transform: `scaleX(${selected / (items.length - 1)})` }}
        />
      </div>
      <div
        className="sn-flow-nodes"
        role="group"
        aria-label="Explore the process"
      >
        {items.map((item, i) => (
          <button
            key={item.title}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
          >
            <span className="sn-flow-dot" aria-hidden="true">
              {i + 1}
            </span>
            <span>{item.title}</span>
          </button>
        ))}
      </div>
      <div className="sn-flow-detail" key={selected}>
        <strong>{items[selected].title}</strong>
        <p>{items[selected].detail}</p>
      </div>
      <button
        className="sn-flow-next"
        onClick={() => setSelected((i) => (i + 1) % items.length)}
      >
        Explore {items[(selected + 1) % items.length].title.toLowerCase()}
        <Arrow />
      </button>
    </div>
  );
}
export function LandingSections() {
  const root = useRef<HTMLDivElement>(null);
  const [motion, setMotion] = useState(true);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => setMotion(!media.matches);
    reduce();
    media.addEventListener("change", reduce);
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("sn-seen");
          e.target.classList.toggle("sn-offscreen", !e.isIntersecting);
        }),
      { threshold: 0.15 },
    );
    el.querySelectorAll(
      "[data-reveal],.sn-marquee,.sn-fund-visual,.sn-demo",
    ).forEach((n) => observer.observe(n));
    const visibility = () => el.classList.toggle("sn-hidden", document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      media.removeEventListener("change", reduce);
    };
  }, []);
  return (
    <div ref={root} className={`sn ${motion ? "sn-motion" : "sn-still"}`}>
      <section
        id="technology"
        className="sn-integrations"
        aria-label="Technology and connector catalog"
      >
        <div className="sn-built">
          <span>Built with</span>
          <a href="https://near.org/" target="_blank" rel="noreferrer">
            <Mark brand="near" />
            NEAR<small>Testnet settlement</small>
          </a>
          <a href="https://near.ai/" target="_blank" rel="noreferrer">
            <Mark brand="near" />
            NEAR AI<small>Private AI inference</small>
          </a>
          <span className="sn-tech">
            OutLayer<small>Protected execution</small>
          </span>
          <span className="sn-tech">
            WebAssembly<small>Sandboxed methods</small>
          </span>
        </div>
        <div className="sn-marquee" aria-label="Connector catalog">
          <div className="sn-marquee-track">
            {[0, 1].map((copy) => (
              <div
                className="sn-marquee-row"
                key={copy}
                aria-hidden={copy === 1 ? true : undefined}
              >
                {CONNECTOR_APPS.slice(0, 10).map((a) => (
                  <a
                    href={app + "/connectors"}
                    key={a.id}
                    tabIndex={copy === 1 ? -1 : 0}
                  >
                    <Mark brand={a.brand || ""} />
                    <span>
                      {a.name}
                      <small>
                        {a.connector ? "Demo connector" : "Coming soon"}
                      </small>
                    </span>
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="methods" className="sn-market sn-band">
        <div className="sn-intro" data-reveal>
          <h2>
            One marketplace.
            <br />
            Expertise on both sides.
          </h2>
          <p>
            Experts sell access to their private methods. Buyers use that
            expertise on sensitive data without handing their inputs to the
            expert.
          </p>
        </div>
        <div className="sn-trade-overview">
          <div className="sn-trade-side">
            <svg
              className="sn-trade-art"
              viewBox="0 0 240 84"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="66"
                y="22"
                width="100"
                height="54"
                rx="8"
                fill="#dce1f5"
                stroke="#0038ff"
              />
              <rect
                x="75"
                y="13"
                width="100"
                height="54"
                rx="8"
                fill="white"
                stroke="#0038ff"
              />
              <rect
                x="84"
                y="4"
                width="100"
                height="54"
                rx="8"
                fill="#0038ff"
              />
              <path
                d="m106 22-9 9 9 9m55-18 9 9-9 9m-23-21-9 25"
                stroke="white"
                strokeWidth="2.5"
              />
            </svg>
            <span>The expert brings</span>
            <strong>A private method</strong>
            <small>Expertise without distributing the source</small>
          </div>
          <div className="sn-trade-meeting">
            <Arrow />
            <img
              src="/landing/kalis-logo.svg"
              alt="Kalis"
              width="113"
              height="40"
            />
            <Arrow />
            <span>Protected execution</span>
          </div>
          <div className="sn-trade-side">
            <svg
              className="sn-trade-art"
              viewBox="0 0 240 84"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="75"
                y="5"
                width="100"
                height="72"
                rx="7"
                fill="white"
                stroke="#0038ff"
              />
              <path
                d="M89 21h42M89 34h72M89 48h72M89 62h72M132 34v28"
                stroke="#9fa9f5"
                strokeWidth="2"
              />
              <rect
                x="140"
                y="39"
                width="15"
                height="4"
                rx="2"
                fill="#0038ff"
              />
              <rect
                x="140"
                y="53"
                width="15"
                height="4"
                rx="2"
                fill="#0038ff"
              />
            </svg>
            <span>The buyer brings</span>
            <strong>Their private context</strong>
            <small>A useful answer without exposing sensitive inputs</small>
          </div>
        </div>
        <div className="sn-market-content">
          <div className="sn-other-methods">
            <h3>Explore methods.</h3>
            <div className="sn-method-examples">
              {[
                {
                  id: "wallet-allowance-guard",
                  name: "Wallet Allowance Guard",
                  context: "Private policy and controlled AI payments",
                },
                {
                  id: "portfolio-rebalance",
                  name: "Portfolio Rebalancing",
                  context: "Private holdings and allocation limits",
                },
                {
                  id: "tender-bid",
                  name: "Tender Bid Pricing",
                  context: "Private costs and minimum margin",
                },
              ].map((m) => (
                <a key={m.id} href={app + "/marketplace/" + m.id}>
                  <div>
                    {m.id === "wallet-allowance-guard" ? (
                      <div className="sn-guard-thumb">
                        <span>Allowance</span>
                        <strong>0.15 NEAR</strong>
                      </div>
                    ) : (
                      <UseCaseArt id={m.id} />
                    )}
                  </div>
                  <span>
                    <strong>{m.name}</strong>
                    <small>{m.context}</small>
                  </span>
                  <Arrow />
                </a>
              ))}
            </div>
            <a className="sn-action sn-copy-gap" href={app + "/marketplace"}>
              Explore the marketplace
              <Arrow />
            </a>
          </div>
          <div className="sn-visibility-panel">
            <h3>From permission to payment</h3>
            <dl className="sn-terms">
              <div>
                <dt>Owner sets</dt>
                <dd>Allowance, recipient list, per-payment cap and expiry</dd>
              </div>
              <div>
                <dt>AI proposes</dt>
                <dd>An action for the guard to check</dd>
              </div>
              <div>
                <dt>Owner approves</dt>
                <dd>The exact permitted action before manual signing</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
      <section id="how" className="sn-how sn-band">
        <MethodJourneyStory />
      </section>
      <section
        id="together"
        className="sn-community sn-band sn-shared-cycle"
        data-reveal
      >
        <div>
          <h2>
            A clear run.
            <br />A better next version.
          </h2>
          <p>
            Review the version, permissions and cost before you run. Method fees
            reward the expert and help fund reviewed improvements. Your private
            cases need separate testing permission.
          </p>
          <a className="sn-action sn-copy-gap" href={app + "/community"}>
            Explore the community
            <Arrow />
          </a>
          <div className="sn-compact-links">
            <a href={app + "/marketplace"}>Published methods</a>
            <a href={app + "/community/bounties"}>Paid improvements</a>
          </div>
        </div>
        <div className="sn-visibility-panel">
          <h3>From your run to shared progress.</h3>
          <FlowExplorer
            items={[
              {
                title: "Review",
                detail:
                  "Choose a published version and review its inputs, permissions and exact cost.",
              },
              {
                title: "Run",
                detail:
                  "Open the result and inspect device checks, with payment handled through NEAR escrow.",
              },
              {
                title: "Improve",
                detail:
                  "A share of the method fee can fund a bounty, reviewed contribution and separately permitted private tests.",
              },
              {
                title: "Version",
                detail:
                  "An accepted contribution can become a linked version with attribution, ready for the next buyer.",
              },
            ]}
          />
          <div className="sn-compact-allocation">
            <strong>Illustrative method fee split</strong>
            <div>
              <span>Expert 80%</span>
              <span>Platform 10%</span>
              <span>Community 10%</span>
            </div>
            <small>
              Community share ≥10% per version, compute and network separate
            </small>
          </div>
          <details className="sn-more">
            <summary>Payment, privacy and evidence limits</summary>
            <p>
              Stage failure refunds and timeout reclaim are separate from
              quality disputes. An unsigned payout request is not a completed
              payment.
            </p>
            <p>
              Private tests require candidate-specific consent, output
              restrictions, expiry and attempt limits. An ordinary run does not
              grant training or testing access.
            </p>
            <p>
              Repeat usage, willingness to pay and business sustainability still
              need validation.
            </p>
          </details>
        </div>
      </section>
      <section className="sn-questions sn-band">
        <h2>Before you try it.</h2>
        <ProductFAQ />
      </section>
      <section className="sn-final sn-band">
        <h2>
          Expertise worth using.
          <br />
          Context worth protecting.
        </h2>
        <p>Explore the Kalis prototype on NEAR testnet.</p>
        <a className="sn-action" href={app + "/marketplace"}>
          Find your method
          <Arrow />
        </a>
      </section>
      <footer className="sn-footer">
        <div className="sn-footer-brand">
          <a href="/landing" aria-label="Kalis home">
            <img
              src="/landing/kalis-logo.svg"
              alt="Kalis"
              width="141"
              height="50"
            />
          </a>
          <strong>Private methods. Shared progress.</strong>
          <p>
            Kalis connects experts who want to sell access to their private
            methods with people who need that expertise for sensitive work.
            Buyers keep control of their data, while a share of method fees
            helps the community fund reviewed improvements.
          </p>
        </div>
        <nav aria-label="Use Kalis">
          <strong>Use Kalis</strong>
          <a href={app + "/marketplace"}>Explore methods</a>
          <a href="#how">How it works</a>
          <a href={app + "/connectors"}>Connectors</a>
          <a href={app}>Open app</a>
        </nav>
        <nav aria-label="Build together">
          <strong>Build together</strong>
          <a href={app + "/community"}>Community fund</a>
          <a href={app + "/community/proposals"}>Proposals</a>
          <a href={app + "/community/bounties"}>Paid improvements</a>
          <a href={app + "/community/issues"}>Issues</a>
        </nav>
      </footer>
    </div>
  );
}
