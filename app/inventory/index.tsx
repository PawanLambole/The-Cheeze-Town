import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, AlertCircle, TrendingUp, TrendingDown, Plus, Minus, X } from 'lucide-react-native';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  lastRestocked: string;
}

export default function InventoryScreen() {
  const router = useRouter();
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');

  // Add item form fields
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemStock, setNewItemStock] = useState('');
  const [newItemMinStock, setNewItemMinStock] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('kg');

  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: '1', name: 'Cheese Burger Patty', category: 'Main Course', currentStock: 45, minStock: 20, unit: 'pcs', lastRestocked: '2 days ago' },
    { id: '2', name: 'Potatoes', category: 'Vegetables', currentStock: 60, minStock: 30, unit: 'kg', lastRestocked: '1 day ago' },
    { id: '3', name: 'Coffee Beans', category: 'Beverages', currentStock: 15, minStock: 10, unit: 'kg', lastRestocked: '5 days ago' },
    { id: '4', name: 'Chocolate', category: 'Desserts', currentStock: 8, minStock: 15, unit: 'kg', lastRestocked: '3 days ago' },
    { id: '5', name: 'Lettuce', category: 'Vegetables', currentStock: 25, minStock: 10, unit: 'kg', lastRestocked: '1 day ago' },
    { id: '6', name: 'Burger Buns', category: 'Bakery', currentStock: 12, minStock: 20, unit: 'pcs', lastRestocked: '4 days ago' },
  ]);

  const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock);

  const handleAdjustStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowAdjustModal(true);
  };

  const handleAddItem = () => {
    if (!newItemName.trim() || !newItemCategory.trim() || !newItemStock || !newItemMinStock) {
      return;
    }

    const newItem: InventoryItem = {
      id: String(Date.now()),
      name: newItemName.trim(),
      category: newItemCategory.trim(),
      currentStock: parseFloat(newItemStock),
      minStock: parseFloat(newItemMinStock),
      unit: newItemUnit,
      lastRestocked: 'Just now',
    };

    setInventory(prev => [newItem, ...prev]);
    setShowAddModal(false);
    // Reset form
    setNewItemName('');
    setNewItemCategory('');
    setNewItemStock('');
    setNewItemMinStock('');
    setNewItemUnit('kg');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Plus size={24} color="#FDB813" />
        </TouchableOpacity>
      </View>


      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.alertCard}>
          <AlertCircle size={20} color="#EF4444" />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{lowStockItems.length} Low Stock Items</Text>
            <Text style={styles.alertText}>Items need restocking</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{inventory.length}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{lowStockItems.length}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
        </View>

        {lowStockItems.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Low Stock Alert</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lowStockList}>
              {lowStockItems.map(item => (
                <View key={item.id} style={styles.lowStockCard}>
                  <Text style={styles.lowStockName}>{item.name}</Text>
                  <Text style={styles.lowStockAmount}>{item.currentStock} {item.unit}</Text>
                  <Text style={styles.lowStockMin}>Min: {item.minStock} {item.unit}</Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        <Text style={styles.sectionTitle}>All Inventory</Text>

        {inventory.map(item => {
          const isLowStock = item.currentStock <= item.minStock;
          const stockPercentage = (item.currentStock / item.minStock) * 100;

          return (
            <View key={item.id} style={styles.inventoryCard}>
              <View style={styles.inventoryInfo}>
                <View style={styles.inventoryHeader}>
                  <Text style={styles.inventoryName}>{item.name}</Text>
                  {isLowStock && <AlertCircle size={16} color="#EF4444" />}
                </View>
                <Text style={styles.inventoryCategory}>{item.category}</Text>
                <View style={styles.stockInfo}>
                  <Text style={[styles.stockAmount, isLowStock && styles.stockAmountLow]}>
                    {item.currentStock} {item.unit}
                  </Text>
                  <Text style={styles.stockMin}>Min: {item.minStock} {item.unit}</Text>
                </View>
                <View style={styles.stockBar}>
                  <View
                    style={[
                      styles.stockBarFill,
                      {
                        width: `${Math.min(stockPercentage, 100)}%`,
                        backgroundColor: isLowStock ? '#EF4444' : '#10B981',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.lastRestocked}>Last restocked: {item.lastRestocked}</Text>
              </View>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => handleAdjustStock(item)}
              >
                <Text style={styles.adjustButtonText}>Adjust</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Bottom padding for comfortable scrolling */}
        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal visible={showAdjustModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adjust Stock</Text>
              <TouchableOpacity onPress={() => setShowAdjustModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <>
                <View style={styles.modalItem}>
                  <Text style={styles.modalItemName}>{selectedItem.name}</Text>
                  <Text style={styles.modalItemStock}>
                    Current Stock: {selectedItem.currentStock} {selectedItem.unit}
                  </Text>
                </View>

                <View style={styles.adjustmentControls}>
                  <TouchableOpacity style={styles.adjustmentButton}>
                    <Minus size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.adjustmentInput}
                    placeholder="Enter amount"
                    placeholderTextColor="#9CA3AF"
                    value={adjustmentAmount}
                    onChangeText={setAdjustmentAmount}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity style={styles.adjustmentButton}>
                    <Plus size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.reasonInput}
                  placeholder="Reason for adjustment (optional)"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />

                <TouchableOpacity style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>Save Adjustment</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Item Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Item</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Item Name"
                placeholderTextColor="#9CA3AF"
                value={newItemName}
                onChangeText={setNewItemName}
              />

              <TextInput
                style={styles.input}
                placeholder="Category"
                placeholderTextColor="#9CA3AF"
                value={newItemCategory}
                onChangeText={setNewItemCategory}
              />

              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Current Stock"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={newItemStock}
                  onChangeText={setNewItemStock}
                />

                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Min Stock"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={newItemMinStock}
                  onChangeText={setNewItemMinStock}
                />
              </View>

              <Text style={styles.inputLabel}>Unit:</Text>
              <View style={styles.unitSelector}>
                {['kg', 'g', 'L', 'ml', 'pcs'].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.unitOption,
                      newItemUnit === unit && styles.unitOptionActive
                    ]}
                    onPress={() => setNewItemUnit(unit)}
                  >
                    <Text style={[
                      styles.unitOptionText,
                      newItemUnit === unit && styles.unitOptionTextActive
                    ]}>
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleAddItem}>
                <Text style={styles.saveButtonText}>Add Item</Text>
              </TouchableOpacity>
            </ScrollView>
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
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  alertContent: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 2,
  },
  alertText: {
    fontSize: 12,
    color: '#DC2626',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  lowStockList: {
    marginBottom: 16,
    flexGrow: 0,
  },
  lowStockCard: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#FDB813',
  },
  lowStockName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  lowStockAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 2,
  },
  lowStockMin: {
    fontSize: 11,
    color: '#92400E',
  },
  inventoryList: {
    flex: 1,
  },
  inventoryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  inventoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  inventoryCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  stockInfo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  stockAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  stockAmountLow: {
    color: '#EF4444',
  },
  stockMin: {
    fontSize: 14,
    color: '#6B7280',
  },
  stockBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  stockBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  lastRestocked: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  adjustButton: {
    backgroundColor: '#FDB813',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  adjustButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
  modalItem: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalItemStock: {
    fontSize: 14,
    color: '#6B7280',
  },
  adjustmentControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  adjustmentButton: {
    backgroundColor: '#FDB813',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustmentInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
  },
  reasonInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#FDB813',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  unitSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  unitOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  unitOptionActive: {
    backgroundColor: '#FDB813',
    borderColor: '#FDB813',
  },
  unitOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  unitOptionTextActive: {
    color: '#FFFFFF',
  },
});
