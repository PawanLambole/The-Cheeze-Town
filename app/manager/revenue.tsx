import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, TrendingUp, IndianRupee, ShoppingBag, Clock, Users } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { supabase } from '@/services/database';

interface RevenueItem {
    id: string;
    orderId: string;
    category: string;
    amount: number;
    time: string;
    items: number;
}

interface CategoryStats {
    name: string;
    amount: number;
    percentage: number;
    color: string;
    orders: number;
}

export default function RevenueScreen() {
    const router = useRouter();
    const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [hourlyData, setHourlyData] = useState<Array<{ hour: string; amount: number }>>([]);

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
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString();

            // Fetch today's completed orders with their items
            const { data: ordersData, error } = await supabase
                .from('orders')
                .select(`
                    id,
                    order_number,
                    total_amount,
                    created_at,
                    order_items (
                        menu_item_name,
                        quantity
                    )
                `)
                .gte('created_at', todayISO)
                .in('status', ['completed', 'served'])
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data for revenue items
            const items: RevenueItem[] = (ordersData || []).map((order: any) => {
                // Get the first item's category or use 'General' as fallback
                const firstItem = order.order_items?.[0]?.menu_item_name || 'General';
                const category = firstItem.includes('Pizza') ? 'Pizza' :
                    firstItem.includes('Burger') ? 'Burgers' :
                        firstItem.includes('Drink') || firstItem.includes('Beverage') ? 'Beverages' :
                            firstItem.includes('Dessert') ? 'Desserts' : 'Main Course';

                return {
                    id: String(order.id),
                    orderId: order.order_number,
                    category: category,
                    amount: Number(order.total_amount),
                    time: formatTime(order.created_at),
                    items: order.order_items?.length || 0
                };
            });

            setRevenueItems(items);

            // Calculate hourly data
            const hourlyMap: Record<number, number> = {};
            items.forEach(item => {
                const hour = getHourFromDate(item.time);
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
                <Text style={styles.headerTitle}>Revenue Analytics</Text>
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
                        <Text style={styles.loadingText}>Loading revenue data...</Text>
                    </View>
                ) : (
                    <>
                        {/* Today's Total */}
                        <View style={styles.totalCard}>
                            <View style={styles.totalIconContainer}>
                                <TrendingUp size={32} color={Colors.dark.primary} />
                            </View>
                            <View>
                                <Text style={styles.totalLabel}>Today's Total Revenue</Text>
                                <Text style={styles.totalAmount}>₹{totalRevenue.toLocaleString()}</Text>
                                <Text style={styles.totalOrders}>{totalOrders} orders</Text>
                            </View>
                        </View>

                        {/* Quick Stats */}
                        <View style={styles.quickStats}>
                            <View style={styles.quickStatCard}>
                                <ShoppingBag size={20} color={Colors.dark.primary} />
                                <Text style={styles.quickStatValue}>{totalOrders}</Text>
                                <Text style={styles.quickStatLabel}>Total Orders</Text>
                            </View>
                            <View style={styles.quickStatCard}>
                                <IndianRupee size={20} color="#3B82F6" />
                                <Text style={styles.quickStatValue}>₹{totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0}</Text>
                                <Text style={styles.quickStatLabel}>Avg Order</Text>
                            </View>
                            <View style={styles.quickStatCard}>
                                <Users size={20} color="#10B981" />
                                <Text style={styles.quickStatValue}>{totalOrders}</Text>
                                <Text style={styles.quickStatLabel}>Customers</Text>
                            </View>
                        </View>

                        {/* Category Breakdown */}
                        {categoryStats.length > 0 && (
                            <View style={styles.chartCard}>
                                <Text style={styles.chartTitle}>Revenue by Category</Text>
                                <View style={styles.categoriesContainer}>
                                    {categoryStats.map((cat) => (
                                        <View key={cat.name} style={styles.categoryItem}>
                                            <View style={styles.categoryHeader}>
                                                <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                                                <View style={styles.categoryInfo}>
                                                    <Text style={styles.categoryName}>{cat.name}</Text>
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
                                <Text style={styles.chartTitle}>Hourly Revenue Trend</Text>
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

                        {/* Recent Orders */}
                        {revenueItems.length > 0 && (
                            <>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Today's Orders</Text>
                                </View>

                                {revenueItems.map(item => (
                                    <View key={item.id} style={styles.orderCard}>
                                        <View style={styles.orderIcon}>
                                            <ShoppingBag size={20} color={Colors.dark.primary} />
                                        </View>
                                        <View style={styles.orderInfo}>
                                            <Text style={styles.orderName}>#{item.orderId}</Text>
                                            <View style={styles.orderMeta}>
                                                <Text style={styles.orderCategory}>{item.category}</Text>
                                                <Text style={styles.orderDot}>•</Text>
                                                <Text style={styles.orderTime}>{item.time}</Text>
                                                <Text style={styles.orderDot}>•</Text>
                                                <Text style={styles.orderItems}>{item.items} items</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.orderAmount}>₹{item.amount}</Text>
                                    </View>
                                ))}
                            </>
                        )}

                        {revenueItems.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <ShoppingBag size={64} color={Colors.dark.textSecondary} />
                                <Text style={styles.emptyText}>No revenue data for today</Text>
                                <Text style={styles.emptySubtext}>Complete some orders to see revenue analytics</Text>
                            </View>
                        )}

                        <View style={{ height: 40 }} />
                    </>
                )}
            </ScrollView>
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
});
