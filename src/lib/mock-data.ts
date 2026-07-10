export type OrderStatus =
  | "pending"
  | "in_review"
  | "approved"
  | "production"
  | "completed";

export type Order = {
  id: string;
  number: string;
  customer: { name: string; email: string; location: string };
  race: string;
  raceShort: string;
  time: string;
  date: string; // race date
  year: number;
  size: string;
  theme: PosterTheme;
  status: OrderStatus;
  orderedAt: string;
  price: number;
  notes?: string;
  raceId?: string;
  routeVerified?: boolean;
  productionProvider?: string;
  productionSentAt?: string;
};

export type PosterTheme = {
  name: string;
  bg: string;
  fg: string;
  accent: string;
};

export const themes: Record<string, PosterTheme> = {
  midnight: { name: "Midnight", bg: "#0b1020", fg: "#f5f5f7", accent: "#7aa2ff" },
  ember:    { name: "Ember",    bg: "#1a0d0a", fg: "#fdece1", accent: "#ff6b3d" },
  forest:   { name: "Forest",   bg: "#0c1c14", fg: "#eaf3ec", accent: "#4ade80" },
  cream:    { name: "Cream",    bg: "#f3ece0", fg: "#1a1714", accent: "#b1431b" },
  noir:     { name: "Noir",     bg: "#0a0a0a", fg: "#f0e9d6", accent: "#c9a84c" },
  sky:      { name: "Sky",      bg: "#e6f0fa", fg: "#0e2233", accent: "#2a6fb5" },
};

const races = [
  ["Berlin Marathon", "BERLIN"],
  ["New York City Marathon", "NEW YORK"],
  ["London Marathon", "LONDON"],
  ["Boston Marathon", "BOSTON"],
  ["Chicago Marathon", "CHICAGO"],
  ["Tokyo Marathon", "TOKYO"],
  ["Paris Marathon", "PARIS"],
  ["Valencia Marathon", "VALENCIA"],
  ["Amsterdam Marathon", "AMSTERDAM"],
  ["Copenhagen Half", "COPENHAGEN"],
];

const customers = [
  ["Elena Rossi", "elena.rossi@email.com", "Milan, IT"],
  ["Marcus Chen", "m.chen@email.com", "San Francisco, US"],
  ["Sofia Bergström", "sofia.b@email.com", "Stockholm, SE"],
  ["James O'Connor", "j.oconnor@email.com", "Dublin, IE"],
  ["Yuki Tanaka", "yuki.t@email.com", "Tokyo, JP"],
  ["Aiko Müller", "aiko.m@email.com", "Berlin, DE"],
  ["Daniel Park", "d.park@email.com", "Seoul, KR"],
  ["Charlotte Dubois", "c.dubois@email.com", "Paris, FR"],
  ["Liam Hartley", "liam.h@email.com", "London, UK"],
  ["Maria Alvarez", "m.alvarez@email.com", "Madrid, ES"],
  ["Noah Schmidt", "noah.s@email.com", "Zurich, CH"],
  ["Hannah Lindqvist", "hannah.l@email.com", "Oslo, NO"],
];

const sizes = ["A3", "A2", "18×24", "24×36"];
const themeKeys = Object.keys(themes);
const statuses: OrderStatus[] = ["pending", "in_review", "approved", "production", "completed"];
const times = ["2:54:18", "3:12:47", "3:28:11", "3:45:02", "4:01:33", "4:18:29", "4:32:55", "2:41:08", "3:06:22"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Sep", "Oct", "Nov"];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }

export const orders: Order[] = Array.from({ length: 24 }, (_, i) => {
  const [race, raceShort] = pick(races, i);
  const [name, email, location] = pick(customers, i * 3 + 1);
  const size = pick(sizes, i * 2);
  const themeKey = pick(themeKeys, i + 2);
  const status = statuses[i % statuses.length];
  const time = pick(times, i + 1);
  const month = pick(months, i);
  const day = ((i * 7) % 27) + 1;
  const year = 2024 + (i % 2);
  const orderedDay = ((i * 5) % 25) + 1;
  return {
    id: `ord_${1000 + i}`,
    number: `#PZ-${4820 + i}`,
    customer: { name, email, location },
    race,
    raceShort,
    time,
    date: `${month} ${day}, ${year}`,
    year,
    size,
    theme: themes[themeKey],
    status,
    orderedAt: `2026-06-${String(orderedDay).padStart(2, "0")}`,
    price: 49 + (i % 4) * 15,
    notes: i % 3 === 0 ? "Customer requested matte finish." : undefined,
  };
});

export const statusLabel: Record<OrderStatus, string> = {
  pending: "Pending",
  in_review: "In Review",
  approved: "Approved",
  production: "Production",
  completed: "Completed",
};

export const statusOrder: OrderStatus[] = ["pending", "in_review", "approved", "production", "completed"];

export function getOrder(id: string) {
  return orders.find((o) => o.id === id);
}

// Analytics
export const analytics = {
  revenue: 48720,
  revenueChange: 12.4,
  orderCount: orders.length * 14,
  orderChange: 8.1,
  aov: 67.20,
  aovChange: 3.2,
  conversion: 3.84,
  conversionChange: -0.6,
  topRaces: [
    { race: "Berlin Marathon", count: 84, revenue: 5640 },
    { race: "New York City Marathon", count: 72, revenue: 4920 },
    { race: "London Marathon", count: 61, revenue: 4110 },
    { race: "Boston Marathon", count: 48, revenue: 3220 },
    { race: "Chicago Marathon", count: 39, revenue: 2730 },
  ],
  weeklyRevenue: [3200, 4100, 3800, 5200, 4900, 6100, 5800, 7200, 6900, 8100, 7600, 9200],
};

export const templates = [
  { id: "tpl_1", name: "Classic Stripe", category: "Marathon", uses: 412, theme: themes.midnight },
  { id: "tpl_2", name: "Minimal Type", category: "Marathon", uses: 318, theme: themes.cream },
  { id: "tpl_3", name: "Heritage", category: "Marathon", uses: 264, theme: themes.noir },
  { id: "tpl_4", name: "Bold Modern", category: "Half Marathon", uses: 197, theme: themes.ember },
  { id: "tpl_5", name: "Forest Trail", category: "Trail", uses: 142, theme: themes.forest },
  { id: "tpl_6", name: "Sky Line", category: "10K", uses: 98, theme: themes.sky },
];
