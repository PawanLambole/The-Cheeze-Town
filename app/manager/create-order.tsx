// Force re-bundle
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Search, Plus } from 'lucide-react-native';
import { printKitchenReceipt } from '../../services/thermalPrinter';
import ReceiptViewer from '../../components/ReceiptViewer';
import { Colors } from '@/constants/Theme';
import { supabase } from '@/services/database';

// Add interface
interface CreateOrderScreenProps {
    redirectPath?: string;
}

function CreateOrderScreen({ redirectPath = '/manager/orders' }: CreateOrderScreenProps) {
    const router = useRouter();

    const [step, setStep] = useState(1); // 1: Select Table, 2: Add Items
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [menuSearch, setMenuSearch] = useState('');
    const [orderItems, setOrderItems] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
    const [showReceipt, setShowReceipt] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState('');
    const [tables, setTables] = useState<any[]>([]);
    const [menuOptions, setMenuOptions] = useState<any[]>([]);

    // Fetch tables from database
    const fetchTables = async () => {
        try {
            const { data, error } = await supabase
                .from('restaurant_tables')
                .select('*')
                .order('table_number');

            if (error) throw error;

            // Transform data to match expected format
            const transformedTables = (data || []).map(table => ({
                id: String(table.id),
                number: table.table_number,
                status: table.status
            }));

            setTables(transformedTables);
        } catch (error) {
            console.error('Error fetching tables:', error);
            Alert.alert('Error', 'Failed to load tables');
        }
    };

    // Fetch menu items from database
    const fetchMenu = async () => {
        try {
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .order('name');

            if (error) throw error;

            // Transform data to match expected format
            const transformedMenu = (data || []).map(item => ({
                id: String(item.id),
                name: item.name,
                category: item.category || 'Uncategorized',
                price: item.price
            }));

            setMenuOptions(transformedMenu);
        } catch (error) {
            console.error('Error fetching menu:', error);
            Alert.alert('Error', 'Failed to load menu');
        }
    };

    // Fetch data on component mount and when screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchTables();
            fetchMenu();
        }, [])
    );

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

    const [tempOrderData, setTempOrderData] = useState<any>(null);

    const handlePreviewOrder = async () => {
        if (orderItems.length === 0) {
            Alert.alert('No Items', 'Please add at least one item to the order');
            return;
        }

        // Generate temporary order details for preview
        const tempOrderId = `ORD${Date.now().toString().slice(-6)}`;

        const orderForPrint = {
            orderId: tempOrderId,
            tableNo: selectedTable ? tables.find(t => t.id === selectedTable)?.number : 'Takeaway',
            items: orderItems,
            totalAmount,
            timestamp: new Date(),
            orderType: selectedTable ? 'dine-in' as const : 'takeaway' as const
        };

        // Generate receipt preview
        // effectively doing what printKitchenReceipt does but without the console logs/printer calls for now
        // We use the same service function but we can also expose the formatter directly if needed
        // For now, let's use the printKitchenReceipt with silent option to get the string
        const printResult = await printKitchenReceipt(orderForPrint, { silent: true });

        if (printResult.receipt) {
            setCurrentReceipt(printResult.receipt);
            setTempOrderData(orderForPrint); // Save data needed for submission
            setShowReceipt(true);
        } else {
            Alert.alert('Error', 'Failed to generate receipt preview');
        }
    };

    const submitOrder = async () => {
        if (!tempOrderData) return;

        try {
            // Create order in database
            // Use the ID from preview or generate new one? ideally match preview
            // But we need to handle potential conflicts if time passed, though unlikely with timestamp ID
            const orderId = tempOrderData.orderId;

            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    order_number: orderId,
                    table_id: selectedTable ? parseInt(selectedTable) : null,
                    status: 'pending',
                    total_amount: totalAmount,
                    order_type: selectedTable ? 'dine-in' : 'takeaway'
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // Add order items to database
            const orderItemsData = orderItems.map(item => ({
                order_id: orderData.id,
                menu_item_name: item.name,
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.price * item.quantity
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItemsData);

            if (itemsError) throw itemsError;

            // Update table status if dine-in
            if (selectedTable) {
                await supabase
                    .from('restaurant_tables')
                    .update({
                        status: 'occupied',
                        current_order_id: orderData.id
                    })
                    .eq('id', parseInt(selectedTable));
            }

            // Success
            setShowReceipt(false);
            Alert.alert('Success', 'Order confirmed and sent to kitchen!');
            router.push(redirectPath as any);

        } catch (error) {
            console.error('Error submitting order:', error);
            Alert.alert('Error', 'Failed to submit order. Please try again.');
        }
    };

    const handleReceiptClose = () => {
        setShowReceipt(false);
        // Navigate to orders after closing receipt
        router.push(redirectPath as any);
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

    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={handleBack}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
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
                                            selectedTable === table.id && styles.tableNumberSelected,
                                            table.status === 'occupied' && { color: Colors.dark.textSecondary }
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
                            <Search size={20} color={Colors.dark.textSecondary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search menu..."
                                placeholderTextColor={Colors.dark.textSecondary}
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

                        <TouchableOpacity style={styles.createButton} onPress={handlePreviewOrder}>
                            <Text style={styles.createButtonText}>Create Order</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Receipt Viewer */}
            <ReceiptViewer
                visible={showReceipt}
                onClose={() => setShowReceipt(false)}
                receipt={currentReceipt}
                title="Preview Kitchen Receipt"
                onConfirm={submitOrder}
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
        color: Colors.dark.text,
    },
    stepSubtitle: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        marginBottom: 16,
    },
    skipButton: {
        backgroundColor: Colors.dark.secondary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    skipButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
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
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    tableOccupied: {
        backgroundColor: Colors.dark.secondary,
        borderColor: Colors.dark.border,
        opacity: 0.6,
    },
    tableSelected: {
        backgroundColor: 'rgba(253, 184, 19, 0.15)',
        borderColor: Colors.dark.primary,
        borderWidth: 2,
    },
    tableNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    tableNumberSelected: {
        color: Colors.dark.primary,
    },
    tableStatus: {
        fontSize: 10,
        color: Colors.dark.textSecondary,
        marginTop: 4,
        textTransform: 'capitalize',
    },
    orderSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        padding: 16,
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: '#10B981',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.secondary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginBottom: 16,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Colors.dark.text,
    },
    menuList: {
        flex: 1,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.dark.card,
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    menuItemName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    menuItemPrice: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginTop: 4,
    },
    addButton: {
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#000000',
        fontWeight: '600',
    },
    cartPreview: {
        marginTop: 16,
        padding: 16,
        backgroundColor: Colors.dark.secondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    cartTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
        marginBottom: 8,
    },
    cartItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
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
        borderRadius: 12,
        backgroundColor: Colors.dark.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    cartQuantityButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.dark.text,
        lineHeight: 18,
    },
    cartItemQuantityText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    cartItemName: {
        fontSize: 14,
        color: Colors.dark.text,
    },
    cartItemPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    createButton: {
        backgroundColor: Colors.dark.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    createButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000000',
    },
});

export default CreateOrderScreen;
