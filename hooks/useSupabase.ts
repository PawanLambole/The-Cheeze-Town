import { useEffect, useState } from 'react';
import { database } from '@/services/database';

/**
 * Custom hook to fetch data from a Supabase table
 * @param tableName - Name of the table to fetch from
 * @param dependencies - Dependencies array for useEffect (optional)
 * @returns Object with data, loading state, error, and refetch function
 */
export function useSupabaseQuery<T = any>(
    tableName: string,
    dependencies: any[] = []
) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        const { data: fetchedData, error: fetchError } = await database.getAll(tableName);

        if (fetchError) {
            setError(fetchError);
            setData([]);
        } else {
            setData(fetchedData || []);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, dependencies);

    return { data, loading, error, refetch: fetchData };
}

/**
 * Custom hook to fetch a single record by ID
 * @param tableName - Name of the table
 * @param id - Record ID
 * @returns Object with data, loading state, error, and refetch function
 */
export function useSupabaseQueryById<T = any>(
    tableName: string,
    id: string | number | null
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const fetchData = async () => {
        if (!id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const { data: fetchedData, error: fetchError } = await database.getById(tableName, id);

        if (fetchError) {
            setError(fetchError);
            setData(null);
        } else {
            setData(fetchedData);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [tableName, id]);

    return { data, loading, error, refetch: fetchData };
}

/**
 * Custom hook for real-time subscriptions
 * @param tableName - Name of the table to subscribe to
 * @param onInsert - Callback for INSERT events
 * @param onUpdate - Callback for UPDATE events
 * @param onDelete - Callback for DELETE events
 */
export function useSupabaseSubscription(
    tableName: string,
    options?: {
        onInsert?: (payload: any) => void;
        onUpdate?: (payload: any) => void;
        onDelete?: (payload: any) => void;
        onChange?: (payload: any) => void;
    }
) {
    useEffect(() => {
        const subscription = database.subscribe(tableName, (payload) => {
            // Call the general onChange callback if provided
            if (options?.onChange) {
                options.onChange(payload);
            }

            // Call specific event callbacks
            switch (payload.eventType) {
                case 'INSERT':
                    if (options?.onInsert) {
                        options.onInsert(payload);
                    }
                    break;
                case 'UPDATE':
                    if (options?.onUpdate) {
                        options.onUpdate(payload);
                    }
                    break;
                case 'DELETE':
                    if (options?.onDelete) {
                        options.onDelete(payload);
                    }
                    break;
            }
        });

        return () => {
            database.unsubscribe(subscription);
        };
    }, [tableName]);
}

/**
 * Custom hook with real-time updates
 * Combines query and subscription for automatic updates
 * @param tableName - Name of the table
 * @returns Object with data, loading state, error, and refetch function
 */
export function useSupabaseRealtimeQuery<T = any>(tableName: string) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        const { data: fetchedData, error: fetchError } = await database.getAll(tableName);

        if (fetchError) {
            setError(fetchError);
            setData([]);
        } else {
            setData(fetchedData || []);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();

        // Set up real-time subscription
        const subscription = database.subscribe(tableName, (payload) => {
            if (payload.eventType === 'INSERT') {
                setData((current) => [...current, payload.new]);
            } else if (payload.eventType === 'UPDATE') {
                setData((current) =>
                    current.map((item: any) =>
                        item.id === payload.new.id ? payload.new : item
                    )
                );
            } else if (payload.eventType === 'DELETE') {
                setData((current) =>
                    current.filter((item: any) => item.id !== payload.old.id)
                );
            }
        });

        return () => {
            database.unsubscribe(subscription);
        };
    }, [tableName]);

    return { data, loading, error, refetch: fetchData };
}
