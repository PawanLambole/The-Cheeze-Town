import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator, RefreshControl, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LogOut, Clock, CheckCircle, Settings, Bell, X } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { useSupabaseRealtimeQuery } from '@/hooks/useSupabase';
import { database, supabase } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationSettings } from '@/contexts/NotificationSettingsContext';
import { notificationService } from '@/services/NotificationService';
import { soundService } from '@/services/SoundService';


interface OrderItem {
    id?: number;
    menu_item_name: string;
    quantity: number;
    special_instructions?: string | null;
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

    // Initialize data and real-time subscriptions
    // Initialize data and real-time subscriptions
    useEffect(() => {
        // Load sound service
        soundService.loadSound();

        // Initial fetch
        fetchOrders();

        // Listen for ALL order changes (New orders, updates, etc)
        const subOrders = database.subscribe('orders', async (payload: any) => {
            console.log('⚡ Realtime order update payload:', JSON.stringify(payload, null, 2));
            console.log('⚡ Event Type:', payload.eventType);

            // Check for NEW orders
            if (payload.eventType === 'INSERT') {
                console.log('🔔 INSERT EVENT DETECTED!');
                console.log('🔔 New Order Data:', payload.new);

                const orderNumber = payload.new.order_number || 'New Order';
                const tableId = payload.new.table_id ? `Table ${payload.new.table_id}` : 'Takeaway';

                try {
                    // Fetch complete order details with items
                    const { data: orderItems } = await supabase
                        .from('order_items')
                        .select(`
                            id,
                            quantity,
                            special_instructions,
                            menu_items (name)
                        `)
                        .eq('order_id', payload.new.id);

                    const completeOrder = {
                        ...payload.new,
                        order_items: orderItems?.map(item => ({
                            id: item.id,
                            quantity: item.quantity,
                            menu_item_name: item.menu_items?.name || 'Unknown Item',
                            special_instructions: item.special_instructions
                        })) || []
                    };

                    // Create notification message with items
                    const itemsList = completeOrder.order_items
                        .map((item: OrderItem) => `${item.quantity}x ${item.menu_item_name}`)
                        .join(', ');
                    const notificationBody = itemsList || 'No items';

                    // 1. Play Sound (if enabled)
                    if (soundEnabled) {
                        console.log('🎵 Attempting to play sound...');
                        await soundService.playNotificationSound();
                        console.log('🎵 Sound played successfully');
                    } else {
                        console.log('🔇 Sound disabled, skipping...');
                    }

                    // 2. Show System Notification (if enabled)
                    if (systemEnabled) {
                        console.log('🔔 Attempting to show system notification...');
                        await notificationService.scheduleNotification(
                            `New Order #${orderNumber} - ${tableId}`,
                            notificationBody,
                            { orderId: payload.new.id }
                        );
                        console.log('🔔 System notification scheduled');
                    } else {
                        console.log('🔕 System notifications disabled, skipping...');
                    }

                    // 3. Show In-App Notification Modal (if enabled)
                    if (popupEnabled) {
                        console.log('📱 Showing in-app modal');
                        setNotificationOrder(completeOrder);
                        setShowNotification(true);
                    } else {
                        console.log('📵 In-app popup disabled, skipping...');
                    }
                } catch (err) {
                    console.error('❌ Error handling notification:', err);
                }
            } else {
                console.log('ℹ️ Event was not INSERT, ignored for notification.');
            }

            // Refresh orders list
            fetchOrders();
        });

        // Listen for order items changes (to handle race condition where items are added after order)
        const subOrderItems = database.subscribe('order_items', (payload) => {
            console.log('⚡ Realtime order_items update:', payload.eventType);
            fetchOrders();
        });

        return () => {
            database.unsubscribe(subOrders);
            database.unsubscribe(subOrderItems);
            // Unload sound when component unmounts
            soundService.unload();
        };
    }, [soundEnabled, popupEnabled, systemEnabled]);

