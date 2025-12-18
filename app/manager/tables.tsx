import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Clock, Plus, X, ShoppingBag, User } from 'lucide-react-native';

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied';
  orderAmount?: number;
  duration?: string;
  orderId?: string;
  customerName?: string;
  items?: { name: string; quantity: number; price: number }[];
  isServed?: boolean;
}

export default function TablesScreen() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('');

  const statusOptions = ['all', 'available', 'occupied'];

  const [tables, setTables] = useState<Table[]>([
    { id: '1', number: 1, capacity: 4, status: 'available' },
    {
      id: '2',
      number: 2,
      capacity: 2,
      status: 'occupied',
      orderAmount: 850,
      duration: '45 min',
      orderId: 'ORD001',
      customerName: 'Rahul Sharma',
      isServed: false,
      items: [
        { name: 'Margherita Pizza', quantity: 2, price: 250 },
        { name: 'Garlic Bread', quantity: 1, price: 150 },
        { name: 'Coke', quantity: 2, price: 100 }
      ]
    },
    {
      id: '3',
      number: 3,
      capacity: 6,
      status: 'occupied',
      orderAmount: 580,
      duration: '30 min',
      orderId: 'ORD002',
      customerName: 'Priya Patel',
      isServed: true,
      items: [
        { name: 'Paneer Tikka Pizza', quantity: 1, price: 280 },
        { name: 'French Fries', quantity: 1, price: 150 },
        { name: 'Pepsi', quantity: 1, price: 50 }
      ]
    },
    { id: '4', number: 4, capacity: 4, status: 'available' },
    {
      id: '5',
      number: 5,
      capacity: 4,
      status: 'occupied',
      orderAmount: 650,
      duration: '25 min',
      orderId: 'ORD003',
      isServed: false,
      items: [
        { name: 'Cheese Burst Pizza', quantity: 1, price: 450 },
        { name: 'Garlic Bread', quantity: 1, price: 150 },
        { name: 'Sprite', quantity: 1, price: 50 }
      ]
    },
    {
      id: '6',
      number: 6,
      capacity: 2,
      status: 'occupied',
      orderAmount: 420,
      duration: '1h 10min',
      orderId: 'ORD004',
      customerName: 'Amit Kumar',
      isServed: true,
      items: [
        { name: 'Veg Supreme Pizza', quantity: 1, price: 320 },
        { name: 'Coke', quantity: 1, price: 100 }
      ]
    },
    {
      id: '7',
      number: 7,
      capacity: 4,
      status: 'occupied',
      orderAmount: 200,
      duration: '15 min',
      orderId: 'ORD005',
      isServed: false,
      items: [
        { name: 'French Fries', quantity: 2, price: 150 },
        { name: 'Pepsi', quantity: 1, price: 50 }
      ]
    },
    { id: '8', number: 8, capacity: 8, status: 'available' },
    { id: '9', number: 9, capacity: 4, status: 'available' },
    { id: '10', number: 10, capacity: 2, status: 'available' },
  ]);

  const filteredTables = tables.filter(table =>
    selectedStatus === 'all' || table.status === selectedStatus
  );

  const getStatusColor = (status: string) => {
    return status === 'available' ? '#10B981' : '#EF4444';
  };

  const getStatusBackground = (status: string) => {
    return status === 'available' ? '#D1FAE5' : '#FEE2E2';
  };

  const handleAddTable = () => {
    if (!newTableNumber || !newTableCapacity) {
      alert('Please fill in all fields');
      return;
    }

    const tableNumber = parseInt(newTableNumber);
    const capacity = parseInt(newTableCapacity);

    // Check if table number already exists
    if (tables.find(t => t.number === tableNumber)) {
      alert('Table number already exists');
      return;
    }

    const newTable: Table = {
      id: String(Date.now()),
      number: tableNumber,
      capacity: capacity,
      status: 'available',
    };

    setTables(prev => [...prev, newTable].sort((a, b) => a.number - b.number));
    setShowAddModal(false);
    setNewTableNumber('');
    setNewTableCapacity('');
  };

  const handleTableClick = (table: Table) => {
    if (table.status === 'occupied') {
      setSelectedTable(table);
      setShowOrderModal(true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Table Management</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Plus size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{tables.filter(t => t.status === 'available').length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{tables.filter(t => t.status === 'occupied').length}</Text>
            <Text style={styles.statLabel}>Occupied</Text>
          </View>
        </View>


        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusContainer}>
          {statusOptions.map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.statusChip, selectedStatus === status && styles.statusChipActive]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={[styles.statusText, selectedStatus === status && styles.statusTextActive]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.tablesList} showsVerticalScrollIndicator={false}>
          <View style={styles.tablesGrid}>
            {filteredTables.map(table => (
              <TouchableOpacity
                key={table.id}
                onPress={() => handleTableClick(table)}
                style={[styles.tableCard, { backgroundColor: getStatusBackground(table.status) }]}
              >
                <View style={styles.tableNumber}>
                  <Text style={styles.tableNumberText}>Table {table.number}</Text>
                </View>
                <View style={styles.tableCapacity}>
                  <Users size={16} color="#6B7280" />
                  <Text style={styles.tableCapacityText}>{table.capacity} seats</Text>
                </View>
                <View style={[styles.tableStatus, { backgroundColor: getStatusColor(table.status) }]}>
                  <Text style={styles.tableStatusText}>{table.status}</Text>
                </View>
                {table.status === 'occupied' && (
                  <>
                    <View style={styles.tableDuration}>
                      <Clock size={14} color="#6B7280" />
                      <Text style={styles.tableDurationText}>{table.duration}</Text>
                    </View>
                    <Text style={styles.tableAmount}>₹{table.orderAmount}</Text>
                    <TouchableOpacity
                      style={[styles.servedToggle, table.isServed && styles.servedToggleActive]}
                      onPress={(e) => {
                        e.stopPropagation();
                        setTables(prev => prev.map(t =>
                          t.id === table.id ? { ...t, isServed: !t.isServed } : t
                        ));
                      }}
                    >
                      <Text style={[styles.servedToggleText, table.isServed && styles.servedToggleTextActive]}>
                        {table.isServed ? '✓ Served' : 'Pending'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Add Table Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Table</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); setNewTableNumber(''); setNewTableCapacity(''); }}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Table Number *"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={newTableNumber}
              onChangeText={setNewTableNumber}
            />

            <TextInput
              style={styles.input}
              placeholder="Seating Capacity *"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={newTableCapacity}
              onChangeText={setNewTableCapacity}
            />

            <TouchableOpacity style={styles.addButton} onPress={handleAddTable}>
              <Text style={styles.addButtonText}>Add Table</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Order Details Modal */}
      <Modal visible={showOrderModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setShowOrderModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedTable && (
              <ScrollView>
                {/* Table & Order Info */}
                <View style={styles.orderHeader}>
                  <View style={styles.orderHeaderLeft}>
                    <Text style={styles.orderTableText}>Table {selectedTable.number}</Text>
                    <Text style={styles.orderIdText}>#{selectedTable.orderId}</Text>
                  </View>
                  <View style={styles.orderDurationBadge}>
                    <Clock size={14} color="#F59E0B" />
                    <Text style={styles.orderDurationText}>{selectedTable.duration}</Text>
                  </View>
                </View>

                {/* Customer Info */}
                {selectedTable.customerName && (
                  <View style={styles.customerInfo}>
                    <User size={16} color="#6B7280" />
                    <Text style={styles.customerName}>{selectedTable.customerName}</Text>
                  </View>
                )}

                {/* Order Items */}
                <View style={styles.orderItemsSection}>
                  <Text style={styles.sectionLabel}>Order Items</Text>
                  {selectedTable.items?.map((item, index) => (
                    <View key={index} style={styles.orderItem}>
                      <View style={styles.orderItemLeft}>
                        <TouchableOpacity
                          style={styles.minusButton}
                          onPress={() => {
                            if (selectedTable.items) {
                              const updatedItems = [...selectedTable.items];
                              if (updatedItems[index].quantity > 1) {
                                updatedItems[index] = {
                                  ...updatedItems[index],
                                  quantity: updatedItems[index].quantity - 1
                                };
                              } else {
                                updatedItems.splice(index, 1);
                              }
                              const newTotal = updatedItems.reduce((sum, itm) => sum + (itm.price * itm.quantity), 0);
                              setTables(prev => prev.map(t =>
                                t.id === selectedTable.id
                                  ? { ...t, items: updatedItems, orderAmount: newTotal }
                                  : t
                              ));
                              setSelectedTable({
                                ...selectedTable,
                                items: updatedItems,
                                orderAmount: newTotal
                              });
                            }
                          }}
                        >
                          <Text style={styles.minusButtonText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.orderItemQuantity}>{item.quantity}x</Text>
                        <Text style={styles.orderItemName}>{item.name}</Text>
                      </View>
                      <Text style={styles.orderItemPrice}>₹{item.price * item.quantity}</Text>
                    </View>
                  ))}
                </View>

                {/* Total */}
                <View style={styles.orderTotal}>
                  <Text style={styles.orderTotalLabel}>Total Amount</Text>
                  <Text style={styles.orderTotalAmount}>₹{selectedTable.orderAmount}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.orderActions}>
                  <TouchableOpacity
                    style={styles.actionButtonPrimary}
                    onPress={() => {
                      if (selectedTable) {
                        setTables(prev => prev.map(t =>
                          t.id === selectedTable.id
                            ? { ...t, isServed: !t.isServed }
                            : t
                        ));
                        setSelectedTable({ ...selectedTable, isServed: !selectedTable.isServed });
                      }
                    }}
                  >
                    <ShoppingBag size={18} color="#FFFFFF" />
                    <Text style={styles.actionButtonPrimaryText}>
                      {selectedTable.isServed ? 'Mark as Pending' : 'Mark as Served'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.paymentButton, !selectedTable.isServed && styles.paymentButtonDisabled]}
                  disabled={!selectedTable.isServed}
                >
                  <Text style={[styles.paymentButtonText, !selectedTable.isServed && styles.paymentButtonTextDisabled]}>
                    {selectedTable.isServed ? 'Proceed to Payment' : 'Payment Locked (Not Served)'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusContainer: {
    marginBottom: 16,
    flexGrow: 0,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusChipActive: {
    backgroundColor: '#FDB813',
    borderColor: '#FDB813',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusTextActive: {
    color: '#FFFFFF',
  },
  tablesList: {
    flex: 1,
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  tableCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  tableNumber: {
    marginBottom: 8,
  },
  tableNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  tableCapacity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  tableCapacityText: {
    fontSize: 12,
    color: '#6B7280',
  },
  tableStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  tableStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tableDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  tableDurationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  tableAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Order Details Modal Styles
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderTableText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderIdText: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  orderDurationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 16,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  orderItemsSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  orderItemQuantity: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    minWidth: 30,
  },
  orderItemName: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    marginBottom: 20,
  },
  orderTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#047857',
  },
  orderTotalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#047857',
  },
  orderActions: {
    marginBottom: 12,
  },
  actionButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paymentButton: {
    backgroundColor: '#FDB813',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paymentButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  paymentButtonTextDisabled: {
    color: '#9CA3AF',
  },
  servedToggle: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  servedToggleActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  servedToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  servedToggleTextActive: {
    color: '#047857',
  },
  minusButton: {
    width: 24,
    height: 24,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  minusButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
});
