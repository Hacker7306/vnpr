import { useState, useEffect } from "react";
import StatCard from "../components/StatCard.jsx";
import Chart    from "../components/Chart.jsx";
import api      from "../utils/api.js";

const COLORS = ["#4F8EF7","#F59E0B","#22C55E","#EF4444","#A855F7","#EC4899"];

export default function Reports() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const barData    = (stats?.last7 ?? []).map((d) => ({ label: d.date, value: d.count }));
  const donutData  = (stats?.vehicleTypes ?? []).map((v) => ({ label: v._id || "Unknown", value: v.count }));

  // Confidence distribution buckets: 0-20, 20-40, 40-60, 60-80, 80-100
  const confBuckets = ["0–20", "20–40", "40–60", "60–80", "80–100"];

  const avgConf    = stats ? Math.round((stats.avgConfidence ?? 0) * 100) : 0;
  const maxVType   = donutData[0];
  const totalVehicles = donutData.reduce((a, d) => a + d.value, 0);

  return (
    <div className="reports animate-fade-up">
      <div className="section-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Aggregated statistics from all scan records</p>
        </div>
      </div>

      {/* Summary row */}
      <div className="reports-summary">
        <StatCard label="Total Scans"     value={stats?.total        ?? "—"} icon="📋" accent="blue"  />
        <StatCard label="Unique Plates"   value={stats?.uniquePlates ?? "—"} icon="🔖" accent="green" />
        <StatCard label="Avg Confidence"  value={stats ? `${avgConf}%` : "—"} icon="🎯" accent="amber" />
      </div>

      <div className="reports-grid">

        {/* 7-day bar chart — full width */}
        <div className="card reports-chart-full">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-header-icon">📊</div>
              <span className="card-title">Daily Scan Volume — Last 7 Days</span>
            </div>
          </div>
          <div className="chart-area" style={{ height: 280 }}>
            {barData.length > 0
              ? <Chart data={barData} type="bar" />
              : <div className="no-data">No scan data available yet.</div>}
          </div>
        </div>

        {/* Vehicle Type Donut */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-header-icon">🚗</div>
              <span className="card-title">Vehicle Type Distribution</span>
            </div>
          </div>
          <div className="chart-area" style={{ height: 260 }}>
            {donutData.length > 0
              ? <Chart data={donutData} type="donut" />
              : <div className="no-data">No data yet.</div>}
          </div>
        </div>

        {/* Vehicle Type Breakdown Table */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-header-icon">📋</div>
              <span className="card-title">Type Breakdown</span>
            </div>
          </div>
          <div style={{ padding: "16px 20px" }}>
            {donutData.length === 0 ? (
              <div className="no-data" style={{ padding: "24px 0" }}>No data.</div>
            ) : (
              <table className="vehicle-table">
                <tbody>
                  {donutData.map((v, i) => {
                    const pct = totalVehicles ? Math.round((v.value / totalVehicles) * 100) : 0;
                    return (
                      <tr key={v.label}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i % COLORS.length], display: "inline-block" }} />
                            <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{v.label}</span>
                          </div>
                          <div className="vehicle-type-bar" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}>{v.value}</td>
                        <td style={{ textAlign: "right", color: "var(--text-muted)", fontSize: "0.75rem", paddingLeft: 8 }}>{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Key Insights Card */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-header-icon">💡</div>
              <span className="card-title">Key Insights</span>
            </div>
          </div>
          <div style={{ padding: "20px" }}>
            {[
              { label: "Total Records", value: stats?.total ?? "—", icon: "📋", color: "var(--blue)" },
              { label: "Scanned Today", value: stats?.todayCount ?? "—", icon: "🕐", color: "var(--amber)" },
              { label: "Most Common Type", value: maxVType?.label ?? "—", icon: "🚗", color: "var(--success)" },
              { label: "Avg Confidence Score", value: stats ? `${avgConf}%` : "—", icon: "🎯", color: avgConf >= 70 ? "var(--success)" : "var(--amber)" },
            ].map(({ label, value, icon, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  <span>{icon}</span> {label}
                </div>
                <span style={{ fontWeight: 700, color, fontFamily: "var(--font-mono)", fontSize: "0.95rem" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
