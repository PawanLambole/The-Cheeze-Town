import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogOut, Clock, CheckCircle, Settings } from 'lucide-react-native';
import { useAudioPlayer } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import { Colors } from '@/constants/Theme';

interface OrderItem {
    name: string;
    quantity: number;
}

interface Order {
    id: string;
    orderId: string;
    tableNo: number;
    items: OrderItem[];
    isServed: boolean;
    time: string;
    duration: string; // e.g., "10m"
}

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export default function ChefDashboard() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([
        {
            id: '1',
            orderId: 'ORD006',
            tableNo: 7,
            items: [
                { name: 'Farmhouse Pizza', quantity: 1 },
                { name: 'Coke', quantity: 1 }
            ],
            isServed: false,
            time: '12:30 PM',
            duration: '15m'
        },
        {
            id: '2',
            orderId: 'ORD008',
            tableNo: 10,
            items: [
                { name: 'Tandoori Paneer Pizza', quantity: 1 },
                { name: 'French Fries', quantity: 1 }
            ],
            isServed: false,
            time: '12:45 PM',
            duration: '8m'
        },
        {
            id: '3',
            orderId: 'ORD001',
            tableNo: 5,
            items: [
                { name: 'Margherita Pizza', quantity: 2 },
                { name: 'Garlic Bread', quantity: 1 },
                { name: 'Coke', quantity: 2 }
            ],
            isServed: false,
            time: '12:50 PM',
            duration: '5m'
        }
    ]);

    // Use local bell sound file
    const bellPlayer = useAudioPlayer(require('../../assets/sounds/belli.m4a'));

    // Request notification permissions on mount
    useEffect(() => {
        registerForPushNotificationsAsync();
    }, []);

    // Function to request notification permissions
    async function registerForPushNotificationsAsync() {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push notification permissions');
            return;
        }
    }

    // Function to send order notification with full details
    async function sendOrderNotification(order: Order) {
        // Create items list text
        const itemsText = order.items.map(item => `${item.quantity}x ${item.name}`).join(', ');

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🔔 New Order Received!',
                body: `Table ${order.tableNo} - ${itemsText}`,
                data: { orderId: order.orderId, tableNo: order.tableNo },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                vibrate: [0, 250, 250, 250],
            },
            trigger: null, // Send immediately
        });
    }

    // Function to play notification bell sound
    const playOrderNotification = () => {
        try {
            // Reset to beginning and play
            bellPlayer.seekTo(0);
            bellPlayer.play();
        } catch (error) {
            console.log('Error playing bell sound:', error);
        }
    };

    // Simulate incoming orders
    useEffect(() => {
        const interval = setInterval(() => {
            const newOrder: Order = {
                id: String(Date.now()),
                orderId: `ORD${Math.floor(Math.random() * 2000)}`,
                tableNo: Math.floor(Math.random() * 15) + 1,
                items: [
                    { name: 'New Pizza Item', quantity: 1 },
                    { name: 'Extra Cheese', quantity: 1 }
                ],
                isServed: false,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                duration: 'Just now'
            };

            setOrders(prev => [newOrder, ...prev]);
            setNewOrderInfo({ tableNo: newOrder.tableNo, orderId: newOrder.orderId });
            setShowNewOrderModal(true);
            sendOrderNotification(newOrder); // Send push notification
            playOrderNotification(); // Play notification for new order
        }, 10000); // New order every 10 seconds

        return () => clearInterval(interval);
    }, []);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);
    const [newOrderInfo, setNewOrderInfo] = useState<{ tableNo: number; orderId: string } | null>(null);

    const handleMarkServed = (orderId: string) => {
        setSelectedOrderId(orderId);
        setShowConfirmModal(true);
    };

    const confirmMarkServed = () => {
        if (selectedOrderId) {
            setOrders(prev => prev.filter(o => o.id !== selectedOrderId));
            setShowConfirmModal(false);
            setSelectedOrderId(null);
        }
    };

    const handleLogout = () => {
        router.push('/');
        setTimeout(() => router.navigate('/'), 0);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.dark.background} />
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Kitchen Display</Text>
                    <Text style={styles.headerSubtitle}>{orders.length} Active Orders</Text>
                </View>
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => router.push('/chef/settings')}
                    >
                        <Settings size={20} color={Colors.dark.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <LogOut size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {orders.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <CheckCircle size={64} color={Colors.dark.secondary} />
                        <Text style={styles.emptyText}>All orders completed!</Text>
                    </View>
                ) : (
                    orders.map(order => (
                        <View key={order.id} style={styles.orderCard}>
                            <View style={styles.orderHeader}>
                                <View style={styles.orderInfo}>
                                    <Text style={styles.tableNumber}>Table {order.tableNo}</Text>
                                    <Text style={styles.orderId}>#{order.orderId}</Text>
                                </View>
                                <View style={styles.timerBadge}>
                                    <Clock size={14} color="#F59E0B" />
                                    <Text style={styles.timerText}>{order.duration}</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.itemsList}>
                                {order.items.map((item, index) => (
                                    <View key={index} style={styles.itemRow}>
                                        <View style={styles.quantityBadge}>
                                            <Text style={styles.quantityText}>{item.quantity}x</Text>
                                        </View>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.completeButton}
                                onPress={() => handleMarkServed(order.id)}
                            >
                                <Text style={styles.completeButtonText}>Mark Ready</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
                <View style={{ height: 20 }} />
            </ScrollView>

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

            {/* New Order Notification Modal */}
            <Modal visible={showNewOrderModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.notificationContent}>
                        <View style={styles.notificationHeader}>
                            <Text style={styles.notificationTitle}>🔔 New Order!</Text>
                        </View>
                        <View style={styles.notificationBody}>
                            <Text style={styles.notificationText}>
                                Table <Text style={styles.notificationHighlight}>{newOrderInfo?.tableNo}</Text>
                            </Text>
                            <Text style={styles.notificationOrderId}>#{newOrderInfo?.orderId}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.notificationButton}
                            onPress={() => setShowNewOrderModal(false)}
                        >
                            <Text style={styles.notificationButtonText}>Got it!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
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
        alignItems: 'center',
        marginBottom: 24,
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: Colors.dark.secondary,
        borderRadius: 12,
        width: '100%',
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
});
