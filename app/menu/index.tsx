import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Image, RefreshControl, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
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
  ingredients?: IngredientLink[]; // Joined data if needed
}

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
}

interface IngredientLink {
  inventoryItemId: string;
  name: string; // for display
  baseUnit: string; // The specific unit stored in inventory (e.g. 'kg')
  quantity: number; // The actual quantity in TERMS OF baseUnit
  // Virtual fields for UI state
  displayUnit: string; // The unit currently shown to the user (e.g. 'gm')
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

  // Ingredient Linking State
  const [showIngredientSearch, setShowIngredientSearch] = useState(false);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [linkedIngredients, setLinkedIngredients] = useState<IngredientLink[]>([]);

  // Details Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsItem, setDetailsItem] = useState<MenuItem | null>(null);
  const [detailsIngredients, setDetailsIngredients] = useState<IngredientLink[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);

  // Reusable Ingredient Fetcher
  const fetchIngredientsForMenuItem = async (itemId: string): Promise<IngredientLink[]> => {
    try {
      const { data, error } = await supabase
        .from('menu_item_ingredients' as any)
        .select(`
          inventory_item_id,
          quantity,
          inventory:inventory_item_id (item_name, unit)
        `)
        .eq('menu_item_id', itemId as any);

      if (!error && data) {
        return data.map((d: any) => ({
          inventoryItemId: String(d.inventory_item_id),
          name: d.inventory?.item_name || 'Unknown',
          baseUnit: d.inventory?.unit || '',
          quantity: d.quantity,
          displayUnit: d.inventory?.unit || '' // Default to base unit
        }));
      }
    } catch (e) {
      console.error("Error fetching linked ingredients", e);
    }
    return [];
  };

