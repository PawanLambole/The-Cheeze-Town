import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search, X, Clock, CheckCircle, User, ShoppingBag, Table, Printer, Filter, CreditCard } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { printPaymentReceipt } from '../../services/thermalPrinter';
import { Colors } from '@/constants/Theme';
import { database, supabase } from '@/services/database';
import { useFocusEffect } from 'expo-router';
import ReceiptViewer from '../../components/ReceiptViewer';

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

interface OrderFilterState {
    dateRange: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';
    startDate: string | null;
    endDate: string | null;
    status: 'all' | 'pending' | 'served' | 'completed';
    paymentStatus: 'all' | 'paid' | 'unpaid';
    orderType: 'all' | 'dine-in' | 'takeaway';
}

export default function OrderHistoryScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { t } = useTranslation();
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'served' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Explicitly removing "Add Item" capability from History view to keep it clean, 
    // unless user requests it. History implies "Past".
    // But keeping "Print Bill" is useful.

    const [showReceipt, setShowReceipt] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState('');
    const [currentReceiptData, setCurrentReceiptData] = useState<any>(null);

    const [showFilterModal, setShowFilterModal] = useState(false);

    // Initialize filters based on URL params
    const initialDateRange = (params.dateRange as OrderFilterState['dateRange']) || 'month'; // Default to month/short history if generic, but we enforce 3 months in fetch
    const initialStatus = (params.status as OrderFilterState['status']) || 'all';

    const [activeFilters, setActiveFilters] = useState<OrderFilterState>({
        dateRange: initialDateRange,
        startDate: null,
        endDate: null,
        status: initialStatus,
        paymentStatus: 'all',
        orderType: 'all'
    });
    const [tempFilters, setTempFilters] = useState<OrderFilterState>(activeFilters);

    const statusOptions: ('all' | 'pending' | 'served' | 'completed')[] = ['all', 'pending', 'served', 'completed'];

    const [orders, setOrders] = useState<Order[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffMs = now.getTime() - past.getTime();
        const diffMins = Math.round(diffMs / 60000);
        if (diffMins < 60) return `${diffMins} ${t('common.minsAgo', { defaultValue: 'mins ago' })}`;
        const diffHours = Math.round(diffMins / 60);
        if (diffHours < 24) return `${diffHours} ${t('common.hoursAgo', { defaultValue: 'hours ago' })}`;
        return `${Math.round(diffHours / 24)} ${t('common.daysAgo', { defaultValue: 'days ago' })}`;
    };

    const fetchOrders = async () => {
        if (!refreshing) setRefreshing(true);
        try {
            // Default: Last 3 Months
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

            let query = supabase
                .from('orders')
                .select('*')
                .neq('status', 'cancelled')
                .gte('created_at', threeMonthsAgo.toISOString()) // LIMIT TO LAST 3 MONTHS
                .order('created_at', { ascending: false });

            const { data: dbOrders, error } = await query;

            if (error) throw error;

            const orderIds = (dbOrders || []).map((o: any) => o.id);
            let paymentsMap = new Map();

            if (orderIds.length > 0) {
                const { data: paymentsData } = await supabase
                    .from('payments')
                    .select('order_id, status, transaction_id, payment_method')
                    .in('order_id', orderIds)
                    .in('status', ['completed', 'confirmed']);

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

                const isPaid = status === 'paid' || status === 'completed' || !!paymentRecord;
                const isServed = status === 'served' || status === 'ready' || status === 'completed' || o.is_served === true;
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
                    status: o.status,
                };
            }));

            setOrders(ordersWithItems);
        } catch (error) {
            console.error('Error fetching orders:', error);
            Alert.alert(t('common.error'), t('manager.orders.fetchError', { defaultValue: 'Error fetching orders' }));
        } finally {
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    // Advanced Filtering Logic
    const getFilteredOrders = () => {
        return orders.filter(order => {
            // Search Filter
            const matchesSearch =
                order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.tableNo?.toString().includes(searchQuery) ||
                order.items?.some((item: any) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

            if (!matchesSearch) return false;

            // Status Filter
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

            // Payment Status
            if (activeFilters.paymentStatus !== 'all') {
                const isPaid = order.isPaid;
                if (activeFilters.paymentStatus === 'paid' && !isPaid) return false;
                if (activeFilters.paymentStatus === 'unpaid' && isPaid) return false;
            }

            // Order Type
            if (activeFilters.orderType !== 'all') {
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
        });
    };

    const filteredOrders = getFilteredOrders();
    const completedOrdersCount = filteredOrders.length; // Just show count of filtered

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

    const getStatusLabel = (status: string) => {
        return t(`filters.options.${status}`, { defaultValue: status });
    };

    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('manager.dashboard.orderHistory', { defaultValue: 'Order History' })}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                {/* Search Bar */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 }}>
                    <View style={[styles.searchContainer, { marginBottom: 0, flex: 1 }]}>
                        <Search size={20} color={Colors.dark.textSecondary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('common.search', { defaultValue: 'Search...' })}
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
                                {t(`filters.options.${status}`, { defaultValue: status })}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

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
                            onPress={() => {
                                setSelectedOrder(order);
                                setShowOrderModal(true);
                            }}
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
                                    <View style={[styles.statusToggleCompact, { backgroundColor: order.isServed ? '#DCFCE7' : '#FEF3C7', borderColor: order.isServed ? '#86EFAC' : '#FCD34D' }]}>
                                        <View style={[styles.toggleThumb, { backgroundColor: order.isServed ? '#059669' : '#D97706' }]}>
                                            {order.isServed ? <CheckCircle size={10} color="#FFFFFF" /> : <Clock size={10} color="#FFFFFF" />}
                                        </View>
                                        <Text style={[styles.statusToggleCompactText, { color: order.isServed ? '#065F46' : '#92400E' }]}>
                                            {order.isServed ? t('manager.orders.stats.served') : t('manager.orders.stats.pending')}
                                        </Text>
                                    </View>
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
                                    {order.isCompleted && (
                                        <TouchableOpacity
                                            style={styles.billButton}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                handlePrintBill(order);
                                            }}
                                        >
                                            <Printer size={14} color="#000000" />
                                            <Text style={styles.billButtonText}>{t('manager.orders.printBill')}</Text>
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
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* Order Details Modal - Simplified for History (Read Only mostly) */}
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
                                <View style={styles.orderSummaryHeader}>
                                    <View style={styles.summaryRow}>
                                        <View>
                                            <Text style={styles.summaryLabel}>{t('common.order', { defaultValue: 'Order' })}</Text>
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
                                            <Text style={[styles.summaryValue, { color: selectedOrder.isCompleted ? '#10B981' : '#F59E0B' }]}>
                                                {t(`filters.options.${selectedOrder.status.toLowerCase()}`, { defaultValue: selectedOrder.status.toUpperCase() })}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.orderItemsSection}>
                                    <Text style={styles.sectionLabel}>{t('manager.orders.items')} ({selectedOrder.items.length})</Text>
                                    {selectedOrder.items.map((item, index) => (
                                        <View key={index} style={styles.orderItem}>
                                            <View style={styles.orderItemLeft}>
                                                <Text style={styles.orderItemQuantityText}>{item.quantity}x</Text>
                                                <Text style={styles.orderItemName}>{item.name}</Text>
                                            </View>
                                            <Text style={styles.orderItemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                                        </View>
                                    ))}
                                    <View style={styles.itemsFooter}>
                                        <Text style={styles.subtotalLabel}>{t('manager.orders.subtotal')}</Text>
                                        <Text style={styles.subtotalValue}>₹{selectedOrder.totalAmount.toFixed(2)}</Text>
                                    </View>
                                </View>

                                <Text style={styles.orderTotalAmount}>₹{selectedOrder.totalAmount.toFixed(2)}</Text>

                                <View style={{ height: 40 }} />
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

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
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalKeyboardAvoidingView}
                    >
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t('filters.title', { defaultValue: 'Filter Orders' })}</Text>
                                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                    <X size={24} color={Colors.dark.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>

                                {/* Status Section */}
                                <View style={styles.filterSection}>
                                    <Text style={styles.filterLabel}>{t('filters.status', { defaultValue: 'Status' })}</Text>
                                    <View style={styles.filterRow}>
                                        {['all', 'pending', 'served', 'completed'].map((status: any) => (
                                            <TouchableOpacity
                                                key={status}
                                                style={[styles.filterChip, tempFilters.status === status && styles.filterChipActive]}
                                                onPress={() => setTempFilters(prev => ({ ...prev, status: status }))}
                                            >
                                                <Text style={[styles.filterChipText, tempFilters.status === status && styles.filterChipTextActive]}>
                                                    {t(`filters.options.${status}`, { defaultValue: status })}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Payment Status Section */}
                                <View style={styles.filterSection}>
                                    <Text style={styles.filterLabel}>{t('filters.paymentStatus', { defaultValue: 'Payment Status' })}</Text>
                                    <View style={styles.filterRow}>
                                        {['all', 'paid', 'unpaid'].map((status: any) => (
                                            <TouchableOpacity
                                                key={status}
                                                style={[styles.filterChip, tempFilters.paymentStatus === status && styles.filterChipActive]}
                                                onPress={() => setTempFilters(prev => ({ ...prev, paymentStatus: status }))}
                                            >
                                                <Text style={[styles.filterChipText, tempFilters.paymentStatus === status && styles.filterChipTextActive]}>
                                                    {t(`filters.options.${status}`, { defaultValue: status })}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Order Type Section */}
                                <View style={styles.filterSection}>
                                    <Text style={styles.filterLabel}>{t('filters.orderType', { defaultValue: 'Order Type' })}</Text>
                                    <View style={styles.filterRow}>
                                        {['all', 'dine-in', 'takeaway'].map((type: any) => (
                                            <TouchableOpacity
                                                key={type}
                                                style={[styles.filterChip, tempFilters.orderType === type && styles.filterChipActive]}
                                                onPress={() => setTempFilters(prev => ({ ...prev, orderType: type }))}
                                            >
                                                <Text style={[styles.filterChipText, tempFilters.orderType === type && styles.filterChipTextActive]}>
                                                    {t(`filters.options.${type}`, { defaultValue: type })}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Date Range Section */}
                                <View style={styles.filterSection}>
                                    <Text style={styles.filterLabel}>{t('filters.dateRange', { defaultValue: 'Date Range' })}</Text>
                                    <View style={styles.filterRow}>
                                        {['all', 'today', 'yesterday', 'week', 'month', 'custom'].map((range: any) => (
                                            <TouchableOpacity
                                                key={range}
                                                style={[styles.filterChip, tempFilters.dateRange === range && styles.filterChipActive]}
                                                onPress={() => setTempFilters(prev => ({ ...prev, dateRange: range }))}
                                            >
                                                <Text style={[styles.filterChipText, tempFilters.dateRange === range && styles.filterChipTextActive]}>
                                                    {t(`filters.options.${range}`, { defaultValue: range })}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {tempFilters.dateRange === 'custom' && (
                                        <View style={styles.dateInputContainer}>
                                            <View style={styles.dateInputWrapper}>
                                                <Text style={styles.dateInputLabel}>{t('filters.startDate', { defaultValue: 'Start Date' })}</Text>
                                                <TextInput
                                                    style={styles.dateInput}
                                                    placeholder="YYYY-MM-DD"
                                                    placeholderTextColor={Colors.dark.textSecondary}
                                                    value={tempFilters.startDate || ''}
                                                    onChangeText={(text) => setTempFilters(prev => ({ ...prev, startDate: text }))}
                                                />
                                            </View>
                                            <View style={styles.dateInputWrapper}>
                                                <Text style={styles.dateInputLabel}>{t('filters.endDate', { defaultValue: 'End Date' })}</Text>
                                                <TextInput
                                                    style={styles.dateInput}
                                                    placeholder="YYYY-MM-DD"
                                                    placeholderTextColor={Colors.dark.textSecondary}
                                                    value={tempFilters.endDate || ''}
                                                    onChangeText={(text) => setTempFilters(prev => ({ ...prev, endDate: text }))}
                                                />
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </ScrollView>

                            {/* Footer with Actions */}
                            <View style={styles.filterFooter}>
                                <TouchableOpacity
                                    style={styles.resetButton}
                                    onPress={() => {
                                        setTempFilters({
                                            dateRange: 'month',
                                            startDate: null,
                                            endDate: null,
                                            status: 'all',
                                            paymentStatus: 'all',
                                            orderType: 'all'
                                        });
                                    }}
                                >
                                    <Text style={styles.resetButtonText}>{t('filters.reset', { defaultValue: 'Reset' })}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.applyButton}
                                    onPress={() => {
                                        setActiveFilters(tempFilters);
                                        setShowFilterModal(false);
                                    }}
                                >
                                    <Text style={styles.applyButtonText}>{t('filters.apply', { defaultValue: 'Apply Filters' })}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
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
        paddingBottom: 20,
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
        paddingTop: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: Colors.dark.text,
        fontSize: 15,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.dark.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    filterButtonActive: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
    },
    statusContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        maxHeight: 40,
    },
    statusChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.dark.card,
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
        color: Colors.dark.textSecondary,
        fontWeight: '500',
    },
    statusTextActive: {
        color: '#000000',
        fontWeight: '600',
    },
    ordersList: {
        flex: 1,
    },
    orderCard: {
        backgroundColor: Colors.dark.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
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
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: Colors.dark.primary,
        borderRadius: 6,
    },
    tableNo: {
        fontSize: 12,
        fontWeight: '700',
        color: '#000000',
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    customerName: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
    },
    statusToggleCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingLeft: 4,
        paddingRight: 8,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusToggleCompactServed: {
        backgroundColor: '#DCFCE7',
        borderColor: '#86EFAC',
    },
    toggleThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#D97706', // Pending
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleThumbServed: {
        backgroundColor: '#059669',
    },
    statusToggleCompactText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusToggleCompactTextServed: {
        color: '#065F46',
    },
    itemsContainer: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    itemsList: {
        fontSize: 14,
        color: Colors.dark.text,
        lineHeight: 20,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timeText: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    billButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    billButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#000000',
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.dark.text,
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
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.dark.card,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        maxHeight: '85%',
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
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
        backgroundColor: Colors.dark.border,
    },
    orderInfoCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    orderInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    orderInfoLabel: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    orderInfoValue: {
        fontSize: 14,
        color: Colors.dark.text,
        fontWeight: '500',
    },
    orderItemsSection: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 16,
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    orderItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    orderItemQuantityText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.dark.primary,
        marginRight: 12,
        minWidth: 24,
    },
    orderItemName: {
        fontSize: 15,
        color: Colors.dark.text,
        flex: 1,
    },
    orderItemPrice: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    itemsFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    subtotalLabel: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    subtotalValue: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    orderTotalAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.dark.primary,
        textAlign: 'center',
        marginBottom: 24,
    },
    paymentButton: {
        backgroundColor: '#10B981',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    paymentButtonDisabled: {
        backgroundColor: '#F59E0B',
    },
    paymentButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    orderQuantityButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.dark.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    orderQuantityButtonText: {
        fontSize: 16,
        color: Colors.dark.text,
        fontWeight: '600',
    },
    addItemButtonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    addItemButtonCardText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#000000',
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
    // Filter Styles
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
    dateInputWrapper: {
        flex: 1,
    },

    dateInputLabel: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginBottom: 6,
    },
    dateInput: {
        backgroundColor: Colors.dark.secondary,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: Colors.dark.text,
        fontSize: 14,
    },
});
