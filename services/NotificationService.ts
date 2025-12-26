import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

class NotificationService {
    private static instance: NotificationService;

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

    async registerForPushNotificationsAsync() {
        // In Expo Go, we can't get a remote push token without EAS or development build.
        // We only need local notifications for now, so we can skip the push token part if in Expo Go.
        // However, we still need permissions for local notifications.

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        // We are NOT calling getExpoPushTokenAsync() here to avoid the Expo Go error.
        // Since we are using local notifications, we don't strictly need the remote token yet.
    }

    async scheduleNotification(title: string, body: string, data: any = {}) {
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
                    sound: true,
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
