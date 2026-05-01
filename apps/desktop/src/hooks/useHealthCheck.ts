import { useEffect, useState } from "react";

export type HealthStatus = "connected" | "disconnected" | "checking";

const API_URL = "http://127.0.0.1:3001";
const POLL_INTERVAL_MS = 5000;

export const useHealthCheck = () => {
    const [status, setStatus] = useState<HealthStatus>("checking");
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    const check = async (): Promise<void> => {
        try {
            const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) });
            setStatus(res.ok ? "connected" : "disconnected");
        } catch {
            setStatus("disconnected");
        }
        setLastChecked(new Date());
    };

    useEffect(() => {
        check();
        const id = setInterval(check, POLL_INTERVAL_MS);
        return () => clearInterval(id);
    }, []);

    return { status, lastChecked, refresh: check };
};
