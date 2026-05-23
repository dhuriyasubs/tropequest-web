'use client'

import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
const BOT_PATTERNS = ["googlebot", "googleother", "bingbot", "ahrefsbot", "semrushbot"];

const COLORS = {
  purple: "#7C3AED",
  teal:   "#0D9488",
  coral:  "#EA580C",
  amber:  "#D97706",
  blue:   "#2563EB",
  gray:   "#6B7280",
  pink:   "#DB2777",
};

const EVENT_COLORS = {
  book_view:    COLORS.purple,
  page_view:    COLORS.teal,
  rec_click:    COLORS.coral,
  search:       COLORS.amber,
  buy_click:    COLORS.blue,
  filter_apply: COLORS.pink,
  shelf_action: COLORS.gray,
};

const STORE_COLORS = [COLORS.purple, COLORS.teal, COLORS.coral, COLORS.amber, COLORS.blue, COLORS.gray];

const isBot = (ua = "") => BOT_PATTERNS.some((p) => ua.toLowerCase().includes(p));

const safeJson = (val) => {
  if (!val) return {};
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return {}; }
};

const fmt = (n) => n?.toLocaleString() ?? "0";

const getDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12,
      padding: "1.1rem 1.25rem", borderTop: `3px solid ${accent || COLORS.purple}`,
    }}>
      <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "#111" }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: "#9CA3AF", margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 12px" }}>
      {children}
    </h3>
  );
}

