import { useState, useEffect } from "react";
import StatCard from "../components/StatCard.jsx";
import ScanCard from "../components/ScanCard.jsx";
import Chart    from "../components/Chart.jsx";
import Modal    from "../components/Modal.jsx";
import api      from "../utils/api.js";

export default function Dashboard() {
  const [stats,   setStats]   = useState(null);
  const [scans,   setScans]   = useState([]);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    api.get("/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/scans?limit=8").then((r) => setScans(r.data.scans ?? r.data)).catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!toDelete) return;
    await api.delete(`/scans/${toDelete}`);
    setScans((prev) => prev.filter((s) => s._id !== toDelete));
    setToDelete(null);
  };

  const barData = (stats?.last7 ?? []).map((d) => ({ label: d.date, value: d.count }));
  const avgConf = stats ? `${Math.round((stats.avgConfidence ?? 0) * 100)}%` : "—";

  return (
    <div className="dashboard animate-fade-up">
      <div className="dashboard-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Real-time vehicle plate recognition overview</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <StatCard
          label="Total Scans"
          value={stats?.total ?? "—"}
          icon="📋"
          accent="blue"
        />
        <StatCard
          label="Today's Scans"
          value={stats?.todayCount ?? "—"}
          icon="🕐"
          accent="amber"
        />
        <StatCard
          label="Unique Plates"
          value={stats?.uniquePlates ?? "—"}
          icon="🔖"
          accent="green"
        />
        <StatCard
          label="Avg Confidence"
          value={avgConf}
          icon="🎯"
          accent="blue"
        />
      </div>

      {/* Content Grid */}
      <div className="dashboard-grid">
        {/* Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-header-icon">📊</div>
              <span className="card-title">Scans — Last 7 Days</span>
            </div>
          </div>
          <div className="chart-area">
            {barData.length > 0 ? (
              <Chart data={barData} type="bar" />
            ) : (
              <div className="no-data">No data yet. Start scanning to see trends.</div>
            )}
          </div>
        </div>

        {/* Recent Scans */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-header-icon">🕐</div>
              <span className="card-title">Recent Scans</span>
            </div>
            <a href="/history" className="btn btn-ghost btn-sm" style={{ fontSize: "0.75rem" }}>
              View all →
            </a>
          </div>
          <div className="recent-scans-list">
            {scans.length === 0 ? (
              <div className="recent-empty">No scans recorded yet.<br />Go to Scanner to start.</div>
            ) : (
              scans.map((s) => (
                <ScanCard key={s._id} scan={s} onDelete={(id) => setToDelete(id)} />
              ))
            )}
          </div>
        </div>
      </div>

      {toDelete && (
        <Modal
          icon="🗑️"
          title="Delete Scan"
          message="Are you sure you want to delete this scan record? This cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
