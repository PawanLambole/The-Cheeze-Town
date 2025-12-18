import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
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

function OrderItem({ orderId, tableNo, customerName, items, isServed, totalAmount, time, onPress }: OrderItemProps) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity style={styles.orderCard} onPress={onPress}>
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <Text style={styles.orderId}>#{orderId}</Text>
          <View style={styles.tableTag}>
            <Table size={12} color="#FDB813" />
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
          <Clock size={12} color="#6B7280" />
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

  // Mock data - Replace with actual data from your backend
  const stats = {
    todayOrders: 24,
    pendingOrders: 5,
    todayRevenue: 12450,
    todayExpense: 3250,
  };

  const recentOrders = [
    {
      orderId: 'ORD001',
      tableNo: 5,
      customerName: 'Rahul Sharma',
      items: ['Margherita Pizza', 'Garlic Bread', 'Coke'],
      isServed: false,
      totalAmount: 650,
      time: '10 mins ago',
    },
    {
      orderId: 'ORD002',
      tableNo: 3,
      items: ['Paneer Tikka Pizza', 'French Fries'],
      isServed: true,
      totalAmount: 480,
      time: '25 mins ago',
    },
    {
      orderId: 'ORD003',
      tableNo: 8,
      customerName: 'Priya Patel',
      items: ['Cheese Burst Pizza', 'Pasta Alfredo', 'Pepsi', 'Ice Cream'],
      isServed: false,
      totalAmount: 890,
      time: '32 mins ago',
    },
    {
      orderId: 'ORD004',
      tableNo: 2,
      items: ['Veg Supreme Pizza', 'Garlic Bread'],
      isServed: true,
      totalAmount: 520,
      time: '45 mins ago',
    },
    {
      orderId: 'ORD005',
      tableNo: 12,
      customerName: 'Amit Kumar',
      items: ['BBQ Chicken Pizza', 'Wings', 'Sprite'],
      isServed: true,
      totalAmount: 780,
      time: '1 hour ago',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>{t('common.appName')}</Text>
          <Text style={styles.greeting}>{t('manager.home.greeting')}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/manager/settings')}>
          <Settings size={24} color="#FDB813" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            value={stats.todayOrders}
            label={t('manager.home.todaysOrders')}
            icon={<ClipboardList size={20} color="#3B82F6" />}
            color="#3B82F6"
            onPress={() => router.push('/manager/orders')}
          />
          <StatCard
            value={stats.pendingOrders}
            label={t('manager.home.pendingOrders')}
            icon={<Clock size={20} color="#F59E0B" />}
            color="#F59E0B"
            onPress={() => router.push('/manager/orders')}
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
            label="Today's Expense"
            icon={<TrendingDown size={20} color="#EF4444" />}
            color="#EF4444"
            onPress={() => router.push('/manager/expenses')}
          />
        </View>

        {/* Quick Access Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('manager.home.quickAccess')}</Text>
        </View>

        <View style={styles.quickAccessGrid}>
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => router.push('/inventory')}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#DBEAFE' }]}>
              <Package size={24} color="#3B82F6" />
            </View>
            <Text style={styles.quickAccessLabel}>Inventory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => router.push('/manager/staff')}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#FEF3C7' }]}>
              <Users size={24} color="#F59E0B" />
            </View>
            <Text style={styles.quickAccessLabel}>Staff</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => router.push('/manager/tables')}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#D1FAE5' }]}>
              <Table size={24} color="#10B981" />
            </View>
            <Text style={styles.quickAccessLabel}>Tables</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => router.push('/manager/purchases' as any)}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#FEE2E2' }]}>
              <Package size={24} color="#EF4444" />
            </View>
            <Text style={styles.quickAccessLabel}>Purchases</Text>
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

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FDB813',
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
    marginBottom: 20,
  },
  statCardWrapper: {
    width: '48%',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
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
    color: '#1F2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#FDB813',
    fontWeight: '600',
  },
  // Quick Access Grid
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  quickAccessCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 8,
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
    color: '#1F2937',
  },
  // Orders Container
  ordersContainer: {
    gap: 12,
    marginBottom: 20,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#1F2937',
  },
  tableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tableNo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
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
    backgroundColor: '#D1FAE5',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  servedText: {
    color: '#065F46',
  },
  pendingText: {
    color: '#92400E',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  itemsContainer: {
    gap: 4,
  },
  itemsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  itemsList: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
});
