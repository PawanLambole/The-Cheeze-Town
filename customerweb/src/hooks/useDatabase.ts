import { useState, useEffect } from 'react';
import customerDB from '../services/database';

/**
 * Hook to fetch menu items
 */
export function useMenuItems() {
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const fetchMenuItems = async () => {
        setLoading(true);
        const { data, error: fetchError } = await customerDB.getMenuItems();

        if (fetchError) {
            setError(fetchError);
            setMenuItems([]);
        } else {
            setMenuItems(data || []);
            setError(null);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchMenuItems();

        // Subscribe to real-time updates
        const subscription = customerDB.subscribeToMenu((payload) => {
            console.log('Menu updated:', payload);
            fetchMenuItems();
        });

        return () => {
            customerDB.unsubscribe(subscription);
        };
    }, []);

    return { menuItems, loading, error, refetch: fetchMenuItems };
}

/**
 * Hook to fetch menu categories
 */
export function useCategories() {
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            const { data, error: fetchError } = await customerDB.getCategories();

            if (fetchError) {
                setError(fetchError);
                setCategories([]);
            } else {
                setCategories(data || []);
                setError(null);
            }

            setLoading(false);
        };

        fetchCategories();
    }, []);

    return { categories, loading, error };
}

/**
 * Hook to fetch available tables
 */
export function useAvailableTables() {
    const [tables, setTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const fetchTables = async () => {
        setLoading(true);
        const { data, error: fetchError } = await customerDB.getAvailableTables();

        if (fetchError) {
            setError(fetchError);
            setTables([]);
        } else {
            setTables(data || []);
            setError(null);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchTables();
    }, []);

    return { tables, loading, error, refetch: fetchTables };
}
