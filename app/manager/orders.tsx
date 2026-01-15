import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Search, X, Clock, CheckCircle, User, ShoppingBag, Table, CreditCard, Plus, Filter, Printer, Trash2, Bell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import PaymentModal from '@/components/PaymentModal';
import { printAddedItemsReceipt, printPaymentReceipt } from '../../services/thermalPrinter';
import ReceiptViewer from '../../components/ReceiptViewer';
import { Colors } from '@/constants/Theme';
import { database, supabase } from '@/services/database';
import { useFocusEffect } from 'expo-router';
import { deductInventoryForOrder } from '@/services/inventoryService';
import { useNotificationSettings } from '@/contexts/NotificationSettingsContext';
import { useOrderNotification } from '@/contexts/OrderNotificationContext';
import { soundService } from '@/services/SoundService';
import { notificationService } from '@/services/NotificationService';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
}

interface Order {
    id: string;
    orderId: string;
    tableNo: number;
    customerName?: string;
    items: OrderItem[];
    status: string;
    isServed: boolean;
    isPaid: boolean;
    isCompleted: boolean;
    totalAmount: number;
    time: string;
    duration: string;
    transactionId?: string;
    paymentMethod?: string;
    createdAt: string;
}

// Add interface
interface OrdersScreenProps {
    createOrderPath?: string;
    canDelete?: boolean;
}

interface OrderFilterState {
    dateRange: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';
    startDate: Date | null;
    endDate: Date | null;
    status: 'all' | 'pending' | 'served' | 'completed';
    paymentStatus: 'all' | 'paid' | 'unpaid';
    paymentMethod: 'all' | 'cash' | 'online';
    orderType: 'all' | 'dine-in' | 'takeaway';
}

