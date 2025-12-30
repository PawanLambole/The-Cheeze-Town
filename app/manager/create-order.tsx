// Force re-bundle
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Search, Plus } from 'lucide-react-native';
import { printKitchenReceipt } from '../../services/thermalPrinter';
import ReceiptViewer from '../../components/ReceiptViewer';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Theme';
import { supabase } from '@/services/database';

// Add interface
interface CreateOrderScreenProps {
    redirectPath?: string;
}

function CreateOrderScreen({ redirectPath = '/manager/orders' }: CreateOrderScreenProps) {
    const { t } = useTranslation();
    const router = useRouter();

    const [step, setStep] = useState(1); // 1: Select Table, 2: Add Items
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [menuSearch, setMenuSearch] = useState('');
    const [orderItems, setOrderItems] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
    const [showReceipt, setShowReceipt] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState('');
    const [tables, setTables] = useState<any[]>([]);
    const [menuOptions, setMenuOptions] = useState<any[]>([]);
    const [releaseModalVisible, setReleaseModalVisible] = useState(false);
    const [selectedTableForRelease, setSelectedTableForRelease] = useState<string | null>(null);

    // Fetch tables from database
    // Fetch tables from database
    const fetchTables = async () => {
        try {
            // 1. Fetch tables
            const { data: tablesData, error: tablesError } = await supabase
                .from('restaurant_tables')
                .select('*')
                .order('table_number');

            if (tablesError) throw tablesError;

            // 2. Fetch ALL active orders that have a table assigned
            const { data: activeOrders, error: ordersError } = await supabase
                .from('orders')
                .select('id, order_number, created_at, table_id')
                .not('status', 'in', '("cancelled","completed")')
                .not('table_id', 'is', null);

            if (ordersError) throw ordersError;

            // Create map of TableID -> Order
            const tableOrderMap = new Map();
            if (activeOrders) {
                activeOrders.forEach(o => {
                    const existing = tableOrderMap.get(o.table_id);
                    const currentCreatedAt = o.created_at ? new Date(o.created_at) : new Date(0);
                    const existingCreatedAt = existing?.created_at ? new Date(existing.created_at) : new Date(0);

                    if (!existing || currentCreatedAt > existingCreatedAt) {
                        tableOrderMap.set(o.table_id, o);
                    }
                });
            }

            // Transform data
            const transformedTables = (tablesData || []).map(table => {
                const activeOrder = tableOrderMap.get(table.id);

                return {
                    id: String(table.id),
                    number: table.table_number,
                    status: table.status,
                    currentOrder: activeOrder ? {
                        id: activeOrder.id,
                        number: activeOrder.order_number,
                        createdAt: activeOrder.created_at
                    } : null
                };
            });

            setTables(transformedTables);
        } catch (error) {
            console.error('Error fetching tables:', error);
            Alert.alert(t('common.error'), t('manager.createOrder.errors.loadTables'));
        }
    };

    const handleMakeAvailable = (tableId: string) => {
        setSelectedTableForRelease(tableId);
        setReleaseModalVisible(true);
    };

    const confirmRelease = async () => {
        if (!selectedTableForRelease) return;

        try {
            const { error } = await supabase
                .from('restaurant_tables')
                .update({ status: 'available', current_order_id: null })
                .eq('id', parseInt(selectedTableForRelease));

            if (error) throw error;
            fetchTables();
            setReleaseModalVisible(false);
            setSelectedTableForRelease(null);
        } catch (error) {
            console.error('Error freeing table:', error);
            Alert.alert(t('common.error'), 'Failed to update table status');
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
            Alert.alert(t('common.error'), t('manager.createOrder.errors.loadMenu'));
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
            Alert.alert(t('manager.createOrder.errors.noItems'), t('manager.createOrder.errors.addOneItem'));
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
            Alert.alert(t('common.error'), t('manager.createOrder.errors.genReceipt'));
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
            Alert.alert(t('common.success'), t('manager.createOrder.success'));
            router.push(redirectPath as any);

        } catch (error) {
            console.error('Error submitting order:', error);
            Alert.alert(t('common.error'), t('manager.createOrder.errors.submit'));
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

    const getTimeAgo = (dateString: string) => {
        if (!dateString) return '';
        const now = new Date();
        const past = new Date(dateString);
        const diffMs = now.getTime() - past.getTime();
        const diffMins = Math.round(diffMs / 60000);
        if (diffMins < 60) return `${diffMins}m`;
        const diffHours = Math.round(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h`;
        return `${Math.round(diffHours / 24)}d`;
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={handleBack}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('manager.createOrder.title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                {step === 1 && (
                    <>
                        <View style={styles.stepHeader}>
                            <Text style={styles.stepTitle}>{t('manager.createOrder.selectTable')}</Text>
                            <TouchableOpacity
                                style={styles.skipButton}
                                onPress={() => {
                                    setSelectedTable(null);
                                    setStep(2);
                                }}
                            >
                                <Text style={styles.skipButtonText}>{t('manager.createOrder.skip')}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'column', marginBottom: 16 }}>
                            <Text style={styles.stepSubtitle}>{t('manager.createOrder.skipSubtitle')}</Text>
                            <Text style={{ fontSize: 11, color: Colors.dark.textSecondary, opacity: 0.7 }}>
                                {t('manager.createOrder.longPressHint')}
                            </Text>
                        </View>
                        <ScrollView style={styles.tablesGrid} contentContainerStyle={{ paddingBottom: 20 }}>
                            <View style={styles.tablesRow}>
                                {tables.map(table => (
                                    <TouchableOpacity
                                        key={table.id}
                                        style={[
                                            styles.tableCard,
                                            table.status === 'occupied' && styles.tableOccupied,
                                            selectedTable === table.id && styles.tableSelected
                                        ]}
                                        onPress={() => table.status !== 'occupied' && handleTableSelect(table.id)}
                                        onLongPress={() => table.status === 'occupied' && handleMakeAvailable(table.id)}
                                        delayLongPress={500}
                                        activeOpacity={0.7}
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
                                        {table.status === 'occupied' && table.currentOrder && (
                                            <View style={{ alignItems: 'center', marginTop: 4 }}>
                                                <Text style={{ fontSize: 10, color: Colors.dark.textSecondary, fontWeight: '600' }}>#{table.currentOrder.number}</Text>
                                                <Text style={{ fontSize: 10, color: Colors.dark.textSecondary }}>{getTimeAgo(table.currentOrder.createdAt)}</Text>
                                            </View>
                                        )}
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
                                {selectedTable ? `${t('manager.createOrder.table')} ${tables.find(t => t.id === selectedTable)?.number}` : t('manager.createOrder.takeawayDelivery')}
                            </Text>
                            <Text style={styles.totalAmount}>₹{totalAmount}</Text>
                        </View>

                        <View style={styles.searchContainer}>
                            <Search size={20} color={Colors.dark.textSecondary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t('manager.createOrder.searchPlaceholder')}
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
                                        <Text style={styles.addButtonText}>{t('manager.createOrder.add')}</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>

                        {orderItems.length > 0 && (
                            <View style={styles.cartPreview}>
                                <Text style={styles.cartTitle}>{t('common.items')} ({orderItems.length})</Text>
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
                            <Text style={styles.createButtonText}>{t('manager.createOrder.createOrder')}</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Receipt Viewer */}
            <ReceiptViewer
                visible={showReceipt}
                onClose={() => setShowReceipt(false)}
                receipt={currentReceipt}
                title={t('manager.createOrder.previewReceipt')}
                onConfirm={submitOrder}
            />

            {/* Custom Release Confirmation Modal */}
            <Modal visible={releaseModalVisible} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: Colors.dark.card, borderRadius: 16, padding: 20, width: '90%', maxWidth: 400, borderWidth: 1, borderColor: Colors.dark.border }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.dark.text, marginBottom: 8, textAlign: 'center' }}>
                            {t('manager.createOrder.makeAvailableTitle')}
                        </Text>
                        <Text style={{ fontSize: 14, color: Colors.dark.textSecondary, marginBottom: 24, textAlign: 'center', lineHeight: 20 }}>
                            {t('manager.createOrder.makeAvailableDesc')}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.dark.secondary, alignItems: 'center', borderWidth: 1, borderColor: Colors.dark.border }}
                                onPress={() => setReleaseModalVisible(false)}
                            >
                                <Text style={{ color: Colors.dark.text, fontWeight: '600' }}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center' }}
                                onPress={confirmRelease}
                            >
                                <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{t('manager.createOrder.release')}</Text>
                            </TouchableOpacity>
                        </View>
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
