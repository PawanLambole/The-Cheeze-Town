import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { userData } = useAuth();

  /* 
   Updated to show TOTAL (Lifetime) data as requested. 
   Fetching all completed orders for revenue and all purchases for expenses.
  */
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalExpense: 0
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    if (!refreshing) setRefreshing(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();

      // 1. Get TODAY'S orders for revenue
      const { data: todaysOrders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, status')
        .gte('created_at', todayISO);

      if (ordersError) throw ordersError;

      const validOrders = (todaysOrders || []).filter((o: any) =>
        o.status !== 'cancelled' && o.status !== 'rejected'
      );

      const ordersCount = validOrders.length;

      // Calculate Revenue from COMPLETED and PAID orders (paid = web orders)
      const paidOrders = validOrders.filter((o: any) => o.status === 'completed' || o.status === 'paid');
      const revenue = paidOrders.reduce((sum: number, order: any) => sum + (Number(order.total_amount) || 0), 0);

      // 2. Get pending orders count (Real-time status) - This remains "Active Right Now"
      const { data: pendingData } = await database.query('orders', 'status', 'eq', 'pending');
      const { data: preparingData } = await database.query('orders', 'status', 'eq', 'preparing');
      const pendingCount = (pendingData?.length || 0) + (preparingData?.length || 0);

      // 3. Get TODAY'S expenses from purchases table
      const { data: todaysPurchases } = await supabase
        .from('purchases')
        .select('total_price')
        .gte('created_at', todayISO);

      const expenses = (todaysPurchases || []).reduce((sum: number, p: any) => sum + (Number(p.total_price) || 0), 0);

      setStats({
        totalRevenue: revenue,
        totalOrders: ordersCount,
        pendingOrders: pendingCount,
        totalExpense: expenses
      });

    } catch (error) {
      console.error("Error fetching owner dashboard data", error);
    } finally {
      setRefreshing(false);
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
          <Text style={styles.appName}>{t('common.appName')}</Text>
          <Text style={styles.greeting}>
            {t('owner.subtitle')}
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchDashboardData}
              tintColor={Colors.dark.primary}
              colors={[Colors.dark.primary]}
            />
          }
        >
          <Text style={styles.sectionTitle}>{t('owner.businessOverview')}</Text>

          <View style={styles.overviewRow}>
            <OwnerCard
              icon={<IndianRupee size={22} color="#16A34A" />}
              title={t('owner.todaysRevenue')}
              value={`₹${stats.totalRevenue.toLocaleString()}`}
              subtitle={t('owner.todaysEarnings')}
              onPress={() => router.push('/owner/revenue')}
            />
            <OwnerCard
              icon={<ClipboardList size={22} color="#2563EB" />}
              title={t('owner.todaysOrders')}
              value={stats.totalOrders.toString()}
              subtitle={t('owner.completedToday')}
              onPress={() => router.push('/owner/orders')}
            />
          </View>

          <View style={styles.overviewRow}>
            <OwnerCard
              icon={<TrendingDown size={22} color="#EF4444" />}
              title={t('owner.todaysExpense')}
              value={`₹${stats.totalExpense.toLocaleString()}`}
              subtitle={t('owner.todaysCosts')}
              onPress={() => router.push('/owner/expenses')}
            />
            <OwnerCard
              icon={<Clock size={22} color="#F59E0B" />}
              title={t('owner.pendingOrders')}
              value={stats.pendingOrders.toString()}
              subtitle={t('owner.activeRightNow')}
              onPress={() => router.push('/owner/orders')}
            />
          </View>

          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>{t('owner.financialOverview')}</Text>
            <View style={styles.reportRow}>
              <View style={styles.reportItem}>
                <Text style={styles.reportLabel}>{t('owner.totalSales')}</Text>
                <Text style={[styles.reportValue, { color: '#16A34A' }]}>₹{stats.totalRevenue.toLocaleString()}</Text>
              </View>
              <View style={styles.reportDivider} />
              <View style={styles.reportItem}>
                <Text style={styles.reportLabel}>{t('owner.totalExpense')}</Text>
                <Text style={[styles.reportValue, { color: '#EF4444' }]}>₹{stats.totalExpense.toLocaleString()}</Text>
              </View>
              <View style={styles.reportDivider} />
              <View style={styles.reportItem}>
                <Text style={styles.reportLabel}>{t('owner.netProfit')}</Text>
                <Text style={[styles.reportValue, { color: Colors.dark.primary }]}>
                  ₹{(stats.totalRevenue - stats.totalExpense).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t('owner.management')}</Text>

          <View style={styles.grid}>
            <OwnerCard
              icon={<UtensilsCrossed size={24} color={Colors.dark.primary} />}
              title={t('owner.menu')}
              subtitle={t('owner.menuSubtitle')}
              variant="management"
              onPress={() => router.push('/owner/menu')}
            />
            <OwnerCard
              icon={<ClipboardList size={24} color={Colors.dark.primary} />}
              title={t('owner.orders')}
              subtitle={t('owner.ordersSubtitle')}
              variant="management"
              onPress={() => router.push('/owner/orders')}
            />
            <OwnerCard
              icon={<Table size={24} color={Colors.dark.primary} />}
              title={t('owner.tables')}
              subtitle={t('owner.tablesSubtitle')}
              variant="management"
              onPress={() => router.push('/owner/tables')}
            />
            <OwnerCard
              icon={<Package size={24} color={Colors.dark.primary} />}
              title={t('owner.inventory')}
              subtitle={t('owner.inventorySubtitle')}
              variant="management"
              onPress={() => router.push('/owner/inventory')}
            />
            <OwnerCard
              icon={<ShoppingCart size={24} color={Colors.dark.primary} />}
              title={t('owner.purchases')}
              subtitle={t('owner.purchasesSubtitle')}
              variant="management"
              onPress={() => router.push('/owner/purchases')}
            />
            <OwnerCard
              icon={<Users size={24} color={Colors.dark.primary} />}
              title={t('owner.staff')}
              subtitle={t('owner.staffSubtitle')}
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
