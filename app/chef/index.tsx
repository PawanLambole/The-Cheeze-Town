import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator, RefreshControl, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LogOut, Clock, CheckCircle, Settings, Bell, X, Volume2 } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Theme';
import { useSupabaseRealtimeQuery } from '@/hooks/useSupabase';
import { database, supabase } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationSettings } from '@/contexts/NotificationSettingsContext';
import { notificationService } from '@/services/NotificationService';
import { soundService } from '@/services/SoundService';
import { deductInventoryForOrder } from '@/services/inventoryService';


interface OrderItem {
    id?: number;
    menu_item_name: string;
    quantity: number;
    special_instructions?: string | null;
    created_at?: string;
}

interface Order {
    id: number;
    order_number: string | null;
    table_id: number | null;
    status: string | null;
    total_amount: number | null;
    notes?: string | null;
    order_time: string | null;
    created_at: string | null;
    order_items?: OrderItem[];
}

export default function ChefDashboard() {
    const router = useRouter();
    const { t } = useTranslation();
    const { userData } = useAuth();
    const { soundEnabled, popupEnabled, systemEnabled } = useNotificationSettings();
    const [orders, setOrders] = useState<Order[]>([]);
    const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

    // Notification State
    const [notificationOrder, setNotificationOrder] = useState<any>(null);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationType, setNotificationType] = useState<'new' | 'update'>('new');
    const [newItems, setNewItems] = useState<any[]>([]);

    const handleSpeakOrder = async (order: any, type: 'new' | 'update' = 'new', specificItems: any[] = []) => {
        const tableText = order.table_id ? `Table ${order.table_id}` : 'Takeaway order';
        const orderNumText = order.order_number ? `Order number ${order.order_number.replace(/\D/g, '')}` : '';

        let intro = "";
        let itemsList = "";

        if (type === 'new') {
            intro = `Please serve the new order, ${orderNumText}, to ${tableText}.`;
            if (activeTab === 'completed') return; // Don't speak if looking at completed

            if (order.order_items && order.order_items.length > 0) {
                itemsList = order.order_items.map((item: any) =>
                    `${item.quantity} ${item.menu_item_name}`
                ).join(', and ');
            } else {
                itemsList = "No items listed";
            }
        } else {
            // Update
            intro = `Attention! Order updated for ${tableText}.`;
            if (specificItems.length > 0) {
                itemsList = "New items added: " + specificItems.map((item: any) =>
                    `${item.quantity} ${item.menu_item_name}`
                ).join(', and ');
            } else {
                itemsList = "New items added.";
            }
        }

        const speechText = `${intro} ${itemsList}. Thank you`;

        Speech.stop();

        try {
            const voices = await Speech.getAvailableVoicesAsync();
            // Try to find a clear English voice
            const bestVoice = voices.find(v => v.language.includes('en-US') && v.quality === 'Enhanced') ||
                voices.find(v => v.language.includes('en-GB')) ||
                voices[0];

            Speech.speak(speechText, {
                language: 'en-US',
                pitch: 1.0,
                rate: 0.9,
                voice: bestVoice?.identifier
            });
        } catch (e) {
            Speech.speak(speechText, { language: 'en', pitch: 1.0, rate: 0.9 });
        }
    };

    // Debounce ref for item updates
    const updateQueue = React.useRef<{ [key: string]: any[] }>({});
    const updateTimers = React.useRef<{ [key: string]: any }>({});

    // Initialize data and real-time subscriptions
    useEffect(() => {
        // Load sound service
        soundService.loadSound();

        // Initial fetch
        fetchOrders();

        // Listen for NEW ORDERS
        const subOrders = database.subscribe('orders', async (payload: any) => {
            console.log('⚡ Orders Event:', payload.eventType);

            if (payload.eventType === 'INSERT') {
                console.log('🔔 New Order Created');
                // Allow a moment for items to be inserted before fetching
                setTimeout(async () => {
                    // We verify it's a new order by checking if we already have it or if it's very recent
                    // But strictly speaking, any INSERT to 'orders' is a new order header
                    handleNewOrderNotification(payload.new);
                }, 1000);
            }

            fetchOrders();
        });

        // Listen for ORDER ITEMS (Updates & New Items)
        const subOrderItems = database.subscribe('order_items', async (payload: any) => {
            console.log('⚡ Order Items Event:', payload.eventType);

            if (payload.eventType === 'INSERT') {
                const newItem = payload.new;
                const orderId = newItem.order_id;

                // Fetch the parent order to check its age and status
                const { data: orderData } = await supabase
                    .from('orders')
                    .select('created_at, order_number, table_id, total_amount, status')
                    .eq('id', orderId)
                    .single();

                if (orderData && orderData.created_at) {
                    const createdAt = new Date(orderData.created_at).getTime();
                    const now = new Date().getTime();
                    const ageInSeconds = (now - createdAt) / 1000;

                    // If order is older than 30 seconds, treat items as an UPDATE
                    if (ageInSeconds > 30) {
                        console.log(`🔔 Update detected for Order #${orderData.order_number} (+${newItem.quantity} ${newItem.menu_item_name})`);

                        // If the order was already completed/ready, move it back to pending so chef sees it
                        if (['ready', 'served', 'completed'].includes(orderData.status || '')) {
                            await supabase
                                .from('orders')
                                .update({
                                    status: 'pending',
                                    is_served: false,
                                    prepared_time: null, // Reset prepared time so it's not sorted as old? Maybe optional.
                                    completed_time: null
                                })
                                .eq('id', orderId);
                            console.log('↺ Reverted order status to pending for update');
                        }

                        // Batching logic
                        if (!updateQueue.current[orderId]) {
                            updateQueue.current[orderId] = [];
                        }
                        updateQueue.current[orderId].push(newItem);

                        // Clear existing timer
                        if (updateTimers.current[orderId]) {
                            clearTimeout(updateTimers.current[orderId]);
                        }

                        // Set new timer (Debounce)
                        updateTimers.current[orderId] = setTimeout(() => {
                            const items = updateQueue.current[orderId];
                            delete updateQueue.current[orderId];
                            delete updateTimers.current[orderId];

                            if (items && items.length > 0) {
                                handleOrderUpdateNotification(orderData, items);
                            }
                        }, 2000); // 2 seconds batch window
                    } else {
                        console.log('ℹ️ Item part of new order (ignored for update notification)');
                    }
                }
            }

            fetchOrders();
        });

        return () => {
            database.unsubscribe(subOrders);
            database.unsubscribe(subOrderItems);
            soundService.unload();
        };
    }, [soundEnabled, popupEnabled, systemEnabled]);

    const handleNewOrderNotification = async (orderData: any) => {
        try {
            // Fetch items
            const { data: items } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', orderData.id);

            const completeOrder = { ...orderData, order_items: items || [] };

            // 1. Play Sound
            if (soundEnabled) await soundService.playNotificationSound();

            // 2. Show System Notification
            if (systemEnabled) {
                const itemsList = (items || []).map((i: any) => `${i.quantity}x ${i.menu_item_name}`).join(', ');
                await notificationService.scheduleNotification(
                    `New Order #${orderData.order_number || ''}`,
                    itemsList || 'No items',
                    { orderId: orderData.id },
                    { playSound: false } // Already played
                );
            }

            // 3. In-App Modal
            if (popupEnabled) {
                setNotificationType('new');
                setNewItems([]);
                setNotificationOrder(completeOrder);
                setShowNotification(true);
                handleSpeakOrder(completeOrder, 'new');
            }
        } catch (e) {
            console.error('Error in new order notification:', e);
        }
    };

    const handleOrderUpdateNotification = async (orderData: any, newItemsList: any[]) => {
        try {
            console.log('🚨 DISPATCHING UPDATE NOTIFICATION', newItemsList.length);

            // 1. Play Sound (maybe different sound? for now same)
            if (soundEnabled) await soundService.playNotificationSound();

            // 2. System Notification
            if (systemEnabled) {
                const itemsList = newItemsList.map((i: any) => `${i.quantity}x ${i.menu_item_name}`).join(', ');
                await notificationService.scheduleNotification(
                    `Order Updated #${orderData.order_number}`,
                    `Added: ${itemsList}`,
                    { orderId: orderData.id },
                    { playSound: false }
                );
            }

            // 3. In-App Modal
            if (popupEnabled) {
                const completeOrder = { ...orderData, order_items: newItemsList }; // Display ONLY new items in the modal list effectively?
                // Actually, we probably want to show the full order but HIGHLIGHT the new ones.
                // For simplified UX, let's show the order info + the LIST of new items specifically.

                setNotificationType('update');
                setNewItems(newItemsList);
                setNotificationOrder(orderData); // This is just the header info essentially
                setShowNotification(true);

                handleSpeakOrder(orderData, 'update', newItemsList);
            }

        } catch (e) {
            console.error('Error in order update notification:', e);
        }
    };

    // Helper: today's range in local time, converted to UTC ISO for Supabase.
    // Use [startOfDay, startOfNextDay) to avoid millisecond edge cases.
    const getTodayRange = () => {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const startOfNextDay = new Date(startOfDay);
        startOfNextDay.setDate(startOfNextDay.getDate() + 1);

        return {
            start: startOfDay.toISOString(),
            end: startOfNextDay.toISOString(),
        };
    };

    const fetchOrders = async () => {
        if (!loading && !refreshing) setRefreshing(true);
        try {
            const { start, end } = getTodayRange();

            // 1) Fetch active orders (today only)
            // Include 'paid' status since web orders are marked as 'paid' after successful payment
            const { data: activeOrders, error: activeError } = await supabase
                .from('orders')
                .select('id, order_number, table_id, status, total_amount, notes, order_time, created_at, prepared_time')
                .in('status', ['pending', 'preparing', 'paid'])
                .gte('created_at', start)
                .lt('created_at', end)
                .order('created_at', { ascending: true });

            // 2) Fetch completed orders (keep to today)
            const { data: completedOrdersRaw, error: completedError } = await supabase
                .from('orders')
                .select('id, order_number, table_id, status, total_amount, notes, order_time, created_at, prepared_time')
                .in('status', ['ready', 'served', 'completed'])
                .gte('created_at', start)
                .lt('created_at', end)
                .order('prepared_time', { ascending: false });

            if (activeError) console.error('Error fetching active orders:', activeError);
            if (completedError) console.error('Error fetching completed orders:', completedError);

            const safeActive = (activeOrders || []) as unknown as Order[];
            const safeCompleted = (completedOrdersRaw || []) as unknown as Order[];

            const allIds = [...safeActive, ...safeCompleted].map(o => o.id).filter(Boolean);

            let itemsByOrderId = new Map<number, OrderItem[]>();
            if (allIds.length > 0) {
                const { data: itemsData, error: itemsError } = await supabase
                    .from('order_items')
                    .select('id, order_id, menu_item_name, quantity, special_instructions, created_at')
                    .in('order_id', allIds);

                if (itemsError) {
                    console.error('Error fetching order items:', itemsError);
                } else {
                    for (const row of itemsData || []) {
                        const orderId = Number((row as any).order_id);
                        const item: OrderItem = {
                            id: (row as any).id,
                            menu_item_name: (row as any).menu_item_name,
                            quantity: Number((row as any).quantity) || 0,
                            special_instructions: (row as any).special_instructions ?? null,
                            created_at: (row as any).created_at // Added timestamp
                        };
                        const existing = itemsByOrderId.get(orderId) || [];
                        existing.push(item);
                        itemsByOrderId.set(orderId, existing);
                    }
                }
            }

            setOrders(safeActive.map(o => ({ ...o, order_items: itemsByOrderId.get(o.id) || [] })));
            setCompletedOrders(safeCompleted.map(o => ({ ...o, order_items: itemsByOrderId.get(o.id) || [] })));
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const handleMarkServed = (order: Order) => {
        setSelectedOrder(order);
        setShowConfirmModal(true);
    };

    const confirmMarkServed = async () => {
        if (selectedOrder) {
            try {
                // Check if order is already paid (Web orders)
                const isPaid = selectedOrder.status === 'paid';

                // If paid, mark as completed directly. Else mark as ready.
                const newStatus = isPaid ? 'completed' : 'ready';

                const updateData: any = {
                    status: newStatus,
                    is_served: true,
                    prepared_time: new Date().toISOString()
                };

                // If completing, set completed_time as well
                if (newStatus === 'completed') {
                    updateData.completed_time = new Date().toISOString();

                    // AUTOMATIC INVENTORY DEDUCTION (For Pre-paid/Web Orders)
                    if (isPaid && selectedOrder.order_items && selectedOrder.order_items.length > 0) {
                        try {
                            const itemsToDeduct = selectedOrder.order_items.map((item: any) => ({
                                menu_item_name: item.menu_item_name,
                                quantity: item.quantity
                            }));
                            await deductInventoryForOrder(itemsToDeduct);
                            console.log('✅ Inventory deducted for prepaid order:', selectedOrder.order_number);
                        } catch (invError) {
                            console.error('❌ Error deducting inventory for prepaid order:', invError);
                        }
                    }
                }

                await database.update('orders', selectedOrder.id, updateData);

                // Orders will be refreshed via real-time subscription
                setShowConfirmModal(false);
                setSelectedOrder(null);
            } catch (error) {
                console.error('Error updating order:', error);
                Alert.alert('Error', 'Failed to update order status');
            }
        }
    };

    const handleTestNotification = async () => {
        console.log('🔔 Testing Notification');
        await soundService.playNotificationSound();

        await notificationService.scheduleNotification(
            'Test Order 🔔',
            'This is a test notification for Table 99',
            { test: true },
            { playSound: true }
        );

        setNotificationOrder({
            order_number: 'TEST-ORDER',
            table_id: 99,
            created_at: new Date().toISOString()
        });
        setShowNotification(true);
    };

    const { signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        // Layout will handle redirect when isAuthenticated becomes false
        // But we can explicit replace to be sure
        // router.replace('/login/index'); 
    };

    /* ... existing code ... */
    const insets = useSafeAreaInsets();

    // Helper function to calculate order duration
    const getOrderDuration = (orderTime: string) => {
        const now = new Date();
        const orderDate = new Date(orderTime);
        const diffMs = now.getTime() - orderDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return t('chef.justNow');
        return `${diffMins}m`;
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <View>
                    <Text style={styles.headerTitle}>{t('chef.title')}</Text>
                    <Text style={styles.headerSubtitle}>{t('chef.subtitle')}</Text>
                </View>
                <View style={styles.headerButtons}>
                    {/* Test Notification Button */}
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={handleTestNotification}
                    >
                        <Bell size={20} color={Colors.dark.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => router.push('/chef/settings')}
                    >
                        <Settings size={20} color={Colors.dark.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'active' && styles.activeTab]}
                    onPress={() => setActiveTab('active')}
                >
                    <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
                        {t('chef.active')} ({orders.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
                    onPress={() => setActiveTab('completed')}
                >
                    <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
                        {t('chef.completed')} ({completedOrders.length})
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchOrders}
                        tintColor={Colors.dark.primary}
                        colors={[Colors.dark.primary]}
                    />
                }
            >
                {loading ? (
                    <View style={styles.emptyContainer}>
                        <ActivityIndicator size="large" color={Colors.dark.primary} />
                        <Text style={styles.emptyText}>Loading orders...</Text>
                    </View>
                ) : activeTab === 'active' ? (
                    // Active Orders Tab
                    orders.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <CheckCircle size={64} color={Colors.dark.secondary} />
                            <Text style={styles.emptyText}>All orders completed!</Text>
                            <Text style={styles.emptySubtext}>Great job! 🎉</Text>
                        </View>
                    ) : (
                        orders.map(order => (
                            <View key={order.id} style={styles.orderCard}>
                                {/* Header */}
                                <View style={styles.orderHeader}>
                                    <View>
                                        <Text style={styles.tableNumber}>
                                            {order.table_id ? `${t('chef.table')} ${order.table_id}` : t('chef.takeaway')}
                                        </Text>
                                        <Text style={styles.orderId}>#{order.order_number || 'N/A'}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                        {/* Speak Button */}
                                        <TouchableOpacity
                                            onPress={() => handleSpeakOrder(order)}
                                            style={styles.speakButton}
                                        >
                                            <Volume2 size={16} color={Colors.dark.textSecondary} />
                                        </TouchableOpacity>

                                        <View style={styles.timerBadge}>
                                            <Clock size={12} color="#F59E0B" />
                                            <Text style={styles.timerText}>{getOrderDuration(order.created_at ?? new Date().toISOString())}</Text>
                                        </View>
                                        {order.total_amount && (
                                            <Text style={styles.orderTotal}>₹{order.total_amount}</Text>
                                        )}
                                    </View>
                                </View>

                                {/* Divider */}
                                <View style={styles.divider} />

                                {/* Items List */}
                                <View style={styles.itemsList}>
                                    {(() => {
                                        // Logic to determine visible items:
                                        // 1. Group items by creation time (batches)
                                        // 2. If multiple batches, assume older ones are done and show only the LATEST batch.
                                        // 3. If single batch (New Order), show all.

                                        const items = order.order_items || [];
                                        if (items.length === 0) return null;

                                        // Helper to parse safe date
                                        const getTime = (dateStr?: string) => dateStr ? new Date(dateStr).getTime() : 0;

                                        // Sort by creation time
                                        const sortedItems = [...items].sort((a, b) => getTime(a.created_at) - getTime(b.created_at));

                                        // If no timestamps available (legacy), show all
                                        if (!sortedItems[0].created_at) {
                                            return sortedItems.map((item, index) => (
                                                <View key={index} style={styles.orderItemCard}>
                                                    <View style={styles.orderItemHeader}>
                                                        <View style={styles.quantityBadge}>
                                                            <Text style={styles.quantityText}>{item.quantity}</Text>
                                                        </View>
                                                        <Text style={styles.itemName} numberOfLines={2}>{item.menu_item_name}</Text>
                                                    </View>
                                                    {item.special_instructions && (
                                                        <Text style={styles.itemNotes}>
                                                            📝 {item.special_instructions}
                                                        </Text>
                                                    )}
                                                </View>
                                            ));
                                        }

                                        // Group into batches (~2 min threshold)
                                        const batches: any[][] = [];
                                        let currentBatch: any[] = [];
                                        let batchStartTime = getTime(sortedItems[0].created_at);

                                        sortedItems.forEach((item) => {
                                            const itemTime = getTime(item.created_at);
                                            if (itemTime - batchStartTime > 2 * 60 * 1000) {
                                                // New batch
                                                batches.push(currentBatch);
                                                currentBatch = [item];
                                                batchStartTime = itemTime;
                                            } else {
                                                currentBatch.push(item);
                                            }
                                        });
                                        if (currentBatch.length > 0) batches.push(currentBatch);

                                        // Show only the LATEST batch
                                        const visibleItems = batches[batches.length - 1];
                                        const isUpdate = batches.length > 1;

                                        return visibleItems.map((item, index) => (
                                            <View key={index} style={[
                                                styles.orderItemCard,
                                                isUpdate && { borderColor: '#F59E0B', borderWidth: 1 } // Highlight updates
                                            ]}>
                                                <View style={styles.orderItemHeader}>
                                                    <View style={[
                                                        styles.quantityBadge,
                                                        isUpdate && { backgroundColor: '#F59E0B' }
                                                    ]}>
                                                        <Text style={[
                                                            styles.quantityText,
                                                            isUpdate && { color: '#000' }
                                                        ]}>{item.quantity}</Text>
                                                    </View>
                                                    <Text style={styles.itemName} numberOfLines={2}>{item.menu_item_name}</Text>
                                                </View>
                                                {item.special_instructions && (
                                                    <Text style={styles.itemNotes}>
                                                        📝 {item.special_instructions}
                                                    </Text>
                                                )}
                                            </View>
                                        ));
                                    })()}
                                </View>

                                {/* Order Notes */}
                                {order.notes && (
                                    <View style={styles.orderNotes}>
                                        <Text style={styles.orderNotesText}>Note: {order.notes}</Text>
                                    </View>
                                )}

                                {/* Action Button */}
                                <TouchableOpacity
                                    style={styles.completeButton}
                                    onPress={() => handleMarkServed(order)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <CheckCircle size={20} color="#000000" />
                                        <Text style={styles.completeButtonText}>Mark Ready</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ))
                    )
                ) : (
                    // Completed Orders Tab
                    completedOrders.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Clock size={64} color={Colors.dark.secondary} />
                            <Text style={styles.emptyText}>No completed orders today</Text>
                            <Text style={styles.emptySubtext}>Completed orders will appear here</Text>
                        </View>
                    ) : (
                        completedOrders.map(order => (
                            <View key={order.id} style={styles.completedOrderCard}>
                                <View style={styles.orderHeader}>
                                    <View>
                                        <Text style={styles.tableNumber}>
                                            {order.table_id ? `${t('chef.table')} ${order.table_id}` : t('chef.takeaway')}
                                        </Text>
                                        <Text style={styles.orderId}>#{order.order_number || 'N/A'}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                        <View style={styles.completedBadge}>
                                            <CheckCircle size={12} color="#10B981" />
                                            <Text style={styles.completedText}>Ready</Text>
                                        </View>
                                        {order.total_amount && (
                                            <Text style={styles.orderTotal}>₹{order.total_amount}</Text>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.itemsList}>
                                    {order.order_items?.map((item, index) => (
                                        <View key={index} style={styles.orderItemCard}>
                                            <View style={styles.orderItemHeader}>
                                                <View style={styles.quantityBadgeCompleted}>
                                                    <Text style={styles.quantityTextCompleted}>{item.quantity}</Text>
                                                </View>
                                                <Text style={styles.itemNameCompleted} numberOfLines={2}>{item.menu_item_name}</Text>
                                            </View>
                                            {item.special_instructions && (
                                                <Text style={styles.itemNotes}>
                                                    📝 {item.special_instructions}
                                                </Text>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))
                    )
                )
                }
                <View style={{ height: 20 }} />
            </ScrollView >

            {/* Custom Confirmation Modal */}
            {/* Active Orders Tab content... */}

            {/* Custom Confirmation Modal */}
            <Modal visible={showConfirmModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('chef.markAsReady')}</Text>
                        <Text style={styles.modalMessage}>{t('chef.confirmReadyMessage')}</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowConfirmModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={confirmMarkServed}
                            >
                                <Text style={styles.confirmButtonText}>{t('common.confirm')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* NEW ORDER NOTIFICATION MODAL */}
            <Modal visible={showNotification} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.notificationContent}>
                        {/* Header */}
                        <View style={styles.notificationHeader}>
                            <View style={styles.notificationHeaderLeft}>
                                <Bell size={32} color={Colors.dark.primary} />
                                <View>
                                    <Text style={styles.notificationTitle}>
                                        {notificationType === 'new' ? t('chef.newOrder') : 'Order Updated!'}
                                    </Text>
                                    {notificationType === 'update' && (
                                        <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>New Items Added</Text>
                                    )}
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => handleSpeakOrder(notificationOrder, notificationType, newItems)}>
                                    <Volume2 size={24} color={Colors.dark.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setShowNotification(false)}>
                                    <X size={24} color={Colors.dark.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Order Info Section */}
                        <View style={styles.notificationSection}>
                            <View style={styles.notificationRow}>
                                <Text style={styles.notificationLabel}>{t('chef.orderNumber')}</Text>
                                <Text style={styles.notificationValue} numberOfLines={1}>
                                    {notificationOrder?.order_number || 'N/A'}
                                </Text>
                            </View>
                            <View style={styles.notificationDivider} />
                            <View style={styles.notificationRow}>
                                <Text style={styles.notificationLabel}>{t('chef.table')}</Text>
                                <Text style={styles.notificationValue}>
                                    {notificationOrder?.table_id ? `${t('chef.table')} ${notificationOrder.table_id}` : t('chef.takeaway')}
                                </Text>
                            </View>
                            {notificationOrder?.total_amount && (
                                <>
                                    <View style={styles.notificationDivider} />
                                    <View style={styles.notificationRow}>
                                        <Text style={styles.notificationLabel}>{t('common.total')}</Text>
                                        <Text style={styles.notificationValueHighlight}>₹{notificationOrder.total_amount}</Text>
                                    </View>
                                </>
                            )}
                        </View>

                        {/* Items Section */}
                        <View style={styles.notificationSection}>
                            <Text style={styles.notificationSectionTitle}>
                                {notificationType === 'new' ? 'Order Items' : 'New Items Added'}
                            </Text>
                            <ScrollView style={styles.notificationItemsList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                                {notificationType === 'new' ? (
                                    // Show ALL items for new order
                                    notificationOrder?.order_items?.map((item: any, index: number) => (
                                        <View key={index} style={styles.notificationItemCard}>
                                            <View style={styles.notificationItemHeader}>
                                                <View style={styles.notificationQtyBadge}>
                                                    <Text style={styles.notificationQtyText}>{item.quantity}</Text>
                                                </View>
                                                <Text style={styles.notificationItemName} numberOfLines={2}>
                                                    {item.menu_item_name}
                                                </Text>
                                            </View>
                                            {item.special_instructions && (
                                                <Text style={styles.notificationItemNotes} numberOfLines={2}>
                                                    📝 {item.special_instructions}
                                                </Text>
                                            )}
                                        </View>
                                    ))
                                ) : (
                                    // Show ONLY new items for update
                                    newItems.map((item: any, index: number) => (
                                        <View key={index} style={[styles.notificationItemCard, { borderColor: '#F59E0B', borderWidth: 1 }]}>
                                            <View style={styles.notificationItemHeader}>
                                                <View style={[styles.notificationQtyBadge, { backgroundColor: '#F59E0B' }]}>
                                                    <Text style={[styles.notificationQtyText, { color: '#000' }]}>{item.quantity}</Text>
                                                </View>
                                                <Text style={styles.notificationItemName} numberOfLines={2}>
                                                    {item.menu_item_name}
                                                </Text>
                                            </View>
                                            {item.special_instructions && (
                                                <Text style={styles.notificationItemNotes} numberOfLines={2}>
                                                    📝 {item.special_instructions}
                                                </Text>
                                            )}
                                        </View>
                                    ))
                                )}
                            </ScrollView>
                        </View>

                        {/* Action Button */}
                        <TouchableOpacity
                            style={styles.notificationButton}
                            onPress={() => {
                                setShowNotification(false);
                                fetchOrders();
                            }}
                        >
                            <Text style={styles.notificationButtonText}>Got It!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>



        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Colors.dark.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.dark.primary,
        marginTop: 4,
        fontWeight: '600',
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    settingsButton: {
        padding: 8,
        backgroundColor: 'rgba(253, 184, 19, 0.1)',
        borderRadius: 8,
    },
    logoutButton: {
        padding: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    orderCard: {
        backgroundColor: '#1E1E1E', // Slightly lighter than background
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333333',
        borderLeftWidth: 4, // Accent strip to pop
        borderLeftColor: '#F59E0B', // Gold accent
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333333', // Subtle separator
    },
    orderInfo: {
        gap: 4,
    },
    tableNumber: {
        fontSize: 22, // Larger
        fontWeight: '800',
        color: '#FFFFFF', // High contrast white
        marginBottom: 2,
    },
    orderId: {
        fontSize: 14,
        color: '#9CA3AF', // Lighter grey for subtitle
        fontFamily: 'monospace', // Tech feel for ID
    },
    orderTotal: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.dark.primary,
        marginTop: 4,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    timerText: {
        color: '#F59E0B',
        fontWeight: '600',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.dark.border,
        marginBottom: 12,
    },
    itemsList: {
        gap: 12, // More breathing room
        marginBottom: 20,
    },
    orderItemCard: {
        backgroundColor: '#262626', // Distinct background from card
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    orderItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    speakButton: {
        padding: 4,
        marginRight: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
    },
    quantityBadge: {
        backgroundColor: '#F59E0B', // Solid Gold
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        elevation: 2,
    },
    quantityText: {
        color: '#000000', // Black on Gold is distinct
        fontWeight: '800',
        fontSize: 16,
    },
    itemName: {
        fontSize: 17, // Slightly larger
        color: '#FFFFFF', // White for readability
        fontWeight: '600',
        flex: 1,
    },
    itemNotes: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        marginTop: 6,
        marginLeft: 40,
        fontStyle: 'normal',
    },
    orderNotes: {
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 3,
        borderLeftColor: '#F59E0B',
    },
    orderNotesText: {
        fontSize: 14,
        color: Colors.dark.text,
        lineHeight: 20,
    },
    completeButton: {
        backgroundColor: '#10B981', // Emerald Green for action
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    completeButtonText: {
        color: '#FFFFFF', // White text on Green
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        gap: 16,
    },
    emptyText: {
        fontSize: 18,
        color: Colors.dark.textSecondary,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: Colors.dark.card,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.dark.secondary,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    confirmButton: {
        backgroundColor: Colors.dark.primary,
    },
    cancelButtonText: {
        color: Colors.dark.text,
        fontWeight: '600',
        fontSize: 16,
    },
    confirmButtonText: {
        color: '#000000',
        fontWeight: '700',
        fontSize: 16,
    },
    notificationContent: {
        backgroundColor: Colors.dark.card,
        borderRadius: 16,
        width: '90%',
        maxWidth: 400,
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: Colors.dark.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    notificationHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    notificationTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    notificationSection: {
        padding: 16,
        gap: 12,
    },
    notificationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notificationDivider: {
        height: 1,
        backgroundColor: Colors.dark.border,
    },
    notificationLabel: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        fontWeight: '500',
    },
    notificationValue: {
        fontSize: 15,
        color: Colors.dark.text,
        fontWeight: '600',
    },
    notificationValueHighlight: {
        fontSize: 18,
        color: Colors.dark.primary,
        fontWeight: '700',
    },
    notificationSectionTitle: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        fontWeight: '600',
        marginBottom: 8,
    },
    notificationItemsList: {
        maxHeight: 200,
    },
    notificationItemCard: {
        backgroundColor: Colors.dark.secondary,
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    notificationItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    notificationQtyBadge: {
        backgroundColor: Colors.dark.primary,
        width: 28,
        height: 28,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationQtyText: {
        fontSize: 14,
        color: '#000',
        fontWeight: '700',
    },
    notificationItemName: {
        fontSize: 15,
        color: Colors.dark.text,
        fontWeight: '500',
        flex: 1,
    },
    notificationItemNotes: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        marginTop: 6,
        lineHeight: 18,
    },
    notificationButton: {
        backgroundColor: Colors.dark.primary,
        paddingVertical: 14,
        margin: 16,
        marginTop: 0,
        borderRadius: 10,
        alignItems: 'center',
    },
    notificationButtonText: {
        color: '#000000',
        fontWeight: '700',
        fontSize: 16,
    },

    // Tabs styles
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.dark.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
        paddingHorizontal: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: Colors.dark.primary,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
    },
    activeTabText: {
        color: Colors.dark.primary,
    },
    // Completed order styles
    completedOrderCard: {
        backgroundColor: Colors.dark.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        opacity: 0.8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    // Settings Modal Styles
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 12,
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    settingDescription: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginTop: 4,
    },
    settingDivider: {
        height: 1,
        backgroundColor: Colors.dark.border,
        width: '100%',
        marginVertical: 4,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    completedText: {
        color: '#10B981',
        fontWeight: '600',
        fontSize: 14,
    },
    quantityBadgeCompleted: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
    },
    quantityTextCompleted: {
        color: '#10B981',
        fontWeight: '700',
        fontSize: 14,
    },
    itemNameCompleted: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        fontWeight: '500',
        flex: 1,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginTop: 8,
    },
});
