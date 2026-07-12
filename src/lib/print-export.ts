import rawRoutes from "@/data/verifiedRoutes.json";

type PrintOrder = {
  id: string;
  number: string;
  customer_name: string;
  customer_email: string;
  race: string;
  race_short: string;
  time: string;
  race_date: string;
  year: number;
  size: string;
  theme_key: string;
  race_id?: string | null;
  route_verified?: boolean | null;
};

type VerifiedRoute = {
  race_id: string;
  city: string;
  country: string;
  year: number;
  svg_path: string;
  route_verified: boolean;
};

type PrintSize = {
  key: string;
  label: string;
  widthCm: number;
  heightCm: number;
  widthPx: number;
  heightPx: number;
};

const DPI = 300;
const CM_PER_INCH = 2.54;

const PRINT_SIZES: PrintSize[] = [
  makeSize("30x40", "30x40cm", 30, 40),
  makeSize("50x70", "50x70cm", 50, 70),
  makeSize("70x100", "70x100cm", 70, 100),
];

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
  "san-francisco": ["Embarcadero", "Fisherman's Wharf", "Golden Gate", "Haight Street", "Oracle Park"],
  knysna: ["Knysna Forest", "Gouna", "Simola", "Estuary", "Knysna Heads"],
  oulu: ["Kuusisaari", "Tuiranranta", "Oulu River", "Raatinsaari", "Athletics Stadium"],
  amsterdam: ["Olympisch Stadion", "Vondelpark", "Amstel", "Centrum", "Oud-Zuid"],
  edinburgh: ["Holyrood Park", "Portobello", "Musselburgh", "East Lothian", "Finish Line"],
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
  edinburgh: { lat: "55.9533 N", lon: "3.1883 W" },
  amsterdam: { lat: "52.3676 N", lon: "4.9041 E" },
};

const routes = (rawRoutes as { routes: VerifiedRoute[] }).routes;

export function buildPrintExport(order: PrintOrder) {
  const size = resolvePrintSize(order.size);
  const raceId = order.race_id || slugFromRace(order.race_short || order.race);
  const route = findRoute(raceId);
  const palette = CITY_PALETTES[raceId] || CITY_PALETTES.berlin;
  const city = route?.city || order.race_short || order.race;
  const country = route?.country || "";
  const routePath = route?.svg_path || "";
  const fileName = `${safeFilePart(order.number)}-${safeFilePart(raceId)}-${size.key}.svg`;

  return {
    fileName,
    mimeType: "image/svg+xml",
    dpi: DPI,
    size,
    metadata: {
      orderId: order.id,
      orderNumber: order.number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      race: order.race,
      raceId,
      routeVerified: Boolean(route?.route_verified && order.route_verified !== false),
      finishTime: order.time,
      raceDate: order.race_date,
      size: size.label,
    },
    svg: renderPosterSvg({
      size,
      raceId,
      city,
      country,
      year: order.year,
      routePath,
      name: order.customer_name,
      time: order.time,
      date: order.race_date,
      palette,
    }),
  };
}

export function buildPrintPayloadWithExport(order: PrintOrder) {
  const printFile = buildPrintExport(order);
  return {
    order: {
      id: order.id,
      number: order.number,
    },
    customer: {
      name: order.customer_name,
      email: order.customer_email,
    },
    poster: printFile.metadata,
    printFile: {
      fileName: printFile.fileName,
      mimeType: printFile.mimeType,
      dpi: printFile.dpi,
      widthCm: printFile.size.widthCm,
      heightCm: printFile.size.heightCm,
      widthPx: printFile.size.widthPx,
      heightPx: printFile.size.heightPx,
      svg: printFile.svg,
    },
  };
}

