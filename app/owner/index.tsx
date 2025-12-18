import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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
              title="Total Orders"
              value="87"
              subtitle="Across all tables"
            />
          </View>

          <View style={styles.overviewRow}>
            <OwnerCard
              icon={<BarChart3 size={22} color="#F97316" />}
              title="Avg. Order Value"
              value="₹373"
              subtitle="Sales efficiency"
            />
            <OwnerCard
              icon={<Users size={22} color="#7C3AED" />}
              title="Active Staff"
              value="12"
              subtitle="On duty now"
            />
          </View>

          <Text style={styles.sectionTitle}>Management</Text>

          <View style={styles.grid}>
            <OwnerCard
              icon={<UtensilsCrossed size={24} color="#FDB813" />}
              title="Menu"
              subtitle="Configure & price items"
              variant="management"
              onPress={() => router.push('/menu')}
            />
            <OwnerCard
              icon={<ClipboardList size={24} color="#FDB813" />}
              title="Orders"
              subtitle="Monitor live orders"
              variant="management"
              onPress={() => router.push('/manager/orders')}
            />
            <OwnerCard
              icon={<Table size={24} color="#FDB813" />}
              title="Tables"
              subtitle="Seating & occupancy"
              variant="management"
              onPress={() => router.push('/manager/tables')}
            />
            <OwnerCard
              icon={<Package size={24} color="#FDB813" />}
              title="Inventory"
              subtitle="Stock & purchasing"
              variant="management"
              onPress={() => router.push('/inventory')}
            />
            <OwnerCard
              icon={<BarChart3 size={24} color="#FDB813" />}
              title="Reports"
              subtitle="Sales & trends"
              variant="management"
              onPress={() => router.push('/owner/reports')}
            />
            <OwnerCard
              icon={<Users size={24} color="#FDB813" />}
              title="Staff"
              subtitle="Roles & shifts"
              variant="management"
              onPress={() => router.push('/manager/staff')}
            />
            <OwnerCard
              icon={<Settings size={24} color="#FDB813" />}
              title="Settings"
              subtitle="Branches & taxes"
              variant="management"
              onPress={() => router.push('/manager/settings')}
            />
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.bottomNavItem}>
            <BarChart3 size={20} color="#FDB813" />
            <Text style={styles.bottomNavLabel}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => router.push('/manager/staff')}
          >
            <Users size={20} color="#6B7280" />
            <Text style={styles.bottomNavLabelInactive}>Managers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => router.push('/manager/settings')}
          >
            <Settings size={20} color="#6B7280" />
            <Text style={styles.bottomNavLabelInactive}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  main: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ownerCardManagement: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#4B5563',
  },
  ownerCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  ownerCardSubtitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 40,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingBottom: 8,
    paddingTop: 8,
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FDB813',
    marginTop: 4,
  },
  bottomNavLabelInactive: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
});


