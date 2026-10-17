import { useCallback, useEffect, useState } from "react";
import client, { endpoints } from "../../../../api/client";

/** Loads the workspace's rental units; reload() refreshes them. */
export default function useRentalUnits() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get(endpoints.rentalUnits);
      setUnits(res.data?.data || []);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { units, setUnits, loading, error, reload };
}
