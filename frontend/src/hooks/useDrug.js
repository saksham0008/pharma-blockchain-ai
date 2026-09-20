import { useEffect, useState } from "react";
import { getPublicDrug } from "../services/api";

function useDrug(drugID) {
  const [drug, setDrug] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchDrug = async () => {
      if (!drugID) {
        setDrug(null);
        setError("No Drug ID was provided.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setDrug(null);

        const data = await getPublicDrug(drugID);

        if (!cancelled) {
          setDrug(data);
        }
      } catch (err) {
        console.error("Drug verification error:", err);

        if (!cancelled) {
          setDrug(null);

          setError(
            err.response?.data?.error ||
              "Unable to verify this drug."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDrug();

    return () => {
      cancelled = true;
    };
  }, [drugID]);

  return {
    drug,
    loading,
    error,
  };
}

export default useDrug;

