import { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import type { Article } from "@/hooks/use-filtered-articles";

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/daerah istimewa|daerah khusus ibukota|dki|provinsi|prov\.?/g, "")
    .replace(/[^a-z]/g, "")
    .trim();
}

const ALIASES: Record<string, string> = {
  yogyakarta: "yogyakarta",
  diy: "yogyakarta",
  jogja: "yogyakarta",
  jakarta: "jakarta",
  irianjayatimur: "papua",
  nusatenggarabarat: "nusatenggarabarat",
  nusatenggaratimur: "nusatenggaratimur",
  bangkabelitung: "kepulauanbangkabelitung",
};

function key(s: string) {
  const n = normalize(s);
  return ALIASES[n] ?? n;
}

export function articleMatchesProvince(region: string | null | undefined, provinceName: string) {
  if (!region) return false;
  const a = key(region);
  const b = key(provinceName);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

type Props = {
  articles: Article[];
  selected: string | null;
  onSelect: (province: string | null) => void;
};

export function IndonesiaMap({ articles, selected, onSelect }: Props) {
  const [geo, setGeo] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/indonesia-provinces.json")
      .then((r) => r.json())
      .then((d) => {
        if (mounted) setGeo(d);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of articles) {
      if (!a.region) continue;
      const k = key(a.region);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [articles]);

  const max = Math.max(1, ...counts.values());

  function fillFor(name: string) {
    const c = counts.get(key(name)) ?? 0;
    if (c === 0) return "hsl(var(--muted) / 0.35)";
    const intensity = 0.25 + (c / max) * 0.75;
    return `oklch(0.7 0.16 200 / ${intensity.toFixed(3)})`;
  }

  if (!geo) {
    return (
      <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
        Memuat peta…
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-panel-elevated">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 1100, center: [118, -2.5] }}
        width={980}
        height={460}
        style={{ width: "100%", height: "auto" }}
      >
        <ZoomableGroup minZoom={1} maxZoom={6}>
          <Geographies geography={geo}>
            {({ geographies }) =>
              geographies.map((g) => {
                const name: string =
                  g.properties.Propinsi ||
                  g.properties.NAME_1 ||
                  g.properties.name ||
                  "Unknown";
                const isSelected = selected && key(selected) === key(name);
                return (
                  <Geography
                    key={g.rsmKey}
                    geography={g}
                    onClick={() => onSelect(isSelected ? null : name)}
                    style={{
                      default: {
                        fill: isSelected ? "oklch(0.82 0.18 80)" : fillFor(name),
                        stroke: "oklch(0.3 0 0)",
                        strokeWidth: 0.4,
                        outline: "none",
                        cursor: "pointer",
                        transition: "fill 0.15s",
                      },
                      hover: {
                        fill: "oklch(0.82 0.18 80 / 0.85)",
                        stroke: "oklch(0.95 0 0)",
                        strokeWidth: 0.6,
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: { outline: "none", fill: "oklch(0.82 0.18 80)" },
                    }}
                  >
                    <title>{`${name} — ${counts.get(key(name)) ?? 0} artikel`}</title>
                  </Geography>
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      <div className="absolute bottom-2 left-2 rounded-md bg-panel/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
        Klik provinsi untuk detail · scroll untuk zoom
      </div>
    </div>
  );
}