export async function renderPrintPdf(order: PrintOrder) {
  const printFile = buildPrintExport(order);
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const raceId = order.race_id || slugFromRace(order.race_short || order.race);
  const route = findRoute(raceId);
  const palette = CITY_PALETTES[raceId] || CITY_PALETTES.berlin;
  const city = route?.city || order.race_short || order.race;
  const country = route?.country || "";
  const routePath = route?.svg_path || "";
  const coords = COORDS[raceId];
  const neighborhoods = NEIGHBORHOODS[raceId] || [];
  const widthPt = cmToPt(printFile.size.widthCm);
  const heightPt = cmToPt(printFile.size.heightCm);
  const u = widthPt / 100;

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Racepace ${city} ${order.year}`);
  pdf.setAuthor("Racepace");
  pdf.setSubject(`Personalized ${city} marathon print`);

  const page = pdf.addPage([widthPt, heightPt]);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const paper = hexRgb(palette.paper);
  const ink = hexRgb(palette.ink);
  const muted = hexRgb(palette.muted);
  const line = hexRgb(palette.line);

  page.drawRectangle({ x: 0, y: 0, width: widthPt, height: heightPt, color: rgb(...paper) });
  drawTextFromTop(page, "RACEPACE EDITION", widthPt * 0.06, heightPt * 0.052, {
    font: sansBold,
    size: 1.6 * u,
    color: rgb(...muted),
  });
  drawTextFromTop(page, `EDITION NO ${editionNo(raceId, order.year)}`, widthPt * 0.94, heightPt * 0.052, {
    font: sansBold,
    size: 1.6 * u,
    color: rgb(...muted),
    align: "right",
  });
  drawTextFromTop(page, city.toUpperCase(), widthPt / 2, heightPt * 0.165, {
    font: serifBold,
    size: 12.7 * u,
    color: rgb(...ink),
    align: "center",
  });
  drawTextFromTop(page, "The Marathon", widthPt / 2, heightPt * 0.205, {
    font: serifItalic,
    size: 3.2 * u,
    color: rgb(...ink),
    align: "center",
  });
  drawTextFromTop(page, String(order.year), widthPt / 2, heightPt * 0.238, {
    font: sans,
    size: 2.4 * u,
    color: rgb(...muted),
    align: "center",
  });

  const leftX = widthPt * 0.065;
  neighborhoods.forEach((n, i) => {
    drawTextFromTop(page, n.toUpperCase(), leftX, heightPt * 0.335 + i * 2.85 * u, {
      font: sansBold,
      size: 1.65 * u,
      color: rgb(...muted),
    });
  });

  if (coords) {
    drawTextFromTop(page, coords.lat, leftX, heightPt * 0.655, {
      font: sans,
      size: 1.45 * u,
      color: rgb(...muted),
    });
    drawTextFromTop(page, coords.lon, leftX, heightPt * 0.676, {
      font: sans,
      size: 1.45 * u,
      color: rgb(...muted),
    });
  }

  drawRoutePath(page, routePath, {
    pageHeight: heightPt,
    x: widthPt * 0.22,
    yFromTop: heightPt * 0.31,
    width: widthPt * 0.7,
    height: heightPt * 0.35,
    color: rgb(...line),
    strokeWidth: 0.42 * u,
  });

  const dividerY = heightPt - heightPt * 0.705;
  page.drawLine({
    start: { x: widthPt * 0.06, y: dividerY },
    end: { x: widthPt * 0.94, y: dividerY },
    thickness: Math.max(0.55, u * 0.12),
    color: rgb(...ink),
    opacity: 0.36,
  });

  drawTextFromTop(page, order.time || "00:00:00", widthPt / 2, heightPt * 0.775, {
    font: serifBold,
    size: 7.6 * u,
    color: rgb(...muted),
    align: "center",
  });
  drawTextFromTop(page, (order.customer_name || "Your Name").toUpperCase(), widthPt / 2, heightPt * 0.825, {
    font: sansBold,
    size: 2.65 * u,
    color: rgb(...ink),
    align: "center",
  });
  drawTextFromTop(
    page,
    `${formatDate(order.race_date)}${country ? ` · ${country.toUpperCase()}` : ""}`,
    widthPt / 2,
    heightPt * 0.868,
    {
      font: sans,
      size: 1.75 * u,
      color: rgb(...muted),
      align: "center",
    },
  );

  const pdfBytes = await pdf.save();

  return {
    ...printFile,
    fileName: printFile.fileName.replace(/\.svg$/i, ".pdf"),
    mimeType: "application/pdf",
    pdf: pdfBytes,
  };
}

type PdfPage = Awaited<ReturnType<typeof import("pdf-lib").PDFDocument.create>> extends infer _T
  ? import("pdf-lib").PDFPage
  : never;

function cmToPt(cm: number) {
  return (cm / 2.54) * 72;
}

function hexRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const value = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

function drawTextFromTop(
  page: PdfPage,
  text: string,
  x: number,
  yFromTop: number,
  options: {
    font: import("pdf-lib").PDFFont;
    size: number;
    color: import("pdf-lib").RGB;
    align?: "left" | "center" | "right";
  },
) {
  const width = options.font.widthOfTextAtSize(text, options.size);
  const adjustedX =
    options.align === "center" ? x - width / 2 : options.align === "right" ? x - width : x;
  page.drawText(text, {
    x: adjustedX,
    y: page.getHeight() - yFromTop - options.size,
    size: options.size,
    font: options.font,
    color: options.color,
  });
}

function drawRoutePath(
  page: PdfPage,
  routePath: string,
  options: {
    pageHeight: number;
    x: number;
    yFromTop: number;
    width: number;
    height: number;
    color: import("pdf-lib").RGB;
    strokeWidth: number;
  },
) {
  if (!routePath) return;
  const routeBox = getRouteBox(routePath);
  const [vbX, vbY, vbW, vbH] = routeBox.vb.split(" ").map(Number);
  const scale = Math.min(options.width / vbW, options.height / vbH);
  const xPad = (options.width - vbW * scale) / 2;
  const yPad = (options.height - vbH * scale) / 2;
  const transformed = transformRoutePath(routePath, (x, y) => ({
    x: options.x + xPad + (x - vbX) * scale,
    y: options.pageHeight - options.yFromTop - yPad - (y - vbY) * scale,
  }));
  page.drawSvgPath(transformed, {
    borderColor: options.color,
    borderWidth: options.strokeWidth,
  });

  const start = transformPoint(routeBox.startX, routeBox.startY);
  const end = transformPoint(routeBox.endX, routeBox.endY);
  page.drawCircle({ x: start.x, y: start.y, size: options.strokeWidth * 1.7, borderColor: options.color, borderWidth: options.strokeWidth * 0.65 });
  page.drawCircle({ x: end.x, y: end.y, size: options.strokeWidth * 1.9, color: options.color });

  function transformPoint(x: number, y: number) {
    return {
      x: options.x + xPad + (x - vbX) * scale,
      y: options.pageHeight - options.yFromTop - yPad - (y - vbY) * scale,
    };
  }
}

function transformRoutePath(routePath: string, transform: (x: number, y: number) => { x: number; y: number }) {
  const parts = routePath.match(/[ML]|-?\d+(?:\.\d+)?/g);
  if (!parts) return routePath;
  const output: string[] = [];
  for (let i = 0; i < parts.length; ) {
    const command = parts[i++];
    if (command !== "M" && command !== "L") continue;
    const x = Number(parts[i++]);
    const y = Number(parts[i++]);
    const point = transform(x, y);
    output.push(command, trim(point.x), trim(point.y));
  }
  return output.join(" ");
}

function trim(value: number) {
  return Number(value.toFixed(3)).toString();
}

function renderPosterSvg({
  size,
  raceId,
  city,
  country,
  year,
  routePath,
  name,
  time,
  date,
  palette,
}: {
  size: PrintSize;
  raceId: string;
  city: string;
  country: string;
  year: number;
  routePath: string;
  name: string;
  time: string;
  date: string;
  palette: { paper: string; ink: string; muted: string; line: string };
}) {
  const w = size.widthPx;
  const h = size.heightPx;
  const u = w / 100;
  const routeArea = {
    x: w * 0.22,
    y: h * 0.31,
    width: w * 0.7,
    height: h * 0.35,
  };
  const leftX = w * 0.065;
  const routeBox = getRouteBox(routePath);
  const neighborhoods = NEIGHBORHOODS[raceId] || [];
  const coords = COORDS[raceId];
  const dateLine = `${formatDate(date)}${country ? ` · ${country.toUpperCase()}` : ""}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size.widthCm}cm" height="${size.heightCm}cm" viewBox="0 0 ${w} ${h}" role="img" aria-label="Racepace ${escapeXml(city)} marathon poster">
  <rect width="${w}" height="${h}" fill="${palette.paper}"/>
  <filter id="paperGrain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="table" tableValues="0 0.09"/></feComponentTransfer>
  </filter>
  <rect width="${w}" height="${h}" filter="url(#paperGrain)" opacity="0.22"/>
  <g font-family="Inter, Helvetica, Arial, sans-serif" fill="${palette.muted}" font-weight="500" letter-spacing="${0.36 * u}">
    <text x="${w * 0.06}" y="${h * 0.052}" font-size="${1.6 * u}" text-transform="uppercase">RACEPACE EDITION</text>
    <text x="${w * 0.94}" y="${h * 0.052}" font-size="${1.6 * u}" text-anchor="end">EDITION NO ${editionNo(raceId, year)}</text>
  </g>
  <text x="${w / 2}" y="${h * 0.165}" fill="${palette.ink}" font-family="Fraunces, Georgia, 'Times New Roman', serif" font-size="${12.7 * u}" font-weight="700" text-anchor="middle" letter-spacing="${0.05 * u}">${escapeXml(city.toUpperCase())}</text>
  <text x="${w / 2}" y="${h * 0.205}" fill="${palette.ink}" font-family="Georgia, 'Times New Roman', serif" font-size="${3.2 * u}" font-style="italic" text-anchor="middle">The Marathon</text>
  <text x="${w / 2}" y="${h * 0.238}" fill="${palette.muted}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="${2.4 * u}" font-weight="500" text-anchor="middle" letter-spacing="${0.06 * u}">${year}</text>
  <g font-family="Inter, Helvetica, Arial, sans-serif" fill="${palette.muted}" font-size="${1.65 * u}" font-weight="500" letter-spacing="${0.2 * u}">
    ${neighborhoods.map((n, i) => `<text x="${leftX}" y="${h * 0.335 + i * 2.85 * u}">${escapeXml(n.toUpperCase())}</text>`).join("\n    ")}
  </g>
  ${
    coords
      ? `<g font-family="Inter, Helvetica, Arial, sans-serif" fill="${palette.muted}" font-size="${1.45 * u}" font-weight="500" letter-spacing="${0.12 * u}">
    <text x="${leftX}" y="${h * 0.655}">${coords.lat}</text>
    <text x="${leftX}" y="${h * 0.676}">${coords.lon}</text>
  </g>`
      : ""
  }
  <svg x="${routeArea.x}" y="${routeArea.y}" width="${routeArea.width}" height="${routeArea.height}" viewBox="${routeBox.vb}" preserveAspectRatio="xMidYMid meet">
    <path d="${escapeXml(routePath)}" fill="none" stroke="${palette.line}" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${routeBox.startX}" cy="${routeBox.startY}" r="1.4" fill="none" stroke="${palette.line}" stroke-width="1"/>
    <circle cx="${routeBox.endX}" cy="${routeBox.endY}" r="1.6" fill="${palette.line}"/>
  </svg>
  <line x1="${w * 0.06}" y1="${h * 0.705}" x2="${w * 0.94}" y2="${h * 0.705}" stroke="${palette.ink}" stroke-opacity="0.36" stroke-width="${Math.max(2, u * 0.12)}"/>
  <text x="${w / 2}" y="${h * 0.775}" fill="${palette.muted}" font-family="Fraunces, Georgia, 'Times New Roman', serif" font-size="${7.6 * u}" font-weight="600" text-anchor="middle" letter-spacing="${0.04 * u}">${escapeXml(time || "00:00:00")}</text>
  <text x="${w / 2}" y="${h * 0.825}" fill="${palette.ink}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="${2.65 * u}" font-weight="500" text-anchor="middle" letter-spacing="${0.32 * u}">${escapeXml((name || "Your Name").toUpperCase())}</text>
  <text x="${w / 2}" y="${h * 0.868}" fill="${palette.muted}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="${1.75 * u}" font-weight="500" text-anchor="middle" letter-spacing="${0.28 * u}">${escapeXml(dateLine)}</text>
