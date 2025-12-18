import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, DollarSign, ShoppingBag, Users, Calendar } from 'lucide-react-native';

export default function ReportsScreen() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  const periods = ['today', 'week', 'month', 'year'];

  const salesData = [
    { day: 'Mon', amount: 4200 },
    { day: 'Tue', amount: 5100 },
    { day: 'Wed', amount: 3800 },
    { day: 'Thu', amount: 6200 },
    { day: 'Fri', amount: 7500 },
    { day: 'Sat', amount: 8900 },
    { day: 'Sun', amount: 7200 },
  ];

  const topItems = [
    { name: 'Cheese Burger', orders: 45, revenue: 11250 },
    { name: 'Cappuccino', orders: 38, revenue: 6840 },
    { name: 'French Fries', orders: 32, revenue: 4800 },
    { name: 'Caesar Salad', orders: 28, revenue: 5600 },
  ];

  const maxAmount = Math.max(...salesData.map(d => d.amount));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodContainer}>
          {periods.map(period => (
            <TouchableOpacity
              key={period}
              style={[styles.periodChip, selectedPeriod === period && styles.periodChipActive]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#DBEAFE' }]}>
              <DollarSign size={24} color="#3B82F6" />
            </View>
            <Text style={styles.metricValue}>₹42,850</Text>
            <Text style={styles.metricLabel}>Total Revenue</Text>
            <View style={styles.metricChange}>
              <TrendingUp size={12} color="#10B981" />
              <Text style={styles.metricChangeText}>+12.5%</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#FEF3C7' }]}>
              <ShoppingBag size={24} color="#F59E0B" />
            </View>
            <Text style={styles.metricValue}>156</Text>
            <Text style={styles.metricLabel}>Total Orders</Text>
            <View style={styles.metricChange}>
              <TrendingUp size={12} color="#10B981" />
              <Text style={styles.metricChangeText}>+8.3%</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#D1FAE5' }]}>
              <Users size={24} color="#10B981" />
            </View>
            <Text style={styles.metricValue}>89</Text>
            <Text style={styles.metricLabel}>Customers</Text>
            <View style={styles.metricChange}>
              <TrendingUp size={12} color="#10B981" />
              <Text style={styles.metricChangeText}>+15.2%</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#FEE2E2' }]}>
              <Calendar size={24} color="#EF4444" />
            </View>
            <Text style={styles.metricValue}>₹275</Text>
            <Text style={styles.metricLabel}>Avg Order Value</Text>
            <View style={styles.metricChange}>
              <TrendingUp size={12} color="#10B981" />
              <Text style={styles.metricChangeText}>+5.7%</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Sales Trend</Text>
          <View style={styles.chart}>
            {salesData.map((item, index) => {
              const height = (item.amount / maxAmount) * 100;
              return (
                <View key={index} style={styles.chartBar}>
                  <View style={styles.chartBarContainer}>
                    <View style={[styles.chartBarFill, { height: `${height}%` }]} />
                  </View>
                  <Text style={styles.chartLabel}>{item.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.topItemsCard}>
          <Text style={styles.topItemsTitle}>Top Selling Items</Text>
          {topItems.map((item, index) => (
            <View key={index} style={styles.topItem}>
              <View style={styles.topItemRank}>
                <Text style={styles.topItemRankText}>{index + 1}</Text>
              </View>
              <View style={styles.topItemInfo}>
                <Text style={styles.topItemName}>{item.name}</Text>
                <Text style={styles.topItemOrders}>{item.orders} orders</Text>
              </View>
              <Text style={styles.topItemRevenue}>₹{item.revenue.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Payment Methods</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cash</Text>
            <Text style={styles.summaryValue}>45%</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>UPI</Text>
            <Text style={styles.summaryValue}>35%</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Card</Text>
            <Text style={styles.summaryValue}>20%</Text>
          </View>
        </View>
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
  periodContainer: {
    marginTop: 16,
    marginBottom: 16,
    flexGrow: 0,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  periodChipActive: {
    backgroundColor: '#FDB813',
    borderColor: '#FDB813',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  metricChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricChangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarContainer: {
    width: '80%',
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: '#FDB813',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  topItemsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topItemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  topItemRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topItemRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  topItemOrders: {
    fontSize: 12,
    color: '#6B7280',
  },
  topItemRevenue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FDB813',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
});
