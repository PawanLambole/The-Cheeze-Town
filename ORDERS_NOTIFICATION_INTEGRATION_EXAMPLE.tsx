/**
 * Quick Integration Example for Orders Screen
 * Copy this code to app/manager/orders.tsx
 */

import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { orderNotificationService } from '@/services/orderNotificationService';
import OrderNotificationBanner from '@/components/OrderNotificationBanner';
import { useRouter } from 'expo-router';

export default function OrdersScreen() {
    const router = useRouter();
    const [newOrder, setNewOrder] = useState(null);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Initialize notification service when component mounts
        const initNotifications = async () => {
            try {
                console.log('Initializing order notifications...');

                // Initialize the service
                await orderNotificationService.initialize();

                // Start listening for new orders
                orderNotificationService.startListening((order) => {
                    console.log('New order notification:', order);
                    setNewOrder(order);
                    setShowBanner(true);
                });

                console.log('Order notifications active!');
            } catch (error) {
                console.error('Failed to initialize notifications:', error);
            }
        };

        initNotifications();

        // Cleanup when component unmounts
        return () => {
            console.log('Stopping order notifications...');
            orderNotificationService.stopListening();
        };
    }, []);

    const handleBannerDismiss = () => {
        setShowBanner(false);
        setNewOrder(null);
    };

    const handleBannerTap = () => {
        // Optional: Navigate to specific order or refresh orders
        console.log('Banner tapped for order:', newOrder);
        setShowBanner(false);

        // Example: Navigate to order details
        // if (newOrder?.id) {
        //   router.push(`/manager/order/${newOrder.id}`);
        // }
    };

    return (
        <View style={{ flex: 1 }}>
            {/* 
        Your existing orders screen content goes here
        All your current code stays the same
      */}

            {/* Add this notification banner at the end, before closing tags */}
            <OrderNotificationBanner
                visible={showBanner}
                order={newOrder}
                onDismiss={handleBannerDismiss}
                onTap={handleBannerTap}
            />
        </View>
    );
}
