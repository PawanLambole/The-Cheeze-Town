import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, RefreshCw, Calendar as CalendarIcon, Check, Sparkles, Copy } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { supabase } from '@/services/database';
import * as Clipboard from 'expo-clipboard';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';

export default function CreateOfferScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const id = params.id as string;
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [heading, setHeading] = useState('');
    const [type, setType] = useState('percentage_bill'); // percentage_bill, percentage_item, menu_item_percentage
    const [code, setCode] = useState('');
    const [value, setValue] = useState('');
    const [minBill, setMinBill] = useState('');
    const [validFrom, setValidFrom] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [validTo, setValidTo] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | null>(null);

    // Item Selection
    const [targetItemId, setTargetItemId] = useState<string | number | null>(null);
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [showItemModal, setShowItemModal] = useState(false);

    useEffect(() => {
        fetchMenuItems();
        if (id) {
            fetchOfferDetails();
        }
    }, [id]);

    const fetchMenuItems = async () => {
        const { data } = await supabase.from('menu_items').select('id, name, price');
        if (data) setMenuItems(data);
    };

    const fetchOfferDetails = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('offers' as any)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                const offer = data as any;
                setHeading(offer.heading || '');
                setType(offer.type);
                setCode(offer.code);
                setValue(offer.value.toString());
                setMinBill(offer.min_bill_amount?.toString() || '');
                setTargetItemId(offer.target_item_id);
                setValidFrom(new Date(offer.valid_from).toISOString().split('T')[0]);
                setValidTo(new Date(offer.valid_to).toISOString().split('T')[0]);
            }
        } catch (error) {
            console.error('Error fetching offer details:', error);
            Alert.alert(t('common.error'), t('offers.errorFetch'));
        } finally {
            setLoading(false);
        }
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        setCode(result);
    };

    const handleCopy = async () => {
        if (!code) return;
        await Clipboard.setStringAsync(code);
        Alert.alert(t('common.success'), t('offers.copied'));
    };

    const generateSuggestion = () => {
        if (!value) {
            Alert.alert(t('common.error'), t('offers.errorFields'));
            return;
        }

        let suggestion = '';
        if (type === 'percentage_bill') {
            suggestion = `${t('offers.get')} ${value}% ${t('offers.offOnBill')}`;
            if (minBill) suggestion += ` ${t('offers.above')} ₹${minBill}`;
        } else if (type === 'percentage_item') {
            suggestion = `${t('offers.flat')} ${value}% ${t('offers.offOnAll')}`;
        } else if (type === 'menu_item_percentage') {
            const itemName = menuItems.find(i => i.id === targetItemId)?.name || 'Item';
            suggestion = `${value}% ${t('offers.offOn')} ${itemName}!`;
        }

        setHeading(suggestion);
    };

    const handleCreate = async () => {
        if (!code || !value || !validFrom || !validTo || !heading) {
            Alert.alert(t('common.error'), t('offers.errorFields'));
            return;
        }

        if ((type === 'menu_item_percentage') && !targetItemId) {
            Alert.alert(t('common.error'), t('offers.errorItem'));
            return;
        }

        setLoading(true);
        try {
            const offerData = {
                heading,
                code: code.toUpperCase(),
                type,
                value: Number(value),
                min_bill_amount: Number(minBill) || 0,
                target_item_id: targetItemId,
                // Construct date in local time to preseve the intended day
                valid_from: new Date(new Date(validFrom).setHours(0, 0, 0, 0)).toISOString(),
                valid_to: new Date(new Date(validTo).setHours(23, 59, 59, 999)).toISOString(),
                is_active: true
            };

            let error;
            if (id) {
                const { error: updateError } = await supabase
                    .from('offers' as any)
                    .update(offerData)
                    .eq('id', id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('offers' as any)
                    .insert(offerData);
                error = insertError;
            }

            if (error) throw error;

            Alert.alert(
                t('common.success'),
                id ? t('offers.successUpdate') : t('offers.success'),
                [{ text: t('common.done'), onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message || (id ? t('offers.errorUpdate') : t('offers.errorCreate')));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{id ? t('offers.editTitle') : t('offers.createTitle')}</Text>
                <TouchableOpacity onPress={handleCreate} disabled={loading}>
                    <Text style={[styles.saveButton, loading && { opacity: 0.5 }]}>
                        {id ? t('offers.update') : t('offers.save')}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Offer Type */}
                <Text style={styles.label}>{t('offers.type')}</Text>
                <View style={styles.typeContainer}>
                    <TouchableOpacity
                        style={[styles.typeButton, type === 'percentage_bill' && styles.typeButtonActive]}
                        onPress={() => { setType('percentage_bill'); setTargetItemId(null); }}
                    >
                        <Text style={[styles.typeText, type === 'percentage_bill' && styles.typeTextActive]}>{t('offers.types.percentage_bill')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeButton, type === 'percentage_item' && styles.typeButtonActive]}
                        onPress={() => { setType('percentage_item'); setTargetItemId(null); }}
                    >
                        <Text style={[styles.typeText, type === 'percentage_item' && styles.typeTextActive]}>{t('offers.types.percentage_item')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeButton, type === 'menu_item_percentage' && styles.typeButtonActive]}
                        onPress={() => setType('menu_item_percentage')}
                    >
                        <Text style={[styles.typeText, type === 'menu_item_percentage' && styles.typeTextActive]}>{t('offers.types.menu_item_percentage')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Selected Item Display */}
                {type === 'menu_item_percentage' && (
                    <TouchableOpacity style={styles.itemSelector} onPress={() => setShowItemModal(true)}>
                        <Text style={styles.itemSelectorText}>
                            {targetItemId
                                ? menuItems.find(i => i.id === targetItemId)?.name || t('offers.selectItem')
                                : t('offers.selectItem')
                            }
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Coupon Code */}
                <Text style={styles.label}>{t('offers.code')}</Text>


                {/* Input Field - Full Width */}
                <TextInput
                    style={styles.codeInput}
                    value={code}
                    onChangeText={setCode}
                    placeholder="e.g. SUMMER30"
                    placeholderTextColor={Colors.dark.textSecondary}
                    autoCapitalize="characters"
                />

                {/* Action Buttons Row */}
                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
                        <Copy size={20} color={Colors.dark.text} />
                        <Text style={styles.actionButtonText}>Copy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, styles.autoButton]} onPress={generateCode}>
                        <RefreshCw size={20} color="#000" />
                        <Text style={styles.generateButtonText}>{t('offers.auto')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Discount Value */}
                <Text style={styles.label}>{t('offers.discount')}</Text>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={setValue}
                    keyboardType="numeric"
                    placeholder="e.g. 30"
                    placeholderTextColor={Colors.dark.textSecondary}
                />

                {/* Min Bill Amount */}
                <Text style={styles.label}>{t('offers.minBill')}</Text>
                <TextInput
                    style={styles.input}
                    value={minBill}
                    onChangeText={setMinBill}
                    keyboardType="numeric"
                    placeholder="e.g. 500"
                    placeholderTextColor={Colors.dark.textSecondary}
                />

                {/* Date Range */}
                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.label}>{t('offers.validFrom')}</Text>
                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => setShowDatePicker('from')}
                        >
                            <Text style={{ color: Colors.dark.text }}>
                                {validFrom.split('-').reverse().join('-')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.label}>{t('offers.validTo')}</Text>
                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => setShowDatePicker('to')}
                        >
                            <Text style={{ color: Colors.dark.text }}>
                                {validTo.split('-').reverse().join('-')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={new Date(showDatePicker === 'from' ? validFrom : validTo)}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(null);
                            if (selectedDate) {
                                const dateStr = selectedDate.toISOString().split('T')[0];
                                if (showDatePicker === 'from') {
                                    setValidFrom(dateStr);
                                } else {
                                    setValidTo(dateStr);
                                }
                            }
                        }}
                    />
                )}

                {/* Offer Heading (Moved to Bottom) */}
                <Text style={styles.label}>{t('offers.heading')}</Text>

                <TextInput
                    style={styles.headingInput}
                    value={heading}
                    onChangeText={setHeading}
                    placeholder={t('offers.headingPlaceholder') || "e.g. Summer Sale"}
                    placeholderTextColor={Colors.dark.textSecondary}
                    multiline
                />

                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={[styles.actionButton, styles.autoButton]} onPress={generateSuggestion}>
                        <Sparkles size={20} color="#000" />
                        <Text style={styles.generateButtonText}>{t('offers.generate')}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.hintText}>{t('offers.generateHint')}</Text>

            </ScrollView>

            {/* Item Selection Modal */}
            <Modal visible={showItemModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('offers.selectItem')}</Text>
                        <ScrollView>
                            {menuItems.map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setTargetItemId(item.id);
                                        setShowItemModal(false);
                                    }}
                                >
                                    <Text style={styles.modalItemText}>{item.name} - ₹{item.price}</Text>
                                    {targetItemId === item.id && <Check size={20} color={Colors.dark.primary} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowItemModal(false)}>
                            <Text style={styles.closeButtonText}>{t('offers.close')}</Text>
                        </TouchableOpacity>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: Colors.dark.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    saveButton: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.dark.primary,
    },
    content: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        color: Colors.dark.text,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginBottom: 20,
        minHeight: 56, // Increased height for better touch target and visibility
        textAlignVertical: 'center',
    },
    codeInput: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: Colors.dark.text,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 2,
        minHeight: 60,
        textAlignVertical: 'center',
        marginBottom: 12, // Gap between input and buttons
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: Colors.dark.card,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    autoButton: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
        flex: 1.5, // Make auto button slightly wider
    },
    actionButtonText: {
        color: Colors.dark.text,
        fontWeight: '600',
    },
    headingInput: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: Colors.dark.text,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        fontSize: 16,
        minHeight: 60, // Taller for heading
        textAlignVertical: 'center', // Center text vertically
        marginBottom: 12,
    },
    generateButtonText: {
        fontWeight: '700',
        color: '#000',
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    typeButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        backgroundColor: Colors.dark.card,
    },
    typeButtonActive: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
    },
    typeText: {
        color: Colors.dark.textSecondary,
        fontWeight: '600',
    },
    typeTextActive: {
        color: '#000',
    },
    row: {
        flexDirection: 'row',
    },
    itemSelector: {
        backgroundColor: Colors.dark.card,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginBottom: 20,
    },
    itemSelectorText: {
        color: Colors.dark.text,
        fontSize: 16,
    },
    hintText: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginTop: 4,
        fontStyle: 'italic',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: Colors.dark.card,
        borderRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
        marginBottom: 20,
    },
    modalItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalItemText: {
        color: Colors.dark.text,
        fontSize: 16,
    },
    closeButton: {
        marginTop: 20,
        padding: 16,
        backgroundColor: Colors.dark.border,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        color: Colors.dark.text,
        fontWeight: '600',
    },
});
