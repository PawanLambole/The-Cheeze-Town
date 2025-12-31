import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, X, Clock, CheckCircle, User, ShoppingBag, Table, CreditCard, Plus, Filter } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import PaymentModal from '@/components/PaymentModal';
import { printAddedItemsReceipt, printPaymentReceipt } from '../../services/thermalPrinter';
import ReceiptViewer from '../../components/ReceiptViewer';
import { Colors } from '@/constants/Theme';
import { database, supabase } from '@/services/database';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { deductInventoryForOrder } from '@/services/inventoryService';

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
}

interface OrderFilterState {
    dateRange: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';
    startDate: Date | null;
    endDate: Date | null;
    status: 'all' | 'pending' | 'served' | 'completed';
    paymentStatus: 'all' | 'paid' | 'unpaid';
    orderType: 'all' | 'dine-in' | 'takeaway';
}

export default function OrdersScreen({ createOrderPath = '/manager/create-order' }: OrdersScreenProps) {
    const router = useRouter();
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

    const [showFilterModal, setShowFilterModal] = useState(false);
    const [activeFilters, setActiveFilters] = useState<OrderFilterState>({
        dateRange: 'all',
        startDate: null,
        endDate: null,
        status: 'all',
        paymentStatus: 'all',
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
        const diffMs = now.getTime() - past.getTime();
        const diffMins = Math.round(diffMs / 60000);
        if (diffMins < 60) return `${diffMins} mins ago`;
        const diffHours = Math.round(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${Math.round(diffHours / 24)} days ago`;
    };

    const fetchOrders = async () => {
        if (!refreshing) setRefreshing(true);
        try {
            const { data: dbOrders, error } = await supabase
                .from('orders')
                .select('*')
                .neq('status', 'cancelled')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const orderIds = (dbOrders || []).map((o: any) => o.id);
            let paymentsMap = new Map();

            if (orderIds.length > 0) {
                const { data: paymentsData } = await supabase
                    .from('payments')
                    .select('order_id, status, transaction_id, payment_method')
                    .in('order_id', orderIds)
                    .in('status', ['completed', 'confirmed']); // Only confirmed payments

                if (paymentsData) {
                    paymentsData.forEach((p: any) => {
                        paymentsMap.set(String(p.order_id), p);
                    });
                }
            }

            const ordersWithItems = await Promise.all((dbOrders || []).map(async (o: any) => {
                const { data: items } = await supabase
                    .from('order_items')
                    .select('menu_item_name, quantity, unit_price')
                    .eq('order_id', o.id);

                const mappedItems = (items || []).map((i: any) => ({
                    name: i.menu_item_name,
                    quantity: i.quantity,
                    price: i.unit_price
                }));

                const paymentRecord = paymentsMap.get(String(o.id));
                const status = o.status;

                // Status Logic:
                // isPaid: True if status is 'paid'/'completed' OR payment record exists
                const isPaid = status === 'paid' || status === 'completed' || !!paymentRecord;

                // isServed: True if Chef marked ready (status='ready'/'served'/'completed') OR is_served flag is true
                const isServed = status === 'served' || status === 'ready' || status === 'completed' || o.is_served === true;

                // isCompleted: Strictly 'completed' status
                const isCompleted = status === 'completed';

                return {
                    id: String(o.id),
                    orderId: o.order_number,
                    tableNo: o.table_id,
                    createdAt: o.created_at,
                    customerName: o.customer_name,
                    items: mappedItems,
                    isServed: isServed,
                    isPaid: isPaid,
                    isCompleted: isCompleted,
                    totalAmount: o.total_amount,
                    time: getTimeAgo(o.created_at),
                    duration: getTimeAgo(o.created_at).replace(' ago', ''),
                    transactionId: o.transaction_id || paymentRecord?.transaction_id,
                    paymentMethod: o.payment_method || paymentRecord?.payment_method,
                    status: o.status, // Added status field
                };
            }));

            setOrders(ordersWithItems);
        } catch (error) {
            console.error('Error fetching orders:', error);
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

    useEffect(() => {
        const sub = database.subscribe('orders', () => {
            fetchOrders();
        });
        return () => {
            database.unsubscribe(sub);
        };
    }, []);

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
                        if (orderDate < start) return false;
                    }
                    if (activeFilters.endDate) {
                        const end = new Date(activeFilters.endDate);
                        end.setHours(23, 59, 59, 999);
                        if (orderDate > end) return false;
                    }
                }
            }

            return true;

            return true;
        });
    };

    const filteredOrders = getFilteredOrders();

    const pendingOrdersCount = orders.filter(o => !o.isServed && !o.isCompleted).length;
    const servedOrdersCount = orders.filter(o => o.isServed && !o.isCompleted).length;
    const completedOrdersCount = orders.filter(o => o.isCompleted).length;

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
            alert("Failed to update status");
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
                        <Text style={styles.statValue}>{orders.length}</Text>
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
                            <View style={styles.orderHeader}>
                                <View>
                                    <View style={styles.orderHeaderTop}>
                                        <Text style={styles.orderId}>#{order.orderId}</Text>
                                        <View style={styles.tableTag}>
                                            <Table size={12} color="#000000" />
                                            <Text style={styles.tableNo}>{t('manager.orders.table')} {order.tableNo}</Text>
                                        </View>
                                    </View>
                                    {order.customerName && (
                                        <View style={styles.customerInfo}>
                                            <User size={12} color={Colors.dark.textSecondary} />
                                            <Text style={styles.customerName}>{order.customerName}</Text>
                                        </View>
                                    )}
                                </View>

                                {order.isCompleted ? (
                                    <View style={[styles.statusToggleCompact, { backgroundColor: '#E5E7EB', borderColor: '#D1D5DB' }]}>
                                        <View style={[styles.toggleThumb, { backgroundColor: '#9CA3AF' }]}>
                                            <CheckCircle size={10} color="#FFFFFF" />
                                        </View>
                                        <Text style={[styles.statusToggleCompactText, { color: '#6B7280' }]}>
                                            {t('manager.orders.stats.completed')}
                                        </Text>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.statusToggleCompact, order.isServed && styles.statusToggleCompactServed]}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            toggleOrderStatus(order.id);
                                        }}
                                    >
                                        <View style={[styles.toggleThumb, order.isServed && styles.toggleThumbServed]}>
                                            {order.isServed ? (
                                                <CheckCircle size={10} color="#047857" />
                                            ) : (
                                                <Clock size={10} color="#92400E" />
                                            )}
                                        </View>
                                        <Text style={[styles.statusToggleCompactText, order.isServed && styles.statusToggleCompactTextServed]}>
                                            {order.isServed ? t('manager.orders.stats.served') : t('manager.orders.stats.pending')}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.itemsContainer}>
                                <Text style={styles.itemsList} numberOfLines={2}>
                                    {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                                </Text>
                            </View>

                            <View style={styles.orderFooter}>
                                <View style={styles.timeContainer}>
                                    <Clock size={14} color={Colors.dark.textSecondary} />
                                    <Text style={styles.timeText}>{order.time}</Text>
                                </View>

                                <View style={styles.footerRight}>
                                    {!order.isCompleted && (
                                        <TouchableOpacity
                                            style={styles.addItemButtonCard}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                setOrderForAddItem(order);
                                                setShowAddItemModal(true);
                                            }}
                                        >
                                            <Plus size={14} color="#000000" />
                                            <Text style={styles.addItemButtonCardText}>{t('manager.orders.addItem')}</Text>
                                        </TouchableOpacity>
                                    )}
                                    <Text style={styles.totalAmount}>₹{order.totalAmount.toFixed(2)}</Text>
                                </View>
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

                                {/* Total Amount - Highlighted */}
                                <Text style={styles.orderTotalAmount}>₹{selectedOrder.totalAmount.toFixed(2)}</Text>

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
                                                            .eq('table_number', selectedOrder.tableNo); // Assuming tableNo maps to table_number or you need to fetch ID. 
                                                        // Wait, selectedOrder has tableNo which is a number. 
                                                        // In fetchOrders, tableNo comes from o.table_id which is likely the ID or Number.
                                                        // Let's verify mapping in fetchOrders.
                                                        // o.table_id is used. In create-order it inserts table_id.
                                                        // So selectedOrder.tableNo is likely the Table ID if the column is table_id. 
                                                        // Checking Create Order: table_id: selectedTable ? parseInt(selectedTable) : null
                                                        // Checking Fetch Orders: tableNo: o.table_id
                                                        // So tableNo IS the table_id (FK).
                                                        // But wait, the display says "Table {order.tableNo}". 
                                                        // If table_id is 1, 2, 3 it might be fine if IDs match Numbers.
                                                        // But usually IDs are distinct.
                                                        // Let's check create-order again: 
                                                        // tableNo: selectedTable ? tables.find(t => t.id === selectedTable)?.number : 'Takeaway'
                                                        // In fetchOrders: tableNo: o.table_id.
                                                        // Ideally we should update by ID.

                                                        // Using the ID to update
                                                        /* 
                                                            NOTE: selectedOrder.tableNo comes from database column `table_id`.
                                                            So we should use .eq('id', selectedOrder.tableNo).
                                                        */

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
                            <ScrollView showsVerticalScrollIndicator={false}>
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
                                                        <X size={16} color="#EF4444" />
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
                                {selectedItems.length > 0 && (
                                    <TouchableOpacity
                                        style={styles.confirmButton}
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
                                )}

                                <View style={{ height: 20 }} />
                            </ScrollView>
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
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
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
    },
    tableTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
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
    itemsContainer: {
        marginVertical: 12,
        paddingHorizontal: 0,
    },
    itemsLabel: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginBottom: 2,
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
        gap: 6,
    },
    timeText: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
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
        fontWeight: '600',
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
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '90%',
        minHeight: '60%',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
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
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.dark.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    orderQuantityButtonText: {
        fontSize: 16,
        color: Colors.dark.text,
        lineHeight: 18,
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
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.dark.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    quantityButtonText: {
        color: Colors.dark.text,
        fontSize: 16,
        lineHeight: 18,
    },
    quantityText: {
        color: Colors.dark.text,
        fontWeight: '600',
        width: 20,
        textAlign: 'center',
    },
    removeButton: {
        marginLeft: 4,
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
        width: 28,
        height: 28,
        borderRadius: 14,
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
        fontSize: 18,
        lineHeight: 20,
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
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.text,
        marginTop: 16,
        marginBottom: 8,
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: Colors.dark.secondary,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: 'rgba(253, 184, 19, 0.2)',
        borderColor: Colors.dark.primary,
    },
    filterChipText: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
    },
    filterChipTextActive: {
        color: Colors.dark.primary,
        fontWeight: '600',
    },
    applyButton: {
        backgroundColor: Colors.dark.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    applyButtonText: {
        color: '#000000',
        fontWeight: '600',
        fontSize: 16,
    },
    resetButton: {
        padding: 16,
        alignItems: 'center',
    },
    resetButtonText: {
        color: Colors.dark.textSecondary,
        fontSize: 14,
    },

});
