import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ShoppingCart,
  IndianRupee,
  ClipboardList,
  Users,
  UtensilsCrossed,
  Package,
  Table,
  Settings,
  Clock,
  TrendingDown,

} from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { database, supabase } from '@/services/database';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

interface OwnerCardProps {
  icon: React.ReactNode;
  title: string;
  value?: string;
  subtitle?: string;
  onPress?: () => void;
  variant?: 'overview' | 'management';
}

function OwnerCard({ icon, title, value, subtitle, onPress, variant = 'overview' }: OwnerCardProps) {
  const cardStyle =
    variant === 'management' ? styles.ownerCardManagement : styles.ownerCard;

  const content = (
    <View style={styles.ownerCardInner}>
      <View style={styles.ownerCardHeader}>
        <View style={styles.ownerCardIcon}>{icon}</View>
        <Text style={styles.ownerCardTitle}>{title}</Text>
      </View>
      {value && <Text style={styles.ownerCardValue}>{value}</Text>}
      {subtitle && <Text style={styles.ownerCardSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{content}</View>;
}

export default function OwnerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userData } = useAuth();

  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    pendingOrders: 0,
    todayExpense: 0
  });

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // 1. Get today's orders
      const { data: todaysOrdersData, error: ordersError } = await database.query(
        'orders',
        'created_at',
        'gte',
        todayISO
      );

      if (ordersError) throw ordersError;

      const ordersList = todaysOrdersData || [];
      const orderCount = ordersList.length;

      // Calculate Revenue
      const revenue = ordersList
        .filter((o: any) => o.status !== 'cancelled')
        .reduce((sum: number, order: any) => sum + (Number(order.total_amount) || 0), 0);

      // 2. Get pending orders count
      const { data: pendingData } = await database.query('orders', 'status', 'eq', 'pending');
      const { data: preparingData } = await database.query('orders', 'status', 'eq', 'preparing');
      const pendingCount = (pendingData?.length || 0) + (preparingData?.length || 0);

      // 3. Get generic expenses (if any table existed, for now mock or simple logic)
      // Since we don't have an 'expenses' table defined in widely used context yet, we'll keep it 0 or use a placeholder
      // If you have an expenses table, query it here.
      const expenses = 0;

      setStats({
        todayRevenue: revenue,
        todayOrders: orderCount,
        pendingOrders: pendingCount,
        todayExpense: expenses
      });

    } catch (error) {
      console.error("Error fetching owner dashboard data", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  useEffect(() => {
    const sub = database.subscribe('orders', () => {
      fetchDashboardData();
    });
    return () => {
      database.unsubscribe(sub);
    };
  }, []);



  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.appName}>The Cheeze Town</Text>
          <Text style={styles.greeting}>
            {userData?.name || 'Owner'} Admin Dashboard
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/owner/settings')}
          >
            <Settings size={24} color={Colors.dark.text} />
          </TouchableOpacity>

        </View>
      </View>

      <View style={styles.main}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Business Overview</Text>

          <View style={styles.overviewRow}>
            <OwnerCard
              icon={<IndianRupee size={22} color="#16A34A" />}
              title="Today's Revenue"
              value={`₹${stats.todayRevenue.toLocaleString()}`}
              subtitle="vs yesterday"
            />
            <OwnerCard
              icon={<ClipboardList size={22} color="#2563EB" />}
              title="Today's Total Orders"
              value={stats.todayOrders.toString()}
              subtitle="Across all tables"
            />
          </View>

          <View style={styles.overviewRow}>
            <OwnerCard
              icon={<TrendingDown size={22} color="#EF4444" />}
              title="Today's Expense"
              value={`₹${stats.todayExpense.toLocaleString()}`}
              subtitle="Operational costs"
            />
            <OwnerCard
              icon={<Clock size={22} color="#F59E0B" />}
              title="Pending Orders"
              value={stats.pendingOrders.toString()}
              subtitle="Active right now"
            />
          </View>

          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Today's Financial Report</Text>
            <View style={styles.reportRow}>
              <View style={styles.reportItem}>
                <Text style={styles.reportLabel}>Total Sales</Text>
                <Text style={[styles.reportValue, { color: '#16A34A' }]}>₹{stats.todayRevenue.toLocaleString()}</Text>
              </View>
              <View style={styles.reportDivider} />
              <View style={styles.reportItem}>
                <Text style={styles.reportLabel}>Total Expense</Text>
                <Text style={[styles.reportValue, { color: '#EF4444' }]}>₹{stats.todayExpense.toLocaleString()}</Text>
              </View>
              <View style={styles.reportDivider} />
              <View style={styles.reportItem}>
                <Text style={styles.reportLabel}>Net Profit</Text>
                <Text style={[styles.reportValue, { color: Colors.dark.primary }]}>
                  ₹{(stats.todayRevenue - stats.todayExpense).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Management</Text>

          <View style={styles.grid}>
            <OwnerCard
              icon={<UtensilsCrossed size={24} color={Colors.dark.primary} />}
              title="Menu"
              subtitle="Configure & price items"
              variant="management"
              onPress={() => router.push('/owner/menu')}
            />
            <OwnerCard
              icon={<ClipboardList size={24} color={Colors.dark.primary} />}
              title="Orders"
              subtitle="Monitor live orders"
              variant="management"
              onPress={() => router.push('/owner/orders')}
            />
            <OwnerCard
              icon={<Table size={24} color={Colors.dark.primary} />}
              title="Tables"
              subtitle="Seating & occupancy"
              variant="management"
              onPress={() => router.push('/owner/tables')}
            />
            <OwnerCard
              icon={<Package size={24} color={Colors.dark.primary} />}
              title="Inventory"
              subtitle="Stock & purchasing"
              variant="management"
              onPress={() => router.push('/inventory')}
            />
            <OwnerCard
              icon={<ShoppingCart size={24} color={Colors.dark.primary} />}
              title="Purchases"
              subtitle="Track all purchases"
              variant="management"
              onPress={() => router.push('/owner/purchases')}
            />
            <OwnerCard
              icon={<Users size={24} color={Colors.dark.primary} />}
              title="Staff"
              subtitle="Roles & shifts"
              variant="management"
              onPress={() => router.push('/owner/staff')}
            />

          </View>
        </ScrollView>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.dark.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.dark.secondary,
  },

  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  greeting: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  main: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginTop: 16,
    marginBottom: 12,
  },
  overviewRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  ownerCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  ownerCardManagement: {
    width: '48%',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  ownerCardInner: {
    padding: 16,
  },
  ownerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ownerCardIcon: {
    marginRight: 10,
  },
  ownerCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  ownerCardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  ownerCardSubtitle: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 40,
  },
  reportCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 16,
    marginBottom: 24,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportItem: {
    alignItems: 'center',
    flex: 1,
  },
  reportLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  reportValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  reportDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.dark.border,
  },
});
