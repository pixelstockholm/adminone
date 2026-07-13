import { useMemo } from "react";

import rawRoutes from "@/data/verifiedRoutes.json";
import type { Order } from "@/lib/mock-data";

type PosterSize = "sm" | "md" | "lg" | "xl";

type PosterPreviewProps = {
  title: string;
  subtitle?: string;
  time?: string;
  date?: string;
  name?: string;
  size?: PosterSize;
};

type VerifiedRoute = {
  race_id: string;
  marathon_name: string;
  city: string;
  country: string;
  year: number;
  svg_path: string;
  route_verified: boolean;
};

const verifiedRoutes = (rawRoutes as { routes: VerifiedRoute[] }).routes;

const NEIGHBORHOODS: Record<string, string[]> = {
  berlin: ["Tiergarten", "Mitte", "Kreuzberg", "Charlottenburg", "Brandenburg Gate"],
  nyc: ["Staten Island", "Brooklyn", "Queens", "Bronx", "Manhattan", "Central Park"],
  london: ["Greenwich", "Tower Bridge", "Canary Wharf", "Westminster", "The Mall"],
  boston: ["Hopkinton", "Ashland", "Heartbreak Hill", "Brookline", "Boylston Street"],
  chicago: ["Grant Park", "River North", "The Loop", "Lincoln Park", "Chinatown"],
  tokyo: ["Shinjuku", "Asakusa", "Ginza", "Tokyo Bay", "Nihonbashi"],
  paris: ["Bois de Vincennes", "Bastille", "Seine", "Eiffel", "Champs-Elysees"],
  stockholm: ["Sodermalm", "Djurgarden", "Kungsholmen", "Ostermalm", "Gamla Stan"],
  hamburg: ["Karolinenviertel", "Alster", "Eppendorf", "HafenCity", "Messe"],
  "big-sur": ["Big Sur", "Bixby Bridge", "Hurricane Point", "Carmel Highlands", "Highway 1"],
  "gold-coast": ["Southport", "Broadwater", "Surfers Paradise", "Burleigh", "Runaway Bay"],
  "san-francisco": [
    "Embarcadero",
    "Fisherman's Wharf",
    "Golden Gate",
    "Haight Street",
    "Oracle Park",
  ],
  knysna: ["Knysna Forest", "Gouna", "Simola", "Estuary", "Knysna Heads"],
  oulu: ["Kuusisaari", "Tuiranranta", "Oulu River", "Raatinsaari", "Athletics Stadium"],
  valencia: ["Ciutat Vella", "Russafa", "Cabanyal", "Turia", "Ciudad de las Artes"],
  amsterdam: ["Olympisch Stadion", "Vondelpark", "Amstel", "Centrum", "Oud-Zuid"],
  copenhagen: ["Norrebro", "Frederiksberg", "Christianshavn", "Islands Brygge", "Vesterbro"],
  vienna: ["Innere Stadt", "Ringstrasse", "Prater", "Leopoldstadt", "Wieden"],
  sydney: ["North Sydney", "The Rocks", "CBD", "Domain", "Opera House"],
  edinburgh: ["Old Town", "Musselburgh", "Portobello", "East Lothian", "Holyrood Park"],
};

const COORDS: Record<string, { lat: string; lon: string }> = {
  berlin: { lat: "52.5200 N", lon: "13.4050 E" },
  nyc: { lat: "40.7128 N", lon: "74.0060 W" },
  london: { lat: "51.5074 N", lon: "0.1278 W" },
  boston: { lat: "42.3601 N", lon: "71.0589 W" },
  chicago: { lat: "41.8781 N", lon: "87.6298 W" },
  tokyo: { lat: "35.6762 N", lon: "139.6503 E" },
  paris: { lat: "48.8566 N", lon: "2.3522 E" },
  stockholm: { lat: "59.3293 N", lon: "18.0686 E" },
  hamburg: { lat: "53.5511 N", lon: "9.9937 E" },
  "big-sur": { lat: "36.2704 N", lon: "121.8081 W" },
  "gold-coast": { lat: "27.9719 S", lon: "153.4063 E" },
  "san-francisco": { lat: "37.7749 N", lon: "122.4194 W" },
  knysna: { lat: "34.0351 S", lon: "23.0465 E" },
  oulu: { lat: "65.0201 N", lon: "25.4618 E" },
  valencia: { lat: "39.4699 N", lon: "0.3763 W" },
  amsterdam: { lat: "52.3676 N", lon: "4.9041 E" },
  copenhagen: { lat: "55.6761 N", lon: "12.5683 E" },
  vienna: { lat: "48.2082 N", lon: "16.3738 E" },
  sydney: { lat: "33.8688 S", lon: "151.2093 E" },
  edinburgh: { lat: "55.9533 N", lon: "3.1883 W" },
};

