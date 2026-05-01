export default function Loader({ text = "Loading…" }) {
  return (
    <div className="loader-overlay">
      <div className="loader-ring" />
      <div className="loader-text">{text}</div>
    </div>
  );
}
