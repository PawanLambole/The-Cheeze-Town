import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

type PermissionCheckResult = {
    granted: boolean;
    canAskAgain: boolean;
    status: Notifications.PermissionStatus;
};

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
            const isExpoGo = Constants.appOwnership === 'expo';

            // Delete ONLY the specific channel to reset importance if needed
            await Notifications.deleteNotificationChannelAsync(this.androidChannelId);

            await Notifications.setNotificationChannelAsync(this.androidChannelId, {
                name: 'Orders Priority',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                enableVibrate: true,
                enableLights: true,
                sound: isExpoGo ? 'default' : 'belli.wav',
                bypassDnd: true,
                showBadge: true,
            });

        } catch (error) {
            console.warn('Failed to configure Android notification channel:', error);
        }
    }

    async ensureNotificationPermissionsAsync(): Promise<PermissionCheckResult> {
        if (Platform.OS === 'web') {
            return { granted: true, canAskAgain: true, status: 'granted' as any };
        }

        const current = await Notifications.getPermissionsAsync();
        const currentGranted = (current as any).granted === true || current.status === 'granted';
        const canAskAgain = typeof (current as any).canAskAgain === 'boolean' ? (current as any).canAskAgain : true;

        if (currentGranted) {
            return { granted: true, canAskAgain, status: current.status };
        }

        if (canAskAgain) {
            const requested = await Notifications.requestPermissionsAsync();
            const requestedGranted = (requested as any).granted === true || requested.status === 'granted';
            const requestedCanAskAgain = typeof (requested as any).canAskAgain === 'boolean' ? (requested as any).canAskAgain : canAskAgain;
            return { granted: requestedGranted, canAskAgain: requestedCanAskAgain, status: requested.status };
        }

        return { granted: false, canAskAgain: false, status: current.status };
    }

    async registerForPushNotificationsAsync(): Promise<string | null> {
        if (Platform.OS === 'android') {
            await this.ensureAndroidChannelAsync();
        }

        if (Platform.OS === 'web') {
            return null;
        }

        if (!Device.isDevice) {
            console.log('Must use physical device for Push Notifications');
            return null;
        }

        const permission = await this.ensureNotificationPermissionsAsync();
        if (!permission.granted) {
            console.log('Notification permission not granted.');
            return null;
        }

        try {
            const projectId = Constants.easConfig?.projectId;

            if (!projectId) {
                console.warn('Project ID not found in Constants.easConfig.projectId');
            }

            const token = (await Notifications.getExpoPushTokenAsync({
                projectId,
            })).data;

            console.log('✅ Expo Push Token Generated:', token);
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
        if (Platform.OS === 'web') return;

        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data,
                    sound: options.playSound === false ? false : 'default',
                    vibrate: [0, 250, 250, 250],
                },
                trigger: null,
            });
        } catch (error) {
            console.warn('Failed to schedule notification:', error);
        }
    }
}

export const notificationService = NotificationService.getInstance();
