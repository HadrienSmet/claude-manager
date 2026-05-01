import { useEffect, useState } from "react";

const HEALTH_STATUS = {
	connected: "connected",
	disconnected: "disconnected",
	checking: "checking",
} as const;
export type HealthStatus = typeof HEALTH_STATUS[keyof typeof HEALTH_STATUS];

const API_URL = "http://127.0.0.1:3001";
const POLL_INTERVAL_MS = 5000;

export const useHealthCheck = () => {
    const [status, setStatus] = useState<HealthStatus>(HEALTH_STATUS.checking);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    const check = async (): Promise<void> => {
        try {
            const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) });
            setStatus(res.ok ? HEALTH_STATUS.connected : HEALTH_STATUS.disconnected);
        } catch {
            setStatus(HEALTH_STATUS.disconnected);
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
