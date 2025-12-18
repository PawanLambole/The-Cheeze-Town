import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, DollarSign, ShoppingBag, Clock, Users } from 'lucide-react-native';

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

    // Mock revenue data
    const revenueItems: RevenueItem[] = [
        { id: '1', orderId: 'ORD001', category: 'Pizza', amount: 650, time: '10:30 AM', items: 3 },
        { id: '2', orderId: 'ORD002', category: 'Pizza', amount: 480, time: '11:15 AM', items: 2 },
        { id: '3', orderId: 'ORD003', category: 'Pizza', amount: 890, time: '12:45 PM', items: 4 },
        { id: '4', orderId: 'ORD004', category: 'Beverages', amount: 180, time: '1:20 PM', items: 2 },
        { id: '5', orderId: 'ORD005', category: 'Pizza', amount: 520, time: '2:00 PM', items: 2 },
        { id: '6', orderId: 'ORD006', category: 'Desserts', amount: 320, time: '3:30 PM', items: 3 },
        { id: '7', orderId: 'ORD007', category: 'Pizza', amount: 780, time: '5:15 PM', items: 3 },
    ];

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
        const percentage = (data.amount / totalRevenue) * 100;
        const colors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444'];

        return {
            name: category,
            amount: data.amount,
            orders: data.orders,
            percentage,
            color: colors[index % colors.length]
        };
    }).sort((a, b) => b.amount - a.amount);

    // Hourly data (mock)
    const hourlyData = [
        { hour: '9AM', amount: 0 },
        { hour: '10AM', amount: 650 },
        { hour: '11AM', amount: 480 },
        { hour: '12PM', amount: 890 },
        { hour: '1PM', amount: 700 },
        { hour: '2PM', amount: 520 },
        { hour: '3PM', amount: 320 },
        { hour: '4PM', amount: 0 },
        { hour: '5PM', amount: 780 },
    ];
    const maxHourly = Math.max(...hourlyData.map(d => d.amount));

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Revenue Analytics</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Today's Total */}
                <View style={styles.totalCard}>
                    <View style={styles.totalIconContainer}>
                        <TrendingUp size={32} color="#10B981" />
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
                        <ShoppingBag size={20} color="#10B981" />
                        <Text style={styles.quickStatValue}>{totalOrders}</Text>
                        <Text style={styles.quickStatLabel}>Total Orders</Text>
                    </View>
                    <View style={styles.quickStatCard}>
                        <DollarSign size={20} color="#3B82F6" />
                        <Text style={styles.quickStatValue}>₹{Math.round(totalRevenue / totalOrders)}</Text>
                        <Text style={styles.quickStatLabel}>Avg Order</Text>
                    </View>
                    <View style={styles.quickStatCard}>
                        <Users size={20} color="#F59E0B" />
                        <Text style={styles.quickStatValue}>{totalOrders}</Text>
                        <Text style={styles.quickStatLabel}>Customers</Text>
                    </View>
                </View>

                {/* Category Breakdown */}
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

                {/* Hourly Trend */}
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
                                                backgroundColor: hour.amount > 0 ? '#10B981' : '#E5E7EB'
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.barLabel}>{hour.hour}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Recent Orders */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Today's Orders</Text>
                </View>

                {revenueItems.map(item => (
                    <View key={item.id} style={styles.orderCard}>
                        <View style={styles.orderIcon}>
                            <ShoppingBag size={20} color="#10B981" />
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

                <View style={{ height: 40 }} />
            </ScrollView>
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
    totalCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        padding: 20,
        borderRadius: 16,
        marginTop: 20,
        gap: 16,
    },
    totalIconContainer: {
        width: 64,
        height: 64,
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 14,
        color: '#047857',
        marginBottom: 4,
    },
    totalAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: '#047857',
    },
    totalOrders: {
        fontSize: 12,
        color: '#059669',
        marginTop: 4,
    },
    quickStats: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    quickStatCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 4,
    },
    quickStatValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 8,
    },
    quickStatLabel: {
        fontSize: 11,
        color: '#6B7280',
    },
    chartCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
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
        color: '#1F2937',
        marginBottom: 2,
    },
    categoryOrders: {
        fontSize: 12,
        color: '#6B7280',
    },
    categoryRight: {
        alignItems: 'flex-end',
    },
    categoryAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    categoryPercentage: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 2,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#F3F4F6',
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
        color: '#6B7280',
    },
    sectionHeader: {
        marginTop: 24,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    orderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 12,
    },
    orderIcon: {
        width: 40,
        height: 40,
        backgroundColor: '#D1FAE5',
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
        color: '#1F2937',
        marginBottom: 4,
    },
    orderMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    orderCategory: {
        fontSize: 12,
        color: '#6B7280',
    },
    orderDot: {
        fontSize: 12,
        color: '#D1D5DB',
    },
    orderTime: {
        fontSize: 12,
        color: '#6B7280',
    },
    orderItems: {
        fontSize: 12,
        color: '#6B7280',
    },
    orderAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#10B981',
    },
});
