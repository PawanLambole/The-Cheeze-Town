import { useEffect, useState } from 'react';
import { customerDB } from '../services/database';

/**
 * Custom hook to fetch menu items
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
 * Custom hook to fetch available tables
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

        // Subscribe to real-time updates
        const subscription = customerDB.subscribeToTables((payload) => {
            console.log('Tables updated:', payload);
            fetchTables();
        });

        return () => {
            customerDB.unsubscribe(subscription);
        };
    }, []);

    return { tables, loading, error, refetch: fetchTables };
}

/**
 * Custom hook to get unique categories from menu items
 */
export function useCategories() {
    const { menuItems, loading, error } = useMenuItems();

    const categories = Array.from(new Set(menuItems.map(item => item.category)))
        .filter(Boolean);

    return { categories, loading, error };
}
