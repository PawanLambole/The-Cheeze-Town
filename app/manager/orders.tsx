import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, X, Clock, CheckCircle, User, ShoppingBag, Table, CreditCard } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

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
    isServed: boolean;
    totalAmount: number;
    time: string;
    duration: string;
}

export default function OrdersScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [orderForAddItem, setOrderForAddItem] = useState<Order | null>(null);
    const [selectedItems, setSelectedItems] = useState<Array<{ name: string, price: number, quantity: number }>>([]);

    const statusOptions: ('all' | 'active' | 'completed')[] = ['all', 'active', 'completed'];

    // Mock orders data - matching the structure from the homepage
    const [orders, setOrders] = useState<Order[]>([
        {
            id: '1',
            orderId: 'ORD001',
            tableNo: 5,
            customerName: 'Rahul Sharma',
            items: [
                { name: 'Margherita Pizza', quantity: 2, price: 250 },
                { name: 'Garlic Bread', quantity: 1, price: 150 },
                { name: 'Coke', quantity: 2, price: 50 }
            ],
            isServed: false,
            totalAmount: 650,
            time: '10 mins ago',
            duration: '10 min',
        },
        {
            id: '2',
            orderId: 'ORD002',
            tableNo: 3,
            items: [
                { name: 'Paneer Tikka Pizza', quantity: 1, price: 280 },
                { name: 'French Fries', quantity: 1, price: 150 }
            ],
            isServed: true,
            totalAmount: 480,
            time: '25 mins ago',
            duration: '25 min',
        },
        {
            id: '3',
            orderId: 'ORD003',
            tableNo: 8,
            customerName: 'Priya Patel',
            items: [
                { name: 'Cheese Burst Pizza', quantity: 1, price: 450 },
                { name: 'Pasta Alfredo', quantity: 1, price: 280 },
                { name: 'Pepsi', quantity: 1, price: 50 },
                { name: 'Ice Cream', quantity: 1, price: 110 }
            ],
            isServed: false,
            totalAmount: 890,
            time: '32 mins ago',
            duration: '32 min',
        },
        {
            id: '4',
            orderId: 'ORD004',
            tableNo: 2,
            items: [
                { name: 'Veg Supreme Pizza', quantity: 1, price: 320 },
                { name: 'Garlic Bread', quantity: 1, price: 150 }
            ],
            isServed: true,
            totalAmount: 520,
            time: '45 mins ago',
            duration: '45 min',
        },
        {
            id: '5',
            orderId: 'ORD005',
            tableNo: 12,
            customerName: 'Amit Kumar',
            items: [
                { name: 'BBQ Chicken Pizza', quantity: 1, price: 380 },
                { name: 'Wings', quantity: 1, price: 250 },
                { name: 'Sprite', quantity: 1, price: 50 }
            ],
            isServed: true,
            totalAmount: 780,
            time: '1 hour ago',
            duration: '1h',
        },
        {
            id: '6',
            orderId: 'ORD006',
            tableNo: 7,
            items: [
                { name: 'Farmhouse Pizza', quantity: 1, price: 300 },
                { name: 'Coke', quantity: 1, price: 50 }
            ],
            isServed: false,
            totalAmount: 350,
            time: '15 mins ago',
            duration: '15 min',
        },
        {
            id: '7',
            orderId: 'ORD007',
            tableNo: 4,
            customerName: 'Sneha Desai',
            items: [
                { name: 'Margherita Pizza', quantity: 1, price: 250 },
                { name: 'Pasta Carbonara', quantity: 1, price: 260 },
                { name: 'Garlic Bread', quantity: 1, price: 150 },
                { name: 'Pepsi', quantity: 2, price: 50 }
            ],
            isServed: true,
            totalAmount: 760,
            time: '1h 20min ago',
            duration: '1h 20min',
        },
        {
            id: '8',
            orderId: 'ORD008',
            tableNo: 10,
            items: [
                { name: 'Tandoori Paneer Pizza', quantity: 1, price: 340 },
                { name: 'French Fries', quantity: 1, price: 150 }
            ],
            isServed: false,
            totalAmount: 490,
            time: '8 mins ago',
            duration: '8 min',
        },
    ]);

    // Filter orders based on status
    const getFilteredByStatus = () => {
        if (selectedStatus === 'all') return orders;
        if (selectedStatus === 'active') return orders.filter(o => !o.isServed);
        return orders.filter(o => o.isServed);
    };

    // Apply search filter
    const filteredOrders = getFilteredByStatus().filter(order =>
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.tableNo.toString().includes(searchQuery)
    );

    const activeOrdersCount = orders.filter(o => !o.isServed).length;
    const completedOrdersCount = orders.filter(o => o.isServed).length;

    const handleOrderClick = (order: Order) => {
        setSelectedOrder(order);
        setShowOrderModal(true);
    };

    const toggleOrderStatus = (orderId: string) => {
        setOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, isServed: !o.isServed } : o
        ));
        if (selectedOrder?.id === orderId) {
            setSelectedOrder({ ...selectedOrder, isServed: !selectedOrder.isServed });
        }
    };

    const getStatusLabel = (status: 'all' | 'active' | 'completed') => {
        switch (status) {
            case 'all': return t('manager.orders.allOrders');
            case 'active': return t('manager.orders.activeOrders');
            case 'completed': return t('manager.orders.completedOrders');
            default: return status;
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('manager.orders.title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{orders.length}</Text>
                        <Text style={styles.statLabel}>Total Orders</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#F59E0B' }]}>{activeOrdersCount}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#10B981' }]}>{completedOrdersCount}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('manager.orders.searchOrders')}
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
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
                <ScrollView style={styles.ordersList} showsVerticalScrollIndicator={false}>
                    {filteredOrders.map(order => (
                        <TouchableOpacity
                            key={order.id}
                            style={styles.orderCard}
                            onPress={() => handleOrderClick(order)}
                        >
                            <View style={styles.orderHeader}>
                                <View style={styles.orderHeaderLeft}>
                                    <Text style={styles.orderId}>#{order.orderId}</Text>
                                    <View style={styles.tableTag}>
                                        <Table size={12} color="#FDB813" />
                                        <Text style={styles.tableNo}>{t('common.table')} {order.tableNo}</Text>
                                    </View>
                                </View>
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
                                        {order.isServed ? t('manager.home.served') : t('manager.home.pending')}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {order.customerName && (
                                <View style={styles.customerInfo}>
                                    <User size={14} color="#6B7280" />
                                    <Text style={styles.customerName}>{order.customerName}</Text>
                                </View>
                            )}

                            <View style={styles.itemsContainer}>
                                <Text style={styles.itemsLabel}>{t('common.items')}:</Text>
                                <Text style={styles.itemsList} numberOfLines={2}>
                                    {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                                </Text>
                            </View>

                            <View style={styles.orderFooter}>
                                <View style={styles.timeContainer}>
                                    <Clock size={12} color="#6B7280" />
                                    <Text style={styles.timeText}>{order.time}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.addItemButtonCard}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        setOrderForAddItem(order);
                                        setShowAddItemModal(true);
                                    }}
                                >
                                    <Text style={styles.addItemButtonCardText}>Add Item</Text>
                                </TouchableOpacity>
                                <Text style={styles.totalAmount}>₹{order.totalAmount.toFixed(2)}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}

                    {filteredOrders.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <ShoppingBag size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No orders found</Text>
                            {searchQuery && (
                                <Text style={styles.emptySubtext}>Try a different search term</Text>
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
                                <X size={24} color="#6B7280" />
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
                                            <Text style={styles.summaryLabel}>Table</Text>
                                            <Text style={styles.summaryValue}>{selectedOrder.tableNo}</Text>
                                        </View>
                                        <View style={styles.summaryDivider} />
                                        <View>
                                            <Text style={styles.summaryLabel}>Status</Text>
                                            <Text style={[styles.summaryValue, { color: selectedOrder.isServed ? '#10B981' : '#F59E0B' }]}>
                                                {selectedOrder.isServed ? 'Served' : 'Pending'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Customer & Time Info */}
                                <View style={styles.orderInfoCard}>
                                    {selectedOrder.customerName && (
                                        <View style={styles.orderInfoRow}>
                                            <Text style={styles.orderInfoLabel}>Customer</Text>
                                            <Text style={styles.orderInfoValue}>{selectedOrder.customerName}</Text>
                                        </View>
                                    )}
                                    <View style={styles.orderInfoRow}>
                                        <Text style={styles.orderInfoLabel}>Time Elapsed</Text>
                                        <Text style={styles.orderInfoValue}>{selectedOrder.time}</Text>
                                    </View>
                                    <View style={[styles.orderInfoRow, { borderBottomWidth: 0 }]}>
                                        <Text style={styles.orderInfoLabel}>Duration</Text>
                                        <Text style={styles.orderInfoValue}>{selectedOrder.duration}</Text>
                                    </View>
                                </View>

                                {/* Order Items */}
                                <View style={styles.orderItemsSection}>
                                    <Text style={styles.sectionLabel}>Items ({selectedOrder.items.length})</Text>
                                    {selectedOrder.items.map((item, index) => (
                                        <View key={index} style={styles.orderItem}>
                                            <View style={styles.orderItemLeft}>
                                                <Text style={styles.orderItemQuantity}>{item.quantity}</Text>
                                                <Text style={styles.orderItemName}>{item.name}</Text>
                                            </View>
                                            <Text style={styles.orderItemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                                        </View>
                                    ))}

                                    {/* Subtotal in items section */}
                                    <View style={styles.itemsFooter}>
                                        <Text style={styles.subtotalLabel}>Subtotal</Text>
                                        <Text style={styles.subtotalValue}>₹{selectedOrder.totalAmount.toFixed(2)}</Text>
                                    </View>
                                </View>

                                {/* Total Amount - Highlighted */}
                                <View style={styles.orderTotal}>
                                    <Text style={styles.orderTotalLabel}>Total Amount</Text>
                                    <Text style={styles.orderTotalAmount}>₹{selectedOrder.totalAmount.toFixed(2)}</Text>
                                </View>

                                {/* Payment Button */}
                                <TouchableOpacity
                                    style={[styles.paymentButton, !selectedOrder.isServed && styles.paymentButtonDisabled]}
                                    onPress={() => {
                                        if (selectedOrder.isServed) {
                                            // Handle payment logic here
                                            console.log('Processing payment for order:', selectedOrder.orderId);
                                            setShowOrderModal(false);
                                        }
                                    }}
                                    disabled={!selectedOrder.isServed}
                                >
                                    <CreditCard size={18} color="#FFFFFF" />
                                    <Text style={styles.paymentButtonText}>
                                        {selectedOrder.isServed ? 'Process Payment' : 'Mark as Served First'}
                                    </Text>
                                </TouchableOpacity>

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
                            <Text style={styles.modalTitle}>Add Item to Order</Text>
                            <TouchableOpacity onPress={() => setShowAddItemModal(false)}>
                                <X size={24} color="#6B7280" />
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
                                    <Search size={18} color="#9CA3AF" />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="Search menu items..."
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>

                                {/* Quick Add Categories */}
                                <View style={styles.categoriesSection}>
                                    <Text style={styles.sectionLabel}>Categories</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                                        {['Pizza', 'Pasta', 'Drinks', 'Sides', 'Desserts'].map((category) => (
                                            <TouchableOpacity key={category} style={styles.categoryChip}>
                                                <Text style={styles.categoryChipText}>{category}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* Selected Items */}
                                {selectedItems.length > 0 && (
                                    <View style={styles.selectedItemsSection}>
                                        <Text style={styles.sectionLabel}>Selected Items ({selectedItems.length})</Text>
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
                                    <Text style={styles.sectionLabel}>Menu Items</Text>

                                    {/* Sample Menu Items */}
                                    {[
                                        { name: 'Margherita Pizza', price: 250 },
                                        { name: 'Paneer Tikka Pizza', price: 280 },
                                        { name: 'Pasta Alfredo', price: 280 },
                                        { name: 'Garlic Bread', price: 150 },
                                        { name: 'Coke', price: 50 },
                                    ].map((item, index) => {
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
                                        onPress={() => {
                                            console.log('Confirm adding items:', selectedItems);
                                            // Here you would add the items to the order
                                            setSelectedItems([]);
                                            setShowAddItemModal(false);
                                        }}
                                    >
                                        <Text style={styles.confirmButtonText}>
                                            Confirm ({selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'})
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <View style={{ height: 20 }} />
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: '#6B7280',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
    },
    statusContainer: {
        marginBottom: 16,
        flexGrow: 0,
    },
    statusChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    statusChipActive: {
        backgroundColor: '#FDB813',
        borderColor: '#FDB813',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    statusTextActive: {
        color: '#FFFFFF',
    },
    ordersList: {
        flex: 1,
    },
    orderCard: {
        backgroundColor: '#FFFFFF',
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    orderHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    orderId: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    tableTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 5,
    },
    tableNo: {
        fontSize: 10,
        fontWeight: '600',
        color: '#92400E',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    servedBadge: {
        backgroundColor: '#D1FAE5',
    },
    pendingBadge: {
        backgroundColor: '#FEF3C7',
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    servedText: {
        color: '#065F46',
    },
    pendingText: {
        color: '#92400E',
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
        marginBottom: 6,
    },
    customerName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    itemsContainer: {
        backgroundColor: '#FAFBFC',
        padding: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 6,
    },
    itemsLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 3,
    },
    itemsList: {
        fontSize: 12,
        color: '#1F2937',
        lineHeight: 16,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 5,
    },
    timeText: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '500',
    },
    totalAmount: {
        fontSize: 15,
        fontWeight: '700',
        color: '#10B981',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 12,
        fontWeight: '600',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#D1D5DB',
        marginTop: 4,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 14,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    orderInfoCard: {
        backgroundColor: '#F9FAFB',
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    orderInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    orderInfoLabel: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
    },
    orderInfoValue: {
        fontSize: 13,
        color: '#111827',
        fontWeight: '600',
    },
    orderItemsSection: {
        marginBottom: 10,
        backgroundColor: '#FAFBFC',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 8,
        marginBottom: 4,
        borderRadius: 6,
    },
    orderItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    orderItemQuantity: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        minWidth: 24,
        height: 24,
        backgroundColor: '#FDB813',
        borderRadius: 5,
        textAlign: 'center',
        lineHeight: 24,
    },
    orderItemName: {
        fontSize: 13,
        color: '#1F2937',
        flex: 1,
    },
    orderItemPrice: {
        fontSize: 13,
        fontWeight: '700',
        color: '#10B981',
    },
    orderTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#FEF3C7',
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    orderTotalLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#92400E',
    },
    orderTotalAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#92400E',
    },
    currentStatus: {
        marginBottom: 16,
    },
    currentStatusLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
    },
    statusBadgeLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    statusBadgeTextLarge: {
        fontSize: 14,
        fontWeight: '600',
    },
    statusToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#10B981',
        paddingVertical: 12,
        borderRadius: 10,
    },
    statusToggleButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    paymentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        borderRadius: 10,
    },
    paymentButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // New structural styles
    orderSummaryHeader: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    summaryLabel: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 4,
        textAlign: 'center',
    },
    summaryValue: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '700',
        textAlign: 'center',
    },
    summaryDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#D1D5DB',
    },
    itemsFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        marginTop: 6,
        borderTopWidth: 2,
        borderTopColor: '#E5E7EB',
    },
    subtotalLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    subtotalValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    addItemButton: {
        backgroundColor: '#FDB813',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    addItemButtonText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    paymentButtonDisabled: {
        backgroundColor: '#9CA3AF',
        opacity: 0.6,
    },
    // Add Item Button in Card
    addItemButtonCard: {
        backgroundColor: '#FDB813',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    addItemButtonCardText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Add Item Modal Styles
    addItemOrderInfo: {
        backgroundColor: '#F9FAFB',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    addItemOrderText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
    },
    categoriesSection: {
        marginBottom: 16,
    },
    categoriesScroll: {
        flexGrow: 0,
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    menuItemsList: {
        marginBottom: 16,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    menuItemInfo: {
        flex: 1,
    },
    menuItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    menuItemPrice: {
        fontSize: 13,
        fontWeight: '500',
        color: '#10B981',
    },
    addIcon: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: '#FDB813',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addIconText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Selected Items Section
    selectedItemsSection: {
        marginBottom: 16,
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    selectedItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    selectedItemInfo: {
        flex: 1,
    },
    selectedItemName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    selectedItemPrice: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    quantityButton: {
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    quantityButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },
    quantityText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
        minWidth: 20,
        textAlign: 'center',
    },
    removeButton: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
    },
    menuItemSelected: {
        borderColor: '#FDB813',
        backgroundColor: '#FFFBEB',
    },
    addedIcon: {
        backgroundColor: '#10B981',
    },
    confirmButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    confirmButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    statusToggleCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#FEF3C7',
        borderWidth: 1.5,
        borderColor: '#F59E0B',
    },
    statusToggleCompactServed: {
        backgroundColor: '#D1FAE5',
        borderColor: '#10B981',
    },
    toggleThumb: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#F59E0B',
    },
    toggleThumbServed: {
        backgroundColor: '#D1FAE5',
        borderColor: '#10B981',
    },
    statusToggleCompactText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#92400E',
    },
    statusToggleCompactTextServed: {
        color: '#047857',
    },
});
