/**
 * hooks/useApi.ts
 *
 * Generic data-fetching hooks that replace the scattered
 * useState + useEffect + try/catch patterns found throughout the original codebase.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useFetch(() => logsApi.getAll());
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { ApiError } from "../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FetchState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export interface MutationState<T, A extends unknown[] = unknown[]> {
    data: T | null;
    loading: boolean;
    error: string | null;
    mutate: (...args: A) => Promise<T | null>;
    reset: () => void;
}

// ─── useFetch ─────────────────────────────────────────────────────────────────

/**
 * Fetches data on mount (and when deps change).
 * Re-runs when `refetch()` is called.
 */
export function useFetch<T>(
    fetcher: () => Promise<T>,
    deps: React.DependencyList = [],
): FetchState<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    const fetching = useRef(false);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            if (fetching.current) return;
            fetching.current = true;
            setLoading(true);
            setError(null);

            try {
                const result = await fetcher();
                if (!cancelled) setData(result);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof ApiError
                            ? err.message
                            : "An error occurred",
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
                fetching.current = false;
            }
        };

        run();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick, ...deps]);

    const refetch = useCallback(() => setTick((t) => t + 1), []);

    return { data, loading, error, refetch };
}

// ─── useMutation ──────────────────────────────────────────────────────────────

/**
 * Wraps an async mutation (create / update / delete).
 * Does NOT auto-run — call `mutate(args)` explicitly.
 */
export function useMutation<T, A extends unknown[]>(
    fn: (...args: A) => Promise<T>,
): MutationState<T, A> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutate = useCallback(
        async (...args: A): Promise<T | null> => {
            setLoading(true);
            setError(null);
            try {
                const result = await fn(...args);
                setData(result);
                return result;
            } catch (err) {
                const msg =
                    err instanceof ApiError ? err.message : "Operation failed";
                setError(msg);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [fn],
    );

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return { data, loading, error, mutate, reset };
}

// ─── useInterval ─────────────────────────────────────────────────────────────

/**
 * Runs a callback on a repeating interval.
 * Pass `null` as delay to pause.
 */
export function useInterval(callback: () => void, delay: number | null) {
    const savedCallback = useRef(callback);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        if (delay === null) return;
        const id = setInterval(() => savedCallback.current(), delay);
        return () => clearInterval(id);
    }, [delay]);
}

// ─── useDebounce ─────────────────────────────────────────────────────────────

export function useDebounce<T>(value: T, ms = 300): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return debounced;
}

// ─── useLocalStorage ─────────────────────────────────────────────────────────

export function useLocalStorage<T>(
    key: string,
    initialValue: T,
): [T, (v: T) => void] {
    const [value, setValueState] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? (JSON.parse(item) as T) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = useCallback(
        (v: T) => {
            setValueState(v);
            try {
                localStorage.setItem(key, JSON.stringify(v));
            } catch {
                /* quota exceeded — ignore */
            }
        },
        [key],
    );

    return [value, setValue];
}
