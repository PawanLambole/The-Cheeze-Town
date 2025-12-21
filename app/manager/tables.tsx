import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Clock, Plus, X, ShoppingBag, User } from 'lucide-react-native';
import PaymentModal from '../../components/PaymentModal';
import { printPaymentReceipt } from '../../services/thermalPrinter';
import ReceiptViewer from '../../components/ReceiptViewer';
import { Colors } from '@/constants/Theme';

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
  isPaid?: boolean;
  transactionId?: string;
  paymentMethod?: string;
}

export default function TablesScreen() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState('');

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
      // No order info for new table
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
          <ArrowLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Table Management</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Plus size={24} color={Colors.dark.primary} />
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
                style={styles.tableWrapper}
              >
                {/* Top Chair */}
                <View style={styles.chairTop} />

                {/* Table Surface */}
                <View style={[
                  styles.tableSurface,
                  table.status === 'occupied' && styles.tableSurfaceOccupied
                ]}>

                  <View style={styles.tableHeader}>
                    <Text style={[
                      styles.tableNumberText,
                      table.status === 'occupied' && { color: Colors.dark.text }
                    ]}>Table {table.number}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: table.status === 'available' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        { color: table.status === 'available' ? '#10B981' : '#EF4444' }
                      ]}>{table.status}</Text>
                    </View>
                  </View>

                  <View style={styles.tableInfoRow}>
                    <Users size={14} color={Colors.dark.textSecondary} />
                    <Text style={styles.tableInfoText}>{table.capacity} Seats</Text>
                  </View>

                  {table.status === 'occupied' && (
                    <View style={styles.activeOrderInfo}>
                      <View style={styles.tableInfoRow}>
                        <Clock size={14} color={Colors.dark.textSecondary} />
                        <Text style={styles.tableInfoText}>{table.duration}</Text>
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
                        <Text style={[
                          styles.servedToggleText,
                          table.isServed && styles.servedToggleTextActive
                        ]}>
                          {table.isServed ? '✓ Served' : 'Pending'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Bottom Chair */}
                <View style={styles.chairBottom} />
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
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Table Number *"
              placeholderTextColor={Colors.dark.textSecondary}
              keyboardType="numeric"
              value={newTableNumber}
              onChangeText={setNewTableNumber}
            />

            <TextInput
              style={styles.input}
              placeholder="Seating Capacity *"
              placeholderTextColor={Colors.dark.textSecondary}
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

      {/* Payment Modal */}
      {selectedTable && (
        <PaymentModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderId={selectedTable.orderId || `TABLE_${selectedTable.number}`}
          amount={selectedTable.orderAmount || 0}
          customerName={selectedTable.customerName}
          onPaymentSuccess={async (transactionId, method) => {
            console.log('Payment successful:', { transactionId, method, tableId: selectedTable.id });

            // Generate payment receipt before clearing table data
            try {
              const paymentData = {
                orderId: selectedTable.orderId || `TABLE_${selectedTable.number}`,
                tableNo: selectedTable.number,
                customerName: selectedTable.customerName,
                items: selectedTable.items || [],
                subtotal: selectedTable.orderAmount || 0,
                tax: 0,
                discount: 0,
                totalAmount: selectedTable.orderAmount || 0,
                paymentMethod: method,
                transactionId: transactionId,
                timestamp: new Date(),
                orderType: 'dine-in' as const
              };

              const receiptResult = await printPaymentReceipt(paymentData);

              if (receiptResult.success && receiptResult.receipt) {
                setCurrentReceipt(receiptResult.receipt);
                setShowReceipt(true);
              }
            } catch (error) {
              console.error('Error generating payment receipt:', error);
            }

            // Update table status to available after payment (order is completed)
            setTables(prev => prev.map(t =>
              t.id === selectedTable.id
                ? {
                  ...t,
                  status: 'available' as const,
                  orderAmount: undefined,
                  duration: undefined,
                  orderId: undefined,
                  customerName: undefined,
                  items: undefined,
                  isServed: undefined,
                  isPaid: undefined,
                  transactionId: undefined,
                  paymentMethod: undefined
                }
                : t
            ));
            setShowPaymentModal(false);
            setShowOrderModal(false);
          }}
        />
      )}

      {/* Receipt Viewer */}
      <ReceiptViewer
        visible={showReceipt}
        onClose={() => setShowReceipt(false)}
        receipt={currentReceipt}
        title="Payment Receipt"
      />

      {/* Order Details Modal used when clicking occupied table */}
      <Modal visible={showOrderModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setShowOrderModal(false)}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedTable && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.orderHeaderCard}>
                  <View style={styles.orderHeaderLeft}>
                    <Text style={styles.orderTableText}>Table {selectedTable.number}</Text>
                    <Text style={styles.orderIdText}>#{selectedTable.orderId}</Text>
                  </View>
                  <View style={styles.orderDurationBadge}>
                    <Clock size={14} color="#F59E0B" />
                    <Text style={styles.orderDurationText}>{selectedTable.duration}</Text>
                  </View>
                </View>

                {selectedTable.customerName && (
                  <View style={styles.customerInfo}>
                    <User size={16} color={Colors.dark.textSecondary} />
                    <Text style={styles.customerName}>{selectedTable.customerName}</Text>
                  </View>
                )}

                <View style={styles.orderItemsSection}>
                  <Text style={styles.sectionLabel}>Items</Text>
                  {selectedTable.items?.map((item, index) => (
                    <View key={index} style={styles.orderItem}>
                      <View style={styles.orderItemLeft}>
                        <Text style={styles.orderItemQuantity}>{item.quantity}x</Text>
                        <Text style={styles.orderItemName}>{item.name}</Text>
                      </View>
                      <Text style={styles.orderItemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                    </View>
                  ))}
                  <View style={{ height: 1, backgroundColor: Colors.dark.border, marginVertical: 8 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ color: Colors.dark.textSecondary }}>Subtotal</Text>
                    <Text style={{ color: Colors.dark.text, fontWeight: '600' }}>₹{selectedTable.orderAmount}</Text>
                  </View>
                </View>

                <View style={styles.orderTotal}>
                  <Text style={styles.orderTotalLabel}>Total Amount</Text>
                  <Text style={styles.orderTotalAmount}>₹{selectedTable.orderAmount}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.paymentButton, !selectedTable.isServed && styles.paymentButtonDisabled]}
                  onPress={() => {
                    if (selectedTable.isServed) {
                      setShowPaymentModal(true);
                    }
                  }}
                  disabled={!selectedTable.isServed}
                >
                  <Text style={styles.paymentButtonText}>
                    {selectedTable.isServed ? 'Process Payment' : 'Mark as Served First'}
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  statusContainer: {
    marginBottom: 16,
    flexGrow: 0,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statusChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark.textSecondary,
  },
  statusTextActive: {
    color: '#000000',
    fontWeight: 'bold',
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
  tableWrapper: {
    width: '48%',
    marginBottom: 20,
    alignItems: 'center',
  },
  chairTop: {
    width: '60%',
    height: 8,
    backgroundColor: '#2D2D2D',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginBottom: -2,
    zIndex: 1,
  },
  chairBottom: {
    width: '60%',
    height: 8,
    backgroundColor: '#2D2D2D',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginTop: -2,
    zIndex: 1,
  },
  tableSurface: {
    width: '100%',
    backgroundColor: Colors.dark.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    minHeight: 100,
  },
  tableSurfaceOccupied: {
    borderColor: Colors.dark.primary,
    borderWidth: 2,
    backgroundColor: '#2A2518', // Slight tint for occupied
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tableNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  tableInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  tableInfoText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
  },
  activeOrderInfo: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    paddingTop: 8,
  },
  tableAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark.primary,
    marginVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.dark.border,
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
    color: Colors.dark.text,
  },
  input: {
    backgroundColor: Colors.dark.inputBackground,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  orderHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderTableText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  orderIdText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  orderDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  orderDurationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 8,
    marginBottom: 16,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark.text,
  },
  orderItemsSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
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
    color: Colors.dark.textSecondary,
    minWidth: 30,
  },
  orderItemName: {
    fontSize: 14,
    color: Colors.dark.text,
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  orderTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  orderTotalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  paymentButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  paymentButtonDisabled: {
    backgroundColor: Colors.dark.secondary,
    opacity: 0.6,
  },
  servedToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignSelf: 'flex-start',
  },
  servedToggleActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  servedToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
  },
  servedToggleTextActive: {
    color: '#FFFFFF',
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
