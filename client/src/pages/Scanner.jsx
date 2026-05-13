import { useState, useRef, useCallback } from "react";
import api from "../utils/api.js";

function ConfBar({ value }) {
  const pct = Math.round((value ?? 0) * 100);
  const color = pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--amber)" : "var(--danger)";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 4 }}>
        <span style={{ color: "var(--text-secondary)" }}>Confidence</span>
        <span style={{ fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div className="confidence-bar-track">
        <div className="confidence-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Scanner() {
  // Camera state
  const [streaming, setStreaming]   = useState(false);
  const [camError,  setCamError]    = useState(null);
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);

  // Upload state
  const [dragging,  setDragging]    = useState(false);
  const [preview,   setPreview]     = useState(null);
  const [fileBlob,  setFileBlob]    = useState(null);

  // Processing
  const [processing, setProcessing] = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState(null);
  const [saved,      setSaved]      = useState(false);

  // ── Camera ─────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCamError(null);
    setResult(null);
    setPreview(null);
    setFileBlob(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    } catch {
      setCamError("Camera access denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width  = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    return new Promise((res) => c.toBlob(res, "image/jpeg", 0.92));
  }, []);

  // ── Drag & Drop ─────────────────────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    stopCamera();
    setFileBlob(file);
    setResult(null);
    setSaved(false);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Process ─────────────────────────────────────────────────────────────────
  const processImage = async () => {
    setProcessing(true);
    setError(null);
    setSaved(false);

    try {
      let blob = fileBlob;
      if (!blob && streaming) {
        blob = await captureFrame();
      }
      if (!blob) { setError("No image selected. Use camera or upload a file."); setProcessing(false); return; }

      const form = new FormData();
      form.append("image", blob, "capture.jpg");

      const res = await api.post("/process", form, { headers: { "Content-Type": "multipart/form-data" } });
      
      if (res.data.success === false) {
        throw new Error(res.data.error);
      }

      setResult(res.data.scan || res.data);
      setSaved(true);

      // If camera capture — update preview with the captured frame
      if (!fileBlob && canvasRef.current) {
        setPreview(canvasRef.current.toDataURL("image/jpeg"));
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="scanner animate-fade-up">
      <h1 className="page-title">Scanner</h1>
      <p className="page-subtitle">Capture or upload a vehicle image to extract the license plate</p>

      <div className="scanner-grid">
        {/* Left — Camera / Upload */}
        <div className="card camera-card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-header-icon">📷</div>
              <span className="card-title">Image Input</span>
            </div>
            {streaming && (
              <span style={{ fontSize: "0.7rem", color: "var(--success)", fontWeight: 700 }}>
                ● LIVE
              </span>
            )}
          </div>

          {/* Viewport */}
          <div className="camera-viewport">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
              style={{ display: streaming ? "block" : "none" }}
            />

            {!streaming && !preview && (
              <div className="camera-placeholder">
                <div className="camera-placeholder-icon">📷</div>
                <p>INITIALIZE CAMERA OR UPLOAD IMAGE</p>
              </div>
            )}

            {!streaming && preview && (
              <img src={preview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}

            {/* HUD */}
            {streaming && (
              <div className="hud-overlay">
                <div className="hud-corner tl" />
                <div className="hud-corner tr" />
                <div className="hud-corner bl" />
                <div className="hud-corner br" />
                {processing && <div className="scan-beam" />}
                <div className="hud-label">SNAPPLATE OCR</div>
              </div>
            )}

            {camError && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>⚠️</div>
                  <p style={{ fontSize: "0.85rem", color: "var(--danger)" }}>{camError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="camera-controls">
            {!streaming ? (
              <>
                <button className="btn btn-secondary" onClick={startCamera}>📷 Start Camera</button>
                <button className="btn btn-secondary" onClick={() => document.getElementById("file-input").click()}>📁 Upload Image</button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={stopCamera}>⏹ Stop Camera</button>
            )}
            <button
              className="btn btn-primary"
              onClick={processImage}
              disabled={processing || (!streaming && !fileBlob)}
            >
              {processing ? <><span className="btn-spinner" /> Processing…</> : "⊙ Scan Plate"}
            </button>
          </div>

          {/* Drag & Drop */}
          {!streaming && (
            <>
              <div
                className={`dropzone${dragging ? " dragging" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => document.getElementById("file-input").click()}
              >
                <div className="dropzone-icon">📁</div>
                <p>Drag & drop an image here, or <span>click to browse</span></p>
              </div>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </>
          )}
        </div>

        {/* Right — Results */}
        <div className="result-panel">
          {/* Error Alert */}
          {error && (
            <div className="alert error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Result Card */}
          {result ? (
            <div className={`result-card ${result.plateNumber ? "success" : "error"}`}>
              <div className="result-plate">
                <div className="result-plate-label">Detected Plate Number</div>
                <div className="result-plate-number">{result.plateNumber}</div>
              </div>
              <div className="result-meta">
                <div className="result-row">
                  <span className="result-row-label">Vehicle Type</span>
                  <span>{result.vehicleType ?? "Unknown"}</span>
                </div>
                <ConfBar value={result.confidence} />
                {saved && (
                  <div className="alert success" style={{ marginTop: 4 }}>
                    <span>✅</span> Saved to database
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3>No result yet</h3>
                <p>Point the camera at a license plate and press "Scan Plate"</p>
              </div>
            </div>
          )}

          {/* Tips Card */}
          <div className="card" style={{ padding: 18 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>📌 Tips for Best Accuracy</div>
            {["Ensure good lighting — avoid shadows on the plate.",
              "Keep the plate centred and unobstructed.",
              "Hold camera steady for 1–2 seconds before scanning.",
              "Minimum plate width in frame: ~30% of image width."].map((tip, i) => (
              <p key={i} style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 8, paddingLeft: 12, borderLeft: "2px solid var(--border)" }}>
                {tip}
              </p>
            ))}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