    // Helper function to get today's start and end timestamps
    const getTodayRange = () => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        return {
            start: startOfDay.toISOString(),
            end: endOfDay.toISOString()
        };
    };

    const fetchOrders = async () => {
        if (!loading && !refreshing) setRefreshing(true);
        try {
            const { start, end } = getTodayRange();

            // Fetch active orders (pending or preparing) from today
            const { data: activeData, error: activeError } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        id,
                        menu_item_name,
                        quantity,
                        special_instructions
                    )
                `)
                .in('status', ['pending', 'preparing'])
                .gte('created_at', start)
                .lte('created_at', end)
                .order('created_at', { ascending: false });

            // Fetch completed orders (ready or completed) from today
            const { data: completedData, error: completedError } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        id,
                        menu_item_name,
                        quantity,
                        special_instructions
                    )
                `)
                .in('status', ['ready', 'completed'])
                .gte('created_at', start)
                .lte('created_at', end)
                .order('prepared_time', { ascending: false });

            if (activeError) {
                console.error('Error fetching active orders:', activeError);
            } else {
                setOrders(activeData || []);
            }

            if (completedError) {
                console.error('Error fetching completed orders:', completedError);
            } else {
                setCompletedOrders(completedData || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);


    const handleMarkServed = (orderId: number) => {
        setSelectedOrderId(orderId);
        setShowConfirmModal(true);
    };

    const confirmMarkServed = async () => {
        if (selectedOrderId) {
            try {
                // Update order status to 'ready' in database
                await database.update('orders', selectedOrderId, {
                    status: 'ready',
                    prepared_time: new Date().toISOString()
                });
                // Orders will be refreshed via real-time subscription
                setShowConfirmModal(false);
                setSelectedOrderId(null);
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
            { test: true }
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
        if (diffMins < 1) return 'Just now';
        return `${diffMins}m`;
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <View>
                    <Text style={styles.headerTitle}>Kitchen Display</Text>
                    <Text style={styles.headerSubtitle}>Today's Orders</Text>
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
                        Active ({orders.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
                    onPress={() => setActiveTab('completed')}
                >
                    <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
                        Completed ({completedOrders.length})
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
                                <View style={styles.orderHeader}>
                                    <View style={styles.orderInfo}>
                                        <Text style={styles.tableNumber}>Table {order.table_id ?? 'N/A'}</Text>
                                        <Text style={styles.orderId}>#{order.order_number ?? 'N/A'}</Text>
                                    </View>
                                    <View style={styles.timerBadge}>
                                        <Clock size={14} color="#F59E0B" />
                                        <Text style={styles.timerText}>{getOrderDuration(order.created_at ?? new Date().toISOString())}</Text>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.itemsList}>
                                    {order.order_items?.map((item, index) => (
                                        <View key={index} style={styles.itemRow}>
                                            <View style={styles.quantityBadge}>
                                                <Text style={styles.quantityText}>{item.quantity}x</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.itemName}>{item.menu_item_name}</Text>
                                                {item.special_instructions && (
                                                    <Text style={styles.itemNotes}>Note: {item.special_instructions}</Text>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                {order.notes && (
                                    <View style={styles.orderNotes}>
                                        <Text style={styles.orderNotesText}>📝 {order.notes}</Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.completeButton}
                                    onPress={() => handleMarkServed(order.id)}
                                >
                                    <Text style={styles.completeButtonText}>Mark Ready</Text>
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
                                    <View style={styles.orderInfo}>
                                        <Text style={styles.tableNumber}>Table {order.table_id ?? 'N/A'}</Text>
                                        <Text style={styles.orderId}>#{order.order_number ?? 'N/A'}</Text>
                                    </View>
                                    <View style={styles.completedBadge}>
                                        <CheckCircle size={14} color="#10B981" />
                                        <Text style={styles.completedText}>Ready</Text>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.itemsList}>
                                    {order.order_items?.map((item, index) => (
                                        <View key={index} style={styles.itemRow}>
                                            <View style={styles.quantityBadgeCompleted}>
                                                <Text style={styles.quantityTextCompleted}>{item.quantity}x</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.itemNameCompleted}>{item.menu_item_name}</Text>
                                                {item.special_instructions && (
                                                    <Text style={styles.itemNotes}>Note: {item.special_instructions}</Text>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))
                    )
                )}
                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Custom Confirmation Modal */}
            {/* Active Orders Tab content... */}

            {/* Custom Confirmation Modal */}
            <Modal visible={showConfirmModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Mark as Ready</Text>
                        <Text style={styles.modalMessage}>Are you sure this order is ready for service?</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowConfirmModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={confirmMarkServed}
                            >
                                <Text style={styles.confirmButtonText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* NEW ORDER NOTIFICATION MODAL */}
            <Modal visible={showNotification} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.notificationContent}>
                        <TouchableOpacity
                            style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
                            onPress={() => setShowNotification(false)}
                        >
                            <X size={24} color={Colors.dark.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.notificationHeader}>
                            <Bell size={48} color={Colors.dark.primary} />
                            <View style={{ height: 16 }} />
                            <Text style={styles.notificationTitle}>New Order!</Text>
                        </View>

                        <View style={styles.notificationBody}>
                            <View style={styles.notificationInfoRow}>
                                <Text style={styles.notificationLabel}>Order Number:</Text>
                                <Text style={styles.notificationValue}>#{notificationOrder?.order_number || 'N/A'}</Text>
                            </View>
                            <View style={styles.notificationInfoRow}>
                                <Text style={styles.notificationLabel}>Table:</Text>
                                <Text style={styles.notificationValue}>
                                    {notificationOrder?.table_id ? `Table ${notificationOrder.table_id}` : 'Takeaway'}
                                </Text>
                            </View>
                            {notificationOrder?.total_amount && (
                                <View style={styles.notificationInfoRow}>
                                    <Text style={styles.notificationLabel}>Total:</Text>
                                    <Text style={styles.notificationValue}>₹{notificationOrder.total_amount}</Text>
                                </View>
                            )}

                            {notificationOrder?.order_items && notificationOrder.order_items.length > 0 && (
                                <View style={styles.notificationItemsSection}>
                                    <Text style={styles.notificationItemsTitle}>Items:</Text>
                                    <ScrollView style={styles.notificationItemsList} nestedScrollEnabled>
                                        {notificationOrder.order_items.map((item: any, index: number) => (
                                            <View key={index} style={styles.notificationItem}>
                                                <View style={styles.notificationItemRow}>
                                                    <Text style={styles.notificationItemQty}>{item.quantity}x</Text>
                                                    <Text style={styles.notificationItemName}>{item.menu_item_name}</Text>
                                                </View>
                                                {item.special_instructions && (
                                                    <Text style={styles.notificationItemNotes}>
                                                        Note: {item.special_instructions}
                                                    </Text>
                                                )}
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.notificationButton}
                            onPress={() => {
                                setShowNotification(false);
                                // Optional: Scroll to top or highlight new order
                                fetchOrders();
                            }}
                        >
                            <Text style={styles.notificationButtonText}>Got It!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>



        </View>
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
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderInfo: {
        gap: 4,
    },
    tableNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.primary,
    },
    orderId: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
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
        gap: 12,
        marginBottom: 20,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    quantityBadge: {
        backgroundColor: Colors.dark.secondary,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    quantityText: {
        color: Colors.dark.text,
        fontWeight: '700',
        fontSize: 14,
    },
    itemName: {
        fontSize: 16,
        color: Colors.dark.text,
        flex: 1,
    },
    itemNotes: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        fontStyle: 'italic',
        marginTop: 4,
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
        backgroundColor: '#10B981',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    completeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
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
        borderRadius: 20,
        padding: 24,
        width: '90%',
        maxWidth: 380,
        borderWidth: 2,
        borderColor: Colors.dark.primary,
        alignItems: 'center',
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    notificationHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    notificationTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.dark.primary,
    },
    notificationBody: {
        width: '100%',
        marginBottom: 24,
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: Colors.dark.secondary,
        borderRadius: 12,
    },
    notificationInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 12,
    },
    notificationLabel: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        fontWeight: '500',
    },
    notificationValue: {
        fontSize: 16,
        color: Colors.dark.text,
        fontWeight: '600',
    },
    notificationItemsSection: {
        width: '100%',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    notificationItemsTitle: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        fontWeight: '600',
        marginBottom: 8,
    },
    notificationItemsList: {
        maxHeight: 150,
    },
    notificationItem: {
        marginBottom: 8,
    },
    notificationItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    notificationItemQty: {
        fontSize: 15,
        color: Colors.dark.primary,
        fontWeight: '700',
        minWidth: 30,
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
        fontStyle: 'italic',
        marginTop: 4,
        marginLeft: 38,
    },
    notificationText: {
        fontSize: 18,
        color: Colors.dark.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    notificationHighlight: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.dark.primary,
    },
    notificationOrderId: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        fontWeight: '600',
    },
    notificationButton: {
        backgroundColor: Colors.dark.primary,
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 12,
        width: '100%',
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
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        opacity: 0.8,
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
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    quantityTextCompleted: {
        color: '#10B981',
        fontWeight: '700',
        fontSize: 14,
    },
    itemNameCompleted: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        flex: 1,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginTop: 8,
    },
});
