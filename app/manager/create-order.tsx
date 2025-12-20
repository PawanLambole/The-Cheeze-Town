// Force re-bundle
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Plus } from 'lucide-react-native';
import { printKitchenReceipt } from '../../services/thermalPrinter';
import ReceiptViewer from '../../components/ReceiptViewer';

function CreateOrderScreen() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Select Table, 2: Add Items
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [menuSearch, setMenuSearch] = useState('');
    const [orderItems, setOrderItems] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
    const [showReceipt, setShowReceipt] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState('');

    // Dummy data
    const tables = Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1), number: i + 1, status: i % 3 === 0 ? 'occupied' : 'available' }));
    const menuOptions = [
        { id: 'm1', name: 'Cheese Burger', category: 'Main Course', price: 250 },
        { id: 'm2', name: 'French Fries', category: 'Starters', price: 150 },
        { id: 'm3', name: 'Cappuccino', category: 'Beverages', price: 180 },
        { id: 'm4', name: 'Chocolate Cake', category: 'Desserts', price: 220 },
        { id: 'm5', name: 'Caesar Salad', category: 'Starters', price: 200 },
    ];

    const filteredMenuOptions = menuOptions.filter(opt =>
        opt.name.toLowerCase().includes(menuSearch.toLowerCase())
    );

    const handleTableSelect = (tableId: string) => {
        setSelectedTable(tableId);
        setStep(2);
    };

    const addItem = (item: typeof menuOptions[0]) => {
        setOrderItems(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleCreateOrder = async () => {
        if (orderItems.length === 0) {
            Alert.alert('No Items', 'Please add at least one item to the order');
            return;
        }

        // Generate order ID
        const orderId = `ORD${Date.now().toString().slice(-6)}`;

        // Prepare order for printing
        const orderForPrint = {
            orderId,
            tableNo: selectedTable ? tables.find(t => t.id === selectedTable)?.number : 'Takeaway',
            items: orderItems,
            totalAmount,
            timestamp: new Date(),
            orderType: selectedTable ? 'dine-in' as const : 'takeaway' as const
        };

        try {
            // Generate kitchen receipt
            const printResult = await printKitchenReceipt(orderForPrint);

            if (printResult.success && printResult.receipt) {
                // Show receipt in app
                setCurrentReceipt(printResult.receipt);
                setShowReceipt(true);
            } else {
                Alert.alert('Error', printResult.message || 'Failed to generate receipt');
            }
        } catch (error) {
            console.error('Error creating order:', error);
            Alert.alert('Error', 'Failed to create order. Please try again.');
        }
    };

    const handleReceiptClose = () => {
        setShowReceipt(false);
        // Navigate to orders after closing receipt
        router.push('/manager/orders');
    };

    const handleBack = () => {
        if (step === 2) {
            // If on step 2, go back to step 1 (table selection)
            setStep(1);
            setOrderItems([]);
            setMenuSearch('');
        } else {
            // If on step 1, go back to previous screen
            router.back();
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack}>
                    <ArrowLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Order</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                {step === 1 && (
                    <>
                        <View style={styles.stepHeader}>
                            <Text style={styles.stepTitle}>Select Table</Text>
                            <TouchableOpacity
                                style={styles.skipButton}
                                onPress={() => {
                                    setSelectedTable(null);
                                    setStep(2);
                                }}
                            >
                                <Text style={styles.skipButtonText}>Skip</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.stepSubtitle}>Or skip to create a takeaway/delivery order</Text>
                        <ScrollView style={styles.tablesGrid}>
                            <View style={styles.tablesRow}>
                                {tables.map(table => (
                                    <TouchableOpacity
                                        key={table.id}
                                        style={[
                                            styles.tableCard,
                                            table.status === 'occupied' && styles.tableOccupied,
                                            selectedTable === table.id && styles.tableSelected
                                        ]}
                                        onPress={() => handleTableSelect(table.id)}
                                        disabled={table.status === 'occupied'}
                                    >
                                        <Text style={[
                                            styles.tableNumber,
                                            selectedTable === table.id && styles.tableNumberSelected
                                        ]}>
                                            {table.number}
                                        </Text>
                                        <Text style={styles.tableStatus}>
                                            {table.status}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </>
                )}

                {step === 2 && (
                    <>
                        <View style={styles.orderSummary}>
                            <Text style={styles.summaryTitle}>
                                {selectedTable ? `Table ${tables.find(t => t.id === selectedTable)?.number}` : 'Takeaway/Delivery'}
                            </Text>
                            <Text style={styles.totalAmount}>₹{totalAmount}</Text>
                        </View>

                        <View style={styles.searchContainer}>
                            <Search size={20} color="#6B7280" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search menu..."
                                value={menuSearch}
                                onChangeText={setMenuSearch}
                            />
                        </View>

                        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
                            {filteredMenuOptions.map(item => (
                                <View key={item.id} style={styles.menuItem}>
                                    <View>
                                        <Text style={styles.menuItemName}>{item.name}</Text>
                                        <Text style={styles.menuItemPrice}>₹{item.price}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.addButton} onPress={() => addItem(item)}>
                                        <Text style={styles.addButtonText}>Add</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>

                        {orderItems.length > 0 && (
                            <View style={styles.cartPreview}>
                                <Text style={styles.cartTitle}>Items ({orderItems.length})</Text>
                                <ScrollView style={{ maxHeight: 100 }}>
                                    {orderItems.map(item => (
                                        <View key={item.id} style={styles.cartItem}>
                                            <View style={styles.cartItemLeft}>
                                                <TouchableOpacity
                                                    style={styles.cartQuantityButton}
                                                    onPress={() => {
                                                        setOrderItems(prev => {
                                                            const updated = prev.map(i =>
                                                                i.id === item.id && i.quantity > 1
                                                                    ? { ...i, quantity: i.quantity - 1 }
                                                                    : i
                                                            );
                                                            // Remove item if quantity is 1 (will become 0)
                                                            if (item.quantity === 1) {
                                                                return prev.filter(i => i.id !== item.id);
                                                            }
                                                            return updated;
                                                        });
                                                    }}
                                                >
                                                    <Text style={styles.cartQuantityButtonText}>-</Text>
                                                </TouchableOpacity>
                                                <Text style={styles.cartItemQuantityText}>{item.quantity}x</Text>
                                                <Text style={styles.cartItemName}>{item.name}</Text>
                                            </View>
                                            <Text style={styles.cartItemPrice}>₹{item.price * item.quantity}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        <TouchableOpacity style={styles.createButton} onPress={handleCreateOrder}>
                            <Text style={styles.createButtonText}>Create Order</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Receipt Viewer */}
            <ReceiptViewer
                visible={showReceipt}
                onClose={handleReceiptClose}
                receipt={currentReceipt}
                title="Kitchen Order Receipt"
            />
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
        padding: 20,
    },
    stepHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    stepSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 16,
    },
    skipButton: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    skipButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    tablesGrid: {
        flex: 1,
    },
    tablesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    tableCard: {
        width: '30%',
        aspectRatio: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    tableOccupied: {
        backgroundColor: '#FEE2E2',
        borderColor: '#FCA5A5',
    },
    tableSelected: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FDB813',
        borderWidth: 2,
    },
    tableNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
    },
    tableNumberSelected: {
        color: '#FDB813',
    },
    tableStatus: {
        fontSize: 10,
        color: '#6B7280',
        marginTop: 4,
        textTransform: 'capitalize',
    },
    orderSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: '#16A34A',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
    },
    menuList: {
        flex: 1,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    menuItemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    menuItemPrice: {
        fontSize: 14,
        color: '#6B7280',
    },
    addButton: {
        backgroundColor: '#FDB813',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    cartPreview: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    cartTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
    },
    cartItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    cartItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    cartQuantityButton: {
        width: 24,
        height: 24,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#DC2626',
    },
    cartQuantityButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    cartItemQuantityText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1F2937',
    },
    cartItemName: {
        fontSize: 14,
        color: '#1F2937',
    },
    cartItemPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    createButton: {
        backgroundColor: '#FDB813',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    createButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default CreateOrderScreen;
