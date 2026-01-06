
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Phone, Mail, MapPin } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';

export default function RestaurantInfoScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const handleCall = (number: string) => {
        Linking.openURL(`tel:${number}`);
    };

    const handleEmail = (email: string) => {
        Linking.openURL(`mailto:${email}`);
    };

    const handleLocation = () => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${20.906000},${74.776000}`; // Approx coordinates for Dhule, adapt if needed or use address query
        const label = 'The Cheese Town';
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        if (url) {
             Linking.openURL(url);
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('manager.settings.restaurantDetails.title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                
                {/* Phone Section */}
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <Phone size={32} color={Colors.dark.primary} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{t('manager.settings.restaurantDetails.phone')}</Text>
                        <Text style={styles.cardSubtitle}>{t('manager.settings.restaurantDetails.callUs')}</Text>
                        
                        <View style={styles.infoGroup}>
                            <Text style={styles.label}>Rahul Barve</Text>
                            <View style={styles.phoneRow}>
                                <TouchableOpacity onPress={() => handleCall('9823227596')}>
                                    <Text style={styles.link}>9823227596</Text>
                                </TouchableOpacity>
                                <Text style={styles.divider}>/</Text>
                                <TouchableOpacity onPress={() => handleCall('8767861283')}>
                                    <Text style={styles.link}>8767861283</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                         <View style={styles.infoGroup}>
                            <Text style={styles.label}>Pavan Vitthal Lambole</Text>
                            <TouchableOpacity onPress={() => handleCall('+919766573966')}>
                                <Text style={styles.link}>+91 97665 73966</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Email Section */}
                <View style={styles.card}>
                     <View style={styles.iconContainer}>
                        <Mail size={32} color={Colors.dark.primary} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{t('manager.settings.restaurantDetails.email')}</Text>
                        <Text style={styles.cardSubtitle}>{t('manager.settings.restaurantDetails.emailUs')}</Text>
                         
                        <View style={styles.infoGroup}>
                             <TouchableOpacity onPress={() => handleEmail('thecheesetown@gmail.com')}>
                                <Text style={styles.link}>thecheesetown@gmail.com</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.infoGroup}>
                             <Text style={styles.label}>Pavan Vitthal Lambole</Text>
                             <TouchableOpacity onPress={() => handleEmail('pavanlambole578@gmail.com')}>
                                <Text style={styles.link}>pavanlambole578@gmail.com</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                 {/* Location Section */}
                <View style={styles.card}>
                     <View style={styles.iconContainer}>
                        <MapPin size={32} color={Colors.dark.primary} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{t('manager.settings.restaurantDetails.location')}</Text>
                        <View style={styles.infoGroup}>
                            <Text style={styles.address}>Infront of V.W.S College,</Text>
                            <Text style={styles.address}>Near Sakri Road,</Text>
                            <Text style={styles.address}>Dhule.</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>
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
    },
    scrollContent: {
        padding: 20,
        gap: 20,
    },
    card: {
        backgroundColor: Colors.dark.background, // Or darker card color if desired, matching image: likely plain background or slightly elevated
        borderWidth: 1,
        borderColor: Colors.dark.primary, // Using primary for border as seen in image (golden/yellow)
        borderRadius: 16,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)', // Dark background for icon
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.primary,
        marginRight: 20,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    cardSubtitle: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginBottom: 16,
    },
    infoGroup: {
        marginBottom: 16,
    },
    label: {
         fontSize: 12,
         color: Colors.dark.textSecondary,
         marginBottom: 4,
         fontWeight: '600'
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap'
    },
    link: {
        fontSize: 16,
        color: Colors.dark.primary,
        fontWeight: '700',
    },
    divider: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        marginHorizontal: 8,
    },
    address: {
         fontSize: 16,
        color: Colors.dark.textSecondary,
        lineHeight: 24
    }
});
