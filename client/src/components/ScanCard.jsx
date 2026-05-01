function confClass(c) {
  if (c >= 0.8) return "high";
  if (c >= 0.5) return "medium";
  return "low";
}

export default function ScanCard({ scan, onDelete }) {
  const conf = scan.confidence ?? 0;
  const d    = new Date(scan.createdAt ?? scan.timestamp);

  return (
    <div className="scan-card">
      <div className="scan-thumb">
        {scan.imageData ? (
          <img src={scan.imageData} alt={scan.plateNumber} />
        ) : (
          "🚗"
        )}
      </div>

      <div className="scan-info">
        <div className="scan-plate">{scan.plateNumber}</div>
        <div className="scan-meta">
          <span className="scan-type">{scan.vehicleType || "Unknown"}</span>
          <span className={`scan-conf ${confClass(conf)}`}>
            {Math.round(conf * 100)}% conf.
          </span>
          <span className="scan-time">
            {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {onDelete && (
        <button
          className="btn btn-icon btn-ghost"
          style={{ color: "var(--danger)", fontSize: "0.9rem" }}
          onClick={() => onDelete(scan._id)}
          title="Delete"
        >
          🗑
        </button>
      )}
    </div>
  );
}
