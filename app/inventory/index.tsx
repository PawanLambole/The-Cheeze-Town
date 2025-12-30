import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, AlertCircle, TrendingUp, TrendingDown, Plus, Minus, X, Trash } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { database, supabase } from '@/services/database';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';

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
  const { t } = useTranslation();
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

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInventory = async () => {
    if (!refreshing) setRefreshing(true);
    try {
      const { data } = await supabase.from('inventory').select('*').order('item_name');
      if (data) {
        setInventory(data.map((i: any) => ({
          id: String(i.id),
          name: i.item_name,
          category: i.category,
          currentStock: Number(i.quantity),
          minStock: Number(i.min_stock),
          unit: i.unit,
          lastRestocked: 'Recently'
        })));
      }
    } catch (e) {
      console.error("Error fetching inventory", e);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInventory();
    }, [])
  );

  const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock);

  const handleAdjustStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentAmount(String(item.currentStock));
    setShowAdjustModal(true);
  };

  const handleDelete = (item: InventoryItem) => {
    Alert.alert(
      t('inventory.deleteConfirmTitle'),
      t('inventory.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('inventory.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('inventory').delete().eq('id', Number(item.id));
              if (error) throw error;
              fetchInventory();
            } catch (e) {
              console.error("Error deleting item", e);
              alert(t('inventory.errors.deleteFailed'));
            }
          }
        }
      ]
    );
  };

  const handleAddItem = async () => {
    if (!newItemName.trim() || !newItemCategory.trim() || !newItemStock || !newItemMinStock) {
      return;
    }

    try {
      const newItem = {
        item_name: newItemName.trim(),
        category: newItemCategory.trim(),
        quantity: parseFloat(newItemStock),
        min_stock: parseFloat(newItemMinStock),
        unit: newItemUnit
      };

      const { error } = await supabase.from('inventory').insert([newItem]);
      if (error) throw error;

      fetchInventory();
      setShowAddModal(false);
      // Reset form
      setNewItemName('');
      setNewItemCategory('');
      setNewItemStock('');
      setNewItemMinStock('');
      setNewItemUnit('kg');
    } catch (e) {
      console.error("Error adding inventory item", e);
      alert(t('inventory.errors.addFailed'));
    }
  };

  const handleSaveAdjustment = async () => {
    if (!selectedItem) return;
    const newStock = parseFloat(adjustmentAmount);
    if (isNaN(newStock)) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .update({ quantity: newStock })
        .eq('id', Number(selectedItem.id));

      if (error) throw error;

      fetchInventory();
      setShowAdjustModal(false);
      setSelectedItem(null);
      setAdjustmentAmount('');
    } catch (e) {
      console.error("Error adjusting stock", e);
      alert(t('inventory.errors.adjustFailed'));
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          {showBack && (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerTitle}>{t('inventory.title')}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Plus size={24} color={Colors.dark.primary} />
          </TouchableOpacity>
        </View>
      </View>


      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchInventory}
            tintColor={Colors.dark.primary}
            colors={[Colors.dark.primary]}
          />
        }
      >
        {lowStockItems.length > 0 && (
          <View style={styles.alertCard}>
            <AlertCircle size={20} color="#EF4444" />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{lowStockItems.length} {t('inventory.lowStockItems')}</Text>
              <Text style={styles.alertText}>{t('inventory.itemsNeedRestocking')}</Text>
            </View>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{inventory.length}</Text>
            <Text style={styles.statLabel}>{t('inventory.totalItems')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{lowStockItems.length}</Text>
            <Text style={styles.statLabel}>{t('inventory.lowStock')}</Text>
          </View>
        </View>

        {lowStockItems.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('inventory.lowStockAlert')}</Text>
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

        <Text style={styles.sectionTitle}>{t('inventory.allInventory')}</Text>

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
                <Text style={styles.lastRestocked}>{t('inventory.lastUpdated')}: {item.lastRestocked}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => handleAdjustStock(item)}
                >
                  <Text style={styles.adjustButtonText}>{t('inventory.adjust')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item)}
                >
                  <Trash size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
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
              <Text style={styles.modalTitle}>{t('inventory.adjustStock')}</Text>
              <TouchableOpacity onPress={() => setShowAdjustModal(false)}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <>
                <View style={styles.modalItem}>
                  <Text style={styles.modalItemName}>{selectedItem.name}</Text>
                  <Text style={styles.modalItemStock}>
                    {t('inventory.currentStock')}: {selectedItem.currentStock} {selectedItem.unit}
                  </Text>
                </View>

                <View style={styles.adjustmentControls}>
                  <TouchableOpacity style={styles.adjustmentButton} onPress={() => setAdjustmentAmount(String(Math.max(0, Number(adjustmentAmount || 0) - 1)))}>
                    <Minus size={24} color="#000000" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.adjustmentInput}
                    placeholder={t('inventory.enterAmount')}
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={adjustmentAmount}
                    onChangeText={setAdjustmentAmount}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity style={styles.adjustmentButton} onPress={() => setAdjustmentAmount(String(Number(adjustmentAmount || 0) + 1))}>
                    <Plus size={24} color="#000000" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.reasonInput}
                  placeholder={t('inventory.reasonForAdjustment')}
                  placeholderTextColor={Colors.dark.textSecondary}
                  multiline
                />

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveAdjustment}>
                  <Text style={styles.saveButtonText}>{t('inventory.saveAdjustment')}</Text>
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
              <Text style={styles.modalTitle}>{t('inventory.addNewItem')}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder={t('inventory.itemName')}
                placeholderTextColor={Colors.dark.textSecondary}
                value={newItemName}
                onChangeText={setNewItemName}
              />

              <TextInput
                style={styles.input}
                placeholder={t('inventory.category')}
                placeholderTextColor={Colors.dark.textSecondary}
                value={newItemCategory}
                onChangeText={setNewItemCategory}
              />

              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder={t('inventory.currentStock')}
                  placeholderTextColor={Colors.dark.textSecondary}
                  keyboardType="numeric"
                  value={newItemStock}
                  onChangeText={setNewItemStock}
                />

                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder={t('inventory.minStock')}
                  placeholderTextColor={Colors.dark.textSecondary}
                  keyboardType="numeric"
                  value={newItemMinStock}
                  onChangeText={setNewItemMinStock}
                />
              </View>

              <Text style={styles.inputLabel}>{t('inventory.unit')}:</Text>
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
                <Text style={styles.saveButtonText}>{t('inventory.addItem')}</Text>
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
    textAlign: 'center',
    flex: 1,
  },
  headerLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
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
    marginTop: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 16,
    marginTop: 8,
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
    color: '#000000',
  },
  adjustButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  actions: {
    gap: 12,
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
