import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar    from "./components/Navbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Scanner   from "./pages/Scanner.jsx";
import History   from "./pages/History.jsx";
import Reports   from "./pages/Reports.jsx";
import "./styles/navbar.css";
import "./styles/dashboard.css";
import "./styles/scanner.css";
import "./styles/history.css";
import "./styles/reports.css";
import "./styles/components.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/scanner"   element={<Scanner />}   />
            <Route path="/history"   element={<History />}   />
            <Route path="/reports"   element={<Reports />}   />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
