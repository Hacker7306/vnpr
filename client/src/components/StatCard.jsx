export default function StatCard({ label, value, icon, accent = "blue", change, changeDir = "neutral" }) {
  return (
    <div className={`stat-card accent-${accent}`}>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value ?? "—"}</div>
        {change !== undefined && (
          <div className={`stat-change ${changeDir}`}>
            {changeDir === "up" && "▲ "}
            {changeDir === "down" && "▼ "}
            {change}
          </div>
        )}
      </div>
      <div className={`stat-icon-wrap ${accent}`}>{icon}</div>
    </div>
  );
}
