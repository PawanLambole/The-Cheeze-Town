import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Image, ActivityIndicator, Alert, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, X, Camera, User, Package, IndianRupee, Calendar, Image as ImageIcon, Trash, Check, Filter } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Theme';
import { database, supabase } from '@/services/database';
import { uploadImage } from '@/services/imageUpload';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Purchase {
    id: string;
    purchaseType: 'inventory' | 'other';
    itemName: string;
    category: string;
    quantity: number;
    unit: string;
    totalPrice: number;

    purchaseDate: string;
    receiptPhoto?: string;
    notes?: string;
}

interface FilterState {
    dateRange: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';
    startDate: Date | null;
    endDate: Date | null;
    type: 'all' | 'inventory' | 'other';
    categories: string[];
    minPrice: string;
    maxPrice: string;
}

export default function PurchasesScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { userData } = useAuth();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewImage, setViewImage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Form fields
    const [formPurchaseType, setFormPurchaseType] = useState<'inventory' | 'other'>('inventory');
    const [formItemName, setFormItemName] = useState('');
    const [formCategory, setFormCategory] = useState('');
    const [formQuantity, setFormQuantity] = useState('');
    const [formUnit, setFormUnit] = useState('kg');
    const [formPrice, setFormPrice] = useState('');
    const [formSupplier, setFormSupplier] = useState('');

    const [formNotes, setFormNotes] = useState('');
    const [formReceiptPhoto, setFormReceiptPhoto] = useState<string | undefined>(undefined);
    const [formMinStock, setFormMinStock] = useState('');
    const [showAutocomplete, setShowAutocomplete] = useState(false);

    // Dynamic lists
    const [categories, setCategories] = useState<string[]>(['Vegetables', 'Dairy', 'Meat', 'Spices', 'Beverages', 'Packaging', 'Equipment', 'Other']);
    const [units, setUnits] = useState<string[]>(['kg', 'g', 'L', 'ml', 'pieces', 'boxes']);
    const [customUnit, setCustomUnit] = useState('');
    const [isCustomUnit, setIsCustomUnit] = useState(false);

    const [inventoryItems, setInventoryItems] = useState<{ name: string; category: string; unit: string; minStock: number }[]>([]);

    const [showFilterModal, setShowFilterModal] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterState>({
        dateRange: 'all',
        startDate: null,
        endDate: null,
        type: 'all',
        categories: [],
        minPrice: '',
        maxPrice: ''
    });

    const [tempFilters, setTempFilters] = useState<FilterState>(activeFilters); // For modal state before applying

    const fetchInventoryItems = async () => {
        try {
            const { data, error } = await supabase
                .from('inventory')
                .select('item_name, category, unit, reorder_level')
                .order('item_name');

            if (error) throw error;

            if (data) {
                const fetchedItems = data.map((item: any) => ({
                    name: item.item_name,
                    category: item.category,
                    unit: item.unit,
                    minStock: item.reorder_level || 0
                }));
                setInventoryItems(fetchedItems);

                // Extract unique categories and units
                const uniqueCategories = Array.from(new Set(fetchedItems.map((i: any) => i.category))).filter(Boolean) as string[];
                const uniqueUnits = Array.from(new Set(fetchedItems.map((i: any) => i.unit))).filter(Boolean) as string[];

                // Update dynamic lists merging with defaults
                setCategories(prev => Array.from(new Set([...prev, ...uniqueCategories])));
                setUnits(prev => Array.from(new Set([...prev, ...uniqueUnits])));
            }
        } catch (error) {
            console.error('Error fetching inventory items:', error);
        }
    };

    const filteredInventoryItems = inventoryItems.filter(item =>
        item.name.toLowerCase().includes(formItemName.toLowerCase())
    );



    const [purchases, setPurchases] = useState<Purchase[]>([]);

    const fetchPurchases = async () => {
        try {
            const { data, error } = await supabase
                .from('purchases')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedPurchases: Purchase[] = (data || []).map((p: any) => ({
                id: p.id,
                purchaseType: p.purchase_type,
                itemName: p.item_name,
                category: p.category,
                quantity: Number(p.quantity),
                unit: p.unit,
                totalPrice: Number(p.total_amount),
                purchaseDate: p.purchase_date,
                receiptPhoto: p.receipt_url || p.receipt_photo,
                notes: p.notes,
            }));

            setPurchases(formattedPurchases);
        } catch (error) {
            console.error('Error fetching purchases:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchPurchases();
            fetchInventoryItems();
        }, [])
    );

    const filteredPurchases = purchases.filter(purchase => {
        // Search Filter
        const matchesSearch =
            purchase.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            purchase.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (purchase.notes && purchase.notes.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        // Type Filter
        if (activeFilters.type !== 'all' && purchase.purchaseType !== activeFilters.type) return false;

        // Category Filter
        if (activeFilters.categories.length > 0 && !activeFilters.categories.includes(purchase.category)) return false;

        // Price Filter
        if (activeFilters.minPrice && purchase.totalPrice < parseFloat(activeFilters.minPrice)) return false;
        if (activeFilters.maxPrice && purchase.totalPrice > parseFloat(activeFilters.maxPrice)) return false;

        // Date Filter
        if (activeFilters.dateRange !== 'all') {
            const purchaseDate = new Date(purchase.purchaseDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (activeFilters.dateRange === 'today') {
                if (purchaseDate < today) return false;
            } else if (activeFilters.dateRange === 'yesterday') {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const nextDay = new Date(yesterday);
                nextDay.setDate(nextDay.getDate() + 1);
                if (purchaseDate < yesterday || purchaseDate >= nextDay) return false;
            } else if (activeFilters.dateRange === 'week') {
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                if (purchaseDate < weekAgo) return false;
            } else if (activeFilters.dateRange === 'month') {
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                if (purchaseDate < monthAgo) return false;
            } else if (activeFilters.dateRange === 'custom') {
                if (activeFilters.startDate && purchaseDate < activeFilters.startDate) return false;
                if (activeFilters.endDate) {
                    const end = new Date(activeFilters.endDate);
                    end.setHours(23, 59, 59, 999);
                    if (purchaseDate > end) return false;
                }
            }
        }

        return true;
    });

    const totalSpent = purchases.reduce((sum, purchase) => sum + (purchase.totalPrice || 0), 0);

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([fetchPurchases(), fetchInventoryItems()]);
        } catch (error) {
            console.error('Error refreshing:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const resetForm = () => {
        setFormPurchaseType('inventory');
        setFormItemName('');
        setFormCategory('');
        setFormQuantity('');
        setFormUnit('kg');
        setFormPrice('');
        setFormSupplier('');

        setFormNotes('');
        setFormReceiptPhoto(undefined);
        setFormMinStock('');
        setShowAutocomplete(false);
        setCustomUnit('');
        setIsCustomUnit(false);
    };

    const selectInventoryItem = (item: typeof inventoryItems[0]) => {
        setFormItemName(item.name);
        setFormCategory(item.category);

        // Check if unit is in list, if not maybe add it or handle custom?
        // For now just set it. If it's custom it might not match buttons exactly unless we add logic.
        // We will just set it and if it's not in standard list, maybe add to units list dynamically?
        // Actually simpler: just setFormUnit. 
        setFormUnit(item.unit);
        setFormMinStock(String(item.minStock));
        setShowAutocomplete(false);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setFormReceiptPhoto(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setFormReceiptPhoto(result.assets[0].uri);
        }
    };

    const handleDelete = (purchase: Purchase) => {
        Alert.alert(
            t('manager.purchases.deleteConfirmTitle'),
            t('manager.purchases.deleteConfirmMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('manager.purchases.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase.from('purchases').delete().eq('id', Number(purchase.id));
                            if (error) throw error;
                            setShowDetailModal(false);
                            fetchPurchases();
                            alert(t('manager.purchases.success.deleted'));
                        } catch (e) {
                            console.error("Error deleting purchase", e);
                            alert(t('manager.purchases.errors.deleteFailed'));
                        }
                    }
                }
            ]
        );
    };

    const handleAddPurchase = async () => {
        if (!formItemName.trim() || !formQuantity || !formPrice) {
            alert(t('validation.required'));
            return;
        }

        // Validate min stock for inventory purchases
        if (formPurchaseType === 'inventory' && !formMinStock) {
            alert(t('manager.purchases.errors.minStockRequired'));
            return;
        }

        try {
            setIsSubmitting(true);
            let receiptUrl = formReceiptPhoto;
            if (formReceiptPhoto && formReceiptPhoto.startsWith('file://')) {
                receiptUrl = await uploadImage(formReceiptPhoto, 'purchase') || undefined;
            }

            const unitPrice = parseFloat(formPrice);
            const quantity = parseFloat(formQuantity);
            const totalAmount = unitPrice * quantity;

            const newPurchase = {
                purchase_type: formPurchaseType,
                item_name: formItemName.trim(),
                category: formCategory || 'Other',
                quantity: quantity,
                unit: isCustomUnit ? customUnit : formUnit,
                unit_price: unitPrice,
                total_amount: totalAmount,
                created_at: new Date().toISOString(),
                receipt_url: receiptUrl,
                notes: formNotes.trim() || null,
            };

            const { error } = await supabase
                .from('purchases')
                .insert([newPurchase]);

            if (error) throw error;

            if (formPurchaseType === 'inventory') {
                // Check if item exists in inventory_items to update stock
                const { data: existingItems } = await supabase
                    .from('inventory')
                    .select('*')
                    .ilike('item_name', formItemName.trim());

                if (existingItems && existingItems.length > 0) {
                    const item: any = existingItems[0];
                    await supabase.from('inventory').update({
                        // Checking types via linter
                        quantity: (Number(item.quantity) + parseFloat(formQuantity))
                    }).eq('id', item.id);
                } else {
                    await supabase.from('inventory').insert([{
                        item_name: formItemName.trim(),
                        category: formCategory || 'Other',
                        unit: isCustomUnit ? customUnit : formUnit,
                        quantity: parseFloat(formQuantity),
                        reorder_level: parseFloat(formMinStock) || 0 // Fix: Use reorder_level instead of min_stock
                    }]);
                }
            }

            // Refresh list BEFORE closing modal/resetting form for smoother UX
            await fetchPurchases();

            resetForm();
            setShowAddModal(false);
            alert(t('manager.purchases.success.added'));
        } catch (e) {
            console.error("Error adding purchase:", e);
            alert(t('manager.purchases.errors.addFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('manager.purchases.title')}</Text>
                <TouchableOpacity onPress={() => setShowAddModal(true)}>
                    <Plus size={24} color={Colors.dark.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.dark.primary]} tintColor={Colors.dark.primary} />
                }
            >
                {/* Stats Card */}
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{purchases.length}</Text>
                        <Text style={styles.statLabel}>{t('manager.purchases.totalPurchases')}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: Colors.dark.primary }]}>â‚¹{totalSpent.toLocaleString()}</Text>
                        <Text style={styles.statLabel}>{t('manager.purchases.totalSpent')}</Text>
                    </View>
                </View>

                {/* Search Bar */}
                {/* Search Bar & Filter */}
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('manager.purchases.searchPlaceholder')}
                        placeholderTextColor={Colors.dark.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            (activeFilters.dateRange !== 'all' || activeFilters.type !== 'all' || activeFilters.categories.length > 0 || activeFilters.minPrice || activeFilters.maxPrice) && styles.filterButtonActive
                        ]}
                        onPress={() => {
                            setTempFilters(activeFilters);
                            setShowFilterModal(true);
                        }}
                    >
                        <Filter size={20} color={(activeFilters.dateRange !== 'all' || activeFilters.type !== 'all' || activeFilters.categories.length > 0 || activeFilters.minPrice || activeFilters.maxPrice) ? '#000000' : Colors.dark.text} />
                    </TouchableOpacity>
                </View>

                {/* Purchases List */}
                <Text style={styles.sectionTitle}>{t('manager.purchases.history')}</Text>
                {filteredPurchases.map(purchase => (
                    <TouchableOpacity
                        key={purchase.id}
                        style={styles.purchaseCard}
                        onPress={() => {
                            setSelectedPurchase(purchase);
                            setShowDetailModal(true);
                        }}
                    >
                        <View style={styles.purchaseHeader}>
                            <View style={styles.purchaseIconContainer}>
                                <Package size={20} color={Colors.dark.primary} />
                            </View>
                            <View style={styles.purchaseInfo}>
                                <Text style={styles.purchaseName}>{purchase.itemName}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={styles.purchaseCategory}>{purchase.category}</Text>
                                    <View style={[
                                        styles.typeBadge,
                                        { backgroundColor: purchase.purchaseType === 'inventory' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)' }
                                    ]}>
                                        <Text style={[
                                            styles.typeBadgeText,
                                            { color: purchase.purchaseType === 'inventory' ? '#60A5FA' : '#F87171' }
                                        ]}>
                                            {purchase.purchaseType === 'inventory' ? t('manager.purchases.inventoryType') : t('manager.purchases.expenseType')}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.purchasePrice}>â‚¹{purchase.totalPrice.toLocaleString()}</Text>
                        </View>

                        <View style={styles.purchaseDetails}>
                            <View style={styles.detailRow}>
                                <Package size={14} color={Colors.dark.textSecondary} />
                                <Text style={styles.detailText}>
                                    {purchase.quantity} {purchase.unit}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Calendar size={14} color={Colors.dark.textSecondary} />
                                <Text style={styles.detailText}>{purchase.purchaseDate}</Text>
                            </View>

                        </View>

                        {purchase.notes && (
                            <View style={styles.notesContainer}>
                                <Text style={styles.notesLabel}>{t('manager.purchases.notes')}:</Text>
                                <Text style={styles.notesText}>{purchase.notes}</Text>
                            </View>
                        )}

                        {purchase.receiptPhoto && (
                            <TouchableOpacity
                                style={styles.receiptContainer}
                                onPress={() => setViewImage(purchase.receiptPhoto || null)}
                            >
                                <Image source={{ uri: purchase.receiptPhoto }} style={styles.receiptImage} />
                                <Text style={styles.receiptLabel}>{t('manager.purchases.viewReceipt')}</Text>
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                ))}

                {filteredPurchases.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Package size={48} color={Colors.dark.secondary} />
                        <Text style={styles.emptyText}>{t('manager.purchases.empty')}</Text>
                    </View>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Add Purchase Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('manager.purchases.addPurchase')}</Text>
                            <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                                <X size={24} color={Colors.dark.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>{t('manager.purchases.purchaseType')} *</Text>
                            <View style={styles.purchaseTypeContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.purchaseTypeButton,
                                        formPurchaseType === 'inventory' && styles.purchaseTypeButtonActive
                                    ]}
                                    onPress={() => setFormPurchaseType('inventory')}
                                >
                                    <Package size={20} color={formPurchaseType === 'inventory' ? '#000000' : Colors.dark.textSecondary} />
                                    <Text style={[
                                        styles.purchaseTypeText,
                                        formPurchaseType === 'inventory' && styles.purchaseTypeTextActive
                                    ]}>
                                        {t('manager.purchases.inventoryPurchase')}
                                    </Text>
                                    <Text style={[
                                        styles.purchaseTypeDesc,
                                        formPurchaseType === 'inventory' && styles.purchaseTypeDescActive
                                    ]}>
                                        {t('manager.purchases.inventoryDesc')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.purchaseTypeButton,
                                        formPurchaseType === 'other' && styles.purchaseTypeButtonActive
                                    ]}
                                    onPress={() => setFormPurchaseType('other')}
                                >
                                    <IndianRupee size={20} color={formPurchaseType === 'other' ? '#000000' : Colors.dark.textSecondary} />
                                    <Text style={[
                                        styles.purchaseTypeText,
                                        formPurchaseType === 'other' && styles.purchaseTypeTextActive
                                    ]}>
                                        {t('manager.purchases.otherPurchase')}
                                    </Text>
                                    <Text style={[
                                        styles.purchaseTypeDesc,
                                        formPurchaseType === 'other' && styles.purchaseTypeDescActive
                                    ]}>
                                        {t('manager.purchases.otherDesc')}
                                    </Text>
                                </TouchableOpacity>
                            </View>


                            <View style={styles.autocompleteContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('manager.purchases.itemName') + " *"}
                                    placeholderTextColor={Colors.dark.textSecondary}
                                    value={formItemName}
                                    onChangeText={(text) => {
                                        setFormItemName(text);
                                        if (formPurchaseType === 'inventory' && text.length > 0) {
                                            setShowAutocomplete(true);
                                        } else {
                                            setShowAutocomplete(false);
                                        }
                                    }}
                                    onFocus={() => {
                                        if (formPurchaseType === 'inventory' && formItemName.length > 0) {
                                            setShowAutocomplete(true);
                                        }
                                    }}
                                />
                                {showAutocomplete && formPurchaseType === 'inventory' && filteredInventoryItems.length > 0 && (
                                    <View style={styles.autocompleteDropdown}>
                                        <ScrollView style={styles.autocompleteList} nestedScrollEnabled>
                                            {filteredInventoryItems.slice(0, 5).map((item, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    style={styles.autocompleteItem}
                                                    onPress={() => selectInventoryItem(item)}
                                                >
                                                    <View style={styles.autocompleteItemContent}>
                                                        <Text style={styles.autocompleteItemName}>{item.name}</Text>
                                                        <Text style={styles.autocompleteItemCategory}>{item.category}</Text>
                                                    </View>
                                                    <View style={styles.autocompleteItemBadge}>
                                                        <Text style={styles.autocompleteItemUnit}>{item.unit}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>


                            <Text style={styles.inputLabel}>{t('manager.purchases.category')}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                                {categories.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.categoryChip, formCategory === cat && styles.categoryChipActive]}
                                        onPress={() => setFormCategory(cat)}
                                    >
                                        <Text style={[styles.categoryText, formCategory === cat && styles.categoryTextActive]}>
                                            {t(`manager.categories.${cat.toLowerCase()}`, { defaultValue: cat })}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.row}>
                                <TextInput
                                    style={[styles.input, styles.halfInput]}
                                    placeholder={t('manager.purchases.quantity') + " *"}
                                    placeholderTextColor={Colors.dark.textSecondary}
                                    keyboardType="numeric"
                                    value={formQuantity}
                                    onChangeText={setFormQuantity}
                                />
                                <View style={styles.unitSelector}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {[...units, 'Other'].map(u => (
                                            <TouchableOpacity
                                                key={u}
                                                style={[
                                                    styles.unitButton,
                                                    (!isCustomUnit && formUnit === u) || (isCustomUnit && u === 'Other') ? styles.unitButtonActive : {}
                                                ]}
                                                onPress={() => {
                                                    if (u === 'Other') {
                                                        setIsCustomUnit(true);
                                                    } else {
                                                        setIsCustomUnit(false);
                                                        setFormUnit(u);
                                                    }
                                                }}
                                            >
                                                <Text style={[
                                                    styles.unitText,
                                                    (!isCustomUnit && formUnit === u) || (isCustomUnit && u === 'Other') ? styles.unitTextActive : {}
                                                ]}>{u === 'Other' ? t('manager.purchases.otherUnit') : u}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                                {isCustomUnit && (
                                    <View style={{ marginTop: 8 }}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder={t('manager.purchases.customUnit')}
                                            placeholderTextColor={Colors.dark.textSecondary}
                                            value={customUnit}
                                            onChangeText={setCustomUnit}
                                        />
                                    </View>
                                )}
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder={t('manager.purchases.unitPrice') + " *"}
                                placeholderTextColor={Colors.dark.textSecondary}
                                keyboardType="numeric"
                                value={formPrice}
                                onChangeText={setFormPrice}
                            />

                            {formPrice && formQuantity && (
                                <View style={styles.totalAmountDisplay}>
                                    <Text style={styles.totalAmountLabel}>{t('manager.purchases.totalAmount')}:</Text>
                                    <Text style={styles.totalAmountValue}>
                                        â‚¹{(parseFloat(formPrice) * parseFloat(formQuantity)).toFixed(2)}
                                    </Text>
                                </View>
                            )}

                            {formPurchaseType === 'inventory' && (
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('manager.purchases.minStock') + " *"}
                                    placeholderTextColor={Colors.dark.textSecondary}
                                    keyboardType="numeric"
                                    value={formMinStock}
                                    onChangeText={setFormMinStock}
                                />
                            )}

                            <TextInput
                                style={styles.input}
                                placeholder={t('manager.purchases.supplier')}
                                placeholderTextColor={Colors.dark.textSecondary}
                                value={formSupplier}
                                onChangeText={setFormSupplier}
                            />



                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder={t('manager.purchases.notesOptional')}
                                placeholderTextColor={Colors.dark.textSecondary}
                                multiline
                                numberOfLines={3}
                                value={formNotes}
                                onChangeText={setFormNotes}
                            />

                            <Text style={styles.inputLabel}>{t('manager.purchases.receiptPhotoOptional')}</Text>
                            <View style={styles.photoButtons}>
                                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                                    <Camera size={20} color="#000000" />
                                    <Text style={styles.photoButtonText}>{t('manager.purchases.takePhoto')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                                    <ImageIcon size={20} color="#000000" />
                                    <Text style={styles.photoButtonText}>{t('manager.purchases.chooseGallery')}</Text>
                                </TouchableOpacity>
                            </View>

                            {formReceiptPhoto && (
                                <View style={styles.previewContainer}>
                                    <View style={styles.previewImageWrapper}>
                                        <TouchableOpacity
                                            onPress={() => setViewImage(formReceiptPhoto)}
                                            activeOpacity={0.9}
                                        >
                                            <Image source={{ uri: formReceiptPhoto }} style={styles.previewImage} resizeMode="contain" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.previewActions}>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            activeOpacity={0.7}
                                        >
                                            <Check size={20} color={Colors.dark.primary} />
                                            <Text style={styles.actionText}>{t('common.confirm') || 'Select'}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.actionButtonDestructive]}
                                            onPress={() => setFormReceiptPhoto(undefined)}
                                            activeOpacity={0.7}
                                        >
                                            <X size={20} color="#EF4444" />
                                            <Text style={[styles.actionText, styles.actionTextDestructive]}>{t('common.delete') || 'Deselect'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                                onPress={handleAddPurchase}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <ActivityIndicator color="#000000" size="small" />
                                        <Text style={styles.submitButtonText}>{t('manager.purchases.uploading') || 'Uploading...'}</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.submitButtonText}>{t('manager.purchases.submit')}</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Detail Modal */}
            <Modal visible={showDetailModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('manager.purchases.details')}</Text>
                            <TouchableOpacity onPress={() => setShowDetailModal(false)} style={styles.closeButton}>
                                <X size={24} color={Colors.dark.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedPurchase && (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
                                {/* Hero Section */}
                                <View style={styles.heroSection}>
                                    <View style={styles.heroIconCircle}>
                                        <Package size={32} color={Colors.dark.primary} />
                                    </View>
                                    <Text style={styles.heroAmount}>â‚¹{selectedPurchase.totalPrice.toLocaleString()}</Text>
                                    <Text style={styles.heroName}>{selectedPurchase.itemName}</Text>

                                    <View style={[
                                        styles.heroBadge,
                                        { backgroundColor: selectedPurchase.purchaseType === 'inventory' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
                                    ]}>
                                        <Text style={[
                                            styles.heroBadgeText,
                                            { color: selectedPurchase.purchaseType === 'inventory' ? '#60A5FA' : '#F87171' }
                                        ]}>
                                            {selectedPurchase.purchaseType === 'inventory' ? t('manager.purchases.inventoryType') : t('manager.purchases.expenseType')}
                                        </Text>
                                    </View>
                                </View>

                                {/* Meta Grid */}
                                <View style={styles.metaGrid}>
                                    <View style={styles.metaItem}>
                                        <Text style={styles.metaLabel}>{t('manager.purchases.category')}</Text>
                                        <Text style={styles.metaValue}>{selectedPurchase.category}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Text style={styles.metaLabel}>{t('manager.purchases.quantity')}</Text>
                                        <Text style={styles.metaValue}>{selectedPurchase.quantity} {selectedPurchase.unit}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Text style={styles.metaLabel}>{t('common.date')}</Text>
                                        {/* Simple date formatting */}
                                        <Text style={styles.metaValue}>
                                            {new Date(selectedPurchase.purchaseDate).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>

                                {/* Notes Section */}
                                {selectedPurchase.notes && (
                                    <View style={styles.detailBlock}>
                                        <Text style={styles.blockLabel}>{t('manager.purchases.notes')}</Text>
                                        <View style={styles.noteBox}>
                                            <Text style={styles.noteContent}>{selectedPurchase.notes}</Text>
                                        </View>
                                    </View>
                                )}

                                {/* Receipt Section */}
                                {selectedPurchase.receiptPhoto && (
                                    <View style={styles.detailBlock}>
                                        <Text style={styles.blockLabel}>{t('manager.purchases.receipt')}</Text>
                                        <TouchableOpacity
                                            style={styles.receiptBox}
                                            onPress={() => setViewImage(selectedPurchase.receiptPhoto || null)}
                                            activeOpacity={0.9}
                                        >
                                            <Image
                                                source={{ uri: selectedPurchase.receiptPhoto }}
                                                style={styles.fullReceipt}
                                                resizeMode="contain"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Delete Action */}
                                {userData?.role === 'owner' && (
                                    <TouchableOpacity
                                        style={styles.dangerButton}
                                        onPress={() => handleDelete(selectedPurchase)}
                                    >
                                        <Trash size={20} color="#EF4444" />
                                        <Text style={styles.dangerButtonText}>{t('manager.purchases.delete')}</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
            {/* Full Screen Image Modal */}
            <Modal visible={!!viewImage} animationType="fade" transparent>
                <View style={styles.fullImageContainer}>
                    <TouchableOpacity
                        style={styles.fullImageClose}
                        onPress={() => setViewImage(null)}
                    >
                        <X size={32} color="#FFFFFF" />
                    </TouchableOpacity>
                    {viewImage && (
                        <Image
                            source={{ uri: viewImage }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>

            {/* Filter Modal */}
            <Modal visible={showFilterModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalKeyboardAvoidingView}
                    >
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t('filters.title')}</Text>
                                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                    <X size={24} color={Colors.dark.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
                                {/* Date Range */}
                                <View style={styles.filterSection}>
                                    <Text style={styles.filterLabel}>{t('filters.dateRange')}</Text>
                                    <View style={styles.filterRow}>
                                        {['all', 'today', 'yesterday', 'week', 'month', 'custom'].map((range: any) => (
                                            <TouchableOpacity
                                                key={range}
                                                style={[styles.filterChip, tempFilters.dateRange === range && styles.filterChipActive]}
                                                onPress={() => setTempFilters(prev => ({ ...prev, dateRange: range }))}
                                            >
                                                <Text style={[styles.filterChipText, tempFilters.dateRange === range && styles.filterChipTextActive]}>
                                                    {range === 'all' ? t('filters.all') :
                                                        range === 'week' ? t('filters.thisWeek') :
                                                            range === 'month' ? t('filters.thisMonth') :
                                                                t(`filters.${range}`)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Custom Date Range Inputs */}
                                    {tempFilters.dateRange === 'custom' && (
                                        <View style={styles.dateInputContainer}>
                                            <View style={styles.dateInputWrapper}>
                                                <Text style={styles.dateInputLabel}>{t('filters.startDate') || 'Start Date'}</Text>
                                                <TextInput
                                                    style={styles.dateInput}
                                                    placeholder="YYYY-MM-DD"
                                                    placeholderTextColor={Colors.dark.textSecondary}
                                                    value={tempFilters.startDate ? tempFilters.startDate.toISOString().split('T')[0] : ''}
                                                    onChangeText={(text) => {
                                                        const date = new Date(text);
                                                        if (!isNaN(date.getTime())) {
                                                            setTempFilters(prev => ({ ...prev, startDate: date }));
                                                        }
                                                    }}
                                                />
                                            </View>
                                            <View style={styles.dateInputWrapper}>
                                                <Text style={styles.dateInputLabel}>{t('filters.endDate') || 'End Date'}</Text>
                                                <TextInput
                                                    style={styles.dateInput}
                                                    placeholder="YYYY-MM-DD"
                                                    placeholderTextColor={Colors.dark.textSecondary}
                                                    value={tempFilters.endDate ? tempFilters.endDate.toISOString().split('T')[0] : ''}
                                                    onChangeText={(text) => {
                                                        const date = new Date(text);
                                                        if (!isNaN(date.getTime())) {
                                                            setTempFilters(prev => ({ ...prev, endDate: date }));
                                                        }
                                                    }}
                                                />
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* Purchase Type */}
                                <View style={styles.filterSection}>
                                    <Text style={styles.filterLabel}>{t('filters.type')}</Text>
                                    <View style={styles.filterRow}>
                                        {['all', 'inventory', 'other'].map((type: any) => (
                                            <TouchableOpacity
                                                key={type}
                                                style={[styles.filterChip, tempFilters.type === type && styles.filterChipActive]}
                                                onPress={() => setTempFilters(prev => ({ ...prev, type: type }))}
                                            >
                                                <Text style={[styles.filterChipText, tempFilters.type === type && styles.filterChipTextActive]}>
                                                    {type === 'all' ? t('filters.all') :
                                                        type === 'inventory' ? t('manager.purchases.inventoryType') :
                                                            t('manager.purchases.otherPurchase')}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Categories */}
                                <View style={styles.filterSection}>
                                    <Text style={styles.filterLabel}>{t('filters.category')}</Text>
                                    <View style={styles.filterRow}>
                                        {categories.map(cat => (
                                            <TouchableOpacity
                                                key={cat}
                                                style={[styles.filterChip, tempFilters.categories.includes(cat) && styles.filterChipActive]}
                                                onPress={() => {
                                                    const newCats = tempFilters.categories.includes(cat)
                                                        ? tempFilters.categories.filter(c => c !== cat)
                                                        : [...tempFilters.categories, cat];
                                                    setTempFilters(prev => ({ ...prev, categories: newCats }));
                                                }}
                                            >
                                                <Text style={[styles.filterChipText, tempFilters.categories.includes(cat) && styles.filterChipTextActive]}>
                                                    {t(`manager.categories.${cat.toLowerCase()}`, { defaultValue: cat })}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Price Range */}
                                <View style={styles.filterSection}>
                                    <Text style={styles.filterLabel}>{t('filters.priceRange')}</Text>
                                    <View style={styles.dateInputContainer}>
                                        <View style={styles.dateInputWrapper}>
                                            <Text style={styles.dateInputLabel}>{t('filters.minPrice') || 'Min Price'}</Text>
                                            <TextInput
                                                style={styles.dateInput}
                                                placeholder="0"
                                                placeholderTextColor={Colors.dark.textSecondary}
                                                keyboardType="numeric"
                                                value={tempFilters.minPrice}
                                                onChangeText={text => setTempFilters(prev => ({ ...prev, minPrice: text }))}
                                            />
                                        </View>
                                        <View style={styles.dateInputWrapper}>
                                            <Text style={styles.dateInputLabel}>{t('filters.maxPrice') || 'Max Price'}</Text>
                                            <TextInput
                                                style={styles.dateInput}
                                                placeholder="10000"
                                                placeholderTextColor={Colors.dark.textSecondary}
                                                keyboardType="numeric"
                                                value={tempFilters.maxPrice}
                                                onChangeText={text => setTempFilters(prev => ({ ...prev, maxPrice: text }))}
                                            />
                                        </View>
                                    </View>
                                </View>

                            </ScrollView>

                            <View style={styles.filterFooter}>
                                <TouchableOpacity
                                    style={styles.resetButton}
                                    onPress={() => {
                                        setTempFilters({
                                            dateRange: 'all',
                                            startDate: null,
                                            endDate: null,
                                            type: 'all',
                                            categories: [],
                                            minPrice: '',
                                            maxPrice: ''
                                        });
                                    }}
                                >
                                    <Text style={styles.resetButtonText}>{t('filters.reset')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.applyButton}
                                    onPress={() => {
                                        setActiveFilters(tempFilters);
                                        setShowFilterModal(false);
                                    }}
                                >
                                    <Text style={styles.applyButtonText}>{t('filters.apply')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
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
    statsCard: {
        flexDirection: 'row',
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 20,
        marginTop: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
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
    statDivider: {
        width: 1,
        backgroundColor: Colors.dark.border,
        marginHorizontal: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        marginTop: 16,
    },
    searchInput: {
        flex: 1,
        backgroundColor: Colors.dark.inputBackground,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: Colors.dark.text,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.dark.text,
        marginTop: 20,
        marginBottom: 12,
    },
    purchaseCard: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    purchaseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    purchaseIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(253, 184, 19, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    purchaseInfo: {
        flex: 1,
    },
    purchaseName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 2,
    },
    purchaseCategory: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    purchasePrice: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.primary,
    },
    purchaseDetails: {
        gap: 8,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    notesContainer: {
        backgroundColor: Colors.dark.secondary,
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    notesLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
        marginBottom: 4,
    },
    notesText: {
        fontSize: 14,
        color: Colors.dark.text,
    },
    receiptContainer: {
        marginTop: 8,
        alignItems: 'center',
    },
    receiptImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 8,
    },
    receiptLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.primary,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        marginTop: 12,
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
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 8,
    },
    categoryScroll: {
        marginBottom: 12,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: Colors.dark.inputBackground,
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
        color: '#000000',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    halfInput: {
        flex: 1,
        marginBottom: 0,
    },
    detailSection: {
        marginBottom: 20,
    },
    detailLabel: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        color: Colors.dark.text,
        fontWeight: '600',
    },
    // Autocomplete Styles
    autocompleteContainer: {
        zIndex: 10,
        marginBottom: 12,
    },
    autocompleteDropdown: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: Colors.dark.card,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        maxHeight: 200,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    autocompleteList: {
        maxHeight: 200,
    },
    autocompleteItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    autocompleteItemContent: {
        flex: 1,
    },
    autocompleteItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    autocompleteItemCategory: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    autocompleteItemBadge: {
        backgroundColor: Colors.dark.secondary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    autocompleteItemUnit: {
        fontSize: 11,
        color: Colors.dark.text,
    },
    totalAmountDisplay: {
        backgroundColor: Colors.dark.secondary,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalAmountLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
    },
    totalAmountValue: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.primary,
    },
    // New Modal Styles
    modalKeyboardAvoidingView: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalScrollContent: {
        paddingBottom: 20,
    },
    closeButton: {
        padding: 4,
        borderRadius: 20,
        backgroundColor: Colors.dark.secondary,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    heroIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(253, 184, 19, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(253, 184, 19, 0.3)',
    },
    heroAmount: {
        fontSize: 36,
        fontWeight: '800',
        color: Colors.dark.primary,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    heroName: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    heroBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    heroBadgeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    metaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    metaItem: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: Colors.dark.secondary,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    metaLabel: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    metaValue: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    detailBlock: {
        marginBottom: 20,
    },
    blockLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 8,
    },
    noteBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: Colors.dark.primary,
    },
    noteContent: {
        fontSize: 15,
        color: Colors.dark.text,
        lineHeight: 22,
    },
    receiptBox: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.dark.border,
        backgroundColor: Colors.dark.background,
    },
    fullReceipt: {
        width: '100%',
        height: 350,
        backgroundColor: '#000',
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    dangerButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
    previewActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(253, 184, 19, 0.1)',
        padding: 12,
        borderRadius: 8,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(253, 184, 19, 0.3)',
    },
    actionButtonDestructive: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.primary,
    },
    actionTextDestructive: {
        color: '#EF4444',
    },
    // Full Screen Image Styles
    fullImageContainer: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImageClose: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 20,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    fullImageScroll: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginTop: 20,
    },
    deleteButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
    unitSelector: {
        flex: 1,
    },
    unitButton: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: Colors.dark.inputBackground,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginRight: 8,
    },
    unitButtonActive: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
    },
    unitText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.dark.textSecondary,
    },
    unitTextActive: {
        color: '#000000',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
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
        backgroundColor: Colors.dark.primary,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 8,
    },
    photoButtonText: {
        color: '#000000',
        fontWeight: '600',
        fontSize: 13,
        flexShrink: 1,
        textAlign: 'center',
    },
    previewContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    previewImageWrapper: {
        width: '100%',
    },
    removePhotoButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 4,
        borderRadius: 12,
    },
    submitButton: {
        backgroundColor: Colors.dark.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    typeBadgeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    purchaseTypeContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    purchaseTypeButton: {
        flex: 1,
        padding: 16,
        backgroundColor: Colors.dark.inputBackground,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        alignItems: 'center',
    },
    purchaseTypeButtonActive: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
    },
    purchaseTypeText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
        marginTop: 8,
        marginBottom: 4,
    },
    purchaseTypeTextActive: {
        color: '#000000',
    },
    purchaseTypeDesc: {
        fontSize: 11,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
    },
    purchaseTypeDescActive: {
        color: 'rgba(0,0,0,0.7)',
    },

    // Filter Styles
    filterButton: {
        backgroundColor: Colors.dark.card,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        width: 50,
    },
    filterButtonActive: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
    },
    filterScrollContent: {
        paddingBottom: 20,
    },
    filterSection: {
        marginBottom: 24,
    },
    filterSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 12,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 8,
    },
    filterChipsScroll: {
        marginBottom: 8,
    },
    dateInputContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    dateInputWrapper: {
        flex: 1,
    },
    dateInputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
        marginBottom: 8,
    },
    dateInput: {
        backgroundColor: Colors.dark.inputBackground,
        padding: 12,
        borderRadius: 8,
        color: Colors.dark.text,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        fontSize: 14,
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: Colors.dark.inputBackground,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: 'rgba(253, 184, 19, 0.2)',
        borderColor: Colors.dark.primary,
    },
    filterChipText: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
    },
    filterChipTextActive: {
        color: Colors.dark.primary,
        fontWeight: '600',
    },
    filterInputsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    filterInput: {
        flex: 1,
        backgroundColor: Colors.dark.inputBackground,
        padding: 12,
        borderRadius: 8,
        color: Colors.dark.text,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    filterFooter: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        backgroundColor: Colors.dark.card,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    resetButton: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.dark.inputBackground,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    resetButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    applyButton: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.dark.primary,
        borderRadius: 12,
    },
    applyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
});
