import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, ActivityIndicator, Modal, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, TrendingUp, IndianRupee, ShoppingBag, Clock, Users, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Theme';
import { supabase } from '@/services/database';

interface OrderItem {
    name: string;
    quantity: number;
}

interface RevenueItem {
    id: string;
    orderId: string;
    category: string;
    amount: number;
    time: string;
    createdAt: string;
    items: number;
    orderItems: OrderItem[];
}

interface CategoryStats {
    name: string;
    amount: number;
    percentage: number;
    color: string;
    orders: number;
}

export default function RevenueScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [hourlyData, setHourlyData] = useState<Array<{ hour: string; amount: number }>>([]);
    const [selectedOrder, setSelectedOrder] = useState<RevenueItem | null>(null);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const getHourFromDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.getHours();
    };

    const fetchRevenueData = async () => {
        if (!loading && !refreshing) setRefreshing(true);
        try {
            // Get today's range in local time, then convert to UTC ISO strings for Supabase.
            const now = new Date();
            const startOfDayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            const startOfTomorrowLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
            const startOfDay = startOfDayLocal.toISOString();
            const startOfTomorrow = startOfTomorrowLocal.toISOString();

            // 1. Fetch Payments (Completed)
            const { data: paymentsData, error: paymentsError } = await supabase
                .from('payments')
                .select(`
                    id,
                    amount,
                    payment_date,
                    payment_method,
                    transaction_id,
                    order_id,
                    orders (
                       id,
                       order_number,
                       total_amount,
                       created_at,
                       order_items (
                           menu_item_name,
                           quantity
                       )
                    )
                `)
                .eq('status', 'completed')
                .gte('payment_date', startOfDay)
                .lt('payment_date', startOfTomorrow)
                .order('payment_date', { ascending: false });

            if (paymentsError) throw paymentsError;

            // 2. Fetch Orders (Completed/Paid) for the same period
            // This covers orders that might not have a payment record (e.g. legacy or glitch)
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select(`
                    id,
                    order_number,
                    total_amount,
                    status,
                    created_at,
                    updated_at,
                    completed_time,
                    order_items (
                        menu_item_name,
                        quantity
                    )
                `)
                .in('status', ['paid', 'completed'])
                .gte('created_at', startOfDay) // Using created_at or completed_time? created_at is safer for "Today's Revenue" if we mean "Orders from Today"
                .lt('created_at', startOfTomorrow);

            if (ordersError) throw ordersError;

            // 3. Merge and Deduplicate
            // Strategy: Use Payment records as primary. Add Orders ONLY if they don't have a corresponding payment record in the fetched payments.

            const revenueMap = new Map<string, RevenueItem>();

            // Process Payments first
            (paymentsData || []).forEach((payment: any) => {
                const order = payment.orders?.[0] || payment.orders; // Handle array or single object depending on relationship (usually single for order_id FK)
                // Note: In Supabase join, if it's one-to-many from payments->orders (unlikely, usually payments.order_id -> orders.id), it returns objects differently.
                // Based on previous code: `payment.orders` seems to be the joined object.
                // Let's verify the shape from previous code: `payment.orders` was used.
                // Warning: `orders` in select is plural but it references `order_id` so it might be a single object or array depending on Supabase client version/setup. 
                // The previous code operated on `payment.orders` directly, but then did `const order = payment.orders?.[0];` which implies it might be returned as an array?
                // Actually previous code: `const order = payment.orders?.[0];` 
                // Let's stick to safe access.

                const orderObj = Array.isArray(payment.orders) ? payment.orders[0] : payment.orders;

                const firstItem = orderObj?.order_items?.[0]?.menu_item_name || 'Other';
                const category = firstItem.includes('Pizza') ? 'pizza' :
                    firstItem.includes('Burger') ? 'burgers' :
                        firstItem.includes('Drink') || firstItem.includes('Beverage') ? 'beverages' :
                            firstItem.includes('Dessert') ? 'desserts' : 'mainCourse';

                const orderItems = orderObj?.order_items?.map((item: any) => ({
                    name: item.menu_item_name,
                    quantity: item.quantity
                })) || [];

                const item: RevenueItem = {
                    id: String(payment.id), // Payment ID
                    orderId: orderObj?.order_number || String(payment.order_id),
                    category: category,
                    amount: Number(payment.amount),
                    time: formatTime(payment.payment_date || payment.created_at || new Date().toISOString()),
                    createdAt: payment.payment_date || orderObj?.created_at || new Date().toISOString(),
                    items: orderObj?.order_items?.length || 0,
                    orderItems: orderItems
                };

                // Use order ID as key to prevent duplication if we check orders next, 
                // BUT one order could have multiple partial payments (rare here).
                // Existing logic assumes one payment per order roughly? 
                // Let's use a unique key. If we want to check duplication by order, we key by Order ID.
                // If an order has a payment, we used the payment.
                if (payment.order_id) {
                    revenueMap.set(String(payment.order_id), item);
                } else {
                    // Fallback if no order_id (standalone payment?), unlikely but keep it.
                    revenueMap.set(`payment-${payment.id}`, item);
                }
            });

            // Process Orders (only if not already in revenueMap via payment)
            (ordersData || []).forEach((order: any) => {
                if (!revenueMap.has(String(order.id))) {
                    // This order has NO payment record in our fetch, so add it.
                    const firstItem = order.order_items?.[0]?.menu_item_name || 'Other';
                    const category = firstItem.includes('Pizza') ? 'pizza' :
                        firstItem.includes('Burger') ? 'burgers' :
                            firstItem.includes('Drink') || firstItem.includes('Beverage') ? 'beverages' :
                                firstItem.includes('Dessert') ? 'desserts' : 'mainCourse';

                    const orderItems = order.order_items?.map((item: any) => ({
                        name: item.menu_item_name,
                        quantity: item.quantity
                    })) || [];

                    // Use completed_time or created_at for time
                    const timeRef = order.completed_time || order.updated_at || order.created_at;

                    const item: RevenueItem = {
                        id: `ord-${order.id}`, // specific prefix to distinguish
                        orderId: order.order_number,
                        category: category,
                        amount: Number(order.total_amount),
                        time: formatTime(timeRef),
                        createdAt: timeRef,
                        items: order.order_items?.length || 0,
                        orderItems: orderItems
                    };

                    revenueMap.set(String(order.id), item);
                }
            });

            const items = Array.from(revenueMap.values()).sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setRevenueItems(items);

            // Calculate hourly data
            const hourlyMap: Record<number, number> = {};
            items.forEach(item => {
                const hour = getHourFromDate(item.createdAt);
                hourlyMap[hour] = (hourlyMap[hour] || 0) + item.amount;
            });

            // Create hourly data array for the chart
            const hours = [];
            const startHour = 9;
            const endHour = 21; // 9 PM

            for (let i = startHour; i <= endHour; i++) {
                const hour12 = i > 12 ? i - 12 : i;
                const ampm = i >= 12 ? 'PM' : 'AM';
                hours.push({
                    hour: `${hour12}${ampm}`,
                    amount: hourlyMap[i] || 0
                });
            }

            setHourlyData(hours);

        } catch (error) {
            console.error('Error fetching revenue data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchRevenueData();
        }, [])
    );

    const totalRevenue = revenueItems.reduce((sum, item) => sum + item.amount, 0);
    const totalOrders = revenueItems.length;

    // Calculate category breakdown
    const categoryTotals: Record<string, { amount: number; orders: number }> = {};
    revenueItems.forEach(item => {
        if (!categoryTotals[item.category]) {
            categoryTotals[item.category] = { amount: 0, orders: 0 };
        }
        categoryTotals[item.category].amount += item.amount;
        categoryTotals[item.category].orders += 1;
    });

    const categoryStats: CategoryStats[] = Object.entries(categoryTotals).map(([category, data], index) => {
        const percentage = totalRevenue > 0 ? (data.amount / totalRevenue) * 100 : 0;
        const colors = [Colors.dark.primary, '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];

        return {
            name: category,
            amount: data.amount,
            orders: data.orders,
            percentage,
            color: colors[index % colors.length]
        };
    }).sort((a, b) => b.amount - a.amount);

    const maxHourly = Math.max(...hourlyData.map(d => d.amount), 1);

    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('manager.revenue.title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchRevenueData}
                        tintColor={Colors.dark.primary}
                        colors={[Colors.dark.primary]}
                    />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.dark.primary} />
                        <Text style={styles.loadingText}>{t('manager.revenue.loading')}</Text>
                    </View>
                ) : (
                    <>
                        {/* Today's Total */}
                        <View style={styles.totalCard}>
                            <View style={styles.totalIconContainer}>
                                <TrendingUp size={32} color={Colors.dark.primary} />
                            </View>
                            <View>
                                <Text style={styles.totalLabel}>{t('manager.revenue.todayRevenue')}</Text>
                                <Text style={styles.totalAmount}>₹{totalRevenue.toLocaleString()}</Text>
                                <Text style={styles.totalOrders}>{totalOrders} {t('manager.revenue.completedOrders')}</Text>
                            </View>
                        </View>

                        {/* Quick Stats */}
                        <View style={styles.quickStats}>
                            <View style={styles.quickStatCard}>
                                <ShoppingBag size={20} color={Colors.dark.primary} />
                                <Text style={styles.quickStatValue}>{totalOrders}</Text>
                                <Text style={styles.quickStatLabel}>{t('manager.revenue.totalOrders')}</Text>
                            </View>
                            <View style={styles.quickStatCard}>
                                <IndianRupee size={20} color="#3B82F6" />
                                <Text style={styles.quickStatValue}>₹{totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0}</Text>
                                <Text style={styles.quickStatLabel}>{t('manager.revenue.avgOrder')}</Text>
                            </View>
                            <View style={styles.quickStatCard}>
                                <Users size={20} color="#10B981" />
                                <Text style={styles.quickStatValue}>{totalOrders}</Text>
                                <Text style={styles.quickStatLabel}>{t('manager.revenue.customers')}</Text>
                            </View>
                        </View>

                        {/* Category Breakdown */}
                        {categoryStats.length > 0 && (
                            <View style={styles.chartCard}>
                                <Text style={styles.chartTitle}>{t('manager.revenue.byCategory')}</Text>
                                <View style={styles.categoriesContainer}>
                                    {categoryStats.map((cat) => (
                                        <View key={cat.name} style={styles.categoryItem}>
                                            <View style={styles.categoryHeader}>
                                                <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                                                <View style={styles.categoryInfo}>
                                                    <Text style={styles.categoryName}>{t(`manager.categories.${cat.name}`)}</Text>
                                                    <Text style={styles.categoryOrders}>{cat.orders} orders</Text>
                                                </View>
                                                <View style={styles.categoryRight}>
                                                    <Text style={styles.categoryAmount}>₹{cat.amount.toLocaleString()}</Text>
                                                    <Text style={styles.categoryPercentage}>{cat.percentage.toFixed(0)}%</Text>
                                                </View>
                                            </View>
                                            <View style={styles.progressBarBg}>
                                                <View style={[styles.progressBar, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Hourly Trend */}
                        {hourlyData.length > 0 && (
                            <View style={styles.chartCard}>
                                <Text style={styles.chartTitle}>{t('manager.revenue.peakHours')}</Text>
                                <View style={styles.barChartContainer}>
                                    {hourlyData.map((hour, index) => (
                                        <View key={hour.hour} style={styles.barColumn}>
                                            <View style={styles.barWrapper}>
                                                <View
                                                    style={[
                                                        styles.bar,
                                                        {
                                                            height: hour.amount > 0 ? `${(hour.amount / maxHourly) * 100}%` : '5%',
                                                            backgroundColor: hour.amount > 0 ? Colors.dark.primary : Colors.dark.border
                                                        }
                                                    ]}
                                                />
                                            </View>
                                            <Text style={styles.barLabel}>{hour.hour}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Today's Orders */}
                        {revenueItems.length > 0 && (
                            <>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>{t('manager.revenue.todayOrders')}</Text>
                                </View>

                                {revenueItems.map(item => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.orderCard}
                                        onPress={() => setSelectedOrder(item)}
                                    >
                                        <View style={styles.orderIcon}>
                                            <ShoppingBag size={20} color={Colors.dark.primary} />
                                        </View>
                                        <View style={styles.orderInfo}>
                                            <Text style={styles.orderName}>#{item.orderId}</Text>
                                            <View style={styles.orderMeta}>
                                                <Text style={styles.orderCategory}>{t(`manager.categories.${item.category}`)}</Text>
                                                <Text style={styles.orderDot}>•</Text>
                                                <Text style={styles.orderTime}>{item.time}</Text>
                                                <Text style={styles.orderDot}>•</Text>
                                                <Text style={styles.orderItems}>{item.items} {t('common.items').toLowerCase()}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.orderAmount}>₹{item.amount}</Text>
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}

                        {revenueItems.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <ShoppingBag size={64} color={Colors.dark.textSecondary} />
                                <Text style={styles.emptyText}>{t('manager.revenue.empty')}</Text>
                                <Text style={styles.emptySubtext}>{t('manager.revenue.emptySubtext')}</Text>
                            </View>
                        )}

                        <View style={{ height: 40 }} />
                    </>
                )}
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={!!selectedOrder}
                onRequestClose={() => setSelectedOrder(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('manager.revenue.orderDetails')}</Text>
                            <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                                <X size={24} color={Colors.dark.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedOrder && (
                            <ScrollView style={styles.modalBody}>
                                <View style={styles.modalOrderHeader}>
                                    <Text style={styles.modalOrderId}>Order #{selectedOrder.orderId}</Text>
                                    <Text style={styles.modalOrderTime}>{selectedOrder.time}</Text>
                                </View>

                                <View style={styles.divider} />

                                <Text style={styles.itemsLabel}>{t('common.items')}</Text>
                                {selectedOrder.orderItems.map((item, index) => (
                                    <View key={index} style={styles.itemRow}>
                                        <View style={styles.itemInfo}>
                                            <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                                            <Text style={styles.itemName}>{item.name}</Text>
                                        </View>
                                    </View>
                                ))}

                                <View style={styles.divider} />

                                <View style={styles.totalRow}>
                                    <Text style={styles.totalRowLabel}>{t('common.total')}</Text>
                                    <Text style={styles.totalRowValue}>₹{selectedOrder.amount}</Text>
                                </View>
                            </ScrollView>
                        )}

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setSelectedOrder(null)}
                            >
                                <Text style={styles.closeButtonText}>{t('manager.revenue.close')}</Text>
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
        paddingHorizontal: 20,
    },
    totalCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(253, 184, 19, 0.1)',
        padding: 20,
        borderRadius: 16,
        marginTop: 20,
        gap: 16,
        borderWidth: 1,
        borderColor: 'rgba(253, 184, 19, 0.3)',
    },
    totalIconContainer: {
        width: 64,
        height: 64,
        backgroundColor: Colors.dark.card,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    totalLabel: {
        fontSize: 14,
        color: Colors.dark.primary,
        marginBottom: 4,
    },
    totalAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.dark.primary,
    },
    totalOrders: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginTop: 4,
    },
    quickStats: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    quickStatCard: {
        flex: 1,
        backgroundColor: Colors.dark.card,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
        gap: 4,
    },
    quickStatValue: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
        marginTop: 8,
    },
    quickStatLabel: {
        fontSize: 11,
        color: Colors.dark.textSecondary,
    },
    chartCard: {
        backgroundColor: Colors.dark.card,
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.dark.text,
        marginBottom: 16,
    },
    categoriesContainer: {
        gap: 16,
    },
    categoryItem: {
        gap: 8,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    categoryDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    categoryInfo: {
        flex: 1,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 2,
    },
    categoryOrders: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    categoryRight: {
        alignItems: 'flex-end',
    },
    categoryAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    categoryPercentage: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
        marginTop: 2,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: Colors.dark.secondary,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    barChartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 180,
        paddingTop: 20,
    },
    barColumn: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    barWrapper: {
        width: '80%',
        height: 120,
        justifyContent: 'flex-end',
    },
    bar: {
        width: '100%',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        minHeight: 5,
    },
    barLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
    },
    sectionHeader: {
        marginTop: 24,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    orderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        gap: 12,
    },
    orderIcon: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(253, 184, 19, 0.15)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderInfo: {
        flex: 1,
    },
    orderName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    orderMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    orderCategory: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    orderDot: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    orderTime: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    orderItems: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    orderAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.dark.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    loadingText: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        marginTop: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
        gap: 12,
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
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.dark.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    modalBody: {
        padding: 20,
    },
    modalOrderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalOrderId: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    modalOrderTime: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    itemsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
        marginBottom: 12,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    itemQuantity: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.dark.primary,
        width: 30,
    },
    itemName: {
        fontSize: 16,
        color: Colors.dark.text,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.dark.border,
        marginVertical: 16,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalRowLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    totalRowValue: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.dark.primary,
    },
    modalFooter: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    closeButton: {
        backgroundColor: Colors.dark.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
});
