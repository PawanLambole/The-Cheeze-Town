import { Linking, Alert, Platform } from 'react-native';

class IntentPrinterService {
    /**
     * Print receipt by opening a driver app (RawBT) via URL scheme
     * This works in Expo Go because it doesn't require native modules!
     */
    async printViaRawBT(receiptText: string): Promise<void> {
        try {
            // Base64 encode the receipt text
            // In React Native/Expo, we can use global btoa or a library, 
            // but for simple text, a direct encodeURI usually works for some drivers,
            // but RawBT specifically likes base64 for reliable printing.
            const base64Text = btoa(unescape(encodeURIComponent(receiptText)));

            // RawBT scheme: rawbt:base64,data
            const scheme = `rawbt:base64,${base64Text}`;

            const canOpen = await Linking.canOpenURL(scheme);

            if (canOpen) {
                await Linking.openURL(scheme);
            } else {
                // App not installed
                this.promptInstallRawBT();
            }
        } catch (error) {
            console.error('Intent print error:', error);
            Alert.alert('Error', 'Could not open printer app. Please try again.');
        }
    }

    private promptInstallRawBT() {
        Alert.alert(
            'Printer Driver Missing',
            'To print from Expo Go, you need a helper app.\n\nPlease install "RawBT Print Service" from the Play Store.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Install RawBT',
                    onPress: () => {
                        if (Platform.OS === 'android') {
                            Linking.openURL('market://details?id=ru.a402d.rawbtprinter');
                        } else {
                            Linking.openURL('https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter');
                        }
                    }
                }
            ]
        );
    }
}

export default new IntentPrinterService();
