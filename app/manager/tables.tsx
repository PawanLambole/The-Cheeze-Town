import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Clock, Plus, X, ShoppingBag, User, Edit2, Trash2, MoreVertical, QrCode } from 'lucide-react-native';
import PaymentModal from '../../components/PaymentModal';
import { printPaymentReceipt } from '../../services/thermalPrinter';
import ReceiptViewer from '../../components/ReceiptViewer';
import { Colors } from '@/constants/Theme';
import { database, supabase } from '@/services/database';

interface OrderItem {
  id: number;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: number;
  order_number: string;
  table_id: number;
  status: string;
  total_amount: number;
  order_time: string;
  created_at: string;
  order_items?: OrderItem[];
}

interface Table {
  id: number;
  table_number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  current_order_id?: number;
  location?: string;
  // Computed fields from order
  order?: Order;
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('');
  const [editTableNumber, setEditTableNumber] = useState('');
  const [editTableCapacity, setEditTableCapacity] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTableActions, setShowTableActions] = useState<number | null>(null);

  const statusOptions = ['all', 'available', 'occupied'];

  const [tables, setTables] = useState<Table[]>([]);

  // Fetch tables from database
  useEffect(() => {
    fetchTables();

    // Set up real-time subscription
    const subscription = database.subscribe('restaurant_tables', () => {
      fetchTables();
    });

    return () => {
      database.unsubscribe(subscription);
    };
  }, []);

  const fetchTables = async () => {
    if (!loading && !refreshing) setRefreshing(true);
    try {
      // 1. Fetch tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('restaurant_tables')
        .select('*')
        .order('table_number', { ascending: true });

      if (tablesError) throw tablesError;

      // 2. Fetch active orders manually
      const activeOrderIds = tablesData
        ?.filter(t => t.current_order_id !== null)
        .map(t => t.current_order_id as number) || [];

      let ordersMap: Record<string, any> = {};

      if (activeOrderIds.length > 0) {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .in('id', activeOrderIds);

        if (ordersError) throw ordersError;

        // 3. Fetch items for these orders
        const ordersWithItems = await Promise.all((ordersData || []).map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('id, menu_item_name, quantity, unit_price, total_price')
            .eq('order_id', order.id);

          return {
            ...order,
            order_items: items
          };
        }));

        ordersMap = ordersWithItems.reduce((acc: any, order) => {
          acc[order.id] = order;
          return acc;
        }, {});
      }

      // Transform data to match UI expectations
      const transformedTables: Table[] = (tablesData || []).map(table => {
        const orderRaw = table.current_order_id ? ordersMap[table.current_order_id] : null;

        // Map raw order to Order interface if needed, or just use properties
        let order: Order | undefined;
        let items: any[] = [];

        if (orderRaw) {
          items = (orderRaw.order_items || []).map((i: any) => ({
            name: i.menu_item_name,
            quantity: i.quantity,
            price: i.unit_price // Note: using unit_price as price
          }));

          order = {
            id: orderRaw.id,
            order_number: orderRaw.order_number,
            table_id: orderRaw.table_id,
            status: orderRaw.status,
            total_amount: orderRaw.total_amount,
            order_time: orderRaw.created_at, // mapped to order_time
            created_at: orderRaw.created_at,
            order_items: orderRaw.order_items
          };
        }

        const isServed = order?.status === 'ready' || order?.status === 'served';

        return {
          ...table,
          status: (table.status || 'available') as Table['status'],
          current_order_id: table.current_order_id === null ? undefined : table.current_order_id,
          location: table.location === null ? undefined : table.location,
          order: order || undefined, // explicit undefined needed?
          orderAmount: order?.total_amount,
          orderId: order?.order_number,
          duration: order ? calculateDuration(order.created_at) : undefined,
          items: items,
          isServed,
        };
      });

      setTables(transformedTables);

    } catch (error) {
      console.error('Error fetching tables:', JSON.stringify(error, null, 2));
      Alert.alert('Error', 'Failed to load tables');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateDuration = (createdAt: string) => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMs = now.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}min`;
    }
  };

  const filteredTables = tables.filter(table =>
    selectedStatus === 'all' || table.status === selectedStatus
  );

  const handleAddTable = async () => {
    if (!newTableNumber || !newTableCapacity) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const tableNumber = parseInt(newTableNumber);
    const capacity = parseInt(newTableCapacity);

    // Check if table number already exists
    if (tables.find(t => t.table_number === tableNumber)) {
      Alert.alert('Error', 'Table number already exists');
      return;
    }

    try {
      const { data, error } = await database.insert('restaurant_tables', {
        table_number: tableNumber,
        capacity: capacity,
        status: 'available',
        location: 'indoor'
      });

      if (error) {
        console.error('Error adding table:', error);
        Alert.alert('Error', 'Failed to add table');
      } else {
        setShowAddModal(false);
        setNewTableNumber('');
        setNewTableCapacity('');
        // Table will be added via real-time subscription
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to add table');
    }
  };

  const handleEditTable = async () => {
    if (!selectedTable || !editTableNumber || !editTableCapacity) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const tableNumber = parseInt(editTableNumber);
    const capacity = parseInt(editTableCapacity);

    // Check if table number already exists (excluding current table)
    if (tables.find(t => t.table_number === tableNumber && t.id !== selectedTable.id)) {
      Alert.alert('Error', 'Table number already exists');
      return;
    }

    try {
      const { error } = await database.update('restaurant_tables', selectedTable.id, {
        table_number: tableNumber,
        capacity: capacity,
      });

      if (error) {
        console.error('Error updating table:', error);
        Alert.alert('Error', 'Failed to update table');
      } else {
        setShowEditModal(false);
        setEditTableNumber('');
        setEditTableCapacity('');
        setSelectedTable(null);
        // Table will be updated via real-time subscription
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to update table');
    }
  };

  const handleDeleteTable = async () => {
    if (!selectedTable) return;

    // Check if table is occupied
    if (selectedTable.status === 'occupied') {
      Alert.alert('Cannot Delete', 'Cannot delete an occupied table. Please complete the order first.');
      return;
    }

    try {
      const { error } = await database.delete('restaurant_tables', selectedTable.id);

      if (error) {
        console.error('Error deleting table:', error);
        Alert.alert('Error', 'Failed to delete table');
      } else {
        setShowDeleteModal(false);
        setSelectedTable(null);
        // Table will be removed via real-time subscription
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to delete table');
    }
  };

  const handleEditClick = (table: Table) => {
    setSelectedTable(table);
    setEditTableNumber(table.table_number.toString());
    setEditTableCapacity(table.capacity.toString());
    setShowEditModal(true);
    setShowTableActions(null);
  };

  const handleDeleteClick = (table: Table) => {
    setSelectedTable(table);
    setShowDeleteModal(true);
    setShowTableActions(null);
  };

  const handleTableClick = (table: Table) => {
    // Close any open dropdowns
    setShowTableActions(null);

    if (table.status === 'occupied') {
      setSelectedTable(table);
      setShowOrderModal(true);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
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

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
            <Text style={styles.loadingText}>Loading tables...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.tablesList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={fetchTables}
                tintColor={Colors.dark.primary}
                colors={[Colors.dark.primary]}
              />
            }
          >
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
                      <View style={{ flex: 1 }}>
                        <Text style={[
                          styles.tableNumberText,
                          table.status === 'occupied' && { color: Colors.dark.text }
                        ]}>Table {table.table_number}</Text>
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

                      {/* Action Menu for Available Tables */}
                      {table.status === 'available' && (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            setShowTableActions(showTableActions === table.id ? null : table.id);
                          }}
                          style={styles.actionMenuButton}
                        >
                          <MoreVertical size={16} color={Colors.dark.textSecondary} />
                        </TouchableOpacity>
                      )}

                      {/* Actions Dropdown */}
                      {showTableActions === table.id && (
                        <View style={styles.actionsDropdown}>
                          <TouchableOpacity
                            style={styles.actionItem}
                            onPress={(e) => {
                              e.stopPropagation();
                              router.push(`/manager/tables/${table.id}` as any);
                              setShowTableActions(null);
                            }}
                          >
                            <QrCode size={14} color={Colors.dark.primary} />
                            <Text style={styles.actionText}>View QR Code</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionItem}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleEditClick(table);
                            }}
                          >
                            <Edit2 size={14} color={Colors.dark.primary} />
                            <Text style={styles.actionText}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionItem, { borderTopWidth: 1, borderTopColor: Colors.dark.border }]}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(table);
                            }}
                          >
                            <Trash2 size={14} color="#EF4444" />
                            <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      )}
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
                          onPress={async (e) => {
                            e.stopPropagation();
                            if (table.order?.id) {
                              try {
                                const newStatus = table.isServed ? 'preparing' : 'ready';
                                await database.update('orders', table.order.id, { status: newStatus });
                                // Will refresh via subscription
                              } catch (error) {
                                console.error('Error updating order:', error);
                              }
                            }
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
        )}
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

            {/* Table Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Table Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter table number"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="numeric"
                value={newTableNumber}
                onChangeText={setNewTableNumber}
              />
              <Text style={styles.inputHint}>Unique identifier for this table</Text>
            </View>

            {/* Capacity Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Seating Capacity *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter number of seats"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="numeric"
                value={newTableCapacity}
                onChangeText={setNewTableCapacity}
              />
              <Text style={styles.inputHint}>Maximum number of guests for this table</Text>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleAddTable}>
              <Text style={styles.addButtonText}>Add Table & Generate QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Table Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Table</Text>
              <TouchableOpacity onPress={() => { setShowEditModal(false); setEditTableNumber(''); setEditTableCapacity(''); setSelectedTable(null); }}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Current Info Display */}
            {selectedTable && (
              <View style={styles.currentInfoCard}>
                <Text style={styles.currentInfoLabel}>Currently:</Text>
                <Text style={styles.currentInfoText}>
                  Table {selectedTable.table_number} • {selectedTable.capacity} Seats
                </Text>
              </View>
            )}

            {/* Table Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Table Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter table number"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="numeric"
                value={editTableNumber}
                onChangeText={setEditTableNumber}
              />
              <Text style={styles.inputHint}>Unique identifier for this table</Text>
            </View>

            {/* Capacity Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Seating Capacity</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter number of seats"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="numeric"
                value={editTableCapacity}
                onChangeText={setEditTableCapacity}
              />
              <Text style={styles.inputHint}>Maximum number of guests for this table</Text>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleEditTable}>
              <Text style={styles.addButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            {/* Warning Icon */}
            <View style={styles.deleteIconContainer}>
              <Trash2 size={48} color="#EF4444" />
            </View>

            {/* Title */}
            <Text style={styles.deleteModalTitle}>Delete Table?</Text>

            {/* Message */}
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete{' '}
              <Text style={styles.deleteHighlight}>
                Table {selectedTable?.table_number}
              </Text>
              {selectedTable?.capacity && (
                <Text> ({selectedTable.capacity} seats)</Text>
              )}
              ?
            </Text>

            {/* Warning */}
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ This action cannot be undone
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.cancelDeleteButton}
                onPress={() => {
                  setShowDeleteModal(false);
                  setSelectedTable(null);
                }}
              >
                <Text style={styles.cancelDeleteText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={handleDeleteTable}
              >
                <Trash2 size={18} color="#FFFFFF" />
                <Text style={styles.confirmDeleteText}>Delete Table</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      {
        selectedTable && (
          <PaymentModal
            visible={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            orderId={selectedTable.orderId || `TABLE_${selectedTable.table_number}`}
            amount={selectedTable.orderAmount || 0}
            customerName={selectedTable.customerName}
            onPaymentSuccess={async (transactionId, method) => {
              console.log('Payment successful:', { transactionId, method, tableId: selectedTable.id });

              // Generate payment receipt
              try {
                const paymentData = {
                  orderId: selectedTable.orderId || `TABLE_${selectedTable.table_number}`,
                  tableNo: selectedTable.table_number,
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

              // Update order and table in database
              if (selectedTable.order?.id) {
                try {
                  await database.update('orders', selectedTable.order.id, {
                    status: 'completed',
                    completed_time: new Date().toISOString()
                  });
                  await database.update('restaurant_tables', selectedTable.id, {
                    status: 'available',
                    current_order_id: null
                  });
                } catch (error) {
                  console.error('Error completing order:', error);
                }
              }
              setShowPaymentModal(false);
              setShowOrderModal(false);
            }}
          />
        )
      }

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
                    <Text style={styles.orderTableText}>Table {selectedTable.table_number}</Text>
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
    </View >
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    marginTop: 16,
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
  actionMenuButton: {
    padding: 4,
    borderRadius: 4,
  },
  actionsDropdown: {
    position: 'absolute',
    top: 30,
    right: 0,
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark.text,
  },
  deleteConfirmText: {
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteWarningText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  deleteButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.dark.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currentInfoCard: {
    backgroundColor: Colors.dark.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  currentInfoLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  currentInfoText: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputHint: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 6,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  // Delete Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContent: {
    backgroundColor: Colors.dark.card,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteModalMessage: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  deleteHighlight: {
    color: Colors.dark.primary,
    fontWeight: '700',
  },
  warningBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  warningText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelDeleteButton: {
    flex: 1,
    backgroundColor: Colors.dark.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cancelDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmDeleteText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