const CITY_PALETTES: Record<string, { paper: string; ink: string; muted: string; line: string }> = {
  berlin: { paper: "#1B1713", ink: "#F4EADC", muted: "#D1C2AF", line: "#F4EADC" },
  nyc: { paper: "#F1C84B", ink: "#17130C", muted: "#5C4C19", line: "#17130C" },
  london: { paper: "#B01828", ink: "#FFF4E8", muted: "#F1C9C6", line: "#FFF4E8" },
  stockholm: { paper: "#2474E8", ink: "#FFFFFF", muted: "#D7E7FF", line: "#FFFFFF" },
  hamburg: { paper: "#214B5F", ink: "#F5E8D7", muted: "#C6D2D4", line: "#F5E8D7" },
  "big-sur": { paper: "#40563B", ink: "#F3E9D8", muted: "#D3DBC8", line: "#F3E9D8" },
  "gold-coast": { paper: "#E1A83C", ink: "#17120B", muted: "#604816", line: "#17120B" },
  "san-francisco": { paper: "#C34A2E", ink: "#FFF0DF", muted: "#F3C8B8", line: "#FFF0DF" },
  knysna: { paper: "#0E4A42", ink: "#F2E7D4", muted: "#BBD2C8", line: "#F2E7D4" },
  oulu: { paper: "#D9E7F2", ink: "#142536", muted: "#5B7285", line: "#142536" },
  edinburgh: { paper: "#4A314F", ink: "#F5E8D8", muted: "#D8C4D6", line: "#F5E8D8" },
  amsterdam: { paper: "#E75B2C", ink: "#FFF0E5", muted: "#FFD0BB", line: "#FFF0E5" },
  paris: { paper: "#E8DED1", ink: "#151515", muted: "#5D554B", line: "#151515" },
};

export function PosterPreview({
  title,
  subtitle,
  time,
  date,
  name,
  size = "md",
}: PosterPreviewProps) {
  const templateOrder: Order = {
    id: "template-preview",
    number: "TPL",
    customer: { name: name || "Your Name", email: "preview@racepace.shop", location: "Germany" },
    race: title,
    raceShort: title,
    time: time || "03:24:18",
    date: date || "2025-10-12",
    year: Number(subtitle) || yearOf(date || "2025-10-12") || 2025,
    size: "50x70cm",
    theme: { name: "Racepace", bg: "#1B1713", fg: "#F4EADC", accent: "#F4EADC" },
    status: "review",
    orderedAt: new Date().toISOString(),
    price: 890,
    raceId: "berlin",
    routeVerified: true,
  };

  return <OrderPoster order={templateOrder} size={size} />;
}

