/**
 * Example Component: Database Usage Examples
 * This file demonstrates different ways to use the Supabase database
 * in your React Native components.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { database } from '@/services/database';
import {
    useSupabaseQuery,
    useSupabaseRealtimeQuery,
    useSupabaseSubscription
} from '@/hooks/useSupabase';
// Local interfaces for examples
interface Order {
    id: number;
    order_number: string;
    status: string;
    created_at: string;
}

interface MenuItem {
    id: number;
    name: string;
    price: number;
    category: string;
    available: boolean;
}

/**
 * Example 1: Basic data fetching with useState and useEffect
 */
export function Example1ManualFetch() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        const { data, error } = await database.getAll('orders');
        if (!error && data) {
            setOrders(data as unknown as Order[]);
        }
        setLoading(false);
    };

    if (loading) return <ActivityIndicator />;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Manual Fetch Example</Text>
            <FlatList
                data={orders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <Text>{item.order_number}: {item.status}</Text>
                )}
            />
            <Button title="Refresh" onPress={fetchOrders} />
        </View>
    );
}

/**
 * Example 2: Using custom hook for automatic data fetching
 */
export function Example2UseHook() {
    const { data: menuItems, loading, error, refetch } = useSupabaseQuery<MenuItem>('menu_items');

    if (loading) return <ActivityIndicator />;
    if (error) return <Text>Error: {error.message}</Text>;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Hook-based Fetch Example</Text>
            <FlatList
                data={menuItems}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <Text>{item.name}: ₹{item.price}</Text>
                )}
            />
            <Button title="Refresh" onPress={refetch} />
        </View>
    );
}

/**
 * Example 3: Real-time updates with automatic state management
 */
export function Example3Realtime() {
    const { data: orders, loading } = useSupabaseRealtimeQuery<Order>('orders');

    if (loading) return <ActivityIndicator />;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Real-time Orders</Text>
            <Text style={styles.subtitle}>Updates automatically!</Text>
            <FlatList
                data={orders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <Text>{item.order_number}: {item.status}</Text>
                )}
            />
        </View>
    );
}

/**
 * Example 4: Custom real-time subscription with callbacks
 */
export function Example4CustomSubscription() {
    const [orderCount, setOrderCount] = useState(0);

    useSupabaseSubscription('orders', {
        onInsert: (payload) => {
            console.log('New order received:', payload.new);
            setOrderCount(prev => prev + 1);
            // You could show a notification here
        },
        onUpdate: (payload) => {
            console.log('Order updated:', payload.new);
        },
        onDelete: (payload) => {
            console.log('Order deleted:', payload.old);
            setOrderCount(prev => Math.max(0, prev - 1));
        },
    });

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Subscription Example</Text>
            <Text>Total new orders: {orderCount}</Text>
        </View>
    );
}

/**
 * Example 5: CRUD operations
 */
export function Example5CRUD() {
    const [items, setItems] = useState<MenuItem[]>([]);

    // Create
    const createMenuItem = async () => {
        const newItem = {
            name: 'Margherita Pizza',
            price: 299,
            category: 'Pizza',
            available: true,
        };

        const { data, error } = await database.insert('menu_items', newItem);
        if (!error && data) {
            setItems([...items, data as unknown as MenuItem]);
        }
    };

    // Read
    const fetchMenuItems = async () => {
        const { data, error } = await database.getAll('menu_items');
        if (!error && data) {
            setItems(data as unknown as MenuItem[]);
        }
    };

    // Update
    const updateMenuItem = async (id: number) => {
        const updates = {
            price: 349,
            available: true,
        };

        const { data, error } = await database.update('menu_items', id, updates);
        if (!error && data) {
            setItems(items.map(item => item.id === id ? (data as unknown as MenuItem) : item));
        }
    };

    // Delete
    const deleteMenuItem = async (id: number) => {
        const { error } = await database.delete('menu_items', id);
        if (!error) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>CRUD Operations Example</Text>
            <Button title="Create New Item" onPress={createMenuItem} />
            <Button title="Fetch Items" onPress={fetchMenuItems} />
            <FlatList
                data={items}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <Text>{item.name}: ₹{item.price}</Text>
                        <Button title="Update" onPress={() => updateMenuItem(item.id as number)} />
                        <Button title="Delete" onPress={() => deleteMenuItem(item.id as number)} />
                    </View>
                )}
            />
        </View>
    );
}

/**
 * Example 6: Complex queries
 */
export function Example6Queries() {
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [expensiveItems, setExpensiveItems] = useState<MenuItem[]>([]);

    useEffect(() => {
        fetchActiveOrders();
        fetchExpensiveItems();
    }, []);

    const fetchActiveOrders = async () => {
        // Get all orders with status 'pending' or 'preparing'
        const { data: pending } = await database.query('orders', 'status', 'eq', 'pending');
        const { data: preparing } = await database.query('orders', 'status', 'eq', 'preparing');

        setActiveOrders([...((pending as unknown as Order[]) || []), ...((preparing as unknown as Order[]) || [])]);
    };

    const fetchExpensiveItems = async () => {
        // Get menu items with price greater than 500
        const { data } = await database.query('menu_items', 'price', 'gt', 500);
        if (data) {
            setExpensiveItems(data as unknown as MenuItem[]);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Query Examples</Text>

            <Text style={styles.subtitle}>Active Orders:</Text>
            <FlatList
                data={activeOrders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <Text>{item.order_number}: {item.status}</Text>
                )}
            />

            <Text style={styles.subtitle}>Premium Items (₹500+):</Text>
            <FlatList
                data={expensiveItems}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <Text>{item.name}: ₹{item.price}</Text>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 15,
        marginBottom: 5,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
});
