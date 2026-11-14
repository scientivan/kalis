/**
 * Methods planned around the connector apps. They are not registered on chain and cannot be bought yet.
 * Each one follows rancangan sections 32 and 45: named by the result, built on data whose leak hurts,
 * and backed by expertise the seller would not publish without protection.
 */
export type UpcomingMethod = { id: string; title: string; outcome: string; kind: "Program" | "Prompt" | "Program + AI"; apps: string[]; privateData: string; expertise: string; category: string };
export const UPCOMING_METHODS: UpcomingMethod[] = [
  { id: "upcoming-offer-counter", title: "Answer a job offer without going below your floor", kind: "Program + AI", apps: ["gmail", "googledocs"], category: "Salary and offers",
    outcome: "Reads the offer emails you pick and drafts a counteroffer that never reveals your current pay or other offers.",
    privateData: "Your salary, competing offers and the lowest number you would accept.",
    expertise: "A recruiter's playbook of which terms move and in what order." },
  { id: "upcoming-tender-margin", title: "Price a tender bid that keeps your minimum margin", kind: "Program", apps: ["googlesheets", "googledocs"], category: "Tenders and contracts",
    outcome: "Reads your cost sheet and the tender document, then proposes a bid and the concessions you can afford.",
    privateData: "Your unit costs, margin floor and the bid before it is submitted.",
    expertise: "A procurement specialist's pricing rules for this kind of tender." },
  { id: "upcoming-contract-check", title: "Check a contract draft against your walk-away terms", kind: "Program + AI", apps: ["googledrive", "googledocs"], category: "Tenders and contracts",
    outcome: "Finds clauses that break the limits you set, quotes them, and suggests replacement wording to send back.",
    privateData: "The draft contract and the terms you will not accept.",
    expertise: "A lawyer's clause checklist that is their paid work product." },
  { id: "upcoming-payroll-cash", title: "Plan 13 weeks of cash when payroll is at risk", kind: "Program", apps: ["googlesheets", "gmail"], category: "Business cash",
    outcome: "Builds a week by week cash plan from your balances and unpaid invoices, and shows which payments to move first.",
    privateData: "Bank balances, debts, overdue invoices and payroll dates.",
    expertise: "A turnaround adviser's rules for ordering payments under pressure." },
  { id: "upcoming-wrong-orders", title: "Find why orders keep shipping wrong", kind: "Program + AI", apps: ["gmail", "slack", "googlesheets"], category: "Operations",
    outcome: "Matches complaints with packing logs, compares likely causes with evidence, and gives one check to add and how to measure it.",
    privateData: "Customer complaints, order data and your team's internal messages.",
    expertise: "An operations consultant's diagnosis steps for repeated fulfilment errors." },
  { id: "upcoming-bottleneck", title: "See whether you need to hire or unblock approvals first", kind: "Program", apps: ["notion", "googlecalendar"], category: "Operations",
    outcome: "Separates active work from waiting time in your task history and shows where work stalls before you add people.",
    privateData: "Task history, approval delays and team capacity.",
    expertise: "A flow analyst's method for telling a capacity gap from a waiting gap." },
];
