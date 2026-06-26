import type { Order, PosterTheme } from "@/lib/mock-data";

type Props = {
  theme: PosterTheme;
  title: string;
  subtitle?: string;
  time?: string;
  date?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeMap = {
  sm: { w: "w-full", pad: "p-3", title: "text-[10px]", time: "text-[14px]", meta: "text-[7px]" },
  md: { w: "w-full", pad: "p-4", title: "text-xs", time: "text-xl", meta: "text-[9px]" },
  lg: { w: "w-full", pad: "p-6", title: "text-base", time: "text-3xl", meta: "text-[11px]" },
  xl: { w: "w-full", pad: "p-10", title: "text-2xl", time: "text-6xl", meta: "text-sm" },
};

export function PosterPreview({ theme, title, subtitle, time, date, name, size = "md" }: Props) {
  const s = sizeMap[size];
  return (
    <div
      className={`${s.w} aspect-[3/4] rounded-md overflow-hidden flex flex-col ${s.pad} relative`}
      style={{ backgroundColor: theme.bg, color: theme.fg, fontFamily: "Inter, sans-serif" }}
    >
      {/* abstract route line */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.18]" viewBox="0 0 100 140" preserveAspectRatio="none">
        <path
          d="M10 20 Q 30 10, 40 40 T 70 60 Q 85 75, 60 95 T 90 130"
          fill="none"
          stroke={theme.accent}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="10" cy="20" r="1.5" fill={theme.accent} />
        <circle cx="90" cy="130" r="1.5" fill={theme.accent} />
      </svg>

      <div className="relative flex flex-col h-full justify-between">
        <div>
          <div className={`${s.meta} tracking-[0.3em] uppercase opacity-60`}>Marathon</div>
          <div className={`${s.title} font-black tracking-tight uppercase leading-none mt-1`}>
            {title}
          </div>
          {subtitle && (
            <div className={`${s.meta} mt-2 tracking-widest opacity-70 uppercase`}>{subtitle}</div>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className={`${s.meta} opacity-60 uppercase tracking-widest`}>Finish</div>
            <div
              className={`${s.time} font-mono font-bold leading-none mt-1`}
              style={{ color: theme.accent }}
            >
              {time}
            </div>
          </div>
          <div className="text-right">
            {name && <div className={`${s.meta} font-semibold uppercase tracking-wider`}>{name}</div>}
            {date && <div className={`${s.meta} opacity-60 mt-0.5`}>{date}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderPoster({ order, size = "md" }: { order: Order; size?: Props["size"] }) {
  return (
    <PosterPreview
      theme={order.theme}
      title={order.raceShort}
      subtitle={`${order.year}`}
      time={order.time}
      date={order.date}
      name={order.customer.name}
      size={size}
    />
  );
}
