import { useState, useCallback } from "react";
import Modal from "../components/Modal.jsx";
import api   from "../utils/api.js";

function confClass(c) {
  if (c >= 0.8) return "high";
  if (c >= 0.5) return "medium";
  return "low";
}

export default function History() {
  const [scans,    setScans]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // Filters
  const [search,      setSearch]      = useState("");
  const [vehicleType, setVehicleType] = useState("all");
  const [minConf,     setMinConf]     = useState("");
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");

  const fetchScans = useCallback(async (overrides = {}) => {
    setLoading(true);
    try {
      const params = {
        page, limit: 15,
        search, vehicleType, minConf, dateFrom, dateTo,
        ...overrides,
      };
      // Remove empty params
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const res = await api.get("/scans", { params });
      setScans(res.data.scans ?? []);
      setTotal(res.data.total ?? 0);
      setPages(res.data.pages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, vehicleType, minConf, dateFrom, dateTo]);

  // Fetch on first render
  useState(() => { fetchScans(); }, []);

  const applyFilters = () => { setPage(1); fetchScans({ page: 1 }); };
  const clearFilters = () => {
    setSearch(""); setVehicleType("all");
    setMinConf(""); setDateFrom(""); setDateTo("");
    setPage(1);
    fetchScans({ page: 1, search: "", vehicleType: "all", minConf: "", dateFrom: "", dateTo: "" });
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await api.delete(`/scans/${toDelete}`);
    setScans((p) => p.filter((s) => s._id !== toDelete));
    setTotal((t) => t - 1);
    setToDelete(null);
  };

  const exportCSV = () => window.open("/api/scans/export", "_blank");

  const goPage = (p) => { setPage(p); fetchScans({ page: p }); };

  return (
    <div className="history animate-fade-up">
      <div className="section-header">
        <div>
          <h1 className="page-title">Scan History</h1>
          <p className="page-subtitle">{total} total records</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={exportCSV}>⬇ Export CSV</button>
      </div>

      {/* Toolbar */}
      <div className="history-toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search plate number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </div>

        <select className="filter-select" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="Car">Car</option>
          <option value="Truck">Truck</option>
          <option value="Motorcycle">Motorcycle</option>
          <option value="Bus">Bus</option>
          <option value="Unknown">Unknown</option>
        </select>

        <select className="filter-select" value={minConf} onChange={(e) => setMinConf(e.target.value)}>
          <option value="">Any Confidence</option>
          <option value="0.8">High (≥80%)</option>
          <option value="0.5">Medium (≥50%)</option>
          <option value="0.2">Low (≥20%)</option>
        </select>

        <input type="date" className="filter-select" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ color: dateFrom ? "var(--text-primary)" : "var(--text-muted)" }} />
        <input type="date" className="filter-select" value={dateTo}   onChange={(e) => setDateTo(e.target.value)}   style={{ color: dateTo   ? "var(--text-primary)" : "var(--text-muted)" }} />

        <button className="btn btn-primary btn-sm"    onClick={applyFilters}>Apply</button>
        <button className="btn btn-secondary btn-sm"  onClick={clearFilters}>Clear</button>
      </div>

      {/* Table */}
      <div className="history-table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Plate Number</th>
              <th>Vehicle Type</th>
              <th>Confidence</th>
              <th>Date</th>
              <th>Time</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                <span className="spinner" />
              </td></tr>
            ) : scans.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <h3>No records found</h3>
                  <p>Try adjusting your filters or scan a vehicle first.</p>
                </div>
              </td></tr>
            ) : scans.map((s) => {
              const d    = new Date(s.createdAt);
              const conf = s.confidence ?? 0;
              return (
                <tr key={s._id}>
                  <td className="thumb-cell">
                    {s.imageData
                      ? <img src={s.imageData} alt={s.plateNumber} />
                      : <div className="thumb-placeholder">🚗</div>}
                  </td>
                  <td className="plate-cell">{s.plateNumber}</td>
                  <td><span className="type-pill">{s.vehicleType || "Unknown"}</span></td>
                  <td>
                    <span className={`conf-pill ${confClass(conf)}`}>
                      {conf >= 0.8 ? "●" : conf >= 0.5 ? "◐" : "○"} {Math.round(conf * 100)}%
                    </span>
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                    {d.toLocaleDateString()}
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
                    {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                  <td>
                    <button className="delete-btn" onClick={() => setToDelete(s._id)} title="Delete">🗑</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {pages > 1 && (
          <div className="pagination">
            <span className="pagination-info">
              Page {page} of {pages} — {total} records
            </span>
            <div className="pagination-btns">
              <button className="page-btn" disabled={page <= 1}    onClick={() => goPage(page - 1)}>← Prev</button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i;
                if (p < 1 || p > pages) return null;
                return (
                  <button key={p} className={`page-btn${p === page ? " active" : ""}`} onClick={() => goPage(p)}>{p}</button>
                );
              })}
              <button className="page-btn" disabled={page >= pages} onClick={() => goPage(page + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {toDelete && (
        <Modal icon="🗑️" title="Delete Record" message="Permanently delete this scan record?" confirmLabel="Delete" danger onConfirm={handleDelete} onCancel={() => setToDelete(null)} />
      )}
    </div>
  );
}
