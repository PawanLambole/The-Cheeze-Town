import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Image, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Search, Edit2, Trash2, X, Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Theme';
import { database, supabase } from '@/services/database';
import { uploadImage } from '@/services/imageUpload';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
}

export default function MenuScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const isOwnerView = params.role !== 'manager';
  const { t } = useTranslation();
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

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Category Autocomplete State
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);

  // Derived unique categories for suggestions (combining defaults and existing items)
  const uniqueCategories = Array.from(new Set([
    'Starters', 'Main Course', 'Beverages', 'Desserts',
    ...menuItems.map(item => item.category)
  ])).sort();

  // Dynamic categories for filter chips (includes "All" + unique categories from menu)
  const categories = ['All', ...uniqueCategories];

  const handleCategoryChange = (text: string) => {
    setFormCategory(text);
    if (text.trim().length > 0) {
      const filtered = uniqueCategories.filter(c =>
        c.toLowerCase().includes(text.toLowerCase()) && c.toLowerCase() !== text.toLowerCase()
      );
      setCategorySuggestions(filtered);
      setShowCategorySuggestions(filtered.length > 0);
    } else {
      setShowCategorySuggestions(false);
    }
  };

  const handleSelectCategory = (category: string) => {
    setFormCategory(category);
    setShowCategorySuggestions(false);
  };




  const fetchMenuItems = async () => {
    if (!refreshing) setRefreshing(true);
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
        image: i.image_url
      }));

      setMenuItems(mapped);
    } catch (e) {
      console.error("Error fetching menu items", e);
    } finally {
      setRefreshing(false);
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
      let imageUrl = formImage;
      if (formImage && formImage.startsWith('file://')) {
        imageUrl = await uploadImage(formImage, 'menu') || undefined;
      }

      const newItem = {
        name: formName.trim(),
        category: formCategory.trim(),
        price: priceNum,
        image_url: imageUrl
      };

      const { error } = await supabase.from('menu_items').insert([newItem]);
      if (error) throw error;

      fetchMenuItems();
      setShowAddModal(false);
      resetForm();
    } catch (e) {
      console.error("Error adding menu item", e);
      alert(t('menu.management.addFailed'));
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
      let imageUrl = formImage;
      if (formImage && formImage.startsWith('file://')) {
        const uploaded = await uploadImage(formImage, 'menu');
        if (uploaded) imageUrl = uploaded;
      }

      const updates = {
        name: formName.trim(),
        category: formCategory.trim(),
        price: priceNum,
        image_url: imageUrl
      };

      const { error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', editItem.id as any);

      if (error) throw error;

      fetchMenuItems();
      setShowEditModal(false);
      setEditItem(null);
      resetForm();
    } catch (e) {
      console.error("Error updating menu item", e);
      alert(t('menu.management.updateFailed'));
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
          .eq('id', deleteItem.id as any);

        if (error) throw error;

        fetchMenuItems();
        setShowDeleteModal(false);
        setDeleteItem(null);
      } catch (e) {
        console.error("Error deleting item", e);
        alert(t('menu.management.deleteFailed'));
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteItem(null);
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
          {isOwnerView ? t('menu.management.title') : t('menu.management.titleManager')}
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
            placeholder={t('menu.management.searchPlaceholder')}
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

        <ScrollView
          style={styles.itemsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchMenuItems}
              tintColor={Colors.dark.primary}
              colors={[Colors.dark.primary]}
            />
          }
        >
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
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={{ padding: 6, backgroundColor: Colors.dark.secondary, borderRadius: 6 }}
                        onPress={() => handleOpenEdit(item)}
                      >
                        <Edit2 size={16} color={Colors.dark.text} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ padding: 6, backgroundColor: '#EF4444', borderRadius: 6 }}
                        onPress={() => handleDelete(item)}
                      >
                        <Trash2 size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
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
              <Text style={styles.modalTitle}>{t('menu.management.addMenuItem')}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput style={styles.input} placeholder={t('menu.management.itemName')} placeholderTextColor={Colors.dark.textSecondary} value={formName} onChangeText={setFormName} />
              <View style={styles.categoryInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Category"
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={formCategory}
                  onChangeText={handleCategoryChange}
                  onFocus={() => {
                    const filtered = uniqueCategories.filter(c => c.toLowerCase().includes(formCategory.toLowerCase()));
                    setCategorySuggestions(filtered);
                    setShowCategorySuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 300)}
                />
                {showCategorySuggestions && categorySuggestions.length > 0 && (
                  <ScrollView style={styles.suggestionList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {categorySuggestions.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => handleSelectCategory(item)}
                      >
                        <Text style={styles.suggestionText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
              <TextInput style={styles.input} placeholder={t('menu.management.price')} placeholderTextColor={Colors.dark.textSecondary} keyboardType="numeric" value={formPrice} onChangeText={setFormPrice} />

              <Text style={styles.photoLabel}>{t('menu.management.itemPhoto')}</Text>
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
                <Text style={styles.addButtonText}>{t('menu.management.addItem')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('menu.management.editMenuItem')}</Text>
              <TouchableOpacity onPress={() => { setShowEditModal(false); setEditItem(null); }}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput style={styles.input} placeholder={t('menu.management.itemName')} placeholderTextColor={Colors.dark.textSecondary} value={formName} onChangeText={setFormName} />
              <View style={styles.categoryInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Category"
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={formCategory}
                  onChangeText={handleCategoryChange}
                  onFocus={() => {
                    const filtered = uniqueCategories.filter(c => c.toLowerCase().includes(formCategory.toLowerCase()));
                    setCategorySuggestions(filtered);
                    setShowCategorySuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 300)}
                />
                {showCategorySuggestions && categorySuggestions.length > 0 && (
                  <ScrollView style={styles.suggestionList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {categorySuggestions.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => handleSelectCategory(item)}
                      >
                        <Text style={styles.suggestionText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
              <TextInput style={styles.input} placeholder={t('menu.management.price')} placeholderTextColor={Colors.dark.textSecondary} keyboardType="numeric" value={formPrice} onChangeText={setFormPrice} />

              <Text style={styles.photoLabel}>{t('menu.management.itemPhoto')}</Text>
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
                <Text style={styles.addButtonText}>{t('menu.management.saveChanges')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>{t('menu.management.deleteConfirm')}</Text>
            <Text style={styles.deleteModalMessage}>
              {t('menu.management.deleteMessage', { name: deleteItem?.name })}
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelDelete}>
                <Text style={styles.cancelButtonText}>{t('menu.management.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
                <Text style={styles.deleteButtonText}>{t('menu.management.delete')}</Text>
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
  suggestionList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 150,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 8,
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
  },
  categoryInputContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  suggestionText: {
    color: Colors.dark.text,
    fontSize: 16,
  },
});
