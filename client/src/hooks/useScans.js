import { useState, useEffect, useCallback } from "react";
import api from "../utils/api.js";

export function useScans(params = {}) {
  const [scans, setScans]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [pages, setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetchScans = useCallback(async (overrides = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/scans", { params: { ...params, ...overrides } });
      setScans(res.data.scans ?? res.data);
      setTotal(res.data.total ?? res.data.length);
      setPages(res.data.pages ?? 1);
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  const deleteScan = async (id) => {
    await api.delete(`/scans/${id}`);
    setScans((prev) => prev.filter((s) => s._id !== id));
    setTotal((t) => t - 1);
  };

  const addScan = (scan) => {
    setScans((prev) => [scan, ...prev]);
    setTotal((t) => t + 1);
  };

  useEffect(() => { fetchScans(); }, [fetchScans]);

  return { scans, total, pages, loading, error, fetchScans, deleteScan, addScan };
}