export function OrderPoster({ order, size = "md" }: { order: Order; size?: PosterSize }) {
  const raceId = resolveRaceId(order);
  const route = verifiedRoutes.find((candidate) => candidate.race_id === raceId);
  const cityName = (route?.city || order.raceShort || order.race || "City").toUpperCase();
  const countryLine = (route?.country || "").toUpperCase();
  const year = String(route?.year || order.year || yearOf(order.date));
  const palette = CITY_PALETTES[raceId] || CITY_PALETTES.berlin;
  const neighborhoods = NEIGHBORHOODS[raceId] || [];
  const coords = COORDS[raceId];
  const routePath = route?.svg_path || "";
  const routeBox = useMemo(() => computeRouteBox(routePath), [routePath]);
  const editionNo = useMemo(() => editionNumber(`${raceId}-${year}`), [raceId, year]);
  const displayDate = formatDate(order.date);
  const displayName = (order.customer.name || "Your Name").toUpperCase();
  const displayTime = order.time || "00:00:00";
  const isSmall = size === "sm";
  const paper = palette.paper;
  const ink = palette.ink;
  const muted = palette.muted;
  const hairline = colorWithAlpha(ink, 0.36);
  const serif = '"Fraunces", Georgia, "Times New Roman", serif';
  const sans = '"Inter", system-ui, sans-serif';

  return (
    <div
      className="w-full overflow-hidden"
      data-racepace-poster
      style={{
        aspectRatio: aspectRatioForSize(order.size),
        backgroundColor: paper,
        color: ink,
        position: "relative",
        fontFamily: serif,
        containerType: "inline-size",
        boxShadow:
          size === "xl"
            ? "0 34px 90px rgba(0,0,0,0.42), inset 0 0 0 1px rgba(255,255,255,0.12)"
            : "0 18px 42px rgba(0,0,0,0.34), inset 0 0 0 1px rgba(255,255,255,0.12)",
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          padding: "4% 6% 4%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            fontFamily: sans,
            fontSize: "1.6cqw",
            letterSpacing: "0.36em",
            textTransform: "uppercase",
            fontWeight: 500,
            color: muted,
          }}
        >
          <span>Racepace Edition</span>
          <span>Edition No {editionNo}</span>
        </div>

        <h1
          style={{
            fontFamily: serif,
            fontWeight: 700,
            fontSize: isSmall ? "12.2cqw" : "13cqw",
            lineHeight: 0.92,
            letterSpacing: "0.01em",
            margin: "1.8cqw 0 0",
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          {cityName}
        </h1>

        <div
          style={{
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "3.4cqw",
            letterSpacing: "0.01em",
            textAlign: "center",
            marginTop: "1.5cqw",
            color: ink,
          }}
        >
          The Marathon
        </div>

        <div
          style={{
            fontFamily: sans,
            fontSize: "2.6cqw",
            letterSpacing: "0.06em",
            textAlign: "center",
            marginTop: "0.8cqw",
            color: muted,
            fontWeight: 500,
          }}
        >
          {year}
        </div>

        <div
          style={{
            position: "relative",
            flex: "1 1 0",
            minHeight: 0,
            margin: "2cqw -1.5% 1.2cqw",
            display: "grid",
            gridTemplateColumns: "minmax(0, 19%) 1fr",
            gap: "2%",
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              fontFamily: sans,
              fontSize: "1.7cqw",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: muted,
              fontWeight: 500,
              paddingLeft: "1.5%",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6em" }}>
              {neighborhoods.map((neighborhood) => (
                <span key={neighborhood}>{neighborhood}</span>
              ))}
            </div>
            {coords && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.2em",
                  color: muted,
                  letterSpacing: "0.12em",
                }}
              >
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{coords.lat}</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{coords.lon}</span>
              </div>
            )}
          </div>

          {routePath ? (
            <svg
              viewBox={routeBox.vb}
              preserveAspectRatio="xMidYMid meet"
              style={{ width: "100%", height: "100%", display: "block" }}
              aria-hidden
            >
              <path
                d={routePath}
                fill="none"
                stroke={palette.line}
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx={routeBox.startX}
                cy={routeBox.startY}
                r="1.4"
                fill="none"
                stroke={palette.line}
                strokeWidth="1"
              />
              <circle cx={routeBox.endX} cy={routeBox.endY} r="1.6" fill={palette.line} />
            </svg>
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px dashed ${hairline}`,
                fontFamily: sans,
                fontSize: "1.6cqw",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: muted,
                textAlign: "center",
                padding: "3cqw",
              }}
            >
              Route pending verification
            </div>
          )}
        </div>

        <div style={{ height: 1, background: hairline, margin: "1.2cqw 0 2cqw" }} />

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: serif,
              fontWeight: 600,
              fontSize: "8cqw",
              letterSpacing: "0.04em",
              lineHeight: 1,
              color: muted,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {displayTime}
          </div>
          <div
            style={{
              fontFamily: sans,
              fontWeight: 500,
              fontSize: "2.8cqw",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: ink,
              marginTop: "2.2cqw",
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontFamily: sans,
              fontSize: "1.8cqw",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: muted,
              marginTop: "1.8cqw",
              fontWeight: 500,
            }}
          >
            {displayDate}
            {countryLine ? ` · ${countryLine}` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

function resolveRaceId(order: Order): string {
  if (order.raceId) return order.raceId;
  const haystack = `${order.race} ${order.raceShort}`.toLowerCase();
  const match = verifiedRoutes.find((route) => {
    const city = route.city.toLowerCase();
    const id = route.race_id.replace(/-/g, " ");
    return haystack.includes(city) || haystack.includes(id);
  });
  if (match) return match.race_id;
  return slugify(order.raceShort || order.race || "berlin");
}

function computeRouteBox(path: string) {
  const empty = { vb: "0 0 100 100", endX: 50, endY: 50, startX: 50, startY: 50 };
  const matches = path.match(/-?\d+(?:\.\d+)?/g);
  if (!matches || matches.length < 4) return empty;
  const nums = matches.map(parseFloat);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < nums.length - 1; i += 2) {
    const x = nums[i];
    const y = nums[i + 1];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const width = maxX - minX;
  const height = maxY - minY;
  const pad = Math.max(width, height) * 0.03;
  return {
    vb: `${minX - pad} ${minY - pad} ${width + pad * 2} ${height + pad * 2}`,
    startX: nums[0],
    startY: nums[1],
    endX: nums[nums.length - 2],
    endY: nums[nums.length - 1],
  };
}

function formatDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.toUpperCase();
  return date
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

function yearOf(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : String(date.getFullYear());
}

function editionNumber(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return String((hash % 90) + 10).padStart(2, "0");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function aspectRatioForSize(size?: string): string {
  const normalized = (size || "").toLowerCase().replace(/[×x]/g, "x").replace(/\s/g, "");
  if (normalized.includes("70x100")) return "7 / 10";
  if (normalized.includes("50x70")) return "5 / 7";
  if (normalized.includes("30x40")) return "3 / 4";
  return "3 / 4";
}

function colorWithAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
