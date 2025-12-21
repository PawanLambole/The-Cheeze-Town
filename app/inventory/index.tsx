import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, AlertCircle, TrendingUp, TrendingDown, Plus, Minus, X } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  lastRestocked: string;
}

interface InventoryScreenProps {
  showBack?: boolean;
}

export default function InventoryScreen({ showBack = true }: InventoryScreenProps) {
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

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.dark.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Plus size={24} color={Colors.dark.primary} />
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
                <X size={24} color={Colors.dark.textSecondary} />
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
                    <Minus size={24} color="#000000" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.adjustmentInput}
                    placeholder="Enter amount"
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={adjustmentAmount}
                    onChangeText={setAdjustmentAmount}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity style={styles.adjustmentButton}>
                    <Plus size={24} color="#000000" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.reasonInput}
                  placeholder="Reason for adjustment (optional)"
                  placeholderTextColor={Colors.dark.textSecondary}
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
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Item Name"
                placeholderTextColor={Colors.dark.textSecondary}
                value={newItemName}
                onChangeText={setNewItemName}
              />

              <TextInput
                style={styles.input}
                placeholder="Category"
                placeholderTextColor={Colors.dark.textSecondary}
                value={newItemCategory}
                onChangeText={setNewItemCategory}
              />

              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Current Stock"
                  placeholderTextColor={Colors.dark.textSecondary}
                  keyboardType="numeric"
                  value={newItemStock}
                  onChangeText={setNewItemStock}
                />

                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Min Stock"
                  placeholderTextColor={Colors.dark.textSecondary}
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
    </View>
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
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
    color: '#EF4444',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    padding: 16,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  lowStockList: {
    marginBottom: 16,
    flexGrow: 0,
  },
  lowStockCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  lowStockName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  lowStockAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.primary,
    marginBottom: 2,
  },
  lowStockMin: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  inventoryList: {
    flex: 1,
  },
  inventoryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
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
    color: Colors.dark.text,
  },
  inventoryCategory: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
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
    color: Colors.dark.textSecondary,
  },
  stockBar: {
    height: 6,
    backgroundColor: Colors.dark.border,
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
    color: Colors.dark.textSecondary,
  },
  adjustButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  adjustButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
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
  modalItem: {
    backgroundColor: Colors.dark.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  modalItemStock: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  adjustmentControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  adjustmentButton: {
    backgroundColor: Colors.dark.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustmentInput: {
    flex: 1,
    backgroundColor: Colors.dark.inputBackground,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.dark.text,
    textAlign: 'center',
  },
  reasonInput: {
    backgroundColor: Colors.dark.inputBackground,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
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
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.inputBackground,
  },
  unitOptionActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  unitOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark.textSecondary,
  },
  unitOptionTextActive: {
    color: '#000000',
    fontWeight: 'bold',
  },
});
