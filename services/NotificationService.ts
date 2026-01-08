import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

class NotificationService {
    private static instance: NotificationService;
    private readonly androidChannelId = 'Orders_v4';

    private constructor() {
        this.configure();
    }

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    private configure() {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
    }

    private async ensureAndroidChannelAsync() {
        if (Platform.OS !== 'android') return;

        try {
            await Notifications.setNotificationChannelAsync(this.androidChannelId, {
                name: 'Orders Priority',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                enableVibrate: true,
                enableLights: true,
                // sound: 'belli.wav', // COMMENTED OUT: Custom sound fails in Expo Go => Silent => No Banner
            });

            // Debug: Log channels to verify creation and settings
            const channels = await Notifications.getNotificationChannelsAsync();
            const myChannel = channels.find(c => c.id === this.androidChannelId);
            console.log('📢 Notification Channels:', JSON.stringify(channels.map(c => ({ id: c.id, importance: c.importance })), null, 2));
            if (myChannel) {
                console.log(`✅ Channel '${this.androidChannelId}' exists with importance: ${myChannel.importance} (Expected: 5 for MAX)`);
            } else {
                console.error(`❌ Channel '${this.androidChannelId}' was NOT found!`);
            }

        } catch (error) {
            console.warn('Failed to set Android notification channel:', error);
        }
    }

    async registerForPushNotificationsAsync(): Promise<string | null> {
        await this.ensureAndroidChannelAsync();

        if (Platform.OS === 'web') {
            return null;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }

        try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.expoConfig?.slug;

            // For Expo Go, we can theoretically get the token if we have the project ID
            const token = (await Notifications.getExpoPushTokenAsync({
                projectId,
            })).data;
            console.log('✅ Expo Push Token:', token);
            return token;
        } catch (e: any) {
            console.error('Error getting push token:', e);
            return null;
        }
    }

    async scheduleNotification(
        title: string,
        body: string,
        data: any = {},
        options: { playSound?: boolean } = {}
    ) {
        if (Platform.OS === 'web') {
            console.log('Notification:', { title, body });
            // Simple web notification fallback
            if (typeof window !== 'undefined' && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                    new Notification(title, { body });
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            new Notification(title, { body });
                        }
                    });
                }
            }
            return;
        }

        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data,
                    sound: options.playSound === false ? false : 'default',
                    vibrate: [0, 250, 250, 250],
                },
                trigger: null, // Show immediately
            });
        } catch (error) {
            console.warn('Failed to schedule notification:', error);
        }
    }
}

export const notificationService = NotificationService.getInstance();