  // Fetch Inventory for Suggestions
  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase.from('inventory').select('id, item_name, unit, quantity');
      if (error) throw error;
      setInventoryItems(data.map((i: any) => ({
        id: String(i.id),
        name: i.item_name,
        unit: i.unit,
        currentStock: i.quantity
      })));
    } catch (e) {
      console.error("Error fetching inventory", e);
    }
  };

  // Fetch inventory once on focus instead of every modal open
  useFocusEffect(
    useCallback(() => {
      if (!inventoryLoaded) {
        fetchInventory().then(() => setInventoryLoaded(true));
      }
    }, [inventoryLoaded])
  );

  useEffect(() => {
    if (ingredientSearchQuery.trim()) {
      const query = ingredientSearchQuery.toLowerCase();
      setFilteredInventory(inventoryItems.filter(i =>
        i.name.toLowerCase().includes(query) &&
        !linkedIngredients.some(l => l.inventoryItemId === i.id)
      ));
    } else {
      setFilteredInventory([]);
    }
  }, [ingredientSearchQuery, inventoryItems, linkedIngredients]);

  const getAvailableUnits = (baseUnit: string) => {
    if (baseUnit === 'kg') return ['kg', 'gm'];
    if (baseUnit === 'l') return ['l', 'ml'];
    return [baseUnit];
  };

  const convertQuantity = (qty: number, fromUnit: string, toUnit: string): number => {
    if (fromUnit === toUnit) return qty;
    if (fromUnit === 'kg' && toUnit === 'gm') return qty * 1000;
    if (fromUnit === 'gm' && toUnit === 'kg') return qty / 1000;
    if (fromUnit === 'l' && toUnit === 'ml') return qty * 1000;
    if (fromUnit === 'ml' && toUnit === 'l') return qty / 1000;
    return qty;
  };

  const addIngredientLink = (item: InventoryItem) => {
    setLinkedIngredients([...linkedIngredients, {
      inventoryItemId: item.id,
      name: item.name,
      baseUnit: item.unit,
      displayUnit: item.unit,
      quantity: 0 // Default, user must edit
    }]);
    setIngredientSearchQuery('');
    setShowIngredientSearch(false);
  };

  const updateIngredientQuantity = (inventoryId: string, displayQtyStr: string) => {
    setLinkedIngredients(prev => prev.map(p => {
      if (p.inventoryItemId !== inventoryId) return p;

      const displayQty = parseFloat(displayQtyStr) || 0;
      // Convert Display Qty (e.g. 500gm) to Base Qty (e.g. 0.5kg)
      const baseQty = convertQuantity(displayQty, p.displayUnit, p.baseUnit);

      return { ...p, quantity: baseQty };
    }));
  };

  const toggleIngredientUnit = (inventoryId: string) => {
    setLinkedIngredients(prev => prev.map(p => {
      if (p.inventoryItemId !== inventoryId) return p;

      const available = getAvailableUnits(p.baseUnit);
      if (available.length <= 1) return p;

      const currentIndex = available.indexOf(p.displayUnit);
      const nextUnit = available[(currentIndex + 1) % available.length];

      // When toggling unit, we want to KEEP the same physical quantity, just change display
      // quantity (base) stays same (e.g. 0.5kg)
      // displayUnit changes (e.g. gm)
      // Render logic will handle displaying 500

      return { ...p, displayUnit: nextUnit };
    }));
  };

  const removeIngredientLink = (inventoryId: string) => {
    setLinkedIngredients(prev => prev.filter(p => p.inventoryItemId !== inventoryId));
  };

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

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  const resetForm = () => {
    setFormName('');
    setFormCategory('');
    setFormPrice('');
    setFormImage(undefined);
    setLinkedIngredients([]);
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

    // Validate Ingredients
    if (linkedIngredients.some(l => l.quantity <= 0)) {
      alert(t('menu.management.invalidIngredientQuantity', 'Please enter a valid quantity for all ingredients.'));
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

      const { data: insertedItem, error } = await supabase.from('menu_items').insert([newItem]).select().single();
      if (error) throw error;

      // Link Ingredients
      if (linkedIngredients.length > 0 && insertedItem) {
        const ingredientsData = linkedIngredients.map(l => ({
          menu_item_id: insertedItem.id,
          inventory_item_id: Number(l.inventoryItemId),
          quantity: l.quantity
        }));
        const { error: ingError } = await supabase.from('menu_item_ingredients' as any).insert(ingredientsData);
        if (ingError) console.error("Error linking ingredients", ingError);
      }

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
    setLinkedIngredients([]);
    setShowEditModal(true);

    // Fetch ingredients in background after modal opens
    setLoadingIngredients(true);
    fetchIngredientsForMenuItem(item.id)
      .then(setLinkedIngredients)
      .finally(() => setLoadingIngredients(false));
  };

  const handleOpenDetails = (item: MenuItem) => {
    setDetailsItem(item);
    setDetailsIngredients([]);
    setShowDetailsModal(true);

    // Load ingredients in background
    setLoadingIngredients(true);
    fetchIngredientsForMenuItem(item.id)
      .then(setDetailsIngredients)
      .finally(() => setLoadingIngredients(false));
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    const priceNum = Number(formPrice);
    if (!formName.trim() || !formCategory.trim() || isNaN(priceNum)) {
      return;
    }

    // Validate Ingredients
    if (linkedIngredients.some(l => l.quantity <= 0)) {
      alert(t('menu.management.invalidIngredientQuantity', 'Please enter a valid quantity for all ingredients.'));
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

      // Update Ingredients: Delete all for this item and re-insert
      // (Simpler than diffing)
      await supabase.from('menu_item_ingredients' as any).delete().eq('menu_item_id', editItem.id as any);

      if (linkedIngredients.length > 0) {
        const ingredientsData = linkedIngredients.map(l => ({
          menu_item_id: editItem.id,
          inventory_item_id: Number(l.inventoryItemId),
          quantity: l.quantity
        }));
        const { error: ingError } = await supabase.from('menu_item_ingredients' as any).insert(ingredientsData);
        if (ingError) console.error("Error updating linked ingredients", ingError);
      }

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
        <TouchableOpacity activeOpacity={0.6} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isOwnerView ? t('menu.management.title') : t('menu.management.titleManager')}
        </Text>
        <TouchableOpacity activeOpacity={0.7} onPress={handleOpenAdd} style={styles.addButtonHeader}>
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
              activeOpacity={0.7}
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
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => handleOpenDetails(item)}
                style={styles.card}
              >
                <View>
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
                          activeOpacity={0.7}
                          style={{ padding: 6, backgroundColor: Colors.dark.secondary, borderRadius: 6 }}
                          onPress={() => handleOpenEdit(item)}
                        >
                          <Edit2 size={16} color={Colors.dark.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          style={{ padding: 6, backgroundColor: '#EF4444', borderRadius: 6 }}
                          onPress={() => handleDelete(item)}
                        >
                          <Trash2 size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ textAlign: 'center', color: Colors.dark.textSecondary, marginTop: 20, marginBottom: 40, opacity: 0.5 }}>
            v{process.env.EXPO_PUBLIC_APP_VERSION} ({process.env.EXPO_PUBLIC_APP_VERSION_CODE})
          </Text>
        </ScrollView>
      </View>

      <Modal visible={showAddModal} animationType="none" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('menu.management.addMenuItem')}</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setShowAddModal(false)}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }}>
              <TextInput style={styles.input} placeholder={t('menu.management.itemName')} placeholderTextColor={Colors.dark.textSecondary} value={formName} onChangeText={setFormName} />
              <View style={styles.categoryInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('menu.management.category')}
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={formCategory}
                  onChangeText={handleCategoryChange}
                  onFocus={() => {
                    const filtered = uniqueCategories.filter(c => c.toLowerCase().includes(formCategory.toLowerCase()));
                    setCategorySuggestions(filtered);
                    setShowCategorySuggestions(true);
                  }}
                  onBlur={() => setShowCategorySuggestions(false)}
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
                <TouchableOpacity activeOpacity={0.7} style={styles.photoButton} onPress={takePhoto}>
                  <Camera size={20} color="#000" />
                  <Text style={styles.photoButtonText}>{t('menu.management.camera')}</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} style={styles.photoButton} onPress={pickImage}>
                  <ImageIcon size={20} color="#000" />
                  <Text style={styles.photoButtonText}>{t('menu.management.gallery')}</Text>
                </TouchableOpacity>
              </View>

              {/* Ingredient Linking Section */}
              <Text style={styles.sectionLabel}>{t('menu.management.ingredients')}</Text>
              <View style={styles.ingredientSearchBox}>
                <TextInput
                  style={styles.input}
                  placeholder={t('menu.management.searchIngredients')}
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={ingredientSearchQuery}
                  onChangeText={(text) => {
                    setIngredientSearchQuery(text);
                    if (text) setShowIngredientSearch(true);
                  }}
                  onFocus={() => setShowIngredientSearch(true)}
                />
                {showIngredientSearch && filteredInventory.length > 0 && (
                  <ScrollView style={styles.ingredientResultsList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {filteredInventory.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.ingredientResultItem}
                        onPress={() => addIngredientLink(item)}
                      >
                        <Text style={styles.ingredientResultText}>{item.name}</Text>
                        <Text style={styles.ingredientResultSubtext}>{item.currentStock} {item.unit}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              <View style={styles.linkedIngredientsList}>
                {linkedIngredients.map((link) => {
                  const displayValue = convertQuantity(link.quantity, link.baseUnit, link.displayUnit);
                  return (
                    <View key={link.inventoryItemId} style={styles.linkedIngredientRow}>
                      <Text style={styles.linkedIngredientName}>{link.name}</Text>
                      <TextInput
                        style={styles.linkedIngredientInput}
                        value={displayValue === 0 ? '' : String(displayValue)}
                        onChangeText={(text) => updateIngredientQuantity(link.inventoryItemId, text)}
                        keyboardType="numeric"
                        placeholder={t('menu.management.qty')}
                        placeholderTextColor={Colors.dark.textSecondary}
                      />
                      <TouchableOpacity onPress={() => toggleIngredientUnit(link.inventoryItemId)} style={{
                        backgroundColor: Colors.dark.primary,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        justifyContent: 'center',
                        alignItems: 'center',
                        minWidth: 50,
                      }}>
                        <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>
                          {link.displayUnit}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeIngredientLink(link.inventoryItemId)} style={styles.removeIngredientButton}>
                        <X size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  )
                })}
              </View>

              {formImage && (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: formImage }} style={styles.photoPreviewImage} />
                  <TouchableOpacity style={styles.removePhotoButton} onPress={() => setFormImage(undefined)}>
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity activeOpacity={0.6} style={styles.addButton} onPress={handleAddItem}>
                <Text style={styles.addButtonText}>{t('menu.management.addItem')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={showEditModal} animationType="none" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('menu.management.editMenuItem')}</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => { setShowEditModal(false); setEditItem(null); }}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }}>
              <TextInput style={styles.input} placeholder={t('menu.management.itemName')} placeholderTextColor={Colors.dark.textSecondary} value={formName} onChangeText={setFormName} />
              <View style={styles.categoryInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('menu.management.category')}
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={formCategory}
                  onChangeText={handleCategoryChange}
                  onFocus={() => {
                    const filtered = uniqueCategories.filter(c => c.toLowerCase().includes(formCategory.toLowerCase()));
                    setCategorySuggestions(filtered);
                    setShowCategorySuggestions(true);
                  }}
                  onBlur={() => setShowCategorySuggestions(false)}
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
                <TouchableOpacity activeOpacity={0.7} style={styles.photoButton} onPress={takePhoto}>
                  <Camera size={20} color="#000" />
                  <Text style={styles.photoButtonText}>{t('menu.management.camera')}</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} style={styles.photoButton} onPress={pickImage}>
                  <ImageIcon size={20} color="#000" />
                  <Text style={styles.photoButtonText}>{t('menu.management.gallery')}</Text>
                </TouchableOpacity>
              </View>

              {/* Ingredient Linking Section */}
              <Text style={styles.sectionLabel}>{t('menu.management.ingredients')}</Text>
              <View style={styles.ingredientSearchBox}>
                <TextInput
                  style={styles.input}
                  placeholder={t('menu.management.searchIngredients')}
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={ingredientSearchQuery}
                  onChangeText={(text) => {
                    setIngredientSearchQuery(text);
                    if (text) setShowIngredientSearch(true);
                  }}
                  onFocus={() => setShowIngredientSearch(true)}
                />
                {showIngredientSearch && filteredInventory.length > 0 && (
                  <ScrollView style={styles.ingredientResultsList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {filteredInventory.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.ingredientResultItem}
                        onPress={() => addIngredientLink(item)}
                      >
                        <Text style={styles.ingredientResultText}>{item.name}</Text>
                        <Text style={styles.ingredientResultSubtext}>{item.currentStock} {item.unit}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              <View style={styles.linkedIngredientsList}>
                {linkedIngredients.map((link) => {
                  // Calculate value to show based on displayUnit
                  const displayValue = convertQuantity(link.quantity, link.baseUnit, link.displayUnit);

                  return (
                    <View key={link.inventoryItemId} style={styles.linkedIngredientRow}>
                      <Text style={styles.linkedIngredientName}>{link.name}</Text>
                      <TextInput
                        style={styles.linkedIngredientInput}
                        value={displayValue === 0 ? '' : String(displayValue)}
                        onChangeText={(text) => updateIngredientQuantity(link.inventoryItemId, text)}
                        keyboardType="numeric"
                        placeholder={t('menu.management.qty')}
                        placeholderTextColor={Colors.dark.textSecondary}
                      />
                      <TouchableOpacity onPress={() => toggleIngredientUnit(link.inventoryItemId)} style={{
                        backgroundColor: Colors.dark.primary,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        justifyContent: 'center',
                        alignItems: 'center',
                        minWidth: 50,
                      }}>
                        <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>
                          {link.displayUnit}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeIngredientLink(link.inventoryItemId)} style={styles.removeIngredientButton}>
                        <X size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  )
                })}
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
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} animationType="none" transparent>
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>{t('menu.management.deleteConfirm')}</Text>
            <Text style={styles.deleteModalMessage}>
              {t('menu.management.deleteMessage', { name: deleteItem?.name })}
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity activeOpacity={0.7} style={styles.cancelButton} onPress={cancelDelete}>
                <Text style={styles.cancelButtonText}>{t('menu.management.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.deleteButton} onPress={confirmDelete}>
                <Text style={styles.deleteButtonText}>{t('menu.management.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Details Modal */}
      <Modal visible={showDetailsModal} animationType="none" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('menu.management.itemDetails')}</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setShowDetailsModal(false)}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>
            {detailsItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {detailsItem.image ? (
                  <Image source={{ uri: detailsItem.image }} style={styles.detailsImage} />
                ) : (
                  <View style={[styles.detailsImage, styles.detailsCardImagePlaceholder]}>
                    <ImageIcon size={60} color={Colors.dark.textSecondary} />
                  </View>
                )}

                <View style={styles.detailsInfoContainer}>
                  <Text style={styles.detailsName}>{detailsItem.name}</Text>
                  <Text style={styles.detailsCategory}>{detailsItem.category}</Text>
                  <Text style={styles.detailsPrice}>₹{detailsItem.price}</Text>
                </View>

                <View style={styles.detailsDivider} />

                <Text style={styles.sectionLabel}>{t('menu.management.recipe')}</Text>

                {loadingIngredients && detailsIngredients.length === 0 ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator color={Colors.dark.primary} size="small" />
                    <Text style={{ color: Colors.dark.textSecondary, marginTop: 8 }}>
                      {t('menu.management.loadingIngredients', 'Loading ingredients...')}
                    </Text>
                  </View>
                ) : detailsIngredients.length > 0 ? (
                  <View style={styles.detailsIngredientsList}>
                    {detailsIngredients.map((ing, index) => (
                      <View key={index} style={styles.detailsIngredientRow}>
                        <Text style={styles.detailsIngredientName}>{ing.name}</Text>
                        <Text style={styles.detailsIngredientQty}>{ing.quantity} {ing.baseUnit}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noIngredientsText}>{t('menu.management.noIngredients')}</Text>
                )}

                <TouchableOpacity
                  style={styles.closeDetailsButton}
                  onPress={() => setShowDetailsModal(false)}
                >
                  <Text style={styles.closeDetailsButtonText}>{t('common.close')}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal >
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
    borderRadius: 20,
    backgroundColor: Colors.dark.secondary,
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

  // Details Modal Styles
  detailsImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  detailsCardImagePlaceholder: {
    backgroundColor: Colors.dark.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsInfoContainer: {
    marginBottom: 16,
  },
  detailsName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  detailsCategory: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    marginBottom: 8,
  },
  detailsPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: 16,
  },
  detailsIngredientsList: {
    backgroundColor: Colors.dark.secondary,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  detailsIngredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border + '40', // transparent border
  },
  detailsIngredientName: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  detailsIngredientQty: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  noIngredientsText: {
    color: Colors.dark.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  closeDetailsButton: {
    marginTop: 24,
    backgroundColor: Colors.dark.secondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  closeDetailsButtonText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
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
    maxHeight: '90%', // Increased height
    borderWidth: 1,
    borderColor: Colors.dark.border,
    flex: 1, // Allow taking available space
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
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  deleteModalMessage: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
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
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cancelButtonText: {
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Ingredient Selector Styles
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginTop: 16,
    marginBottom: 8,
  },
  ingredientSearchBox: {
    position: 'relative', // For dropdown positioning if needed
    zIndex: 10,
  },
  ingredientResultsList: {
    backgroundColor: Colors.dark.secondary,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
  },
  ingredientResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  ingredientResultText: {
    color: Colors.dark.text,
    fontSize: 14,
  },
  ingredientResultSubtext: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
  },
  linkedIngredientsList: {
    marginTop: 12,
    gap: 12,
  },
  linkedIngredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.secondary,
    padding: 16, // Increased padding
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 8,
  },
  linkedIngredientName: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
  },
  linkedIngredientInput: {
    backgroundColor: Colors.dark.inputBackground,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 8,
    paddingVertical: 12, // Larger touch target
    paddingHorizontal: 16,
    width: 100, // Slightly wider
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  linkedIngredientUnit: { // Kept for types but unused in new UI
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    width: 40,
  },
  removeIngredientButton: {
    padding: 12, // Larger hit slop
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