export default function OrdersScreen({ createOrderPath = '/manager/create-order', canDelete = false }: OrdersScreenProps) {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { t } = useTranslation();
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'served' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [orderForAddItem, setOrderForAddItem] = useState<Order | null>(null);
    const [selectedItems, setSelectedItems] = useState<Array<{ name: string, price: number, quantity: number }>>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState('');
    const [currentReceiptData, setCurrentReceiptData] = useState<any>(null);

    // Notification State
    const [showNotification, setShowNotification] = useState(false);
    const [notificationOrder, setNotificationOrder] = useState<any>(null);
    const [notificationType, setNotificationType] = useState<'new' | 'update'>('new');
    const [newItems, setNewItems] = useState<any[]>([]);

    // Notification Settings
    const { userData } = useAuth();

    // Notification Settings - Dynamic based on Role
    const settings = useNotificationSettings();
    const isOwner = userData?.role === 'owner';

    const soundEnabled = isOwner ? settings.ownerSoundEnabled : settings.managerSoundEnabled;
    const popupEnabled = isOwner ? settings.ownerPopupEnabled : settings.managerPopupEnabled;
    const systemEnabled = isOwner ? settings.ownerSystemEnabled : settings.managerSystemEnabled;
    const { pending: pendingOrderNotification, consume: consumePendingOrderNotification } = useOrderNotification();


    // Refs for debouncing updates
    const updateQueue = useRef<{ [key: string]: any[] }>({});
    const updateTimers = useRef<{ [key: string]: any }>({});

    const [showFilterModal, setShowFilterModal] = useState(false);

    // Initialize filters based on URL params
    const initialDateRange = (params.dateRange as OrderFilterState['dateRange']) || 'all';
    const initialStatus = (params.status as OrderFilterState['status']) || 'all';
    const initialPaymentMethod = (params.paymentMethod as OrderFilterState['paymentMethod']) || 'all';
    const initialStartDate = params.startDate ? new Date(params.startDate as string) : null;
    const initialEndDate = params.endDate ? new Date(params.endDate as string) : null;

    const [activeFilters, setActiveFilters] = useState<OrderFilterState>({
        dateRange: initialDateRange,
        startDate: initialStartDate,
        endDate: initialEndDate,
        status: initialStatus,
        paymentStatus: 'all',
        paymentMethod: initialPaymentMethod,
        orderType: 'all'
    });
    const [tempFilters, setTempFilters] = useState<OrderFilterState>(activeFilters);

    const statusOptions: ('all' | 'pending' | 'served' | 'completed')[] = ['all', 'pending', 'served', 'completed'];

    const [orders, setOrders] = useState<Order[]>([]);
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);


    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const past = new Date(dateString);

        // Check if today
        if (now.toDateString() === past.toDateString()) {
            // Keep distinct hours/mins for today
            const diffMs = now.getTime() - past.getTime();
            const diffMins = Math.round(diffMs / 60000);
            if (diffMins < 60) return `${diffMins} ${t('common.minsAgo', { defaultValue: 'mins ago' })}`;
            const diffHours = Math.round(diffMins / 60);
            return `${diffHours} ${t('common.hoursAgo', { defaultValue: 'hours ago' })}`;
        }

        // Check if yesterday
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (past.toDateString() === yesterday.toDateString()) {
            return t('common.yesterday', { defaultValue: 'Yesterday' });
        }

        // Return Date "14 Jan 2024"
        // Using toLocaleDateString might vary by locale, customizing for consistency:
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const day = past.getDate();
        const month = months[past.getMonth()];
        const year = past.getFullYear();
        return `${day} ${month} ${year}`;
    };

    const fetchOrders = async () => {
        if (!refreshing) setRefreshing(true);
        try {
            // OPTIMIZED: Fetch with Joins and Limit
            // 1. Fetch Orders with Items and Payments in ONE query
            const { data: dbOrders, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        menu_item_name,
                        quantity,
                        unit_price
                    ),
                    payments (
                        status,
                        transaction_id,
                        payment_method
                    )
                `)
                .neq('status', 'cancelled')
                .order('created_at', { ascending: false })
                .limit(50); // PERFORMANCE: Limit to 50 most recent orders

            if (error) throw error;

            const ordersWithItems = (dbOrders || []).map((o: any) => {
                // Map Items (Joined)
                const items = (o.order_items || []).map((i: any) => ({
                    name: i.menu_item_name,
                    quantity: i.quantity,
                    price: i.unit_price
                }));

                // Map Payment (Joined)
                // Payments is an array due to one-to-many potential, take first valid/completed if any
                const validPayment = (o.payments || []).find((p: any) => p.status === 'completed' || p.status === 'confirmed');
                const paymentRecord = validPayment || (o.payments && o.payments[0]);

                const status = o.status;

                // Status Logic:
                const isPaid = status === 'paid' || status === 'completed' || (paymentRecord && (paymentRecord.status === 'completed' || paymentRecord.status === 'confirmed'));
                const isServed = status === 'served' || status === 'ready' || status === 'completed' || o.is_served === true;
                const isCompleted = status === 'completed';

                return {
                    id: String(o.id),
                    orderId: o.order_number,
                    tableNo: o.table_id,
                    createdAt: o.created_at,
                    customerName: o.customer_name,
                    items: items,
                    isServed: isServed,
                    isPaid: isPaid,
                    isCompleted: isCompleted,
                    totalAmount: o.total_amount,
                    time: getTimeAgo(o.created_at),
                    duration: getTimeAgo(o.created_at).replace(' ago', ''),
                    transactionId: o.transaction_id || paymentRecord?.transaction_id,
                    paymentMethod: o.payment_method || paymentRecord?.payment_method,
                    status: o.status,
                };
            });

            setOrders(ordersWithItems);
        } catch (error) {
            console.error('Error fetching orders:', error);
            // Fallback for "Relation not found" if payments FK is missing, we could revert to simpler query here if needed.
            Alert.alert(t('common.error'), t('manager.orders.fetchError', { defaultValue: 'Error fetching orders' }));
        } finally {
            setRefreshing(false);
        }
    };

    const fetchMenu = async () => {
        try {
            const { data } = await supabase.from('menu_items').select('name, price');
            if (data) setMenuItems(data);
        } catch (e) {
            console.error("Error fetching menu for orders", e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
            fetchMenu();
        }, [])
    );

    // Keep Expo push token synced for background notifications.
    useEffect(() => {
        if (!systemEnabled) return;
        if (!userData?.id) return;

        let cancelled = false;

        notificationService.registerForPushNotificationsAsync().then(async (token: string | null) => {
            if (cancelled) return;
            if (!token) return;

            const { error } = await supabase
                .from('users')
                .update({ expo_push_token: token } as any)
                .eq('id', userData.id);

            if (error) console.error('Failed to update push token:', error);
        });

        return () => {
            cancelled = true;
        };
    }, [systemEnabled, userData?.id]);

    // Initialize data and real-time subscriptions
    useEffect(() => {
        // Load sound service
        soundService.loadSound();

        // Initial fetch
        fetchOrders();

        // Listen for NEW ORDERS
        const subOrders = database.subscribe('orders', async (payload: any) => {
            // If payload.eventType is INSERT, it's a new order
            if (payload.eventType === 'INSERT') {
                // Allow a moment for items to be inserted before fetching
                setTimeout(async () => {
                    handleNewOrderNotification(payload.new);
                }, 1000);
            }
            fetchOrders();
        });

        // Listen for ORDER ITEMS (Updates & New Items)
        const subOrderItems = database.subscribe('order_items', async (payload: any) => {
            if (payload.eventType === 'INSERT') {
                const newItem = payload.new;
                const orderId = newItem.order_id;

                // Fetch the parent order
                const { data: orderData } = await supabase
                    .from('orders')
                    .select('created_at, order_number, table_id, total_amount, status')
                    .eq('id', orderId)
                    .single();

                if (orderData && orderData.created_at) {
                    const createdAt = new Date(orderData.created_at).getTime();
                    const now = new Date().getTime();
                    const ageInSeconds = (now - createdAt) / 1000;

                    // If order is older than 1 second, treat items as an UPDATE
                    if (ageInSeconds > 1) {
                        // Batching logic similar to Chef
                        if (!updateQueue.current[orderId]) {
                            updateQueue.current[orderId] = [];
                        }
                        updateQueue.current[orderId].push(newItem);

                        if (updateTimers.current[orderId]) {
                            clearTimeout(updateTimers.current[orderId]);
                        }

                        updateTimers.current[orderId] = setTimeout(() => {
                            const items = updateQueue.current[orderId];
                            delete updateQueue.current[orderId];
                            delete updateTimers.current[orderId];

                            if (items && items.length > 0) {
                                handleOrderUpdateNotification(orderData, items);
                            }
                        }, 2000);
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

    // Handle tapped notification
    useEffect(() => {
        if (!pendingOrderNotification?.orderId) return;
        let cancelled = false;
        (async () => {
            try {
                const { data: orderData } = await supabase
                    .from('orders')
                    .select('*, order_items(*)')
                    .eq('id', Number(pendingOrderNotification.orderId))
                    .single();

                if (cancelled) return;

                if (orderData) {
                    if (popupEnabled) {
                        setNotificationOrder(orderData);
                        setNewItems(orderData.order_items || []);
                        setNotificationType(pendingOrderNotification.type === 'update' ? 'update' : 'new');
                        setShowNotification(true);
                    }
                    if (soundEnabled) {
                        // Simple sound for now, no speech unless desired
                        await soundService.playNotificationSound();
                    }
                }
            } catch (e) {
                console.error('Error handling tapped notification:', e);
            } finally {
                consumePendingOrderNotification();
            }
        })();
        return () => { cancelled = true; };
    }, [pendingOrderNotification?.orderId, popupEnabled, soundEnabled]);


    const handleNewOrderNotification = async (orderData: any) => {
        try {
            const { data: items } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', orderData.id);

            const completeOrder = { ...orderData, order_items: items || [] };

            if (soundEnabled) await soundService.playNotificationSound();

            if (systemEnabled) {
                const itemsList = (items || []).map((i: any) => `${i.quantity}x ${i.menu_item_name}`).join(', ');
                await notificationService.scheduleNotification(
                    `New Order #${orderData.order_number || ''}`,
                    itemsList || 'No items',
                    { orderId: orderData.id, type: 'new' },
                    { playSound: false }
                );
            }

            if (popupEnabled) {
                setNotificationType('new');
                setNewItems(completeOrder.order_items || []);
                setNotificationOrder(completeOrder);
                setShowNotification(true);
            }
        } catch (e) {
            console.error('Error in new order notification:', e);
        }
    };

    const handleOrderUpdateNotification = async (orderData: any, newItemsList: any[]) => {
        try {
            if (soundEnabled) await soundService.playNotificationSound();

            if (systemEnabled) {
                const itemsList = newItemsList.map((i: any) => `${i.quantity}x ${i.menu_item_name}`).join(', ');
                await notificationService.scheduleNotification(
                    `Order Updated #${orderData.order_number}`,
                    `Added: ${itemsList}`,
                    { orderId: orderData.id, type: 'update' },
                    { playSound: false }
                );
            }

            if (popupEnabled) {
                setNotificationType('update');
                setNewItems(newItemsList);
                setNotificationOrder(orderData);
                setShowNotification(true);
            }
        } catch (e) {
            console.error('Error in order update notification:', e);
        }
    };

    const deleteOrder = async (orderId: string) => {
        Alert.alert(
            t('common.delete', { defaultValue: 'Delete Order' }),
            t('manager.orders.deleteConfirm', { defaultValue: 'Are you sure you want to delete this order? This action cannot be undone.' }),
            [
                { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
                {
                    text: t('common.delete', { defaultValue: 'Delete' }),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('orders')
                                .delete()
                                .eq('id', Number(orderId));

                            if (error) throw error;

                            setOrders(prev => prev.filter(o => o.id !== orderId));
                            if (selectedOrder?.id === orderId) {
                                setShowOrderModal(false);
                                setSelectedOrder(null);
                            }
                        } catch (e) {
                            console.error("Error deleting order:", e);
                            Alert.alert(t('common.error'), t('manager.orders.deleteError', { defaultValue: 'Failed to delete order' }));
                        }
                    }
                }
            ]
        );
    };

    // Advanced Filtering Logic
    const getFilteredOrders = () => {
        return orders.filter(order => {
            // Search Filter
            const matchesSearch =
                order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.tableNo.toString().includes(searchQuery) ||
                order.items?.some((item: any) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

            if (!matchesSearch) return false;

            // Status Filter - Check both activeFilters and quick chips (selectedStatus)
            // If activeFilters.status is 'all', use selectedStatus. Else use activeFilters.status logic.
            // Actually, let's say Modal filters OVERRIDE quick chips if set to something specific.
            // Or better: selectedStatus syncs with activeFilters.status?
            // Let's make them separate but compatible.
            // If activeFilters.status is 'all', we respect selectedStatus (Quick Filter).
            // If activeFilters.status is SPECIFIC, it overrides selectedStatus.

            let statusMatch = true;
            if (activeFilters.status !== 'all') {
                if (activeFilters.status === 'pending') statusMatch = !order.isServed && !order.isCompleted;
                else if (activeFilters.status === 'served') statusMatch = order.isServed && !order.isCompleted;
                else if (activeFilters.status === 'completed') statusMatch = order.isCompleted;
            } else {
                // Quick Chips Fallback
                if (selectedStatus === 'pending') statusMatch = !order.isServed && !order.isCompleted;
                else if (selectedStatus === 'served') statusMatch = order.isServed && !order.isCompleted;
                else if (selectedStatus === 'completed') statusMatch = order.isCompleted;
            }
            if (!statusMatch) return false;


            // Payment Status Filter
            if (activeFilters.paymentStatus !== 'all') {
                const isPaid = order.isPaid;
                if (activeFilters.paymentStatus === 'paid' && !isPaid) return false;
                if (activeFilters.paymentStatus === 'unpaid' && isPaid) return false;
            }

            // Payment Method Filter
            if (activeFilters.paymentMethod !== 'all') {
                const method = order.paymentMethod?.toLowerCase() || '';
                const isCash = method === 'cash' || (!method && order.isCompleted && !order.isPaid); // Fallback assumption for completed orders without payment record
                // Actually fallback in fetchOrders logic: if status='completed' and no payment record, we assumed cash there?
                // In fetchOrders: paymentMethod comes from record.
                // Revisit logic: 
                // "Cash" = paymentMethod === 'cash'
                // "Online" = paymentMethod !== 'cash' (and exists) OR status='paid' (web)

                const dbMethod = order.paymentMethod;
                const isOnline = dbMethod && dbMethod !== 'cash';
                const isActuallyCash = dbMethod === 'cash';

                // We also have implicit types.
                // If paymentMethod is null:
                // If status is 'paid', likely Online (Web).
                // If status is 'completed' and not 'paid' flag (maybe manual complete?), likely Cash.

                if (activeFilters.paymentMethod === 'cash') {
                    if (isOnline) return false;
                    // If no method, check if it's explicitly 'paid' (online).
                    if (!dbMethod && order.status === 'paid') return false;
                    // If no method and not paid, maybe it is cash? or pending.
                    // If we only want CONFIRMED cash:
                    if (!isActuallyCash && !(order.isCompleted && order.status !== 'paid')) return false;

                    // Simplified:
                    // Show if method is cash OR (no method AND completed AND not paid-status)
                    if (dbMethod !== 'cash' && !(order.isCompleted && order.status !== 'paid')) return false;
                }

                if (activeFilters.paymentMethod === 'online') {
                    // Show if method is NOT cash (and exists) OR status is paid
                    const isWebPaid = !dbMethod && order.status === 'paid';
                    if (!isOnline && !isWebPaid) return false;
                }
            }

            // Order Type Filter
            // We discern type by tableNo? Or do we have an order type column?
            // Interface says `tableNo: number`. Usually 0 or null implies Takeaway?
            // "Takeaway" logic in code: `tableNo: selectedTable ? ... : 'Takeaway'` (but tableNo is number?)
            // In fetchOrders: tableNo: o.table_id
            // If table_id is null, it might be takeaway.
            // Let's assume tableNo presence means Dine-in.
            // Check if tableNo is valid.
            if (activeFilters.orderType !== 'all') {
                // This logic depends on how takeaway is stored. 
                // If tableNo is used for ID, maybe check if it maps to a real table?
                // For now, let's skip strict enforcement if unsure, or try:
                // If tableNo exists/positive -> Dine In. If null/0 -> Takeaway.
                const isDineIn = order.tableNo && order.tableNo > 0;
                if (activeFilters.orderType === 'dine-in' && !isDineIn) return false;
                if (activeFilters.orderType === 'takeaway' && isDineIn) return false;
            }

            // Date Filter
            if (activeFilters.dateRange !== 'all') {
                if (!order.createdAt) return false;
                const orderDate = new Date(order.createdAt);
                const today = new Date();

                if (activeFilters.dateRange === 'today') {
                    if (orderDate.toDateString() !== today.toDateString()) return false;
                }
                else if (activeFilters.dateRange === 'yesterday') {
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    if (orderDate.toDateString() !== yesterday.toDateString()) return false;
                }
                else if (activeFilters.dateRange === 'week') {
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    if (orderDate < weekAgo) return false;
                }
                else if (activeFilters.dateRange === 'month') {
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(today.getMonth() - 1);
                    if (orderDate < monthAgo) return false;
                }
                else if (activeFilters.dateRange === 'custom') {
                    // Reset hours for fair comparison
                    if (activeFilters.startDate) {
                        const start = new Date(activeFilters.startDate);
                        start.setHours(0, 0, 0, 0);
                        // Compare ensuring orderDate is >= start (inclusive)
                        // orderDate from DB is strict ISO. 
                        const oDate = new Date(orderDate);
                        if (oDate < start) return false;
                    }
                    if (activeFilters.endDate) {
                        const end = new Date(activeFilters.endDate);
                        end.setHours(23, 59, 59, 999);
                        const oDate = new Date(orderDate);
                        if (oDate > end) return false;
                    }
                }
            }

            return true;

            return true;
        });
    };

    const filteredOrders = getFilteredOrders();

    const todaysOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        const today = new Date();
        return orderDate.toDateString() === today.toDateString();
    });

    const pendingOrdersCount = todaysOrders.filter(o => !o.isServed && !o.isCompleted).length;
    const servedOrdersCount = todaysOrders.filter(o => o.isServed && !o.isCompleted).length;
    const completedOrdersCount = todaysOrders.filter(o => o.isCompleted).length;

    const handleOrderClick = (order: Order) => {
        setSelectedOrder(order);
        setShowOrderModal(true);
    };


    const toggleOrderStatus = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order || order.isCompleted) return;

        const newStatus = order.isServed ? 'pending' : 'ready'; // Toggle between ready/pending

        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    status: newStatus,
                    is_served: !order.isServed
                })
                .eq('id', Number(orderId));

            if (error) throw error;

            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, isServed: !order.isServed } : o
            ));
            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, isServed: !selectedOrder.isServed });
            }
        } catch (e) {
            console.error("Error updating order status:", e);
            Alert.alert(t('common.error'), t('manager.orders.updateStatusError', { defaultValue: 'Failed to update status' }));
        }
    };

    const handlePrintBill = async (order: Order) => {
        try {
            const paymentReceiptData = {
                orderId: order.orderId,
                tableNo: order.tableNo,
                customerName: order.customerName,
                items: order.items,
                subtotal: order.totalAmount,
                totalAmount: order.totalAmount,
                paymentMethod: order.paymentMethod || 'Cash',
                transactionId: order.transactionId || 'N/A',
                timestamp: new Date(order.createdAt),
                orderType: order.tableNo ? 'dine-in' : 'takeaway' as 'dine-in' | 'takeaway'
            };

            const result = await printPaymentReceipt(paymentReceiptData);

            if (result.success && result.receipt) {
                setCurrentReceipt(result.receipt);
                setCurrentReceiptData(paymentReceiptData);
                setShowReceipt(true);
            }
        } catch (error) {
            console.error('Error printing bill:', error);
            Alert.alert(t('common.error'), t('manager.orders.receiptError'));
        }
    };

    const getStatusLabel = (status: 'all' | 'pending' | 'served' | 'completed') => {
        switch (status) {
            case 'all': return t('manager.orders.filter.all');
            case 'pending': return t('manager.orders.filter.pending');
            case 'served': return t('manager.orders.filter.served');
            case 'completed': return t('manager.orders.filter.completed');
            default: return status;
        }
    };

    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('manager.orders.title')}</Text>
                <TouchableOpacity onPress={() => {
                    // Use the prop here. 
                    // Note: router.push accepts relative or absolute.
                    // If strict typing is an issue, might need "as any" or proper typing, but string usually works.
                    router.push(createOrderPath as any);
                }}>
                    <Plus size={24} color={Colors.dark.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{todaysOrders.length}</Text>
                        <Text style={styles.statLabel} numberOfLines={1}>{t('manager.orders.stats.total')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#F59E0B' }]}>{pendingOrdersCount}</Text>
                        <Text style={styles.statLabel} numberOfLines={1}>{t('manager.orders.stats.pending')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#3B82F6' }]}>{servedOrdersCount}</Text>
                        <Text style={styles.statLabel} numberOfLines={1}>{t('manager.orders.stats.served')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#10B981' }]}>{completedOrdersCount}</Text>
                        <Text style={styles.statLabel} numberOfLines={1}>{t('manager.orders.stats.completed')}</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 }}>
                    <View style={[styles.searchContainer, { marginBottom: 0, flex: 1 }]}>
                        <Search size={20} color={Colors.dark.textSecondary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('manager.orders.searchPlaceholder')}
                            placeholderTextColor={Colors.dark.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <X size={20} color={Colors.dark.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            (activeFilters.dateRange !== 'all' || activeFilters.status !== 'all' || activeFilters.paymentStatus !== 'all' || activeFilters.orderType !== 'all') && styles.filterButtonActive
                        ]}
                        onPress={() => {
                            setTempFilters(activeFilters);
                            setShowFilterModal(true);
                        }}
                    >
                        <Filter size={20} color={(activeFilters.dateRange !== 'all' || activeFilters.status !== 'all' || activeFilters.paymentStatus !== 'all' || activeFilters.orderType !== 'all') ? '#000000' : Colors.dark.text} />
                    </TouchableOpacity>
                </View>

                {/* Status Filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusContainer}>
                    {statusOptions.map(status => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.statusChip, selectedStatus === status && styles.statusChipActive]}
                            onPress={() => setSelectedStatus(status)}
                        >
                            <Text style={[styles.statusText, selectedStatus === status && styles.statusTextActive]}>
                                {getStatusLabel(status)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Orders List */}
                <ScrollView
                    style={styles.ordersList}
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
                    {filteredOrders.map(order => (
                        <TouchableOpacity
                            key={order.id}
                            style={styles.orderCard}
                            onPress={() => handleOrderClick(order)}
                        >
                            {/* Row 1: Order number (Left) + Table (Right) */}
                            <View style={styles.orderHeader}>
                                <View style={styles.orderHeaderLeft}>
                                    <View>
                                        <Text style={styles.orderId} numberOfLines={1}>#{order.orderId}</Text>
                                        <Text style={{ fontSize: 12, color: Colors.dark.textSecondary, marginTop: 2 }}>
                                            {order.customerName || 'Guest'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.tableTag}>
                                    <Table size={10} color="#000000" style={styles.tableIcon} />
                                    <Text style={styles.tableNo} numberOfLines={1}>
                                        {t('common.table', { defaultValue: 'Table' })} {order.tableNo}
                                    </Text>
                                </View>
                            </View>

                            {/* Row 2: Time (left) + Status (right) */}
                            <View style={styles.orderMetaRow}>
                                <View style={styles.timeContainer}>
                                    <Clock size={14} color={Colors.dark.textSecondary} style={styles.timeIcon} />
                                    <Text style={styles.timeText} numberOfLines={1}>{order.time}</Text>
                                </View>
                                {order.isCompleted ? (
                                    <View style={styles.statusBadgeCompleted}>
                                        <CheckCircle size={14} color="#6B7280" style={styles.badgeIcon} />
                                        <Text style={styles.statusTextCompleted} numberOfLines={1}>
                                            {t('manager.orders.stats.completed', { defaultValue: 'Completed' })}
                                        </Text>
                                    </View>
                                ) : order.isServed ? (
                                    <View style={styles.statusBadgeServed}>
                                        <CheckCircle size={14} color="#10B981" style={styles.badgeIcon} />
                                        <Text style={styles.statusTextServed} numberOfLines={1}>
                                            {t('manager.orders.stats.served', { defaultValue: 'Served' })}
                                        </Text>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.statusBadgePending}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            toggleOrderStatus(order.id);
                                        }}
                                    >
                                        <Clock size={14} color="#F59E0B" style={styles.badgeIcon} />
                                        <Text style={styles.statusTextPending} numberOfLines={1}>
                                            {t('manager.orders.stats.pending', { defaultValue: 'Pending' })}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {order.customerName ? (
                                <Text style={styles.customerName} numberOfLines={1}>
                                    {order.customerName}
                                </Text>
                            ) : null}

                            <View style={styles.itemsSection}>
                                <Text style={styles.itemsSectionLabel}>
                                    {t('manager.orders.items', { defaultValue: 'Items' }).toUpperCase()} ({order.items.length})
                                </Text>
                                {order.items.slice(0, 3).map((item, idx) => (
                                    <Text key={idx} style={styles.itemText}>
                                        <Text style={styles.itemQty}>{item.quantity}×</Text> {item.name}
                                    </Text>
                                ))}
                                {order.items.length > 3 && (
                                    <Text style={styles.moreItems}>+{order.items.length - 3} more</Text>
                                )}
                            </View>

                            {/* Row 4: Print bill (right) */}
                            {order.isCompleted ? (
                                <View style={styles.printRow}>
                                    <TouchableOpacity
                                        style={styles.printButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            handlePrintBill(order);
                                        }}
                                    >
                                        <Printer size={14} color="#000000" style={styles.printButtonIcon} />
                                        <Text style={styles.printButtonText}>Print Bill</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : null}

                            {/* Row 5: Amount (left) + Delete (right) */}
                            <View style={styles.orderFooter}>
                                <Text style={styles.totalPrice} numberOfLines={1}>₹{order.totalAmount}</Text>

                                {!order.isCompleted && (
                                    <TouchableOpacity
                                        style={styles.addItemButtonCard}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            setOrderForAddItem(order);
                                            setSelectedItems([]);
                                            setShowAddItemModal(true);
                                        }}
                                    >
                                        <Plus size={16} color="#000000" />
                                        <Text style={styles.addItemButtonCardText}>{t('manager.orders.add', { defaultValue: 'Add' })}</Text>
                                    </TouchableOpacity>
                                )}

                                {canDelete ? (
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            deleteOrder(order.id);
                                        }}
                                    >
                                        <Trash2 size={16} color="#EF4444" />
                                    </TouchableOpacity>
                                ) : (
                                    <View style={{ width: 40 }} /> /* Spacer to keep center alignment balance if needed, or empty */
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}

                    {filteredOrders.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <ShoppingBag size={48} color={Colors.dark.textSecondary} />
                            <Text style={styles.emptyText}>{t('manager.orders.empty')}</Text>
                            {searchQuery && (
                                <Text style={styles.emptySubtext}>{t('manager.orders.emptySubtext')}</Text>
                            )}
                        </View>
                    )}

                    <View style={{ height: 20 }} />
                </ScrollView>
            </View>

            {/* Order Details Modal */}
            <Modal visible={showOrderModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('manager.orders.orderDetails')}</Text>
                            <TouchableOpacity onPress={() => setShowOrderModal(false)}>
                                <X size={24} color={Colors.dark.textSecondary} />
                            </TouchableOpacity>
                        </View>


                        {selectedOrder && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Order Summary Header */}
                                <View style={styles.orderSummaryHeader}>
                                    <View style={styles.summaryRow}>
                                        <View>
                                            <Text style={styles.summaryLabel}>Order</Text>
                                            <Text style={styles.summaryValue}>#{selectedOrder.orderId}</Text>
                                        </View>
                                        <View style={styles.summaryDivider} />
                                        <View>
                                            <Text style={styles.summaryLabel}>{t('manager.orders.table')}</Text>
                                            <Text style={styles.summaryValue}>{selectedOrder.tableNo}</Text>
                                        </View>
                                        <View style={styles.summaryDivider} />
                                        <View>
                                            <Text style={styles.summaryLabel}>{t('common.status')}</Text>
                                            <Text style={[styles.summaryValue, { color: selectedOrder.isServed ? '#10B981' : '#F59E0B' }]}>
                                                {selectedOrder.isServed ? t('manager.orders.stats.served') : t('manager.orders.stats.pending')}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Customer & Time Info */}
                                <View style={styles.orderInfoCard}>
                                    <View style={styles.orderInfoRow}>
                                        <Text style={styles.orderInfoLabel}>{t('manager.orders.paymentMethod', { defaultValue: 'Payment Method' })}</Text>
                                        <Text style={[styles.orderInfoValue, { textTransform: 'capitalize', color: Colors.dark.primary }]}>
                                            {selectedOrder.paymentMethod || (selectedOrder.isPaid ? 'Online' : 'Pending')}
                                        </Text>
                                    </View>
                                    {selectedOrder.customerName && (
                                        <View style={styles.orderInfoRow}>
                                            <Text style={styles.orderInfoLabel}>{t('manager.orders.customer')}</Text>
                                            <Text style={styles.orderInfoValue}>{selectedOrder.customerName}</Text>
                                        </View>
                                    )}
                                    <View style={styles.orderInfoRow}>
                                        <Text style={styles.orderInfoLabel}>{t('manager.orders.timeElapsed')}</Text>
                                        <Text style={styles.orderInfoValue}>{selectedOrder.time}</Text>
                                    </View>
                                    <View style={[styles.orderInfoRow, { borderBottomWidth: 0 }]}>
                                        <Text style={styles.orderInfoLabel}>{t('manager.orders.duration')}</Text>
                                        <Text style={styles.orderInfoValue}>{selectedOrder.duration}</Text>
                                    </View>
                                </View>

                                {/* Order Items */}
                                <View style={styles.orderItemsSection}>
                                    <Text style={styles.sectionLabel}>{t('manager.orders.items')} ({selectedOrder.items.length})</Text>
                                    {selectedOrder.items.map((item, index) => (
                                        <View key={index} style={styles.orderItem}>
                                            <View style={styles.orderItemLeft}>
                                                {!selectedOrder.isCompleted && (
                                                    <TouchableOpacity
                                                        style={styles.orderQuantityButton}
                                                        onPress={() => {
                                                            Alert.alert(
                                                                t('common.confirm', { defaultValue: 'Confirm' }),
                                                                t('manager.orders.confirmItemDecrease', { defaultValue: 'Are you sure you want to decrease the quantity of this item?' }),
                                                                [
                                                                    { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
                                                                    {
                                                                        text: t('common.yes', { defaultValue: 'Yes' }),
                                                                        onPress: () => {
                                                                            const updatedItems = [...selectedOrder.items];
                                                                            if (item.quantity > 1) {
                                                                                updatedItems[index] = { ...item, quantity: item.quantity - 1 };
                                                                            } else {
                                                                                // Remove item if quantity would be 0
                                                                                updatedItems.splice(index, 1);
                                                                            }
                                                                            const newTotal = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

                                                                            // Update selectedOrder
                                                                            const updatedOrder = {
                                                                                ...selectedOrder,
                                                                                items: updatedItems,
                                                                                totalAmount: newTotal
                                                                            };
                                                                            setSelectedOrder(updatedOrder);

                                                                            // Update orders state
                                                                            setOrders(prev => prev.map(o =>
                                                                                o.id === selectedOrder.id ? updatedOrder : o
                                                                            ));
                                                                        }
                                                                    }
                                                                ]
                                                            );
                                                        }}
                                                    >
                                                        <Text style={styles.orderQuantityButtonText}>-</Text>
                                                    </TouchableOpacity>
                                                )}
                                                <Text style={styles.orderItemQuantityText}>{item.quantity}x</Text>
                                                <Text style={styles.orderItemName}>{item.name}</Text>
                                            </View>
                                            <Text style={styles.orderItemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                                        </View>
                                    ))}

                                    {/* Subtotal in items section */}
                                    <View style={styles.itemsFooter}>
                                        <Text style={styles.subtotalLabel}>{t('manager.orders.subtotal')}</Text>
                                        <Text style={styles.subtotalValue}>₹{selectedOrder.totalAmount.toFixed(2)}</Text>
                                    </View>
                                </View>

                                {/* Add Item Button */}
                                {/* Add Item Button */}
                                {!selectedOrder.isCompleted && (
                                    <View style={{ alignItems: 'center', marginBottom: 16 }}>
                                        <TouchableOpacity
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: Colors.dark.secondary,
                                                paddingVertical: 10,
                                                paddingHorizontal: 24,
                                                borderRadius: 100,
                                                gap: 8,
                                                borderWidth: 1,
                                                borderColor: Colors.dark.primary,
                                            }}
                                            onPress={() => {
                                                setOrderForAddItem(selectedOrder);
                                                setSelectedItems([]);
                                                setShowAddItemModal(true);
                                            }}
                                        >
                                            <Plus size={18} color={Colors.dark.primary} />
                                            <Text style={{ color: Colors.dark.primary, fontWeight: '600', fontSize: 14 }}>
                                                {t('manager.orders.addItems', { defaultValue: 'Add Items' })}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Total Amount - Highlighted */}
                                {/* Total Amount - Highlighted */}
                                <View style={styles.orderTotal}>
                                    <Text style={styles.orderTotalLabel}>{t('manager.orders.total', { defaultValue: 'Total' })}</Text>
                                    <Text style={styles.orderTotalAmount}>₹{selectedOrder.totalAmount.toFixed(2)}</Text>
                                </View>

                                {/* Payment / Complete Button - Only show if not completed */}
                                {!selectedOrder.isCompleted && (
                                    <TouchableOpacity
                                        style={[styles.paymentButton, !selectedOrder.isServed && styles.paymentButtonDisabled]}
                                        onPress={async () => {
                                            if (!selectedOrder.isServed) return;

                                            // If already paid, just mark as completed
                                            if (selectedOrder.isPaid) {
                                                try {
                                                    // 1. Update order status
                                                    const { error } = await supabase
                                                        .from('orders')
                                                        .update({ status: 'completed', completed_time: new Date().toISOString() })
                                                        .eq('id', Number(selectedOrder.id));

                                                    if (error) throw error;

                                                    // Deduct Inventory for Pre-paid/Web Orders that skip Payment Modal
                                                    try {
                                                        const itemsToDeduct = selectedOrder.items.map(i => ({
                                                            menu_item_name: i.name,
                                                            quantity: i.quantity
                                                        }));
                                                        await deductInventoryForOrder(itemsToDeduct);
                                                    } catch (invError) {
                                                        console.error("Inventory deduction failed for completed order:", invError);
                                                    }

                                                    // 2. Release table if assigned
                                                    if (selectedOrder.tableNo) {
                                                        const { error: tableError } = await supabase
                                                            .from('restaurant_tables')
                                                            .update({ status: 'available', current_order_id: null })
                                                            .eq('id', selectedOrder.tableNo);

                                                        if (selectedOrder.tableNo) {
                                                            await supabase
                                                                .from('restaurant_tables')
                                                                .update({ status: 'available', current_order_id: null })
                                                                .eq('id', selectedOrder.tableNo);
                                                        }
                                                    }

                                                    fetchOrders();
                                                    setShowOrderModal(false);
                                                    Alert.alert('Success', 'Order marked as completed.');
                                                } catch (e) {
                                                    console.error("Error completing order", e);
                                                }
                                            } else {
                                                // Open Payment Modal
                                                setShowPaymentModal(true);
                                            }
                                        }}
                                        disabled={!selectedOrder.isServed}
                                    >
                                        {selectedOrder.isPaid ? (
                                            <CheckCircle size={18} color="#FFFFFF" />
                                        ) : (
                                            <CreditCard size={18} color="#FFFFFF" />
                                        )}
                                        <Text style={styles.paymentButtonText}>
                                            {selectedOrder.isServed
                                                ? (selectedOrder.isPaid ? t('manager.orders.completeOrder', { defaultValue: 'Complete Order' }) : t('manager.orders.processPayment'))
                                                : t('manager.orders.markServed')
                                            }
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {canDelete && (
                                    <TouchableOpacity
                                        style={{
                                            marginHorizontal: 16,
                                            marginTop: 16,
                                            marginBottom: 0,
                                            backgroundColor: '#FEE2E2',
                                            padding: 16,
                                            borderRadius: 12,
                                            alignItems: 'center',
                                            flexDirection: 'row',
                                            justifyContent: 'center',
                                            gap: 8,
                                            borderWidth: 1,
                                            borderColor: '#EF4444'
                                        }}
                                        onPress={() => deleteOrder(selectedOrder.id)}
                                    >
                                        <Trash2 size={20} color="#EF4444" />
                                        <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 16 }}>
                                            {t('common.delete', { defaultValue: 'Delete Order' })}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <View style={{ height: 20 }} />
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Add Item Modal */}
            <Modal visible={showAddItemModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('manager.orders.addItemTitle')}</Text>
                            <TouchableOpacity onPress={() => setShowAddItemModal(false)}>
                                <X size={24} color={Colors.dark.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {orderForAddItem && (
                            <View style={{ flex: 1 }}>
                                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                                    {/* Order Info */}
                                    <View style={styles.addItemOrderInfo}>
                                        <Text style={styles.addItemOrderText}>
                                            Order #{orderForAddItem.orderId} • Table {orderForAddItem.tableNo}
                                        </Text>
                                    </View>

                                    {/* Search */}
                                    <View style={styles.searchContainer}>
                                        <Search size={18} color={Colors.dark.textSecondary} />
                                        <TextInput
                                            style={styles.searchInput}
                                            placeholder="Search menu items..."
                                            placeholderTextColor={Colors.dark.textSecondary}
                                        />
                                    </View>

                                    {/* Quick Add Categories */}
                                    <View style={styles.categoriesSection}>
                                        <Text style={styles.sectionLabel}>{t('manager.orders.categories')}</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                                            {['Pizza', 'Pasta', 'Drinks', 'Sides', 'Desserts'].map((category) => (
                                                <TouchableOpacity key={category} style={styles.categoryChip}>
                                                    <Text style={styles.categoryChipText}>{t(`manager.categories.${category.toLowerCase()}`)}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>

                                    {/* Selected Items */}
                                    {selectedItems.length > 0 && (
                                        <View style={styles.selectedItemsSection}>
                                            <Text style={styles.sectionLabel}>{t('manager.orders.selectedItems')} ({selectedItems.length})</Text>
                                            {selectedItems.map((item, index) => (
                                                <View key={index} style={styles.selectedItem}>
                                                    <View style={styles.selectedItemInfo}>
                                                        <Text style={styles.selectedItemName}>{item.name}</Text>
                                                        <Text style={styles.selectedItemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                                                    </View>
                                                    <View style={styles.quantityControls}>
                                                        <TouchableOpacity
                                                            style={styles.quantityButton}
                                                            onPress={() => {
                                                                const updated = selectedItems.map((si, i) =>
                                                                    i === index && si.quantity > 1
                                                                        ? { ...si, quantity: si.quantity - 1 }
                                                                        : si
                                                                );
                                                                setSelectedItems(updated);
                                                            }}
                                                        >
                                                            <Text style={styles.quantityButtonText}>-</Text>
                                                        </TouchableOpacity>
                                                        <Text style={styles.quantityText}>{item.quantity}</Text>
                                                        <TouchableOpacity
                                                            style={styles.quantityButton}
                                                            onPress={() => {
                                                                const updated = selectedItems.map((si, i) =>
                                                                    i === index ? { ...si, quantity: si.quantity + 1 } : si
                                                                );
                                                                setSelectedItems(updated);
                                                            }}
                                                        >
                                                            <Text style={styles.quantityButtonText}>+</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={styles.removeButton}
                                                            onPress={() => {
                                                                setSelectedItems(selectedItems.filter((_, i) => i !== index));
                                                            }}
                                                        >
                                                            <X size={18} color="#EF4444" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {/* Menu Items List */}
                                    <View style={styles.menuItemsList}>
                                        <Text style={styles.sectionLabel}>{t('manager.orders.menuItems')}</Text>

                                        {/* Menu Items from DB */}
                                        {menuItems.map((item, index) => {
                                            const isSelected = selectedItems.some(si => si.name === item.name);
                                            return (
                                                <TouchableOpacity
                                                    key={index}
                                                    style={[styles.menuItem, isSelected && styles.menuItemSelected]}
                                                    onPress={() => {
                                                        if (isSelected) {
                                                            setSelectedItems(selectedItems.filter(si => si.name !== item.name));
                                                        } else {
                                                            setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
                                                        }
                                                    }}
                                                >
                                                    <View style={styles.menuItemInfo}>
                                                        <Text style={styles.menuItemName}>{item.name}</Text>
                                                        <Text style={styles.menuItemPrice}>₹{item.price}</Text>
                                                    </View>
                                                    <View style={[styles.addIcon, isSelected && styles.addedIcon]}>
                                                        <Text style={styles.addIconText}>{isSelected ? '✓' : '+'}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                    {/* Confirm Button */}
                                    {/* Confirm Button Sticky Footer */}
                                </ScrollView>
                                <View style={{
                                    paddingTop: 16,
                                    borderTopWidth: 1,
                                    borderTopColor: Colors.dark.border,
                                    backgroundColor: Colors.dark.card,
                                }}>
                                    <TouchableOpacity
                                        disabled={selectedItems.length === 0}
                                        style={[styles.confirmButton, selectedItems.length === 0 && styles.confirmButtonDisabled]}
                                        onPress={async () => {
                                            if (orderForAddItem && selectedItems.length > 0) {
                                                try {
                                                    // 1. Prepare Data
                                                    const newOrderItemsData = selectedItems.map(item => ({
                                                        order_id: Number(orderForAddItem.id),
                                                        menu_item_name: item.name,
                                                        quantity: item.quantity,
                                                        unit_price: item.price,
                                                        total_price: item.price * item.quantity
                                                    }));

                                                    // 2. Insert into DB
                                                    const { error: insertError } = await supabase
                                                        .from('order_items')
                                                        .insert(newOrderItemsData);

                                                    if (insertError) throw insertError;

                                                    // Inventory deduction moved to Payment Success trigger

                                                    // 4. Update Order Total AND Status (if needed)
                                                    const addedAmount = newOrderItemsData.reduce((sum, item) => sum + item.total_price, 0);
                                                    const newTotalAmount = orderForAddItem.totalAmount + addedAmount;

                                                    // Force status back to pending if it was ready/served so chef sees it again
                                                    const shouldResetStatus = ['ready', 'served', 'completed'].includes(orderForAddItem.status);
                                                    const updatePayload: any = {
                                                        total_amount: newTotalAmount,
                                                        updated_at: new Date().toISOString()
                                                    };

                                                    if (shouldResetStatus) {
                                                        updatePayload.status = 'pending';
                                                        updatePayload.is_served = false;
                                                        // We allow it to go back to active queue
                                                    }

                                                    const { error: updateError } = await supabase
                                                        .from('orders')
                                                        .update(updatePayload)
                                                        .eq('id', Number(orderForAddItem.id));

                                                    if (updateError) throw updateError;

                                                    // 5. Update Local State
                                                    const updatedItems = [...orderForAddItem.items];
                                                    selectedItems.forEach(newItem => {
                                                        const existingIndex = updatedItems.findIndex(i => i.name === newItem.name);
                                                        if (existingIndex >= 0) {
                                                            updatedItems[existingIndex] = {
                                                                ...updatedItems[existingIndex],
                                                                quantity: updatedItems[existingIndex].quantity + newItem.quantity
                                                            };
                                                        } else {
                                                            updatedItems.push(newItem);
                                                        }
                                                    });

                                                    const updatedOrder = {
                                                        ...orderForAddItem,
                                                        items: updatedItems,
                                                        totalAmount: newTotalAmount
                                                    };

                                                    setOrders(prev => prev.map(o =>
                                                        o.id === orderForAddItem.id ? updatedOrder : o
                                                    ));

                                                    if (selectedOrder?.id === orderForAddItem.id) {
                                                        setSelectedOrder(updatedOrder);
                                                    }

                                                    // 6. Print Receipt
                                                    const printResult = await printAddedItemsReceipt(
                                                        orderForAddItem.orderId,
                                                        orderForAddItem.tableNo,
                                                        selectedItems
                                                    );

                                                    if (printResult.success && printResult.receipt) {
                                                        setCurrentReceipt(printResult.receipt);
                                                        setShowReceipt(true);
                                                    }

                                                    Alert.alert(t('common.success'), t('manager.orders.itemsAdded'));
                                                    setSelectedItems([]);
                                                    setShowAddItemModal(false);

                                                } catch (e) {
                                                    console.error("Error adding items:", e);
                                                    Alert.alert(t('common.error'), t('manager.orders.addItemError'));
                                                }
                                            }
                                        }}
                                    >
                                        <Text style={styles.confirmButtonText}>
                                            {t('manager.orders.confirm')} ({selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'})
                                        </Text>
                                    </TouchableOpacity>

                                </View>
                            </View>

                        )}
                    </View>
                </View>
            </Modal>

            {/* Payment Modal */}
            {
                selectedOrder && (
                    <PaymentModal
                        visible={showPaymentModal}
                        onClose={() => setShowPaymentModal(false)}
                        orderId={selectedOrder.orderId}
                        amount={selectedOrder.totalAmount}
                        customerName={selectedOrder.customerName}
                        onPaymentSuccess={async (transactionId, method) => {
                            if (!selectedOrder) return;
                            console.log('Payment successful:', { transactionId, method, orderId: selectedOrder.orderId });

                            try {
                                // 1. Update order status
                                const { error: orderError } = await supabase
                                    .from('orders')
                                    .update({
                                        status: 'completed',
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('id', Number(selectedOrder.id));

                                if (orderError) throw orderError;

                                // 2. Insert payment record
                                const { error: paymentError } = await supabase
                                    .from('payments')
                                    .insert([{
                                        order_id: Number(selectedOrder.id),
                                        amount: selectedOrder.totalAmount,
                                        payment_method: method,
                                        transaction_id: transactionId,
                                        status: 'completed',
                                        payment_date: new Date().toISOString(),
                                        // processed_by: userData?.id // If we had user context here
                                    }]);

                                if (paymentError) throw paymentError;

                                // 3. Deduct Inventory - AUTOMATIC ADJUSTMENT
                                try {
                                    /*
                                        Map existing order items to the format expected by inventory service.
                                        selectedOrder.items contains { name, quantity, price }.
                                        deductInventoryForOrder expects { menu_item_name, quantity }.
                                    */
                                    const itemsToDeduct = selectedOrder.items.map(i => ({
                                        menu_item_name: i.name,
                                        quantity: i.quantity
                                    }));
                                    await deductInventoryForOrder(itemsToDeduct);
                                } catch (invError) {
                                    console.error("Inventory deduction failed during payment:", invError);
                                }

                                if (paymentError) {
                                    console.error('Error recording payment:', paymentError);
                                    // Don't block completion, but log error
                                    Alert.alert('Warning', t('manager.orders.paymentError'));
                                }

                                // Update order to mark as paid/completed in local state
                                setOrders(prev => prev.map(o =>
                                    o.id === selectedOrder.id
                                        ? {
                                            ...o,
                                            isPaid: true,
                                            transactionId,
                                            paymentMethod: method
                                        }
                                        : o
                                ));

                                // Update selected order state
                                const updatedOrder = {
                                    ...selectedOrder,
                                    isPaid: true,
                                    transactionId,
                                    paymentMethod: method
                                };
                                setSelectedOrder(updatedOrder);

                                setShowPaymentModal(false);
                                setShowOrderModal(false);

                                // Generate payment receipt
                                const paymentData = {
                                    orderId: selectedOrder.orderId,
                                    tableNo: selectedOrder.tableNo,
                                    customerName: selectedOrder.customerName,
                                    items: selectedOrder.items,
                                    subtotal: selectedOrder.totalAmount,
                                    tax: 0,
                                    discount: 0,
                                    totalAmount: selectedOrder.totalAmount,
                                    paymentMethod: method,
                                    transactionId: transactionId,
                                    timestamp: new Date(),
                                    orderType: 'dine-in' as const
                                };

                                const receiptResult = await printPaymentReceipt(paymentData);

                                if (receiptResult.success && receiptResult.receipt) {
                                    setCurrentReceipt(receiptResult.receipt);
                                    setShowReceipt(true);
                                }
                            } catch (error) {
                                console.error('Error processing payment:', error);
                                Alert.alert('Error', 'Failed to process payment');
                            }
                        }}
                    />
                )
            }

            {/* Receipt Viewer */}
            <ReceiptViewer
                visible={showReceipt}
                onClose={() => setShowReceipt(false)}
                receipt={currentReceipt}
                receiptData={currentReceiptData}
                title="Receipt"
            />
            {/* Filter Modal */}
            <Modal visible={showFilterModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('filters.title')}</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <X size={24} color={Colors.dark.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Status Filter */}
                            <Text style={styles.filterLabel}>{t('filters.status')}</Text>
                            <View style={styles.filterRow}>
                                {['all', 'pending', 'served', 'completed'].map((status: any) => (
                                    <TouchableOpacity
                                        key={status}
                                        style={[styles.filterChip, tempFilters.status === status && styles.filterChipActive]}
                                        onPress={() => setTempFilters(prev => ({ ...prev, status: status }))}
                                    >
                                        <Text style={[styles.filterChipText, tempFilters.status === status && styles.filterChipTextActive]}>
                                            {t(`manager.orders.status.${status}`, { defaultValue: status })}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Payment Status */}
                            <Text style={styles.filterLabel}>{t('filters.paymentStatus')}</Text>
                            <View style={styles.filterRow}>
                                {['all', 'paid', 'unpaid'].map((status: any) => (
                                    <TouchableOpacity
                                        key={status}
                                        style={[styles.filterChip, tempFilters.paymentStatus === status && styles.filterChipActive]}
                                        onPress={() => setTempFilters(prev => ({ ...prev, paymentStatus: status }))}
                                    >
                                        <Text style={[styles.filterChipText, tempFilters.paymentStatus === status && styles.filterChipTextActive]}>
                                            {status === 'all' ? t('filters.all') :
                                                status === 'paid' ? t('manager.orders.paid') : t('manager.orders.unpaid')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Order Type */}
                            <Text style={styles.filterLabel}>{t('filters.orderType')}</Text>
                            <View style={styles.filterRow}>
                                {['all', 'dine-in', 'takeaway'].map((type: any) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.filterChip, tempFilters.orderType === type && styles.filterChipActive]}
                                        onPress={() => setTempFilters(prev => ({ ...prev, orderType: type }))}
                                    >
                                        <Text style={[styles.filterChipText, tempFilters.orderType === type && styles.filterChipTextActive]}>
                                            {t(`filters.${type}`) || type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Date Range - Future Implementation or reuse basic logic */}
                            {/* ... Date Range UI similar to Purchases ... */}


                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={() => {
                                    setActiveFilters(tempFilters);
                                    setShowFilterModal(false);
                                }}
                            >
                                <Text style={styles.applyButtonText}>{t('filters.apply')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.resetButton}
                                onPress={() => {
                                    setTempFilters({
                                        dateRange: 'all',
                                        startDate: null,
                                        endDate: null,
                                        status: 'all',
                                        paymentStatus: 'all',
                                        paymentMethod: 'all',
                                        orderType: 'all'
                                    });
                                }}
                            >
                                <Text style={styles.resetButtonText}>{t('filters.reset')}</Text>
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Notification Modal */}
            <Modal visible={showNotification} animationType="slide" transparent>
                <View style={[styles.modalOverlay, { justifyContent: 'flex-start', paddingTop: insets.top + 20 }]}>
                    <View style={[styles.modalContent, { marginHorizontal: 16, borderRadius: 16, maxHeight: '80%' }]}>
                        <View style={[styles.modalHeader, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{
                                    width: 48, height: 48, borderRadius: 24,
                                    backgroundColor: notificationType === 'new' ? '#10B981' : '#F59E0B',
                                    justifyContent: 'center', alignItems: 'center'
                                }}>
                                    <Bell size={24} color="#FFFFFF" />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.dark.text }}>
                                        {notificationType === 'new' ? 'New Order!' : 'Order Updated!'}
                                    </Text>
                                    <Text style={{ fontSize: 14, color: Colors.dark.textSecondary }}>
                                        Order #{notificationOrder?.order_number} • Table {notificationOrder?.table_id}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setShowNotification(false)}>
                                <X size={24} color={Colors.dark.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
                            {notificationType === 'update' && (
                                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.dark.textSecondary, marginBottom: 12, textTransform: 'uppercase' }}>
                                    New Items Added
                                </Text>
                            )}

                            {(newItems || []).map((item: any, idx: number) => (
                                <View key={idx} style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingVertical: 12,
                                    borderBottomWidth: 1,
                                    borderBottomColor: Colors.dark.border
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.dark.primary }}>
                                            {item.quantity}x
                                        </Text>
                                        <Text style={{ fontSize: 16, color: Colors.dark.text }}>
                                            {item.menu_item_name}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            style={{
                                marginTop: 20,
                                backgroundColor: Colors.dark.primary,
                                paddingVertical: 16,
                                borderRadius: 12,
                                alignItems: 'center'
                            }}
                            onPress={() => {
                                setShowNotification(false);
                                if (notificationOrder) fetchOrders();
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                                {t('common.acknowledgment', { defaultValue: 'Acknowledge' })}
                            </Text>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Colors.dark.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
        marginTop: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.dark.card,
        paddingVertical: 16,
        paddingHorizontal: 6,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
        minHeight: 70,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.dark.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    statLabel: {
        fontSize: 10,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
    },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.secondary,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        marginLeft: 8,
        fontSize: 16,
        color: Colors.dark.text,
    },
    statusContainer: {
        marginBottom: 16,
        flexGrow: 0,
    },
    statusChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: Colors.dark.secondary,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    statusChipActive: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.dark.textSecondary,
    },
    statusTextActive: {
        color: '#000000',
        fontWeight: 'bold',
    },
    ordersList: {
        flex: 1,
    },
    orderCard: {
        backgroundColor: Colors.dark.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        shadowColor: '#000000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
        overflow: 'hidden',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 10,
    },
    orderHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
    },
    orderHeaderTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    orderId: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.dark.text,
        flexShrink: 1,
        minWidth: 0,
        marginRight: 10,
    },
    tableTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        flexShrink: 0,
    },
    tableIcon: {
        marginRight: 4,
    },
    tableNo: {
        fontSize: 12,
        fontWeight: '600',
        color: '#000000',
    },
    statusToggleCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.dark.secondary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    statusToggleCompactServed: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    toggleThumb: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleThumbServed: {
        backgroundColor: '#FFFFFF',
    },
    statusToggleCompactText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
    },
    statusToggleCompactTextServed: {
        color: '#10B981',
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 0,
    },
    customerName: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.dark.textSecondary,
    },
    badgeIcon: {
        marginRight: 6,
    },
    orderMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statusBadgeCompleted: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(107, 114, 128, 0.14)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(107, 114, 128, 0.25)',
        flexShrink: 0,
        maxWidth: '48%',
    },
    statusTextCompleted: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    statusBadgeServed: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.14)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.25)',
        flexShrink: 0,
        maxWidth: '48%',
    },
    statusTextServed: {
        fontSize: 13,
        fontWeight: '600',
        color: '#10B981',
    },
    statusBadgePending: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.14)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.25)',
        flexShrink: 0,
        maxWidth: '48%',
    },
    statusTextPending: {
        fontSize: 13,
        fontWeight: '600',
        color: '#F59E0B',
    },
    itemsSection: {
        marginTop: 12,
        marginBottom: 12,
    },
    itemsSectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.dark.textSecondary,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    itemText: {
        fontSize: 14,
        color: Colors.dark.text,
        marginBottom: 6,
        lineHeight: 20,
    },
    itemQty: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.dark.primary,
    },
    moreItems: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        marginTop: 4,
        fontStyle: 'italic',
    },
    deleteButton: {
        width: 40,
        height: 40,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    printButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
    },
    printButtonIcon: {
        marginRight: 6,
    },
    printButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#000000',
    },
    totalPrice: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.dark.text,
        marginLeft: 4,
    },
    itemsContainer: {
        marginVertical: 12,
        paddingHorizontal: 0,
    },
    itemsLabel: {
        fontSize: 11,
        color: Colors.dark.textSecondary,
        marginBottom: 8,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    itemQuantity: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.dark.primary,
        minWidth: 28,
    },
    itemName: {
        fontSize: 14,
        color: Colors.dark.text,
        flex: 1,
    },
    moreItemsText: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginTop: 4,
        fontStyle: 'italic',
    },
    itemsList: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        lineHeight: 20,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
    },
    timeIcon: {
        marginRight: 6,
    },
    timeText: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    printRow: {
        alignItems: 'flex-end',
        marginTop: 6,
        marginBottom: 6,
    },
    addItemButtonCard: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: Colors.dark.primary,
        borderRadius: 100,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    addItemButtonCardText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#000000',
    },
    billButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        gap: 6,
        borderWidth: 1,
        borderColor: '#D1D5DB'
    },
    billButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#000000',
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#10B981',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.dark.text,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.dark.card,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        maxHeight: '96%',
        minHeight: '90%',
        borderWidth: 0,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.dark.text,
        letterSpacing: -0.5,
    },
    orderSummaryHeader: {
        backgroundColor: Colors.dark.secondary,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    summaryDivider: {
        width: 1,
        height: 24,
        backgroundColor: Colors.dark.border,
    },
    orderInfoCard: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginBottom: 20,
    },
    orderInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    orderInfoLabel: {
        color: Colors.dark.textSecondary,
        fontSize: 14,
    },
    orderInfoValue: {
        color: Colors.dark.text,
        fontSize: 14,
        fontWeight: '500',
    },
    orderItemsSection: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 12,
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    orderItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    orderQuantityButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.dark.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    orderQuantityButtonText: {
        fontSize: 20,
        color: Colors.dark.text,
        lineHeight: 22,
        fontWeight: '500',
    },
    orderItemQuantityText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.text,
        marginRight: 8,
        width: 30,
    },
    orderItemName: {
        fontSize: 14,
        color: Colors.dark.text,
        flex: 1,
    },
    orderItemPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    itemsFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    subtotalLabel: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    subtotalValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    orderTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.dark.secondary,
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    orderTotalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    orderTotalAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: '#10B981',
    },
    paymentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.dark.primary,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    paymentButtonDisabled: {
        backgroundColor: Colors.dark.secondary,
        opacity: 0.5,
    },
    paymentButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
    addItemOrderInfo: {
        backgroundColor: Colors.dark.secondary,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    addItemOrderText: {
        color: Colors.dark.text,
        fontWeight: '600',
        textAlign: 'center',
    },
    categoriesSection: {
        marginBottom: 20,
    },
    categoriesScroll: {
        flexGrow: 0,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: Colors.dark.secondary,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    categoryChipText: {
        color: Colors.dark.text,
        fontWeight: '500',
    },
    selectedItemsSection: {
        backgroundColor: Colors.dark.secondary,
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    selectedItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    selectedItemInfo: {
        flex: 1,
    },
    selectedItemName: {
        color: Colors.dark.text,
        fontSize: 14,
        fontWeight: '500',
    },
    selectedItemPrice: {
        color: Colors.dark.textSecondary,
        fontSize: 12,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    quantityButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.dark.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    quantityButtonText: {
        color: Colors.dark.text,
        fontSize: 20,
        lineHeight: 22,
        fontWeight: '500',
    },
    quantityText: {
        color: Colors.dark.text,
        fontWeight: '600',
        width: 20,
        textAlign: 'center',
    },
    removeButton: {
        marginLeft: 8,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#EF4444'
    },
    menuItemsList: {
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    menuItemSelected: {
        borderColor: Colors.dark.primary,
        backgroundColor: Colors.dark.secondary,
    },
    menuItemInfo: {
        flex: 1,
    },
    menuItemName: {
        color: Colors.dark.text,
        fontSize: 16,
        fontWeight: '500',
    },
    menuItemPrice: {
        color: Colors.dark.primary,
        fontSize: 14,
        fontWeight: '600',
    },

    addIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.dark.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    addedIcon: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
    },
    addIconText: {
        color: Colors.dark.text,
        fontSize: 24,
        lineHeight: 28,
        fontWeight: '500',
    },
    confirmButton: {
        backgroundColor: Colors.dark.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#000000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    confirmButtonDisabled: {
        backgroundColor: Colors.dark.secondary,
        opacity: 0.5,
    },
    tableSelectionScroll: {
        marginBottom: 16,
        flexGrow: 0,
    },
    tableOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.dark.secondary,
        borderRadius: 12,
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    tableOptionSelected: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
    },
    tableOptionText: {
        color: Colors.dark.text,
        fontSize: 14,
        fontWeight: '600',
    },
    tableOptionTextSelected: {
        color: '#000000',
        fontWeight: '700',
    },
    input: {
        backgroundColor: Colors.dark.inputBackground,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: Colors.dark.text,
        marginBottom: 16,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.dark.primary,
    },
    // Filter Styles
    filterButton: {
        backgroundColor: Colors.dark.secondary,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        width: 50,
    },
    filterButtonActive: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
    },
    modalKeyboardAvoidingView: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    filterScrollContent: {
        paddingBottom: 20,
    },
    filterSection: {
        marginBottom: 24,
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    filterFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
        gap: 16,
        marginTop: 'auto',
    },
    filterLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.dark.textSecondary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 0,
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: Colors.dark.secondary, // Light bg for inactive
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginBottom: 8,
    },
    filterChipActive: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
        shadowColor: Colors.dark.primary,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    filterChipText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: '#000000',
        fontWeight: '700',
    },
    applyButton: {
        backgroundColor: Colors.dark.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        flex: 1,
        marginTop: 0,
        shadowColor: Colors.dark.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    applyButtonText: {
        color: '#000000',
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    resetButton: {
        paddingVertical: 16,
        alignItems: 'center',
        flex: 1,
        marginTop: 0,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 12,
    },
    resetButtonText: {
        color: Colors.dark.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    dateInputContainer: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 16,
    },
});
