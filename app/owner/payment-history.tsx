import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Theme';
import { supabase } from '@/services/database';

interface DailyRevenue {
    date: string; // YYYY-MM-DD
    totalAmount: number;
    count: number;
}

export default function PaymentHistoryScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    // mode: 'cash' | 'online'
    const mode = (params.mode as string) || 'cash';
    const [loading, setLoading] = useState(true);
    const [dailyData, setDailyData] = useState<DailyRevenue[]>([]);
    const [totalCollection, setTotalCollection] = useState(0);

    const title = mode === 'cash' ? 'Cash Collection History' : 'Online Payment History';
    const color = mode === 'cash' ? '#10B981' : '#3B82F6';

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const today = new Date();
            const pastDate = new Date();
            pastDate.setDate(today.getDate() - 60);

            // 1. Fetch payments in date range
            const { data: payments, error } = await supabase
                .from('payments')
                .select('amount, payment_date, payment_method, order_id')
                .eq('status', 'completed')
                .gte('payment_date', pastDate.toISOString());

            if (error) throw error;

            // 2. Fetch order details for these payments (to check status for inference)
            const paymentOrderIds = Array.from(new Set((payments || []).map((p: any) => p.order_id).filter(id => id)));
            
            let orderStatusMap = new Map<number, string>();
            if (paymentOrderIds.length > 0) {
                const { data: orderStatuses } = await supabase
                    .from('orders')
                    .select('id, status')
                    .in('id', paymentOrderIds);
                
                (orderStatuses || []).forEach((o: any) => {
                    orderStatusMap.set(o.id, o.status);
                });
            }

            // 3. Fetch "Potential Fallback" Orders in same date range (created_at based)
            // This captures orders that have NO payment record but are completed/paid
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('id, total_amount, created_at, status')
                .or('status.eq.paid,status.eq.completed')
                .gte('created_at', pastDate.toISOString());

            if (ordersError) throw ordersError;

            // Grouping Logic
            const revenueMap = new Map<string, { amount: number, orderIds: Set<string> }>();

            const getLocalDateStr = (dateStr: string) => {
                const d = new Date(dateStr);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            // Process Payments
            (payments || []).forEach((p: any) => {
                const date = getLocalDateStr(p.payment_date);
                const amt = Number(p.amount) || 0;
                const orderId = p.order_id;
                
                // Determine Mode (Cash/Online) matching OrderHistory logic
                const pMethod = p.payment_method?.toLowerCase() || '';
                const relatedOrderStatus = orderStatusMap.get(orderId);

                let isCash = false;
                let isOnline = false;

                if (pMethod === 'cash') isCash = true;
                else if (pMethod && pMethod !== 'cash') isOnline = true;
                else {
                    // Inference if method missing
                    if (relatedOrderStatus === 'completed') isCash = true;
                    if (relatedOrderStatus === 'paid') isOnline = true;
                    // Default default if still unknown? Payment History legacy assumed Cash.
                    if (!isCash && !isOnline) isCash = true; 
                }

                let isMatch = false;
                if (mode === 'cash' && isCash) isMatch = true;
                if (mode === 'online' && isOnline) isMatch = true;

                if (isMatch) {
                    const current = revenueMap.get(date) || { amount: 0, orderIds: new Set<string>() };
                    current.orderIds.add(String(orderId));
                    revenueMap.set(date, {
                        amount: current.amount + amt, // Amount sums up (transactions)
                        orderIds: current.orderIds
                    });
                }
            });

            // Process Fallback Orders
            const processedPaymentOrderIds = new Set(paymentOrderIds.map(String));

            (orders || []).forEach((o: any) => {
                if (processedPaymentOrderIds.has(String(o.id))) return; // Already processed via payments

                const date = getLocalDateStr(o.created_at);
                const amt = Number(o.total_amount) || 0;
                
                let isMatch = false;
                if (mode === 'cash') {
                    // Fallback: Status completed (implies Cash)
                    if (o.status === 'completed') isMatch = true;
                } else if (mode === 'online') {
                    // Fallback: Status paid (implies Online)
                    if (o.status === 'paid') isMatch = true;
                }

                if (isMatch) {
                    const current = revenueMap.get(date) || { amount: 0, orderIds: new Set<string>() };
                    current.orderIds.add(String(o.id));
                    revenueMap.set(date, {
                        amount: current.amount + amt,
                        orderIds: current.orderIds
                    });
                }
            });

            // Convert to Array
            const result: DailyRevenue[] = [];
            let total = 0;
            revenueMap.forEach((val, date) => {
                result.push({ date, totalAmount: val.amount, count: val.orderIds.size });
                total += val.amount;
            });

            // Sort descending
            result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setDailyData(result);
            setTotalCollection(total);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [mode]);

    const handleDatePress = (date: string) => {
        // Navigate to Orders with Filters
        router.push({
            pathname: '/owner/order-history',
            // Using /owner/orders should work if user is owner.
            params: {
                dateRange: 'custom',
                startDate: date, // 2024-01-01
                endDate: date,
                paymentMethod: mode,
                status: 'all', // show all for that day/mode
                paymentStatus: 'paid', // Strict filter to match revenue
            }

        });
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total (Last 60 Days)</Text>
                <Text style={[styles.summaryValue, { color }]}>₹{totalCollection.toLocaleString()}</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={color} style={{ marginTop: 20 }} />
            ) : (
                <ScrollView
                    style={styles.list}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchHistory} colors={[color]} tintColor={color} />}
                >
                    {dailyData.map((item) => (
                        <TouchableOpacity
                            key={item.date}
                            style={styles.card}
                            onPress={() => handleDatePress(item.date)}
                        >
                            <View style={styles.cardLeft}>
                                <Calendar size={20} color={Colors.dark.textSecondary} />
                                <View>
                                    <Text style={styles.dateText}>
                                        {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </Text>
                                    <Text style={styles.countText}>{item.count} Orders</Text>
                                </View>
                            </View>
                            <View style={styles.cardRight}>
                                <Text style={[styles.amountText, { color: Colors.dark.text }]}>₹{item.totalAmount.toLocaleString()}</Text>
                                <ChevronRight size={20} color={Colors.dark.textSecondary} />
                            </View>
                        </TouchableOpacity>
                    ))}
                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
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
        paddingBottom: 16,
        backgroundColor: Colors.dark.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    summaryCard: {
        margin: 20,
        padding: 20,
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    summaryLabel: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginBottom: 8,
    },
    summaryValue: {
        fontSize: 32,
        fontWeight: '800',
    },
    list: {
        flex: 1,
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: Colors.dark.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 2,
    },
    countText: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    cardRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    amountText: {
        fontSize: 16,
        fontWeight: '700',
    },
});
