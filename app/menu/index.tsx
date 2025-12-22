import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Search, Edit2, Trash2, X, Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Theme';
import { database, supabase } from '@/services/database';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  status: 'approved' | 'pending';
  image?: string;
}

export default function MenuScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const isOwnerView = params.role !== 'manager';
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formImage, setFormImage] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Starters', 'Main Course', 'Beverages', 'Desserts'];

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name');

      if (error) throw error;

      const mapped: MenuItem[] = (data || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        price: Number(i.price),
        status: i.status as 'approved' | 'pending',
        image: i.image_url
      }));

      setMenuItems(mapped);
    } catch (e) {
      console.error("Error fetching menu items", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMenuItems();
    }, [])
  );

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormName('');
    setFormCategory('');
    setFormPrice('');
    setFormImage(undefined);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormImage(result.assets[0].uri);
    }
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleAddItem = async () => {
    const priceNum = Number(formPrice);
    if (!formName.trim() || !formCategory.trim() || isNaN(priceNum)) {
      return;
    }

    try {
      const newItem = {
        name: formName.trim(),
        category: formCategory.trim(),
        price: priceNum,
        status: isOwnerView ? 'approved' : 'pending',
        image_url: formImage
      };

      const { error } = await supabase.from('menu_items').insert([newItem]);
      if (error) throw error;

      fetchMenuItems();
      setShowAddModal(false);
      resetForm();
    } catch (e) {
      console.error("Error adding menu item", e);
      alert("Failed to add item");
    }
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(String(item.price));
    setFormImage(item.image);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    const priceNum = Number(formPrice);
    if (!formName.trim() || !formCategory.trim() || isNaN(priceNum)) {
      return;
    }

    try {
      const updates = {
        name: formName.trim(),
        category: formCategory.trim(),
        price: priceNum,
        image_url: formImage
      };

      const { error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', editItem.id);

      if (error) throw error;

      fetchMenuItems();
      setShowEditModal(false);
      setEditItem(null);
      resetForm();
    } catch (e) {
      console.error("Error updating menu item", e);
      alert("Failed to update item");
    }
  };

  const handleDelete = (item: MenuItem) => {
    setDeleteItem(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteItem) {
      try {
        const { error } = await supabase
          .from('menu_items')
          .delete()
          .eq('id', deleteItem.id);

        if (error) throw error;

        fetchMenuItems();
        setShowDeleteModal(false);
        setDeleteItem(null);
      } catch (e) {
        console.error("Error deleting item", e);
        alert("Failed to delete");
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteItem(null);
  };

  const handleApproveItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;

      fetchMenuItems();
    } catch (e) {
      console.error("Error approving item", e);
      alert("Failed to approve");
    }
  };

  /* ... existing code ... */
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isOwnerView ? 'Menu Management' : 'Menu (Manager)'}
        </Text>
        <TouchableOpacity onPress={handleOpenAdd} style={styles.addButtonHeader}>
          <Plus size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.dark.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search menu items..."
            placeholderTextColor={Colors.dark.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryChip, selectedCategory === category && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
          <View style={styles.cardsGrid}>
            {filteredItems.map(item => (
              <View key={item.id} style={styles.card}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.cardImage} />
                ) : (
                  <View style={styles.cardImagePlaceholder}>
                    <ImageIcon size={40} color={Colors.dark.textSecondary} />
                  </View>
                )}
                <View style={styles.cardContent}>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cardCategory} numberOfLines={1}>{item.category}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardPrice}>₹{item.price}</Text>
                    <View
                      style={[
                        styles.cardStatus,
                        item.status === 'approved' ? styles.cardStatusApproved : styles.cardStatusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.cardStatusText,
                          item.status === 'approved' ? styles.cardStatusTextApproved : styles.cardStatusTextPending,
                        ]}
                      >
                        {item.status === 'approved' ? 'Approved' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.cardActionButton}
                      onPress={() => handleOpenEdit(item)}
                      disabled={!isOwnerView && item.status === 'approved'}
                    >
                      <Edit2
                        size={16}
                        color={!isOwnerView && item.status === 'approved' ? Colors.dark.textSecondary : Colors.dark.text}
                      />
                    </TouchableOpacity>
                    {isOwnerView && item.status === 'pending' && (
                      <TouchableOpacity
                        style={styles.cardActionButton}
                        onPress={() => handleApproveItem(item.id)}
                      >
                        <Text style={styles.cardApproveText}>Approve</Text>
                      </TouchableOpacity>
                    )}
                    {(isOwnerView || item.status === 'pending') && (
                      <TouchableOpacity style={styles.cardActionButton} onPress={() => handleDelete(item)}>
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Menu Item</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TextInput style={styles.input} placeholder="Item Name" placeholderTextColor={Colors.dark.textSecondary} value={formName} onChangeText={setFormName} />
              <TextInput style={styles.input} placeholder="Category" placeholderTextColor={Colors.dark.textSecondary} value={formCategory} onChangeText={setFormCategory} />
              <TextInput style={styles.input} placeholder="Price" placeholderTextColor={Colors.dark.textSecondary} keyboardType="numeric" value={formPrice} onChangeText={setFormPrice} />

              <Text style={styles.photoLabel}>Item Photo (Optional)</Text>
              <View style={styles.photoButtons}>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                  <Camera size={20} color="#000" />
                  <Text style={styles.photoButtonText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  <ImageIcon size={20} color="#000" />
                  <Text style={styles.photoButtonText}>Gallery</Text>
                </TouchableOpacity>
              </View>

              {formImage && (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: formImage }} style={styles.photoPreviewImage} />
                  <TouchableOpacity style={styles.removePhotoButton} onPress={() => setFormImage(undefined)}>
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
                <Text style={styles.addButtonText}>Add Item</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Menu Item</Text>
              <TouchableOpacity onPress={() => { setShowEditModal(false); setEditItem(null); }}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TextInput style={styles.input} placeholder="Item Name" placeholderTextColor={Colors.dark.textSecondary} value={formName} onChangeText={setFormName} />
              <TextInput style={styles.input} placeholder="Category" placeholderTextColor={Colors.dark.textSecondary} value={formCategory} onChangeText={setFormCategory} />
              <TextInput style={styles.input} placeholder="Price" placeholderTextColor={Colors.dark.textSecondary} keyboardType="numeric" value={formPrice} onChangeText={setFormPrice} />

              <Text style={styles.photoLabel}>Item Photo (Optional)</Text>
              <View style={styles.photoButtons}>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                  <Camera size={20} color="#000" />
                  <Text style={styles.photoButtonText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  <ImageIcon size={20} color="#000" />
                  <Text style={styles.photoButtonText}>Gallery</Text>
                </TouchableOpacity>
              </View>

              {formImage && (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: formImage }} style={styles.photoPreviewImage} />
                  <TouchableOpacity style={styles.removePhotoButton} onPress={() => setFormImage(undefined)}>
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.addButton} onPress={handleSaveEdit}>
                <Text style={styles.addButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Delete Menu Item</Text>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete "{deleteItem?.name}"? This action cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelDelete}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
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
  addButtonHeader: {
    backgroundColor: Colors.dark.primary,
    padding: 6,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.dark.text,
  },
  categoriesContainer: {
    marginTop: 16,
    marginBottom: 16,
    flexGrow: 0,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark.textSecondary,
  },
  categoryTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  itemsList: {
    flex: 1,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  card: {
    width: '48%',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.dark.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 12,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  cardStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  cardStatusApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  cardStatusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  cardStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardStatusTextApproved: {
    color: '#10B981',
  },
  cardStatusTextPending: {
    color: '#F59E0B',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  cardActionButton: {
    flex: 1,
    padding: 6,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 6,
    alignItems: 'center',
  },
  cardApproveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
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
    maxHeight: '80%',
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
    color: '#000',
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
    marginTop: 4,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dark.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  photoPreview: {
    position: 'relative',
    marginBottom: 16,
  },
  photoPreviewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteModalContent: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  deleteModalMessage: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    marginBottom: 24,
    lineHeight: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.dark.secondary,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
