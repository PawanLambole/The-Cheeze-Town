import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  UtensilsCrossed,
  ClipboardList,
  TrendingDown,
  Package,
  BarChart3,
  Users,
  Table,
  Settings,
  Clock,
  CheckCircle,
  XCircle,

} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Theme';
import { database, supabase } from '@/services/database';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';


interface StatCardProps {
  value: string | number;
  label: string;
  icon: React.ReactNode;
  color: string;
  onPress?: () => void;
}

function StatCard({ value, label, icon, color, onPress }: StatCardProps) {
  const CardContent = (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.statCardWrapper}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.statCardWrapper}>
      {CardContent}
    </View>
  );
}

interface OrderItemProps {
  orderId: string;
  tableNo: number;
  customerName?: string;
  items: string[];
  isServed: boolean;
  totalAmount: number;
  time: string;
  onPress: () => void;
}

interface DashboardStats {
  todayOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  todayExpense: number;
}

interface DatabaseOrder {
  id: number;
  order_number: string;
  table_id: number;
  status: string;
  total_amount: number;
  created_at: string;
  customer_name?: string;
}


function OrderItem({ orderId, tableNo, customerName, items, isServed, totalAmount, time, onPress }: OrderItemProps) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity style={styles.orderCard} onPress={onPress}>
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <Text style={styles.orderId}>#{orderId}</Text>
          <View style={styles.tableTag}>
            <Table size={12} color="#000" />
            <Text style={styles.tableNo}>{t('common.table')} {tableNo}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, isServed ? styles.servedBadge : styles.pendingBadge]}>
          {isServed ? (
            <CheckCircle size={14} color="#10B981" />
          ) : (
            <Clock size={14} color="#F59E0B" />
          )}
          <Text style={[styles.statusText, isServed ? styles.servedText : styles.pendingText]}>
            {isServed ? t('manager.home.served') : t('manager.home.pending')}
          </Text>
        </View>
      </View>

      {customerName && (
        <Text style={styles.customerName}>{customerName}</Text>
      )}

      <View style={styles.itemsContainer}>
        <Text style={styles.itemsLabel}>{t('common.items')}:</Text>
        <Text style={styles.itemsList} numberOfLines={2}>
          {items.join(', ')}
        </Text>
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.timeContainer}>
          <Clock size={12} color={Colors.dark.textSecondary} />
          <Text style={styles.timeText}>{time}</Text>
        </View>
        <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const tabBarHeight = Platform.OS === 'web' ? 70 : 60 + insets.bottom;
  const fabProtrusion = Platform.OS === 'web' ? 15 : Platform.OS === 'ios' ? 5 : 10;
  const scrollBottomPadding = tabBarHeight + fabProtrusion + 24;


  const [stats, setStats] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    todayRevenue: 0,
    todayExpense: 0, // Note: We might need an expenses table or similar logic
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    if (!refreshing) setRefreshing(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // 1. Get today's orders count
      const { data: todaysOrdersData, error: ordersError } = await database.query(
        'orders',
        'created_at',
        'gte',
        todayISO
      );

      if (ordersError) throw ordersError;

      const ordersList = ((todaysOrdersData as unknown) || []) as DatabaseOrder[];
      const orderCount = ordersList.length;

      // Calculate Revenue from both:
      // 1. Actual payment records from payments table
      // 2. Orders with status 'paid' (from website) that might not have payment records yet
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

      const { data: paymentsToday, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed')
        .gte('payment_date', startOfDay)
        .lte('payment_date', endOfDay);

      if (paymentsError) throw paymentsError;

      const paymentsRevenue = (paymentsToday || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

      // Also get revenue from 'paid' orders (website orders)
      const paidOrders = ordersList.filter((o: DatabaseOrder) => o.status === 'paid' || o.status === 'completed');
      const ordersRevenue = paidOrders.reduce((sum: number, o: DatabaseOrder) => sum + (Number(o.total_amount) || 0), 0);

      // Use the higher value to avoid double counting (payments table should include all, but just in case)
      const revenue = Math.max(paymentsRevenue, ordersRevenue);

      // 2. Get pending orders count (all time or just today/recent? Usually 'pending' status implies current)
      const { data: pendingData, error: pendingError } = await database.query(
        'orders',
        'status',
        'eq',
        'pending'
      );

      // Also checking for 'preparing' if that counts as pending workflow
      const { data: preparingData } = await database.query(
        'orders',
        'status',
        'eq',
        'preparing'
      );

      const pendingCount = (pendingData?.length || 0) + (preparingData?.length || 0);

      // 3. Recent Orders - Fetch top 5 sorted by created_at desc
      // The generic query in database.ts is limited. Let's use supabase direct for sorting/limit.
      const { data: recentData, error: recentError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      // Map recent orders to partial view format
      const formattedRecentOrders = ((recentData as unknown) as DatabaseOrder[] || []).map((order: DatabaseOrder) => {
        // We need order items. Since we didn't join, let's just show a placeholder or fetch items if critical.
        // For dashboard list, maybe we just show generic info or do a second fetch?
        // Let's rely on a utility or just standard mapping. 
        // Note: The UI expects 'items' string array.
        // For now, simpler to leave items empty or generic until we fetch them.
        return {
          orderId: order.order_number,
          tableNo: order.table_id,
          customerName: order.customer_name || t('common.guest'),
          items: [], // We would need to fetch order_items. Leaving empty for performance for now or TODO.
          isServed: order.status === 'served' || order.status === 'completed' || order.status === 'paid',
          totalAmount: order.total_amount,
          time: getTimeAgo(order.created_at),
          status: order.status
        };
      });

      // 4. Calculate today's expenses from purchases
      const { data: expData, error: expError } = await supabase
        .from('purchases')
        .select('total_amount')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      if (expError) throw expError;

      const totalExpense = (expData || []).reduce((sum: number, p: any) => sum + (Number(p.total_amount) || 0), 0);

      // Update state
      setStats({
        todayOrders: orderCount,
        pendingOrders: pendingCount,
        todayRevenue: revenue,
        todayExpense: totalExpense,
      });
      setRecentOrders(formattedRecentOrders);

      // Fetch items for recent orders to populate the UI correctly
      // This is a "N+1" problem but okay for 5 items.
      if (formattedRecentOrders.length > 0) {
        const ordersWithItems = await Promise.all(formattedRecentOrders.map(async (o: any) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('menu_item_name, quantity')
            .eq('order_id', ((recentData as unknown as DatabaseOrder[])?.find((rd: DatabaseOrder) => rd.order_number === o.orderId)?.id || 0));

          // map to "Qty x Name"
          const itemStrings = items?.map((i: any) => `${i.quantity}x ${i.menu_item_name}`) || [];
          return { ...o, items: itemStrings };
        }));
        setRecentOrders(ordersWithItems);
      }

    } catch (e) {
      console.error("Failed to fetch dashboard data", e);
    } finally {
      setRefreshing(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return t('common.timeAgo.mins', { count: diffMins });
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return t('common.timeAgo.hours', { count: diffHours });
    return t('common.timeAgo.days', { count: Math.round(diffHours / 24) });
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  // Realtime subscription
  useEffect(() => {
    console.log('Setting up manager orders subscription...');
    const subOrders = database.subscribe('orders', (payload) => {
      console.log('Manager received order update, refreshing dashboard...', payload);
      fetchDashboardData();
    });

    const subOrderItems = database.subscribe('order_items', (payload) => {
      console.log('Manager received order_items update, refreshing dashboard...', payload);
      fetchDashboardData();
    });

    return () => {
      console.log('Unsubscribing from manager channels...');
      database.unsubscribe(subOrders);
      database.unsubscribe(subOrderItems);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.appName}>{t('common.appName')}</Text>
          <Text style={styles.greeting}>{t('manager.home.greeting')}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => router.push('/manager/settings')}>
            <Settings size={24} color={Colors.dark.primary} />
          </TouchableOpacity>

        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchDashboardData}
            tintColor={Colors.dark.primary}
            colors={[Colors.dark.primary]}
          />
        }
      >
        {/* Quick Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            value={stats.todayOrders}
            label={t('manager.home.todaysOrders')}
            icon={<ClipboardList size={20} color="#3B82F6" />}
            color="#3B82F6"
            onPress={() => router.push('/manager/orders?dateRange=today')}
          />
          <StatCard
            value={stats.pendingOrders}
            label={t('manager.home.pendingOrders')}
            icon={<Clock size={20} color="#F59E0B" />}
            color="#F59E0B"
            onPress={() => router.push('/manager/orders?status=pending')}
          />
          <StatCard
            value={`₹${stats.todayRevenue.toLocaleString()}`}
            label={t('manager.home.todaysRevenue')}
            icon={<BarChart3 size={20} color="#10B981" />}
            color="#10B981"
            onPress={() => router.push('/manager/revenue')}
          />
          <StatCard
            value={`₹${stats.todayExpense.toLocaleString()}`}
            label={t('manager.home.todaysExpense')}
            icon={<TrendingDown size={20} color="#EF4444" />}
            color="#EF4444"
            onPress={() => router.push('/manager/expenses')}
          />
        </View>

        <View style={styles.reportCard}>
          <Text style={styles.reportTitle}>{t('manager.home.financialOverview')}</Text>
          <View style={styles.reportRow}>
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>{t('manager.home.totalSales')}</Text>
              <Text style={[styles.reportValue, { color: '#16A34A' }]}>
                ₹{stats.todayRevenue.toLocaleString()}
              </Text>
            </View>
            <View style={styles.reportDivider} />
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>{t('manager.home.totalExpense')}</Text>
              <Text style={[styles.reportValue, { color: '#EF4444' }]}>
                ₹{stats.todayExpense.toLocaleString()}
              </Text>
            </View>
            <View style={styles.reportDivider} />
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>{t('manager.home.netProfit')}</Text>
              <Text style={[styles.reportValue, { color: Colors.dark.primary }]}>
                ₹{(stats.todayRevenue - stats.todayExpense).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Access Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('manager.home.quickAccess')}</Text>
        </View>

        <View style={styles.quickAccessGrid}>
          <TouchableOpacity
            style={[styles.quickAccessCard, styles.quickAccessFull]}
            onPress={() => router.push('/manager/order-history')}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#3B82F620', width: 40, height: 40 }]}>
              <ClipboardList size={22} color="#3B82F6" />
            </View>
            <Text style={[styles.quickAccessLabel, { fontSize: 16 }]}>{t('manager.dashboard.orderHistory', { defaultValue: 'Order History' })}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => router.push('/inventory')}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#3B82F620' }]}>
              <Package size={24} color="#3B82F6" />
            </View>
            <Text style={styles.quickAccessLabel}>{t('manager.navigation.inventory')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => router.push('/manager/purchases' as any)}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#EF444420' }]}>
              <Package size={24} color="#EF4444" />
            </View>
            <Text style={styles.quickAccessLabel}>{t('manager.navigation.purchases')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => router.push('/manager/tables')}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#10B98120' }]}>
              <Table size={24} color="#10B981" />
            </View>
            <Text style={styles.quickAccessLabel}>{t('manager.navigation.tables')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => router.push('/manager/staff')}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#F59E0B20' }]}>
              <Users size={24} color="#F59E0B" />
            </View>
            <Text style={styles.quickAccessLabel}>{t('manager.navigation.staff')}</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('manager.home.recentOrders')}</Text>
          <TouchableOpacity onPress={() => router.push('/manager/orders')}>
            <Text style={styles.viewAllText}>{t('common.viewAll')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ordersContainer}>
          {recentOrders.map((order) => (
            <OrderItem
              key={order.orderId}
              orderId={order.orderId}
              tableNo={order.tableNo}
              customerName={order.customerName}
              items={order.items}
              isServed={order.isServed}
              totalAmount={order.totalAmount}
              time={order.time}
              onPress={() => router.push('/manager/orders')}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingBottom: Platform.OS === 'web' ? 90 : 0,
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
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8, // Reduced since items have marginBottom
  },
  statCardWrapper: {
    width: '48%',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    flexDirection: 'column',
    gap: 8,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  reportCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 16,
    marginBottom: 20,
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
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  // Quick Access Grid
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickAccessCard: {
    width: '48%',
    backgroundColor: Colors.dark.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  quickAccessFull: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3, // Increased left padding to shift content right
    paddingRight: 30,
    paddingVertical: 26,
    gap: 10,
  },
  quickAccessIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAccessLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  // Orders Container
  ordersContainer: {
    gap: 12,
    marginBottom: 20,
  },
  orderCard: {
    backgroundColor: Colors.dark.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  servedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  servedText: {
    color: '#10B981',
  },
  pendingText: {
    color: '#F59E0B',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  itemsContainer: {
    gap: 4,
  },
  itemsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
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
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
});
