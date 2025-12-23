import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/config/supabase';
import { notificationPreferences, NotificationPreferences } from './notificationPreferences';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

type NewOrderCallback = (order: any) => void;

class OrderNotificationService {
    private sound: Audio.Sound | null = null;
    private subscription: any = null;
    private onNewOrderCallback: NewOrderCallback | null = null;
    private preferences: NotificationPreferences | null = null;

    /**
     * Initialize the notification service
     */
    async initialize() {
        // Load preferences
        this.preferences = await notificationPreferences.get();

        // Request push notification permissions
        if (this.preferences.pushEnabled) {
            await this.requestPushPermissions();
        }

        // Load notification sound
        await this.loadSound();
    }

    /**
     * Request push notification permissions
     */
    async requestPushPermissions() {
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.warn('Push notification permission not granted');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error requesting push permissions:', error);
            return false;
        }
    }

    /**
     * Load notification sound
     */
    async loadSound() {
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('@/assets/sounds/belli.m4a'),
                { shouldPlay: false }
            );
            this.sound = sound;
        } catch (error) {
            console.warn('Could not load notification sound:', error);
        }
    }

    /**
     * Play notification sound
     */
    async playSound() {
        try {
            const prefs = await notificationPreferences.get();

            if (!prefs.soundEnabled) {
                return;
            }

            if (this.sound) {
                await this.sound.replayAsync();
            } else {
                // Fallback to loading sound on demand
                const { sound } = await Audio.Sound.createAsync(
                    require('@/assets/sounds/belli.m4a'),
                    { shouldPlay: true }
                );
                await sound.playAsync();
            }
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }

    /**
     * Show push notification
     */
    async showPushNotification(order: any) {
        try {
            const prefs = await notificationPreferences.get();

            if (!prefs.pushEnabled) {
                return;
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🔔 New Order!',
                    body: `Table ${order.table_id || 'N/A'} - Order #${order.order_number}`,
                    data: { orderId: order.id, orderNumber: order.order_number },
                    sound: prefs.soundEnabled ? 'default' : false,
                },
                trigger: null, // Show immediately
            });
        } catch (error) {
            console.error('Error showing push notification:', error);
        }
    }

    /**
     * Start listening for new orders
     */
    async startListening(onNewOrder: NewOrderCallback) {
        this.onNewOrderCallback = onNewOrder;

        // Subscribe to new orders from Supabase
        this.subscription = supabase
            .channel('new_orders')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                },
                async (payload) => {
                    console.log('New order received:', payload.new);
                    await this.handleNewOrder(payload.new);
                }
            )
            .subscribe();

        console.log('Order notification service started');
    }

    /**
     * Handle new order notification
     */
    private async handleNewOrder(order: any) {
        const prefs = await notificationPreferences.get();

        // Show banner notification (callback to UI component)
        if (prefs.bannerEnabled && this.onNewOrderCallback) {
            this.onNewOrderCallback(order);
        }

        // Play sound
        if (prefs.soundEnabled) {
            await this.playSound();
        }

        // Show push notification
        if (prefs.pushEnabled) {
            await this.showPushNotification(order);
        }
    }

    /**
     * Stop listening for new orders
     */
    stopListening() {
        if (this.subscription) {
            supabase.removeChannel(this.subscription);
            this.subscription = null;
        }
        console.log('Order notification service stopped');
    }

    /**
     * Update preferences
     */
    async updatePreferences(preferences: NotificationPreferences) {
        this.preferences = preferences;
        await notificationPreferences.save(preferences);

        // Request permissions if push was enabled
        if (preferences.pushEnabled) {
            await this.requestPushPermissions();
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        this.stopListening();
        if (this.sound) {
            await this.sound.unloadAsync();
            this.sound = null;
        }
    }
}

// Singleton instance
export const orderNotificationService = new OrderNotificationService();
