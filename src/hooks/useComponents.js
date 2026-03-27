/**
 * useComponents — custom hook that fetches the full component list.
 *
 * All side-effects (data fetching) are managed here, keeping pages thin.
 *
 * State model:
 *   items       – base truth, the raw list returned by the API.
 *   isLoading   – true while the first fetch is in flight.
 *   cloudWarning – derived from the last cloud sync status; empty string when healthy.
 *
 * Returns a stable `removeComponent(id)` updater that applies an immutable
 * filter to `items` without re-fetching.
 */
import { useCallback, useEffect, useState } from "react";
import { deleteComponent, getAllComponents, getCloudComponentsStatus } from "@/services/componentsStore";

export function useComponents() {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [cloudWarning, setCloudWarning] = useState("");

    useEffect(() => {
        let active = true;

        async function load() {
            setIsLoading(true);
            try {
                const list = await getAllComponents();
                if (!active) return;
                setItems(list);
                const status = getCloudComponentsStatus();
                setCloudWarning(status.degraded ? status.message : "");
            } finally {
                if (active) setIsLoading(false);
            }
        }

        load();

        return () => {
            active = false;
        };
    }, []);

    /**
     * Optimistically remove a component from the list and fire the DELETE API call.
     * On error the item is restored to keep the UI consistent.
     */
    const removeComponent = useCallback(async (id) => {
        setItems((prev) => prev.filter((c) => c.id !== id));
        try {
            await deleteComponent(id);
        } catch {
            // Restore on failure — refetch to get accurate state.
            const list = await getAllComponents().catch(() => []);
            setItems(list);
        }
    }, []);

    return { items, isLoading, cloudWarning, removeComponent };
}
