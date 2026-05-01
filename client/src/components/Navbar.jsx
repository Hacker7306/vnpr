import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import api from "../utils/api.js";

const NAV_ITEMS = [
  { to: "/",        icon: "⊞", label: "Dashboard" },
  { to: "/scanner", icon: "⊙", label: "Scanner"   },
  { to: "/history", icon: "≡", label: "History"   },
  { to: "/reports", icon: "◈", label: "Reports"   },
];

export default function Navbar() {
  const [open, setOpen]         = useState(false);
  const [mlOnline, setMlOnline] = useState(null); // null=checking, true, false

  useEffect(() => {
    api.get("/ml-health")
      .then((r) => setMlOnline(r.data.online))
      .catch(() => setMlOnline(false));
  }, []);

  return (
    <>
      {/* Mobile toggle */}
      <button className="navbar-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
        {open ? "✕" : "☰"}
      </button>

      <nav className={`navbar${open ? " open" : ""}`}>
        {/* Logo */}
        <div className="navbar-logo">
          <div className="navbar-logo-icon">🔍</div>
          <div className="navbar-logo-text">
            <h1>Snap<span>Plate</span></h1>
            <div className="navbar-logo-sub">
              <span className="status-dot" />
              ALPR System
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="navbar-nav">
          <div className="nav-section-label">Navigation</div>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer — ML status */}
        <div className="navbar-footer">
          <div className="navbar-footer-card">
            <div className="navbar-footer-label">OCR Service Status</div>
            <div className="ml-status">
              <span
                className={`ml-status-dot ${
                  mlOnline === null ? "" : mlOnline ? "online" : "offline"
                }`}
              />
              <span>
                {mlOnline === null
                  ? "Checking…"
                  : mlOnline
                  ? "Python OCR Online"
                  : "OCR Offline"}
              </span>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
