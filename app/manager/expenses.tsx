import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingDown, Package, Zap, Wrench, Users as UsersIcon, ShoppingBag } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { database, supabase } from '@/services/database';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';

interface ExpenseItem {
    id: string;
    category: string;
    amount: number;
    date: string;
    description: string;
}

interface CategoryStats {
    name: string;
    amount: number;
    percentage: number;
    color: string;
    icon: React.ReactNode;
}

export default function ExpensesScreen() {
    const router = useRouter();
    const screenWidth = Dimensions.get('window').width;

    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);

    const fetchExpenses = async () => {
        try {
            const { data, error } = await supabase
                .from('purchases')
                .select('*')
                .order('purchase_date', { ascending: false });

            if (error) throw error;

            const mapped: ExpenseItem[] = (data || []).map((p: any) => ({
                id: p.id,
                category: p.category,
                amount: Number(p.total_price),
                date: p.purchase_date,
                description: p.item_name
            }));

            setExpenses(mapped);

        } catch (e) {
            console.error("Error fetching expenses", e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchExpenses();
        }, [])
    );

    const todayStr = new Date().toISOString().split('T')[0];
    const todayExpenses = expenses.filter(e => e.date === todayStr);
    const totalToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    const categoryStats = useMemo(() => {
        const totals: Record<string, number> = {};
        todayExpenses.forEach(e => {
            totals[e.category] = (totals[e.category] || 0) + e.amount;
        });

        return Object.entries(totals).map(([category, amount]) => {
            const percentage = totalToday > 0 ? (amount / totalToday) * 100 : 0;
            let color = '#EF4444';
            let icon = <Package size={20} color="#FFFFFF" />;

            switch (category) {
                case 'Inventory':
                    color = '#EF4444';
                    icon = <ShoppingBag size={20} color="#FFFFFF" />;
                    break;
                case 'Utilities':
                    color = '#F59E0B';
                    icon = <Zap size={20} color="#FFFFFF" />;
                    break;
                case 'Maintenance':
                    color = '#10B981';
                    icon = <Wrench size={20} color="#FFFFFF" />;
                    break;
                case 'Salaries':
                    color = '#3B82F6';
                    icon = <UsersIcon size={20} color="#FFFFFF" />;
                    break;
                default:
                    color = '#8B5CF6';
                    icon = <Package size={20} color="#FFFFFF" />;
            }

            return { name: category, amount, percentage, color, icon };
        }).sort((a, b) => b.amount - a.amount);
    }, [todayExpenses, totalToday]);

    const weeklyData = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

            const dayTotal = expenses
                .filter(e => e.date === dateStr)
                .reduce((sum, e) => sum + e.amount, 0);

            days.push({ day: dayName, amount: dayTotal });
        }
        return days;
    }, [expenses]);

    const maxWeekly = Math.max(...weeklyData.map(d => d.amount), 1);

    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Expense Analytics</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Today's Total */}
                <View style={styles.totalCard}>
                    <View style={styles.totalIconContainer}>
                        <TrendingDown size={32} color="#EF4444" />
                    </View>
                    <View>
                        <Text style={styles.totalLabel}>Today's Total Expense</Text>
                        <Text style={styles.totalAmount}>₹{totalToday.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Category Breakdown */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Expense by Category</Text>
                    <View style={styles.categoriesContainer}>
                        {categoryStats.map((cat, index) => (
                            <View key={cat.name} style={styles.categoryItem}>
                                <View style={styles.categoryHeader}>
                                    <View style={[styles.categoryIcon, { backgroundColor: cat.color }]}>
                                        {cat.icon}
                                    </View>
                                    <View style={styles.categoryInfo}>
                                        <Text style={styles.categoryName}>{cat.name}</Text>
                                        <Text style={styles.categoryAmount}>₹{cat.amount.toLocaleString()}</Text>
                                    </View>
                                    <Text style={styles.categoryPercentage}>{cat.percentage.toFixed(0)}%</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBar, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Weekly Trend */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Weekly Expense Trend</Text>
                    <View style={styles.barChartContainer}>
                        {weeklyData.map((day, index) => (
                            <View key={day.day} style={styles.barColumn}>
                                <View style={styles.barWrapper}>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height: `${(day.amount / maxWeekly) * 100}%`,
                                                backgroundColor: index === 6 ? '#EF4444' : Colors.dark.secondary // Highlight active
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.barLabel}>{day.day}</Text>
                                <Text style={styles.barValue}>₹{(day.amount / 1000).toFixed(1)}k</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Recent Expenses List */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Today's Expenses</Text>
                </View>

                {todayExpenses.map(expense => (
                    <View key={expense.id} style={styles.expenseCard}>
                        <View style={styles.expenseIcon}>
                            <Package size={20} color="#EF4444" />
                        </View>
                        <View style={styles.expenseInfo}>
                            <Text style={styles.expenseName}>{expense.description}</Text>
                            <View style={styles.expenseMeta}>
                                <Text style={styles.expenseCategory}>{expense.category}</Text>
                                <Text style={styles.expenseDot}>•</Text>
                                <Text style={styles.expenseDate}>{new Date(expense.date).toLocaleDateString()}</Text>
                            </View>
                        </View>
                        <Text style={styles.expenseAmount}>₹{expense.amount}</Text>
                    </View>
                ))}

                <View style={{ height: 40 }} />
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
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        padding: 20,
        borderRadius: 16,
        marginTop: 20,
        gap: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    totalIconContainer: {
        width: 64,
        height: 64,
        backgroundColor: Colors.dark.card,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    totalLabel: {
        fontSize: 14,
        color: '#EF4444',
        marginBottom: 4,
    },
    totalAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: '#EF4444',
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
    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
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
    categoryAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    categoryPercentage: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.dark.textSecondary,
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
        height: 200,
        paddingTop: 20,
    },
    barColumn: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    barWrapper: {
        width: '80%',
        height: 140,
        justifyContent: 'flex-end',
    },
    bar: {
        width: '100%',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        minHeight: 10,
    },
    barLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
    },
    barValue: {
        fontSize: 10,
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
    expenseCard: {
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
    expenseIcon: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    expenseInfo: {
        flex: 1,
    },
    expenseName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    expenseMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    expenseCategory: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    expenseDot: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    expenseDate: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#EF4444',
    },
});