</svg>`;
}

function makeSize(key: string, label: string, widthCm: number, heightCm: number): PrintSize {
  return {
    key,
    label,
    widthCm,
    heightCm,
    widthPx: Math.round((widthCm / CM_PER_INCH) * DPI),
    heightPx: Math.round((heightCm / CM_PER_INCH) * DPI),
  };
}

function resolvePrintSize(size: string): PrintSize {
  const normalized = size.toLowerCase().replace(/\s/g, "");
  if (normalized.includes("70x100")) return PRINT_SIZES[2];
  if (normalized.includes("50x70")) return PRINT_SIZES[1];
  return PRINT_SIZES[0];
}

function findRoute(raceId: string) {
  return routes
    .filter((r) => r.route_verified && r.race_id === raceId)
    .sort((a, b) => b.year - a.year)[0];
}

function getRouteBox(routePath: string) {
  const empty = { vb: "0 0 100 100", startX: 50, startY: 50, endX: 50, endY: 50 };
  const matches = routePath.match(/-?\d+(?:\.\d+)?/g);
  if (!matches || matches.length < 4) return empty;
  const nums = matches.map(Number);
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
  const width = maxX - minX || 100;
  const height = maxY - minY || 100;
  const pad = Math.max(width, height) * 0.03;
  return {
    vb: `${minX - pad} ${minY - pad} ${width + pad * 2} ${height + pad * 2}`,
    startX: nums[0],
    startY: nums[1],
    endX: nums[nums.length - 2],
    endY: nums[nums.length - 1],
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.toUpperCase();
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}

function editionNo(raceId: string, year: number) {
  const seed = `${raceId}-${year}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return String((hash % 90) + 10).padStart(2, "0");
}

function slugFromRace(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function safeFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "racepace";
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
