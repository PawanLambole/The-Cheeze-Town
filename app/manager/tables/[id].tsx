import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Share } from 'react-native';
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Share2, Download, QrCode, Trash2, RefreshCcw } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import AES from 'crypto-js/aes';
import { Colors } from '@/constants/Theme';
import { supabase, database } from '@/services/database';

// Configuration
const SECRET_KEY = "CHEEZETOWN_SECRET";
const BASE_URL = "https://the-cheeze-town.vercel.app";

export default function TableDetailsScreen() {
    const router = useRouter();
    const segments = useSegments();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams();
    const viewShotRef = useRef(null);
    const [table, setTable] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [qrValue, setQrValue] = useState('');

    useEffect(() => {
        if (id) {
            const parsedId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);
            fetchTableDetails(parsedId);
        }
    }, [id]);

    const fetchTableDetails = async (tableId: number) => {
        try {
            const { data, error } = await supabase
                .from('restaurant_tables')
                .select('*')
                .eq('id', tableId)
                .single();

            if (error) throw error;
            setTable(data);
            generateQrCode(data.id);
        } catch (error) {
            console.error('Error fetching table:', error);
            Alert.alert('Error', 'Failed to load table details');
        } finally {
            setLoading(false);
        }
    };

    const generateQrCode = (tableId: number) => {
        // Encrypt the table ID
        const encryptedId = AES.encrypt(tableId.toString(), SECRET_KEY).toString();
        // Create the final URL
        const url = `${BASE_URL}/?q=${encodeURIComponent(encryptedId)}`;
        setQrValue(url);
    };

    const handleShare = async () => {
        try {
            // @ts-ignore
            const uri = await viewShotRef.current.capture();

            if (!(await Sharing.isAvailableAsync())) {
                Alert.alert('Error', 'Sharing is not available on this device');
                return;
            }

            await Sharing.shareAsync(uri);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to share QR code');
        }
    };

    const handleDelete = async () => {
        if (!table) return;

        if (table.status === 'occupied') {
            Alert.alert('Cannot Delete', 'Table is currently occupied. Please complete the order first.');
            return;
        }

        Alert.alert(
            'Delete Table',
            `Are you sure you want to delete Table ${table.table_number}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const { error } = await database.delete('restaurant_tables', table.id);
                            if (error) throw error;
                            router.back();
                        } catch (error) {
                            console.error('Error deleting table:', error);
                            Alert.alert('Error', 'Failed to delete table');
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleDownload = async () => {
        try {
            // Request write-only permissions to avoid unnecessary AUDIO request on Android 13+
            const { status } = await MediaLibrary.requestPermissionsAsync(true);

            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please grant permission to save the QR code.');
                return;
            }

            // @ts-ignore
            const uri = await viewShotRef.current.capture();
            await MediaLibrary.saveToLibraryAsync(uri);
            Alert.alert('Success', 'QR Code card saved to gallery!');
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to save image');
        }
    };

    if (loading || !table) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        const basePath = segments[0] === 'owner' ? '/owner' : '/manager';
                        router.replace(`${basePath}/tables` as any);
                    }
                }}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Table {table.table_number}</Text>
                <TouchableOpacity onPress={handleShare}>
                    <Share2 size={24} color={Colors.dark.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Printable Card View */}
                <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
                    <View style={styles.qrCard}>
                        <View style={styles.qrHeader}>
                            <Text style={styles.qrBrand}>The Cheeze Town</Text>
                            <Text style={styles.qrSubtitle}>Scan to Order</Text>
                        </View>

                        <View style={styles.qrContainer}>
                            {qrValue ? (
                                <QRCode
                                    value={qrValue}
                                    size={200}
                                    logo={require('@/assets/images/logo.png')}
                                    logoSize={50}
                                    logoBackgroundColor='white'
                                    logoBorderRadius={25}
                                />
                            ) : (
                                <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ color: '#666' }}>Generating QR...</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.qrFooter}>
                            <Text style={styles.qrTableNumber}>Table {table.table_number}</Text>
                        </View>
                    </View>
                </ViewShot>

                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
                        <Download size={20} color="white" />
                        <Text style={styles.actionButtonText} numberOfLines={1} adjustsFontSizeToFit>Save</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.secondaryButton]}
                        onPress={() => generateQrCode(table.id)}
                    >
                        <RefreshCcw size={20} color={Colors.dark.text} />
                        <Text style={styles.secondaryButtonText}>Regenerate</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Table Information</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Capacity</Text>
                        <Text style={styles.infoValue}>{table.capacity} Persons</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Status</Text>
                        <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>{table.status}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Location</Text>
                        <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>{table.location || 'Indoor'}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                >
                    <Trash2 size={20} color="#EF4444" />
                    <Text style={styles.deleteButtonText}>Delete Table</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.dark.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.dark.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    qrCard: {
        width: 300,
        backgroundColor: '#FFFFFF', // White card for printing usually
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 30,
    },
    qrHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    qrBrand: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
        fontFamily: 'serif', // Match website font style loosely
    },
    qrSubtitle: {
        fontSize: 14,
        color: '#666666',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    qrContainer: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 10,
    },
    qrFooter: {
        alignItems: 'center',
        marginTop: 10,
    },
    qrTableNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#F59E0B', // Brand yellow-ish
    },
    qrFooterText: {
        fontSize: 12,
        color: '#999999',
        marginTop: 4,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 30,
        width: '100%',
        paddingHorizontal: 20,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.dark.primary,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    secondaryButton: {
        backgroundColor: Colors.dark.card,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },

    infoCard: {
        width: '100%',
        backgroundColor: Colors.dark.card,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    infoLabel: {
        color: Colors.dark.textSecondary,
        fontSize: 16,
    },
    infoValue: {
        color: Colors.dark.text,
        fontSize: 16,
        fontWeight: '500',
    },
    secondaryButtonText: {
        color: Colors.dark.text,
        fontWeight: '600',
        fontSize: 14,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        marginTop: 20,
        gap: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        width: '100%',
    },
    deleteButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
});