function ChartCard({ title, children, style }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "1.25rem", ...style }}>
      {title && <SectionTitle>{title}</SectionTitle>}
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
      <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#111" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ margin: 0, color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [range, setRange] = useState(30);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/analytics?days=${range}`)
      .then((r) => r.json())
      .then(({ rows, error: err }) => {
        if (err) { setError(err); setLoading(false); return; }
        setRows(rows ?? []);
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [range]);

  const { human, bots, metrics } = useMemo(() => {
    const human = rows.filter((r) => !isBot(r.user_agent ?? ""));
    const bots  = rows.filter((r) =>  isBot(r.user_agent ?? ""));

    const byType = {};
    human.forEach((r) => { byType[r.event_type] = (byType[r.event_type] || 0) + 1; });
    const eventTypes = Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

    const dailyMap = {};
    human.forEach((r) => {
      const day = r.created_at?.slice(0, 10);
      if (day) dailyMap[day] = (dailyMap[day] || 0) + 1;
    });
    const daily = Object.entries(dailyMap).sort().map(([date, events]) => ({ date: date.slice(5), events }));

    const bookMap = {};
    human.filter((r) => r.event_type === "book_view").forEach((r) => {
      const slug = safeJson(r.data)?.slug;
      if (slug) bookMap[slug] = (bookMap[slug] || 0) + 1;
    });
    const topBooks = Object.entries(bookMap).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([slug, views]) => ({ name: slug.replace(/-/g, " ").slice(0, 32), views }));

    const storeMap = {};
    human.filter((r) => r.event_type === "buy_click").forEach((r) => {
      const store = safeJson(r.data)?.store ?? "unknown";
      storeMap[store] = (storeMap[store] || 0) + 1;
    });
    const storeData = Object.entries(storeMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

    const sourceMap = {};
    human.forEach((r) => {
      const domain = safeJson(r.traffic_source)?.referrer_domain ?? "direct";
      sourceMap[domain] = (sourceMap[domain] || 0) + 1;
    });
    const sources = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([name, count]) => ({ name: name === "direct" ? "direct / unknown" : name, count }));

    const pageTypeMap = {};
    human.filter((r) => r.event_type === "page_view").forEach((r) => {
      const pt = safeJson(r.data)?.page_type ?? "other";
      pageTypeMap[pt] = (pageTypeMap[pt] || 0) + 1;
    });
    const pageTypes = Object.entries(pageTypeMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

    const recMap = {};
    human.filter((r) => r.event_type === "rec_click").forEach((r) => {
      const s = safeJson(r.data)?.section ?? "unknown";
      recMap[s] = (recMap[s] || 0) + 1;
    });
    const recSections = Object.entries(recMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

    const filterMap = {};
    human.filter((r) => r.event_type === "filter_apply").forEach((r) => {
      const ft = safeJson(r.data)?.filter_type ?? "unknown";
      filterMap[ft] = (filterMap[ft] || 0) + 1;
    });
    const filterTypes = Object.entries(filterMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

    return {
      human, bots,
      metrics: {
        eventTypes, daily, topBooks, storeData, sources, pageTypes, recSections, filterTypes,
        buyClicks:  human.filter((r) => r.event_type === "buy_click").length,
        searches:   human.filter((r) => r.event_type === "search").length,
        bookViews:  human.filter((r) => r.event_type === "book_view").length,
        recClicks:  human.filter((r) => r.event_type === "rec_click").length,
        shelfAdds:  human.filter((r) => r.event_type === "shelf_action" && safeJson(r.data)?.action === "add").length,
      },
    };
  }, [rows]);

  const botPct = rows.length ? Math.round((bots.length / rows.length) * 100) : 0;

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#6B7280", fontSize: 14 }}>Loading analytics…</div>;
  }

  if (error) {
    return <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "1rem", color: "#DC2626", fontSize: 14 }}>Error: {error}</div>;
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#111", maxWidth: 1200, margin: "0 auto", padding: "1.5rem" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Analytics</h1>
          <p style={{ fontSize: 13, color: "#6B7280", margin: "2px 0 0" }}>Human traffic only · bots excluded</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setRange(d)} style={{
              padding: "6px 14px", fontSize: 13, borderRadius: 8, border: "1px solid",
              borderColor: range === d ? COLORS.purple : "#E5E7EB",
              background: range === d ? COLORS.purple : "#fff",
              color: range === d ? "#fff" : "#374151",
              cursor: "pointer", fontWeight: range === d ? 600 : 400,
            }}>{d}d</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
        <StatCard label="Human events" value={fmt(human.length)} sub={`${botPct}% of total is bots`} accent={COLORS.purple} />
        <StatCard label="Book views"   value={fmt(metrics.bookViews)} sub="individual book pages" accent={COLORS.teal} />
        <StatCard label="Buy clicks"   value={fmt(metrics.buyClicks)} sub={`${human.length ? Math.round(metrics.buyClicks / human.length * 100) : 0}% conversion`} accent={COLORS.coral} />
        <StatCard label="Searches"     value={fmt(metrics.searches)} sub="search events" accent={COLORS.amber} />
        <StatCard label="Rec clicks"   value={fmt(metrics.recClicks)} sub="recommendation taps" accent={COLORS.blue} />
        <StatCard label="Shelf adds"   value={fmt(metrics.shelfAdds)} sub="added to reading list" accent={COLORS.pink} />
      </div>

      <ChartCard title="Daily human events" style={{ marginBottom: "1.5rem" }}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={metrics.daily} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="events" stroke={COLORS.purple} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <ChartCard title="Event type breakdown">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={metrics.eventTypes} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                {metrics.eventTypes.map((entry) => (
                  <Cell key={entry.name} fill={EVENT_COLORS[entry.name] ?? COLORS.gray} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [fmt(v), n.replace(/_/g, " ")]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 8 }}>
            {metrics.eventTypes.map((e) => (
              <span key={e.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#374151" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: EVENT_COLORS[e.name] ?? COLORS.gray }} />
                {e.name.replace(/_/g, " ")} · {fmt(e.value)}
              </span>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Top books by views">
          <ResponsiveContainer width="100%" height={metrics.topBooks.length * 36 + 20}>
            <BarChart data={metrics.topBooks} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 11, fill: "#374151" }} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="views" fill={COLORS.purple} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <ChartCard title="Buy clicks by store">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={metrics.storeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                {metrics.storeData.map((_, i) => <Cell key={i} fill={STORE_COLORS[i % STORE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
            {metrics.storeData.map((s, i) => (
              <div key={s.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#374151" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: STORE_COLORS[i % STORE_COLORS.length] }} />
                  {s.name}
                </span>
                <span style={{ fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Traffic sources">
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            {metrics.sources.map((s, i) => {
              const max = metrics.sources[0]?.count || 1;
              return (
                <div key={s.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: "#374151" }}>{s.name}</span>
                    <span style={{ fontWeight: 600, color: "#111" }}>{fmt(s.count)}</span>
                  </div>
                  <div style={{ height: 5, background: "#F3F4F6", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${Math.round((s.count / max) * 100)}%`, background: STORE_COLORS[i], borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        <ChartCard title="Page view types">
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
            {metrics.pageTypes.map((p, i) => (
              <div key={p.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#374151" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: STORE_COLORS[i % STORE_COLORS.length] }} />
                  {p.name.replace(/_/g, " ")}
                </span>
                <span style={{ fontWeight: 600, color: "#111" }}>{fmt(p.value)}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <ChartCard title="Recommendation clicks by section">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={metrics.recSections} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => v.replace(/_/g, " ")} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Filter usage by type">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={metrics.filterTypes} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={COLORS.coral} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

    </div>
  );
}
