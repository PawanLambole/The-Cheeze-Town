import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  DollarSign,
  ClipboardList,
  Users,
  UtensilsCrossed,
  Package,
  Table,
  Settings,
} from 'lucide-react-native';
import { Colors } from '@/constants/Theme';

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>The Cheeze Town</Text>
          <Text style={styles.greeting}>Owner Admin Dashboard</Text>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/owner/settings')}
        >
          <Settings size={24} color={Colors.dark.text} />
        </TouchableOpacity>
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
              icon={<DollarSign size={22} color="#16A34A" />}
              title="Today's Revenue"
              value="₹32,450"
              subtitle="+18% vs yesterday"
            />
            <OwnerCard
              icon={<ClipboardList size={22} color="#2563EB" />}
              title="Today's Total Orders"
              value="87"
              subtitle="Across all tables"
            />
          </View>

          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Today's Financial Report</Text>
            <View style={styles.reportRow}>
              <View style={styles.reportItem}>
                <Text style={styles.reportLabel}>Total Sales</Text>
                <Text style={[styles.reportValue, { color: '#16A34A' }]}>₹32,450</Text>
              </View>
              <View style={styles.reportDivider} />
              <View style={styles.reportItem}>
                <Text style={styles.reportLabel}>Total Expense</Text>
                <Text style={[styles.reportValue, { color: '#EF4444' }]}>₹12,000</Text>
              </View>
              <View style={styles.reportDivider} />
              <View style={styles.reportItem}>
                <Text style={styles.reportLabel}>Net Profit</Text>
                <Text style={[styles.reportValue, { color: Colors.dark.primary }]}>
                  ₹{(32450 - 12000).toLocaleString()}
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
              icon={<BarChart3 size={24} color={Colors.dark.primary} />}
              title="Reports"
              subtitle="Sales & trends"
              variant="management"
              onPress={() => router.push('/owner/reports')}
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
    </SafeAreaView>
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
    padding: 14,
  },
  ownerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ownerCardIcon: {
    marginRight: 8,
  },
  ownerCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  ownerCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  ownerCardSubtitle: {
    fontSize: 11,
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
