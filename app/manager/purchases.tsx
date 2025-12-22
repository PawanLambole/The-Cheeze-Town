import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, X, Camera, User, Package, IndianRupee, Calendar, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Theme';
import { database, supabase } from '@/services/database';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';

interface Purchase {
    id: string;
    purchaseType: 'inventory' | 'other';
    itemName: string;
    category: string;
    quantity: number;
    unit: string;
    totalPrice: number;
    supplier: string;
    assignedTo: string;
    purchaseDate: string;
    receiptPhoto?: string;
    notes?: string;
}

export default function PurchasesScreen() {
    const router = useRouter();
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form fields
    const [formPurchaseType, setFormPurchaseType] = useState<'inventory' | 'other'>('inventory');
    const [formItemName, setFormItemName] = useState('');
    const [formCategory, setFormCategory] = useState('');
    const [formQuantity, setFormQuantity] = useState('');
    const [formUnit, setFormUnit] = useState('kg');
    const [formPrice, setFormPrice] = useState('');
    const [formSupplier, setFormSupplier] = useState('');
    const [formAssignedTo, setFormAssignedTo] = useState('');
    const [formNotes, setFormNotes] = useState('');
    const [formReceiptPhoto, setFormReceiptPhoto] = useState<string | undefined>(undefined);
    const [formMinStock, setFormMinStock] = useState('');
    const [showAutocomplete, setShowAutocomplete] = useState(false);

    // Mock inventory items for autocomplete
    const inventoryItems = [
        { name: 'Cheese (Mozzarella)', category: 'Dairy', unit: 'kg', minStock: 10 },
        { name: 'Tomatoes', category: 'Vegetables', unit: 'kg', minStock: 5 },
        { name: 'Pizza Dough', category: 'Dairy', unit: 'kg', minStock: 15 },
        { name: 'Bell Peppers', category: 'Vegetables', unit: 'kg', minStock: 5 },
        { name: 'Oregano', category: 'Spices', unit: 'kg', minStock: 1 },
        { name: 'Olive Oil', category: 'Beverages', unit: 'L', minStock: 8 },
        { name: 'Pizza Boxes', category: 'Packaging', unit: 'pieces', minStock: 100 },
        { name: 'Onions', category: 'Vegetables', unit: 'kg', minStock: 10 },
        { name: 'Garlic', category: 'Vegetables', unit: 'kg', minStock: 3 },
        { name: 'Basil', category: 'Spices', unit: 'g', minStock: 200 },
    ];

    const filteredInventoryItems = inventoryItems.filter(item =>
        item.name.toLowerCase().includes(formItemName.toLowerCase())
    );

    const categories = ['Vegetables', 'Dairy', 'Meat', 'Spices', 'Beverages', 'Packaging', 'Equipment', 'Other'];
    const units = ['kg', 'g', 'L', 'ml', 'pieces', 'boxes'];

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
                totalPrice: Number(p.total_price),
                supplier: p.supplier || 'N/A',
                assignedTo: p.assigned_to,
                purchaseDate: p.purchase_date,
                receiptPhoto: p.receipt_photo,
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
        }, [])
    );

    const filteredPurchases = purchases.filter(purchase =>
        purchase.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.totalPrice, 0);

    const resetForm = () => {
        setFormPurchaseType('inventory');
        setFormItemName('');
        setFormCategory('');
        setFormQuantity('');
        setFormUnit('kg');
        setFormPrice('');
        setFormSupplier('');
        setFormAssignedTo('');
        setFormNotes('');
        setFormReceiptPhoto(undefined);
        setFormMinStock('');
        setShowAutocomplete(false);
    };

    const selectInventoryItem = (item: typeof inventoryItems[0]) => {
        setFormItemName(item.name);
        setFormCategory(item.category);
        setFormUnit(item.unit);
        setFormMinStock(String(item.minStock));
        setShowAutocomplete(false);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setFormReceiptPhoto(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setFormReceiptPhoto(result.assets[0].uri);
        }
    };

    const handleAddPurchase = async () => {
        if (!formItemName.trim() || !formQuantity || !formPrice || !formAssignedTo.trim()) {
            return;
        }

        // Validate min stock for inventory purchases
        if (formPurchaseType === 'inventory' && !formMinStock) {
            alert('Please enter minimum stock level for inventory purchases');
            return;
        }

        try {
            const newPurchase = {
                purchase_type: formPurchaseType,
                item_name: formItemName.trim(),
                category: formCategory || 'Other',
                quantity: parseFloat(formQuantity),
                unit: formUnit,
                total_price: parseFloat(formPrice),
                supplier: formSupplier.trim() || 'N/A',
                assigned_to: formAssignedTo.trim(),
                purchase_date: new Date().toISOString().split('T')[0],
                receipt_photo: formReceiptPhoto,
                notes: formNotes.trim() || null,
            };

            const { error } = await supabase
                .from('purchases')
                .insert([newPurchase]);

            if (error) throw error;

            fetchPurchases();

            if (formPurchaseType === 'inventory') {
                // Check if item exists in inventory_items to update stock
                const { data: existingItems } = await supabase
                    .from('inventory_items')
                    .select('*')
                    .ilike('name', formItemName.trim());

                if (existingItems && existingItems.length > 0) {
                    const item = existingItems[0];
                    await supabase.from('inventory_items').update({
                        current_stock: (Number(item.current_stock) + parseFloat(formQuantity))
                    }).eq('id', item.id);
                } else {
                    await supabase.from('inventory_items').insert([{
                        name: formItemName.trim(),
                        category: formCategory || 'Other',
                        unit: formUnit,
                        current_stock: parseFloat(formQuantity),
                        min_stock: parseFloat(formMinStock) || 0
                    }]);
                }
            }

            setShowAddModal(false);
            resetForm();
        } catch (e) {
            console.error("Error adding purchase:", e);
            alert("Failed to add purchase");
        }
    };

    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Purchases & Expenses</Text>
                <TouchableOpacity onPress={() => setShowAddModal(true)}>
                    <Plus size={24} color={Colors.dark.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Stats Card */}
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{purchases.length}</Text>
                        <Text style={styles.statLabel}>Total Purchases</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: Colors.dark.primary }]}>₹{totalSpent.toLocaleString()}</Text>
                        <Text style={styles.statLabel}>Total Spent</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search purchases..."
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />

                {/* Purchases List */}
                <Text style={styles.sectionTitle}>Purchase History</Text>
                {filteredPurchases.map(purchase => (
                    <View key={purchase.id} style={styles.purchaseCard}>
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
                                            {purchase.purchaseType === 'inventory' ? 'Inventory' : 'Expense'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.purchasePrice}>₹{purchase.totalPrice.toLocaleString()}</Text>
                        </View>

                        <View style={styles.purchaseDetails}>
                            <View style={styles.detailRow}>
                                <Package size={14} color={Colors.dark.textSecondary} />
                                <Text style={styles.detailText}>
                                    {purchase.quantity} {purchase.unit}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <User size={14} color={Colors.dark.textSecondary} />
                                <Text style={styles.detailText}>{purchase.assignedTo}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Calendar size={14} color={Colors.dark.textSecondary} />
                                <Text style={styles.detailText}>{purchase.purchaseDate}</Text>
                            </View>
                            {purchase.supplier !== 'N/A' && (
                                <View style={styles.detailRow}>
                                    <User size={14} color={Colors.dark.textSecondary} />
                                    <Text style={styles.detailText}>{purchase.supplier}</Text>
                                </View>
                            )}
                        </View>

                        {purchase.notes && (
                            <View style={styles.notesContainer}>
                                <Text style={styles.notesLabel}>Notes:</Text>
                                <Text style={styles.notesText}>{purchase.notes}</Text>
                            </View>
                        )}

                        {purchase.receiptPhoto && (
                            <TouchableOpacity style={styles.receiptContainer}>
                                <Image source={{ uri: purchase.receiptPhoto }} style={styles.receiptImage} />
                                <Text style={styles.receiptLabel}>View Receipt</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}

                {filteredPurchases.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Package size={48} color={Colors.dark.secondary} />
                        <Text style={styles.emptyText}>No purchases found</Text>
                    </View>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Add Purchase Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Purchase</Text>
                            <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                                <X size={24} color={Colors.dark.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>Purchase Type *</Text>
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
                                        Inventory Purchase
                                    </Text>
                                    <Text style={[
                                        styles.purchaseTypeDesc,
                                        formPurchaseType === 'inventory' && styles.purchaseTypeDescActive
                                    ]}>
                                        Adds to inventory
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
                                        Other Purchase
                                    </Text>
                                    <Text style={[
                                        styles.purchaseTypeDesc,
                                        formPurchaseType === 'other' && styles.purchaseTypeDescActive
                                    ]}>
                                        General expense
                                    </Text>
                                </TouchableOpacity>
                            </View>


                            <View style={styles.autocompleteContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Item Name *"
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


                            <Text style={styles.inputLabel}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                                {categories.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.categoryChip, formCategory === cat && styles.categoryChipActive]}
                                        onPress={() => setFormCategory(cat)}
                                    >
                                        <Text style={[styles.categoryText, formCategory === cat && styles.categoryTextActive]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.row}>
                                <TextInput
                                    style={[styles.input, styles.halfInput]}
                                    placeholder="Quantity *"
                                    placeholderTextColor={Colors.dark.textSecondary}
                                    keyboardType="numeric"
                                    value={formQuantity}
                                    onChangeText={setFormQuantity}
                                />
                                <View style={styles.unitSelector}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {units.map(u => (
                                            <TouchableOpacity
                                                key={u}
                                                style={[styles.unitButton, formUnit === u && styles.unitButtonActive]}
                                                onPress={() => setFormUnit(u)}
                                            >
                                                <Text style={[styles.unitText, formUnit === u && styles.unitTextActive]}>{u}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Total Price (₹) *"
                                placeholderTextColor={Colors.dark.textSecondary}
                                keyboardType="numeric"
                                value={formPrice}
                                onChangeText={setFormPrice}
                            />

                            {formPurchaseType === 'inventory' && (
                                <TextInput
                                    style={styles.input}
                                    placeholder="Minimum Stock Level *"
                                    placeholderTextColor={Colors.dark.textSecondary}
                                    keyboardType="numeric"
                                    value={formMinStock}
                                    onChangeText={setFormMinStock}
                                />
                            )}

                            <TextInput
                                style={styles.input}
                                placeholder="Supplier"
                                placeholderTextColor={Colors.dark.textSecondary}
                                value={formSupplier}
                                onChangeText={setFormSupplier}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Assigned To (Person's Name) *"
                                placeholderTextColor={Colors.dark.textSecondary}
                                value={formAssignedTo}
                                onChangeText={setFormAssignedTo}
                            />

                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Notes (Optional)"
                                placeholderTextColor={Colors.dark.textSecondary}
                                multiline
                                numberOfLines={3}
                                value={formNotes}
                                onChangeText={setFormNotes}
                            />

                            <Text style={styles.inputLabel}>Receipt Photo (Optional)</Text>
                            <View style={styles.photoButtons}>
                                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                                    <Camera size={20} color="#000000" />
                                    <Text style={styles.photoButtonText}>Take Photo</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                                    <ImageIcon size={20} color="#000000" />
                                    <Text style={styles.photoButtonText}>Choose from Gallery</Text>
                                </TouchableOpacity>
                            </View>

                            {formReceiptPhoto && (
                                <View style={styles.previewContainer}>
                                    <Image source={{ uri: formReceiptPhoto }} style={styles.previewImage} />
                                    <TouchableOpacity
                                        style={styles.removePhotoButton}
                                        onPress={() => setFormReceiptPhoto(undefined)}
                                    >
                                        <X size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            )}

                            <TouchableOpacity style={styles.submitButton} onPress={handleAddPurchase}>
                                <Text style={styles.submitButtonText}>Add Purchase</Text>
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
    searchInput: {
        backgroundColor: Colors.dark.inputBackground,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: Colors.dark.text,
        marginTop: 16,
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
});
