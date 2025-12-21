import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, X, Clock, CheckCircle, User, ShoppingBag, Table, CreditCard } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import PaymentModal from '../../components/PaymentModal';
import { printAddedItemsReceipt, printPaymentReceipt } from '../../services/thermalPrinter';
import ReceiptViewer from '../../components/ReceiptViewer';
import { Colors } from '@/constants/Theme';

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
    isPaid: boolean;
    totalAmount: number;
    time: string;
    duration: string;
    transactionId?: string;
    paymentMethod?: string;
}

export default function OrdersScreen() {
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

    const statusOptions: ('all' | 'pending' | 'served' | 'completed')[] = ['all', 'pending', 'served', 'completed'];

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
            isPaid: false,
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
            isPaid: false,
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
            isPaid: false,
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
            isPaid: false,
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
            isPaid: false,
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
            isPaid: false,
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
            isPaid: false,
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
            isPaid: false,
            totalAmount: 490,
            time: '8 mins ago',
            duration: '8 min',
        },
    ]);

    // Filter orders based on status
    const getFilteredByStatus = () => {
        if (selectedStatus === 'all') return orders;
        if (selectedStatus === 'pending') return orders.filter(o => !o.isServed);
        if (selectedStatus === 'served') return orders.filter(o => o.isServed && !o.isPaid);
        return orders.filter(o => o.isPaid); // Completed = paid orders
    };

    // Apply search filter
    const filteredOrders = getFilteredByStatus().filter(order =>
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.tableNo.toString().includes(searchQuery)
    );

    const pendingOrdersCount = orders.filter(o => !o.isServed).length;
    const servedOrdersCount = orders.filter(o => o.isServed && !o.isPaid).length;
    const completedOrdersCount = orders.filter(o => o.isPaid).length;

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

    const getStatusLabel = (status: 'all' | 'pending' | 'served' | 'completed') => {
        switch (status) {
            case 'all': return 'All Orders';
            case 'pending': return 'Pending';
            case 'served': return 'Served';
            case 'completed': return 'Completed';
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
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{orders.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#F59E0B' }]}>{pendingOrdersCount}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#3B82F6' }]}>{servedOrdersCount}</Text>
                        <Text style={styles.statLabel}>Served</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#10B981' }]}>{completedOrdersCount}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search size={20} color={Colors.dark.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('manager.orders.searchOrders')}
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
                                        <Table size={12} color="#000000" />
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
                                    <User size={14} color={Colors.dark.textSecondary} />
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
                                    <Clock size={12} color={Colors.dark.textSecondary} />
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
                            <ShoppingBag size={48} color={Colors.dark.textSecondary} />
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
                                                <Text style={styles.orderItemQuantityText}>{item.quantity}x</Text>
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
                                            setShowPaymentModal(true);
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
                                        onPress={async () => {
                                            if (orderForAddItem) {
                                                // Merge new items with existing items
                                                const updatedItems = [...orderForAddItem.items];

                                                selectedItems.forEach(newItem => {
                                                    const existingIndex = updatedItems.findIndex(i => i.name === newItem.name);
                                                    if (existingIndex >= 0) {
                                                        // Item exists, increase quantity
                                                        updatedItems[existingIndex] = {
                                                            ...updatedItems[existingIndex],
                                                            quantity: updatedItems[existingIndex].quantity + newItem.quantity
                                                        };
                                                    } else {
                                                        // New item, add to list
                                                        updatedItems.push(newItem);
                                                    }
                                                });

                                                const newTotal = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

                                                // Update the order
                                                const updatedOrder = {
                                                    ...orderForAddItem,
                                                    items: updatedItems,
                                                    totalAmount: newTotal
                                                };

                                                // Update orders state
                                                setOrders(prev => prev.map(o =>
                                                    o.id === orderForAddItem.id ? updatedOrder : o
                                                ));

                                                // Update selectedOrder if it's the same order
                                                if (selectedOrder?.id === orderForAddItem.id) {
                                                    setSelectedOrder(updatedOrder);
                                                }

                                                // Generate added items receipt
                                                try {
                                                    const printResult = await printAddedItemsReceipt(
                                                        orderForAddItem.orderId,
                                                        orderForAddItem.tableNo,
                                                        selectedItems
                                                    );

                                                    if (printResult.success && printResult.receipt) {
                                                        // Show receipt in app
                                                        setCurrentReceipt(printResult.receipt);
                                                        setShowReceipt(true);
                                                    } else {
                                                        Alert.alert('Error', printResult.message || 'Failed to generate receipt');
                                                    }
                                                } catch (error) {
                                                    console.error('Error generating added items receipt:', error);
                                                    Alert.alert('Error', 'Failed to generate receipt');
                                                }
                                            }

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

            {/* Payment Modal */}
            {selectedOrder && (
                <PaymentModal
                    visible={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    orderId={selectedOrder.orderId}
                    amount={selectedOrder.totalAmount}
                    customerName={selectedOrder.customerName}
                    onPaymentSuccess={async (transactionId, method) => {
                        console.log('Payment successful:', { transactionId, method, orderId: selectedOrder.orderId });

                        // Update order to mark as paid/completed
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
                        try {
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
                            console.error('Error generating payment receipt:', error);
                        }
                    }}
                />
            )}

            {/* Receipt Viewer */}
            <ReceiptViewer
                visible={showReceipt}
                onClose={() => setShowReceipt(false)}
                receipt={currentReceipt}
                title="Receipt"
            />
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
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: Colors.dark.textSecondary,
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
    orderHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
        marginBottom: 8,
    },
    customerName: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.dark.textSecondary,
    },
    itemsContainer: {
        marginBottom: 8,
        padding: 8,
        backgroundColor: Colors.dark.secondary,
        borderRadius: 8,
    },
    itemsLabel: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginBottom: 2,
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
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: Colors.dark.primary,
        borderRadius: 6,
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
});
