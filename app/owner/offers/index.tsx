import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Plus, Tag, Calendar, Trash2, ArrowLeft, X, Copy, Edit } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '@/constants/Theme';
import { useTranslation } from 'react-i18next';
import { useState, useCallback } from 'react';
import { supabase } from '@/services/database';
import { useFocusEffect } from 'expo-router';

interface Offer {
    id: string;
    heading?: string;
    code: string;
    type: string;
    value: number;
    valid_from: string;
    valid_to: string;
    is_active: boolean;
    min_bill_amount: number;
}

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OffersScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOffers = async () => {
        setRefreshing(true);
        try {
            const { data, error } = await supabase
                .from('offers' as any)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOffers((data as any) || []);
        } catch (error) {
            console.error('Error fetching offers:', error);
            Alert.alert(t('common.error'), t('offers.errorFetch'));
        } finally {
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOffers();
        }, [])
    );

    const handleDelete = (id: string) => {
        Alert.alert(
            t('offers.deleteConfirm'),
            t('offers.deleteMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase.from('offers' as any).delete().eq('id', id);
                            if (error) throw error;
                            fetchOffers();
                        } catch (error) {
                            Alert.alert(t('common.error'), t('offers.errorDelete'));
                        }
                    },
                },
            ]
        );
    };

    const getOfferDescription = (offer: Offer) => {
        if (offer.type === 'percentage_bill') return t('offers.types.percentage_bill') + ` (${offer.value}%)`;
        if (offer.type === 'percentage_item') return t('offers.types.percentage_item') + ` (${offer.value}%)`;
        if (offer.type === 'menu_item_percentage') return t('offers.types.menu_item_percentage') + ` (${offer.value}%)`;
        return 'Unknown Offer';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleOfferClick = (offer: Offer) => {
        setSelectedOffer(offer);
        setModalVisible(true);
    };

    const copyToClipboard = async (code: string) => {
        await Clipboard.setStringAsync(code);
        Alert.alert(t('common.success'), t('offers.copied'));
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('offers.title')}</Text>
                <Link href="/owner/offers/create" asChild>
                    <TouchableOpacity>
                        <Plus size={24} color={Colors.dark.primary} />
                    </TouchableOpacity>
                </Link>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchOffers} tintColor={Colors.dark.primary} />
                }
            >
                {offers.map((offer) => (
                    <TouchableOpacity
                        key={offer.id}
                        style={styles.offerCard}
                        onPress={() => handleOfferClick(offer)}
                        activeOpacity={0.9}
                    >
                        {offer.heading && (
                            <Text style={styles.offerHeading}>{offer.heading}</Text>
                        )}
                        <View style={styles.offerHeader}>
                            <View style={styles.codeContainer}>
                                <Tag size={16} color={Colors.dark.primary} />
                                <Text style={styles.offerCode}>{offer.code}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(offer.id)}>
                                <Trash2 size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.offerDescription}>{getOfferDescription(offer)}</Text>

                        <View style={styles.offerDetails}>
                            <View style={styles.detailRow}>
                                <Calendar size={14} color={Colors.dark.textSecondary} />
                                <Text style={styles.detailText}>
                                    {formatDate(offer.valid_from)} - {formatDate(offer.valid_to)}
                                </Text>
                            </View>
                            {offer.min_bill_amount > 0 && (
                                <Text style={styles.detailText}>{t('offers.minBill')}: ₹{offer.min_bill_amount}</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
                {offers.length === 0 && !refreshing && (
                    <Text style={styles.emptyText}>{t('offers.noOffers')}</Text>
                )}
            </ScrollView>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('offers.title')}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color={Colors.dark.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedOffer && (
                            <ScrollView style={styles.modalBody}>
                                {selectedOffer.heading && (
                                    <Text style={styles.modalHeading}>{selectedOffer.heading}</Text>
                                )}

                                <View style={styles.modalCodeSection}>
                                    <Text style={styles.modalCodeLabel}>{t('offers.code')}:</Text>
                                    <View style={styles.modalCodeContainer}>
                                        <Text style={styles.modalCode}>{selectedOffer.code}</Text>
                                        <TouchableOpacity
                                            style={styles.copyButton}
                                            onPress={() => copyToClipboard(selectedOffer.code)}
                                        >
                                            <Copy size={20} color={Colors.dark.background} />
                                            <Text style={styles.copyButtonText}>{t('common.copy') || 'Copy'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.modalDetailItem}>
                                    <Text style={styles.modalDetailLabel}>{t('offers.type')}:</Text>
                                    <Text style={styles.modalDetailValue}>{getOfferDescription(selectedOffer)}</Text>
                                </View>

                                <View style={styles.modalDetailItem}>
                                    <Text style={styles.modalDetailLabel}>{t('offers.discount')}:</Text>
                                    <Text style={styles.modalDetailValue}>{selectedOffer.value}%</Text>
                                </View>

                                <View style={styles.modalDetailItem}>
                                    <Text style={styles.modalDetailLabel}>{t('offers.validFrom')}:</Text>
                                    <Text style={styles.modalDetailValue}>{formatDate(selectedOffer.valid_from)}</Text>
                                </View>

                                <View style={styles.modalDetailItem}>
                                    <Text style={styles.modalDetailLabel}>{t('offers.validTo')}:</Text>
                                    <Text style={styles.modalDetailValue}>{formatDate(selectedOffer.valid_to)}</Text>
                                </View>

                                {selectedOffer.min_bill_amount > 0 && (
                                    <View style={styles.modalDetailItem}>
                                        <Text style={styles.modalDetailLabel}>{t('offers.minBill')}:</Text>
                                        <Text style={styles.modalDetailValue}>₹{selectedOffer.min_bill_amount}</Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() => {
                                        setModalVisible(false);
                                        router.push({ pathname: '/owner/offers/create', params: { id: selectedOffer.id } });
                                    }}
                                >
                                    <Edit size={20} color={Colors.dark.background} />
                                    <Text style={styles.editButtonText}>{t('common.edit')}</Text>
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
    content: {
        flex: 1,
        padding: 20,
    },
    offerCard: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    offerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(253, 184, 19, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    offerCode: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.dark.primary,
    },
    offerDescription: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 12,
    },
    offerDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.dark.textSecondary,
        marginTop: 40,
        fontSize: 16,
    },
    offerHeading: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.dark.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        minHeight: '50%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    modalBody: {
        flex: 1,
    },
    modalHeading: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.dark.primary,
        marginBottom: 16,
    },
    modalCodeSection: {
        backgroundColor: Colors.dark.background,
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    modalCodeLabel: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginBottom: 8,
    },
    modalCodeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalCode: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.text,
        letterSpacing: 1,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    copyButtonText: {
        color: Colors.dark.background,
        fontWeight: 'bold',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.dark.border,
        marginBottom: 20,
    },
    modalDetailItem: {
        marginBottom: 16,
    },
    modalDetailLabel: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginBottom: 4,
    },
    modalDetailValue: {
        fontSize: 16,
        color: Colors.dark.text,
        fontWeight: '500',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        backgroundColor: Colors.dark.primary,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    editButtonText: {
        color: Colors.dark.background,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
